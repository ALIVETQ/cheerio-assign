/**
 * Shared Gemini SDK helper for serverless handlers only.
 * Never import from browser code.
 */

import { GoogleGenAI } from '@google/genai';

export type GeminiErrorCause =
  | 'timeout'
  | 'rate_limit'
  | 'invalid_json'
  | 'unknown_id'
  | 'error';

export interface GeminiCallError {
  cause: GeminiErrorCause;
  retry?: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    ),
  ]);
}

export async function callGeminiGenerate(params: {
  contents: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
}): Promise<{ text: string } | { error: GeminiCallError }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: { cause: 'error' } };

  const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });

  async function attempt(): Promise<{ text: string } | { error: GeminiCallError }> {
    let response;
    try {
      response = await withTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: params.responseSchema,
          },
        }),
        6000
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'TIMEOUT') return { error: { cause: 'timeout' } };
      const statusMatch = msg.match(/(\d{3})/);
      const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;
      if (status === 429) return { error: { cause: 'rate_limit' } };
      if (status >= 500) return { error: { cause: 'error', retry: true } };
      return { error: { cause: 'error' } };
    }

    const text = response.text;
    if (!text) return { error: { cause: 'invalid_json' } };
    return { text };
  }

  const first = await attempt();
  if (!('error' in first)) return first;
  if (first.error.retry) {
    const second = await attempt();
    if ('error' in second) return { error: { cause: second.error.cause } };
    return second;
  }
  return { error: { cause: first.error.cause } };
}

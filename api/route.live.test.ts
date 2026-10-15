/**
 * Live smoke test — skipped by default. Run with: npm run test:live
 * Never logs the API key.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { GoogleGenAI } from '@google/genai';

function loadEnvLocal(): boolean {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return false;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim();
    if (!process.env[key]) process.env[key] = value;
  }
  return true;
}

function redact(text: string): string {
  const key = process.env.GEMINI_API_KEY ?? '';
  let out = text;
  if (key.length >= 8) out = out.split(key).join('[REDACTED]');
  out = out.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]');
  out = out.replace(/AQ[0-9A-Za-z_-]{20,}/g, '[REDACTED]');
  return out;
}

function extractStatus(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    for (const k of ['status', 'statusCode', 'httpStatusCode', 'code']) {
      if (typeof e[k] === 'number' || typeof e[k] === 'string') return String(e[k]);
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.match(/\b([45]\d{2})\b/);
  return m ? m[1] : 'none';
}

const loadedEnvLocal = loadEnvLocal();

const RUN_LIVE =
  process.env.RUN_LIVE_TESTS === '1' ||
  process.env.npm_lifecycle_event === 'test:live';

describe.skipIf(!RUN_LIVE)('LIVE /api/route smoke test', () => {
  it('prints env diagnostics and one Gemini call result', async () => {
    const key = process.env.GEMINI_API_KEY ?? '';
    const model = process.env.GEMINI_MODEL ?? '';

    const out = (line: string) => process.stdout.write(`${line}\n`);
    out(`loadedEnvLocal: ${loadedEnvLocal}`);
    out(`GEMINI_API_KEY defined: ${Boolean(key)}`);
    out(`GEMINI_MODEL defined: ${Boolean(model)}`);
    out(`model name: ${model || '(unset)'}`);
    out(`key starts with AIza: ${key.startsWith('AIza')}`);

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({
        model: model || 'gemini-2.0-flash',
        contents: '<user_message>\nI don\'t know how to set up my first WhatsApp campaign\n</user_message>',
      });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      out(`HTTP status: ${extractStatus(err)}`);
      out(`error: ${redact(raw).slice(0, 200)}`);
    }
  }, 15000);
});

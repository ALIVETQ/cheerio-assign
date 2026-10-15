/**
 * POST /api/summarize
 * Never returns 500 for Gemini failures — always falls back to the template.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiGenerate } from './_lib/geminiClient';
import {
  buildTemplateSummary,
  type TicketReason,
  type TranscriptLine,
  type HandoffWorkflowSnap,
  type HandoffSummary,
} from '../src/lib/handoffSummary';

const MAX_LINES = 40;
const MAX_TEXT = 500;

const SUMMARIZE_PROMPT = `You write handoff notes for a human support agent at Cheerio AI.
Input: a chat transcript, the workflow the user was in (with progress), and basic account info.
Output JSON: problem (one sentence), stepsTried (short list), blocker (where they got stuck, or null), suggestedNextAction (one sentence).
Be factual. Use only what is in the input. Do not invent details. Keep each field short.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    problem: { type: 'string' },
    stepsTried: { type: 'array', items: { type: 'string' } },
    blocker: { type: 'string', nullable: true },
    suggestedNextAction: { type: 'string' },
  },
  required: ['problem', 'stepsTried', 'blocker', 'suggestedNextAction'],
};

function capTranscript(raw: unknown): TranscriptLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-MAX_LINES).map((line) => {
    const l = line as TranscriptLine;
    const text = typeof l.text === 'string' ? l.text.trim().slice(0, MAX_TEXT) : undefined;
    return {
      role: typeof l.role === 'string' ? l.role : 'user',
      text,
      ts: typeof l.ts === 'string' ? l.ts : undefined,
    };
  });
}

function asReason(raw: unknown): TicketReason {
  if (raw === 'no_match' || raw === 'ai_unavailable' || raw === 'user_requested') return raw;
  return 'user_requested';
}

function asWorkflow(raw: unknown): HandoffWorkflowSnap | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Record<string, unknown>;
  if (typeof w.id !== 'string' || !w.id) return null;
  return {
    id: w.id,
    stepIndex: typeof w.stepIndex === 'number' ? w.stepIndex : 0,
    totalSteps: typeof w.totalSteps === 'number' ? w.totalSteps : 0,
    title: typeof w.title === 'string' ? w.title : undefined,
  };
}

function template(
  transcript: TranscriptLine[],
  workflow: HandoffWorkflowSnap | null,
  reason: TicketReason
): HandoffSummary {
  return buildTemplateSummary({ transcript, workflow, reason });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as {
    transcript?: unknown;
    workflow?: unknown;
    customer?: unknown;
    reason?: unknown;
  };

  const transcript = capTranscript(body.transcript);
  const workflow = asWorkflow(body.workflow);
  const reason = asReason(body.reason);
  const fallback = () => template(transcript, workflow, reason);

  const payload = JSON.stringify({
    transcript,
    workflow,
    customer: body.customer ?? null,
    reason,
  }).slice(0, 4000);

  const gen = await callGeminiGenerate({
    contents: `<handoff_input>\n${payload}\n</handoff_input>`,
    systemInstruction: SUMMARIZE_PROMPT,
    responseSchema: RESPONSE_SCHEMA,
  });

  if ('error' in gen) {
    return res.status(200).json(fallback());
  }

  try {
    const parsed = JSON.parse(gen.text) as {
      problem: unknown;
      stepsTried: unknown;
      blocker: unknown;
      suggestedNextAction: unknown;
    };
    if (
      typeof parsed.problem !== 'string' ||
      !Array.isArray(parsed.stepsTried) ||
      parsed.stepsTried.some((s) => typeof s !== 'string') ||
      typeof parsed.suggestedNextAction !== 'string' ||
      !(parsed.blocker === null || typeof parsed.blocker === 'string')
    ) {
      return res.status(200).json(fallback());
    }
    return res.status(200).json({
      problem: parsed.problem,
      stepsTried: parsed.stepsTried,
      blocker: parsed.blocker,
      suggestedNextAction: parsed.suggestedNextAction,
      source: 'gemini',
    });
  } catch {
    return res.status(200).json(fallback());
  }
}

/**
 * POST /api/route
 *
 * Contract (section 6.3):
 * Request:  { message: string, context?: { route: string, completedWorkflows: string[] } }
 * Response: { workflowId: string|null, confidence: number, reason: string,
 *             source: "gemini"|"fallback", fallbackCause: string|null }
 *
 * Never returns 500 for Gemini failures — always falls back gracefully.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiRouter } from './_lib/gemini.js';
import { fallbackMatch } from './_lib/fallbackMatcher.js';

const MAX_MESSAGE_LENGTH = 500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Parse and validate input ──────────────────────────────────────────────
  const body = req.body as { message?: unknown; context?: unknown } | null;
  if (!body || typeof body.message !== 'string') {
    return res.status(400).json({ error: 'message is required and must be a string' });
  }

  const rawMessage = body.message.trim();
  if (!rawMessage) {
    return res.status(400).json({ error: 'message must not be empty' });
  }

  // Trim to cap — we accept but truncate messages over 500 chars
  const message = rawMessage.slice(0, MAX_MESSAGE_LENGTH);

  // ── Try Gemini ────────────────────────────────────────────────────────────
  const geminiResult = await callGeminiRouter(message);

  if (!('error' in geminiResult)) {
    // Gemini succeeded — but confidence below 0.6 → return null
    const workflowId = geminiResult.confidence >= 0.6 ? geminiResult.workflowId : null;
    return res.status(200).json({
      workflowId,
      confidence: geminiResult.confidence,
      reason: geminiResult.reason,
      source: 'gemini',
      fallbackCause: null,
    });
  }

  // ── Gemini failed — run fallback ──────────────────────────────────────────
  const fallbackCause = geminiResult.error.cause;
  const fallback = fallbackMatch(message);

  // Greetings get special handling: return as if it's a successful match
  if (fallback?.workflowId === 'greeting') {
    return res.status(200).json({
      workflowId: null,
      confidence: 1,
      reason: fallback.reason,
      source: 'fallback',
      fallbackCause: null,
    });
  }

  return res.status(200).json({
    workflowId: fallback?.workflowId ?? null,
    confidence: fallback?.confidence ?? 0,
    reason: fallback?.reason ?? "I couldn't find a workflow that matches your question.",
    source: 'fallback',
    fallbackCause,
  });
}

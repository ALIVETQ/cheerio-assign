/**
 * Server-side keyword fallback matcher.
 * Used when Gemini fails (timeout, 429, bad JSON, unknown ID).
 * Also runs if /api is unreachable on the client side.
 *
 * Returns the best-matching workflow or null if confidence is below threshold.
 */

import { WORKFLOW_LIBRARY } from './workflows';

export interface FallbackResult {
  workflowId: string;
  confidence: number;
  reason: string;
}

// ─── Deny-list ────────────────────────────────────────────────────────────────
// These topics must never be matched — always return null (human route).
// Use word-boundary matching so "ban" blocks "ban/banned" but not "banana/banaye".

const DENY_PATTERNS = [
  /\brefund\b/,
  /\bbilling\b/,
  /\binvoice\b/,
  /\bcharg(e|ed|es)\b/,
  /\bpayment\b/,
  /\bban(ned)?\b/,   // "ban" or "banned" as a whole word, not banaye/banana/banao
  /\bblock(ed)?\b/,  // "block" or "blocked"
  /\bsuspend(ed)?\b/,
  /\blegal\b/,
  /\blawsuit\b/,
  /\bcourt\b/,
  /\bhack(ed)?\b/,
  /\bpassword\b/,
];

// ─── Keyword normalisation ────────────────────────────────────────────────────

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Weighted keyword map ─────────────────────────────────────────────────────
// Extra keywords not in the JSON (Hinglish / common misspellings).
// Weights: 2 = strong signal, 1 = weak.

interface KeywordEntry {
  term: string;
  workflowId: string;
  weight: number;
}

const EXTRA_KEYWORDS: KeywordEntry[] = [
  // wf-first-campaign
  { term: 'campaign kaise banaye', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'campaign banaye', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'campaign banana hai', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'message bhejna', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'pehla campaign', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'bulk send', workflowId: 'wf-first-campaign', weight: 1 },
  { term: 'broadcast karna', workflowId: 'wf-first-campaign', weight: 2 },

  // wf-template-rejected
  { term: 'template reject ho gaya', workflowId: 'wf-template-rejected', weight: 2 },
  { term: 'template rejected', workflowId: 'wf-template-rejected', weight: 2 },
  { term: 'template approved nahi', workflowId: 'wf-template-rejected', weight: 2 },
  { term: 'template fix karna', workflowId: 'wf-template-rejected', weight: 2 },

  // wf-connect-whatsapp
  { term: 'whatsapp connect nahi ho raha', workflowId: 'wf-connect-whatsapp', weight: 2 },
  { term: 'whatsapp jodna', workflowId: 'wf-connect-whatsapp', weight: 2 },
  { term: 'whatsapp link', workflowId: 'wf-connect-whatsapp', weight: 1 },
  { term: 'connect whatsapp', workflowId: 'wf-connect-whatsapp', weight: 2 },

  // wf-create-template
  { term: 'template banana', workflowId: 'wf-create-template', weight: 2 },
  { term: 'naya template', workflowId: 'wf-create-template', weight: 2 },
  { term: 'new template', workflowId: 'wf-create-template', weight: 1 },

  // wf-chatbot-flow
  { term: 'bot banana', workflowId: 'wf-chatbot-flow', weight: 2 },
  { term: 'chatbot banao', workflowId: 'wf-chatbot-flow', weight: 2 },
  { term: 'auto reply', workflowId: 'wf-chatbot-flow', weight: 1 },
  { term: 'chatbot set up', workflowId: 'wf-chatbot-flow', weight: 2 },

  // wf-connect-shopify
  { term: 'shopify connect karo', workflowId: 'wf-connect-shopify', weight: 2 },
  { term: 'shopify integrate', workflowId: 'wf-connect-shopify', weight: 2 },
  { term: 'store connect', workflowId: 'wf-connect-shopify', weight: 1 },
];

// ─── Confidence threshold ─────────────────────────────────────────────────────
// We use an absolute minimum score rather than a ratio, because the denominator
// (max possible score) is large and single-keyword matches would fall below any
// meaningful ratio threshold.

const MIN_SCORE = 1;  // at least 1 weighted keyword must match

// ─── Main matcher ─────────────────────────────────────────────────────────────

export function fallbackMatch(rawMessage: string): FallbackResult | null {
  const msg = normalise(rawMessage);

  // Deny-list check — any deny pattern present → refuse
  for (const pattern of DENY_PATTERNS) {
    if (pattern.test(msg)) return null;
  }

  // Score each workflow
  const scores = new Map<string, number>();

  // ── From JSON keywords (weight 1 each) ──
  for (const wf of WORKFLOW_LIBRARY) {
    let score = 0;
    for (const kw of wf.keywords) {
      const norm = normalise(kw);
      if (msg.includes(norm)) score += 1;
    }
    for (const phrase of wf.examplePhrases) {
      const norm = normalise(phrase);
      if (msg.includes(norm)) score += 2;
    }
    scores.set(wf.id, (scores.get(wf.id) ?? 0) + score);
  }

  // ── Extra Hinglish/weighted keywords ──
  for (const entry of EXTRA_KEYWORDS) {
    const norm = normalise(entry.term);
    if (msg.includes(norm)) {
      scores.set(entry.workflowId, (scores.get(entry.workflowId) ?? 0) + entry.weight);
    }
  }

  // ── Find best match ──
  let bestId: string | null = null;
  let bestScore = 0;

  for (const [id, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  if (!bestId || bestScore === 0) return null;

  // Require at least MIN_SCORE matches to avoid noise
  if (bestScore < MIN_SCORE) return null;

  // Normalise to [0.3, 0.85] — fallback is never overconfident
  const rawConf = Math.min(bestScore / 5, 1); // 5 matches = max confidence
  const confidence = Math.min(0.85, Math.max(0.3, rawConf));

  const wf = WORKFLOW_LIBRARY.find((w) => w.id === bestId)!;
  return {
    workflowId: bestId,
    confidence,
    reason: `Matched by keywords to "${wf.title}".`,
  };
}

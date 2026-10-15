/**
 * Shared keyword fallback matcher (server + browser).
 * One source of truth — do not duplicate this logic.
 */

import { WORKFLOW_LIBRARY } from '../../api/_lib/workflows.js';

export interface FallbackResult {
  workflowId: string;
  confidence: number;
  reason: string;
}

// Greetings that get a friendly local reply without Gemini
const GREETING_PATTERNS = [
  /^hi\b/i,
  /^hy\b/i,
  /^hello\b/i,
  /^hey\b/i,
  /^namaste\b/i,
  /^hola\b/i,
  /^sup\b/i,
];

const GREETING_REPLY = "Hi! Tell me what you'd like to do in Cheerio, for example: set up my first WhatsApp campaign";

const DENY_PATTERNS = [
  /\brefund\b/,
  /\bbilling\b/,
  /\binvoice\b/,
  /\bcharg(e|ed|es)\b/,
  /\bpayment\b/,
  /\bban(ned)?\b/,
  /\bblock(ed)?\b/,
  /\bsuspend(ed)?\b/,
  /\blegal\b/,
  /\blawsuit\b/,
  /\bcourt\b/,
  /\bhack(ed)?\b/,
  /\bpassword\b/,
];

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface KeywordEntry {
  term: string;
  workflowId: string;
  weight: number;
}

const EXTRA_KEYWORDS: KeywordEntry[] = [
  { term: 'campaign kaise banaye', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'campaign banaye', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'campaign banana hai', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'message bhejna', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'pehla campaign', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'bulk send', workflowId: 'wf-first-campaign', weight: 1 },
  { term: 'broadcast karna', workflowId: 'wf-first-campaign', weight: 2 },
  { term: 'template reject ho gaya', workflowId: 'wf-template-rejected', weight: 2 },
  { term: 'template rejected', workflowId: 'wf-template-rejected', weight: 2 },
  { term: 'template approved nahi', workflowId: 'wf-template-rejected', weight: 2 },
  { term: 'template fix karna', workflowId: 'wf-template-rejected', weight: 2 },
  { term: 'whatsapp connect nahi ho raha', workflowId: 'wf-connect-whatsapp', weight: 2 },
  { term: 'whatsapp jodna', workflowId: 'wf-connect-whatsapp', weight: 2 },
  { term: 'whatsapp link', workflowId: 'wf-connect-whatsapp', weight: 1 },
  { term: 'connect whatsapp', workflowId: 'wf-connect-whatsapp', weight: 2 },
  { term: 'template banana', workflowId: 'wf-create-template', weight: 2 },
  { term: 'naya template', workflowId: 'wf-create-template', weight: 2 },
  { term: 'new template', workflowId: 'wf-create-template', weight: 1 },
  { term: 'bot banana', workflowId: 'wf-chatbot-flow', weight: 2 },
  { term: 'chatbot banao', workflowId: 'wf-chatbot-flow', weight: 2 },
  { term: 'auto reply', workflowId: 'wf-chatbot-flow', weight: 1 },
  { term: 'chatbot set up', workflowId: 'wf-chatbot-flow', weight: 2 },
  { term: 'shopify connect karo', workflowId: 'wf-connect-shopify', weight: 2 },
  { term: 'shopify integrate', workflowId: 'wf-connect-shopify', weight: 2 },
  { term: 'store connect', workflowId: 'wf-connect-shopify', weight: 1 },
  { term: 'add contacts', workflowId: 'wf-add-contacts', weight: 2 },
  { term: 'upload csv', workflowId: 'wf-add-contacts', weight: 2 },
  { term: 'contacts add karo', workflowId: 'wf-add-contacts', weight: 2 },
  { term: 'csv upload', workflowId: 'wf-add-contacts', weight: 2 },
];

const MIN_SCORE = 1;

export function fallbackMatch(rawMessage: string): FallbackResult | null {
  const msg = normalise(rawMessage);

  // Check for greetings first
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(rawMessage.trim())) {
      return {
        workflowId: 'greeting',
        confidence: 1,
        reason: GREETING_REPLY,
      };
    }
  }

  for (const pattern of DENY_PATTERNS) {
    if (pattern.test(msg)) return null;
  }

  const scores = new Map<string, number>();

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

  for (const entry of EXTRA_KEYWORDS) {
    const norm = normalise(entry.term);
    if (msg.includes(norm)) {
      scores.set(entry.workflowId, (scores.get(entry.workflowId) ?? 0) + entry.weight);
    }
  }

  let bestId: string | null = null;
  let bestScore = 0;

  for (const [id, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  if (!bestId || bestScore < MIN_SCORE) return null;

  const rawConf = Math.min(bestScore / 5, 1);
  const confidence = Math.min(0.85, Math.max(0.6, rawConf));

  const wf = WORKFLOW_LIBRARY.find((w) => w.id === bestId)!;
  return {
    workflowId: bestId,
    confidence,
    reason: `Matched by keywords to "${wf.title}".`,
  };
}

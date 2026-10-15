import { getWorkflow } from '../workflows/loader.js';
import '../workflows/index.js';

export type TicketReason = 'user_requested' | 'no_match' | 'ai_unavailable';

export interface TranscriptLine {
  role: string;
  text?: string;
  ts?: string;
}

export interface HandoffWorkflowSnap {
  id: string;
  stepIndex: number;
  totalSteps: number;
  title?: string;
}

export interface HandoffSummary {
  problem: string;
  stepsTried: string[];
  blocker: string | null;
  suggestedNextAction: string;
  source: 'gemini' | 'fallback';
}

export const NEXT_ACTION: Record<TicketReason, string> = {
  user_requested:
    'Call the customer and continue from the last step they completed.',
  no_match:
    'Ask the customer to describe the goal in more detail, then pick a matching guide or handle it manually.',
  ai_unavailable:
    'Backup mode could not match a guide — confirm the customer goal and continue from the blocker.',
};

export function resolveHandoffReason(
  trigger: 'footer' | 'no_match',
  lastNoMatchSource?: 'gemini' | 'fallback' | null
): TicketReason {
  if (trigger === 'footer') return 'user_requested';
  if (lastNoMatchSource === 'fallback') return 'ai_unavailable';
  return 'no_match';
}

export function buildTemplateSummary(input: {
  transcript: TranscriptLine[];
  workflow: HandoffWorkflowSnap | null;
  reason: TicketReason;
}): HandoffSummary {
  const firstUser = input.transcript.find((l) => l.role === 'user' && l.text?.trim());
  const wf = input.workflow ? getWorkflow(input.workflow.id) : undefined;
  const workflowTitle = wf?.title ?? input.workflow?.title ?? null;

  const problem = firstUser?.text?.trim()
    || workflowTitle
    || 'The customer asked for help.';

  let stepsTried: string[] = [];
  let blocker: string | null = 'No matching help topic found';

  if (input.workflow && wf) {
    const idx = input.workflow.stepIndex;
    stepsTried = wf.steps.slice(0, Math.max(0, idx)).map((s: { title: string }) => s.title);
    blocker = wf.steps[idx]?.title ?? workflowTitle;
  } else if (workflowTitle) {
    blocker = workflowTitle;
  }

  return {
    problem,
    stepsTried,
    blocker,
    suggestedNextAction: NEXT_ACTION[input.reason],
    source: 'fallback',
  };
}

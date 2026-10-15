import { describe, it, expect } from 'vitest';
import { buildTemplateSummary, resolveHandoffReason } from './handoffSummary';
import '../workflows/index';

describe('Test 2 – template summary names workflow, completed steps, current step', () => {
  it('uses first user message, completed step titles, and current step as blocker', () => {
    const s = buildTemplateSummary({
      transcript: [{ role: 'user', text: 'I need a WhatsApp campaign' }],
      workflow: { id: 'wf-first-campaign', stepIndex: 3, totalSteps: 10 },
      reason: 'user_requested',
    });
    expect(s.problem).toBe('I need a WhatsApp campaign');
    expect(s.stepsTried).toEqual([
      'Check WhatsApp is connected',
      'Confirm WhatsApp is ready',
      'Check your audience',
    ]);
    expect(s.blocker).toBe('Audience confirmed');
    expect(s.source).toBe('fallback');
  });

  it('without a workflow, blocker is no matching help topic', () => {
    const s = buildTemplateSummary({
      transcript: [],
      workflow: null,
      reason: 'no_match',
    });
    expect(s.blocker).toBe('No matching help topic found');
    expect(s.problem).toMatch(/help|campaign/i);
  });
});

describe('resolveHandoffReason', () => {
  it('footer → user_requested; no-match gemini → no_match; no-match fallback → ai_unavailable', () => {
    expect(resolveHandoffReason('footer')).toBe('user_requested');
    expect(resolveHandoffReason('no_match', 'gemini')).toBe('no_match');
    expect(resolveHandoffReason('no_match', 'fallback')).toBe('ai_unavailable');
  });
});

/**
 * Phase 5 Test 1 — /api/summarize Gemini mocked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockGenerateContent } = vi.hoisted(() => ({ mockGenerateContent: vi.fn() }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

import handler from './summarize';

function mkReq(body: unknown) {
  return { method: 'POST', body } as any;
}
function mkRes() {
  const r: any = { _s: 200, _b: undefined };
  r.status = vi.fn((c: number) => { r._s = c; return r; });
  r.json = vi.fn((d: unknown) => { r._b = d; return r; });
  return r;
}

const BODY = {
  transcript: [{ role: 'user', text: 'How do I set up a campaign?' }],
  workflow: { id: 'wf-first-campaign', stepIndex: 3, totalSteps: 10 },
  reason: 'user_requested',
};

beforeEach(() => { process.env.GEMINI_API_KEY = 'test-key'; });
afterEach(() => { delete process.env.GEMINI_API_KEY; vi.clearAllMocks(); });

describe('Test 1 – /api/summarize', () => {
  it('valid Gemini JSON → source gemini', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        problem: 'Set up a campaign',
        stepsTried: ['A', 'B'],
        blocker: 'C',
        suggestedNextAction: 'Call them',
      }),
    });
    const r = mkRes();
    await handler(mkReq(BODY), r);
    expect(r._s).toBe(200);
    expect(r._b.source).toBe('gemini');
    expect(r._b.problem).toBe('Set up a campaign');
  });

  it('invalid JSON → template summary, source fallback', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'not json' });
    const r = mkRes();
    await handler(mkReq(BODY), r);
    expect(r._b.source).toBe('fallback');
    expect(r._b.problem).toBeTruthy();
    expect(r._b.suggestedNextAction).toBeTruthy();
  });

  it('TIMEOUT → template, source fallback', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('TIMEOUT'));
    const r = mkRes();
    await handler(mkReq(BODY), r);
    expect(r._b.source).toBe('fallback');
  });

  it('429 → template, source fallback', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('429 Too Many Requests'));
    const r = mkRes();
    await handler(mkReq(BODY), r);
    expect(r._b.source).toBe('fallback');
  });
});

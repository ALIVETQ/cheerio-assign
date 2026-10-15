/**
 * Live smoke test for /api/route — skipped by default.
 * Run with: npm run test:live
 *
 * Makes ONE real Gemini call. Never logs the API key.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const RUN_LIVE =
  process.env.RUN_LIVE_TESTS === '1' ||
  process.env.npm_lifecycle_event === 'test:live';

describe.skipIf(!RUN_LIVE)('LIVE /api/route smoke test', () => {
  it('routes "I don\'t know how to set up my first WhatsApp campaign" correctly', async () => {
    const { callGeminiRouter } = await import('./_lib/gemini.js');

    const result = await callGeminiRouter(
      "I don't know how to set up my first WhatsApp campaign"
    );

    if ('error' in result) {
      throw new Error(`Live Gemini failed: ${result.error.cause}`);
    }

    console.log(result.workflowId);
    console.log(result.confidence);
    console.log(result.source);

    expect(result.source).toBe('gemini');
    expect(result.workflowId).toBe('wf-first-campaign');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  }, 15000);
});

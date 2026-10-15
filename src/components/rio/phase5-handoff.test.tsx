/**
 * Phase 5 Test 3 — correct reason for each trigger.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AccountProvider } from '../../context/AccountContext';
import { RioProvider } from '../../context/RioContext';
import RioWidget from './RioWidget';
import { clearTicketsForTests, listTickets } from '../../lib/tickets';

function mockApis(routeBody: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/summarize')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            problem: 'summarized',
            stepsTried: [],
            blocker: null,
            suggestedNextAction: 'next',
            source: 'gemini',
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => routeBody,
      };
    })
  );
}

function renderRio() {
  const user = userEvent.setup();
  render(
    <AccountProvider>
      <MemoryRouter>
        <RioProvider>
          <RioWidget />
        </RioProvider>
      </MemoryRouter>
    </AccountProvider>
  );
  return user;
}

beforeEach(() => {
  clearTicketsForTests();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  clearTicketsForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Test 3 – ticket reason for each trigger', () => {
  it('footer Talk to a human → user_requested', async () => {
    mockApis({
      workflowId: 'wf-first-campaign',
      confidence: 0.9,
      reason: 'ok',
      source: 'gemini',
      fallbackCause: null,
    });
    const user = renderRio();
    await user.click(screen.getByTestId('rio-fab'));
    await user.click(screen.getByTestId('rio-human-btn'));
    await waitFor(() => expect(screen.getByTestId('handoff-confirmation')).toBeInTheDocument());
    expect(listTickets()[0].reason).toBe('user_requested');
  });

  it('no-match Talk to a human after Gemini miss → no_match', async () => {
    mockApis({
      workflowId: null,
      confidence: 0,
      reason: 'none',
      source: 'gemini',
      fallbackCause: null,
    });
    const user = renderRio();
    await user.click(screen.getByTestId('rio-fab'));
    await user.type(screen.getByTestId('rio-input'), 'I want a refund please');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByTestId('rio-no-match-human-btn')).toBeInTheDocument());
    await user.click(screen.getByTestId('rio-no-match-human-btn'));
    await waitFor(() => expect(screen.getByTestId('handoff-confirmation')).toBeInTheDocument());
    expect(listTickets()[0].reason).toBe('no_match');
  });

  it('no-match after fallback miss → ai_unavailable', async () => {
    mockApis({
      workflowId: null,
      confidence: 0,
      reason: 'none',
      source: 'fallback',
      fallbackCause: 'timeout',
    });
    const user = renderRio();
    await user.click(screen.getByTestId('rio-fab'));
    await user.type(screen.getByTestId('rio-input'), 'asdfghjkl qwerty');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByTestId('rio-no-match-human-btn')).toBeInTheDocument());
    await user.click(screen.getByTestId('rio-no-match-human-btn'));
    await waitFor(() => expect(screen.getByTestId('handoff-confirmation')).toBeInTheDocument());
    expect(listTickets()[0].reason).toBe('ai_unavailable');
  });
});

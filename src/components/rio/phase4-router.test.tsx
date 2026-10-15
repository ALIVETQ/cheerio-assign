/**
 * Phase 4B tests 10–13 — Gemini always mocked via fetch.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AccountProvider } from '../../context/AccountContext';
import { RioProvider } from '../../context/RioContext';
import RioWidget from './RioWidget';

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }))
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

async function openAndSend(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByTestId('rio-fab'));
  await waitFor(() => expect(screen.getByTestId('rio-panel')).toBeInTheDocument());
  await user.type(screen.getByTestId('rio-input'), text);
  await user.keyboard('{Enter}');
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Test 10 – client throttle blocks rapid sends', () => {
  it('blocks a second send within 2 seconds and shows a friendly message', async () => {
    mockFetch({
      workflowId: 'wf-first-campaign',
      confidence: 0.9,
      reason: 'campaign',
      source: 'gemini',
      fallbackCause: null,
    });
    const user = renderRio();
    await openAndSend(user, 'set up a campaign');
    await waitFor(() => expect(screen.getByTestId('workflow-offer-card')).toBeInTheDocument());

    await user.type(screen.getByTestId('rio-input'), 'another question');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/wait a moment/i)).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('Test 11 – fallback badge vs Gemini', () => {
  it('shows FallbackBadge with backup-mode tooltip on fallback responses', async () => {
    mockFetch({
      workflowId: 'wf-first-campaign',
      confidence: 0.8,
      reason: 'keyword match',
      source: 'fallback',
      fallbackCause: 'timeout',
    });
    const user = renderRio();
    await openAndSend(user, 'set up a campaign');
    await waitFor(() => expect(screen.getByTestId('fallback-badge')).toBeInTheDocument());
    expect(screen.getByTestId('fallback-badge').getAttribute('title')).toMatch(
      /Answered by backup mode \(AI unavailable:/
    );
    expect(console.warn).toHaveBeenCalledWith('[Rio fallback]', 'timeout');
  });

  it('does not show FallbackBadge on Gemini responses', async () => {
    mockFetch({
      workflowId: 'wf-first-campaign',
      confidence: 0.9,
      reason: 'campaign setup',
      source: 'gemini',
      fallbackCause: null,
    });
    const user = renderRio();
    await openAndSend(user, 'set up a campaign');
    await waitFor(() => expect(screen.getByTestId('workflow-offer-card')).toBeInTheDocument());
    expect(screen.queryByTestId('fallback-badge')).toBeNull();
  });
});

describe('Test 12 – matched offer; dashboard untouched until Start', () => {
  it('shows an offer card for the matched workflow and no spotlight before Start', async () => {
    mockFetch({
      workflowId: 'wf-first-campaign',
      confidence: 0.92,
      reason: 'You want to send a WhatsApp campaign.',
      source: 'gemini',
      fallbackCause: null,
    });
    const user = renderRio();
    await openAndSend(user, "I don't know how to set up my first WhatsApp campaign");
    await waitFor(() => expect(screen.getByTestId('workflow-offer-card')).toBeInTheDocument());
    expect(screen.getByTestId('workflow-offer-card').textContent).toMatch(/WhatsApp campaign/i);
    expect(screen.getByTestId('offer-start-btn')).toBeInTheDocument();
    expect(document.querySelector('.spotlight-overlay')).toBeNull();
    expect(document.querySelector('[data-testid="spotlight"]')).toBeNull();
    expect(document.querySelector('[data-testid="step-tooltip"]')).toBeNull();
  });
});

describe('Test 13 – no-match shows Rephrase and Talk to a human, no offer', () => {
  it('shows no-match actions and no offer card', async () => {
    mockFetch({
      workflowId: null,
      confidence: 0,
      reason: 'no match',
      source: 'gemini',
      fallbackCause: null,
    });
    const user = renderRio();
    await openAndSend(user, 'I want a refund for my plan');
    await waitFor(() => expect(screen.getByTestId('rio-no-match')).toBeInTheDocument());
    expect(screen.getByTestId('rio-rephrase-btn')).toBeInTheDocument();
    expect(screen.getByTestId('rio-human-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('workflow-offer-card')).toBeNull();
  });
});

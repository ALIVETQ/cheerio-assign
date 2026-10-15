/**
 * Phase 5 tests 4–9 — tickets + Support View
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SupportPage from './SupportPage';
import {
  clearTicketsForTests,
  createTicket,
  listTickets,
  DEMO_CUSTOMER,
} from '../lib/tickets';
import { buildTemplateSummary } from '../lib/handoffSummary';
import '../workflows/index';

function seed(overrides: Parameters<typeof createTicket>[0]) {
  return createTicket(overrides);
}

beforeEach(() => {
  clearTicketsForTests();
});
afterEach(() => {
  clearTicketsForTests();
});

describe('Test 4 – ticket includes transcript and workflow progress fields', () => {
  it('stores transcript, workflow id, step index, total steps', () => {
    const transcript = [{ role: 'user', text: 'help', ts: '2026-01-01T00:00:00.000Z' }];
    const t = seed({
      reason: 'user_requested',
      summary: buildTemplateSummary({
        transcript,
        workflow: { id: 'wf-first-campaign', stepIndex: 3, totalSteps: 10 },
        reason: 'user_requested',
      }),
      workflow: { id: 'wf-first-campaign', stepIndex: 3, totalSteps: 10, title: 'Set up your first WhatsApp campaign' },
      transcript,
    });
    expect(t.transcript[0].text).toBe('help');
    expect(t.workflow?.id).toBe('wf-first-campaign');
    expect(t.workflow?.stepIndex).toBe(3);
    expect(t.workflow?.totalSteps).toBe(10);
    expect(t.customer).toEqual(DEMO_CUSTOMER);
  });
});

describe('Test 5 – tickets persist across reload', () => {
  it('re-reading localStorage after remount still shows the ticket', async () => {
    seed({
      reason: 'user_requested',
      summary: { problem: 'Keep me', stepsTried: [], blocker: null, suggestedNextAction: 'x', source: 'fallback' },
      workflow: null,
      transcript: [{ role: 'user', text: 'Keep me' }],
    });
    const { unmount } = render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('ticket-row')).toBeInTheDocument();
    unmount();
    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Keep me|user_requested/)).toBeInTheDocument();
    expect(listTickets().length).toBe(1);
  });
});

describe('Test 6 – list newest first and empty state', () => {
  it('shows empty state when none', () => {
    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('support-empty')).toHaveTextContent('No handoffs yet');
  });

  it('renders newest first', async () => {
    const older = seed({
      reason: 'no_match',
      summary: { problem: 'old', stepsTried: [], blocker: null, suggestedNextAction: 'x', source: 'gemini' },
      workflow: null,
      transcript: [],
    });
    await new Promise((r) => setTimeout(r, 5));
    const newer = seed({
      reason: 'user_requested',
      summary: { problem: 'new', stepsTried: [], blocker: null, suggestedNextAction: 'x', source: 'gemini' },
      workflow: null,
      transcript: [],
    });
    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    );
    const rows = screen.getAllByTestId('ticket-row');
    expect(rows[0]).toHaveTextContent('user_requested');
    expect(rows[1]).toHaveTextContent('no_match');
    expect(newer.createdAt >= older.createdAt).toBe(true);
  });
});

describe('Test 7 – detail shows all fields and source badge', () => {
  it('opens detail with problem, steps, blocker, next action, badge', async () => {
    seed({
      reason: 'user_requested',
      summary: {
        problem: 'Need a campaign',
        stepsTried: ['Check WhatsApp is connected'],
        blocker: 'Audience confirmed',
        suggestedNextAction: 'Call the customer',
        source: 'gemini',
      },
      workflow: { id: 'wf-first-campaign', stepIndex: 3, totalSteps: 10 },
      transcript: [{ role: 'user', text: 'Need a campaign' }],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    );
    await user.click(screen.getByTestId('ticket-row'));
    expect(screen.getByTestId('ticket-problem')).toHaveTextContent('Need a campaign');
    expect(screen.getByTestId('ticket-steps')).toHaveTextContent('Check WhatsApp is connected');
    expect(screen.getByTestId('ticket-blocker')).toHaveTextContent('Audience confirmed');
    expect(screen.getByTestId('ticket-next')).toHaveTextContent('Call the customer');
    expect(screen.getByTestId('ticket-detail').querySelector('[data-testid="source-badge"]')?.textContent).toMatch(/gemini/);
    expect(screen.getByTestId('ticket-plan')).toHaveTextContent('Growth');
  });
});

describe('Test 8 – Mark resolved', () => {
  it('updates status to resolved', async () => {
    seed({
      reason: 'user_requested',
      summary: { problem: 'p', stepsTried: [], blocker: null, suggestedNextAction: 'x', source: 'fallback' },
      workflow: null,
      transcript: [],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    );
    await user.click(screen.getByTestId('ticket-row'));
    await user.click(screen.getByTestId('mark-resolved-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('ticket-status-detail')).toHaveTextContent('resolved');
    });
  });
});

describe('Test 9 – mid-workflow handoff shows 4 of 10', () => {
  it('displays 4 of 10 for stepIndex 3 / totalSteps 10', async () => {
    seed({
      reason: 'user_requested',
      summary: buildTemplateSummary({
        transcript: [{ role: 'user', text: 'campaign' }],
        workflow: { id: 'wf-first-campaign', stepIndex: 3, totalSteps: 10 },
        reason: 'user_requested',
      }),
      workflow: { id: 'wf-first-campaign', stepIndex: 3, totalSteps: 10 },
      transcript: [{ role: 'user', text: 'campaign' }],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    );
    await user.click(screen.getByTestId('ticket-row'));
    expect(screen.getByTestId('ticket-progress')).toHaveTextContent('4 of 10');
  });
});

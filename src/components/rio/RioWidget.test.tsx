/**
 * Phase 2 tests — Rio Widget UI
 *
 * Coverage map (ARCHITECTURE.md Phase 2 "Tests to write"):
 * Test 1  — Panel opens and closes via button and close control
 * Test 2  — Greeting appears on first open and asks user to describe their problem
 * Test 3  — No quick-start chips exist
 * Test 4  — Typing and pressing Enter adds a user message; the input clears
 * Test 5  — Empty or whitespace-only input cannot be sent
 * Test 6  — Input longer than 500 characters is blocked or trimmed with a visible hint
 * Test 7  — After a user message, a Rio offer card appears with Start and Not now
 * Test 8  — Clicking nothing leaves the dashboard unchanged (no overlay in DOM before Start)
 * Test 9  — "Not now" dismisses the offer card
 * Test 10 — "Talk to a human" is visible at all times while the panel is open
 * Test 11 — FallbackBadge renders the icon and tooltip text for a given cause
 */

import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AccountProvider } from '../../context/AccountContext';
import { RioProvider } from '../../context/RioContext';
import RioWidget from './RioWidget';
import FallbackBadge from './FallbackBadge';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        workflowId: 'wf-first-campaign',
        confidence: 0.9,
        reason: 'This looks like a campaign setup question.',
        source: 'gemini',
        fallbackCause: null,
      }),
    }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

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

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('rio-fab'));
  // Panel uses AnimatePresence — wait for it to appear in DOM
  await waitFor(() => expect(screen.getByTestId('rio-panel')).toBeInTheDocument());
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Panel opens and closes
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 1 – Panel opens and closes', () => {
  it('opens when the FAB is clicked', async () => {
    const user = renderRio();
    expect(screen.queryByTestId('rio-panel')).toBeNull();
    await openPanel(user);
    expect(screen.getByTestId('rio-panel')).toBeInTheDocument();
  });

  it('hides the FAB while the panel is open so it cannot overlap send', async () => {
    const user = renderRio();
    await openPanel(user);
    expect(screen.queryByTestId('rio-fab')).toBeNull();
    expect(screen.getByTestId('rio-send-btn')).toBeInTheDocument();
  });

  it('closes via the close button inside the panel', async () => {
    const user = renderRio();
    await openPanel(user);
    await user.click(screen.getByTestId('rio-close-btn'));
    await waitFor(() => expect(screen.queryByTestId('rio-panel')).toBeNull());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Greeting
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 2 – Greeting', () => {
  it('shows a greeting asking the user to describe their problem', async () => {
    const user = renderRio();
    await openPanel(user);
    expect(screen.getByText(/describe your problem/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: No quick-start chips
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 3 – No quick-start chips', () => {
  it('does not render any quick-start chip elements', async () => {
    const user = renderRio();
    await openPanel(user);
    expect(
      document.querySelectorAll('.rio-chip, .quick-chip, [data-testid="quick-chip"]').length
    ).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Typing + Enter sends message and clears input
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 4 – Send message on Enter', () => {
  it('adds a user bubble and clears the input after pressing Enter', async () => {
    const user = renderRio();
    await openPanel(user);
    const input = screen.getByTestId('rio-input');
    await user.type(input, 'How do I create a campaign?');
    await user.keyboard('{Enter}');
    expect(screen.getByText('How do I create a campaign?')).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Empty / whitespace cannot be sent
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 5 – Empty input cannot be sent', () => {
  it('send button is disabled when input is empty', async () => {
    const user = renderRio();
    await openPanel(user);
    expect(screen.getByTestId('rio-send-btn')).toBeDisabled();
  });

  it('send button is disabled when input is only whitespace', async () => {
    const user = renderRio();
    await openPanel(user);
    const input = screen.getByTestId('rio-input');
    await user.type(input, '   ');
    expect(screen.getByTestId('rio-send-btn')).toBeDisabled();
  });

  it('pressing Enter on empty input does not add a user bubble', async () => {
    const user = renderRio();
    await openPanel(user);
    const initialUserBubbles = screen.queryAllByTestId('user-bubble').length;
    await user.keyboard('{Enter}');
    expect(screen.queryAllByTestId('user-bubble').length).toBe(initialUserBubbles);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Input > 500 chars shows error
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 6 – Input length limit', () => {
  it('shows an error hint when the input exceeds 500 characters', async () => {
    const user = renderRio();
    await openPanel(user);
    const input = screen.getByTestId('rio-input');
    const longText = 'a'.repeat(501);
    // Use fireEvent.change to set the value directly (avoids slow character typing)
    await act(async () => {
      fireEvent.change(input, { target: { value: longText } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('input-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('input-error').textContent).toMatch(/500/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Offer card appears after a user message
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 7 – Offer card appears after user message', () => {
  it('shows a WorkflowOfferCard with Start and Not now after user sends a message', async () => {
    const user = renderRio();
    await openPanel(user);
    const input = screen.getByTestId('rio-input');
    await user.type(input, 'I want to send a WhatsApp message');
    await user.keyboard('{Enter}');

    // The scripted reply fires after 600 ms (real timers)
    await waitFor(
      () => expect(screen.getByTestId('workflow-offer-card')).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByTestId('offer-start-btn')).toBeInTheDocument();
    expect(screen.getByTestId('offer-not-now-btn')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: Dashboard unchanged before Start
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 8 – Dashboard untouched before Start', () => {
  it('no spotlight overlay exists in the DOM before Start is clicked', async () => {
    const user = renderRio();
    await openPanel(user);
    const input = screen.getByTestId('rio-input');
    await user.type(input, 'Help me set up a campaign');
    await user.keyboard('{Enter}');

    // Wait for the offer card to appear
    await waitFor(
      () => expect(screen.getByTestId('workflow-offer-card')).toBeInTheDocument(),
      { timeout: 3000 }
    );

    // Spotlight must not exist anywhere
    expect(document.querySelector('.spotlight-overlay')).toBeNull();
    expect(document.querySelector('[data-testid="spotlight"]')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 9: "Not now" dismisses the offer card
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 9 – Not now dismisses offer', () => {
  it('replaces the offer card with a dismissed message on Not now click', async () => {
    const user = renderRio();
    await openPanel(user);
    const input = screen.getByTestId('rio-input');
    await user.type(input, 'How to send broadcast?');
    await user.keyboard('{Enter}');

    await waitFor(
      () => expect(screen.getByTestId('offer-not-now-btn')).toBeInTheDocument(),
      { timeout: 3000 }
    );

    await user.click(screen.getByTestId('offer-not-now-btn'));

    expect(screen.queryByTestId('offer-start-btn')).toBeNull();
    expect(screen.queryByTestId('offer-not-now-btn')).toBeNull();
    expect(screen.getByTestId('offer-dismissed')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 10: "Talk to a human" always visible
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 10 – Talk to a human always visible', () => {
  it('shows the Talk to a human button as soon as the panel opens', async () => {
    const user = renderRio();
    await openPanel(user);
    expect(screen.getByTestId('rio-human-btn')).toBeInTheDocument();
  });

  it('Talk to a human button is still visible after sending a message and receiving a reply', async () => {
    const user = renderRio();
    await openPanel(user);
    const input = screen.getByTestId('rio-input');
    await user.type(input, 'Something');
    await user.keyboard('{Enter}');
    await waitFor(
      () => expect(screen.getByTestId('workflow-offer-card')).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByTestId('rio-human-btn')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 11: FallbackBadge renders icon and tooltip
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 11 – FallbackBadge', () => {
  it('renders the lifebuoy icon', () => {
    render(<FallbackBadge cause="timeout" />);
    const badge = screen.getByTestId('fallback-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('🛟');
  });

  it('renders the correct tooltip for "timeout" cause', () => {
    render(<FallbackBadge cause="timeout" />);
    const badge = screen.getByTestId('fallback-badge');
    expect(badge.getAttribute('title')).toContain('timeout');
    expect(badge.getAttribute('title')).toContain('backup mode');
  });

  it('renders the correct tooltip for "rate_limit" cause', () => {
    render(<FallbackBadge cause="rate_limit" />);
    const badge = screen.getByTestId('fallback-badge');
    expect(badge.getAttribute('title')).toContain('rate limit');
  });

  it('renders a fallback label when cause is undefined', () => {
    render(<FallbackBadge />);
    const badge = screen.getByTestId('fallback-badge');
    expect(badge.getAttribute('title')).toContain('AI unavailable');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6 — Keyboard tests (Escape and Enter)
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 6 – Escape closes the panel', () => {
  it('pressing Escape while the panel is open closes it', async () => {
    const user = renderRio();
    await openPanel(user);
    expect(screen.getByTestId('rio-panel')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('rio-panel')).toBeNull());
  });

  it('Escape while panel is closed has no effect', async () => {
    renderRio();
    expect(screen.queryByTestId('rio-panel')).toBeNull();
    await userEvent.setup().keyboard('{Escape}');
    expect(screen.queryByTestId('rio-panel')).toBeNull();
  });
});

describe('Phase 6 – Enter key sends message', () => {
  it('Enter on a filled input sends the message and clears the field', async () => {
    const user = renderRio();
    await openPanel(user);
    const input = screen.getByTestId('rio-input');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('');
  });
});

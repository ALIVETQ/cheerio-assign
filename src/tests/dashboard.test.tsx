import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AccountProvider } from '../context/AccountContext';
import AppRoutes from '../AppRoutes';
import Sidebar from '../components/dashboard/Sidebar';

function renderApp(route = '/') {
  return render(
    <AccountProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </AccountProvider>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AccountProvider>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </AccountProvider>
  );
}

/** Click the New campaign card button synchronously to open the modal. */
function openModal() {
  const btn = document.querySelector('[data-tour="new-campaign-btn"]') as HTMLElement;
  if (!btn) throw new Error('[data-tour="new-campaign-btn"] not found');
  fireEvent.click(btn);
  // fireEvent wraps in act — state flushes synchronously in jsdom
}

// ─── Test 1: Sidebar ────────────────────────────────────────────────────────
describe('Sidebar', () => {
  it('renders all 9 nav items', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getAllByRole('link').length).toBe(9);
  });

  it('routes change on nav click', async () => {
    renderApp('/');
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Contacts'));
    expect(screen.getByText('All Contacts (5)')).toBeInTheDocument();

    await user.click(screen.getByTitle('Workflows'));
    expect(document.querySelector('[data-tour="workflows-page"]')).toBeTruthy();
  });
});

// ─── Test 2: Home cards & credits ───────────────────────────────────────────
describe('Home cards', () => {
  it('renders three cards with correct credits 20 / 29 / 1284', () => {
    renderApp('/');
    expect(screen.getByText('Add Contacts')).toBeInTheDocument();
    expect(screen.getByText('Shoot Campaign')).toBeInTheDocument();
    expect(screen.getByText('Available credits:')).toBeInTheDocument();
    expect(screen.getByTestId('credit-email').textContent).toBe('20');
    expect(screen.getByTestId('credit-sms').textContent).toBe('29');
    expect(screen.getByTestId('credit-whatsapp').textContent).toBe('1284');
  });
});

// ─── Test 3: Accordions ─────────────────────────────────────────────────────
describe('Journey Accordions', () => {
  it('all 4 accordions expand and collapse', async () => {
    renderApp('/');
    const user = userEvent.setup();
    for (const id of ['accordion-1', 'accordion-2', 'accordion-3', 'accordion-4']) {
      const btn = screen.getByTestId(id);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      await user.click(btn);
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      await user.click(btn);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    }
  });
});

// ─── Tests 4-7: New Campaign Modal ──────────────────────────────────────────
describe('New Campaign Modal', () => {
  // Test 4: opens and closes
  it('opens from the home card button and closes on overlay click', async () => {
    renderApp('/');

    // Modal overlay is hidden initially
    const getOverlay = () => document.querySelector('.modal-overlay') as HTMLElement;
    expect(getOverlay().style.display).toBe('none');

    openModal();
    // fireEvent is sync — overlay is visible immediately
    expect(getOverlay().style.display).not.toBe('none');

    // Click overlay to close (sync)
    fireEvent.click(getOverlay());
    expect(getOverlay().style.display).toBe('none');
  });



  // Test 5: form elements present
  it('contains all required form elements', async () => {
    renderApp('/');
    // Modal is always rendered — all form elements are always in DOM
    expect(screen.getByPlaceholderText('Enter campaign name')).toBeInTheDocument();

    const labelSelect = document.querySelector('[data-tour="campaign-label"]') as HTMLSelectElement;
    expect(labelSelect).toBeTruthy();
    expect(labelSelect.tagName).toBe('SELECT');

    expect(document.querySelector('[data-tour="campaign-segment"]')).toBeTruthy();

    const modal = document.querySelector('.modal')!;
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);

    // Next button exists in the DOM (modal is aria-hidden but DOM present)
    expect(document.querySelector('[data-tour="campaign-next-btn"]')).toBeTruthy();
  });

  // Test 6: checkboxes toggle independently
  it('channel checkboxes toggle independently', async () => {
    renderApp('/');
    const user = userEvent.setup();

    const checkboxes = Array.from(
      document.querySelector('.modal')!.querySelectorAll('input[type="checkbox"]')
    ) as HTMLInputElement[];
    expect(checkboxes.length).toBe(3);

    // All start checked
    checkboxes.forEach((cb) => expect(cb.checked).toBe(true));

    await user.click(checkboxes[0]);
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);
    expect(checkboxes[2].checked).toBe(true);

    await user.click(checkboxes[1]);
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[2].checked).toBe(true);
  });

  // Test 7: credit summary shows correct values (always rendered)
  it('renders required vs available credits for all 3 channels', () => {
    renderApp('/');
    const summary = document.querySelector('[data-tour="credit-summary"]')! as HTMLElement;
    expect(summary).toBeTruthy();
    expect(within(summary).getByText('Required Email Credits')).toBeInTheDocument();
    expect(within(summary).getByText('Available Email Credits')).toBeInTheDocument();
    expect(within(summary).getByText('20')).toBeInTheDocument();
    expect(within(summary).getByText('Required SMS Credits')).toBeInTheDocument();
    expect(within(summary).getByText('Available SMS Credits')).toBeInTheDocument();
    expect(within(summary).getByText('29')).toBeInTheDocument();
    expect(within(summary).getByText('Required WhatsApp Credits')).toBeInTheDocument();
    expect(within(summary).getByText('Available WhatsApp Credits')).toBeInTheDocument();
    expect(within(summary).getByText('1284')).toBeInTheDocument();
  });
});

// ─── Test 8: Top Bar ─────────────────────────────────────────────────────────
describe('Top Bar', () => {
  it('shows Prototype badge and Support View button', () => {
    renderApp('/');
    expect(screen.getByText('Prototype')).toBeInTheDocument();
    expect(screen.getByText('Support View')).toBeInTheDocument();
  });
});

// ─── Test 9: Tour targets ─────────────────────────────────────────────────────
describe('Tour Targets', () => {
  it('every REQUIRED_TOUR_TARGET selector exists on its route (static DOM)', async () => {
    const { REQUIRED_TOUR_TARGETS } = await import('../data/tourTargets');

    // Group by route
    const byRoute = new Map<string, typeof REQUIRED_TOUR_TARGETS>();
    for (const target of REQUIRED_TOUR_TARGETS) {
      const existing = byRoute.get(target.route) || [];
      existing.push(target);
      byRoute.set(target.route, existing);
    }

    for (const [route, targets] of byRoute) {
      const { unmount } = renderApp(route);
      const user = userEvent.setup();

      // Expand accordions on home to surface accordion-body tour targets
      if (route === '/') {
        for (const id of ['accordion-1', 'accordion-2', 'accordion-3']) {
          const acc = screen.queryByTestId(id);
          if (acc) await user.click(acc);
        }
      }

      const missing: string[] = [];
      for (const target of targets) {
        if (!document.querySelector(target.selector)) {
          missing.push(`${target.selector} (${target.description})`);
        }
      }
      expect(missing, `Missing on ${route}:\n  ${missing.join('\n  ')}`).toEqual([]);
      unmount();
    }
  });
});

// ─── Test 10: All routes render ───────────────────────────────────────────────
describe('Dashboard routes', () => {
  const routes = [
    '/', '/contacts', '/campaigns', '/templates', '/workflows',
    '/channels', '/integrations', '/analytics', '/inbox', '/automation', '/email',
  ];
  for (const route of routes) {
    it(`${route} renders without crashing`, () => {
      const { unmount } = renderApp(route);
      expect(document.querySelector('.app-layout')).toBeTruthy();
      unmount();
    });
  }
});

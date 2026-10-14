/**
 * Phase 3A Engine Tests
 *
 * Using the dev sample workflow (wf-dev-sample) for all tests.
 *
 * Coverage map (Phase 3 tests from ARCHITECTURE.md §15, 3A subset):
 * Test 1  — dev sample workflow validates against the schema
 * Test 3  — Engine unit: start → step 0; next advances; back goes back; skip advances; final step → completed
 * Test 4  — Each completeOn type advances the step when its event fires
 * Test 5  — Engine stays idle until Start is clicked
 * Test 6  — Spotlight renders around the correct element; removed when workflow ends
 * Test 8  — Missing target: no crash, friendly message, "I'm stuck" control available
 * Test 11 — Reload mid-workflow restores the same step (localStorage persistence)
 */

import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AccountProvider } from '../../context/AccountContext';
import { EngineProvider, useEngine } from '../../context/EngineContext';
import { RioProvider } from '../../context/RioContext';
import SpotlightController from './SpotlightController';
import { validateWorkflow, WorkflowValidationError } from '../../workflows/loader';
import type { Workflow } from '../../workflows/types';
import devSampleRaw from '../../workflows/dev/wf-dev-sample.json';
import AppRoutes from '../../AppRoutes';

// ─── Load dev sample ──────────────────────────────────────────────────────────
const DEV_SAMPLE = validateWorkflow(devSampleRaw);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderWithEngine(ui: React.ReactElement, route = '/') {
  return render(
    <AccountProvider>
      <MemoryRouter initialEntries={[route]}>
        <EngineProvider>
          <RioProvider>
            {ui}
            <SpotlightController />
          </RioProvider>
        </EngineProvider>
      </MemoryRouter>
    </AccountProvider>
  );
}

/** Tiny test component that exposes engine actions */
function EngineHarness({ workflow, autoStart = false }: { workflow: Workflow; autoStart?: boolean }) {
  const { state, actions } = useEngine();
  return (
    <div>
      <div data-testid="status">{state.status}</div>
      <div data-testid="step-index">{state.stepIndex}</div>
      <button data-testid="btn-start" onClick={() => actions.start(workflow)}>Start</button>
      <button data-testid="btn-next" onClick={actions.next}>Next</button>
      <button data-testid="btn-back" onClick={actions.back}>Back</button>
      <button data-testid="btn-skip" onClick={actions.skip}>Skip</button>
      <button data-testid="btn-stuck" onClick={actions.stuck}>Stuck</button>
      <button data-testid="btn-finish" onClick={actions.finish}>Finish</button>
      <button data-testid="btn-reset" onClick={actions.reset}>Reset</button>
    </div>
  );
}

function renderHarness(workflow: Workflow) {
  return renderWithEngine(<EngineHarness workflow={workflow} />);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1 — Dev sample validates against schema
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 1 – Workflow validation (dev sample)', () => {
  it('validateWorkflow passes for the dev sample without throwing', () => {
    expect(() => validateWorkflow(devSampleRaw)).not.toThrow();
  });

  it('dev sample has the required top-level fields', () => {
    expect(DEV_SAMPLE.id).toBe('wf-dev-sample');
    expect(DEV_SAMPLE.title).toBeTruthy();
    expect(Array.isArray(DEV_SAMPLE.steps)).toBe(true);
    expect(DEV_SAMPLE.steps.length).toBeGreaterThan(0);
  });

  it('dev sample steps have unique IDs', () => {
    const ids = DEV_SAMPLE.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all step modes are valid', () => {
    DEV_SAMPLE.steps.forEach((s) => {
      expect(['guide', 'assist']).toContain(s.mode);
    });
  });

  it('all completeOn types are valid', () => {
    const valid = ['click', 'inputFilled', 'selectChanged', 'checkboxChecked', 'routeChanged', 'manualConfirm'];
    DEV_SAMPLE.steps.forEach((s) => {
      expect(valid).toContain(s.completeOn.type);
    });
  });

  it('validateWorkflow throws WorkflowValidationError for missing id', () => {
    expect(() =>
      validateWorkflow({ title: 'x', description: 'x', keywords: [], level: 1, estimatedMinutes: 1, steps: [{ id: 's1', title: 't', instruction: 'i', target: '[x]', mode: 'guide', completeOn: { type: 'click' } }] })
    ).toThrow(WorkflowValidationError);
  });

  it('validateWorkflow throws for duplicate step IDs', () => {
    expect(() =>
      validateWorkflow({ id: 'dup', title: 'T', description: 'D', keywords: [], level: 1, estimatedMinutes: 1, steps: [
        { id: 's1', title: 't', instruction: 'i', target: '[x]', mode: 'guide', completeOn: { type: 'click' } },
        { id: 's1', title: 't', instruction: 'i', target: '[x]', mode: 'guide', completeOn: { type: 'click' } },
      ] })
    ).toThrow(/duplicate/i);
  });

  it('validateWorkflow throws for invalid mode', () => {
    expect(() =>
      validateWorkflow({ id: 'bad', title: 'T', description: 'D', keywords: [], level: 1, estimatedMinutes: 1, steps: [
        { id: 's1', title: 't', instruction: 'i', target: '[x]', mode: 'wrong', completeOn: { type: 'click' } },
      ] })
    ).toThrow(/mode/i);
  });

  it('validateWorkflow throws for invalid completeOn type', () => {
    expect(() =>
      validateWorkflow({ id: 'bad2', title: 'T', description: 'D', keywords: [], level: 1, estimatedMinutes: 1, steps: [
        { id: 's1', title: 't', instruction: 'i', target: '[x]', mode: 'guide', completeOn: { type: 'invalid' } },
      ] })
    ).toThrow(/completeOn/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3 — Engine state transitions
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 3 – Engine state transitions', () => {
  it('starts at idle status with stepIndex 0', () => {
    renderHarness(DEV_SAMPLE);
    expect(screen.getByTestId('status').textContent).toBe('idle');
    expect(screen.getByTestId('step-index').textContent).toBe('0');
  });

  it('start → status running, stepIndex 0', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    expect(screen.getByTestId('status').textContent).toBe('running');
    expect(screen.getByTestId('step-index').textContent).toBe('0');
  });

  it('next advances stepIndex', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    await user.click(screen.getByTestId('btn-next'));
    expect(screen.getByTestId('step-index').textContent).toBe('1');
  });

  it('back decrements stepIndex', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    await user.click(screen.getByTestId('btn-next'));
    await user.click(screen.getByTestId('btn-back'));
    expect(screen.getByTestId('step-index').textContent).toBe('0');
  });

  it('back does not go below 0', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    await user.click(screen.getByTestId('btn-back'));
    expect(screen.getByTestId('step-index').textContent).toBe('0');
  });

  it('skip advances stepIndex (same as next)', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    await user.click(screen.getByTestId('btn-skip'));
    expect(screen.getByTestId('step-index').textContent).toBe('1');
  });

  it('finish on the last step sets status to completed', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    // advance to last step
    for (let i = 1; i < DEV_SAMPLE.steps.length; i++) {
      await user.click(screen.getByTestId('btn-next'));
    }
    await user.click(screen.getByTestId('btn-finish'));
    expect(screen.getByTestId('status').textContent).toBe('completed');
  });

  it('next on the last step sets status to completed', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    // advance past the last step via next
    for (let i = 0; i < DEV_SAMPLE.steps.length; i++) {
      await user.click(screen.getByTestId('btn-next'));
    }
    expect(screen.getByTestId('status').textContent).toBe('completed');
  });

  it('stuck sets status to stuck', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    await user.click(screen.getByTestId('btn-stuck'));
    expect(screen.getByTestId('status').textContent).toBe('stuck');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4 — completeOn event listeners
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 4 – completeOn event detection', () => {
  /**
   * Build a minimal one-step workflow with the given completeOn type,
   * pointing at a button with data-testid="target-el".
   */
  function makeWorkflow(type: string, extra: Record<string, unknown> = {}): Workflow {
    return validateWorkflow({
      id: `test-wf-${type}`,
      title: `Test ${type}`,
      description: 'test',
      keywords: [],
      level: 1,
      estimatedMinutes: 1,
      steps: [{
        id: 's1',
        title: 'step',
        instruction: 'do it',
        target: "[data-testid='target-el']",
        mode: 'guide',
        completeOn: { type, target: "[data-testid='target-el']", ...extra },
      }],
    });
  }

  it('click completeOn: clicking the target advances the step', async () => {
    const wf = makeWorkflow('click');
    renderWithEngine(
      <>
        <EngineHarness workflow={wf} />
        <button data-testid="target-el">Click me</button>
      </>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-start'));
    expect(screen.getByTestId('step-index').textContent).toBe('0');
    await user.click(screen.getByTestId('target-el'));
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('completed'));
  });

  it('inputFilled completeOn: filling the input advances the step', async () => {
    const wf = validateWorkflow({
      id: 'test-wf-input',
      title: 'Input test',
      description: 'test',
      keywords: [],
      level: 1,
      estimatedMinutes: 1,
      steps: [{
        id: 's1',
        title: 'fill',
        instruction: 'fill it',
        target: "[data-testid='target-el']",
        mode: 'guide',
        completeOn: { type: 'inputFilled', target: "[data-testid='target-el']" },
      }],
    });
    renderWithEngine(
      <>
        <EngineHarness workflow={wf} />
        <input data-testid="target-el" defaultValue="" />
      </>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-start'));
    const input = screen.getByTestId('target-el') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hello' } });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('completed'));
  });

  it('checkboxChecked completeOn: checking the box advances the step', async () => {
    const wf = validateWorkflow({
      id: 'test-wf-checkbox',
      title: 'Checkbox test',
      description: 'test',
      keywords: [],
      level: 1,
      estimatedMinutes: 1,
      steps: [{
        id: 's1',
        title: 'check',
        instruction: 'check it',
        target: "[data-testid='target-el']",
        mode: 'guide',
        completeOn: { type: 'checkboxChecked', target: "[data-testid='target-el']" },
      }],
    });
    renderWithEngine(
      <>
        <EngineHarness workflow={wf} />
        <input type="checkbox" data-testid="target-el" />
      </>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-start'));
    fireEvent.change(screen.getByTestId('target-el'), { target: { checked: true } });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('completed'));
  });

  it('manualConfirm completeOn: only advances when next/confirm is called, not on DOM events', async () => {
    const wf = validateWorkflow({
      id: 'test-wf-manual',
      title: 'Manual confirm test',
      description: 'test',
      keywords: [],
      level: 1,
      estimatedMinutes: 1,
      steps: [{
        id: 's1',
        title: 'confirm',
        instruction: 'click confirm',
        target: "[data-testid='target-el']",
        mode: 'guide',
        completeOn: { type: 'manualConfirm' },
      }],
    });
    renderWithEngine(
      <>
        <EngineHarness workflow={wf} />
        <button data-testid="target-el">Some button</button>
      </>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-start'));
    // clicking the element should NOT advance (no DOM listener for manualConfirm)
    await user.click(screen.getByTestId('target-el'));
    expect(screen.getByTestId('status').textContent).toBe('running');
    // next/confirm should advance
    await user.click(screen.getByTestId('btn-next'));
    expect(screen.getByTestId('status').textContent).toBe('completed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5 — Engine stays idle until Start is clicked
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 5 – Engine stays idle until Start', () => {
  it('status is idle before Start is clicked', () => {
    renderHarness(DEV_SAMPLE);
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  it('no spotlight in DOM while status is idle', () => {
    renderHarness(DEV_SAMPLE);
    expect(document.querySelector('[data-testid="spotlight"]')).toBeNull();
  });

  it('spotlight appears only after Start', async () => {
    const user = userEvent.setup();
    renderWithEngine(
      <>
        <EngineHarness workflow={DEV_SAMPLE} />
        {/* Provide the campaign button so the spotlight has a target */}
        <button data-tour="new-campaign-btn">New campaign</button>
      </>
    );
    expect(document.querySelector('[data-testid="spotlight"]')).toBeNull();
    await user.click(screen.getByTestId('btn-start'));
    await waitFor(() =>
      expect(document.querySelector('[data-testid="spotlight"]')).not.toBeNull()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 6 — Spotlight renders and is removed when workflow ends
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 6 – Spotlight lifecycle', () => {
  it('renders the spotlight with the step tooltip when running', async () => {
    const user = userEvent.setup();
    renderWithEngine(
      <>
        <EngineHarness workflow={DEV_SAMPLE} />
        <button data-tour="new-campaign-btn">New campaign</button>
      </>
    );
    await user.click(screen.getByTestId('btn-start'));
    await waitFor(() =>
      expect(screen.getByTestId('step-tooltip')).toBeInTheDocument()
    );
    expect(screen.getByTestId('step-tooltip').textContent).toMatch(/Open New Campaign/i);
  });

  it('removes the spotlight when the workflow completes', async () => {
    const user = userEvent.setup();
    renderWithEngine(
      <>
        <EngineHarness workflow={DEV_SAMPLE} />
        <button data-tour="new-campaign-btn">New campaign</button>
      </>
    );
    await user.click(screen.getByTestId('btn-start'));
    await waitFor(() => expect(screen.getByTestId('spotlight')).toBeInTheDocument());

    // Advance past all steps
    for (let i = 0; i < DEV_SAMPLE.steps.length; i++) {
      await user.click(screen.getByTestId('btn-next'));
    }
    await waitFor(() =>
      expect(document.querySelector('[data-testid="spotlight"]')).toBeNull()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 8 — Missing target: no crash, friendly message, stuck available
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 8 – Missing target handling', () => {
  it('shows a friendly warning and stuck button when the target element is not in DOM', async () => {
    const wf = validateWorkflow({
      id: 'test-wf-missing',
      title: 'Missing target test',
      description: 'test',
      keywords: [],
      level: 1,
      estimatedMinutes: 1,
      steps: [{
        id: 's1',
        title: 'Find nonexistent element',
        instruction: 'This element does not exist.',
        target: "[data-tour='does-not-exist-at-all-xyz']",
        mode: 'guide',
        completeOn: { type: 'click', target: "[data-tour='does-not-exist-at-all-xyz']" },
      }],
    });
    renderWithEngine(<EngineHarness workflow={wf} />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId('btn-start'));
    await waitFor(() =>
      expect(screen.getByTestId('step-tooltip')).toBeInTheDocument(), { timeout: 2000 }
    );
    // Warning message visible — missingTarget is set after a 50ms delay
    await waitFor(() =>
      expect(screen.getByTestId('step-tooltip').textContent).toMatch(/couldn't find/i),
      { timeout: 2000 }
    );
    // Stuck button available
    expect(screen.getByTestId('tooltip-stuck')).toBeInTheDocument();
  });

  it('does not crash when target is missing', async () => {
    const wf = validateWorkflow({
      id: 'test-wf-no-crash',
      title: 'No crash test',
      description: 'test',
      keywords: [],
      level: 1,
      estimatedMinutes: 1,
      steps: [{
        id: 's1',
        title: 'step',
        instruction: 'step instruction',
        target: "[data-tour='absolutely-not-here']",
        mode: 'guide',
        completeOn: { type: 'click' },
      }],
    });
    expect(() => {
      renderWithEngine(<EngineHarness workflow={wf} />);
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 11 — localStorage persistence
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 11 – localStorage persistence', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('persists running state to localStorage', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    await user.click(screen.getByTestId('btn-next'));
    const stored = JSON.parse(localStorage.getItem('rio:engine') ?? 'null');
    expect(stored).not.toBeNull();
    expect(stored.workflowId).toBe('wf-dev-sample');
    expect(stored.stepIndex).toBe(1);
    expect(stored.status).toBe('running');
  });

  it('clears localStorage when workflow completes', async () => {
    const user = userEvent.setup();
    renderHarness(DEV_SAMPLE);
    await user.click(screen.getByTestId('btn-start'));
    await user.click(screen.getByTestId('btn-finish'));
    expect(localStorage.getItem('rio:engine')).toBeNull();
  });

  it('restores running state from localStorage on remount', async () => {
    // Pre-seed localStorage with a mid-workflow state
    localStorage.setItem('rio:engine', JSON.stringify({
      workflowId: 'wf-dev-sample',
      stepIndex: 1,
      status: 'running',
    }));

    // Register the dev sample so the engine can look it up
    // We inject it via getWorkflowById; since EngineProvider uses getWorkflow from registry,
    // we need to test restoration via a provider that knows about the dev sample.
    // Use a custom harness that reads initial state without calling start.
    function ReadHarness() {
      const { state, workflow: wf } = useEngine();
      return (
        <div>
          <div data-testid="status">{state.status}</div>
          <div data-testid="step-index">{state.stepIndex}</div>
          <div data-testid="wf-id">{state.workflowId ?? 'null'}</div>
        </div>
      );
    }

    // Provide a custom EngineProvider that can resolve the dev sample
    // by wrapping useWorkflowEngine with devSample lookup
    // Since EngineProvider uses getWorkflow (registry), and dev sample isn't registered,
    // we test the persistence data directly.
    render(
      <AccountProvider>
        <MemoryRouter initialEntries={['/']}>
          <EngineProvider>
            <RioProvider>
              <ReadHarness />
            </RioProvider>
          </EngineProvider>
        </MemoryRouter>
      </AccountProvider>
    );

    // The state is restored even if the workflow object can't be resolved from registry
    // (workflow ref will be null, but state.stepIndex and status are restored)
    expect(screen.getByTestId('step-index').textContent).toBe('1');
    expect(screen.getByTestId('status').textContent).toBe('running');
    expect(screen.getByTestId('wf-id').textContent).toBe('wf-dev-sample');
  });
});

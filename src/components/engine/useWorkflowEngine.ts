import {
  useState, useEffect, useCallback, useRef, type RefObject,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Workflow, EngineState, EngineStatus } from '../../workflows/types';
import { INITIAL_ENGINE_STATE } from '../../workflows/types';

// ─── localStorage persistence ─────────────────────────────────────────────────

const LS_KEY = 'rio:engine';

function loadPersistedState(): EngineState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EngineState;
    if (parsed.status === 'running' || parsed.status === 'stuck') return parsed;
    return null; // completed / idle don't need restoration
  } catch {
    return null;
  }
}

function persistState(state: EngineState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* storage full — ignore */ }
}

function clearPersistedState() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EngineActions {
  start: (workflow: Workflow) => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  stuck: () => void;
  finish: () => void;
  reset: () => void;
}

export interface UseWorkflowEngineResult {
  state: EngineState;
  workflow: Workflow | null;
  actions: EngineActions;
  currentStep: ReturnType<typeof getCurrentStep>;
  targetRef: RefObject<HTMLElement | null>;
  missingTarget: boolean;
  prefillApplied: boolean;
}

function getCurrentStep(workflow: Workflow | null, stepIndex: number) {
  if (!workflow) return null;
  return workflow.steps[stepIndex] ?? null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Core workflow engine. Manages step progression, route navigation,
 * target resolution, completion events, assist-mode prefill, and
 * localStorage persistence.
 *
 * Accepts an optional `getWorkflowById` resolver so callers can inject
 * the real registry or the dev sample without coupling the hook to the
 * module-level registry.
 */
export function useWorkflowEngine(
  getWorkflowById: (id: string) => Workflow | undefined
): UseWorkflowEngineResult {
  const navigate = useNavigate();
  const location = useLocation();

  // Restore persisted state on mount
  const [state, setState] = useState<EngineState>(() => {
    const persisted = loadPersistedState();
    return persisted ?? { ...INITIAL_ENGINE_STATE };
  });

  const [workflow, setWorkflow] = useState<Workflow | null>(() => {
    const persisted = loadPersistedState();
    if (persisted?.workflowId) {
      return getWorkflowById(persisted.workflowId) ?? null;
    }
    return null;
  });

  const [missingTarget, setMissingTarget] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  // Refs for stable callbacks
  const stateRef = useRef(state);
  const workflowRef = useRef(workflow);
  stateRef.current = state;
  workflowRef.current = workflow;

  // ── Persist on every state change ─────────────────────────────────────────
  useEffect(() => {
    if (state.status === 'idle' || state.status === 'completed') {
      clearPersistedState();
    } else {
      persistState(state);
    }
  }, [state]);

  // ── Resolve target element whenever step or DOM changes ───────────────────
  const resolveTarget = useCallback(() => {
    const step = getCurrentStep(workflowRef.current, stateRef.current.stepIndex);
    if (!step || stateRef.current.status !== 'running') {
      targetRef.current = null;
      setMissingTarget(false);
      return;
    }
    const el = document.querySelector<HTMLElement>(step.target);
    if (el) {
      targetRef.current = el;
      setMissingTarget(false);
    } else {
      targetRef.current = null;
      setMissingTarget(true);
    }
  }, []);

  // Re-resolve on route changes and step changes
  useEffect(() => {
    // Small delay to let React render the new route before querying
    const id = setTimeout(resolveTarget, 50);
    return () => clearTimeout(id);
  }, [location.pathname, state.stepIndex, state.status, resolveTarget]);

  // ── Route navigation when step specifies a route ──────────────────────────
  useEffect(() => {
    const step = getCurrentStep(workflow, state.stepIndex);
    if (!step || state.status !== 'running') return;
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [state.stepIndex, state.status, workflow, navigate, location.pathname]);

  // ── Assist-mode prefill ───────────────────────────────────────────────────
  useEffect(() => {
    const step = getCurrentStep(workflow, state.stepIndex);
    if (!step || state.status !== 'running' || step.mode !== 'assist' || !step.prefill) {
      setPrefillApplied(false);
      return;
    }
    // Small delay so the element is in DOM after route navigation
    const id = setTimeout(() => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(step.prefill!.target);
      if (el && (el as HTMLInputElement).value === '') {
        // Set via native setter so React's synthetic events pick it up
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set ?? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, step.prefill!.value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          (el as HTMLInputElement).value = step.prefill!.value;
        }
        setPrefillApplied(true);
      }
    }, 80);
    return () => clearTimeout(id);
  }, [state.stepIndex, state.status, workflow]);

  // ── Completion event listeners ────────────────────────────────────────────
  useEffect(() => {
    const step = getCurrentStep(workflow, state.stepIndex);
    if (!step || state.status !== 'running') return;

    const { type, target: completionTarget } = step.completeOn;

    if (type === 'manualConfirm' || type === 'routeChanged') return; // handled elsewhere

    const selector = completionTarget ?? step.target;

    const handleEvent = () => {
      setState((prev) => {
        if (prev.status !== 'running') return prev;
        const nextIndex = prev.stepIndex + 1;
        const wf = workflowRef.current;
        if (!wf || nextIndex >= wf.steps.length) {
          return { ...prev, status: 'completed' };
        }
        return { ...prev, stepIndex: nextIndex };
      });
    };

    // Map completeOn type → DOM event
    const eventMap: Record<string, string> = {
      click: 'click',
      inputFilled: 'change',
      selectChanged: 'change',
      checkboxChecked: 'change',
    };
    const domEvent = eventMap[type];
    if (!domEvent) return;

    // For inputFilled we also need to guard against empty values
    const wrappedHandler = (e: Event) => {
      if (type === 'inputFilled') {
        const el = e.target as HTMLInputElement;
        if (!el.value.trim()) return;
      }
      handleEvent();
    };

    // Attach listener via document delegation (target may not exist yet)
    const docHandler = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el.matches(selector) || el.closest(selector)) {
        wrappedHandler(e);
      }
    };

    document.addEventListener(domEvent, docHandler, true);
    return () => document.removeEventListener(domEvent, docHandler, true);
  }, [state.stepIndex, state.status, workflow]);

  // ── routeChanged completion ───────────────────────────────────────────────
  useEffect(() => {
    const step = getCurrentStep(workflow, state.stepIndex);
    if (!step || state.status !== 'running') return;
    if (step.completeOn.type !== 'routeChanged') return;
    const targetRoute = step.completeOn.route;
    if (!targetRoute) return;
    if (location.pathname === targetRoute) {
      setState((prev) => {
        if (prev.status !== 'running') return prev;
        const nextIndex = prev.stepIndex + 1;
        const wf = workflowRef.current;
        if (!wf || nextIndex >= wf.steps.length) return { ...prev, status: 'completed' };
        return { ...prev, stepIndex: nextIndex };
      });
    }
  }, [location.pathname, state.stepIndex, state.status, workflow]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const actions: EngineActions = {
    start: useCallback((wf: Workflow) => {
      setWorkflow(wf);
      workflowRef.current = wf;
      const next: EngineState = { workflowId: wf.id, stepIndex: 0, status: 'running' };
      setState(next);
    }, []),

    next: useCallback(() => {
      setState((prev) => {
        if (prev.status !== 'running' && prev.status !== 'stuck') return prev;
        const wf = workflowRef.current;
        const nextIndex = prev.stepIndex + 1;
        if (!wf || nextIndex >= wf.steps.length) return { ...prev, status: 'completed' };
        return { ...prev, stepIndex: nextIndex, status: 'running' };
      });
    }, []),

    back: useCallback(() => {
      setState((prev) => {
        if (prev.stepIndex <= 0) return prev;
        return { ...prev, stepIndex: prev.stepIndex - 1, status: 'running' };
      });
    }, []),

    skip: useCallback(() => {
      setState((prev) => {
        const wf = workflowRef.current;
        const nextIndex = prev.stepIndex + 1;
        if (!wf || nextIndex >= wf.steps.length) return { ...prev, status: 'completed' };
        return { ...prev, stepIndex: nextIndex, status: 'running' };
      });
    }, []),

    stuck: useCallback(() => {
      setState((prev) => ({ ...prev, status: 'stuck' }));
    }, []),

    finish: useCallback(() => {
      setState((prev) => ({ ...prev, status: 'completed' }));
    }, []),

    reset: useCallback(() => {
      setWorkflow(null);
      workflowRef.current = null;
      setState({ ...INITIAL_ENGINE_STATE });
      clearPersistedState();
    }, []),
  };

  return {
    state,
    workflow,
    actions,
    currentStep: getCurrentStep(workflow, state.stepIndex),
    targetRef,
    missingTarget,
    prefillApplied,
  };
}

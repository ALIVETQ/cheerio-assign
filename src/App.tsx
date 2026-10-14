import { BrowserRouter } from 'react-router-dom';
import { AccountProvider, useAccount } from './context/AccountContext';
import { RioProvider, useRio } from './context/RioContext';
import { EngineProvider, useEngine } from './context/EngineContext';
import AppRoutes from './AppRoutes';
import RioWidget from './components/rio/RioWidget';
import SpotlightController from './components/engine/SpotlightController';
import { getWorkflow } from './workflows/loader';
import type { WorkflowOffer } from './context/RioContext';
import { useEffect, useCallback } from 'react';
import { checkPreconditions } from './workflows/preconditionHelpers';

// ─── Prereq offer builder ─────────────────────────────────────────────────────

function buildPrereqOffer(failedKey: string): WorkflowOffer | null {
  if (failedKey === 'whatsapp_connected') {
    return {
      workflowId: 'wf-connect-whatsapp',
      title: 'Connect your WhatsApp number',
      reason: "Before sending a campaign, you need to connect a WhatsApp number. Let me walk you through it.",
      estimatedMinutes: 3,
      source: 'gemini',
      fallbackCause: null,
    };
  }
  if (failedKey === 'has_approved_template') {
    return {
      workflowId: 'wf-create-template',
      title: 'Create a message template',
      reason: "You need at least one approved WhatsApp template before sending a campaign. Let me help you create one.",
      estimatedMinutes: 3,
      source: 'gemini',
      fallbackCause: null,
    };
  }
  return null;
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
// Lives inside EngineProvider + RioProvider. Safe to call both useEngine and useRio.

function AppShell() {
  const { state, workflow } = useEngine();
  const { pushRioMessage } = useRio();

  // Progress bridge: push a progress card into Rio whenever step advances
  useEffect(() => {
    if (state.status === 'running' && workflow) {
      pushRioMessage({
        role: 'rio',
        progress: {
          stepIndex: state.stepIndex,
          totalSteps: workflow.steps.length,
          workflowTitle: workflow.title,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stepIndex, state.status]);

  return (
    <>
      <AppRoutes />
      <RioWidget />
      <SpotlightController />
    </>
  );
}

// ─── InnerApp ─────────────────────────────────────────────────────────────────
// Lives inside EngineProvider and AccountProvider, but OUTSIDE RioProvider.
// Must NOT call useRio().

function InnerApp() {
  const { actions } = useEngine();
  const { account } = useAccount();

  // onStartWorkflow is called by RioProvider when the user clicks Start.
  // It may either start the engine or push a prereq message (via onPrereqFailed).
  // We use a two-callback design so the Rio side effects stay inside RioProvider.
  const handleStartWorkflow = useCallback((
    offer: WorkflowOffer,
    onPrereqFailed: (msg: { text?: string; offer?: WorkflowOffer }) => void
  ) => {
    const wf = getWorkflow(offer.workflowId);
    if (!wf) return;

    const { ok, failedKey } = checkPreconditions(wf.preconditions ?? [], account);
    if (!ok && failedKey) {
      if (failedKey === 'has_contacts') {
        onPrereqFailed({
          text: "It looks like you don't have any contacts yet. Head to the 'Build an audience' section on the Home page and upload a CSV file first. Come back and I'll guide you through the campaign!",
        });
      } else {
        const prereqOffer = buildPrereqOffer(failedKey);
        if (prereqOffer) onPrereqFailed({ offer: prereqOffer });
      }
      return;
    }

    actions.start(wf);
  }, [actions, account]);

  return (
    <RioProvider onStartWorkflow={handleStartWorkflow}>
      <AppShell />
    </RioProvider>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

function App() {
  return (
    <AccountProvider>
      <BrowserRouter>
        <EngineProvider>
          <InnerApp />
        </EngineProvider>
      </BrowserRouter>
    </AccountProvider>
  );
}

export default App;

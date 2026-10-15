import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AccountProvider, useAccount } from './context/AccountContext';
import { RioProvider, useRio } from './context/RioContext';
import { EngineProvider, useEngine } from './context/EngineContext';
import AppRoutes from './AppRoutes';
import RioWidget from './components/rio/RioWidget';
import SpotlightController from './components/engine/SpotlightController';
import { getWorkflow } from './workflows/loader';
import type { WorkflowOffer } from './context/RioContext';
import { useEffect, useCallback, useRef } from 'react';
import { checkPreconditions } from './workflows/preconditionHelpers';
import SupportPage from './pages/SupportPage';
import type { EngineHandoffBridge } from './context/RioContext';

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

// ─── Required credits for a campaign (fixed at 2 in the mock) ────────────────
const REQUIRED_WHATSAPP_CREDITS = 2;

// ─── AppShell ─────────────────────────────────────────────────────────────────

function AppShell() {
  const { state, workflow, actions } = useEngine();
  const { account } = useAccount();
  const { pushRioMessage, upsertProgressCard, collapseToCompact, openPanel, setWorkflowStepLabel } = useRio();

  // Track whether we've already blocked credits for the current run
  const creditBlockedRef = useRef(false);

  // Collapse panel when workflow starts; expand on stuck/complete
  useEffect(() => {
    if (state.status === 'running') {
      creditBlockedRef.current = false;
      collapseToCompact();
    } else if (state.status === 'stuck') {
      openPanel();
    } else if (state.status === 'completed') {
      setWorkflowStepLabel(null);
      if (workflow) {
        pushRioMessage({
          role: 'rio',
          text: `✅ Done! You've completed "${workflow.title}". What would you like to do next?`,
        });
      }
      openPanel();
    } else if (state.status === 'idle') {
      setWorkflowStepLabel(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // Credits check: when we reach the channel-selection step (s9) of wf-first-campaign,
  // check WhatsApp credits. If insufficient, block and open Rio with an explanation.
  useEffect(() => {
    if (
      state.status === 'running' &&
      workflow?.id === 'wf-first-campaign' &&
      !creditBlockedRef.current
    ) {
      const currentStep = workflow.steps[state.stepIndex];
      if (currentStep?.id === 's9') {
        const available = account.credits.whatsapp;
        if (available < REQUIRED_WHATSAPP_CREDITS) {
          creditBlockedRef.current = true;
          actions.stuck();
          pushRioMessage({
            role: 'rio',
            text: `⚠️ You need at least ${REQUIRED_WHATSAPP_CREDITS} WhatsApp credits to send this campaign, but you only have ${available}. Please top up your credits or talk to a human for help.`,
          });
          openPanel();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stepIndex, state.status]);

  // Progress bridge + step label sync
  useEffect(() => {
    if (state.status === 'running' && workflow) {
      setWorkflowStepLabel(`Step ${state.stepIndex + 1} of ${workflow.steps.length}`);
      upsertProgressCard({
        stepIndex: state.stepIndex,
        totalSteps: workflow.steps.length,
        workflowTitle: workflow.title,
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

function InnerApp() {
  const { actions, state, workflow } = useEngine();
  const { account } = useAccount();

  const engineHandoff: EngineHandoffBridge = {
    pauseIfRunning: () => {
      if (state.status === 'running') actions.stuck();
    },
    snapshot: () => {
      if (!workflow || (state.status !== 'running' && state.status !== 'stuck')) return null;
      return {
        id: workflow.id,
        title: workflow.title,
        stepIndex: state.stepIndex,
        totalSteps: workflow.steps.length,
      };
    },
  };

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
    <RioProvider onStartWorkflow={handleStartWorkflow} engineHandoff={engineHandoff}>
      <AppShell />
    </RioProvider>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

function App() {
  return (
    <AccountProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/support" element={<SupportPage />} />
          <Route
            path="/*"
            element={(
              <EngineProvider>
                <InnerApp />
              </EngineProvider>
            )}
          />
        </Routes>
      </BrowserRouter>
    </AccountProvider>
  );
}

export default App;

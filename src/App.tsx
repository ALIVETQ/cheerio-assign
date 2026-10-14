import { BrowserRouter } from 'react-router-dom';
import { AccountProvider } from './context/AccountContext';
import { RioProvider } from './context/RioContext';
import { EngineProvider, useEngine } from './context/EngineContext';
import AppRoutes from './AppRoutes';
import RioWidget from './components/rio/RioWidget';
import SpotlightController from './components/engine/SpotlightController';
import { getWorkflow } from './workflows/loader';
import type { WorkflowOffer } from './context/RioContext';
import { useRio } from './context/RioContext';
import { useEffect } from 'react';

/**
 * Bridges the engine's running state → Rio's ProgressCard message.
 * Must live inside both EngineProvider and RioProvider.
 */
function RioEngineProgressBridge() {
  const { state, workflow } = useEngine();
  const { pushRioMessage } = useRio();

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
    // Only fire when the step index changes (not on every re-render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stepIndex, state.status]);

  return null;
}

/**
 * Inner app — has access to EngineProvider so it can wire onStartWorkflow.
 */
function InnerApp() {
  const { actions } = useEngine();

  function handleStartWorkflow(offer: WorkflowOffer) {
    const wf = getWorkflow(offer.workflowId);
    if (wf) {
      actions.start(wf);
    }
    // If not found in registry (e.g. scripted offer in Phase 2 mode), silently no-op
  }

  return (
    <RioProvider onStartWorkflow={handleStartWorkflow}>
      <AppRoutes />
      <RioWidget />
      <SpotlightController />
      <RioEngineProgressBridge />
    </RioProvider>
  );
}

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

import { useEffect } from 'react';
import { useEngine } from '../../context/EngineContext';
import { useRio } from '../../context/RioContext';
import Spotlight from './Spotlight';

/**
 * Mounted once at the app root. Renders the Spotlight overlay only
 * when the engine is in 'running' or 'stuck' state.
 * Also auto-expands the Rio panel when the target is missing.
 */
export default function SpotlightController() {
  const { state, workflow, actions, currentStep, targetRef, missingTarget, prefillApplied } =
    useEngine();
  const { openPanel } = useRio();

  // If the target element can't be found, reopen Rio so the user sees help
  useEffect(() => {
    if (missingTarget && state.status === 'running') {
      openPanel();
    }
  }, [missingTarget, state.status, openPanel]);

  if ((state.status !== 'running' && state.status !== 'stuck') || !currentStep || !workflow) {
    return null;
  }

  return (
    <Spotlight
      targetRef={targetRef}
      title={currentStep.title}
      instruction={currentStep.instruction}
      stepIndex={state.stepIndex}
      totalSteps={workflow.steps.length}
      missingTarget={missingTarget}
      prefillApplied={prefillApplied}
      onNext={actions.next}
      onBack={actions.back}
      onSkip={actions.skip}
      onStuck={actions.stuck}
      onManualConfirm={actions.next}
      isManualConfirm={currentStep.completeOn.type === 'manualConfirm'}
    />
  );
}

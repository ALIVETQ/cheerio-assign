interface Cutout {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface StepTooltipProps {
  title: string;
  instruction: string;
  stepIndex: number;
  totalSteps: number;
  missingTarget: boolean;
  prefillApplied: boolean;
  cutout: Cutout | null;
  onBack?: () => void;
  onSkip: () => void;
  onStuck: () => void;
  onManualConfirm?: () => void;
}

const TOOLTIP_WIDTH = 300;
const TOOLTIP_MARGIN = 16;

/**
 * Positions itself below the cutout (or centered if no target).
 * Stays within viewport horizontally.
 */
export default function StepTooltip({
  title,
  instruction,
  stepIndex,
  totalSteps,
  missingTarget,
  prefillApplied,
  cutout,
  onBack,
  onSkip,
  onStuck,
  onManualConfirm,
}: StepTooltipProps) {
  let top = '50%';
  let left = '50%';
  let transform = 'translate(-50%, -50%)';

  if (cutout) {
    const rawTop = cutout.top + cutout.height + TOOLTIP_MARGIN;
    const rawLeft = cutout.left + cutout.width / 2 - TOOLTIP_WIDTH / 2;
    const clampedLeft = Math.max(
      TOOLTIP_MARGIN,
      Math.min(rawLeft, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN)
    );
    // If not enough space below, place above
    const below = rawTop + 200 < window.innerHeight;
    const finalTop = below
      ? rawTop
      : cutout.top - 200 - TOOLTIP_MARGIN;

    top = `${finalTop}px`;
    left = `${clampedLeft}px`;
    transform = 'none';
  }

  return (
    <div
      className="step-tooltip"
      style={{ position: 'fixed', top, left, transform, width: TOOLTIP_WIDTH, zIndex: 9999 }}
      role="dialog"
      aria-modal="false"
      aria-label={`Step ${stepIndex + 1}: ${title}`}
      data-testid="step-tooltip"
    >
      {/* Progress */}
      <div className="step-tooltip-progress">
        Step {stepIndex + 1} of {totalSteps}
      </div>

      {/* Title */}
      <h3 className="step-tooltip-title">{title}</h3>

      {/* Instruction */}
      {missingTarget ? (
        <p className="step-tooltip-instruction step-tooltip-instruction--warn">
          ⚠️ We couldn't find the right spot on the screen. You can skip this step or let us know you're stuck.
        </p>
      ) : (
        <p className="step-tooltip-instruction">{instruction}</p>
      )}

      {/* Prefill notice */}
      {prefillApplied && (
        <p className="step-tooltip-prefill">
          ✏️ I filled this in. Check it and continue.
        </p>
      )}

      {/* Actions */}
      <div className="step-tooltip-actions">
        {onBack && (
          <button className="step-tooltip-btn step-tooltip-btn--ghost" onClick={onBack} data-testid="tooltip-back">
            ← Back
          </button>
        )}
        {onManualConfirm ? (
          <button className="step-tooltip-btn step-tooltip-btn--primary" onClick={onManualConfirm} data-testid="tooltip-confirm">
            Continue ✓
          </button>
        ) : (
          <button className="step-tooltip-btn step-tooltip-btn--ghost" onClick={onSkip} data-testid="tooltip-skip">
            Skip
          </button>
        )}
        <button className="step-tooltip-btn step-tooltip-btn--stuck" onClick={onStuck} data-testid="tooltip-stuck">
          I'm stuck
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

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

const TOOLTIP_WIDTH = 320;
const VIEWPORT_MARGIN = 12;

/**
 * Positions itself near the cutout, clamped to viewport.
 * Flips above/below when it would overflow. Scrolls target into view if needed.
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    width: TOOLTIP_WIDTH,
    zIndex: 9999,
  });

  useEffect(() => {
    if (!cutout || !tooltipRef.current) {
      // Centered fallback when no target
      setStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: TOOLTIP_WIDTH,
        zIndex: 9999,
      });
      return;
    }

    const tooltipHeight = tooltipRef.current.offsetHeight || 250;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Try positioning below first
    let top = cutout.top + cutout.height + 16;
    let flipAbove = false;

    // If tooltip would overflow bottom, flip above
    if (top + tooltipHeight + VIEWPORT_MARGIN > viewportHeight) {
      const aboveTop = cutout.top - tooltipHeight - 16;
      if (aboveTop >= VIEWPORT_MARGIN) {
        top = aboveTop;
        flipAbove = true;
      }
    }

    // Clamp top to viewport
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, viewportHeight - tooltipHeight - VIEWPORT_MARGIN));

    // Center horizontally on cutout, then clamp
    let left = cutout.left + cutout.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN));

    setStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: TOOLTIP_WIDTH,
      zIndex: 9999,
    });
  }, [cutout]);

  return (
    <div
      ref={tooltipRef}
      className="step-tooltip"
      style={style}
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
          ⚠️ We couldn't find the right spot on the screen. You can retry, skip this step, or talk to a human.
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

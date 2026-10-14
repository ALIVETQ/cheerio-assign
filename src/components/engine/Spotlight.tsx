import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import StepTooltip from './StepTooltip';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SpotlightProps {
  targetRef: RefObject<HTMLElement | null>;
  title: string;
  instruction: string;
  stepIndex: number;
  totalSteps: number;
  missingTarget: boolean;
  prefillApplied: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onStuck: () => void;
  onManualConfirm?: () => void;  // for manualConfirm steps
  isManualConfirm?: boolean;
}

const PADDING = 8; // px padding around the highlighted element

export default function Spotlight({
  targetRef,
  title,
  instruction,
  stepIndex,
  totalSteps,
  missingTarget,
  prefillApplied,
  onBack,
  onSkip,
  onStuck,
  onManualConfirm,
  isManualConfirm,
}: SpotlightProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  // Measure and track the target element's position
  useEffect(() => {
    function measure() {
      const el = targetRef.current;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    // Poll while the spotlight is visible to catch layout shifts
    const id = setInterval(measure, 200);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      clearInterval(id);
    };
  }, [targetRef]);

  const cutout = rect
    ? {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  return createPortal(
    <div className="spotlight-root" data-testid="spotlight">
      {/* Dark overlay with pointer-events punched out at the cutout */}
      {cutout ? (
        <svg
          className="spotlight-overlay"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={cutout.left}
                y={cutout.top}
                width={cutout.width}
                height={cutout.height}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      ) : (
        /* No valid target: full dim */
        <div
          className="spotlight-overlay spotlight-overlay--full"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }}
          aria-hidden="true"
        />
      )}

      {/* Pulsing ring around the highlighted element */}
      {cutout && (
        <div
          className="spotlight-ring"
          style={{
            position: 'fixed',
            top: cutout.top - 4,
            left: cutout.left - 4,
            width: cutout.width + 8,
            height: cutout.height + 8,
            borderRadius: 12,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      )}

      {/* Tooltip */}
      <StepTooltip
        title={title}
        instruction={instruction}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        missingTarget={missingTarget}
        prefillApplied={prefillApplied}
        cutout={cutout}
        onBack={stepIndex > 0 ? onBack : undefined}
        onSkip={onSkip}
        onStuck={onStuck}
        onManualConfirm={isManualConfirm ? onManualConfirm : undefined}
      />
    </div>,
    document.body
  );
}

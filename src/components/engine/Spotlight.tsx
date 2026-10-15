import { useEffect, useState, useRef, type RefObject } from 'react';
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
  onStop: () => void;
}

const PADDING = 8; // px padding around the highlighted element
const MISSING_TARGET_TIMEOUT = 3000; // 3 seconds

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
  onStop,
}: SpotlightProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const missingTimeoutRef = useRef<number | undefined>();

  // Scroll target into view if off-screen
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const bounds = el.getBoundingClientRect();
    const inView = bounds.top >= 0 && bounds.bottom <= window.innerHeight &&
                   bounds.left >= 0 && bounds.right <= window.innerWidth;

    if (!inView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [targetRef]);

  // Handle missing target timeout
  useEffect(() => {
    if (missingTarget) {
      missingTimeoutRef.current = window.setTimeout(() => {
        setShowOverlay(false);
      }, MISSING_TARGET_TIMEOUT);
    } else {
      setShowOverlay(true);
      if (missingTimeoutRef.current) {
        clearTimeout(missingTimeoutRef.current);
      }
    }

    return () => {
      if (missingTimeoutRef.current) {
        clearTimeout(missingTimeoutRef.current);
      }
    };
  }, [missingTarget]);

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

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onStop();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onStop]);

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
      {showOverlay && cutout ? (
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
      ) : showOverlay && !cutout ? (
        /* No valid target: full dim (but will clear after timeout) */
        <div
          className="spotlight-overlay spotlight-overlay--full"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }}
          aria-hidden="true"
        />
      ) : null}

      {/* Pulsing ring around the highlighted element */}
      {showOverlay && cutout && (
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

      {/* Stop guide button - always visible */}
      <button
        className="spotlight-stop-btn"
        onClick={onStop}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 10000,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
        }}
        data-testid="spotlight-stop"
      >
        Stop guide
      </button>

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

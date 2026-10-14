import FallbackBadge from './FallbackBadge';

interface WorkflowOfferCardProps {
  title: string;
  reason: string;
  estimatedMinutes: number;
  source: 'gemini' | 'fallback';
  fallbackCause?: string | null;
  dismissed: boolean;
  onStart: () => void;
  onNotNow: () => void;
}

/**
 * The workflow offer card shown by Rio after routing.
 * Displays the matched workflow, why Rio chose it, how long it takes,
 * and two CTAs: Start (begins the guided walkthrough) and Not now.
 *
 * Nothing on the dashboard changes until the user clicks Start.
 */
export default function WorkflowOfferCard({
  title,
  reason,
  estimatedMinutes,
  source,
  fallbackCause,
  dismissed,
  onStart,
  onNotNow,
}: WorkflowOfferCardProps) {
  if (dismissed) {
    return (
      <div className="rio-offer-dismissed" data-testid="offer-dismissed">
        <span className="rio-offer-dismissed-icon">✓</span>
        <span>Got it — not starting the guide right now.</span>
      </div>
    );
  }

  return (
    <div className="rio-offer-card" data-testid="workflow-offer-card">
      {source === 'fallback' && (
        <div className="rio-offer-fallback-row">
          <FallbackBadge cause={fallbackCause} />
        </div>
      )}

      <div className="rio-offer-title-row">
        <span className="rio-offer-icon">🗺️</span>
        <strong className="rio-offer-title">{title}</strong>
      </div>

      <p className="rio-offer-reason">{reason}</p>

      <p className="rio-offer-time">
        ⏱ About {estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''}
      </p>

      <div className="rio-offer-actions">
        <button
          className="rio-btn-start"
          onClick={onStart}
          data-testid="offer-start-btn"
        >
          Start
        </button>
        <button
          className="rio-btn-not-now"
          onClick={onNotNow}
          data-testid="offer-not-now-btn"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

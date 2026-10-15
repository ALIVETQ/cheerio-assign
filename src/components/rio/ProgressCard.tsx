interface ProgressCardProps {
  stepIndex: number;   // 0-based
  totalSteps: number;
  workflowTitle: string;
  onResume?: () => void;
  onStop: () => void;
}

/**
 * Static progress card shown in the Rio panel while a workflow is running.
 * Shows Resume button when guide is paused, always shows Stop guide button.
 */
export default function ProgressCard({ stepIndex, totalSteps, workflowTitle, onResume, onStop }: ProgressCardProps) {
  const current = stepIndex + 1; // 1-based display
  const pct = Math.round((current / totalSteps) * 100);

  return (
    <div className="rio-progress-card" data-testid="progress-card">
      <div className="rio-progress-header">
        <span className="rio-progress-icon">📍</span>
        <span className="rio-progress-title">{workflowTitle}</span>
      </div>
      <div className="rio-progress-label">
        Step {current} of {totalSteps}
      </div>
      <div className="rio-progress-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="rio-progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        {onResume && (
          <button
            className="btn-secondary"
            onClick={onResume}
            style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
            data-testid="progress-resume-btn"
          >
            Resume
          </button>
        )}
        <button
          className="btn-outline"
          onClick={onStop}
          style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
          data-testid="progress-stop-btn"
        >
          Stop guide
        </button>
      </div>
    </div>
  );
}

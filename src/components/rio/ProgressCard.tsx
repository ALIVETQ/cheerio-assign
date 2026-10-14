interface ProgressCardProps {
  stepIndex: number;   // 0-based
  totalSteps: number;
  workflowTitle: string;
}

/**
 * Static progress card shown in the Rio panel while a workflow is running.
 * Wired to the live engine state in Phase 3.
 */
export default function ProgressCard({ stepIndex, totalSteps, workflowTitle }: ProgressCardProps) {
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
    </div>
  );
}

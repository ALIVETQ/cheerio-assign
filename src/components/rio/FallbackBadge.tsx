interface FallbackBadgeProps {
  cause?: string | null;
}

const CAUSE_LABELS: Record<string, string> = {
  timeout: 'timeout',
  rate_limit: 'rate limit',
  invalid_json: 'invalid response',
  unknown_id: 'unknown workflow',
  error: 'server error',
};

/**
 * Small badge shown on any Rio message that was answered by the keyword
 * fallback instead of Gemini. Shows a lifebuoy icon with a tooltip.
 */
export default function FallbackBadge({ cause }: FallbackBadgeProps) {
  const label = cause ? (CAUSE_LABELS[cause] ?? cause) : 'AI unavailable';
  const tooltip = `Answered by backup mode (AI unavailable: ${label})`;

  return (
    <span
      className="fallback-badge"
      title={tooltip}
      data-testid="fallback-badge"
      role="img"
      aria-label={tooltip}
    >
      🛟
    </span>
  );
}

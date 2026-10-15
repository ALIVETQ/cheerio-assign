import { resetDemo } from '../../lib/demoReset';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-center">
        {/* Rio button removed - use the floating Rio widget instead */}
      </div>

      <div className="topbar-right">
        <span className="prototype-badge">Prototype</span>
        <button
          className="reset-demo-btn"
          data-testid="reset-demo-btn"
          onClick={resetDemo}
          title="Clear all demo state and start fresh"
        >
          ↺ Reset demo
        </button>
        <button
          className="support-view-btn"
          data-tour="support-view-btn"
          data-testid="support-view-btn"
          onClick={() => window.open('/support', '_blank', 'noopener,noreferrer')}
        >
          Support View
        </button>
      </div>
    </header>
  );
}

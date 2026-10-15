interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-center">
        <button className="topbar-search" data-tour="ask-me-anything">
          <span className="topbar-search-icon">✦ 🔍</span>
          <span>Ask me anything</span>
          <span className="topbar-search-close">✕</span>
        </button>
      </div>

      <div className="topbar-right">
        <span className="prototype-badge">Prototype</span>
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

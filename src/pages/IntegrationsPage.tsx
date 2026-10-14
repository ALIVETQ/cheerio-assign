import TopBar from '../components/dashboard/TopBar';

// ASSUMED UI — Integrations page not in screenshots
export default function IntegrationsPage() {
  return (
    <>
      <TopBar title="Integrations" />
      <div className="page-content" data-tour="integrations-page">
        <h2>Integrations</h2>
        <div className="channels-grid">
          <div className="channel-settings-card">
            <div className="channel-settings-icon">🛍️</div>
            <h3>Shopify</h3>
            <p className="channel-settings-status">
              <span className="status-disconnected">✕ Not connected</span>
            </p>
            <button className="btn-primary" data-tour="shopify-connect-btn">
              Connect Shopify
            </button>
          </div>
          <div className="channel-settings-card">
            <div className="channel-settings-icon">🛒</div>
            <h3>WooCommerce</h3>
            <p className="channel-settings-status">
              <span className="status-disconnected">✕ Not connected</span>
            </p>
            <button className="btn-outline">Connect</button>
          </div>
          <div className="channel-settings-card">
            <div className="channel-settings-icon">📘</div>
            <h3>Facebook</h3>
            <p className="channel-settings-status">
              <span className="status-connected">✓ Connected</span>
            </p>
            <button className="btn-outline">Manage</button>
          </div>
        </div>
      </div>
    </>
  );
}

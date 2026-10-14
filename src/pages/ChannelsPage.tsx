import { useAccount } from '../context/AccountContext';
import TopBar from '../components/dashboard/TopBar';

// ASSUMED UI — WhatsApp connect screen not in screenshots
export default function ChannelsPage() {
  const { account } = useAccount();
  const whatsapp = account.channels.find((c) => c.name === 'WhatsApp');

  return (
    <>
      <TopBar title="Channels / Settings" />
      <div className="page-content" data-tour="channels-page">
        <h2>Channel Settings</h2>
        <div className="channels-grid">
          {account.channels.map((ch) => (
            <div key={ch.id} className="channel-settings-card">
              <div className="channel-settings-icon">
                {ch.name === 'WhatsApp' ? '💬' : ch.name === 'Email' ? '✉️' : ch.name === 'SMS' ? '📱' : '📘'}
              </div>
              <h3>{ch.name}</h3>
              <p className="channel-settings-status">
                {ch.connected ? (
                  <span className="status-connected">✓ Connected</span>
                ) : (
                  <span className="status-disconnected">✕ Not connected</span>
                )}
              </p>
              {ch.name === 'WhatsApp' && (
                <button className="btn-primary" data-tour="whatsapp-connect-btn">
                  {whatsapp?.connected ? 'Manage' : 'Connect WhatsApp'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useAccount } from '../../context/AccountContext';

export default function JourneyAccordions() {
  const { account } = useAccount();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const whatsapp = account.channels.find((c) => c.name === 'WhatsApp');
  const csvCompleted = account.contacts.length > 0;
  const shopifyConnected = account.channels.some((c) => c.name === 'Facebook' && c.connected);

  return (
    <section className="journey-section">
      <h2 className="journey-title">Get started with your Marketing Journey</h2>

      {/* 1. Setup a channel */}
      <div className="accordion" data-tour="setup-channel-accordion">
        <button
          className="accordion-header"
          onClick={() => toggle('channel')}
          aria-expanded={!!openSections['channel']}
          data-testid="accordion-1"
        >
          <span>1. Setup a channel</span>
          <span className={`accordion-chevron${openSections['channel'] ? ' accordion-chevron--open' : ''}`}>▼</span>
        </button>
        {openSections['channel'] && (
          <div className="accordion-body">
            <div className="channel-tiles">
              {account.channels.map((ch) => (
                <div
                  key={ch.id}
                  className="channel-tile"
                  data-tour={ch.name === 'WhatsApp' ? 'whatsapp-channel-tile' : undefined}
                >
                  <div className="channel-tile-icon">
                    {ch.name === 'WhatsApp' ? '💬' : ch.name === 'Email' ? '✉️' : ch.name === 'SMS' ? '📱' : '📘'}
                  </div>
                  <div className="channel-tile-info">
                    <strong>{ch.name}</strong>
                    <span className="channel-tile-time">Installation takes {ch.installTime}</span>
                  </div>
                  {ch.connected && (
                    <span className="channel-tile-completed">
                      Completed <span className="check-green">✓</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Build an audience */}
      <div className="accordion" data-tour="build-audience-accordion">
        <button
          className="accordion-header"
          onClick={() => toggle('audience')}
          aria-expanded={!!openSections['audience']}
          data-testid="accordion-2"
        >
          <span>2. Build an audience</span>
          <span className={`accordion-chevron${openSections['audience'] ? ' accordion-chevron--open' : ''}`}>▼</span>
        </button>
        {openSections['audience'] && (
          <div className="accordion-body">
            <div className="channel-tiles">
              <div className="channel-tile" data-tour="csv-upload-tile">
                <div className="channel-tile-icon">📄</div>
                <div className="channel-tile-info">
                  <strong>CSV File</strong>
                  <span className="channel-tile-time">Upload a list of contacts</span>
                </div>
                {csvCompleted && (
                  <span className="channel-tile-completed">Completed <span className="check-green">✓</span></span>
                )}
              </div>
              <div className="channel-tile">
                <div className="channel-tile-icon">📘</div>
                <div className="channel-tile-info">
                  <strong>Facebook Sync</strong>
                  <span className="channel-tile-time">Sync Leads from Facebook</span>
                </div>
                <a href="#" className="channel-tile-action">Sync Contacts →</a>
              </div>
              <div className="channel-tile">
                <div className="channel-tile-icon">🛍️</div>
                <div className="channel-tile-info">
                  <strong>Shopify</strong>
                  <span className="channel-tile-time">Integrate Shopify Store</span>
                </div>
                {shopifyConnected ? (
                  <span className="channel-tile-completed">Completed <span className="check-green">✓</span></span>
                ) : (
                  <a href="#" className="channel-tile-action">Integrate Store →</a>
                )}
              </div>
              <div className="channel-tile">
                <div className="channel-tile-icon">🛒</div>
                <div className="channel-tile-info">
                  <strong>WooCommerce</strong>
                  <span className="channel-tile-time">Integrate WooCommerce store</span>
                </div>
                <a href="#" className="channel-tile-action">Integrate Store →</a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Create content */}
      <div className="accordion" data-tour="create-content-accordion">
        <button
          className="accordion-header"
          onClick={() => toggle('content')}
          aria-expanded={!!openSections['content']}
          data-testid="accordion-3"
        >
          <span>3. Create content</span>
          <span className={`accordion-chevron${openSections['content'] ? ' accordion-chevron--open' : ''}`}>▼</span>
        </button>
        {openSections['content'] && (
          <div className="accordion-body">
            <p style={{ color: '#6b7280', padding: '1rem' }}>
              Create message templates for your WhatsApp campaigns. Templates need to be approved before use.
            </p>
          </div>
        )}
      </div>

      {/* 4. Broadcast campaigns */}
      <div className="accordion">
        <button
          className="accordion-header"
          onClick={() => toggle('broadcast')}
          aria-expanded={!!openSections['broadcast']}
          data-testid="accordion-4"
        >
          <span>4. Broadcast campaigns</span>
          <span className={`accordion-chevron${openSections['broadcast'] ? ' accordion-chevron--open' : ''}`}>▼</span>
        </button>
        {openSections['broadcast'] && (
          <div className="accordion-body">
            <p style={{ color: '#6b7280', padding: '1rem' }}>
              Once your channels, audience, and content are ready, send your first campaign!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

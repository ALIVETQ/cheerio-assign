import { useState } from 'react';
import { useAccount } from '../../context/AccountContext';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'form' | 'review' | 'success';

export default function NewCampaignModal({ isOpen, onClose }: NewCampaignModalProps) {
  const { account } = useAccount();
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [segment, setSegment] = useState('');
  const [channels, setChannels] = useState({ email: true, sms: true, whatsapp: true });
  const [modalStep, setModalStep] = useState<ModalStep>('form');

  const toggleChannel = (ch: 'email' | 'sms' | 'whatsapp') => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const handleClose = () => {
    setModalStep('form');
    onClose();
  };

  const handleNext = () => setModalStep('review');
  const handleSend = () => setModalStep('success');

  const requiredCredits = 2;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      aria-hidden={!isOpen}
      style={isOpen ? undefined : { display: 'none' }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* ── FORM STEP ── */}
        {modalStep === 'form' && (
          <>
            {/* Hidden anchors for review/success tour targets — always present */}
            <div data-tour="campaign-review-section" aria-hidden="true" style={{ display: 'none' }} />
            <div data-tour="campaign-success-screen" aria-hidden="true" style={{ display: 'none' }} />
            <button type="button" data-tour="campaign-send-btn" aria-hidden="true" style={{ display: 'none' }} />
            <h2 className="modal-title">New Campaign</h2>

            <div className="form-group">
              <label className="form-label">Name Campaign</label>
              <input
                className="form-input"
                data-tour="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Share campaign to</label>
              <select
                className="form-select"
                data-tour="campaign-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              >
                <option value="">Label</option>
                {account.labels.map((lb) => (
                  <option key={lb.id} value={lb.id}>{lb.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select contact segment for campaign</label>
              <select
                className="form-select form-select--highlight"
                data-tour="campaign-segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
              >
                <option value="">Select segment</option>
                {account.segments.map((sg) => (
                  <option key={sg.id} value={sg.id}>{sg.name}</option>
                ))}
              </select>
            </div>

            <button className="btn-outline" style={{ marginBottom: '1.5rem' }}>
              ↑ Upload New Label
            </button>

            {/* Credit summary */}
            <div className="credit-summary" data-tour="credit-summary">
              <div className="credit-summary-row">
                <span>Required Email Credits</span>
                <span className="credit-num credit-num--purple">{requiredCredits}</span>
                <span>Available Email Credits</span>
                <span className="credit-num credit-num--purple">{account.credits.email}</span>
              </div>
              <div className="credit-summary-row">
                <span>Required SMS Credits</span>
                <span className="credit-num credit-num--purple">{requiredCredits}</span>
                <span>Available SMS Credits</span>
                <span className="credit-num credit-num--purple">{account.credits.sms}</span>
              </div>
              <div className="credit-summary-row">
                <span>Required WhatsApp Credits</span>
                <span className="credit-num credit-num--purple">{requiredCredits}</span>
                <span>Available WhatsApp Credits</span>
                <span className="credit-num credit-num--purple">{account.credits.whatsapp}</span>
              </div>
            </div>

            {/* Choose Channels */}
            <div className="form-group">
              <label className="form-label">Choose Channel(s)</label>
              <div className="channel-checkboxes">
                <label className="checkbox-label" data-tour="channel-email">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={() => toggleChannel('email')}
                  />
                  <span>Email</span>
                </label>
                <label className="checkbox-label" data-tour="channel-sms">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={() => toggleChannel('sms')}
                  />
                  <span>SMS</span>
                </label>
                <label className="checkbox-label" data-tour="channel-whatsapp">
                  <input
                    type="checkbox"
                    checked={channels.whatsapp}
                    onChange={() => toggleChannel('whatsapp')}
                  />
                  <span>WhatsApp</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" data-tour="campaign-next-btn" onClick={handleNext}>
                Next
              </button>
            </div>
          </>
        )}

        {/* ── REVIEW STEP — ASSUMED UI ── */}
        {/* // ASSUMED UI — review/schedule screen not captured in screenshots */}
        {modalStep === 'review' && (
          <div data-tour="campaign-review-section">
            <h2 className="modal-title">Review Campaign</h2>
            <div className="campaign-review-grid">
              <div className="review-row">
                <span className="review-label">Campaign name</span>
                <span className="review-value">{name || 'My First WhatsApp Campaign'}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Segment</span>
                <span className="review-value">
                  {account.segments.find((s) => s.id === segment)?.name ?? 'All Contacts'}
                </span>
              </div>
              <div className="review-row">
                <span className="review-label">Channels</span>
                <span className="review-value">
                  {[channels.email && 'Email', channels.sms && 'SMS', channels.whatsapp && 'WhatsApp']
                    .filter(Boolean).join(', ')}
                </span>
              </div>
              <div className="review-row">
                <span className="review-label">WhatsApp credits</span>
                <span className="review-value">
                  {requiredCredits} required / {account.credits.whatsapp} available
                </span>
              </div>
            </div>

            <div className="campaign-schedule-box">
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem' }}>
                📅 Schedule for later or send now
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-outline" style={{ flex: 1 }}>Schedule</button>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  data-tour="campaign-send-btn"
                  onClick={handleSend}
                >
                  Send Now
                </button>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-start' }}>
              <button className="btn-outline" onClick={() => setModalStep('form')}>← Back</button>
            </div>
          </div>
        )}

        {/* ── SUCCESS STEP — ASSUMED UI ── */}
        {/* // ASSUMED UI — success screen not captured in screenshots */}
        {modalStep === 'success' && (
          <div data-tour="campaign-success-screen" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 className="modal-title" style={{ textAlign: 'center' }}>Campaign Sent!</h2>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Your campaign <strong>{name || 'My First WhatsApp Campaign'}</strong> is on its way.
              You can track delivery in the Campaigns section.
            </p>
            <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>What to check next:</p>
              <ul style={{ fontSize: '0.875rem', color: '#6B7280', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                <li>Delivery rate in Campaigns → Analytics</li>
                <li>Replies coming into your Inbox</li>
                <li>WhatsApp credits balance</li>
              </ul>
            </div>
            <button className="btn-primary" onClick={handleClose} data-tour="campaign-success-close">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

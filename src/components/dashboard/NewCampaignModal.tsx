import { useState } from 'react';
import { useAccount } from '../../context/AccountContext';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewCampaignModal({ isOpen, onClose }: NewCampaignModalProps) {
  const { account } = useAccount();
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [segment, setSegment] = useState('');
  const [channels, setChannels] = useState({ email: true, sms: true, whatsapp: true });

  const toggleChannel = (ch: 'email' | 'sms' | 'whatsapp') => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const requiredCredits = 2;

  // Always render the modal markup so data-tour targets exist in DOM;
  // use aria-hidden + display:none to hide it visually when closed.
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      aria-hidden={!isOpen}
      style={isOpen ? undefined : { display: 'none' }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
          <button className="btn-primary" data-tour="campaign-next-btn">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

import { useAccount } from '../../context/AccountContext';

interface HomeCardsProps {
  onNewCampaign?: () => void;
}

export default function HomeCards({ onNewCampaign }: HomeCardsProps) {
  const { account } = useAccount();

  return (
    <div className="home-cards">
      {/* Add Contacts Card */}
      <div className="home-card home-card--blue">
        <div className="home-card-icon">👤</div>
        <h3 className="home-card-title">Add Contacts</h3>
        <p className="home-card-desc">
          Add contacts to Cheerio using CSV file or sync your Facebook account directly
        </p>
        <button className="home-card-btn" data-tour="add-contacts-btn">
          Add contacts
        </button>
      </div>

      {/* Shoot Campaign Card */}
      <div className="home-card home-card--peach">
        <div className="home-card-icon">📢</div>
        <h3 className="home-card-title">Shoot Campaign</h3>
        <p className="home-card-desc">
          Schedule or shoot your new campaign right from here with few easy steps
        </p>
        <button className="home-card-btn" data-tour="new-campaign-btn" onClick={onNewCampaign}>
          New campaign
        </button>
      </div>

      {/* Available Credits Card */}
      <div className="home-card home-card--cream" data-tour="credits-card">
        <h3 className="home-card-title">Available credits:</h3>
        <div className="credits-list">
          <div className="credit-row">
            <span className="credit-label">Email</span>
            <span className="credit-value" data-testid="credit-email">{account.credits.email}</span>
          </div>
          <div className="credit-row">
            <span className="credit-label">SMS</span>
            <span className="credit-value" data-testid="credit-sms">{account.credits.sms}</span>
          </div>
          <div className="credit-row">
            <span className="credit-label">WhatsApp</span>
            <span className="credit-value" data-testid="credit-whatsapp">{account.credits.whatsapp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

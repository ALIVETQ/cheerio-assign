import { useState } from 'react';
import TopBar from '../components/dashboard/TopBar';
import HomeCards from '../components/dashboard/HomeCards';
import JourneyAccordions from '../components/dashboard/JourneyAccordions';
import NewCampaignModal from '../components/dashboard/NewCampaignModal';
import FloatingPills from '../components/dashboard/FloatingPills';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="page-content">
        <HomeCards onNewCampaign={() => setModalOpen(true)} />
        <JourneyAccordions />
      </div>

      <FloatingPills onNewCampaign={() => setModalOpen(true)} />
      <NewCampaignModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <p className="home-footer-hint">
        Read documentations or watch videos to get started!
      </p>
    </>
  );
}

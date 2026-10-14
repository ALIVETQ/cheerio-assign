import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/dashboard/Sidebar';
import HomePage from './pages/HomePage';
import ContactsPage from './pages/ContactsPage';
import CampaignsPage from './pages/CampaignsPage';
import TemplatesPage from './pages/TemplatesPage';
import WorkflowsPage from './pages/WorkflowsPage';
import ChannelsPage from './pages/ChannelsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function AppRoutes() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
          <Route path="/inbox" element={<PlaceholderPage title="Inbox" />} />
          <Route path="/automation" element={<PlaceholderPage title="Automation" />} />
          <Route path="/email" element={<PlaceholderPage title="Email" />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
        </Routes>
      </main>
    </div>
  );
}

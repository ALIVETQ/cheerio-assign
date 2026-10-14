import { Routes, Route, type RouteProps } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import Sidebar from './components/dashboard/Sidebar';
import HomePage from './pages/HomePage';
import ContactsPage from './pages/ContactsPage';
import CampaignsPage from './pages/CampaignsPage';
import TemplatesPage from './pages/TemplatesPage';
import WorkflowsPage from './pages/WorkflowsPage';
import ChannelsPage from './pages/ChannelsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import PlaceholderPage from './pages/PlaceholderPage';

// Dev-only page — only imported when DEV, never bundled into production
const DevEnginePage: ComponentType | null = import.meta.env.DEV
  ? lazy(() => import('./pages/DevEnginePage'))
  : null;

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
          {import.meta.env.DEV && DevEnginePage && (
            <Route
              path="/dev/engine"
              element={
                <Suspense fallback={null}>
                  <DevEnginePage />
                </Suspense>
              }
            />
          )}
        </Routes>
      </main>
    </div>
  );
}

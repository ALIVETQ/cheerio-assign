import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: '🏠', label: 'Home', tour: 'sidebar-home' },
  { to: '/contacts', icon: '👤', label: 'Contacts', tour: 'sidebar-contacts' },
  { to: '/campaigns', icon: '📢', label: 'Campaigns', tour: 'sidebar-campaigns' },
  { to: '/analytics', icon: '📊', label: 'Analytics', tour: 'sidebar-analytics' },
  { to: '/inbox', icon: '💬', label: 'Inbox', tour: 'sidebar-inbox' },
  { to: '/automation', icon: '⚡', label: 'Automation', tour: 'sidebar-automation' },
  { to: '/email', icon: '✉️', label: 'Email', tour: 'sidebar-email' },
  { to: '/integrations', icon: '🔗', label: 'Integrations', tour: 'sidebar-integrations' },
  { to: '/workflows', icon: '🤖', label: 'Workflows', tour: 'sidebar-workflows' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">✈️</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            data-tour={item.tour}
            className={({ isActive }) =>
              `sidebar-item${isActive ? ' sidebar-item--active' : ''}`
            }
            title={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-avatar">
        <div className="sidebar-avatar-circle">N</div>
      </div>
    </aside>
  );
}

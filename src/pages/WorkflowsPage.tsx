import { useAccount } from '../context/AccountContext';
import TopBar from '../components/dashboard/TopBar';

// ASSUMED UI — workflow editor not fully captured in screenshots
export default function WorkflowsPage() {
  const { account } = useAccount();

  return (
    <>
      <TopBar title="Workflows" />
      <div className="page-content" data-tour="workflows-page">
        <div className="page-header-row">
          <h2>Workflows</h2>
          <button className="btn-primary" data-tour="workflow-create-btn">+ Create Workflow</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Event Type</th>
              <th>Created At</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {account.workflows.map((wf) => (
              <tr key={wf.id}>
                <td>{wf.name}</td>
                <td>{wf.eventType}</td>
                <td>{wf.createdAt}</td>
                <td>{wf.lastUpdated}</td>
                <td className="workflow-actions">
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={wf.active} />
                    <span className="toggle-slider"></span>
                  </label>
                  <button className="btn-icon" title="Edit">✏️</button>
                  <button className="btn-icon" title="Duplicate">📋</button>
                  <button className="btn-icon" title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Basic editor view placeholder */}
        <div className="workflow-editor" style={{ marginTop: '2rem' }}>
          <h3>Workflow Editor</h3>
          <div className="editor-layout">
            <div className="editor-palette">
              <h4>Events</h4>
              <div className="palette-item palette-item--green">💬 Incoming WhatsApp</div>
              <div className="palette-item palette-item--green">🛍️ Shopify Events</div>
              <div className="palette-item palette-item--green">📘 Facebook Lead</div>
              <h4>Actions</h4>
              <div className="palette-item palette-item--blue">📨 Response message</div>
              <div className="palette-item palette-item--blue">💬 Send WA template</div>
              <div className="palette-item palette-item--blue">⏱️ Time delay</div>
              <div className="palette-item palette-item--blue">🤖 Assign to chatbot</div>
              <div className="palette-item palette-item--blue">✉️ Send Email</div>
              <div className="palette-item palette-item--red">🔴 End Flow</div>
            </div>
            <div className="editor-canvas">
              {/* Simplified mock canvas */}
              <div className="canvas-node canvas-node--green" style={{ top: '40px', left: '60px' }}>
                <strong>Response Message</strong>
                <p>I call you back within 24 hours</p>
              </div>
              <div className="canvas-node canvas-node--blue" style={{ top: '40px', left: '300px' }}>
                <strong>Time Delay</strong>
                <p>2 hours 00 minutes</p>
              </div>
              <div className="canvas-node canvas-node--red" style={{ top: '40px', left: '540px' }}>
                <strong>Send Email</strong>
                <p>Subject: Test email</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

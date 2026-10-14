import { useState } from 'react';
import { useAccount } from '../context/AccountContext';
import TopBar from '../components/dashboard/TopBar';

export default function TemplatesPage() {
  const { account } = useAccount();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBody, setEditBody] = useState('');

  const startEdit = (tpl: typeof account.templates[0]) => {
    setEditingId(tpl.id);
    setEditName(tpl.name);
    setEditBody(tpl.body);
  };

  return (
    <>
      <TopBar title="Templates" />
      <div className="page-content" data-tour="templates-page">
        {/* Hidden anchors for workflow tour targets — always present */}
        <input type="hidden" data-tour="template-name-input" aria-hidden="true" />
        <input type="hidden" data-tour="template-body-input" aria-hidden="true" />
        <button type="button" data-tour="template-save-btn" aria-hidden="true" style={{ display: 'none' }} />
        <div className="page-header-row">
          <h2>Message Templates</h2>
          <button className="btn-primary" data-tour="create-template-btn">+ Create Template</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {account.templates.map((tpl) => (
              <tr
                key={tpl.id}
                data-tour={tpl.status === 'REJECTED' ? 'rejected-template-row' : undefined}
              >
                <td>{tpl.name}</td>
                <td>{tpl.category}</td>
                <td>
                  <span className={`status-badge status-badge--${tpl.status.toLowerCase()}`}>
                    {tpl.status}
                  </span>
                  {tpl.status === 'REJECTED' && tpl.rejectionReason && (
                    <div className="rejection-reason">
                      <span className="rejection-icon">⚠️</span> {tpl.rejectionReason}
                    </div>
                  )}
                </td>
                <td>
                  <button
                    className="btn-sm"
                    data-tour={tpl.status === 'REJECTED' ? 'template-edit-btn' : undefined}
                    onClick={() => startEdit(tpl)}
                  >
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Inline edit form */}
        {editingId && (
          <div className="template-edit-form">
            <h3>Edit Template</h3>
            <div className="form-group">
              <label className="form-label">Template Name</label>
              <input
                className="form-input"
                data-tour="template-name-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Template Body</label>
              <textarea
                className="form-textarea"
                data-tour="template-body-input"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-primary" data-tour="template-save-btn" onClick={() => setEditingId(null)}>Save</button>
              <button className="btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

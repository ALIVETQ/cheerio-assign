import TopBar from '../components/dashboard/TopBar';

export default function CampaignsPage() {
  return (
    <>
      <TopBar title="Campaigns" />
      <div className="page-content">
        <div className="page-header-row">
          <h2>All Campaigns</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Welcome Offer Q4</td>
              <td>WhatsApp</td>
              <td><span className="status-badge status-badge--sent">Sent</span></td>
              <td>142</td>
              <td>2024-01-15</td>
            </tr>
            <tr>
              <td>Diwali Flash Sale</td>
              <td>Email</td>
              <td><span className="status-badge status-badge--draft">Draft</span></td>
              <td>—</td>
              <td>2024-02-01</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

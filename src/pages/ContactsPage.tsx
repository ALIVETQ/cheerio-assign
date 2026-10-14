import { useAccount } from '../context/AccountContext';
import TopBar from '../components/dashboard/TopBar';

export default function ContactsPage() {
  const { account } = useAccount();

  return (
    <>
      <TopBar title="Contacts" />
      <div className="page-content">
        <div className="page-header-row">
          <h2>All Contacts ({account.contacts.length})</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Labels</th>
            </tr>
          </thead>
          <tbody>
            {account.contacts.map((ct) => (
              <tr key={ct.id}>
                <td>{ct.name}</td>
                <td>{ct.phone}</td>
                <td>{ct.email}</td>
                <td>
                  {ct.labels.map((lb) => (
                    <span key={lb} className="label-badge">{lb}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

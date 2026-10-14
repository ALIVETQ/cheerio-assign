import TopBar from '../components/dashboard/TopBar';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <TopBar title={title} />
      <div className="page-content">
        <div className="placeholder-page">
          <h2>{title}</h2>
          <p>This page will be built in a later phase.</p>
        </div>
      </div>
    </>
  );
}

interface FloatingPillsProps {
  onNewCampaign: () => void;
}

export default function FloatingPills({ onNewCampaign }: FloatingPillsProps) {
  return (
    <div className="floating-pills">
      <button className="floating-pill">✦ Change Language</button>
      <button className="floating-pill" onClick={onNewCampaign}>✏️ New Campaign</button>
      <button className="floating-pill">✏️ Create New Sender</button>
    </div>
  );
}

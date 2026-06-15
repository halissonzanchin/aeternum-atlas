import LineIcon from "../../../components/icons/LineIcon";

export default function QuickMetricCard({ icon, label, value, hint, tone = "gold" }) {
  return (
    <article className="student-quick-card">
      <span className={`student-quick-icon student-quick-icon--${tone}`}>
        <LineIcon name={icon} />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        {hint ? <small>{hint}</small> : null}
      </div>
    </article>
  );
}

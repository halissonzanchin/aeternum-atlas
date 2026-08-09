import LineIcon from "../../../components/icons/LineIcon";
import { A26Card } from "../../../components/aeternum-26";

export default function QuickMetricCard({ icon, label, value, hint, tone = "gold" }) {
  return (
    <A26Card as="article" material="regular" tone={tone === "teal" ? "teal" : "neutral"} className="student-quick-card">
      <span className={`student-quick-icon student-quick-icon--${tone}`}>
        <LineIcon name={icon} />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        {hint ? <small>{hint}</small> : null}
      </div>
    </A26Card>
  );
}

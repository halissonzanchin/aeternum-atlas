import { A26Card } from "../../../components/aeternum-26";

export default function QuickMetricCard({ label, value, hint, tone = "gold" }) {
  return (
    <A26Card as="article" material="regular" tone={tone === "teal" ? "teal" : "neutral"} className="student-quick-card">
      <div className="student-quick-content">
        <strong className="student-quick-value">{value}</strong>
        <p className="student-quick-label">{label}</p>
        {hint ? <small className="student-quick-hint">{hint}</small> : null}
      </div>
    </A26Card>
  );
}

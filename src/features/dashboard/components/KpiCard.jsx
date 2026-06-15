import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";

export default function KpiCard({ icon, label, value, tone = "gold" }) {
  return (
    <Card className="premium-panel-card">
      <div className="flex items-start justify-between gap-4">
        <span className={`module-icon ${tone === "teal" ? "text-techTeal" : "text-agedGold"}`}>
          <LineIcon name={icon} />
        </span>
        <strong className={`text-right text-3xl ${tone === "teal" ? "text-techTeal" : "text-agedGold"}`}>{value}</strong>
      </div>
      <p className="mt-4 text-sm font-bold text-textMuted">{label}</p>
    </Card>
  );
}

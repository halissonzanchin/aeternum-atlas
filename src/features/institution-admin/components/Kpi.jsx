import Card from "../../../components/Card/Card";

export default function Kpi({ label, value, tone = "gold" }) {
  return (
    <Card>
      <strong className={`text-3xl ${tone === "teal" ? "text-techTeal" : "text-agedGold"}`}>{value}</strong>
      <p className="mt-2 text-textMuted">{label}</p>
    </Card>
  );
}

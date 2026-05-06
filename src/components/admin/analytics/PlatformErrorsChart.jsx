import "./analytics.css";

export default function PlatformErrorsChart({ data, formatNumber }) {
  const max = Math.max(...data.map(item => item.count), 1);
  return (
    <div className="analytics-horizontal-list">
      {data.map(item => (
        <div key={item.type} className="analytics-horizontal-row">
          <strong>{item.type}</strong>
          <div className="analytics-track">
            <div style={{ width: `${(item.count / max) * 100}%`, background: "linear-gradient(90deg, #F87171, #FBBF24)" }} />
          </div>
          <span>{formatNumber(item.count)}</span>
        </div>
      ))}
    </div>
  );
}

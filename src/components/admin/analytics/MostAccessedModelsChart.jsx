import "./analytics.css";

export default function MostAccessedModelsChart({ data, formatNumber }) {
  const max = Math.max(...data.map(item => item.accesses), 1);

  return (
    <div className="analytics-horizontal-list">
      {data.map(item => (
        <div key={item.model} className="analytics-horizontal-row">
          <div>
            <strong>{item.model}</strong>
            <small>{formatNumber(item.studyMinutes)} min · +{item.growthPercent}% · {item.completionRate}% conclusão</small>
          </div>
          <div className="analytics-track">
            <div style={{ width: `${(item.accesses / max) * 100}%` }} />
          </div>
          <span>{formatNumber(item.accesses)}</span>
        </div>
      ))}
    </div>
  );
}

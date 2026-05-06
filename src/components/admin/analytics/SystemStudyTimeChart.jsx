import "./analytics.css";

export default function SystemStudyTimeChart({ data, formatNumber }) {
  const max = Math.max(...data.map(item => item.hours), 1);

  return (
    <div className="analytics-horizontal-list">
      {data.map(item => (
        <div key={item.system} className="analytics-horizontal-row">
          <div>
            <strong>{item.system}</strong>
            <small>Tempo acumulado</small>
          </div>
          <div className="analytics-track">
            <div style={{ width: `${(item.hours / max) * 100}%` }} />
          </div>
          <span>{formatNumber(item.hours)}h</span>
        </div>
      ))}
    </div>
  );
}

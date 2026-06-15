export default function WeeklyStudyChart({ data, t }) {
  const maxMinutes = Math.max(...data.map(item => item.minutes), 1);

  return (
    <div className="weekly-study-chart">
      {data.map(item => (
        <div key={item.dayKey} className="weekly-study-column">
          <div className="weekly-study-bar-wrap">
            <span className="weekly-study-bar" style={{ height: `${Math.max(18, (item.minutes / maxMinutes) * 100)}%` }} />
          </div>
          <strong>{item.minutes}</strong>
          <small>{t(item.dayKey)}</small>
        </div>
      ))}
    </div>
  );
}

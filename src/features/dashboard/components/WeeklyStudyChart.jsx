export default function WeeklyStudyChart({ data, t }) {
  const maxMinutes = Math.max(...data.map(item => item.minutes), 1);

  return (
    <div
      className="weekly-study-chart"
      style={{ gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(${data.length > 7 ? 44 : 0}px, 1fr))` }}
    >
      {data.map((item, index) => (
        <div key={item.key || item.dayKey || item.label || `study-period-${index}`} className="weekly-study-column">
          <div className="weekly-study-bar-wrap">
            <span
              className="weekly-study-bar"
              style={{ height: `${item.minutes > 0 ? (item.minutes / maxMinutes) * 100 : 0}%` }}
              title={`${item.minutes} ${t("common.minutes")}`}
            />
          </div>
          <strong>{item.minutes}</strong>
          <small>{item.label || t(item.dayKey)}</small>
        </div>
      ))}
    </div>
  );
}

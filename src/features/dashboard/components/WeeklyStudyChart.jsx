const MAX_VISIBLE_BARS = 12;

function aggregateStudySeries(data = []) {
  if (data.length <= MAX_VISIBLE_BARS) return data;

  const bucketSize = Math.ceil(data.length / MAX_VISIBLE_BARS);

  return Array.from({ length: Math.ceil(data.length / bucketSize) }, (_, bucketIndex) => {
    const bucket = data.slice(bucketIndex * bucketSize, (bucketIndex + 1) * bucketSize);
    const first = bucket[0];
    const last = bucket[bucket.length - 1];
    const firstLabel = first?.label || first?.dayKey || "";
    const lastLabel = last?.label || last?.dayKey || firstLabel;

    return {
      key: `${first?.key || firstLabel}-${last?.key || lastLabel}`,
      label: firstLabel === lastLabel ? firstLabel : `${firstLabel}–${lastLabel}`,
      minutes: bucket.reduce((total, item) => total + Number(item.minutes || 0), 0)
    };
  });
}

export default function WeeklyStudyChart({ data = [], t }) {
  const renderedData = aggregateStudySeries(data);
  const maxMinutes = Math.max(...renderedData.map(item => item.minutes), 1);

  return (
    <div
      className="weekly-study-chart"
      style={{ gridTemplateColumns: `repeat(${Math.max(renderedData.length, 1)}, minmax(0, 1fr))` }}
      aria-label="Tempo de estudo no período selecionado"
    >
      {renderedData.map((item, index) => (
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

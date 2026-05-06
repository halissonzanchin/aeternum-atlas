import "./analytics.css";

export default function DowntimeTimelineChart({ data }) {
  const width = 760;
  const height = 280;
  const padding = 42;
  const max = Math.max(...data.map(item => item.downtimeMinutes), 1);
  const slot = (width - padding * 2) / data.length;

  return (
    <div className="analytics-svg-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Downtime por data">
        {data.map((item, index) => {
          const barHeight = (item.downtimeMinutes / max) * (height - padding * 2);
          const x = padding + index * slot + slot * 0.22;
          const y = height - padding - barHeight;
          return (
            <g key={item.date}>
              <title>{`${item.date}: ${item.downtimeMinutes} minutos fora do ar`}</title>
              <rect x={x} y={y} width={slot * 0.56} height={Math.max(barHeight, 2)} rx="10" fill={item.downtimeMinutes > 0 ? "#FBBF24" : "rgba(74,222,128,.55)"} />
              <text x={x + slot * 0.28} y={height - 14} textAnchor="middle" fill="#AEB8C5" fontSize="16" fontWeight="800">{item.date}</text>
              <text x={x + slot * 0.28} y={Math.max(y - 10, 24)} textAnchor="middle" fill="#DCE7EE" fontSize="15" fontWeight="800">{item.downtimeMinutes}m</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

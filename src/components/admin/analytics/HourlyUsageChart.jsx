import "./analytics.css";

export default function HourlyUsageChart({ data, formatNumber }) {
  const width = 760;
  const height = 300;
  const padding = 42;
  const max = Math.max(...data.map(item => item.accesses), 1);
  const slot = (width - padding * 2) / data.length;

  return (
    <div className="analytics-svg-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Acessos por hora do dia">
        {data.map((item, index) => {
          const barHeight = (item.accesses / max) * (height - padding * 2);
          const x = padding + index * slot + slot * 0.2;
          const y = height - padding - barHeight;
          return (
            <g key={item.hour}>
              <title>{`${item.hour}: ${formatNumber(item.accesses)} acessos`}</title>
              <rect x={x} y={y} width={slot * 0.6} height={barHeight} rx="12" fill="url(#hourlyGradient)" />
              <text x={x + slot * 0.3} y={y - 10} textAnchor="middle" fill="#DCE7EE" fontSize="16" fontWeight="800">{formatNumber(item.accesses)}</text>
              <text x={x + slot * 0.3} y={height - 14} textAnchor="middle" fill="#AEB8C5" fontSize="16" fontWeight="800">{item.hour}</text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2FB8B5" />
            <stop offset="100%" stopColor="#1E6F72" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

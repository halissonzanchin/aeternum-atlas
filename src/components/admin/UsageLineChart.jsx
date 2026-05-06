import "./adminDashboardWidgets.css";

export default function UsageLineChart({ data }) {
  const width = 700;
  const height = 250;
  const padding = 28;
  const max = Math.max(...data.map(item => item.access), 1);
  const min = Math.min(...data.map(item => item.access), 0);
  const range = Math.max(max - min, 1);
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data.map((item, index) => {
    const x = padding + index * stepX;
    const y = height - padding - ((item.access - min) / range) * (height - padding * 2);
    return { ...item, x, y };
  });

  const line = points.map(point => `${point.x},${point.y}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;

  return (
    <div className="usage-line-chart">
      <div className="usage-line-chart__plot">
        <svg className="usage-line-chart__svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Acessos dos últimos 7 dias">
          <defs>
            <linearGradient id="usageAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2FB8B5" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#2FB8B5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="usageLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2FB8B5" />
              <stop offset="100%" stopColor="#F5D98B" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#usageAreaGradient)" />
          <polyline points={line} fill="none" stroke="url(#usageLineGradient)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(point => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.y} r="7" fill="#05070a" stroke="#F5D98B" strokeWidth="3" />
              <text x={point.x} y={point.y - 14} textAnchor="middle" fill="#DCE7EE" fontSize="18" fontWeight="700">{point.access}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="usage-line-chart__axis">
        {data.map(item => <span key={item.day}>{item.day}</span>)}
      </div>
    </div>
  );
}

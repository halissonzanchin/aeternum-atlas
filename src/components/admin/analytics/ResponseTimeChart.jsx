import { linePath, pointsForLine } from "./chartUtils";
import "./analytics.css";

export default function ResponseTimeChart({ data }) {
  const width = 760;
  const height = 280;
  const points = pointsForLine(data, "responseMs", width, height);

  return (
    <div className="analytics-svg-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tempo médio de resposta">
        <polyline points={linePath(points)} fill="none" stroke="#C6A85C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(point => (
          <g key={point.time}>
            <title>{`${point.time}: ${point.responseMs} ms`}</title>
            <circle cx={point.x} cy={point.y} r="7" fill="#05070a" stroke="#F5D98B" strokeWidth="3" />
            <text x={point.x} y={Math.max(point.y - 14, 22)} textAnchor="middle" fill="#DCE7EE" fontSize="15" fontWeight="800">{point.responseMs}ms</text>
            <text x={point.x} y={height - 14} textAnchor="middle" fill="#AEB8C5" fontSize="16" fontWeight="800">{point.time}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

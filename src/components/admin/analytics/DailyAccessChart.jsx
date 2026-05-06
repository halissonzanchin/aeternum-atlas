import { linePath, pointsForLine } from "./chartUtils";
import "./analytics.css";

export default function DailyAccessChart({ data, formatNumber }) {
  const width = 760;
  const height = 300;
  const accessPoints = pointsForLine(data, "accesses", width, height);
  const userPoints = pointsForLine(data, "activeUsers", width, height);

  return (
    <div>
      <div className="analytics-svg-chart">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Acessos por dia">
          <polyline points={linePath(accessPoints)} fill="none" stroke="#2FB8B5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={linePath(userPoints)} fill="none" stroke="#C6A85C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {accessPoints.map((point, index) => (
            <g key={point.day}>
              <title>{`${point.day}: ${formatNumber(point.accesses)} acessos · ${formatNumber(point.activeUsers)} usuários ativos · ${formatNumber(point.studyMinutes)} min de estudo`}</title>
              <circle cx={point.x} cy={point.y} r="6" fill="#05070a" stroke="#2FB8B5" strokeWidth="3" />
              <circle cx={userPoints[index].x} cy={userPoints[index].y} r="5" fill="#05070a" stroke="#C6A85C" strokeWidth="3" />
              <text x={point.x} y={height - 14} textAnchor="middle" fill="#AEB8C5" fontSize="16" fontWeight="800">{point.day}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="analytics-legend">
        <span>Acessos</span>
        <span>Usuários ativos</span>
      </div>
    </div>
  );
}

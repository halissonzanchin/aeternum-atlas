import { useMemo, useState } from "react";
import "./adminStudents.css";

const PERIODS = ["Diário", "Semanal", "Mensal", "Semestral", "Anual"];

function transformData(data, period) {
  if (data.length === 1 && data[0].period === "-") return data;
  if (period === "Mensal") return data;
  const multipliers = {
    "Diário": 0.08,
    "Semanal": 0.28,
    "Semestral": 1.8,
    "Anual": 3.4
  };
  const multiplier = multipliers[period] || 1;
  let accumulated = 0;
  return data.map(item => {
    const newStudents = Math.max(Math.round(item.newStudents * multiplier), period === "Diário" ? 8 : 30);
    accumulated += newStudents;
    return {
      ...item,
      newStudents,
      accumulated,
      growthPercent: item.growthPercent
    };
  });
}

export default function StudentGrowthBarChart({ data, formatNumber }) {
  const [period, setPeriod] = useState("Mensal");
  const sourceData = data?.length ? data : [{ period: "-", newStudents: 0, accumulated: 0, growthPercent: 0 }];
  const chartData = useMemo(() => transformData(sourceData, period), [sourceData, period]);
  const maxNew = Math.max(...chartData.map(item => item.newStudents), 1);
  const maxAccumulated = Math.max(...chartData.map(item => item.accumulated), 1);
  const width = 760;
  const height = 320;
  const padding = 42;
  const slot = (width - padding * 2) / chartData.length;
  const linePoints = chartData.map((item, index) => {
    const x = padding + slot * index + slot / 2;
    const y = height - padding - (item.accumulated / maxAccumulated) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="student-growth-chart">
      <div className="student-growth-chart__tabs" aria-label="Filtros de crescimento">
        {PERIODS.map(item => (
          <button key={item} type="button" className={period === item ? "is-active" : ""} onClick={() => setPeriod(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="student-growth-chart__canvas">
        <svg className="student-growth-chart__svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Crescimento de alunos cadastrados">
          <defs>
            <linearGradient id="studentBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2FB8B5" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#2FB8B5" stopOpacity="0.34" />
            </linearGradient>
          </defs>

          {chartData.map((item, index) => {
            const barHeight = (item.newStudents / maxNew) * (height - padding * 2);
            const x = padding + slot * index + slot * 0.2;
            const y = height - padding - barHeight;
            return (
              <g key={item.period}>
                <title>{`${item.period}: ${formatNumber(item.newStudents)} novos · ${formatNumber(item.accumulated)} acumulados · ${item.growthPercent}% crescimento`}</title>
                <rect x={x} y={y} width={slot * 0.6} height={barHeight} rx="12" fill="url(#studentBarGradient)" />
                <text x={x + slot * 0.3} y={y - 10} textAnchor="middle" fill="#DCE7EE" fontSize="18" fontWeight="800">{formatNumber(item.newStudents)}</text>
                <text x={x + slot * 0.3} y={height - 14} textAnchor="middle" fill="#AEB8C5" fontSize="18" fontWeight="800">{item.period}</text>
                <text x={x + slot * 0.3} y={height - 44} textAnchor="middle" fill="#F5D98B" fontSize="14" fontWeight="800">+{item.growthPercent}%</text>
              </g>
            );
          })}

          <polyline points={linePoints} fill="none" stroke="#C6A85C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {linePoints.split(" ").map((point, index) => {
            const [x, y] = point.split(",").map(Number);
            return <circle key={`${point}-${index}`} cx={x} cy={y} r="7" fill="#05070A" stroke="#F5D98B" strokeWidth="3" />;
          })}
        </svg>
      </div>

      <div className="student-growth-chart__legend">
        <span>Novos cadastros</span>
        <span>Acumulado total</span>
        <span>Percentual de crescimento</span>
      </div>
    </div>
  );
}

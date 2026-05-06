import "./adminStudents.css";

export default function StudentRadarChart({ data }) {
  const size = 360;
  const center = size / 2;
  const radius = 128;
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = (Math.PI * 2) / data.length;

  function pointFor(index, value = 100) {
    const angle = -Math.PI / 2 + angleStep * index;
    const scaled = radius * (value / 100);
    return {
      x: center + Math.cos(angle) * scaled,
      y: center + Math.sin(angle) * scaled
    };
  }

  const polygon = data.map((item, index) => {
    const point = pointFor(index, item.value);
    return `${point.x},${point.y}`;
  }).join(" ");

  return (
    <div className="student-radar-chart">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar de desempenho do aluno">
        {levels.map(level => (
          <polygon
            key={level}
            points={data.map((_, index) => {
              const point = pointFor(index, level * 100);
              return `${point.x},${point.y}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        ))}
        {data.map((item, index) => {
          const axisEnd = pointFor(index, 100);
          const labelPoint = pointFor(index, 116);
          return (
            <g key={item.subject}>
              <line x1={center} y1={center} x2={axisEnd.x} y2={axisEnd.y} stroke="rgba(255,255,255,0.10)" />
              <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" fill="#AEB8C5" fontSize="12" fontWeight="700">{item.subject}</text>
            </g>
          );
        })}
        <polygon points={polygon} fill="rgba(47, 184, 181, 0.28)" stroke="#2FB8B5" strokeWidth="3" />
        {data.map((item, index) => {
          const point = pointFor(index, item.value);
          return <circle key={item.subject} cx={point.x} cy={point.y} r="5" fill="#F5D98B" />;
        })}
      </svg>
      <div className="student-radar-legend">
        {data.map(item => <span key={item.subject}>{item.subject}: <strong>{item.value}</strong></span>)}
      </div>
    </div>
  );
}

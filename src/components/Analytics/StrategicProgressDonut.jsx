import React, { useState, useMemo } from "react";
import "./StrategicProgressDonut.css";

const PILLARS_CONFIG = [
  {
    id: "models3d",
    name: "Modelos 3D & Estruturas",
    description: "Exploração de estruturas 3D (meta: 48h ativas)",
    color: "#4fd8c9",
    gradient: ["#4fd8c9", "#2bb3a5"],
    unit: "horas 3D",
    target: 48,
    icon: "layers"
  },
  {
    id: "flashcards",
    name: "Flashcards Anatômicos",
    description: "Revisão e memorização ativa (meta: 100 cards)",
    color: "#a78bfa",
    gradient: ["#a78bfa", "#7c5dfa"],
    unit: "cards revisados",
    target: 100,
    icon: "library"
  },
  {
    id: "quizzes",
    name: "Simulados & Casos Clínicos",
    description: "Exames anatômicos e teóricos com 100% de acerto",
    color: "#e8836f",
    gradient: ["#e8836f", "#d95f47"],
    unit: "simulados concluídos",
    target: 6,
    icon: "check"
  },
  {
    id: "tutor",
    name: "Tutor IA & Síntese",
    description: "Consultas de síntese ao Tutor IA (meta: 500 perguntas)",
    color: "#e9b872",
    gradient: ["#e9b872", "#c99245"],
    unit: "perguntas realizadas",
    target: 500,
    icon: "spark"
  }
];

// Helper to convert polar coordinates to SVG Cartesian path (with exploded offset support)
function makeArcPath(cx, cy, rInner, rOuter, startAngleDeg, endAngleDeg, explodeOffset = 0) {
  const startRad = (startAngleDeg - 90) * (Math.PI / 180);
  const endRad = (endAngleDeg - 90) * (Math.PI / 180);
  const midRad = (startRad + endRad) / 2;

  const offsetX = explodeOffset * Math.cos(midRad);
  const offsetY = explodeOffset * Math.sin(midRad);

  const cxE = cx + offsetX;
  const cyE = cy + offsetY;

  const x1O = cxE + rOuter * Math.cos(startRad);
  const y1O = cyE + rOuter * Math.sin(startRad);
  const x2O = cxE + rOuter * Math.cos(endRad);
  const y2O = cyE + rOuter * Math.sin(endRad);

  const x1I = cxE + rInner * Math.cos(endRad);
  const y1I = cyE + rInner * Math.sin(endRad);
  const x2I = cxE + rInner * Math.cos(startRad);
  const y2I = cyE + rInner * Math.sin(startRad);

  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? 0 : 1;

  return [
    `M ${x1O} ${y1O}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2O} ${y2O}`,
    `L ${x1I} ${y1I}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x2I} ${y2I}`,
    "Z"
  ].join(" ");
}

export default function StrategicProgressDonut({
  totalStudyMinutes = 0,
  flashcardsReviewed = 0,
  completedQuizzesCount = 0,
  totalQuizzesTarget = 6,
  tutorQuestionsCount = 0
}) {
  const [hoveredPillarId, setHoveredPillarId] = useState(null);

  // Compute exact pillar values & percentages based on quantitative targets
  const pillarData = useMemo(() => {
    const hours3D = Math.round((totalStudyMinutes / 60) * 10) / 10;
    const p1Percent = Math.min(100, Math.round((hours3D / 48) * 100));

    const p2Percent = Math.min(100, Math.round((flashcardsReviewed / 100) * 100));

    const p3Target = Math.max(1, totalQuizzesTarget);
    const p3Percent = Math.min(100, Math.round((completedQuizzesCount / p3Target) * 100));

    const p4Percent = Math.min(100, Math.round((tutorQuestionsCount / 500) * 100));

    const items = [
      { ...PILLARS_CONFIG[0], value: `${hours3D}h / 48h`, percent: p1Percent, rawValue: hours3D },
      { ...PILLARS_CONFIG[1], value: `${flashcardsReviewed} / 100`, percent: p2Percent, rawValue: flashcardsReviewed },
      { ...PILLARS_CONFIG[2], value: `${completedQuizzesCount} / ${p3Target}`, percent: p3Percent, rawValue: completedQuizzesCount, target: p3Target },
      { ...PILLARS_CONFIG[3], value: `${tutorQuestionsCount} / 500`, percent: p4Percent, rawValue: tutorQuestionsCount }
    ];

    const overallPercent = Math.round((p1Percent + p2Percent + p3Percent + p4Percent) / 4);

    return { items, overallPercent };
  }, [totalStudyMinutes, flashcardsReviewed, completedQuizzesCount, totalQuizzesTarget, tutorQuestionsCount]);

  const activePillar = useMemo(() => {
    if (!hoveredPillarId) return null;
    return pillarData.items.find(p => p.id === hoveredPillarId) || null;
  }, [hoveredPillarId, pillarData.items]);

  // Sector Angle Specs: 4 sectors, 6 deg gap between each
  // Total usable = 360 - (4 * 6) = 336 deg -> 84 deg per sector
  const sectors = useMemo(() => {
    const gap = 6;
    const sweep = 84;
    return pillarData.items.map((item, index) => {
      const startAngle = index * (sweep + gap) + gap / 2;
      const endAngle = startAngle + sweep;
      return {
        ...item,
        startAngle,
        endAngle
      };
    });
  }, [pillarData.items]);

  return (
    <div className="strategic-donut-container">
      {/* Interactive Liquid Glass progress donut */}
      <div className="strategic-donut-visual">
        <svg
          viewBox="0 0 160 160"
          className="strategic-donut-svg"
          role="img"
          aria-label={`Progresso acadêmico geral: ${pillarData.overallPercent}%`}
        >
          <defs>
            {PILLARS_CONFIG.map((p) => (
              <linearGradient key={p.id} id={`grad-${p.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={p.gradient[0]} />
                <stop offset="100%" stopColor={p.gradient[1]} />
              </linearGradient>
            ))}
            <linearGradient id="centerTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#4fd8c9" />
            </linearGradient>
            <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Ring Track */}
          <circle cx="80" cy="80" r="56" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" fill="none" />
          <circle cx="80" cy="80" r="38" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" fill="none" />

          {/* Each pillar keeps a quiet track and fills only its real percentage. */}
          {sectors.map((sector) => {
            const isHovered = hoveredPillarId === sector.id;
            const explodeOffset = isHovered ? 1.5 : 0;
            const trackPath = makeArcPath(80, 80, 39, 58, sector.startAngle, sector.endAngle, explodeOffset);
            const activeEndAngle = sector.startAngle + ((sector.endAngle - sector.startAngle) * sector.percent) / 100;

            return (
              <g
                key={sector.id}
                onMouseEnter={() => setHoveredPillarId(sector.id)}
                onMouseLeave={() => setHoveredPillarId(null)}
              >
                <path d={trackPath} className="donut-sector-track" />
                {sector.percent > 0 ? (
                  <path
                    d={makeArcPath(80, 80, 39, 58, sector.startAngle, activeEndAngle, explodeOffset)}
                    fill={`url(#grad-${sector.id})`}
                    opacity={hoveredPillarId ? (isHovered ? 1 : 0.48) : 0.94}
                    filter={isHovered ? "url(#donutGlow)" : undefined}
                    className="donut-sector-path"
                  />
                ) : null}
                <title>{`${sector.name}: ${sector.percent}% (${sector.value})`}</title>
              </g>
            );
          })}

          {/* Locked SVG Center Text (Zero Overlap / Mathematically Aligned) */}
          {activePillar ? (
            <g textAnchor="middle" style={{ pointerEvents: "none" }}>
              <text
                x="80"
                y="72"
                fill={activePillar.color}
                fontSize="20"
                fontWeight="700"
                fontFamily="'Space Grotesk', 'Inter', sans-serif"
                dominantBaseline="central"
              >
                {activePillar.percent}%
              </text>
              <text
                x="80"
                y="89"
                fill="rgba(255, 255, 255, 0.9)"
                fontSize="8.5"
                fontFamily="'JetBrains Mono', monospace"
                dominantBaseline="central"
              >
                {activePillar.value}
              </text>
            </g>
          ) : (
            <g className="donut-center-metric" textAnchor="middle" style={{ pointerEvents: "none" }}>
              <text
                className="donut-number"
                x="80"
                y="72"
                fill="url(#centerTextGrad)"
                fontSize="21"
                fontWeight="700"
                fontFamily="'Space Grotesk', 'Inter', sans-serif"
                dominantBaseline="central"
              >
                {pillarData.overallPercent}%
              </text>
              <text
                className="donut-sublabel"
                x="80"
                y="89"
                fill="#4fd8c9"
                fontSize="7.2"
                fontWeight="700"
                letterSpacing="0.8"
                fontFamily="'JetBrains Mono', monospace"
                opacity="0.95"
                dominantBaseline="central"
              >
                PROGRESSO GERAL
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Strategic Pillars Legend Grid */}
      <div className="strategic-pillars-legend">
        {pillarData.items.map((pillar) => {
          const isHovered = hoveredPillarId === pillar.id;
          return (
            <div
              key={pillar.id}
              className={`pillar-legend-item ${isHovered ? "is-active" : ""}`}
              onMouseEnter={() => setHoveredPillarId(pillar.id)}
              onMouseLeave={() => setHoveredPillarId(null)}
            >
              <div className="pillar-legend-head">
                <div className="pillar-title-wrap">
                  <span className="pillar-dot" style={{ background: pillar.color, boxShadow: `0 0 8px ${pillar.color}` }} />
                  <span className="pillar-name">{pillar.name}</span>
                </div>
                <span className="pillar-percent" style={{ color: pillar.color }}>{pillar.percent}%</span>
              </div>

              <p className="pillar-description">{pillar.description}</p>

              <div className="pillar-track-bg">
                <div
                  className="pillar-track-fill"
                  style={{
                    width: `${pillar.percent}%`,
                    background: `linear-gradient(90deg, ${pillar.gradient[0]}, ${pillar.gradient[1]})`
                  }}
                />
              </div>
              <span className="pillar-value-detail">{pillar.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

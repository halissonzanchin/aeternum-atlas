import React, { useState, useMemo } from 'react';

const SEVERITY_COLORS = {
  critical: 'rgba(239, 68, 68, 0.75)',   // red-500
  high: 'rgba(249, 115, 22, 0.75)',     // orange-500
  medium: 'rgba(251, 191, 36, 0.75)',   // amber-400
  low: 'rgba(34, 197, 94, 0.75)',       // green-500
  default: 'rgba(255, 255, 255, 0)'     // transparent overlay base
};

const SEVERITY_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  default: 0
};

export default function AnatomicalBodyHeatmap({ performanceData = [], onRegionSelect, selectedRegion }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const regionDataMap = useMemo(() => {
    const map = {};
    performanceData.forEach(item => {
      const existing = map[item.regionId];
      if (!existing || SEVERITY_WEIGHT[item.riskLevel] > SEVERITY_WEIGHT[existing.riskLevel]) {
        map[item.regionId] = item;
      }
    });
    return map;
  }, [performanceData]);

  const getOverlayFillColor = (regionId) => {
    const data = regionDataMap[regionId];
    return data ? SEVERITY_COLORS[data.riskLevel] : SEVERITY_COLORS.default;
  };

  const handleMouseEnter = (regionId) => {
    setHoveredRegion(regionId);
  };

  const handleMouseLeave = () => {
    setHoveredRegion(null);
  };

  const handleClick = (regionId) => {
    if (onRegionSelect) {
      onRegionSelect(selectedRegion === regionId ? null : regionId);
    }
  };

  // 16 High-Fidelity Medical Grade Paths (Antropometria de 8 cabeças)
  const paths = {
    head_brain: "M200,15 C160,15 155,50 155,75 L245,75 C245,50 240,15 200,15 Z",
    head_face: "M155,75 L245,75 C245,100 220,115 200,115 C180,115 155,100 155,75 Z",
    neck: "M180,113 C180,125 175,135 175,135 L225,135 C225,135 220,125 220,113 C210,117 190,117 180,113 Z",
    shoulder_right: "M175,135 C150,135 115,145 100,165 C100,180 110,195 125,195 C140,195 160,165 175,135 Z",
    shoulder_left: "M225,135 C250,135 285,145 300,165 C300,180 290,195 275,195 C260,195 240,165 225,135 Z",
    chest: "M175,135 C160,165 140,195 125,195 C125,230 130,270 130,270 L270,270 C270,270 275,230 275,195 C260,195 240,165 225,135 Z",
    abdomen: "M130,270 L270,270 C270,300 265,360 265,360 L135,360 C135,360 130,300 130,270 Z",
    pelvis: "M135,360 L265,360 C270,390 275,410 275,410 C250,420 220,430 200,430 C180,430 150,420 125,410 C125,410 130,390 135,360 Z",
    arm_right: "M100,165 C90,200 80,260 80,310 L105,310 C110,260 120,220 125,195 C110,195 100,180 100,165 Z",
    arm_left: "M300,165 C310,200 320,260 320,310 L295,310 C290,260 280,220 275,195 C290,195 300,180 300,165 Z",
    forearm_right: "M80,310 C70,360 65,400 65,430 C55,450 55,480 55,490 C60,495 70,490 75,470 C80,450 85,440 85,430 C95,400 100,360 105,310 Z",
    forearm_left: "M320,310 C330,360 335,400 335,430 C345,450 345,480 345,490 C340,495 330,490 325,470 C320,450 315,440 315,430 C305,400 300,360 295,310 Z",
    thigh_right: "M125,410 C115,460 125,530 135,580 L185,580 C190,530 195,480 200,430 C180,430 150,420 125,410 Z",
    thigh_left: "M275,410 C285,460 275,530 265,580 L215,580 C210,530 205,480 200,430 C220,430 250,420 275,410 Z",
    leg_right: "M135,580 C125,640 135,690 145,720 C135,740 130,760 130,780 C145,785 165,780 170,760 C175,740 170,730 175,720 C185,690 190,640 185,580 Z",
    leg_left: "M265,580 C275,640 265,690 255,720 C265,740 270,760 270,780 C255,785 235,780 230,760 C225,740 230,730 225,720 C215,690 210,640 215,580 Z"
  };

  const InteractiveRegion = ({ id, d }) => {
    const isSelected = selectedRegion === id;
    const isHovered = hoveredRegion === id;
    const fill = getOverlayFillColor(id);
    const hasData = !!regionDataMap[id];
    
    const isActive = isSelected || isHovered;

    return (
      <path
        id={`overlay-${id}`}
        d={d}
        fill={isActive && hasData ? fill : (hasData ? fill.replace('0.75', '0.25') : 'transparent')}
        className={`transition-all duration-300 ${hasData ? 'cursor-pointer' : 'cursor-default'}`}
        style={{
          filter: isActive && hasData ? `drop-shadow(0 0 12px ${fill})` : 'none',
        }}
        onMouseEnter={() => handleMouseEnter(id)}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick(id)}
      />
    );
  };

  return (
    <div className="w-full flex justify-center py-4">
      {/* SVG Interativo Anatômico (Base Sólida Contínua + Overlay Segmentado Translúcido) */}
      <div className="relative w-full max-w-[280px] flex justify-center">
        <svg
          viewBox="0 0 400 800"
          className="h-[550px] drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* UNDERLAY: Silhueta Base Unificada em Azul/Cinza Neutro Profundo */}
          <g id="anatomical-body-underlay" fill="#1e293b" stroke="#1e293b" strokeWidth="1">
            {Object.entries(paths).map(([key, d]) => (
              <path key={`base-${key}`} d={d} />
            ))}
          </g>

          {/* OVERLAY: 16 Regiões de Risco Translúcidas */}
          <g id="anatomical-body-overlay">
            {Object.entries(paths).map(([key, d]) => (
              <InteractiveRegion key={`region-${key}`} id={key} d={d} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

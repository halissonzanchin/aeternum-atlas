import React, { useState, useMemo } from 'react';
import AnatomyAsset from '../../../assets/anatomy/real-anatomical-body.svg';

const SEVERITY_COLORS = {
  critical: 'rgba(220, 38, 38, 0.95)',   // red-600 forte para destacar urgência
  high: 'rgba(234, 88, 12, 0.85)',       // orange-600
  medium: 'rgba(202, 138, 4, 0.65)',     // yellow-600 moderado
  low: 'rgba(5, 150, 105, 0.25)',        // verde muito sutil, áreas normais não precisam gritar
  default: 'rgba(255, 255, 255, 0)'      // invisível
};

const SEVERITY_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  default: 0
};

export default function RealAnatomicalSvgHeatmap({ performanceData = [], onRegionSelect, selectedRegion }) {
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

  const handleMouseEnter = (regionId) => setHoveredRegion(regionId);
  const handleMouseLeave = () => setHoveredRegion(null);
  
  const handleClick = (regionId) => {
    if (onRegionSelect) {
      onRegionSelect(selectedRegion === regionId ? null : regionId);
    }
  };

  // Mapeamento de 8 Regiões (com multi-elipses para membros) 
  const hotspotsMap = {
    head: [{ cx: 86.6, cy: 22, rx: 14, ry: 16 }],
    face: [{ cx: 86.6, cy: 45, rx: 12, ry: 14 }],
    neck: [{ cx: 86.6, cy: 65, rx: 8, ry: 6 }],
    chest: [{ cx: 86.6, cy: 95, rx: 25, ry: 25 }],
    abdomen: [{ cx: 86.6, cy: 150, rx: 25, ry: 28 }],
    pelvis: [{ cx: 86.6, cy: 195, rx: 28, ry: 16 }],
    upper_limbs: [
      { cx: 50, cy: 85, rx: 14, ry: 14 }, 
      { cx: 123, cy: 85, rx: 14, ry: 14 }, 
      { cx: 35, cy: 155, rx: 12, ry: 50, transform: 'rotate(8 35 155)' }, 
      { cx: 138, cy: 155, rx: 12, ry: 50, transform: 'rotate(-8 138 155)' } 
    ],
    lower_limbs: [
      { cx: 65, cy: 300, rx: 16, ry: 80 }, 
      { cx: 108, cy: 300, rx: 16, ry: 80 } 
    ]
  };

  const InteractiveRegion = ({ regionId, shapes }) => {
    const isSelected = selectedRegion === regionId;
    const isHovered = hoveredRegion === regionId;
    const fill = getOverlayFillColor(regionId);
    const hasData = !!regionDataMap[regionId];
    
    const isActive = isSelected || isHovered;

    return (
      <g 
        id={`region-${regionId}`}
        className={`transition-all duration-700 ${hasData ? 'cursor-pointer' : 'cursor-default'}`}
        onMouseEnter={() => handleMouseEnter(regionId)}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick(regionId)}
      >
        {shapes.map((shape, idx) => (
          <ellipse
            key={idx}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            transform={shape.transform || ''}
            fill={isActive && hasData ? fill : (hasData ? fill.replace(/[\d.]+\)$/, '0.2)') : 'transparent')}
            filter={hasData ? 'url(#heatmap-blur)' : 'none'}
            style={{ mixBlendMode: 'screen' }}
            className="transition-all duration-500 ease-in-out"
          />
        ))}
      </g>
    );
  };

  return (
    <div className="w-full h-full min-h-[550px] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Container Responsivo e Centralizado para Asset Real */}
      <div className="relative h-[95%] max-h-[700px] w-auto aspect-[173/400] flex justify-center items-center">
        
        {/* UNDERLAY: SVG Único Realista - Tratamento Clínico CSS */}
        {/* Usamos filtros pesados para desaturar, focar o contraste e gerar um aspecto de Raio-X suave */}
        <img 
          src={AnatomyAsset} 
          alt="Interface Anatômica Radiológica" 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl opacity-75 grayscale-[0.4] contrast-125 sepia-[0.1] hue-rotate-15 z-0 transition-all duration-700"
        />

        {/* OVERLAY: Hitboxes Interativas */}
        <svg
          viewBox="0 0 173.213 400"
          className="absolute inset-0 w-full h-full z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="heatmap-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>

          <g id="heatmap-interactive-layer">
            {Object.entries(hotspotsMap).map(([regionId, shapes]) => (
              <InteractiveRegion key={regionId} regionId={regionId} shapes={shapes} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

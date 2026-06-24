import React from 'react';
import { Html } from '@react-three/drei';

export default function AtlasMarker({ marker, isActive, onClick }) {
  if (marker.visible === false && !isActive) return null;
  
  const markerColor = marker.color || '#16c79a';

  return (
    <Html 
      position={marker.position} 
      center 
      zIndexRange={[100, 0]}
      distanceFactor={8} // Escala adaptativa com a distância da câmera
    >
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onClick(marker);
        }}
        className={`relative flex items-center justify-center cursor-pointer group transition-all duration-300 ${isActive ? 'scale-125 z-50' : 'scale-75 hover:scale-100 z-10'}`}
        title={marker.title}
        aria-label={`Visualizar marcador: ${marker.title}`}
      >
        {/* Pulsing Halo (only when active or hovered) */}
        <div 
          className={`absolute inset-0 rounded-full transition-all duration-500 ${isActive ? 'opacity-50 animate-ping scale-[3]' : 'opacity-0 group-hover:opacity-30 scale-[2.5]'}`}
          style={{ backgroundColor: markerColor }}
        />
        
        {/* Outer Clinical Target Ring */}
        <div 
          className={`relative flex items-center justify-center w-8 h-8 rounded-full border-[1.5px] transition-colors duration-300 backdrop-blur-sm`}
          style={{ 
            borderColor: isActive ? 'white' : `${markerColor}80`,
            backgroundColor: isActive ? `${markerColor}CC` : 'rgba(11, 15, 20, 0.4)',
            boxShadow: isActive ? `0 0 20px ${markerColor}` : `0 0 10px rgba(0,0,0,0.8)`
          }}
        >
          {/* Crosshair accents */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20 -translate-x-1/2"></div>
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/20 -translate-y-1/2"></div>

          {/* Inner Core */}
          <div 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 relative z-10 shadow-[0_0_5px_rgba(0,0,0,1)]`}
            style={{ 
              backgroundColor: isActive ? 'white' : markerColor,
              boxShadow: isActive ? `0 0 10px white` : 'none'
            }}
          />
          
          {/* Title Tooltip (Visible on hover if not active) */}
          {!isActive && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[11px] font-bold text-white bg-black/80 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 whitespace-nowrap shadow-lg">
                {marker.order ? <span className="text-techTeal mr-1">{marker.order}.</span> : null}
                {marker.title}
              </span>
            </div>
          )}
        </div>
      </div>
    </Html>
  );
}

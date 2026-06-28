import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAtlasViewer } from '../context/AtlasViewerContext';

// Helper matemático para limitar o crescimento/redução do pin
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

function MarkerItem({ marker, index, isSelected, handleSelectAnnotation, isAuthoringMode }) {
  const containerRef = useRef(null);
  
  // Memoriza o vetor da posição para não instanciar no useFrame
  const markerPos = useMemo(() => new THREE.Vector3(...(marker.position || [0,0,0])), [marker.position]);
  
  // Camera-Aware Scaling: 
  // Medimos a distância da câmera até o marcador a cada frame e ajustamos via CSS transform
  // para evitar re-renders do React, mantendo 60fps constantes.
  useFrame(({ camera }) => {
    if (!containerRef.current) return;
    const dist = camera.position.distanceTo(markerPos);
    // Fórmula empírica: quanto mais perto (menor dist), menor o scale.
    // Ex: dist = 2 -> scale = 0.5 + 0.16 = 0.66
    // Ex: dist = 10 -> scale = 0.5 + 0.8 = 1.3
    const rawScale = 0.5 + (dist * 0.08); 
    const finalScale = clamp(rawScale, 0.65, 1.15); // Evita ficar gigante ou invisível
    
    // Suavizamos via CSS transform no DOM
    containerRef.current.style.transform = `scale(${finalScale})`;
  });

  const isDraft = marker.isDraft;
  const displayIndex = marker.index !== undefined ? marker.index : (index + 1);
  const label = isDraft ? `D${displayIndex}` : `${displayIndex}`;

  // Cores do Pin (Default vs Selected)
  let bgColor = isDraft ? 'bg-techTeal/90' : 'bg-[#151A23]/90'; 
  let textColor = isDraft ? 'text-black' : 'text-slate-200';
  let borderColor = isDraft ? 'border-techTeal' : 'border-white/30';
  
  if (isSelected) {
     bgColor = isDraft ? 'bg-techTeal' : 'bg-amber-500';
     textColor = 'text-black';
     borderColor = 'border-white';
  }

  // Glow premium (Halo)
  let shadowClass = isSelected 
    ? (isDraft ? 'shadow-[0_0_25px_rgba(20,184,166,0.7)]' : 'shadow-[0_0_25px_rgba(245,158,11,0.7)]') 
    : 'shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]';

  return (
    <Html
      position={marker.position}
      center
      zIndexRange={isSelected ? [100, 0] : [50, 0]}
    >
      <div 
        ref={containerRef}
        className="relative flex flex-col items-center justify-center transition-transform duration-75 origin-center"
      >
        {/* O Pin Compacto */}
        <div 
          className={`
            cursor-pointer 
            transition-all duration-300 
            flex items-center justify-center 
            rounded-full font-bold
            border-2 backdrop-blur-md
            hover:scale-110 hover:bg-amber-400 hover:text-black hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]
            ${shadowClass}
            ${isSelected ? `w-8 h-8 text-sm z-50 ${bgColor} ${textColor} ${borderColor}` : `w-7 h-7 text-xs ${bgColor} ${textColor} ${borderColor}`}
          `}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAnnotation(marker);
          }}
          title={isAuthoringMode ? (marker.title || marker.label) : "Ver anotação"}
        >
          {label}
        </div>
        
        {/* Popover Premium Glassmorphism (Só visível quando selecionado) */}
        {isSelected && (
          <div 
            className={`
              absolute top-full left-1/2 -translate-x-1/2 mt-3
              w-56 sm:w-64 atlas-liquid-glass rounded-xl
              shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in
              flex flex-col pointer-events-auto z-[60]
            `}
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="atlas-liquid-highlight"></div>
            {/* Accent Header Line */}
            <div className={`h-1 w-full ${isDraft ? 'bg-techTeal' : 'bg-amber-500'}`} />
            
            <div className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className={`text-sm font-bold ${isDraft ? 'text-techTeal' : 'text-amber-500'} leading-tight line-clamp-2`}>
                  {marker.title || marker.label || marker.name || `Marcador ${label}`}
                </h4>
                {isDraft && (
                  <span className="bg-techTeal/20 text-techTeal px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-techTeal/30 shrink-0">
                    DRAFT
                  </span>
                )}
              </div>
              
              {(marker.category || marker.structureName) && (
                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                  {marker.category && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-300">{marker.category}</span>}
                  {marker.structureName && <span className="text-[9px] text-slate-400 truncate max-w-full">{marker.structureName}</span>}
                </div>
              )}
              
              {(marker.description || marker.clinicalNote) ? (
                <div className="max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                  {marker.description && (
                     <p className="text-xs text-slate-300 leading-relaxed">
                       {marker.description}
                     </p>
                  )}
                  {marker.clinicalNote && (
                     <p className="text-[10px] text-amber-500/90 leading-relaxed mt-2 p-1.5 bg-amber-500/10 rounded border border-amber-500/20">
                       <span className="font-bold uppercase block mb-0.5 text-[9px]">Nota Clínica:</span>
                       {marker.clinicalNote}
                     </p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic">Sem descrição detalhada.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Html>
  );
}

export default function AtlasAnnotationMarkers() {
  const { 
    annotations, 
    selectedAnnotation, 
    handleSelectAnnotation,
    draftMarkers,
    isAuthoringMode
  } = useAtlasViewer();

  const hasAnnotations = annotations && annotations.length > 0;
  const hasDrafts = draftMarkers && draftMarkers.length > 0;

  // Combinar todos os marcadores (oficiais e drafts) se estivermos em modo autoria.
  const allMarkers = useMemo(() => {
    let combined = [];
    if (hasAnnotations) {
      combined = [...annotations];
    }
    if (isAuthoringMode && hasDrafts) {
      const drafts = draftMarkers.map(d => ({ ...d, isDraft: true, annotationId: d.id }));
      combined = [...combined, ...drafts];
    }
    return combined;
  }, [annotations, draftMarkers, isAuthoringMode, hasAnnotations, hasDrafts]);

  if (allMarkers.length === 0) return null;

  return (
    <>
      {allMarkers.map((marker, index) => (
        <MarkerItem 
          key={marker.annotationId || index}
          marker={marker}
          index={index}
          isSelected={selectedAnnotation?.annotationId === marker.annotationId}
          handleSelectAnnotation={handleSelectAnnotation}
          isAuthoringMode={isAuthoringMode}
        />
      ))}
    </>
  );
}

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useAtlasViewer } from '../context/AtlasViewerContext';

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
  // Drafts vêm com uma flag isDraft = true adicionada dinamicamente.
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
      {allMarkers.map((marker, index) => {
        const isSelected = selectedAnnotation?.annotationId === marker.annotationId;
        const isDraft = marker.isDraft;
        const isApproved = marker.status === 'approved' || !marker.status; // default to approved if no status
        
        // Define number (marker.index or fallback to index + 1)
        const displayIndex = marker.index !== undefined ? marker.index : (index + 1);
        const label = isDraft ? `D${displayIndex}` : `${displayIndex}`;

        // Define colors
        let bgColor = isDraft ? 'bg-techTeal' : 'bg-amber-500'; // Draft = Teal, Approved = Gold/Cyan
        let textColor = isDraft ? 'text-black' : 'text-black';
        let borderColor = isDraft ? 'border-techTeal' : 'border-amber-400';
        let hoverColor = isDraft ? 'hover:bg-techTeal/80' : 'hover:bg-amber-400';
        let shadowClass = isSelected ? (isDraft ? 'shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'shadow-[0_0_15px_rgba(245,158,11,0.5)]') : 'shadow-lg';

        // Html from Drei allows placing normal DOM elements in the 3D space
        return (
          <Html
            key={marker.annotationId}
            position={marker.position}
            center
            zIndexRange={[100, 0]}
          >
            <div 
              className={`
                cursor-pointer 
                transition-all duration-300 
                flex items-center justify-center 
                rounded-full font-bold
                border-2 backdrop-blur-sm
                hover:scale-110
                ${shadowClass}
                ${isSelected 
                  ? `${bgColor} ${textColor} border-white w-8 h-8 text-sm z-50` 
                  : `bg-black/60 text-white border-white/30 hover:${borderColor} w-6 h-6 text-xs`
                }
              `}
              onClick={(e) => {
                e.stopPropagation(); // Previne conflitos com OrbitControls
                handleSelectAnnotation(marker);
              }}
              title={marker.title || marker.label}
            >
              {label}
            </div>
            
            {/* Linha indicadora/Tooltips sutis para visualização em 3D */}
            {isSelected && (
              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap bg-black/80 backdrop-blur ${isDraft ? 'text-techTeal' : 'text-amber-500'} text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 animate-fade-in pointer-events-none flex items-center gap-1.5`}>
                {isDraft && <span className="bg-techTeal text-black px-1 py-0.5 rounded text-[8px] font-bold">DRAFT</span>}
                {marker.title || marker.label}
              </div>
            )}
          </Html>
        );
      })}
    </>
  );
}

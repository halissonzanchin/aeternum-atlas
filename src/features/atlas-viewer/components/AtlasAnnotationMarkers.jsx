import React from 'react';
import { Html } from '@react-three/drei';
import { useAtlasViewer } from '../context/AtlasViewerContext';

export default function AtlasAnnotationMarkers() {
  const { 
    annotations, 
    selectedAnnotation, 
    handleSelectAnnotation 
  } = useAtlasViewer();

  if (!annotations || annotations.length === 0) return null;

  return (
    <>
      {annotations.map((annotation, index) => {
        const isSelected = selectedAnnotation?.annotationId === annotation.annotationId;

        // Html from Drei allows placing normal DOM elements in the 3D space
        return (
          <Html
            key={annotation.annotationId}
            position={annotation.position}
            center
            zIndexRange={[100, 0]}
          >
            <div 
              className={`
                cursor-pointer 
                transition-all duration-300 
                flex items-center justify-center 
                rounded-full font-bold shadow-lg
                border-2 backdrop-blur-sm
                hover:scale-110
                ${isSelected 
                  ? 'bg-techTeal text-black border-white w-8 h-8 text-sm z-50' 
                  : 'bg-black/60 text-white border-white/30 hover:border-techTeal w-6 h-6 text-xs'
                }
              `}
              onClick={(e) => {
                e.stopPropagation(); // Previne conflitos com OrbitControls ou cliques no Canvas
                handleSelectAnnotation(annotation);
              }}
              title={annotation.title}
            >
              {index + 1}
            </div>
            
            {/* Linha indicadora/Tooltips sutis para visualização em 3D */}
            {isSelected && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap bg-black/80 backdrop-blur text-techTeal text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-techTeal/30 animate-fade-in pointer-events-none">
                {annotation.title}
              </div>
            )}
          </Html>
        );
      })}
    </>
  );
}

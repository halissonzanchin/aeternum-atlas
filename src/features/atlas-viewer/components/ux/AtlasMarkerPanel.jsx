import React, { useMemo } from 'react';
import LineIcon from '../../../../components/icons/LineIcon';
import AtlasMarkerCard from './AtlasMarkerCard';
import { useAtlasViewer } from '../../context/AtlasViewerContext';
import { atlasViewerCommands } from '../../ai/atlasViewerCommands';

export default function AtlasMarkerPanel({ markers = [], activeMarkerId, onSelectMarker, isOpen, onClose, isSketchfabMode }) {
  const { isAuthoringMode, draftMarkers } = useAtlasViewer();

  // Combine official markers and draft markers
  const allMarkers = useMemo(() => {
    let combined = [...markers];
    if (isAuthoringMode && draftMarkers && draftMarkers.length > 0) {
      const drafts = draftMarkers.map(d => ({ ...d, isDraft: true, annotationId: d.id, id: d.id }));
      combined = [...combined, ...drafts];
    }
    return combined;
  }, [markers, draftMarkers, isAuthoringMode]);

  // Find active index for navigation
  const activeIndex = useMemo(() => {
    if (!activeMarkerId) return -1;
    return allMarkers.findIndex(m => (m.id === activeMarkerId || m.annotationId === activeMarkerId));
  }, [allMarkers, activeMarkerId]);

  const handleNext = () => {
    if (activeIndex < allMarkers.length - 1) {
      const nextMarker = allMarkers[activeIndex + 1];
      onSelectMarker(nextMarker);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      const prevMarker = allMarkers[activeIndex - 1];
      onSelectMarker(prevMarker);
    }
  };
  return (
    <div className={`fixed md:inset-y-0 md:left-0 md:bottom-auto bottom-0 left-0 right-0 md:w-80 w-full h-[75dvh] md:h-full bg-[#0B0E14]/95 backdrop-blur-xl border-t md:border-r md:border-t-0 border-white/5 shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col rounded-t-3xl md:rounded-none ${isOpen ? 'translate-y-0 md:translate-x-0 md:translate-y-0' : 'translate-y-full md:-translate-x-full md:translate-y-0'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200 flex items-center gap-2">
          <LineIcon name="bookmark" className="w-4 h-4 text-techTeal" />
          Pontos Anatômicos
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Navigation Controls */}
          {allMarkers.length > 0 && activeMarkerId && (
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 mr-2">
              <button 
                onClick={handlePrev}
                disabled={activeIndex <= 0}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <LineIcon name="chevron-left" className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-300 px-1 min-w-[40px] text-center">
                {activeIndex + 1} / {allMarkers.length}
              </span>
              <button 
                onClick={handleNext}
                disabled={activeIndex >= allMarkers.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <LineIcon name="chevron-right" className="w-4 h-4" />
              </button>
            </div>
          )}

          {onClose && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <LineIcon name="x" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats/Info */}
      {!isSketchfabMode && (
        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-400">{allMarkers.length} marcadores</span>
          {activeMarkerId && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-techTeal bg-techTeal/10 px-2 py-1 rounded">
              Selecionado
            </span>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 relative">
        {isSketchfabMode ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-techTeal/10 border border-techTeal/30 flex items-center justify-center mb-4 backdrop-blur-md shadow-2xl">
              <LineIcon name="bookmark" className="w-6 h-6 text-techTeal" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-2 uppercase tracking-widest leading-relaxed">Modo Sketchfab Ativo</h4>
            <div className="text-[12px] text-slate-400 space-y-3 leading-relaxed">
              <p>Marcadores nativos da Aeternum estão disponíveis apenas no Atlas Native Engine.</p>
              <p>As anotações visíveis atualmente pertencem diretamente ao <strong>Sketchfab Embed</strong>.</p>
              <p className="text-techTeal/80 mt-2">Use <code className="bg-white/5 px-1 rounded">?engine=native</code> na URL para acessar a Engine Nativa e nossos marcadores autorais.</p>
            </div>
          </div>
        ) : allMarkers.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 backdrop-blur-md shadow-2xl">
              <LineIcon name="bookmark" className="w-6 h-6 text-slate-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-widest">Nenhum marcador</h4>
            <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
              Use o modo autoria para capturar pontos anatômicos reais na superfície do modelo.
            </p>
          </div>
        ) : (
          allMarkers.map((marker, idx) => (
            <AtlasMarkerCard 
              key={marker.annotationId || marker.id || idx}
              marker={marker}
              index={idx}
              isActive={(marker.annotationId && marker.annotationId === activeMarkerId) || marker.id === activeMarkerId}
              onSelect={() => onSelectMarker(marker)}
            />
          ))
        )}
      </div>
    </div>
  );
}

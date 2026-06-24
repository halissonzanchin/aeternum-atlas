import React from 'react';
import LineIcon from '../../../../components/icons/LineIcon';
import AtlasMarkerCard from './AtlasMarkerCard';

export default function AtlasMarkerPanel({ markers = [], activeMarkerId, onSelectMarker, isOpen, onClose }) {
  return (
    <div className={`fixed inset-y-0 left-0 w-80 bg-[#0B0E14]/95 backdrop-blur-xl border-r border-white/5 shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200 flex items-center gap-2">
          <LineIcon name="bookmark" className="w-4 h-4 text-techTeal" />
          Pontos Anatômicos
        </h3>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <LineIcon name="x" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats/Info */}
      <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 shrink-0 flex items-center justify-between">
        <span className="text-xs text-slate-400">{markers.length} marcadores</span>
        {activeMarkerId && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-techTeal bg-techTeal/10 px-2 py-1 rounded">
            1 Selecionado
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {markers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center px-4">
            <LineIcon name="info-circle" className="w-6 h-6 mb-2 opacity-50" />
            <p className="text-xs">Nenhum marcador anotado nesta peça anatômica.</p>
          </div>
        ) : (
          markers.map((marker, index) => (
            <AtlasMarkerCard
              key={marker.id}
              marker={marker}
              index={index}
              isActive={activeMarkerId === marker.id}
              onSelect={onSelectMarker}
            />
          ))
        )}
      </div>
    </div>
  );
}

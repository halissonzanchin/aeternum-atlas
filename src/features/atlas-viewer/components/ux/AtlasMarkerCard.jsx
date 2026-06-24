import React from 'react';
import LineIcon from '../../../../components/icons/LineIcon';

export default function AtlasMarkerCard({ marker, index, isActive, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(marker)}
      className={`p-3 rounded-lg border transition-all cursor-pointer group ${
        isActive 
          ? 'bg-techTeal/10 border-techTeal/40 shadow-[0_0_15px_rgba(20,184,166,0.15)]' 
          : 'bg-[#151A23] border-white/5 hover:border-white/20 hover:bg-[#1A212D]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Número do Marcador */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-colors ${
          isActive ? 'bg-techTeal text-black' : 'bg-white/10 text-slate-300 group-hover:bg-white/20 group-hover:text-white'
        }`}>
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-techTeal' : 'text-slate-200 group-hover:text-white'}`}>
            {marker.title || `Marcador ${index + 1}`}
          </h4>
          
          {(marker.structureName || marker.category) && (
            <div className="flex items-center gap-2 mt-1">
              {marker.category && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                  {marker.category}
                </span>
              )}
              {marker.structureName && (
                <span className="text-[10px] text-slate-400 truncate">
                  {marker.structureName}
                </span>
              )}
            </div>
          )}
          
          {marker.description && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {marker.description}
            </p>
          )}
          
          <div className={`mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            isActive ? 'text-techTeal opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-slate-300'
          }`}>
            <LineIcon name="target" className="w-3 h-3" />
            {isActive ? 'Foco Atual' : 'Focar'}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import LineIcon from '../../../../components/icons/LineIcon';

export default function AtlasMarkerCard({ marker, index, isActive, onSelect }) {
  const isDraft = marker.isDraft;
  const isApproved = marker.status === 'approved' || !marker.status;
  
  const displayIndex = marker.index !== undefined ? marker.index : (index + 1);
  const label = isDraft ? `D${displayIndex}` : `${displayIndex}`;

  let bgCard = isActive ? (isDraft ? 'bg-techTeal/10 border-techTeal/40 shadow-[0_0_15px_rgba(20,184,166,0.15)]' : 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]') : 'bg-[#151A23] border-white/5 hover:border-white/20 hover:bg-[#1A212D]';
  let badgeBg = isActive ? (isDraft ? 'bg-techTeal text-black' : 'bg-amber-500 text-black') : 'bg-white/10 text-slate-300 group-hover:bg-white/20 group-hover:text-white';
  let titleColor = isActive ? (isDraft ? 'text-techTeal' : 'text-amber-500') : 'text-slate-200 group-hover:text-white';

  return (
    <div 
      onClick={() => onSelect(marker)}
      className={`p-3 rounded-lg border transition-all cursor-pointer group ${bgCard}`}
    >
      <div className="flex items-start gap-3">
        {/* Número do Marcador */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-colors ${badgeBg}`}>
          {label}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold truncate transition-colors ${titleColor} flex items-center gap-2`}>
            {marker.title || marker.label || marker.name || `Marcador ${label}`}
            {isDraft && <span className="text-[8px] px-1 py-0.5 rounded bg-techTeal text-black uppercase tracking-widest shrink-0">DRAFT</span>}
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
            isActive ? (isDraft ? 'text-techTeal' : 'text-amber-500') + ' opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-slate-300'
          }`}>
            <LineIcon name="target" className="w-3 h-3" />
            {isActive ? 'Foco Atual' : 'Focar'}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import LineIcon from '../../../../components/icons/LineIcon';
import AtlasFullscreenButton from './AtlasFullscreenButton';
import AtlasResetViewButton from './AtlasResetViewButton';
import AtlasQualityToggle from './AtlasQualityToggle';

export default function AtlasViewerToolbar({ 
  isFullscreen, 
  toggleFullscreen, 
  qualityPreset, 
  setQualityPreset,
  isMarkerPanelOpen,
  toggleMarkerPanel,
  studyMode,
  toggleStudyMode
}) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
      
      {/* Markers Toggle */}
      <button 
        onClick={toggleMarkerPanel}
        className={`h-10 px-4 rounded-lg border transition-all flex items-center gap-2 ${
          isMarkerPanelOpen 
            ? 'bg-techTeal text-black border-techTeal' 
            : 'bg-[#151A23]/90 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
        }`}
        title="Painel de Marcadores"
      >
        <LineIcon name="bookmark" className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Marcadores</span>
      </button>

      <div className="w-px h-6 bg-white/10 mx-1"></div>

      {/* Quality */}
      <AtlasQualityToggle qualityPreset={qualityPreset} setQualityPreset={setQualityPreset} />
      
      <div className="w-px h-6 bg-white/10 mx-1"></div>

      {/* Study Mode */}
      <button 
        onClick={toggleStudyMode}
        className={`h-10 px-3 rounded-lg border transition-all flex items-center gap-2 group relative ${
          studyMode 
            ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
            : 'bg-[#151A23]/90 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-[10px] font-bold text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity uppercase tracking-widest">
          Modo Estudo
        </div>
      </button>

      <div className="w-px h-6 bg-white/10 mx-1"></div>

      {/* Basic Controls */}
      <AtlasResetViewButton />
      <AtlasFullscreenButton isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />
      
      {/* Help Modal Trigger */}
      <button 
        className="w-10 h-10 rounded-lg bg-[#151A23]/90 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors group relative ml-1"
      >
        <LineIcon name="help-circle" className="w-5 h-5" />
        <div className="absolute bottom-full right-0 mb-2 p-3 bg-[#0B0E14] border border-white/10 text-white rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-56">
          <p className="text-[10px] font-bold uppercase tracking-widest text-techTeal mb-2 border-b border-white/10 pb-1">Navegação 3D</p>
          <ul className="text-xs space-y-1.5 text-slate-300">
            <li><strong className="text-white">Click E + Arrastar:</strong> Orbitar</li>
            <li><strong className="text-white">Scroll:</strong> Zoom in/out</li>
            <li><strong className="text-white">Click D + Arrastar:</strong> Mover (Pan)</li>
            <li><strong className="text-white">Pinos:</strong> Focar estrutura</li>
          </ul>
        </div>
      </button>
    </div>
  );
}

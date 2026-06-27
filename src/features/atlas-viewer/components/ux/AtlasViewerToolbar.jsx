import React from 'react';
import LineIcon from '../../../../components/icons/LineIcon';
import AtlasFullscreenButton from './AtlasFullscreenButton';
import AtlasResetViewButton from './AtlasResetViewButton';
import AtlasQualityToggle from './AtlasQualityToggle';
import AtlasTooltip from './AtlasTooltip';

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
    <div className="absolute bottom-[env(safe-area-inset-bottom,16px)] sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-[#0B0E14]/70 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] max-w-[95vw] overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Markers Toggle */}
      <AtlasTooltip content={isMarkerPanelOpen ? "Fechar marcadores" : "Abrir marcadores"} position="top">
        <button 
          onClick={toggleMarkerPanel}
          className={`relative h-10 px-4 rounded-lg border transition-all flex items-center gap-2 ${
            isMarkerPanelOpen 
              ? 'bg-techTeal text-black border-techTeal shadow-[0_0_15px_rgba(35,210,179,0.3)]' 
              : 'bg-[#151A23]/90 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <LineIcon name="bookmark" className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Marcadores</span>
        </button>
      </AtlasTooltip>

      <div className="w-px h-6 bg-white/10 mx-1"></div>

      {/* Quality */}
      <AtlasQualityToggle qualityPreset={qualityPreset} setQualityPreset={setQualityPreset} />
      
      <div className="w-px h-6 bg-white/10 mx-1"></div>

      {/* Study Mode */}
      <AtlasTooltip content="Modo estudo" position="top">
        <button 
          onClick={toggleStudyMode}
          className={`h-10 px-3 rounded-lg border transition-all flex items-center gap-2 relative ${
            studyMode 
              ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
              : 'bg-[#151A23]/90 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </button>
      </AtlasTooltip>

      <div className="w-px h-6 bg-white/10 mx-1"></div>

      {/* Basic Controls */}
      <AtlasResetViewButton />
      <AtlasFullscreenButton isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />
      
      {/* Help Modal Trigger */}
      <AtlasTooltip 
        position="top"
        content={
          <div className="bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 text-white rounded-xl shadow-2xl p-4 w-64 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-techTeal mb-2 border-b border-white/10 pb-2">Navegação 3D</p>
            <ul className="text-xs space-y-1.5 text-slate-300">
              <li><strong className="text-white">Click E + Arrastar:</strong> Orbitar</li>
              <li><strong className="text-white">Scroll:</strong> Zoom in/out</li>
              <li><strong className="text-white">Click D + Arrastar:</strong> Mover (Pan)</li>
              <li><strong className="text-white">Pinos:</strong> Focar estrutura</li>
            </ul>
          </div>
        }
      >
        <button 
          className="w-10 h-10 rounded-lg bg-[#151A23]/90 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors relative ml-1"
        >
          <LineIcon name="help-circle" className="w-5 h-5" />
        </button>
      </AtlasTooltip>
    </div>
  );
}

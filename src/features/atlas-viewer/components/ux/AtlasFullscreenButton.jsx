import React from 'react';

export default function AtlasFullscreenButton({ isFullscreen, toggleFullscreen }) {
  return (
    <button 
      onClick={toggleFullscreen}
      className="w-10 h-10 rounded-lg bg-[#151A23]/90 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow-lg group relative"
      aria-label={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
    >
      {isFullscreen ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l-4 4m0 0l4 4m-4-4h14m-5-10v14" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l-5 5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
      )}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap w-max pointer-events-none transition-all shadow-xl z-[100] uppercase tracking-widest">
        {isFullscreen ? "Sair Tela Cheia" : "Tela Cheia"}
      </div>
    </button>
  );
}

import React from 'react';
import LineIcon from '../../../components/icons/LineIcon';
import { useAtlasViewer } from '../context/AtlasViewerContext';

export default function AtlasViewerControls() {
  const {
    autoRotate, setAutoRotate,
    showGrid, setShowGrid,
    clinicalLighting, setClinicalLighting,
    focusMode, setFocusMode,
    fullscreenPanel, setFullscreenPanel,
    handleResetCamera
  } = useAtlasViewer();

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-techTeal/30 rounded-full px-4 py-3 flex items-center gap-3 shadow-premium animate-fade-in-up">
      <button 
        onClick={handleResetCamera}
        className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
        title="Resetar Câmera"
      >
        <LineIcon name="crosshair" className="w-5 h-5 text-techTeal" />
      </button>

      <div className="w-px h-6 bg-white/10 mx-1"></div>

      <button 
        onClick={() => setAutoRotate(!autoRotate)}
        className={`p-2 rounded-full transition-colors ${autoRotate ? 'bg-techTeal/20 text-techTeal' : 'hover:bg-white/10 text-white'}`}
        title="Rotação Automática"
      >
        <LineIcon name="refresh-cw" className="w-5 h-5" />
      </button>

      <button 
        onClick={() => setShowGrid(!showGrid)}
        className={`p-2 rounded-full transition-colors ${showGrid ? 'bg-techTeal/20 text-techTeal' : 'hover:bg-white/10 text-white'}`}
        title="Grid de Referência"
      >
        <LineIcon name="grid" className="w-5 h-5" />
      </button>

      <button 
        onClick={() => setClinicalLighting(!clinicalLighting)}
        className={`p-2 rounded-full transition-colors ${clinicalLighting ? 'bg-techTeal/20 text-techTeal' : 'hover:bg-white/10 text-white'}`}
        title="Iluminação Clínica"
      >
        <LineIcon name="sun" className="w-5 h-5" />
      </button>

      <div className="w-px h-6 bg-white/10 mx-1"></div>

      <button 
        onClick={() => setFocusMode(!focusMode)}
        className={`p-2 rounded-full transition-colors ${focusMode ? 'bg-techTeal/20 text-techTeal' : 'hover:bg-white/10 text-white'}`}
        title="Modo Foco (Ocultar Painéis)"
      >
        <LineIcon name="maximize" className="w-5 h-5" />
      </button>
      
      <button 
        onClick={() => setFullscreenPanel(!fullscreenPanel)}
        className={`p-2 rounded-full transition-colors ${fullscreenPanel ? 'bg-techTeal/20 text-techTeal' : 'hover:bg-white/10 text-white'}`}
        title="Tela Cheia"
      >
        <LineIcon name="monitor" className="w-5 h-5" />
      </button>
    </div>
  );
}

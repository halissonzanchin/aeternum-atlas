import React, { useState } from 'react';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import { atlasViewerCommands } from './atlasViewerCommands';
import { useViewer } from '../../viewer/ViewerContext';

export default function AtlasAIViewerPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const viewerContext = useViewer();

  const handleCommand = (commandType, payload = null) => {
    switch (commandType) {
      case 'focusMarker':
        atlasViewerCommands.focusMarker(payload);
        break;
      case 'focusStructure':
        atlasViewerCommands.focusStructure(payload);
        break;
      case 'resetCamera':
        atlasViewerCommands.resetCamera();
        break;
      case 'openAnnotation':
        atlasViewerCommands.openAnnotation(payload);
        break;
      default:
        console.warn('Unknown AI command:', commandType);
    }
    setIsOpen(false);
  };

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3 fade-in-up">
      {isOpen && (
        <Card className="w-80 bg-blackDeep/90 backdrop-blur-md border border-techTeal/30 shadow-2xl shadow-techTeal/10 p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-techTeal/20 flex items-center justify-center border border-techTeal/40">
                <span className="text-techTeal font-bold text-sm">AI</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-clinicalWhite">Atlas AI Tutor</h3>
                <p className="text-[10px] uppercase tracking-wider text-techTeal">Em preparação</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">&times;</button>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="text-xs justify-start py-1.5 px-3 border-white/10 hover:border-techTeal hover:bg-techTeal/10 transition-colors" onClick={() => handleCommand('focusMarker', 'marker-8')}>
              "Explique o corpo caloso"
            </Button>
            <Button variant="outline" className="text-xs justify-start py-1.5 px-3 border-white/10 hover:border-techTeal hover:bg-techTeal/10 transition-colors" onClick={() => handleCommand('focusMarker', 'marker-1')}>
              "Mostre o cerebelo"
            </Button>
            <Button variant="outline" className="text-xs justify-start py-1.5 px-3 border-white/10 hover:border-techTeal hover:bg-techTeal/10 transition-colors" onClick={() => handleCommand('focusMarker', 'marker-2')}>
              "Onde fica o quarto ventrículo?"
            </Button>
            <Button variant="outline" className="text-xs justify-start py-1.5 px-3 border-white/10 hover:border-techTeal hover:bg-techTeal/10 transition-colors" onClick={() => handleCommand('resetCamera')}>
              "Como estudar o corte sagital do encéfalo?"
            </Button>

            <div className="h-px w-full bg-white/10 my-1"></div>

            <Button variant="outline" className="text-xs justify-start py-1.5 px-3 border-white/10 hover:border-white/30 text-textMuted hover:text-clinicalWhite transition-colors" onClick={() => handleCommand('resetCamera')}>
              "Voltar visão geral"
            </Button>
          </div>
        </Card>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-blackDeep border border-techTeal/40 shadow-[0_0_15px_rgba(45,212,191,0.2)] flex items-center justify-center hover:scale-105 hover:border-techTeal transition-all hover:shadow-[0_0_20px_rgba(45,212,191,0.4)]"
          title="Atlas AI Tutor"
        >
          <span className="text-techTeal font-bold text-lg">AI</span>
        </button>
      )}
    </div>
  );
}

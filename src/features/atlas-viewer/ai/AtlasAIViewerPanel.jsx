import React from 'react';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import { atlasViewerCommands } from './atlasViewerCommands';

export default function AtlasAIViewerPanel() {
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
  };

  return (
    <div className="absolute bottom-6 right-6 w-80 z-20 flex flex-col gap-3 fade-in-up">
      <Card className="bg-blackDeep/90 backdrop-blur-md border border-techTeal/30 shadow-2xl shadow-techTeal/10 p-4">
        <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
          <div className="w-8 h-8 rounded-full bg-techTeal/20 flex items-center justify-center border border-techTeal/40">
            <span className="text-techTeal font-bold text-sm">AI</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-clinicalWhite">Atlas AI Tutor</h3>
            <p className="text-[10px] uppercase tracking-wider text-techTeal">Mock Commands</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            className="text-xs justify-start py-1.5 px-3 border-white/10 hover:border-techTeal hover:bg-techTeal/10 transition-colors"
            onClick={() => handleCommand('focusMarker', 'marker-1')}
          >
            "Mostrar Útero"
          </Button>
          
          <Button 
            variant="outline" 
            className="text-xs justify-start py-1.5 px-3 border-white/10 hover:border-techTeal hover:bg-techTeal/10 transition-colors"
            onClick={() => handleCommand('focusMarker', 'marker-2')}
          >
            "Mostrar Colo do Útero"
          </Button>

          <div className="h-px w-full bg-white/10 my-1"></div>

          <Button 
            variant="outline" 
            className="text-xs justify-start py-1.5 px-3 border-white/10 hover:border-white/30 text-textMuted hover:text-clinicalWhite transition-colors"
            onClick={() => handleCommand('resetCamera')}
          >
            "Voltar visão geral"
          </Button>
        </div>
      </Card>
    </div>
  );
}

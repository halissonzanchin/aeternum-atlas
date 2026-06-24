import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import { anatomyLayerService } from './anatomyLayerService';

export default function AnatomyLayerPanel() {
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    // Initial fetch
    setLayers(anatomyLayerService.getAllLayers());

    // Subscribe to changes
    const unsubscribe = anatomyLayerService.subscribe((updatedLayers) => {
      setLayers(updatedLayers);
    });

    return unsubscribe;
  }, []);

  const handleToggleLayer = (layerId) => {
    anatomyLayerService.toggleLayer(layerId);
  };

  const handleShowOnlyLayer = (layerId) => {
    anatomyLayerService.showOnlyLayer(layerId);
  };

  const handleShowAll = () => {
    anatomyLayerService.showAllLayers();
  };

  return (
    <div className="absolute top-24 left-6 w-64 z-10 fade-in-up flex flex-col pointer-events-none">
      <Card className="bg-blackDeep/90 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto flex flex-col p-4">
        
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <h2 className="text-sm font-bold text-clinicalWhite">Camadas Anatômicas</h2>
          </div>
          <button 
            onClick={handleShowAll}
            className="text-[9px] uppercase tracking-wider text-techTeal hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {layers.map(layer => (
            <div key={layer.id} className="flex items-center justify-between group">
              <button 
                onClick={() => handleToggleLayer(layer.id)}
                className="flex items-center gap-3 text-xs text-clinicalWhite hover:text-techTeal transition-colors flex-1"
              >
                <div className={`w-3 h-3 rounded-sm flex items-center justify-center border transition-colors ${layer.visible ? 'bg-techTeal border-techTeal' : 'border-white/30'}`}>
                  {layer.visible && (
                    <svg className="w-2.5 h-2.5 text-blackDeep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${layer.colorTag}`}></span>
                  <span className={!layer.visible ? 'text-white/40' : ''}>{layer.name}</span>
                </span>
              </button>
              
              <button 
                onClick={() => handleShowOnlyLayer(layer.id)}
                className="opacity-0 group-hover:opacity-100 text-[9px] text-white/30 hover:text-white transition-all px-1.5 py-0.5 rounded bg-white/5"
                title={`Mostrar apenas ${layer.name}`}
              >
                Isolar
              </button>
            </div>
          ))}
        </div>

      </Card>
    </div>
  );
}

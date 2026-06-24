import React from 'react';
import LineIcon from '../../../components/icons/LineIcon';
import { useAtlasViewer } from '../context/AtlasViewerContext';

export default function AtlasStructureLayerPanel() {
  const { 
    layers, 
    hiddenLayers, 
    handleToggleLayerVisibility, 
    selectedLayer, 
    handleSelectLayer 
  } = useAtlasViewer();

  if (!layers || layers.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar mt-4 border-t border-white/5">
      <h3 className="text-sm font-bold text-white mb-4 px-2">Isolamento de Estruturas</h3>
      
      <div className="flex flex-col gap-2">
        {layers.map((layer) => {
          const isHidden = hiddenLayers.has(layer.layerId);
          const isSelected = selectedLayer?.layerId === layer.layerId;

          return (
            <div 
              key={layer.layerId}
              className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                isSelected 
                  ? 'bg-techTeal/10 border-techTeal/50 shadow-inner' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div 
                className="flex-1 cursor-pointer overflow-hidden"
                onClick={() => handleSelectLayer(layer)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: layer.highlightColor || '#ffffff', opacity: isHidden ? 0.3 : 1 }}
                  />
                  <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-techTeal' : (isHidden ? 'text-textMuted' : 'text-white')}`}>
                    {layer.structureName}
                  </h4>
                </div>
                {isSelected && (
                  <p className="text-[10px] text-textMuted mt-1 line-clamp-2 leading-relaxed">
                    {layer.description}
                  </p>
                )}
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLayerVisibility(layer.layerId);
                }}
                className={`p-2 rounded-lg shrink-0 transition-colors border ${
                  isHidden 
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                    : 'bg-white/5 text-textMuted border-transparent hover:bg-white/10 hover:text-white'
                }`}
                title={isHidden ? "Mostrar Estrutura" : "Ocultar Estrutura"}
              >
                <LineIcon name={isHidden ? "eye-off" : "eye"} className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';

export default function Admin3DMarkersEditor({ markers = [], onChange }) {
  
  const handleAddMarker = () => {
    const newMarker = {
      id: `marker-${Date.now()}`,
      title: "Nova Estrutura",
      description: "Descrição anatômica.",
      position: [0, 0, 0],
      cameraPosition: [1, 1, 1],
      target: [0, 0, 0]
    };
    onChange([...markers, newMarker]);
  };

  const handleRemoveMarker = (idToRemove) => {
    onChange(markers.filter(m => m.id !== idToRemove));
  };

  const handleUpdateMarker = (id, field, value) => {
    onChange(markers.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const parseArrayInput = (valueStr) => {
    try {
      const arr = JSON.parse(`[${valueStr}]`);
      if (Array.isArray(arr) && arr.length === 3) return arr;
      return [0, 0, 0];
    } catch {
      return [0, 0, 0];
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
        <div>
          <h2 className="text-xl font-bold text-clinicalWhite">Marcadores Anatômicos</h2>
          <p className="text-sm text-textMuted">Pontos de interesse interativos no espaço 3D.</p>
        </div>
        <Button variant="outline" onClick={handleAddMarker} className="text-sm py-1.5 px-3">
          + Adicionar Marcador
        </Button>
      </div>

      {markers.length === 0 ? (
        <div className="text-center py-6 text-textMuted border border-dashed border-white/10 rounded-lg">
          Nenhum marcador cadastrado.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {markers.map((marker, index) => (
            <div key={marker.id} className="bg-blackDeep/50 border border-white/10 p-4 rounded-lg relative group">
              <button 
                onClick={() => handleRemoveMarker(marker.id)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover Marcador"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-clinicalWhite">Título (Pino {index + 1})</label>
                  <input 
                    type="text" 
                    value={marker.title}
                    onChange={(e) => handleUpdateMarker(marker.id, 'title', e.target.value)}
                    className="bg-blackDeep border border-white/20 rounded-md px-2 py-1 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-clinicalWhite">Descrição Clínica</label>
                  <input 
                    type="text" 
                    value={marker.description}
                    onChange={(e) => handleUpdateMarker(marker.id, 'description', e.target.value)}
                    className="bg-blackDeep border border-white/20 rounded-md px-2 py-1 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-clinicalWhite">Position [x, y, z] (Malha)</label>
                  <input 
                    type="text" 
                    value={marker.position.join(', ')}
                    onChange={(e) => handleUpdateMarker(marker.id, 'position', parseArrayInput(e.target.value))}
                    className="bg-blackDeep border border-white/20 rounded-md px-2 py-1 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal font-mono"
                    placeholder="0, 1.5, -2"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-clinicalWhite">Camera Position [x, y, z]</label>
                  <input 
                    type="text" 
                    value={marker.cameraPosition.join(', ')}
                    onChange={(e) => handleUpdateMarker(marker.id, 'cameraPosition', parseArrayInput(e.target.value))}
                    className="bg-blackDeep border border-white/20 rounded-md px-2 py-1 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal font-mono"
                    placeholder="2, 2, 4"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-clinicalWhite">Target [x, y, z] (Foco)</label>
                  <input 
                    type="text" 
                    value={marker.target.join(', ')}
                    onChange={(e) => handleUpdateMarker(marker.id, 'target', parseArrayInput(e.target.value))}
                    className="bg-blackDeep border border-white/20 rounded-md px-2 py-1 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal font-mono"
                    placeholder="0, 0, 0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { useAtlasViewer } from '../../context/AtlasViewerContext';

export default function AtlasAuthoringPanel() {
  const { 
    isAuthoringMode, 
    modelId,
    draftMarkers,
    lastCapturedCoordinate,
    handleAddDraftMarker,
    handleRemoveDraftMarker 
  } = useAtlasViewer();

  const [formData, setFormData] = useState({
    label: '',
    anatomicalName: '',
    category: '',
    description: '',
    clinicalNote: '',
    difficulty: 'basic'
  });

  const [copySuccess, setCopySuccess] = useState(false);

  // Se não estiver em modo de autoria, não renderiza nada
  if (!isAuthoringMode) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMarker = () => {
    if (!lastCapturedCoordinate) {
      alert("Capture uma coordenada primeiro (Shift + Clique no modelo)");
      return;
    }
    
    if (!formData.label || !formData.anatomicalName) {
      alert("Label e Nome Anatômico são obrigatórios.");
      return;
    }

    const newMarker = {
      id: `draft_${Date.now()}`,
      modelSlug: modelId,
      label: formData.label,
      anatomicalName: formData.anatomicalName,
      category: formData.category,
      description: formData.description,
      clinicalNote: formData.clinicalNote,
      difficulty: formData.difficulty,
      position: lastCapturedCoordinate.point,
      normal: lastCapturedCoordinate.normal,
      cameraTarget: lastCapturedCoordinate.point, // Inicialmente foca no próprio ponto
      cameraPosition: lastCapturedCoordinate.cameraPos,
      status: "draft"
    };

    handleAddDraftMarker(newMarker);

    // Resetar form mantendo categoria e dificuldade para acelerar o processo
    setFormData(prev => ({
      ...prev,
      label: '',
      anatomicalName: '',
      description: '',
      clinicalNote: ''
    }));
  };

  const handleExportJson = () => {
    const exportData = {
      modelSlug: modelId,
      generatedAt: new Date().toISOString(),
      authoringVersion: "8.10B",
      markers: draftMarkers
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    navigator.clipboard.writeText(jsonString)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        // Fallback em caso de erro no clipboard
        alert("Falha ao copiar. O JSON será impresso no console.");
        console.log(jsonString);
      });
  };

  return (
    <div className="absolute top-20 right-4 w-80 bg-black/90 backdrop-blur border border-techTeal/30 rounded-xl p-4 flex flex-col gap-4 text-sm z-[9999] shadow-2xl max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h2 className="text-techTeal font-bold uppercase tracking-wider text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-techTeal animate-pulse"></span>
          Modo Autoria de Marcadores
        </h2>
        <span className="text-white/50 text-[10px]">8.10B</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="bg-white/5 p-2 rounded border border-white/10">
          <p className="text-[10px] text-white/50 mb-1 uppercase tracking-wider">Última Captura</p>
          {lastCapturedCoordinate ? (
            <div className="text-xs text-white/80 font-mono flex flex-col gap-1">
              <span>Pos: {lastCapturedCoordinate.point.map(n => n.toFixed(2)).join(', ')}</span>
              <span>Norm: {lastCapturedCoordinate.normal.map(n => n.toFixed(2)).join(', ')}</span>
            </div>
          ) : (
            <p className="text-xs text-yellow-500/80 italic">Nenhuma coordenada capturada. (Shift + Clique)</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input type="text" name="label" value={formData.label} onChange={handleChange} placeholder="Label (ex: S, C, 1)" className="bg-black/50 border border-white/20 rounded p-1.5 text-white placeholder-white/30 focus:border-techTeal outline-none" />
          <input type="text" name="anatomicalName" value={formData.anatomicalName} onChange={handleChange} placeholder="Nome Anatômico (obrigatório)" className="bg-black/50 border border-white/20 rounded p-1.5 text-white placeholder-white/30 focus:border-techTeal outline-none" />
          <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Categoria (ex: Ossos, Vasos)" className="bg-black/50 border border-white/20 rounded p-1.5 text-white placeholder-white/30 focus:border-techTeal outline-none" />
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" rows={2} className="bg-black/50 border border-white/20 rounded p-1.5 text-white placeholder-white/30 focus:border-techTeal outline-none resize-none" />
          <textarea name="clinicalNote" value={formData.clinicalNote} onChange={handleChange} placeholder="Nota Clínica (opcional)" rows={2} className="bg-black/50 border border-white/20 rounded p-1.5 text-white placeholder-white/30 focus:border-techTeal outline-none resize-none" />
          
          <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="bg-black/50 border border-white/20 rounded p-1.5 text-white focus:border-techTeal outline-none">
            <option value="basic">Básico</option>
            <option value="intermediate">Intermediário</option>
            <option value="advanced">Avançado</option>
          </select>
        </div>

        <button 
          onClick={handleSaveMarker}
          disabled={!lastCapturedCoordinate}
          className="bg-techTeal/20 hover:bg-techTeal/30 text-techTeal border border-techTeal/50 py-2 rounded font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ADICIONAR MARCADOR DRAFT
        </button>
      </div>

      <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider">Drafts ({draftMarkers.length})</h3>
          {draftMarkers.length > 0 && (
            <button 
              onClick={handleExportJson}
              className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
            >
              {copySuccess ? "COPIADO!" : "COPIAR JSON"}
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
          {draftMarkers.length === 0 ? (
            <p className="text-[10px] text-white/30 italic text-center py-2">Nenhum marcador criado.</p>
          ) : (
            draftMarkers.map(marker => (
              <div key={marker.id} className="flex items-center justify-between bg-white/5 p-1.5 rounded border border-white/10 text-[10px]">
                <span className="text-white/80 truncate w-3/4">{marker.label} - {marker.anatomicalName}</span>
                <button 
                  onClick={() => handleRemoveDraftMarker(marker.id)}
                  className="text-red-400 hover:text-red-300 font-bold px-1"
                >
                  X
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

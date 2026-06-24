import React, { useState, useEffect, useRef } from 'react';
import { atlasAnnotationCmsService } from '../../services/atlasAnnotationCmsService';
import { atlasAssetStorageService } from '../../services/atlasAssetStorageService';
import { getModelByIdForUser } from '../../services/modelService';
import AtlasViewer from '../atlas-viewer/AtlasViewer';
import AeternumLogo from '../../components/AeternumLogo';
import { atlasViewerCommands } from '../atlas-viewer/ai/atlasViewerCommands';

class ViewerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Atlas Viewer Render Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#0B0F14]">
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-lg text-center max-w-md">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-bold text-red-400 mb-2">Falha Crítica no Renderizador</h2>
            <p className="text-sm text-white/70">O modelo 3D causou um crash na engine. Verifique o formato do arquivo ou tente recarregá-lo.</p>
            <button onClick={() => this.setState({ hasError: false })} className="mt-4 bg-white/10 text-white px-4 py-2 rounded">Tentar Novamente</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AtlasNativeModelEditorPage({ modelId, navigate }) {
  const routeIdentifier = modelId; // Can be slug or UUID
  const [modelUuid, setModelUuid] = useState(null);
  const [modelRecord, setModelRecord] = useState(null);
  const [uuidResolved, setUuidResolved] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);

  const [markers, setMarkers] = useState([]);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'position' | 'camera'
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'add' | 'move' | 'remove' | 'camera'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDebugDrawer, setShowDebugDrawer] = useState(false);
  const viewerRef = useRef(null);
  const containerRef = useRef(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const { resolveModelIdentity } = await import('../../services/modelService');
        const identity = await resolveModelIdentity(routeIdentifier, null, { includeInactive: true });
        
        if (identity.modelRecord) {
          setModelRecord(identity.modelRecord);
          setIsTemporary(identity.isTemporary);
          
          if (identity.isUuidResolved && identity.modelUuid) {
            setModelUuid(identity.modelUuid);
            setUuidResolved(true);
            
            try {
              const savedMarkers = await atlasAssetStorageService.loadAnnotations(identity.modelUuid);
              if (savedMarkers && savedMarkers.length > 0) {
                setMarkers(savedMarkers);
              } else if (identity.modelRecord.markers && identity.modelRecord.markers.length > 0) {
                setMarkers(identity.modelRecord.markers);
              }
            } catch (markerErr) {
              console.error("Erro ao carregar anotações usando UUID", markerErr);
            }
          } else {
            setUuidResolved(false);
            // Fallback try for preview only, using whatever identifier we have
            const fallbackMarkers = atlasAnnotationCmsService.getMarkers(routeIdentifier);
            if (fallbackMarkers && fallbackMarkers.length > 0) {
              setMarkers(fallbackMarkers);
            }
          }
        } else {
          setError("Modelo não encontrado na base de dados (CMS nem Local).");
        }
      } catch (err) {
        console.error("Erro ao carregar modelo para editor:", err);
        setError("Erro fatal ao resolver identidade do modelo.");
      }
    };
    loadModel();
  }, [routeIdentifier]);

  const handleAddMarker = (intersection = null) => {
    if (!uuidResolved || isTemporary) {
      alert("Operação bloqueada: Modelo precisa ter um UUID real no banco para salvar marcadores.");
      return;
    }
    const position = intersection ? [intersection.point.x, intersection.point.y, intersection.point.z] : null;
    
    // Captura a visão de câmera atual para atrelar ao novo marcador
    let cameraPosition = null;
    let cameraTarget = null;
    let cameraData = null;
    
    if (viewerRef.current) {
      const state = viewerRef.current.getCameraState();
      if (state) {
        cameraPosition = [state.position.x, state.position.y, state.position.z];
        cameraTarget = [state.target.x, state.target.y, state.target.z];
        cameraData = { position: cameraPosition, target: cameraTarget };
      }
    }

    const newMarker = atlasAnnotationCmsService.addMarker(modelUuid, {
      title: "Novo Marcador",
      description: "Descrição anatômica da estrutura selecionada.",
      anatomicalStructure: "",
      order: markers.length + 1,
      active: true,
      coordinateStatus: "synthetic_baseline",
      requiresManualValidation: true,
      position: position,
      camera: cameraData,
      cameraPosition: cameraPosition, // retrocompatibilidade
      target: cameraTarget // retrocompatibilidade
    });
    setMarkers(atlasAnnotationCmsService.getMarkers(modelUuid));
    setActiveMarkerId(newMarker.id);
  };

  const handleUpdateMarker = (id, field, value) => {
    if (!uuidResolved) return;
    atlasAnnotationCmsService.updateMarker(modelUuid, id, { [field]: value });
    setMarkers(atlasAnnotationCmsService.getMarkers(modelUuid));
  };

  const handleRemoveMarker = (id) => {
    if (!uuidResolved) return;
    atlasAnnotationCmsService.removeMarker(modelUuid, id);
    setMarkers(atlasAnnotationCmsService.getMarkers(modelUuid));
    if (activeMarkerId === id) setActiveMarkerId(null);
  };

  const handleModelClick = (intersection) => {
    if (activeTool === 'add') {
      handleAddMarker(intersection);
      setActiveTool('select'); // Volta pro select automaticamente após adicionar
      return;
    }
    
    if (!activeMarkerId) return;

    if (activeTool === 'move') {
      const { point } = intersection;
      handleUpdateMarker(activeMarkerId, 'position', [point.x, point.y, point.z]);
      setActiveTool('select');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSaveCameraView = () => {
    if (!activeMarkerId || !viewerRef.current) return;
    const { position, target } = viewerRef.current.getCameraState();
    const cameraObj = {
      position: [position.x, position.y, position.z],
      target: [target.x, target.y, target.z]
    };
    handleUpdateMarker(activeMarkerId, 'camera', cameraObj);
    // Backward compatibility for old code expecting flat arrays
    handleUpdateMarker(activeMarkerId, 'cameraPosition', [position.x, position.y, position.z]);
    handleUpdateMarker(activeMarkerId, 'target', [target.x, target.y, target.z]);
  };

  const handleTestCamera = () => {
    if (!activeMarkerId || !viewerRef.current || !activeMarker) return;
    viewerRef.current.flyToMarker(activeMarker);
  };

  const handleSyncToCloud = async () => {
    if (!uuidResolved || !modelUuid) {
      alert(`Erro Crítico: Modelo ainda não possui UUID real no banco de dados.\n\nVolte ao CMS e clique em 'Salvar' para que o sistema gere o ID oficial antes de enviar marcações.\n\nModel ID usado: ${routeIdentifier}`);
      return;
    }

    setIsSyncing(true);
    const result = await atlasAssetStorageService.syncAnnotationsToSupabase(modelUuid);
    
    if (result && result.success) {
      alert("Anotações salvas com sucesso na nuvem!");
    } else {
      let errorMsg = "Houve um erro ao salvar as anotações.";
      if (result && result.error) {
        if (typeof result.error === 'string') {
          errorMsg = result.error;
        } else if (result.error.message) {
          errorMsg = `Erro do Banco: ${result.error.message}\nCódigo: ${result.error.code || 'N/A'}\nDetalhes: ${result.error.details || 'N/A'}`;
        }
      }
      alert(`${errorMsg}\n\nModel ID usado: ${modelUuid}`);
    }
    setIsSyncing(false);
  };

  const isLoading = !modelRecord && !error;
  const displayModel = modelRecord || { title: "Modelo Desconhecido" };
  const modelUrl = modelRecord?.atlasAssetPublicUrl || modelRecord?.atlasAssetObjectUrl || modelRecord?.atlasEngineModelUrl || modelRecord?.model_url || "";
  const modelFormat = modelRecord?.modelFormat || modelRecord?.model_format || "glb";

  const activeMarker = markers.find(m => m.id === activeMarkerId);
  const uuidError = modelRecord && !uuidResolved && !isTemporary;
  const routeSlug = routeIdentifier;

  useEffect(() => {
    if (modelUrl) {
      console.log(`[Diagnostic] AtlasNativeModelEditorPage recebeu modelUrl: ${modelUrl}`);
      console.log(`[Diagnostic] AtlasNativeModelEditorPage recebeu modelFormat: ${modelFormat}`);
    }
  }, [modelUrl, modelFormat]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex flex-col w-full h-full bg-[#0B0F14] overflow-hidden font-inter text-clinicalWhite">
      {/* GLOBAL HEADER - Altura fixa 64px, compacto */}
      <header className="h-[64px] shrink-0 bg-[#111620] border-b border-white/5 flex items-center justify-between px-6 z-40 shadow-md">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <AeternumLogo variant="symbol" size="sm" theme="dark" />
            <span className="font-bold tracking-widest text-sm text-clinicalWhite hidden sm:inline-block">AETERNUM</span>
          </div>
          <div className="h-5 w-px bg-white/10 shrink-0"></div>
          
          <button 
            onClick={() => navigate('/super-admin/models-3d')}
            className="text-sm font-medium text-textMuted hover:text-white transition-colors flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="hidden lg:inline-block">Voltar</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 px-4">
          <h1 className="text-sm font-semibold text-clinicalWhite tracking-wide uppercase truncate max-w-full">{displayModel.title}</h1>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <button 
            onClick={() => window.location.href = `/viewer/${routeIdentifier}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <span className="hidden sm:inline-block">Testar no Viewer</span>
          </button>
          
          <button 
            onClick={handleSyncToCloud}
            disabled={isSyncing || isLoading || !!error || !uuidResolved}
            className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold text-xs transition-colors ${uuidResolved ? 'bg-techTeal text-black hover:bg-teal-400' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
            title={!uuidResolved ? "O modelo não possui UUID real no banco de dados." : ""}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            {isSyncing ? "Salvando..." : "Salvar Marcadores"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* COLUNA 1: Marker Sidebar */}
        <aside className="w-[320px] shrink-0 bg-[#111620] border-r border-white/5 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#151A23]">
            <h2 className="text-xs font-bold text-techTeal uppercase tracking-widest">MARCADORES ({markers.length})</h2>
            <button 
              onClick={() => setActiveTool('add')}
              disabled={isLoading || !!error}
              className="flex items-center gap-1 text-techTeal text-xs font-semibold px-3 py-1.5 rounded bg-techTeal/10 hover:bg-techTeal/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              Adicionar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
            {isLoading && <p className="text-white/30 text-center text-xs py-4">Carregando lista...</p>}
            
            {markers.map((marker, idx) => {
              const isActive = activeMarkerId === marker.id;
              return (
                <div 
                  key={marker.id} 
                  className={`group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isActive ? 'bg-techTeal/10 border-techTeal shadow-[0_0_15px_rgba(22,199,154,0.15)]' : 'bg-[#151A23] border-white/5 hover:border-white/20'}`}
                  onClick={() => setActiveMarkerId(marker.id)}
                >
                  <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border ${isActive ? 'bg-techTeal text-black border-techTeal' : 'bg-transparent text-textMuted border-white/20 group-hover:border-white/40'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{marker.title || 'Sem Título'}</p>
                    <p className="text-[10px] text-textMuted truncate mt-0.5">{marker.anatomicalStructure || 'Estrutura não definida'}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-400 hover:text-white" title="Visibilidade">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button className="text-slate-400 cursor-grab" title="Reordenar">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/5 bg-[#151A23]">
            <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-xs text-[#D4AF37]/90 flex gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="font-semibold mb-1">Dica de Curadoria</p>
                <p className="opacity-80">Clique no modelo 3D para posicionar um marcador. Arraste os itens para reordenar.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* COLUNA 2: Atlas Viewer Center */}
        <main className="flex-1 relative flex flex-col bg-[#0B0F14]">
          
          {/* Alerta de Erro de UUID */}
          {uuidError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg">
              <div className="bg-red-500/90 backdrop-blur-md text-white px-5 py-3 rounded-lg shadow-xl border border-red-400 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>Modelo não encontrado no banco de dados</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Não foi possível resolver um <strong>UUID real</strong> para o slug <code>{routeSlug}</code>. 
                  Isso significa que o registro oficial não está no Supabase ou ocorreu um erro de sincronização.
                </p>
                <p className="text-xs font-semibold bg-black/20 p-2 rounded mt-1">
                  Volte ao CMS e clique em 'Salvar' no modelo para vinculá-lo antes de salvar marcações.
                </p>
              </div>
            </div>
          )}

          {/* Floating Toolbar - Top 88px */}
          <div className="absolute top-[24px] left-1/2 -translate-x-1/2 z-30 flex flex-row items-center gap-2 bg-[#151A23]/95 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-2xl whitespace-nowrap overflow-x-auto max-w-full">
            <button 
              onClick={() => setActiveTool('select')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTool === 'select' ? 'bg-techTeal/20 text-techTeal border border-techTeal/30 shadow-[0_0_10px_rgba(22,199,154,0.1)]' : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              Selecionar
            </button>
            <div className="w-px h-4 bg-white/20"></div>
            <button 
              onClick={() => setActiveTool('add')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTool === 'add' ? 'bg-techTeal/20 text-techTeal border border-techTeal/30 shadow-[0_0_10px_rgba(22,199,154,0.1)]' : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Adicionar
            </button>
            <div className="w-px h-4 bg-white/20"></div>
            <button 
              onClick={() => setActiveTool('move')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTool === 'move' ? 'bg-techTeal/20 text-techTeal border border-techTeal/30 shadow-[0_0_10px_rgba(22,199,154,0.1)]' : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Mover
            </button>
            <button 
              onClick={() => {
                if (activeMarkerId) {
                  handleRemoveMarker(activeMarkerId);
                  setActiveTool('select');
                } else {
                  alert("Selecione um marcador primeiro para remover.");
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Remover
            </button>
            <div className="w-px h-4 bg-white/20"></div>
            <button 
              onClick={() => {
                setActiveTool('camera');
                handleSaveCameraView();
                setTimeout(() => setActiveTool('select'), 500); // Voltar pro modo anterior visualmente logo após salvar a visão
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTool === 'camera' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
              Câmera
            </button>
          </div>

          <ViewerErrorBoundary>
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-techTeal border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/70 font-mono text-sm uppercase tracking-widest">Iniciando Motor 3D...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-lg text-center max-w-md">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h2 className="text-lg font-bold text-red-400 mb-2">Falha no Carregamento</h2>
                  <p className="text-sm text-white/70">{error}</p>
                </div>
              </div>
            ) : !modelUrl ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-lg text-center max-w-md">
                  <svg className="w-12 h-12 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h2 className="text-lg font-bold text-amber-400 mb-2">Arquivo Ausente ou Inválido</h2>
                  <p className="text-sm text-white/70">Este modelo anatômico não possui um arquivo 3D atrelado. Retorne à edição e faça o upload de um modelo .glb, .gltf ou .obj antes de abrir o editor.</p>
                </div>
              </div>
            ) : (
                <AtlasViewer 
                  ref={viewerRef}
                  modelUrl={modelUrl}
                  modelFormat={modelFormat}
                  markers={markers}
                  onMarkerSelect={setActiveMarkerId}
                  onModelClick={handleModelClick}
                  editMode={true}
                  activeTool={activeTool}
                  showStats={showStats}
                />
            )}
          </ViewerErrorBoundary>

          {/* Bottom Hint */}
          <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-lg px-4">
            <div className="bg-[#151A23]/95 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center justify-center gap-3 shadow-2xl mx-auto">
              <svg className="w-4 h-4 text-techTeal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs font-medium text-white/90 text-center">
                {activeTool === 'select' && "Selecione um marcador ou arraste o mouse para orbitar."}
                {activeTool === 'add' && "Clique em qualquer ponto do modelo 3D para fixar um novo marcador."}
                {activeTool === 'move' && "Selecione um marcador e clique no modelo para reposicioná-lo."}
                {activeTool === 'camera' && "Posicione a visão desejada e salve o ângulo da câmera."}
                {activeTool === 'remove' && "Aguardando ação de remoção."}
              </span>
            </div>
          </div>
          
          {/* HUD Tools Right Bottom */}
          <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
            <button 
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-lg bg-[#151A23]/90 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow-lg"
              title="Tela Cheia"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l-4 4m0 0l4 4m-4-4h14m-5-10v14" /></svg> // Simplified exit icon
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              )}
            </button>
            <button 
              onClick={() => atlasViewerCommands.dispatch({ type: 'RESET_CAMERA' })}
              className="w-10 h-10 rounded-lg bg-[#151A23]/90 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow-lg"
              title="Resetar Câmera"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>
          
          {/* Floating Dev Button */}
          <button 
            onClick={() => setShowDebugDrawer(!showDebugDrawer)}
            className="absolute top-[24px] right-6 z-30 flex items-center gap-2 bg-[#151A23]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Dev
          </button>

          {/* EDITOR_DEBUG_PANEL - Drawer */}
          <div className={`absolute top-[64px] right-6 z-30 transition-all duration-300 transform ${showDebugDrawer ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-12 opacity-0 pointer-events-none'}`}>
            <div className="bg-black/95 backdrop-blur-xl border border-techTeal/30 p-4 rounded-xl text-xs font-mono text-techTeal flex flex-col gap-3 w-64 shadow-[0_0_30px_rgba(22,199,154,0.15)]">
              <div className="flex justify-between items-center border-b border-techTeal/30 pb-2">
                <span className="font-bold text-white uppercase tracking-widest">Debug Console</span>
                <button onClick={() => setShowDebugDrawer(false)} className="text-slate-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex flex-col gap-2 opacity-80">
                <div className="flex justify-between"><span>routeSlug:</span><span className="text-white truncate max-w-[120px]" title={routeSlug}>{routeSlug}</span></div>
                <div className="flex justify-between"><span>modelUuid:</span><span className="text-white truncate max-w-[120px]" title={modelUuid}>{modelUuid || 'null'}</span></div>
                <div className="flex justify-between"><span>uuidResolved:</span><span className={uuidResolved ? 'text-techTeal' : 'text-red-400'}>{uuidResolved ? 'true' : 'false'}</span></div>
                <div className="flex justify-between"><span>Tool:</span><span className="text-white">{activeTool}</span></div>
                <div className="flex justify-between"><span>Markers:</span><span className="text-white">{markers.length}</span></div>
                <div className="flex justify-between"><span>Selected:</span><span className="text-white truncate max-w-[100px]">{activeMarkerId || 'none'}</span></div>
              </div>
              <div className="border-t border-techTeal/30 pt-3 mt-1">
                <button 
                  onClick={() => setShowStats(!showStats)} 
                  className={`w-full py-2 text-center border rounded transition-colors font-bold ${showStats ? 'bg-techTeal text-black border-techTeal' : 'border-techTeal text-techTeal hover:bg-techTeal/10'}`}
                >
                  {showStats ? 'Desativar Monitor FPS' : 'Ativar Monitor FPS'}
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* COLUNA 3: Properties Panel */}
        {activeMarker && (
          <aside className="w-[360px] shrink-0 bg-[#111620] border-l border-white/5 flex flex-col z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.2)]">
            <div className="p-5 border-b border-white/5 bg-[#151A23]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MARCADOR SELECIONADO</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-techTeal text-black font-bold flex items-center justify-center text-sm">
                      {markers.findIndex(m => m.id === activeMarkerId) + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-clinicalWhite">{activeMarker.title || 'Sem Título'}</p>
                      <p className="text-[10px] text-textMuted">{activeMarker.anatomicalStructure || 'Estrutura não definida'}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveMarker(activeMarkerId)}
                  className="w-8 h-8 rounded border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              {/* TABS */}
              <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 pb-2 text-[10px] sm:text-xs font-bold tracking-wide transition-colors border-b-2 ${activeTab === 'info' ? 'border-techTeal text-techTeal' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  INFORMAÇÕES
                </button>
                <button 
                  onClick={() => setActiveTab('position')}
                  className={`flex-1 pb-2 text-[10px] sm:text-xs font-bold tracking-wide transition-colors border-b-2 ${activeTab === 'position' ? 'border-techTeal text-techTeal' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  POSIÇÃO
                </button>
                <button 
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 pb-2 text-[10px] sm:text-xs font-bold tracking-wide transition-colors border-b-2 ${activeTab === 'camera' ? 'border-techTeal text-techTeal' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                  CÂMERA
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#0B0F14]">
              {activeTab === 'info' && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="marker-title" className="text-xs font-semibold text-slate-300">Título <span className="text-techTeal">*</span></label>
                    <input 
                      id="marker-title"
                      name="marker-title"
                      type="text" 
                      value={activeMarker.title}
                      onChange={(e) => handleUpdateMarker(activeMarkerId, 'title', e.target.value)}
                      className="bg-[#151A23] border border-white/10 rounded-md px-3 py-2 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal focus:ring-1 focus:ring-techTeal transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="marker-description" className="text-xs font-semibold text-slate-300">Descrição <span className="text-techTeal">*</span></label>
                    <textarea 
                      id="marker-description"
                      name="marker-description"
                      value={activeMarker.description}
                      onChange={(e) => handleUpdateMarker(activeMarkerId, 'description', e.target.value)}
                      className="bg-[#151A23] border border-white/10 rounded-md px-3 py-2 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal focus:ring-1 focus:ring-techTeal transition-all min-h-[120px] resize-y"
                    />
                    <div className="text-right text-[10px] text-slate-500">{activeMarker.description?.length || 0}/500</div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="marker-category" className="text-xs font-semibold text-slate-300">Categoria</label>
                    <select 
                      id="marker-category"
                      name="marker-category"
                      value={activeMarker.category || 'Geral'}
                      onChange={(e) => handleUpdateMarker(activeMarkerId, 'category', e.target.value)}
                      className="bg-[#151A23] border border-white/10 rounded-md px-3 py-2 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal focus:ring-1 focus:ring-techTeal transition-all appearance-none"
                    >
                      <option value="Geral">Geral</option>
                      <option value="Anatomia">Anatomia</option>
                      <option value="Patologia">Patologia</option>
                      <option value="Fisiologia">Fisiologia</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="marker-system" className="text-xs font-semibold text-slate-300">Sistema Anatômico</label>
                    <select 
                      id="marker-system"
                      name="marker-system"
                      value={activeMarker.anatomicalSystem || ''}
                      onChange={(e) => handleUpdateMarker(activeMarkerId, 'anatomicalSystem', e.target.value)}
                      className="bg-[#151A23] border border-white/10 rounded-md px-3 py-2 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal focus:ring-1 focus:ring-techTeal transition-all appearance-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="Sistema Nervoso">Sistema Nervoso</option>
                      <option value="Sistema Esquelético">Sistema Esquelético</option>
                      <option value="Sistema Muscular">Sistema Muscular</option>
                      <option value="Sistema Cardiovascular">Sistema Cardiovascular</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="marker-structure" className="text-xs font-semibold text-slate-300">Estrutura Anatômica</label>
                    <input 
                      id="marker-structure"
                      name="marker-structure"
                      type="text" 
                      value={activeMarker.anatomicalStructure || ''}
                      onChange={(e) => handleUpdateMarker(activeMarkerId, 'anatomicalStructure', e.target.value)}
                      placeholder="Ex: Corpo Caloso"
                      className="bg-[#151A23] border border-white/10 rounded-md px-3 py-2 text-sm text-clinicalWhite focus:outline-none focus:border-techTeal focus:ring-1 focus:ring-techTeal transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Cor do Marcador</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={activeMarker.color || '#16c79a'}
                        onChange={(e) => handleUpdateMarker(activeMarkerId, 'color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input 
                        type="text" 
                        value={activeMarker.color || '#16c79a'}
                        onChange={(e) => handleUpdateMarker(activeMarkerId, 'color', e.target.value)}
                        className="flex-1 bg-[#151A23] border border-white/10 rounded-md px-3 py-2 text-sm text-clinicalWhite font-mono focus:outline-none focus:border-techTeal"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <button className="flex justify-between items-center w-full text-left">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">INFORMAÇÕES TÉCNICAS</h3>
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className="mt-3 flex flex-col gap-2 text-xs font-mono text-slate-400 bg-black/50 p-3 rounded border border-white/5">
                      <p>ID: {activeMarker.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'position' && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center bg-[#151A23] p-3 rounded-lg border border-white/5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Ordem</label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleUpdateMarker(activeMarkerId, 'order', Math.max((activeMarker.order || 1) - 1, 1))} className="w-6 h-6 rounded bg-white/5 flex items-center justify-center hover:bg-white/10">-</button>
                        <span className="text-sm font-mono">{activeMarker.order || 0}</span>
                        <button onClick={() => handleUpdateMarker(activeMarkerId, 'order', (activeMarker.order || 0) + 1)} className="w-6 h-6 rounded bg-white/5 flex items-center justify-center hover:bg-white/10">+</button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <label className="text-xs font-semibold text-slate-300">Visível no Início</label>
                      <div 
                        onClick={() => handleUpdateMarker(activeMarkerId, 'visible', !activeMarker.visible)}
                        className={`w-10 h-5 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${activeMarker.visible !== false ? 'bg-techTeal' : 'bg-slate-700'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${activeMarker.visible !== false ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">POSIÇÃO DO MARCADOR (XYZ)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" step="0.1" value={activeMarker.position?.[0] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                      <input type="number" step="0.1" value={activeMarker.position?.[1] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                      <input type="number" step="0.1" value={activeMarker.position?.[2] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'camera' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">POSIÇÃO DA CÂMERA (XYZ)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" step="0.1" value={activeMarker.camera?.position?.[0] || activeMarker.cameraPosition?.[0] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                      <input type="number" step="0.1" value={activeMarker.camera?.position?.[1] || activeMarker.cameraPosition?.[1] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                      <input type="number" step="0.1" value={activeMarker.camera?.position?.[2] || activeMarker.cameraPosition?.[2] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">ALVO DA CÂMERA (XYZ)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" step="0.1" value={activeMarker.camera?.target?.[0] || activeMarker.target?.[0] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                      <input type="number" step="0.1" value={activeMarker.camera?.target?.[1] || activeMarker.target?.[1] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                      <input type="number" step="0.1" value={activeMarker.camera?.target?.[2] || activeMarker.target?.[2] || 0} onChange={() => {}} className="bg-[#151A23] border border-white/10 rounded text-center py-1.5 text-sm font-mono text-white focus:border-techTeal focus:outline-none" />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <button onClick={handleSaveCameraView} className="w-full bg-techTeal/10 border border-techTeal/30 text-techTeal hover:bg-techTeal hover:text-black font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Capturar Posição Atual
                    </button>
                    
                    <button onClick={handleTestCamera} className="w-full bg-[#151A23] border border-white/5 hover:border-white/20 text-sm py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Testar Voo da Câmera
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

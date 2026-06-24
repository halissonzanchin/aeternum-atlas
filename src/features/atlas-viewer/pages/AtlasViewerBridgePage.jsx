import React, { useState, useEffect } from 'react';
import LineIcon from '../../../components/icons/LineIcon';
import { getSession } from '../../../utils/atlasInteractionAnalytics';
import { atlasEventBus } from '../engine/atlasEngineEvents';
import { AtlasViewerProvider, useAtlasViewer } from '../context/AtlasViewerContext';

import AtlasViewerCanvas from '../components/AtlasViewerCanvas';
import AtlasViewerControls from '../components/AtlasViewerControls';
import AtlasStructureLayerPanel from '../components/AtlasStructureLayerPanel';
import AtlasAiTutorPanel from '../components/AtlasAiTutorPanel';

// Painel B2B Diagnóstico e Analytics
function AtlasDiagnosticsPanel() {
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false);
  const { modelId, isLoaded, annotations, layers, selectedAnnotation, selectedLayer } = useAtlasViewer();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Intercepta eventos em tempo real para o painel
    const unsubSelect = atlasEventBus.on('ANNOTATION_SELECTED', (e) => {
      setEvents(prev => [...prev, { time: new Date().toISOString(), desc: `Anotação Selecionada: ${e.annotation.title}` }].slice(-5));
    });
    const unsubStruct = atlasEventBus.on('STRUCTURE_SELECTED', (e) => {
      setEvents(prev => [...prev, { time: new Date().toISOString(), desc: `Estrutura Selecionada: ${e.layer.structureName}` }].slice(-5));
    });

    const interval = setInterval(() => {
      setSession(getSession());
    }, 1000);

    return () => {
      unsubSelect();
      unsubStruct();
      clearInterval(interval);
    };
  }, []);

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[999] bg-black/80 backdrop-blur text-[10px] text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full font-mono shadow-lg hover:bg-black transition-colors"
      >
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Atlas Diagnostics
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[999] bg-black/95 backdrop-blur-xl border border-green-500/30 rounded-xl shadow-2xl p-4 w-80 font-mono animate-fade-in-up">
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h3 className="text-xs text-green-400 font-bold uppercase tracking-widest flex items-center gap-2">
          <LineIcon name="terminal" className="w-4 h-4" /> Atlas Diagnostics
        </h3>
        <button onClick={() => setOpen(false)} className="text-textMuted hover:text-white">
          <LineIcon name="x" className="w-4 h-4" />
        </button>
      </div>
      
      <div className="text-[10px] text-textMuted space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between">
          <span>Sessão:</span> <span className="text-white">{session ? session.sessionId.split('_')[2] : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Modelo:</span> <span className="text-white">{modelId}</span>
        </div>
        <div className="flex justify-between">
          <span>Status do Motor:</span> 
          <span className={isLoaded ? "text-green-400" : "text-amber-400"}>{isLoaded ? 'RENDERIZADO' : 'CARREGANDO'}</span>
        </div>
        <div className="flex justify-between">
          <span>Anotações / Estruturas:</span> <span className="text-white">{annotations.length} / {layers.length}</span>
        </div>
        
        {(selectedAnnotation || selectedLayer) && (
          <div className="bg-techTeal/10 p-2 rounded mt-2 text-techTeal border border-techTeal/20">
            Foco Atual: {selectedAnnotation ? selectedAnnotation.title : selectedLayer?.structureName}
          </div>
        )}

        <div className="flex justify-between font-bold text-techTeal mt-4 pt-2 border-t border-white/10">
          <span>Eventos Recentes do Bus:</span>
        </div>
        <div className="mt-2 space-y-1">
          {events.map((evt, i) => (
            <div key={i} className="bg-white/5 p-1.5 rounded truncate text-white opacity-70">
              {evt.desc}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// O Componente Principal da Interface (Dumb Component) que apenas consome o Contexto
function AtlasViewerInterface({ navigate, isStudent }) {
  const {
    modelId,
    model,
    annotations,
    tutorContext, // Substituído educationalContext por tutorContext
    
    selectedAnnotation,
    selectedLayer,
    handleSelectAnnotation,
    
    focusMode,
    fullscreenPanel,
    handleResetCamera,
    setFullscreenPanel
  } = useAtlasViewer();

  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <LineIcon name="box" className="h-16 w-16 text-red-500/50 mb-6" />
        <h1 className="text-3xl font-bold text-clinicalWhite mb-2">Modelo Não Encontrado</h1>
        <p className="text-textMuted max-w-md">O Digital Twin solicitado ({modelId}) não foi localizado no Registry Anatômico.</p>
        <button 
          onClick={() => navigate ? navigate(-1) : window.history.back()} 
          className="mt-8 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors border border-white/10"
        >
          Voltar para o Painel
        </button>
      </div>
    );
  }

  return (
    <div className={`mx-auto transition-all duration-500 ${fullscreenPanel ? 'w-full h-screen fixed inset-0 z-50 bg-black/90 p-0 m-0' : 'w-full max-w-7xl px-4 py-8 animate-fade-in-up'}`}>
      
      {!isStudent && <AtlasDiagnosticsPanel />}

      {!fullscreenPanel && (
        <div className="flex flex-col items-center text-center mb-10 transition-all duration-500">
          <div className="p-4 bg-techTeal/10 rounded-2xl border border-techTeal/20 mb-4 relative">
            <div className="absolute inset-0 bg-techTeal/20 blur-xl rounded-2xl" />
            <LineIcon name="box" className="h-10 w-10 text-techTeal relative z-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-clinicalWhite mb-3 tracking-tight">
            Atlas Viewer Engine
          </h1>
          <p className="text-sm md:text-base text-textMuted max-w-2xl leading-relaxed">
            Ambiente de renderização WebGL nativo. Explorando o modelo <strong className="text-white">{model.modelName}</strong>.
          </p>
        </div>
      )}

      <div className={`bg-premiumDark border-white/10 overflow-hidden flex flex-col md:flex-row shadow-premium transition-all duration-500 ${fullscreenPanel ? 'w-full h-full border-0 rounded-none' : 'rounded-3xl border min-h-[700px]'}`}>
        
        {/* Painel Lateral Direito (Sidebar) */}
        <div className={`transition-all duration-500 border-b md:border-b-0 md:border-r border-white/5 flex flex-col bg-black/20 ${focusMode || fullscreenPanel ? 'w-0 overflow-hidden opacity-0 p-0 m-0 border-0' : 'w-full md:w-1/3 xl:w-1/4'}`}>
          
          <div className="p-6 border-b border-white/5 bg-gradient-to-br from-black/40 to-transparent shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-techTeal uppercase tracking-widest block">
                Digital Twin Profile
              </span>
              {(selectedAnnotation || selectedLayer) && (
                <button 
                  onClick={handleResetCamera}
                  className="text-[10px] text-textMuted hover:text-white uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                >
                  Voltar à Lista
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-4">{model.modelName}</h2>
            <div className="flex flex-col gap-2">
              <span className="px-3 py-1.5 bg-white/5 text-textMuted text-xs rounded-lg border border-white/10 flex items-center gap-2">
                <LineIcon name="map-pin" className="h-4 w-4 text-techTeal" /> {model.anatomicalRegion}
              </span>
            </div>
            {/* Presentation Mode Toggle (Hidden for students) */}
            {!isStudent && (
              <button 
                onClick={() => setFullscreenPanel(true)}
                className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-bold text-white uppercase tracking-widest rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <LineIcon name="monitor" className="w-4 h-4" /> Modo Apresentação
              </button>
            )}
          </div>

          {/* Renderização Dinâmica do Conteúdo Lateral */}
          {tutorContext && false /* Desativado temporariamente para dar lugar ao EducationalPanel, tutor agora fica nas abas */ ? (
            <AtlasAiTutorPanel tutorContext={tutorContext} />
          ) : (selectedAnnotation || selectedLayer) ? (
            <AtlasEducationalPanel 
              educationalContext={tutorContext} 
              annotation={selectedAnnotation} 
              layer={selectedLayer} 
            />
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              
              <div className="p-4 animate-fade-in">
                <h3 className="text-sm font-bold text-white mb-4 px-2">Estruturas Mapeadas ({annotations.length})</h3>
                <div className="flex flex-col gap-2">
                  {annotations.map((annotation, index) => {
                    const isSelected = selectedAnnotation?.annotationId === annotation.annotationId;
                    return (
                      <div 
                        key={annotation.annotationId}
                        onClick={() => handleSelectAnnotation(annotation)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'bg-techTeal/10 border-techTeal shadow-lg' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'bg-techTeal text-black' : 'bg-black/50 text-white border border-white/20'
                          }`}>
                            {index + 1}
                          </div>
                          <h4 className={`font-bold text-sm ${isSelected ? 'text-techTeal' : 'text-white'}`}>
                            {annotation.title}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="animate-fade-in">
                <AtlasStructureLayerPanel />
              </div>

            </div>
          )}

        </div>

        {/* Viewport 3D do Engine e Barra de Ferramentas */}
        <div className={`relative flex flex-col bg-black transition-all duration-500 ${focusMode || fullscreenPanel ? 'w-full' : 'w-full md:w-2/3 xl:w-3/4'}`}>
          
          <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <div className="pointer-events-auto">
              <AtlasViewerControls />
            </div>
          </div>
          
          {/* Sair do Modo Apresentação */}
          {fullscreenPanel && !isStudent && (
            <button 
              onClick={() => setFullscreenPanel(false)}
              className="absolute top-4 right-4 z-40 bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-xl backdrop-blur font-bold shadow-lg transition-colors flex items-center gap-2 animate-fade-in"
            >
              <LineIcon name="x" className="w-5 h-5" /> Sair da Apresentação
            </button>
          )}

          <div className="w-full h-full p-0">
            <AtlasViewerCanvas />
          </div>

          {/* Fallback Flutuante para FocusMode ou quando a sidebar está oculta */}
          {(selectedAnnotation || selectedLayer) && (focusMode || fullscreenPanel) && (
            <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-black/80 backdrop-blur-xl border border-techTeal/30 rounded-2xl p-6 shadow-premium z-20 animate-fade-in-up">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-techTeal">
                  {selectedAnnotation ? selectedAnnotation.title : selectedLayer?.structureName}
                </h3>
                <button 
                  onClick={handleResetCamera}
                  className="p-1 hover:bg-white/10 rounded-lg text-textMuted hover:text-white transition-colors"
                >
                  <LineIcon name="x" className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-clinicalWhite leading-relaxed mb-4">
                {selectedAnnotation ? selectedAnnotation.description : selectedLayer?.description}
              </p>
            </div>
          )}

        </div>
      </div>
      
      {!fullscreenPanel && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => navigate ? navigate(-1) : window.history.back()} 
            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors border border-white/10 font-bold"
          >
            Retornar ao Heatmap Anatômico
          </button>
        </div>
      )}
    </div>
  );
}

// O Export Padrão da Página encapsulado no Provider
export default function AtlasViewerBridgePage({ id, navigate, isStudent = false }) {
  const [resolvedId, setResolvedId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    import('../../../services/modelService').then(({ resolveModelIdentity }) => {
      resolveModelIdentity(id, null, { includeInactive: true })
        .then(identity => {
          if (!mounted) return;
          // Se tiver UUID resolvido, usamos ele. Senão, caímos para o slug temporariamente.
          if (identity.isUuidResolved && identity.modelUuid) {
            setResolvedId(identity.modelUuid);
          } else {
            // Em dev, podemos aceitar o slug para carregar dados mockados
            setResolvedId(id);
          }
        })
        .catch(err => {
          if (!mounted) return;
          console.error("Erro ao resolver identidade do modelo:", err);
          setError("Erro fatal ao resolver identidade do modelo.");
        });
    });

    return () => { mounted = false; };
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <LineIcon name="box" className="h-16 w-16 text-red-500/50 mb-6" />
        <h1 className="text-3xl font-bold text-clinicalWhite mb-2">Erro Crítico</h1>
        <p className="text-textMuted max-w-md">{error}</p>
        <button 
          onClick={() => navigate ? navigate(-1) : window.history.back()} 
          className="mt-8 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors border border-white/10"
        >
          Voltar para o Painel
        </button>
      </div>
    );
  }

  if (!resolvedId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-techTeal border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-techTeal animate-pulse">Resolvendo Identidade do Modelo...</p>
      </div>
    );
  }

  // Detecta se a rota contém '/student/' caso não seja passado via props
  const resolvedIsStudent = isStudent || window.location.pathname.includes('/student/');

  return (
    <AtlasViewerProvider modelId={resolvedId}>
      <AtlasViewerInterface navigate={navigate} isStudent={resolvedIsStudent} />
    </AtlasViewerProvider>
  );
}

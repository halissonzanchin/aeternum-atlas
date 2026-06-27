import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { atlasModelRegistry } from '../../../data/atlasModelRegistry';
import { atlasAnnotationRegistry } from '../../../data/atlasAnnotationRegistry';
import { atlasStructureLayerRegistry } from '../../../data/atlasStructureLayerRegistry';
import { atlasAiTutorRegistry } from '../../../data/atlasAiTutorRegistry';
import { useAtlasAnalytics } from '../hooks/useAtlasAnalytics';
import { atlasEventBus, ENGINE_EVENTS } from '../engine/atlasEngineEvents';
import { generateMockTutorResponse } from '../../../utils/mockAiTutor';

const AtlasViewerContext = createContext(null);

export function AtlasViewerProvider({ modelId, children }) {
  // 1. DADOS BASE
  const model = atlasModelRegistry[modelId];
  const annotations = atlasAnnotationRegistry[modelId] || [];
  const layers = atlasStructureLayerRegistry[modelId] || [];

  // 2. CONTROLES DO VIEWER
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [clinicalLighting, setClinicalLighting] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [fullscreenPanel, setFullscreenPanel] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // 3. SELEÇÕES E ISOLAMENTOS
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  
  const [hiddenLayers, setHiddenLayers] = useState(() => {
    const initialHidden = new Set();
    layers.forEach(layer => {
      if (!layer.defaultVisible) initialHidden.add(layer.layerId);
    });
    return initialHidden;
  });

  // 4. STATUS DO ENGINE
  const [engineError, setEngineError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 5. TELEMETRIA E IA
  const analytics = useAtlasAnalytics(model ? modelId : null);

  const tutorContext = useMemo(() => {
    if (selectedAnnotation) {
      return atlasAiTutorRegistry[selectedAnnotation.anatomicalStructure] || null;
    }
    if (selectedLayer) {
      return atlasAiTutorRegistry[selectedLayer.meshName] || null;
    }
    return null;
  }, [selectedAnnotation, selectedLayer]);

  // CHAT STATE DA IA
  const [aiChatHistory, setAiChatHistory] = useState([]);
  const [aiIsTyping, setAiIsTyping] = useState(false);
  const [aiTutorMode, setAiTutorMode] = useState(false); 

  const handleSendAiMessage = async (question) => {
    if (!question.trim()) return;

    // Adicionar pergunta do usuário
    const userMessage = { role: 'user', content: question, id: Date.now() };
    setAiChatHistory(prev => [...prev, userMessage]);
    setAiIsTyping(true);
    setAiTutorMode(true); // Se não estiver na aba de chat, forçará a visão

    // Gerar resposta mockada baseada no contexto atual
    const mockResponse = await generateMockTutorResponse(question, tutorContext);

    // Adicionar resposta
    const tutorMessage = { role: 'tutor', content: mockResponse, id: Date.now() + 1 };
    setAiChatHistory(prev => [...prev, tutorMessage]);
    setAiIsTyping(false);
  };

  const handleResetChat = () => {
    setAiChatHistory([]);
    setAiIsTyping(false);
  };

  // 6. CAMERA HISTORY
  const [cameraHistory, setCameraHistory] = useState([]);

  // 7. AUTHORING MODE (FASE 8.10B)
  const isAuthoringMode = useMemo(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('authoring') === '1';
    }
    return false;
  }, []);

  const [draftMarkers, setDraftMarkers] = useState([]);
  const [lastCapturedCoordinate, setLastCapturedCoordinate] = useState(null);

  const handleCaptureCoordinate = (coordinateData) => {
    setLastCapturedCoordinate(coordinateData);
  };

  const handleAddDraftMarker = (marker) => {
    setDraftMarkers(prev => [...prev, marker]);
    setLastCapturedCoordinate(null); // Limpar captura após salvar
  };

  const handleRemoveDraftMarker = (markerId) => {
    setDraftMarkers(prev => prev.filter(m => m.id !== markerId));
  };

  // Ações
  const handleResetCamera = () => {
    setSelectedAnnotation(null);
    setSelectedLayer(null);
    setResetTrigger(prev => prev + 1);
    
    setCameraHistory(prev => [...prev, { type: 'reset' }]);
    
    analytics.trackResetView();
    atlasEventBus.emit(ENGINE_EVENTS.RESET_VIEW);
  };

  const handleCameraBack = () => {
    setCameraHistory(prev => {
      if (prev.length <= 1) return prev; // Cannot go back if empty or just 1
      const newHistory = [...prev];
      newHistory.pop(); // Remove current state
      const previousState = newHistory[newHistory.length - 1];
      
      // Apply previous state without adding to history
      if (previousState.type === 'annotation') {
        setSelectedAnnotation(previousState.data);
        setSelectedLayer(null);
      } else if (previousState.type === 'layer') {
        setSelectedLayer(previousState.data);
        setSelectedAnnotation(null);
      } else {
        setSelectedAnnotation(null);
        setSelectedLayer(null);
        setResetTrigger(t => t + 1);
      }
      return newHistory;
    });
  };

  const handleToggleAutoRotate = (value) => {
    setAutoRotate(value);
    analytics.trackAutoRotate(value);
  };

  const handleToggleLayerVisibility = (layerId) => {
    setHiddenLayers(prev => {
      const newHidden = new Set(prev);
      const isHiddenNow = !newHidden.has(layerId);
      
      if (isHiddenNow) {
        newHidden.add(layerId);
      } else {
        newHidden.delete(layerId);
      }

      analytics.trackStructureToggle(layerId, isHiddenNow);
      return newHidden;
    });
  };

  const handleSelectLayer = (layer) => {
    if (selectedLayer?.layerId === layer?.layerId) {
      handleResetCamera();
    } else {
      setSelectedLayer(layer);
      setSelectedAnnotation(null);
      setCameraHistory(prev => [...prev, { type: 'layer', data: layer }]);
      
      if (layer && hiddenLayers.has(layer.layerId)) {
        handleToggleLayerVisibility(layer.layerId);
      }
      
      analytics.trackStructureSelect(layer);
      atlasEventBus.emit(ENGINE_EVENTS.STRUCTURE_SELECTED, { layer });
    }
  };

  const handleSelectAnnotation = (annotation) => {
    if (selectedAnnotation?.annotationId === annotation?.annotationId || selectedAnnotation?.id === annotation?.id) {
      handleResetCamera();
    } else {
      setSelectedAnnotation(annotation);
      setSelectedLayer(null);
      setCameraHistory(prev => [...prev, { type: 'annotation', data: annotation }]);
      
      analytics.trackAnnotationSelect(annotation);
      atlasEventBus.emit(ENGINE_EVENTS.ANNOTATION_SELECTED, { annotation });
    }
  };

  const handleModelLoaded = () => {
    setIsLoaded(true);
    atlasEventBus.emit(ENGINE_EVENTS.MODEL_LOADED, { modelId });
  };

  const handleModelError = (errorMsg) => {
    setEngineError(errorMsg);
    atlasEventBus.emit(ENGINE_EVENTS.MODEL_FAILED, { modelId, error: errorMsg });
  };

  // Valor exportado pelo Contexto
  const value = {
    modelId,
    model,
    annotations,
    layers,
    tutorContext,
    
    engineError,
    isLoaded,
    handleModelLoaded,
    handleModelError,

    selectedAnnotation,
    selectedLayer,
    hiddenLayers,
    handleSelectAnnotation,
    handleSelectLayer,
    handleToggleLayerVisibility,
    
    autoRotate,
    showGrid,
    clinicalLighting,
    focusMode,
    fullscreenPanel,
    resetTrigger,
    setAutoRotate: handleToggleAutoRotate,
    setShowGrid,
    setClinicalLighting,
    setFocusMode,
    setFullscreenPanel,
    handleResetCamera,
    cameraHistory,
    handleCameraBack,

    // AUTHORING MODE
    isAuthoringMode,
    draftMarkers,
    lastCapturedCoordinate,
    handleCaptureCoordinate,
    handleAddDraftMarker,
    handleRemoveDraftMarker,

    // AI CHAT
    aiChatHistory,
    aiIsTyping,
    aiTutorMode,
    setAiTutorMode,
    handleSendAiMessage,
    handleResetChat,

    analytics
  };

  return (
    <AtlasViewerContext.Provider value={value}>
      {children}
    </AtlasViewerContext.Provider>
  );
}

export function useAtlasViewer() {
  const context = useContext(AtlasViewerContext);
  if (!context) {
    throw new Error('useAtlasViewer deve ser usado dentro de um AtlasViewerProvider');
  }
  return context;
}

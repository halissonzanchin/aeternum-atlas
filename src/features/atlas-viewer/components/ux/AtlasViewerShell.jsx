import React, { useState, useRef, useEffect, useCallback } from 'react';
import AtlasViewer from '../../AtlasViewer';
import AtlasViewerToolbar from './AtlasViewerToolbar';
import AtlasMarkerPanel from './AtlasMarkerPanel';
import AtlasAuthoringPanel from './AtlasAuthoringPanel';
import { atlasViewerCommands } from '../../ai/atlasViewerCommands';
import AtlasEducationalPanel from '../AtlasEducationalPanel';
import { useViewer } from '../../../viewer/ViewerContext';
import SketchfabApiViewer from '../../../../components/viewer/SketchfabApiViewer';

import { AtlasViewerProvider } from '../../context/AtlasViewerContext';

function AtlasViewerShellContent({ 
  modelUrl, 
  modelLodManifest, 
  modelFormat = 'glb', 
  markers = [], 
  onMarkerSelect,
  initialQuality = 'clinical',
  isSketchfabMode = false,
  model = null
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderMode, setRenderMode] = useState('anatomicalRealism');
  const { markerOpen, setMarkerOpen } = useViewer();
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [studyMode, setStudyMode] = useState(false);
  
  const activeMarker = markers.find(m => m.id === activeMarkerId);

  // Fullscreen Management
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Erro ao tentar tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Marker Interaction
  const handleSelectMarker = useCallback((marker) => {
    setActiveMarkerId(marker.id);
    if (onMarkerSelect) onMarkerSelect(marker.id);
    
    // Command the engine to fly
    atlasViewerCommands.focusMarker(marker.id);
    
    // Auto-open educational panel logic in study mode or general
    if (!studyMode && window.innerWidth <= 768) {
      setMarkerOpen(false); // hide list on mobile when selected
    }
  }, [onMarkerSelect, studyMode]);

  // Logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Atlas Viewer UX]
  - activeMarkerId: ${activeMarkerId}
  - markerPanelOpen: ${markerOpen}
  - fullscreenActive: ${isFullscreen}
  - studyMode: ${studyMode}
  - renderMode: ${renderMode}
  - markerCount: ${markers.length}
      `);
    }
  }, [activeMarkerId, markerOpen, isFullscreen, studyMode, renderMode, markers.length]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0B0E14] overflow-hidden flex font-sans">
      
      {/* 3D Engine Core */}
      <div className="flex-1 relative">
        {isSketchfabMode && model ? (
           <div className="absolute inset-0">
             <SketchfabApiViewer 
                title={model.shortTitle || model.title}
                modelUid={model.sketchfabUid || model.sketchfab_uid || (model.embedUrl?.match(/([a-f0-9]{32})/i)?.[1])}
                embedUrl={model.embedUrl || model.sketchfabEmbedUrl}
                externalUrl={model.externalUrl}
             />
           </div>
        ) : (
          <AtlasViewer 
            ref={viewerRef}
            modelUrl={modelUrl}
            modelLodManifest={modelLodManifest}
            modelFormat={modelFormat}
            markers={markers}
            onMarkerSelect={(id) => setActiveMarkerId(id)}
            renderMode={renderMode}
            // The LOD tier can be separated from render mode. For now, Mobile Render Mode forces Performance LOD.
            // Otherwise, we request 'balanced' (which AtlasLODManager will fallback to 'performance' if unavailable).
            qualityMode={renderMode === 'performanceMobile' ? 'performance' : 'balanced'} 
            editMode={false} // Always false in Shell, editing happens in EditorPage
          />
        )}

        {/* Toolbar */}
        {!isSketchfabMode && (
          <AtlasViewerToolbar 
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            renderMode={renderMode}
            setRenderMode={setRenderMode}
            isMarkerPanelOpen={markerOpen}
            toggleMarkerPanel={() => setMarkerOpen(!markerOpen)}
            isSketchfabMode={isSketchfabMode}
            studyMode={studyMode}
            toggleStudyMode={() => {
              setStudyMode(!studyMode);
              if (!studyMode) setMarkerOpen(true); // force open markers in study mode
            }}
          />
        )}

        {/* Floating Educational Content in Study Mode */}
        {(!isSketchfabMode && studyMode && activeMarker) && (
          <div className="absolute top-6 right-6 z-20 w-80 shadow-2xl animate-fade-in-up">
            <AtlasEducationalPanel 
              marker={activeMarker} 
              onClose={() => setActiveMarkerId(null)}
              onRefocus={() => atlasViewerCommands.focusMarker(activeMarker.id)}
            />
          </div>
        )}
      </div>

      {/* Marker Panel Drawer */}
      <AtlasMarkerPanel 
        markers={markers} 
        activeMarkerId={activeMarkerId}
        onSelectMarker={handleSelectMarker}
        isOpen={markerOpen}
        onClose={() => setMarkerOpen(false)}
        isSketchfabMode={isSketchfabMode}
      />
      
      {/* Authoring Panel (conditional inside) */}
      {!isSketchfabMode && <AtlasAuthoringPanel />}
    </div>
  );
}

export default function AtlasViewerShell(props) {
  // O AtlasViewerShell atual é renderizado pela ViewerPage, que não possui o AtlasViewerProvider (nativo do Bridge).
  // Para que o painel de autoria funcione sem crachar, envelopamos o shell em um provider.
  return (
    <AtlasViewerProvider modelId={null}>
      <AtlasViewerShellContent {...props} />
    </AtlasViewerProvider>
  );
}

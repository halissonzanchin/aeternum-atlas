import React, { useState, useRef, useEffect, useCallback } from 'react';
import AtlasViewer from '../../AtlasViewer';
import AtlasViewerToolbar from './AtlasViewerToolbar';
import AtlasMarkerPanel from './AtlasMarkerPanel';
import { atlasViewerCommands } from '../../ai/atlasViewerCommands';
import AtlasEducationalPanel from '../AtlasEducationalPanel';
import { useViewer } from '../../../viewer/ViewerContext';

export default function AtlasViewerShell({ 
  modelUrl, 
  modelLodManifest, 
  modelFormat = 'glb', 
  markers = [], 
  onMarkerSelect,
  initialQuality = 'clinical'
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualityPreset, setQualityPreset] = useState(initialQuality);
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
  - qualityPreset: ${qualityPreset}
  - markerCount: ${markers.length}
      `);
    }
  }, [activeMarkerId, markerOpen, isFullscreen, studyMode, qualityPreset, markers.length]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0B0E14] overflow-hidden flex font-sans">
      
      {/* 3D Engine Core */}
      <div className="flex-1 relative">
        <AtlasViewer 
          ref={viewerRef}
          modelUrl={modelUrl}
          modelLodManifest={modelLodManifest}
          modelFormat={modelFormat}
          markers={markers}
          onMarkerSelect={(id) => setActiveMarkerId(id)}
          renderQualityPreset={qualityPreset}
          editMode={false} // Always false in Shell, editing happens in EditorPage
        />

        {/* Toolbar */}
        <AtlasViewerToolbar 
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          qualityPreset={qualityPreset}
          setQualityPreset={setQualityPreset}
          isMarkerPanelOpen={markerOpen}
          toggleMarkerPanel={() => setMarkerOpen(!markerOpen)}
          studyMode={studyMode}
          toggleStudyMode={() => {
            setStudyMode(!studyMode);
            if (!studyMode) setMarkerOpen(true); // force open markers in study mode
          }}
        />

        {/* Floating Educational Content in Study Mode */}
        {studyMode && activeMarker && (
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
      />
      
    </div>
  );
}

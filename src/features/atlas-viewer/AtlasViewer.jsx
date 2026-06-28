import React, { Suspense, useRef, useState, useEffect, forwardRef, useImperativeHandle, useTransition, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Stats, Bounds, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

// Injeção Global Segura do BVH (Fase 8.4D)
if (!THREE.BufferGeometry.prototype.computeBoundsTree) {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}
import AtlasMarker from './AtlasMarker';
import AtlasAnnotationPanel from './AtlasAnnotationPanel';
import { AtlasModelErrorBoundary } from './components/AtlasModelErrorBoundary';
import { AtlasLODManager } from './components/AtlasLODManager';
import AtlasGLBLoader from './loaders/AtlasGLBLoader';
import AtlasOBJLoader from './loaders/AtlasOBJLoader';
import { atlasViewerCommands } from './ai/atlasViewerCommands';
import { atlasCameraEngine } from './ai/AtlasCameraEngine';
import { detectAtlasDeviceProfile } from '../../utils/deviceDetection';

function LoaderFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-blackDeep/60 rounded-2xl backdrop-blur-xl border border-white/10 w-auto min-w-[200px] shadow-2xl">
        <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-techTeal animate-spin mb-4 shadow-[0_0_15px_rgba(71,184,181,0.5)]"></div>
        <p className="text-sm font-bold text-techTeal uppercase tracking-widest text-center whitespace-nowrap">CARREGANDO</p>
        <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1 text-center whitespace-nowrap">Atlas Engine 3D</p>
      </div>
    </Html>
  );
}

function UnsupportedFormatFallback({ format }) {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-red-900/80 rounded-xl backdrop-blur-md border border-red-500/50 w-64">
        <svg className="w-10 h-10 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm font-bold text-white uppercase tracking-widest text-center">Formato Inválido</p>
        <p className="text-xs text-white/70 text-center mt-2">O formato "{format}" não é suportado pelo Atlas Engine.</p>
      </div>
    </Html>
  );
}

const AtlasViewer = forwardRef(({ modelUrl, modelLodManifest, qualityMode = null, modelFormat = 'glb', markers = [], onMarkerSelect, onModelClick, editMode = false, activeTool = 'select', showStats = false, renderQualityPreset = 'clinical' }, ref) => {
  const cameraControlsRef = useRef(null);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  
  // LOD Manager State
  const [lodUrl, setLodUrl] = useState(modelUrl);
  const [isPending, startTransition] = useTransition();

  const handleLodChange = useCallback((newUrl) => {
    startTransition(() => {
      setLodUrl(newUrl);
    });
  }, []);

  const [dpr, setDpr] = useState([1, 1.5]);
  
  useEffect(() => {
    const profile = detectAtlasDeviceProfile();
    let currentDpr = [1, 1.5];
    if (profile === 'low') currentDpr = [1, 1];
    else if (profile === 'medium') currentDpr = [1, 1.5];
    else currentDpr = [1, 2]; // high or clinical
    
    setDpr(currentDpr);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Atlas Viewer Rendering]
  - preset: ${renderQualityPreset}
  - toneMapping: ACESFilmicToneMapping
  - exposure: ${renderQualityPreset === 'clinical' ? 1.0 : 1.2}
  - dpr: ${currentDpr.join(', ')}
  - lightSetup: Clinical Tri-Point (Ambient 0.5, Key 1.2, Fill 0.6, Rim 0.3)
  - environmentEnabled: false
  - estimatedDeviceProfile: ${profile}
      `);
    }
  }, [renderQualityPreset]);

  const effectiveUrl = modelLodManifest ? lodUrl : modelUrl;

  const activeMarker = markers.find(m => m.id === activeMarkerId);

  useImperativeHandle(ref, () => ({
    getCameraState: () => {
      if (!cameraControlsRef.current) return null;
      const position = new THREE.Vector3();
      const target = new THREE.Vector3();
      
      if (typeof cameraControlsRef.current.getPosition === 'function') {
        cameraControlsRef.current.getPosition(position);
        cameraControlsRef.current.getTarget(target);
      } else if (cameraControlsRef.current.object && cameraControlsRef.current.target) {
        position.copy(cameraControlsRef.current.object.position);
        target.copy(cameraControlsRef.current.target);
      }
      
      return { position, target };
    },
    flyToMarker: (marker) => {
      // Usamos a cena global a partir de um dos children se precisarmos da bounding box
      const scene = cameraControlsRef.current?._camera?.parent;
      atlasCameraEngine.flyToMarker(cameraControlsRef.current, marker, scene);
    }
  }));

  const handleMarkerClick = (marker) => {
    setActiveMarkerId(marker.id);
    if (onMarkerSelect) onMarkerSelect(marker.id);
    
    if (cameraControlsRef.current) {
      const scene = cameraControlsRef.current?._camera?.parent;
      atlasCameraEngine.flyToMarker(cameraControlsRef.current, marker, scene);
    }
  };

  useEffect(() => {
    const unsubscribe = atlasViewerCommands.subscribe((action) => {
      if (action.type === 'FOCUS_MARKER' || action.type === 'OPEN_ANNOTATION') {
        const marker = markers.find(m => m.id === action.payload);
        if (marker) handleMarkerClick(marker);
      }
      if (action.type === 'RESET_CAMERA') {
        setActiveMarkerId(null);
        if (onMarkerSelect) onMarkerSelect(null);
        atlasCameraEngine.resetView(cameraControlsRef.current);
      }
    });
    return unsubscribe;
  }, [markers]);

  const handleClosePanel = () => {
    setActiveMarkerId(null);
    if (onMarkerSelect) onMarkerSelect(null);
  };

  const isFormatSupported = ['glb', 'obj'].includes(modelFormat.toLowerCase());

  return (
    <div className="w-full h-full bg-blackDeep relative overflow-hidden flex-1">
      {/* HUD overlay minimal */}
      <div className="absolute top-2 right-2 sm:top-6 sm:right-6 md:right-8 z-10 pointer-events-none">
        <span className="bg-techTeal/10 backdrop-blur-md text-techTeal text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-techTeal/30 flex items-center gap-1.5 sm:gap-2 shadow-lg atlas-nowrap-label">
          <span className="w-1.5 h-1.5 rounded-full bg-techTeal animate-pulse shrink-0"></span>
          <span className="hidden sm:inline">Atlas Engine ({modelFormat.toUpperCase()})</span>
          <span className="sm:hidden">GLB</span>
          {editMode && <span className="ml-1 sm:ml-2 bg-amber-500 text-black px-1 sm:px-1.5 py-0.5 rounded text-[9px] shrink-0">EDIT</span>}
        </span>
      </div>

      {!editMode && (
        <AtlasAnnotationPanel 
          activeMarker={activeMarker} 
          onClose={handleClosePanel} 
        />
      )}

      <Canvas
        camera={{ position: [0, 0, 5], fov: 45, near: 0.0001, far: 10000 }}
        gl={{ 
          antialias: true, 
          alpha: false, 
          logarithmicDepthBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: renderQualityPreset === 'clinical' ? 1.0 : 1.2,
          outputColorSpace: THREE.SRGBColorSpace
        }}
        dpr={dpr}
      >
        <color attach="background" args={['#15181E']} />
        
        {/* Photorealistic Lighting Setup (Phase 8.12A) */}
        <ambientLight intensity={0.2} color="#ffffff" />
        <hemisphereLight skyColor="#ffffff" groundColor="#444444" intensity={0.4} />
        
        {/* Key Light: Front/Top/Right - Strong and casts shadow */}
        <directionalLight position={[5, 10, 7]} intensity={1.5} color="#ffffff" castShadow={false} />
        
        {/* Fill Light: Left/Bottom - Removes harsh shadows but maintains volume */}
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#e2e8f0" />
        
        {/* Rim Light: Back/Top - Soft outline */}
        <directionalLight position={[0, 5, -8]} intensity={0.3} color="#ffffff" />

        <ContactShadows resolution={512} scale={10} blur={2} opacity={0.4} far={10} color="#000000" position={[0, -1.5, 0]} />

        <Suspense fallback={<LoaderFallback />}>
          <Bounds margin={1.2}>
            <Center>
              <AtlasModelErrorBoundary>
                {modelLodManifest && (
                  <AtlasLODManager 
                    manifest={modelLodManifest} 
                    qualityMode={qualityMode || renderQualityPreset} 
                    onLodUrlChange={handleLodChange} 
                  />
                )}
                {modelFormat.toLowerCase() === 'glb' && <AtlasGLBLoader url={effectiveUrl} onModelClick={editMode ? onModelClick : null} />}
                {modelFormat.toLowerCase() === 'obj' && <AtlasOBJLoader url={effectiveUrl} onModelClick={editMode ? onModelClick : null} />}
              </AtlasModelErrorBoundary>
            </Center>
          </Bounds>
          {!isFormatSupported && <UnsupportedFormatFallback format={modelFormat} />}

          {isFormatSupported && markers.map((marker) => (
            <AtlasMarker 
              key={marker.id} 
              marker={marker} 
              isActive={activeMarkerId === marker.id}
              onClick={() => handleMarkerClick(marker)} 
            />
          ))}
        </Suspense>
        
        <OrbitControls 
          ref={cameraControlsRef}
          makeDefault
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={0.001}
          maxDistance={10000}
        />

        {showStats && <Stats className="stats-panel" />}
      </Canvas>
    </div>
  );
});

export default AtlasViewer;

import React, { Suspense, useRef, useState, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center, PerformanceMonitor } from '@react-three/drei';
import AtlasModelLoader from './AtlasModelLoader';
import AtlasAnnotationMarkers from './AtlasAnnotationMarkers';
import { useAtlasCameraController } from '../hooks/useAtlasCameraController';
import { useAtlasViewer } from '../context/AtlasViewerContext';
import LineIcon from '../../../components/icons/LineIcon';

const CanvasFallback = ({ error }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
      <LineIcon name="alert-triangle" className="h-12 w-12 text-amber-500/50 mb-4" />
      <h3 className="text-xl font-bold text-clinicalWhite mb-2">Modelo Indisponível</h3>
      <p className="text-textMuted text-sm text-center max-w-sm px-4">
        {error || 'Modelo 3D ainda não disponível no Engine proprietário.'}
      </p>
    </div>
  );
};

const LoadingSpinner = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-10">
      <div className="w-16 h-16 border-2 border-techTeal/30 border-t-techTeal rounded-full animate-spin"></div>
      <span className="mt-4 text-techTeal font-mono text-xs uppercase tracking-widest">Iniciando WebGL...</span>
    </div>
  );
};

function CameraController({ selectedAnnotation, orbitRef }) {
  useAtlasCameraController(selectedAnnotation, orbitRef, [0, 0, 6]);
  return null;
}

const SceneContents = memo(({ engineError, showGrid, clinicalLighting, isLowPerf }) => {
  return (
    <>
      <ambientLight intensity={clinicalLighting ? 0.4 : 0.2} />
      
      <directionalLight 
        castShadow={!isLowPerf} 
        position={[5, 10, 5]} 
        intensity={clinicalLighting ? 1.2 : 0.8} 
        shadow-mapSize={isLowPerf ? [512, 512] : [1024, 1024]} 
        shadow-bias={-0.0001}
      />
      
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={clinicalLighting ? 0.6 : 0.2} 
        color="#a5f3fc" 
      />
      
      <spotLight 
        position={[0, 10, -10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={clinicalLighting ? 1.5 : 0.5} 
        color="#ffffff" 
      />
      
      <Environment preset="studio" resolution={isLowPerf ? 128 : 256} />

      {showGrid && <gridHelper args={[20, 20, '#ffffff', '#2dd4bf']} position={[0, -2.01, 0]} material-opacity={0.15} material-transparent />}

      {!engineError && (
        <Center>
          <AtlasModelLoader />
          <AtlasAnnotationMarkers />
        </Center>
      )}

      {!isLowPerf && (
        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.6} 
          scale={15} 
          blur={2.5} 
          far={5} 
          color="#000000" 
          frames={1} // Optimize: only render shadow once for static scenes
        />
      )}
    </>
  );
});

export default function AtlasViewerCanvas() {
  const { 
    engineError,
    selectedAnnotation,
    autoRotate,
    showGrid,
    clinicalLighting
  } = useAtlasViewer();
  
  const orbitRef = useRef();
  const [dpr, setDpr] = useState(1.5);
  const [isLowPerf, setIsLowPerf] = useState(false);

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[500px] bg-gradient-to-b from-premiumDark to-[#050B14] rounded-2xl overflow-hidden border border-white/5">
      
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #2dd4bf 0%, transparent 70%)' }}></div>
      
      {engineError && <CanvasFallback error={engineError} />}

      <Suspense fallback={<LoadingSpinner />}>
        <Canvas 
          shadows={!isLowPerf} 
          dpr={dpr}
          camera={{ position: [0, 0, 6], fov: 40 }} 
          className="cursor-grab active:cursor-grabbing"
          gl={{ antialias: !isLowPerf, powerPreference: "high-performance" }}
        >
          <PerformanceMonitor 
            onDecline={() => {
              setDpr(1);
              setIsLowPerf(true);
            }} 
            onIncline={() => {
              // Be cautious about increasing it back to avoid oscillation
            }} 
          />

          <CameraController selectedAnnotation={selectedAnnotation} orbitRef={orbitRef} />

          <SceneContents 
            engineError={engineError} 
            showGrid={showGrid} 
            clinicalLighting={clinicalLighting} 
            isLowPerf={isLowPerf}
          />
          
          <OrbitControls 
            ref={orbitRef}
            makeDefault 
            autoRotate={autoRotate && !selectedAnnotation} 
            autoRotateSpeed={0.8} 
            enablePan={true} 
            enableZoom={true} 
            minDistance={2} 
            maxDistance={25}
            enableDamping={true}
            dampingFactor={0.1} 
          />
        </Canvas>
      </Suspense>
      
      {selectedAnnotation && (
        <div className="absolute top-4 left-4 z-10 animate-fade-in-up pointer-events-none">
          <div className="bg-techTeal/10 backdrop-blur-md border border-techTeal/30 rounded-lg px-4 py-2 flex items-center gap-3">
            <div className="w-2 h-2 bg-techTeal rounded-full animate-pulse"></div>
            <div>
              <span className="text-[10px] text-techTeal uppercase font-bold tracking-widest block">Foco Atual</span>
              <span className="text-sm text-white font-bold">{selectedAnnotation.title}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 pointer-events-none opacity-40 flex items-center gap-2">
        <LineIcon name="box" className="w-4 h-4 text-white" />
        <span className="text-[10px] uppercase font-bold text-white tracking-widest">Aeternum Engine Alpha</span>
      </div>
    </div>
  );
}

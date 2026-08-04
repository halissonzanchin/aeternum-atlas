import React, { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import HeroCoreFallback from './HeroCoreFallback';

const AeternumHeroCoreCanvas = lazy(() => import('./AeternumHeroCoreCanvas'));

const ENABLED_PROCEDURAL = import.meta.env.VITE_HERO_PROCEDURAL_3D_ENABLED === 'true';
const ENABLED_SPLINE = import.meta.env.VITE_HERO_SPLINE_ENABLED === 'true';

class HeroCoreErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[HeroCore Error Boundary]', error, errorInfo);
    } else {
      console.error('[AeternumHeroCore] WebGL Render Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function AeternumHeroCore() {
  const [shouldLoadWebGL, setShouldLoadWebGL] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('initializing');

  // If both flags are false (or if SPLINE is active, but this component was rendered), 
  // fallback will be forced.
  const isProceduralAllowed = ENABLED_PROCEDURAL && !ENABLED_SPLINE;

  useEffect(() => {
    if (!isProceduralAllowed) return;

    const isProceduralEnabled = ENABLED_PROCEDURAL;
    const isSplineEnabled = ENABLED_SPLINE;

    // Capability Checks
    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasTouch = 'ontouchstart' in window;
    const pointerCoarse = window.matchMedia('(pointer: coarse)').matches;
    
    // Desktop: don't block solely on hardware concurrency, but combine checks.
    const isVeryLowEnd = 
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) && 
      (navigator.deviceMemory && navigator.deviceMemory < 4);
      
    let saveData = false;
    if ('connection' in navigator) {
      saveData = navigator.connection.saveData || navigator.connection.effectiveType?.includes('2g');
    }

    // WebGL Check
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const hasWebGL = !!gl;

    const urlParams = new URLSearchParams(window.location.search);
    const forceFallback = urlParams.get('hero3d') === 'fallback';

    let reason = '';
    if (isMobile) reason = 'mobile';
    else if (reducedMotion) reason = 'reduced-motion';
    else if (isVeryLowEnd) reason = 'low-memory';
    else if (saveData) reason = 'save-data';
    else if (!hasWebGL) reason = 'WebGL unavailable';
    else if (forceFallback) reason = 'force-fallback';

    if (import.meta.env.DEV) {
      console.table({
        width: window.innerWidth,
        isMobile,
        hasTouch,
        pointerCoarse,
        reducedMotion,
        saveData,
        deviceMemory: navigator.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        supportsWebGL: hasWebGL,
        proceduralEnabled: isProceduralEnabled,
        splineEnabled: isSplineEnabled,
        finalRenderer: reason === '' ? 'webgl' : 'fallback'
      });
      
      console.log("Environment Variables:", {
        VITE_HERO_SPLINE_ENABLED: import.meta.env.VITE_HERO_SPLINE_ENABLED,
        VITE_HERO_PROCEDURAL_3D_ENABLED: import.meta.env.VITE_HERO_PROCEDURAL_3D_ENABLED,
        VITE_HERO_PARTICLE_INTERACTION_ENABLED: import.meta.env.VITE_HERO_PARTICLE_INTERACTION_ENABLED
      });
    }

    if (reason === '') {
      setShouldLoadWebGL(true);
    } else {
      setFallbackReason(reason);
    }
  }, [isProceduralAllowed]);

  if (!isProceduralAllowed || !shouldLoadWebGL) {
    return (
      <div className="aeternum-hero-emblem-area hero-core-container fallback-active" data-hero-renderer="fallback">
        <HeroCoreFallback />
      </div>
    );
  }

  return (
    <div 
      className="aeternum-hero-emblem-area hero-core-container" 
      data-hero-renderer="webgl"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        contain: 'strict',
        pointerEvents: 'auto',
        touchAction: 'pan-y'
      }}
    >
      <HeroCoreErrorBoundary fallback={
        <>
          {import.meta.env.DEV && (
            <div style={{position: 'absolute', top: 10, left: 10, zIndex: 9999, background: 'rgba(255,0,0,0.8)', color: '#fff', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold'}}>
              FALLBACK ACTIVE: ERROR BOUNDARY
            </div>
          )}
          <HeroCoreFallback />
        </>
      }>
        <Suspense fallback={
          <>
            {import.meta.env.DEV && (
              <div style={{position: 'absolute', top: 10, left: 10, zIndex: 9999, background: 'rgba(255,165,0,0.8)', color: '#000', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold'}}>
                FALLBACK ACTIVE: SUSPENSE
              </div>
            )}
            <HeroCoreFallback />
          </>
        }>
          <AeternumHeroCoreCanvas />
        </Suspense>
      </HeroCoreErrorBoundary>
    </div>
  );
}

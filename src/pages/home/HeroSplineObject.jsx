import React, { lazy, Suspense, useEffect, useState, useRef, useMemo } from 'react';
import AeternumLogo from '../../components/AeternumLogo';

const Spline = lazy(() => import('@splinetool/react-spline'));

// Constants
const SPLINE_TIMEOUT_MS = 8000;
const ENABLED = import.meta.env.VITE_HERO_SPLINE_ENABLED === 'true';
const SCENE_URL = import.meta.env.VITE_HERO_SPLINE_SCENE_URL;

// Validation Regex
const SPLINE_URL_REGEX = /^https:\/\/prod\.spline\.design\/[A-Za-z0-9_-]+\/scene\.splinecode$/;

class SplineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[HeroSpline] Failed to load Spline scene:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const StaticFallback = () => (
  <div className="hero-spline-fallback" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="aeternum-emblem-ring" style={{ position: 'relative' }}>
       {/* Preserving some core identity as fallback */}
       <span className="aeternum-emblem-orbit aeternum-emblem-orbit-one" />
       <span className="aeternum-emblem-orbit aeternum-emblem-orbit-two" />
       <AeternumLogo variant="symbol" size="xl" theme="transparent" className="aeternum-hero-emblem" />
    </div>
  </div>
);

export default function HeroSplineObject() {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTimeout, setHasTimeout] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isValidUrl = useMemo(() => {
    return SCENE_URL && SPLINE_URL_REGEX.test(SCENE_URL);
  }, []);

  // Capability Check
  useEffect(() => {
    if (!ENABLED || !isValidUrl) return;

    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory < 4);
    
    let saveData = false;
    if ('connection' in navigator) {
      saveData = navigator.connection.saveData || navigator.connection.effectiveType?.includes('2g');
    }

    // WebGL Check
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const hasWebGL = !!gl;

    if (!isMobile && !reducedMotion && !isLowEnd && !saveData && hasWebGL) {
      setShouldLoad(true);
    }
  }, [isValidUrl]);

  // Intersection Observer
  useEffect(() => {
    if (!shouldLoad || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '200px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  // Page Visibility API
  useEffect(() => {
    if (!shouldLoad) return;
    
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [shouldLoad]);

  // Timeout Logic
  useEffect(() => {
    if (!shouldLoad || !isVisible || isLoaded) return;

    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.warn('[HeroSpline] Loading timed out. Showing fallback.');
        setHasTimeout(true);
      }
    }, SPLINE_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [shouldLoad, isVisible, isLoaded]);

  if (!ENABLED || !isValidUrl || !shouldLoad || hasTimeout) {
    return (
      <div className="aeternum-hero-emblem-area hero-spline-container fallback-active">
        <StaticFallback />
      </div>
    );
  }

  return (
    <div 
      className="aeternum-hero-emblem-area hero-spline-container" 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        contain: 'strict', // Prevents CLS
        pointerEvents: 'auto'
      }}
    >
      {!isLoaded && <StaticFallback />}
      
      {isVisible && (
        <SplineErrorBoundary fallback={<StaticFallback />}>
          <Suspense fallback={null}>
            <div style={{
               position: 'absolute', 
               inset: 0, 
               opacity: isLoaded ? 1 : 0, 
               transition: 'opacity 0.5s ease',
               pointerEvents: 'none' // Passive interaction initially
            }}>
               <Spline 
                 scene={SCENE_URL} 
                 onLoad={() => setIsLoaded(true)}
               />
            </div>
          </Suspense>
        </SplineErrorBoundary>
      )}
    </div>
  );
}

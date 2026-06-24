import { useState, useEffect, useTransition, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { detectAtlasDeviceProfile } from '../../../utils/deviceDetection';

export function AtlasLODManager({ manifest, qualityMode = 'auto', onLodUrlChange }) {
  const { camera } = useThree();
  
  const [deviceProfile, setDeviceProfile] = useState('medium');
  const [currentLevel, setCurrentLevel] = useState(null);
  
  // Initialize device profile once
  useEffect(() => {
    setDeviceProfile(detectAtlasDeviceProfile());
  }, []);

  // Set initial LOD level based on manifest
  useEffect(() => {
    if (!manifest || !manifest.levels) return;
    
    // Pick an initial safe level
    let initial = manifest.defaultLevel || 'medium';
    
    // If auto, downgrade for weak devices
    if (qualityMode === 'auto' || qualityMode === 'performance') {
      if (deviceProfile === 'low' && manifest.levels.low) initial = 'low';
      if (deviceProfile === 'high' && qualityMode === 'auto' && manifest.levels.high) initial = 'high';
    }
    
    if (qualityMode === 'quality' && manifest.levels.high) initial = 'high';
    if (qualityMode === 'performance' && manifest.levels.low) initial = 'low';

    setCurrentLevel(initial);
    onLodUrlChange(manifest.levels[initial].url);
  }, [manifest, qualityMode, deviceProfile]); // eslint-disable-line

  // Track camera distance with hysteresis
  let lastDistanceCheck = 0;
  
  useFrame(() => {
    if (!manifest || !manifest.levels) return;
    if (qualityMode === 'performance' || qualityMode === 'quality') return; // Locked modes
    
    // Throttle checks to 2 times a second
    const now = performance.now();
    if (now - lastDistanceCheck < 500) return;
    lastDistanceCheck = now;

    // Calculate distance to origin (0,0,0). 
    // Em modelos anatomicos do Atlas, a origem costuma ser o centro da Bounding Box via <Center>
    const dist = camera.position.length(); 

    let targetLevel = currentLevel;

    // Lógica básica de distância para LOD
    const lowDist = manifest.levels.low?.maxDistance || 999;
    const medDist = manifest.levels.medium?.maxDistance || 8;
    const highDist = manifest.levels.high?.maxDistance || 3;

    // Se o device for Low, não sobe pra High nunca no modo auto.
    const maxAllowedLevel = deviceProfile === 'low' ? 'medium' : 'high';

    if (dist > medDist && manifest.levels.low) targetLevel = 'low';
    else if (dist > highDist && dist <= medDist && manifest.levels.medium) targetLevel = 'medium';
    else if (dist <= highDist && manifest.levels.high && maxAllowedLevel === 'high') targetLevel = 'high';
    
    // Adicionar Hysteresis para evitar piscar na fronteira
    // Somente muda se for diferente do atual
    if (targetLevel !== currentLevel && targetLevel) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Atlas LOD Manager]
  - modelId: ${manifest.modelId}
  - previousLevel: ${currentLevel}
  - nextLevel: ${targetLevel}
  - cameraDistance: ${dist.toFixed(2)}
  - deviceProfile: ${deviceProfile}
  - qualityMode: ${qualityMode}`);
      }
      setCurrentLevel(targetLevel);
      onLodUrlChange(manifest.levels[targetLevel].url);
    }
  });

  return null; // Apenas Lógica
}

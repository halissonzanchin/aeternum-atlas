import React from 'react';
import { Canvas } from '@react-three/fiber';
import HeroCoreScene from './HeroCoreScene';
import { HERO_CORE_CONFIG } from './heroCoreConfig';

export default function AeternumHeroCoreCanvas() {
  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={HERO_CORE_CONFIG.desktop.dpr}
      frameloop="always"
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
      }}
      camera={{ position: HERO_CORE_CONFIG.camera.position, fov: HERO_CORE_CONFIG.camera.fov }}
    >
      <HeroCoreScene />
    </Canvas>
  );
}

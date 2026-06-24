import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { anatomyEntities } from '../../atlas-knowledge-graph/anatomyEntities.mock';
import { mapMeshToLayer } from '../layers/atlasMeshLayerMapper';
import { anatomyLayerService } from '../../atlas-layers/anatomyLayerService';
import { setLayerVisibility } from '../layers/atlasMeshVisibilityController';
import { auditMeshMapping } from '../debug/atlasMeshAudit';

export default function AtlasOBJLoader({ url, onModelClick }) {
  console.log(`[Diagnostic] AtlasOBJLoader instanciado com URL: ${url}`);
  
  const obj = useLoader(OBJLoader, url);
  console.log(`[Diagnostic] AtlasOBJLoader carregou OBJ com sucesso.`);

  // Aplica um material clínico bruto por padrão (já que OBJ muitas vezes não traz textura interna)
  const scene = useMemo(() => {
    // ... clone and traverse logic (unchanged)
    const clone = obj.clone();
    
    // Clinical off-white material (photorealistic organic)
    const defaultMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe6e3de, // slightly warmer bone/tissue color
      roughness: 0.75,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = defaultMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
        
        const layerId = mapMeshToLayer(child.name, anatomyEntities);
        child.userData.atlasLayer = layerId;
      }
    });

    auditMeshMapping(clone);

    return clone;
  }, [obj]);

  React.useEffect(() => {
    if (!scene) return;

    const initialLayers = anatomyLayerService.getAllLayers();
    initialLayers.forEach(layer => setLayerVisibility(scene, layer.id, layer.visible));

    const unsubscribe = anatomyLayerService.subscribe((layers) => {
      layers.forEach(layer => setLayerVisibility(scene, layer.id, layer.visible));
    });

    return unsubscribe;
  }, [scene]);

  return <primitive object={scene} onClick={onModelClick ? (e) => { e.stopPropagation(); onModelClick(e); } : undefined} />;
}

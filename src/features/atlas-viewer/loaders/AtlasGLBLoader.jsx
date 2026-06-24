import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { anatomyEntities } from '../../atlas-knowledge-graph/anatomyEntities.mock';
import { mapMeshToLayer } from '../layers/atlasMeshLayerMapper';
import { anatomyLayerService } from '../../atlas-layers/anatomyLayerService';
import { setLayerVisibility } from '../layers/atlasMeshVisibilityController';
import { auditMeshMapping } from '../debug/atlasMeshAudit';

export default function AtlasGLBLoader({ url, onModelClick }) {
  // O construtor do useGLTF na v10+ do Drei suporta Draco (string) e ativa Meshopt internamente por default (se a lib estiver na stack).
  // TODO [Fase 8.4C]: Preparar suporte a KTX2/Basis para otimização de VRAM.
  const loadStart = React.useMemo(() => performance.now(), [url]);
  const { scene } = useGLTF(url, "https://www.gstatic.com/draco/versioned/decoders/1.5.5/");
  
  useEffect(() => {
    if (scene) {
      const loadEnd = performance.now();
      let meshCount = 0;
      let materialCount = 0;
      let textureCount = 0;
      
      const materials = new Set();
      const textures = new Set();
      let bvhEnabledMeshCount = 0;
      let totalTriangles = 0;
      let bvhSkippedCount = 0;

      let normalizedMaterialCount = 0;
      const bvhStart = performance.now();

      scene.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          const layerId = mapMeshToLayer(child.name, anatomyEntities);
          child.userData.atlasLayer = layerId;
          
          if (child.material) {
            const normalizeCadavericMaterial = (material) => {
              if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                material.metalness = 0.05;
                material.roughness = 0.85; 
                
                if (!material.roughnessMap) {
                   material.envMapIntensity = 0.8;
                }
                material.needsUpdate = true;
                normalizedMaterialCount++;
              }
            };

            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
              normalizeCadavericMaterial(m);
              materials.add(m.uuid);
              if (m.map) textures.add(m.map.uuid);
              if (m.normalMap) textures.add(m.normalMap.uuid);
            });
          }

          // Injeção de BVH (Phase 8.4D)
          if (child.geometry && child.geometry.isBufferGeometry) {
            try {
              if (child.geometry.index) {
                totalTriangles += child.geometry.index.count / 3;
              } else if (child.geometry.attributes.position) {
                totalTriangles += child.geometry.attributes.position.count / 3;
              }

              if (!child.geometry.boundsTree) {
                child.geometry.computeBoundsTree();
                child.geometry.userData.hasBVH = true;
                bvhEnabledMeshCount++;
              }
            } catch (err) {
              bvhSkippedCount++;
              console.warn(`[Atlas BVH Warning] BVH skipped for mesh: ${child.name}`, err);
            }
          }
        }
      });
      
      materialCount = materials.size;
      textureCount = textures.size;
      const bvhBuildTimeMs = performance.now() - bvhStart;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[AtlasGLBLoader Performance]
  - modelUrl: ${url}
  - loadTimeMs: ${(loadEnd - loadStart).toFixed(2)}ms
  - sceneChildren: ${scene.children.length}
  - meshCount: ${meshCount}
  - materialCount: ${materialCount}
  - textureCount: ${textureCount}
  - decoderUsed: draco (default Drei behavior for Meshopt also applies)
        `);
        console.log(`[Atlas BVH Acceleration]
  - modelUrl: ${url}
  - bvhEnabledMeshCount: ${bvhEnabledMeshCount}/${meshCount}
  - bvhSkippedCount: ${bvhSkippedCount}
  - bvhBuildTimeMs: ${bvhBuildTimeMs.toFixed(2)}ms
  - totalTriangles: ${Math.round(totalTriangles)}
  - raycastMode: accelerated
        `);
        console.log(`[Atlas Rendering Profile]
  - modelUrl: ${url}
  - materialCount: ${materialCount}
  - textureCount: ${textureCount}
  - normalizedMaterials: ${normalizedMaterialCount}
        `);
      }

      auditMeshMapping(scene);
    }
  }, [scene]);

  useEffect(() => {
    if (!scene) return;
    
    const initialLayers = anatomyLayerService.getAllLayers();
    initialLayers.forEach(layer => setLayerVisibility(scene, layer.id, layer.visible));

    const unsubscribe = anatomyLayerService.subscribe((layers) => {
      layers.forEach(layer => setLayerVisibility(scene, layer.id, layer.visible));
    });

    return unsubscribe;
  }, [scene]);

  useEffect(() => {
    return () => {
      // Limpeza profunda da VRAM no unmount
      if (scene) {
        scene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) {
              if (child.geometry.boundsTree) {
                child.geometry.disposeBoundsTree();
              }
              child.geometry.dispose();
            }
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach(m => {
                if (m.map) m.map.dispose();
                if (m.normalMap) m.normalMap.dispose();
                if (m.roughnessMap) m.roughnessMap.dispose();
                if (m.metalnessMap) m.metalnessMap.dispose();
                m.dispose();
              });
            }
          }
        });
      }
      useGLTF.clear(url);
    };
  }, [url, scene]);

  return <primitive object={scene} onClick={onModelClick ? (e) => { e.stopPropagation(); onModelClick(e); } : undefined} />;
}

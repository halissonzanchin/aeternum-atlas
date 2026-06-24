import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';
import { useAtlasViewer } from '../context/AtlasViewerContext';

const ErrorBoxFallback = () => {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#ef4444" wireframe opacity={0.5} transparent />
    </mesh>
  );
};

export default function AtlasModelLoader() {
  const { 
    modelId, 
    model, 
    handleModelLoaded, 
    handleModelError,
    layers: structureLayers,
    hiddenLayers,
    selectedLayer
  } = useAtlasViewer();
  
  const [modelUrl, setModelUrl] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isPrechecking, setIsPrechecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    if (!model || !model.filePath) {
      if (mounted) {
        setLoadError(true);
        setIsPrechecking(false);
        handleModelError('Modelo não registrado ou sem rota.');
      }
      return;
    }

    fetch(model.filePath, { method: 'HEAD' })
      .then(res => {
        if (!mounted) return;
        if (res.ok) {
          setModelUrl(model.filePath);
          setIsPrechecking(false);
        } else {
          setLoadError(true);
          setIsPrechecking(false);
          handleModelError(`Arquivo físico não encontrado em ${model.filePath}`);
        }
      })
      .catch(err => {
        if (!mounted) return;
        setLoadError(true);
        setIsPrechecking(false);
        handleModelError('Erro de CORS ou rede ao testar presença do arquivo 3D.');
      });

    return () => {
      mounted = false;
    };
  }, [modelId, model, handleModelError]);

  if (isPrechecking) {
    return null;
  }

  if (loadError || !modelUrl) {
    return <ErrorBoxFallback />;
  }

  const isObj = modelUrl.toLowerCase().endsWith('.obj');

  return (
    <Suspense fallback={null}>
      {isObj ? (
        <ObjModel 
          url={modelUrl} 
          onLoaded={handleModelLoaded}
          onError={handleModelError}
          structureLayers={structureLayers}
          hiddenLayers={hiddenLayers}
          selectedLayer={selectedLayer}
        />
      ) : (
        <GltfModel 
          url={modelUrl} 
          onLoaded={handleModelLoaded}
          onError={handleModelError}
          structureLayers={structureLayers}
          hiddenLayers={hiddenLayers}
          selectedLayer={selectedLayer}
        />
      )}
    </Suspense>
  );
}

function GltfModel({ url, onLoaded, onError, structureLayers, hiddenLayers, selectedLayer }) {
  try {
    const { scene } = useGLTF(url);
    return (
      <ModelSceneProcessor 
        scene={scene}
        onLoaded={onLoaded}
        structureLayers={structureLayers}
        hiddenLayers={hiddenLayers}
        selectedLayer={selectedLayer}
      />
    );
  } catch (err) {
    if (err instanceof Promise) {
      throw err; // Re-throw for Suspense
    }
    if (onError) onError(err.message);
    return <ErrorBoxFallback />;
  }
}

function ObjModel({ url, onLoaded, onError, structureLayers, hiddenLayers, selectedLayer }) {
  try {
    const scene = useLoader(OBJLoader, url);
    return (
      <ModelSceneProcessor 
        scene={scene}
        onLoaded={onLoaded}
        structureLayers={structureLayers}
        hiddenLayers={hiddenLayers}
        selectedLayer={selectedLayer}
      />
    );
  } catch (err) {
    if (err instanceof Promise) {
      throw err; // Re-throw for Suspense
    }
    if (onError) onError(err.message);
    return <ErrorBoxFallback />;
  }
}

function ModelSceneProcessor({ scene, onLoaded, structureLayers, hiddenLayers, selectedLayer }) {
  useEffect(() => {
    if (scene) {
      onLoaded();
    }
  }, [scene, onLoaded]);

  const meshLayerMap = useMemo(() => {
    const map = new Map();
    structureLayers.forEach(layer => {
      map.set(layer.meshName, layer);
    });
    return map;
  }, [structureLayers]);

  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Garante que o material exista e seja processável (muito importante para OBJs crus sem .mtl)
        if (!child.material || (Array.isArray(child.material) && child.material.length === 0) || Object.keys(child.material).length === 0) {
           child.material = new THREE.MeshStandardMaterial({
             color: '#d4d4d8', // Cor plástica/osso básica
             roughness: 0.5,
             metalness: 0.1,
           });
        }
        
        if (child.material) {
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material.clone();
            child.userData.originalMaterial.side = THREE.DoubleSide;
          }

          const layer = meshLayerMap.get(child.name);
          
          if (layer) {
            const isHidden = hiddenLayers.has(layer.layerId);
            const isSelected = selectedLayer?.layerId === layer.layerId;
            const hasSelectionGlobal = !!selectedLayer; 

            child.visible = !isHidden;

            const mat = child.material;
            mat.copy(child.userData.originalMaterial);
            mat.transparent = true;
            mat.opacity = 1.0;
            mat.emissive.setHex(0x000000);

            if (isSelected) {
              mat.emissive.set(layer.highlightColor || '#2dd4bf');
              mat.emissiveIntensity = 0.5; 
              mat.opacity = 1.0;
            } else if (hasSelectionGlobal) {
              mat.opacity = layer.opacityWhenIsolated || 0.15;
              mat.color.lerp(new THREE.Color('#333333'), 0.5); 
            }
            
            mat.needsUpdate = true;
          } else {
            if (selectedLayer) {
              child.material.transparent = true;
              child.material.opacity = 0.05;
            } else {
              child.material.copy(child.userData.originalMaterial);
            }
            child.material.needsUpdate = true;
          }
        }
      }
    });
  }, [scene, meshLayerMap, hiddenLayers, selectedLayer]);

  useEffect(() => {
    if (scene && !scene.userData.isScaled) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 3.0;
      const scaleFactor = targetSize / maxDim;

      scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const scaledBox = new THREE.Box3().setFromObject(scene);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      scene.position.x += (scene.position.x - scaledCenter.x);
      scene.position.y += (scene.position.y - scaledCenter.y);
      scene.position.z += (scene.position.z - scaledCenter.z);

      scene.userData.isScaled = true;
    }
  }, [scene]);

  return <primitive object={scene} />;
}

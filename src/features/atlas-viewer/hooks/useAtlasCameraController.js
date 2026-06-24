import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function useAtlasCameraController(selectedAnnotation, orbitControlsRef, defaultPosition = [0, 0, 6]) {
  const { camera } = useThree();
  
  // Ref para as posições alvos de interpolação
  const targetCameraPos = useRef(new THREE.Vector3(...defaultPosition));
  const targetOrbitPos = useRef(new THREE.Vector3(0, 0, 0));
  
  // Ref para saber se estamos no meio de uma transição cinematográfica
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (selectedAnnotation) {
      // Se houver anotação, define os alvos para a anotação
      const camPos = selectedAnnotation.camera?.position || selectedAnnotation.cameraPosition;
      if (camPos) {
        targetCameraPos.current.set(...camPos);
      } else {
        // Fallback: Afasta um pouco da posição do marcador dependendo da câmera atual
        const markerPos = new THREE.Vector3(...selectedAnnotation.position);
        const distance = 3.5; // Distância fixa razoável para foco
        const direction = camera.position.clone().sub(markerPos).normalize();
        
        targetCameraPos.current.copy(markerPos).add(direction.multiplyScalar(distance));
      }
      
      const targetPos = selectedAnnotation.camera?.target || selectedAnnotation.target || selectedAnnotation.cameraTarget;
      if (targetPos) {
        targetOrbitPos.current.set(...targetPos);
      } else {
        targetOrbitPos.current.set(...selectedAnnotation.position);
      }
      
      isTransitioning.current = true;
    } else {
      // Se não houver anotação (Reset View), volta para as posições default
      targetCameraPos.current.set(...defaultPosition);
      targetOrbitPos.current.set(0, 0, 0);
      isTransitioning.current = true;
    }
  }, [selectedAnnotation, defaultPosition, camera]);

  useFrame((state, delta) => {
    if (!isTransitioning.current || !orbitControlsRef.current) return;

    // Fator de suavidade dependente do framerate (delta)
    // Lerp rate de ~3.5 cria uma curva cinematográfica suave sem ser muito lenta
    const lerpFactor = 3.5 * delta;

    // Movimentando a Câmera
    camera.position.lerp(targetCameraPos.current, lerpFactor);

    // Movimentando o Target do OrbitControls (Para onde a câmera "olha")
    orbitControlsRef.current.target.lerp(targetOrbitPos.current, lerpFactor);
    orbitControlsRef.current.update();

    // Condição de parada para economizar recursos de CPU
    const distPos = camera.position.distanceTo(targetCameraPos.current);
    const distTarget = orbitControlsRef.current.target.distanceTo(targetOrbitPos.current);

    if (distPos < 0.005 && distTarget < 0.005) {
      isTransitioning.current = false;
    }
  });

  return null;
}

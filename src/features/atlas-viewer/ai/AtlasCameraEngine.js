import * as THREE from 'three';

/**
 * ATLAS CAMERA ENGINE
 * Responsável por gerenciar a cinemática da câmera, voos até marcadores e fallbacks de enquadramento.
 */
class AtlasCameraEngine {
  constructor() {
    this.isFlying = false;
    this.currentTargetAnnotationId = null;
    this.flyToDurationMs = 1200;
  }

  /**
   * Move a câmera suavemente para uma posição salva no marcador.
   * Se o marcador for antigo e não tiver câmera, usa o fallback automático.
   */
  flyToMarker(cameraControls, marker, scene) {
    if (!cameraControls) return;

    this.isFlying = true;
    this.currentTargetAnnotationId = marker.id;

    // Padronização do marker object
    const camPos = marker.camera?.position || marker.cameraPosition;
    const targetPos = marker.camera?.target || marker.target;

    if (camPos && targetPos) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Atlas Camera FlyTo]
  - annotationId: ${marker.id}
  - title: ${marker.title}
  - hasSavedCamera: true
  - toCameraPosition: ${camPos}
  - toTarget: ${targetPos}
  - fallbackUsed: false`);
      }

      // Modo A: CameraControls (suporta setLookAt)
      if (typeof cameraControls.setLookAt === 'function') {
        cameraControls.setLookAt(...camPos, ...targetPos, true).then(() => {
          this.isFlying = false;
        });
        return;
      }
      
      // Modo B/C: OrbitControls ou Fallback
      if (scene && scene.isScene === undefined && cameraControls.object && cameraControls.target) {
        // Interpolação suave manual via requestAnimationFrame para OrbitControls
        const startPos = cameraControls.object.position.clone();
        const startTarget = cameraControls.target.clone();
        const endPos = new THREE.Vector3(...camPos);
        const endTarget = new THREE.Vector3(...targetPos);
        
        let progress = 0;
        const duration = this.flyToDurationMs;
        const startTime = performance.now();
        
        const animate = (time) => {
          if (!this.isFlying) return; // Cancelado
          
          progress = (time - startTime) / duration;
          if (progress >= 1) {
            cameraControls.object.position.copy(endPos);
            cameraControls.target.copy(endTarget);
            if (typeof cameraControls.update === 'function') cameraControls.update();
            this.isFlying = false;
            return;
          }
          
          // Easing simples (easeInOutQuad)
          const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          
          cameraControls.object.position.lerpVectors(startPos, endPos, ease);
          cameraControls.target.lerpVectors(startTarget, endTarget, ease);
          if (typeof cameraControls.update === 'function') cameraControls.update();
          
          requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
        return;
      }
    }

    // FALLBACK AUTOMÁTICO PARA MARCADORES ANTIGOS
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Atlas Camera FlyTo] Annotation sem câmera salva, usando fallback automático.`);
      console.log(`[Atlas Camera FlyTo]
  - annotationId: ${marker.id}
  - title: ${marker.title}
  - hasSavedCamera: false
  - fallbackUsed: true`);
    }

    const markerPos = marker.position;
    if (!markerPos) {
      this.isFlying = false;
      return; // Nada que possamos fazer sem a posição 3D
    }

    // Calcula um offset seguro
    // 1. Acha o bounding box geral para entender a escala
    const box = new THREE.Box3();
    if (scene) {
      box.setFromObject(scene);
    } else {
      box.set(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
    }
    
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Distância segura: aprox 30% do tamanho total do modelo
    const safeDistance = maxDim * 0.3;

    // Vamos pegar a posição atual da câmera para manter o mesmo vetor de direção se possível, 
    // ou apenas recuar no eixo Z global
    const currentCamPos = new THREE.Vector3();
    cameraControls.getPosition(currentCamPos);
    
    const mPosVector = new THREE.Vector3(...markerPos);
    
    // Direção da câmera pro marcador
    const direction = new THREE.Vector3().subVectors(currentCamPos, mPosVector).normalize();
    
    // Se tivermos a normal (ex: draft marker recém criado), priorizamos afastar na direção da normal
    if (marker.normal) {
      direction.copy(new THREE.Vector3(...marker.normal)).normalize();
    } else if (direction.lengthSq() === 0) {
      // Se por acaso a direção der 0 (câmera dentro do marcador e sem normal), usamos Z+
      direction.set(0, 0, 1);
    }

    const targetFallbackCamPos = new THREE.Vector3().copy(mPosVector).add(direction.multiplyScalar(safeDistance));

    if (typeof cameraControls.setLookAt === 'function') {
      cameraControls.setLookAt(
        targetFallbackCamPos.x, targetFallbackCamPos.y, targetFallbackCamPos.z,
        mPosVector.x, mPosVector.y, mPosVector.z,
        true
      ).then(() => {
        this.isFlying = false;
      });
    } else if (cameraControls.object && cameraControls.target) {
      this.isFlying = true;
      const startPos = cameraControls.object.position.clone();
      const startTarget = cameraControls.target.clone();
      const endPos = targetFallbackCamPos;
      const endTarget = mPosVector;
      
      let progress = 0;
      const duration = this.flyToDurationMs;
      const startTime = performance.now();
      
      const animate = (time) => {
        if (!this.isFlying) return; // Cancelado
        
        progress = (time - startTime) / duration;
        if (progress >= 1) {
          cameraControls.object.position.copy(endPos);
          cameraControls.target.copy(endTarget);
          if (typeof cameraControls.update === 'function') cameraControls.update();
          this.isFlying = false;
          return;
        }
        
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        cameraControls.object.position.lerpVectors(startPos, endPos, ease);
        cameraControls.target.lerpVectors(startTarget, endTarget, ease);
        if (typeof cameraControls.update === 'function') cameraControls.update();
        
        requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    } else {
      this.isFlying = false;
    }
  }

  resetView(cameraControls) {
    if (!cameraControls) return;
    if (typeof cameraControls.reset === 'function') {
      cameraControls.reset(true);
    }
  }
}

export const atlasCameraEngine = new AtlasCameraEngine();

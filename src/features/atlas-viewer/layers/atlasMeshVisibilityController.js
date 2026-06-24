export function setLayerVisibility(scene, layerId, visible) {
  if (!scene) return;
  scene.traverse((child) => {
    if (child.isMesh && child.userData.atlasLayer === layerId) {
      child.visible = visible;
    }
  });
}

export function showOnlyLayer(scene, layerId) {
  if (!scene) return;
  scene.traverse((child) => {
    if (child.isMesh) {
      if (child.userData.atlasLayer === layerId) {
        child.visible = true;
      } else {
        child.visible = false;
      }
    }
  });
}

export function showAllLayers(scene) {
  if (!scene) return;
  scene.traverse((child) => {
    if (child.isMesh) {
      child.visible = true;
    }
  });
}

export function hideAllLayers(scene) {
  if (!scene) return;
  scene.traverse((child) => {
    if (child.isMesh) {
      child.visible = false;
    }
  });
}

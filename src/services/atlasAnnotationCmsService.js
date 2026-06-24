import { findLocalModel } from '../data/localModels';
import { isValidUuid, isTemporaryModelId } from './modelService';

function requireValidUuid(modelId, operation) {
  if (isTemporaryModelId(modelId)) {
    throw new Error(`[atlasAnnotationCmsService] Operação negada (${operation}): ID temporário/local detectado '${modelId}'.`);
  }
  if (!isValidUuid(modelId)) {
    throw new Error(`[atlasAnnotationCmsService] Operação negada (${operation}): ID '${modelId}' não é um UUID v4 válido.`);
  }
}

export const atlasAnnotationCmsService = {
  getStorageKey(modelId) {
    return `atlas_annotations_cms_${modelId}`;
  },

  getMarkers(modelId) {
    if (!modelId) return [];
    try {
      const data = localStorage.getItem(this.getStorageKey(modelId));
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.map(m => ({
          ...m,
          camera: m.camera || { position: m.cameraPosition || [0,0,5], target: m.target || [0,0,0] },
          category: m.category || "Geral",
          color: m.color || "#16c79a",
          visible: m.visible !== undefined ? m.visible : true,
          anatomicalSystem: m.anatomicalSystem || ""
        }));
      }
    } catch (err) {
      console.error("Error reading markers from localStorage", err);
    }
    
    // Fallback to synthetic markers defined in local digital twins
    const localModel = findLocalModel(modelId);
    if (localModel && localModel.markers && localModel.markers.length > 0) {
      return localModel.markers;
    }
    
    return [];
  },

  saveMarkers(modelId, markers) {
    if (!modelId) return false;
    requireValidUuid(modelId, 'saveMarkers');
    try {
      localStorage.setItem(this.getStorageKey(modelId), JSON.stringify(markers));
      return true;
    } catch (err) {
      console.error("Error saving markers to localStorage", err);
      return false;
    }
  },

  addMarker(modelId, markerData) {
    requireValidUuid(modelId, 'addMarker');
    const markers = this.getMarkers(modelId);
    const newMarker = {
      id: markerData.id || `marker-${Date.now()}`,
      title: markerData.title || "Novo Marcador",
      description: markerData.description || "",
      position: markerData.position || [0, 0, 0],
      cameraPosition: markerData.cameraPosition || [0, 0, 5],
      target: markerData.target || [0, 0, 0],
      camera: markerData.camera || {
        position: markerData.cameraPosition || [0, 0, 5],
        target: markerData.target || [0, 0, 0]
      },
      category: markerData.category || "Geral",
      anatomicalSystem: markerData.anatomicalSystem || "",
      color: markerData.color || "#16c79a",
      visible: markerData.visible !== undefined ? markerData.visible : true,
      order: markers.length + 1,
      ...markerData
    };
    markers.push(newMarker);
    this.saveMarkers(modelId, markers);
    return newMarker;
  },

  updateMarker(modelId, markerId, updates) {
    requireValidUuid(modelId, 'updateMarker');
    const markers = this.getMarkers(modelId);
    const index = markers.findIndex(m => m.id === markerId);
    if (index !== -1) {
      markers[index] = { ...markers[index], ...updates };
      this.saveMarkers(modelId, markers);
      return markers[index];
    }
    return null;
  },

  removeMarker(modelId, markerId) {
    requireValidUuid(modelId, 'removeMarker');
    const markers = this.getMarkers(modelId);
    const filtered = markers.filter(m => m.id !== markerId);
    this.saveMarkers(modelId, filtered);
  }
};

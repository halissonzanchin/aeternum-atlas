import { anatomyLayers } from './anatomyLayers.mock';
import { anatomyEntities } from '../atlas-knowledge-graph/anatomyEntities.mock';

// Estado local da UI simulando um store para as camadas. 
// Num app real, poderia estar num Context ou Zustand.
let currentLayersState = [...anatomyLayers];

// Um pub/sub simples para notificar a UI de mudanças nas camadas
const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener([...currentLayersState]));
};

export const anatomyLayerService = {
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getAllLayers: () => {
    return [...currentLayersState];
  },

  toggleLayer: (layerId) => {
    currentLayersState = currentLayersState.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    notifyListeners();
    // No futuro, isso despachará um evento para o WebGL (ex: atlasViewerCommands.toggleMeshGroup(layerId))
    console.log(`[AnatomyLayerService] Layer toggled: ${layerId}. Future: Hide/Show meshes.`);
  },

  showOnlyLayer: (layerId) => {
    currentLayersState = currentLayersState.map(layer => ({
      ...layer,
      visible: layer.id === layerId
    }));
    notifyListeners();
    console.log(`[AnatomyLayerService] Show only layer: ${layerId}.`);
  },

  showAllLayers: () => {
    currentLayersState = currentLayersState.map(layer => ({
      ...layer,
      visible: true
    }));
    notifyListeners();
    console.log(`[AnatomyLayerService] Show all layers.`);
  },

  hideAllLayers: () => {
    currentLayersState = currentLayersState.map(layer => ({
      ...layer,
      visible: false
    }));
    notifyListeners();
    console.log(`[AnatomyLayerService] Hide all layers.`);
  },

  getEntitiesByLayer: (layerId) => {
    return anatomyEntities.filter(e => e.layer === layerId);
  }
};

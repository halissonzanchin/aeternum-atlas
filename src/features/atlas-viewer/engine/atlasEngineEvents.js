// Eventos do Sistema do Motor 3D
export const ENGINE_EVENTS = {
  ANNOTATION_SELECTED: 'ANNOTATION_SELECTED',
  STRUCTURE_SELECTED: 'STRUCTURE_SELECTED',
  CAMERA_FOCUS_CHANGED: 'CAMERA_FOCUS_CHANGED',
  MODEL_LOADED: 'MODEL_LOADED',
  MODEL_FAILED: 'MODEL_FAILED',
  QUIZ_OPENED: 'QUIZ_OPENED',
  EDUCATIONAL_PANEL_OPENED: 'EDUCATIONAL_PANEL_OPENED',
  RESET_VIEW: 'RESET_VIEW',
  QUIZ_STARTED: 'QUIZ_STARTED',
  QUIZ_ANSWERED: 'QUIZ_ANSWERED',
  QUIZ_CORRECT: 'QUIZ_CORRECT',
  QUIZ_INCORRECT: 'QUIZ_INCORRECT'
};

// Simple Pub/Sub Event Bus
class EngineEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Retorna função de unsubscribe
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, payload = {}) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Erro no listener do evento ${event}:`, error);
        }
      });
    }
  }
}

// Singleton global do Event Bus para o Atlas Viewer
export const atlasEventBus = new EngineEventBus();

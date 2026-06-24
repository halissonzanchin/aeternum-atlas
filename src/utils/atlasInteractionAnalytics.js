// Constantes de Eventos do Motor
export const ANALYTICS_EVENTS = {
  MODEL_OPENED: 'MODEL_OPENED',
  MODEL_CLOSED: 'MODEL_CLOSED',
  ANNOTATION_SELECTED: 'ANNOTATION_SELECTED',
  STRUCTURE_SELECTED: 'STRUCTURE_SELECTED',
  STRUCTURE_HIDDEN: 'STRUCTURE_HIDDEN',
  STRUCTURE_ISOLATED: 'STRUCTURE_ISOLATED',
  CAMERA_FOCUS: 'CAMERA_FOCUS',
  RESET_VIEW: 'RESET_VIEW',
  AUTO_ROTATE_ENABLED: 'AUTO_ROTATE_ENABLED',
  AUTO_ROTATE_DISABLED: 'AUTO_ROTATE_DISABLED'
};

const STORAGE_KEY = '@aeternum:atlas_analytics_session';

export function initializeSession(modelId) {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionData = {
    sessionId,
    modelId,
    startTime: Date.now(),
    endTime: null,
    duration: 0,
    events: []
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  return sessionData;
}

export function logEvent(eventType, payload = {}) {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return;

    const sessionData = JSON.parse(rawData);
    sessionData.events.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: eventType,
      timestamp: Date.now(),
      payload
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.warn('Erro ao salvar telemetria local:', error);
  }
}

export function endSession() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return null;

    const sessionData = JSON.parse(rawData);
    sessionData.endTime = Date.now();
    sessionData.duration = sessionData.endTime - sessionData.startTime;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    return sessionData;
  } catch (error) {
    console.warn('Erro ao fechar sessão de telemetria:', error);
    return null;
  }
}

export function getSession() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : null;
  } catch (error) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

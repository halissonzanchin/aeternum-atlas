const listeners = new Set();

/**
 * Command Bridge between AI Tutors and Atlas Viewer Engine
 * A simple pub/sub pattern to decouple UI Chatbots from WebGL Camera Controllers.
 */
export const atlasViewerCommands = {
  subscribe: (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  
  focusMarker: (markerId) => {
    listeners.forEach(cb => cb({ type: 'FOCUS_MARKER', payload: markerId }));
  },
  
  focusStructure: (structureName) => {
    listeners.forEach(cb => cb({ type: 'FOCUS_STRUCTURE', payload: structureName }));
  },
  
  resetCamera: () => {
    listeners.forEach(cb => cb({ type: 'RESET_CAMERA' }));
  },

  openAnnotation: (markerId) => {
    listeners.forEach(cb => cb({ type: 'OPEN_ANNOTATION', payload: markerId }));
  }
};

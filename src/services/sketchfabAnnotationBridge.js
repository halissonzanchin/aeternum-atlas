/**
 * sketchfabAnnotationBridge.js
 * A simple event bus / store to bridge Sketchfab Viewer API annotations to React components
 * without causing full re-renders of the 3D canvas context.
 */

class SketchfabAnnotationBridge {
  constructor() {
    this.api = null;
    this.annotations = [];
    this.listeners = new Set();
    this.readyListeners = new Set();
    this.selectListeners = new Set();
  }

  registerSketchfabApi(api) {
    this.api = api;
    this.notifyReady();
  }

  isSketchfabReady() {
    return this.api !== null;
  }

  setAnnotations(annotations) {
    this.annotations = annotations || [];
    this.notifyListeners();
  }

  getSketchfabAnnotations() {
    return this.annotations;
  }

  goToSketchfabAnnotation(index) {
    if (!this.api || typeof this.api.gotoAnnotation !== "function") return;
    this.api.gotoAnnotation(index, { preventCameraAnimation: false, preventCameraMove: false }, (err) => {
      if (err) console.error("Error navigating to Sketchfab annotation", err);
    });
  }

  triggerAnnotationSelect(index) {
    this.notifySelectListeners(index);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  subscribeToSketchfabReady(callback) {
    this.readyListeners.add(callback);
    return () => this.readyListeners.delete(callback);
  }

  subscribeToAnnotationSelect(callback) {
    this.selectListeners.add(callback);
    return () => this.selectListeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.annotations));
  }

  notifyReady() {
    this.readyListeners.forEach(cb => cb(this.api));
  }
  
  notifySelectListeners(index) {
    this.selectListeners.forEach(cb => cb(index));
  }
}

export const sketchfabBridge = new SketchfabAnnotationBridge();

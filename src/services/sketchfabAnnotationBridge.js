/**
 * sketchfabAnnotationBridge.js
 * A simple event bus / store to bridge Sketchfab Viewer API annotations to React components
 * without causing full re-renders of the 3D canvas context.
 */

const NAVIGATION_COOLDOWN_MS = 450;
const NAVIGATION_TIMEOUT_MS = 2500;

export class SketchfabAnnotationBridge {
  constructor() {
    this.api = null;
    this.annotations = [];
    this.listeners = new Set();
    this.readyListeners = new Set();
    this.selectListeners = new Set();
    this.activeNavigation = null;
    this.queuedNavigation = null;
    this.lastCompletedNavigation = null;
  }

  registerSketchfabApi(api) {
    if (this.api !== api) {
      this.clearNavigationState();
    }

    this.api = api;
    this.notifyReady();
  }

  unregisterSketchfabApi(api) {
    if (api && this.api !== api) return;
    this.clearNavigationState();
    this.api = null;
    this.annotations = [];
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

  goToSketchfabAnnotation(index, options = {}) {
    if (
      !this.api ||
      typeof this.api.gotoAnnotation !== "function" ||
      !Number.isInteger(index) ||
      index < 0
    ) {
      return false;
    }

    const request = {
      index,
      requestId: options.requestId || null,
      viewerOptions: {
        preventCameraAnimation: false,
        preventCameraMove: false,
        ...(options.viewerOptions || {})
      },
      onComplete: typeof options.onComplete === "function" ? options.onComplete : null
    };

    if (this.activeNavigation) {
      if (
        this.activeNavigation.index === index ||
        (request.requestId && this.activeNavigation.requestId === request.requestId)
      ) {
        return false;
      }

      this.queuedNavigation = request;
      return true;
    }

    if (
      this.lastCompletedNavigation?.index === index &&
      Date.now() - this.lastCompletedNavigation.finishedAt < NAVIGATION_COOLDOWN_MS
    ) {
      return false;
    }

    this.startNavigation(request);
    return true;
  }

  startNavigation(request) {
    const api = this.api;
    if (!api || typeof api.gotoAnnotation !== "function") return;

    let completed = false;

    const finish = (error) => {
      if (completed) return;
      completed = true;

      if (this.activeNavigation?.timeoutId) {
        globalThis.clearTimeout(this.activeNavigation.timeoutId);
      }

      this.activeNavigation = null;
      this.lastCompletedNavigation = {
        index: request.index,
        finishedAt: Date.now()
      };

      if (error) {
        console.error("Error navigating to Sketchfab annotation", error);
      }

      request.onComplete?.(error || null);

      const nextRequest = this.queuedNavigation;
      this.queuedNavigation = null;

      if (nextRequest && this.api === api) {
        this.startNavigation(nextRequest);
      }
    };

    const timeoutId = globalThis.setTimeout(
      () => finish(new Error("sketchfab_annotation_navigation_timeout")),
      NAVIGATION_TIMEOUT_MS
    );
    timeoutId?.unref?.();

    this.activeNavigation = {
      ...request,
      timeoutId
    };

    try {
      api.gotoAnnotation(request.index, request.viewerOptions, finish);
    } catch (error) {
      finish(error);
    }
  }

  clearNavigationState() {
    if (this.activeNavigation?.timeoutId) {
      globalThis.clearTimeout(this.activeNavigation.timeoutId);
    }

    this.activeNavigation = null;
    this.queuedNavigation = null;
    this.lastCompletedNavigation = null;
  }

  resetCamera() {
    if (!this.api || typeof this.api.recenterCamera !== "function") return false;
    this.api.recenterCamera();
    return true;
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

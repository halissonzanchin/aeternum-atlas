import {
  getAccessLogs as getProgressAccessLogs,
  markModelAsStudied,
  toggleFavoriteModel
} from "../progressService";
import { migrateLegacyTelemetryStorage, readStorage, removeStorage, storageKeys, writeStorage } from "../storage/storageService";

export const eventTypes = [
  "login",
  "logout",
  "open_dashboard",
  "open_models_page",
  "open_model_detail",
  "open_model_viewer",
  "open_external_sketchfab",
  "favorite_model",
  "complete_model",
  "uncomplete_model",
  "copy_model_link",
  "save_model_notes",
  "export_model_notes_pdf",
  "start_anatomical_quiz",
  "finish_anatomical_quiz",
  "open_report",
  "export_csv",
  "viewer_duration",
  "viewer_api_initialized",
  "viewer_ready",
  "viewer_ready_timeout",
  "viewer_error",
  "viewer_script_error",
  "viewer_timeout",
  "viewer_click",
  "viewer_api_method_error",
  "annotation_selected",
  "annotation_focused",
  "annotation_opened_from_platform",
  "camera_reset"
];

function eventId() {
  return `evt-${crypto.randomUUID?.() || Date.now()}`;
}

export function trackEvent({ userId, institutionId, role = "student", modelId = null, eventType, type, metadata = {}, timestamp = new Date().toISOString(), durationSeconds = null, ...extra }) {
  migrateLegacyTelemetryStorage();
  const resolvedEventType = eventType || type;
  if (!resolvedEventType) return null;
  const resolvedUserId = userId || "anonymous";
  const resolvedInstitutionId = institutionId || null;

  const event = {
    id: eventId(),
    userId: resolvedUserId,
    institutionId: resolvedInstitutionId,
    role,
    modelId,
    eventType: resolvedEventType,
    type: type || resolvedEventType,
    action: resolvedEventType,
    metadata,
    ...extra,
    timestamp,
    startedAt: timestamp,
    endedAt: null,
    durationSeconds: durationSeconds ?? metadata.durationSeconds ?? null,
    createdAt: timestamp
  };

  const events = readStorage(storageKeys.analyticsEvents, []);
  writeStorage(storageKeys.analyticsEvents, [event, ...events].slice(0, 1000));
  return event;
}

export function listAnalyticsEvents(filters = {}) {
  migrateLegacyTelemetryStorage();
  const events = readStorage(storageKeys.analyticsEvents, []);
  return events.filter(event => {
    if (filters.institutionId && event.institutionId !== filters.institutionId) return false;
    if (filters.userId && event.userId !== filters.userId) return false;
    if (filters.role && event.role !== filters.role) return false;
    if (filters.eventType && event.eventType !== filters.eventType) return false;
    return true;
  });
}

export function clearAccessLogs() {
  migrateLegacyTelemetryStorage();
  removeStorage(storageKeys.analyticsEvents);
}

export function getModelAnalytics(modelId) {
  const logs = listAnalyticsEvents().filter(log => log.modelId === modelId);
  const isType = (log, value) => log.type === value || log.eventType === value || log.action === value;

  return {
    totalEvents: logs.length,
    viewerReady: logs.filter(log => isType(log, "viewer_ready")).length,
    annotationClicks: logs.filter(log => isType(log, "annotation_selected") || isType(log, "annotation_opened_from_platform")).length,
    cameraResets: logs.filter(log => isType(log, "camera_reset")).length,
    viewerClicks: logs.filter(log => isType(log, "viewer_click")).length,
    errors: logs.filter(log => isType(log, "viewer_error") || isType(log, "viewer_script_error") || isType(log, "viewer_timeout")).length,
    lastInteraction: logs[0]?.timestamp || null
  };
}

export function favoriteModel(user, model) {
  const added = toggleFavoriteModel(user, model?.id);
  trackEvent({
    userId: user?.id,
    institutionId: user?.institutionId,
    role: user?.role,
    modelId: model?.id,
    eventType: "favorite_model",
    metadata: { toggled: added ? "added" : "removed" }
  });
  return added;
}

export function completeModel(user, model) {
  markModelAsStudied(user, model?.id, model);
  trackEvent({
    userId: user?.id,
    institutionId: user?.institutionId,
    role: user?.role,
    modelId: model?.id,
    eventType: "complete_model"
  });
  return true;
}

export function getAccessLogs(user) {
  return getProgressAccessLogs(user);
}

export function getRealtimeEventSnapshot(institutionId) {
  if (!institutionId) {
    return {
      institutionId: null,
      activeUsersNow: 0,
      eventsLastHour: 0,
      viewerErrors: 0,
      lastEventAt: null,
      restricted: true
    };
  }

  const events = listAnalyticsEvents({ institutionId });
  const now = Date.now();
  const lastHour = events.filter(event => now - new Date(event.timestamp || event.createdAt).getTime() < 60 * 60 * 1000);

  return {
    institutionId,
    activeUsersNow: new Set(lastHour.map(event => event.userId)).size,
    eventsLastHour: lastHour.length,
    viewerErrors: lastHour.filter(event => event.eventType?.includes("viewer_error")).length,
    lastEventAt: events[0]?.timestamp || null
  };
}

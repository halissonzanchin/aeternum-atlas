import { institutionProfile, mockInstitutionStudents, topAccessedModels } from "../../data/mockInstitutionalAnalytics";
import {
  getAccessLogs as getProgressAccessLogs,
  markModelAsStudied,
  toggleFavoriteModel
} from "../progressService";
import { readStorage, removeStorage, storageKeys, writeStorage } from "../storage/storageService";

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
  "copy_model_link",
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
  const resolvedEventType = eventType || type;
  if (!resolvedEventType) return null;

  const event = {
    id: eventId(),
    userId: userId || "anonymous",
    institutionId: institutionId || "upe-presidente-franco",
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
  markModelAsStudied(user, model?.id);
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

export function getStudentMonthlyUsage(user) {
  const logs = getProgressAccessLogs(user);
  const totalLogins = logs.filter(item => item.eventType === "login" || item.action === "login").length || 12;
  const totalModelsOpened = logs.filter(item => item.modelId).length || 18;

  return {
    id: `usage-${user?.id || "student-demo"}-2026-04`,
    userId: user?.id || "student-demo",
    institutionId: user?.institutionId || "upe-presidente-franco",
    month: 4,
    year: 2026,
    totalLogins,
    totalModelsOpened,
    totalStudyMinutes: 320,
    activeStatus: "ativo"
  };
}

export function getInstitutionStats() {
  return {
    ...institutionProfile,
    activeStudentsToday: institutionProfile.activeStudentsToday || institutionProfile.accessesToday,
    averageStudyMinutesPerStudent: institutionProfile.averageStudyMinutesPerStudent || 121
  };
}

export function getMostAccessedModels() {
  return topAccessedModels;
}

export function getInstitutionStudents() {
  return mockInstitutionStudents;
}

export function getRealtimeEventSnapshot(institutionId = "upe-presidente-franco") {
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

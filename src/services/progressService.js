import { migrateLegacyTelemetryStorage, readStorage, storageKeys, writeStorage } from "./storage/storageService";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/supabaseClient";
import { normalizedActiveSeconds } from "./learningMetrics";

const ANONYMOUS_USER_ID = "anonymous";

function userIdOf(user) {
  return user?.id || ANONYMOUS_USER_ID;
}

function institutionIdOf(user) {
  return user?.institutionId || user?.institution_id || null;
}

function nowIso() {
  return new Date().toISOString();
}

function uniqueByModel(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.userId}:${item.modelId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getFavoriteModelIds(user) {
  const id = userIdOf(user);
  return readStorage(storageKeys.favorites, [])
    .filter(item => item.userId === id)
    .map(item => item.modelId);
}

export function isFavoriteModel(user, modelId) {
  return getFavoriteModelIds(user).includes(modelId);
}

export function favoriteModel(user, modelId) {
  const favorites = readStorage(storageKeys.favorites, []);
  const entry = {
    userId: userIdOf(user),
    institutionId: institutionIdOf(user),
    modelId,
    createdAt: nowIso()
  };
  const next = uniqueByModel([entry, ...favorites]);
  writeStorage(storageKeys.favorites, next);
  return true;
}

export function unfavoriteModel(user, modelId) {
  const id = userIdOf(user);
  const next = readStorage(storageKeys.favorites, []).filter(item => !(item.userId === id && item.modelId === modelId));
  writeStorage(storageKeys.favorites, next);
  return false;
}

export function toggleFavoriteModel(user, modelId) {
  return isFavoriteModel(user, modelId) ? unfavoriteModel(user, modelId) : favoriteModel(user, modelId);
}

export function getCompletedModelIds(user) {
  const id = userIdOf(user);
  return readStorage(storageKeys.completedModels, [])
    .filter(item => item.userId === id)
    .map(item => item.modelId);
}

export function isModelStudied(user, modelId) {
  return getCompletedModelIds(user).includes(modelId);
}

export function markModelAsStudied(user, modelId) {
  const completed = readStorage(storageKeys.completedModels, []);
  const completedAt = nowIso();
  const completedEntry = {
    userId: userIdOf(user),
    institutionId: institutionIdOf(user),
    modelId,
    completedAt
  };

  writeStorage(storageKeys.completedModels, uniqueByModel([completedEntry, ...completed]));

  const progress = readStorage(storageKeys.studyProgress, []);
  const progressEntry = {
    userId: userIdOf(user),
    institutionId: institutionIdOf(user),
    modelId,
    completed: true,
    progressPercent: 100,
    studyMinutes: 0,
    completedAt,
    lastAccessedAt: completedAt
  };
  writeStorage(storageKeys.studyProgress, uniqueByModel([progressEntry, ...progress]));
  return true;
}

export function unmarkModelAsStudied(user, modelId) {
  const id = userIdOf(user);
  const completed = readStorage(storageKeys.completedModels, [])
    .filter(item => !(item.userId === id && item.modelId === modelId));
  writeStorage(storageKeys.completedModels, completed);

  const progress = readStorage(storageKeys.studyProgress, []);
  const nextProgress = progress.map(item => {
    if (!(item.userId === id && item.modelId === modelId)) return item;

    return {
      ...item,
      completed: false,
      completedAt: null,
      progressPercent: 0
    };
  });

  writeStorage(storageKeys.studyProgress, uniqueByModel(nextProgress));
  return false;
}

export function trackModelAccess(user, modelId, metadata = {}) {
  migrateLegacyTelemetryStorage();
  const log = {
    id: `log-${crypto.randomUUID?.() || Date.now()}`,
    userId: userIdOf(user),
    institutionId: institutionIdOf(user),
    modelId,
    action: metadata.action || "open_model",
    startedAt: metadata.startedAt || nowIso(),
    endedAt: metadata.endedAt || null,
    durationSeconds: metadata.durationSeconds || null,
    createdAt: nowIso()
  };

  const logs = readStorage(storageKeys.accessLogs, []);
  writeStorage(storageKeys.accessLogs, [log, ...logs].slice(0, 1500));

  const progress = readStorage(storageKeys.studyProgress, []);
  const existing = progress.find(item => item.userId === log.userId && item.modelId === modelId);
  const progressEntry = {
    ...existing,
    userId: log.userId,
    institutionId: log.institutionId,
    modelId,
    completed: Boolean(existing?.completed),
    progressPercent: existing?.completed ? 100 : 0,
    studyMinutes: Number(existing?.studyMinutes || 0),
    lastAccessedAt: log.createdAt
  };
  writeStorage(storageKeys.studyProgress, uniqueByModel([progressEntry, ...progress]));
  return log;
}


export function getAccessLogs(user) {
  migrateLegacyTelemetryStorage();
  const logs = readStorage(storageKeys.accessLogs, []);
  if (!user?.id) return [];
  return logs.filter(item => item.userId === user.id);
}

export async function fetchAccessLogs(user) {
  if (!user?.id || !isSupabaseConfigured()) {
    return getAccessLogs(user);
  }
  
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("model_access_logs")
    .select("id, model_id, action, duration_seconds, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Fallback to local access logs", error);
    return getAccessLogs(user);
  }

  const remoteLogs = data.map(log => ({
    id: log.id,
    modelId: log.model_id,
    createdAt: log.created_at,
    action: log.action || "open_model",
    durationSeconds: Number(log.duration_seconds || 0)
  }));
  const localLogs = getAccessLogs(user);
  const seen = new Set();

  return [...remoteLogs, ...localLogs]
    .filter(log => {
      const key = log.id || `${log.modelId}:${log.action}:${log.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function getLastAccessLabel(user) {
  const logs = getAccessLogs(user);
  if (!logs.length) return "Sem acesso registrado";
  const last = new Date(logs[0].createdAt || logs[0].timestamp || Date.now());
  return last.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function calculateStudentProgress(user, models = [], accessLogs = getAccessLogs(user), learningSessions = []) {
  const completedIds = new Set(getCompletedModelIds(user));
  const favoriteIds = new Set(getFavoriteModelIds(user));
  const accessedModelIds = new Set([
    ...completedIds,
    ...accessLogs.map(log => log.modelId).filter(Boolean),
    ...(Array.isArray(learningSessions) ? learningSessions.map(s => s.modelId).filter(Boolean) : [])
  ]);
  const studiedModels = Math.max(completedIds.size, accessedModelIds.size);
  const totalModels = models.filter(model => model.isActive !== false).length;
  const progressPercent = totalModels ? Math.min(100, Math.round((studiedModels / totalModels) * 100)) : 0;
  const observedSessions = Array.isArray(learningSessions) ? learningSessions : [];
  const totalStudySeconds = observedSessions.length
    ? observedSessions
      .filter(session => (session.scope || session.sessionType || session.session_type || "viewer") === "viewer")
      .reduce((sum, session) => sum + normalizedActiveSeconds(session), 0)
    : accessLogs.reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0);
  const totalStudyMinutes = Math.round(totalStudySeconds / 60);

  return {
    studiedModels,
    totalStudyMinutes,
    lastAccess: getLastAccessLabel(user),
    progressPercent,
    favorites: favoriteIds.size,
    studyStreakDays: 0
  };
}

export function getProgressBySystem(user, models = []) {
  const completedIds = new Set(getCompletedModelIds(user));
  const systems = new Map();

  models.forEach(model => {
    const key = model.system || "Sistema anatômico";
    const current = systems.get(key) || { system: key, studied: 0, total: 0, percent: 0 };
    current.total += 1;
    if (completedIds.has(model.id)) current.studied += 1;
    systems.set(key, current);
  });

  return Array.from(systems.values()).map(item => ({
    ...item,
    percent: item.total ? Math.round((item.studied / item.total) * 100) : 0
  }));
}

export function getFavoriteModels(user, models = []) {
  const ids = new Set(getFavoriteModelIds(user));
  return models.filter(model => ids.has(model.id)).slice(0, 6);
}

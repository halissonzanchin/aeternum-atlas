import { readStorage, storageKeys, writeStorage } from "./storage/storageService";

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

function estimatedMinutesForModel(modelId, model = null) {
  const raw = model?.estimatedStudyTime || "";
  const matches = raw.match(/\d+/g)?.map(Number) || [];
  if (!matches.length) return 12;
  return Math.round(matches.reduce((sum, value) => sum + value, 0) / matches.length);
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

export function markModelAsStudied(user, modelId, model = null) {
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
    studyMinutes: estimatedMinutesForModel(modelId, model),
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
      progressPercent: item.lastAccessedAt ? Math.min(item.progressPercent || 35, 35) : 0
    };
  });

  writeStorage(storageKeys.studyProgress, uniqueByModel(nextProgress));
  return false;
}

export function trackModelAccess(user, modelId, metadata = {}) {
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
    progressPercent: existing?.completed ? 100 : Math.max(existing?.progressPercent || 0, 35),
    studyMinutes: Math.max(existing?.studyMinutes || 0, estimatedMinutesForModel(modelId, metadata.model)),
    lastAccessedAt: log.createdAt
  };
  writeStorage(storageKeys.studyProgress, uniqueByModel([progressEntry, ...progress]));
  return log;
}

export function getAccessLogs(user) {
  const logs = readStorage(storageKeys.accessLogs, []);
  if (!user?.id) return [];
  return logs.filter(item => item.userId === user.id);
}

export function getLastAccessLabel(user) {
  const logs = getAccessLogs(user);
  if (!logs.length) return "Sem acesso registrado";
  const last = new Date(logs[0].createdAt || logs[0].timestamp || Date.now());
  return last.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function calculateStudentProgress(user, models = []) {
  const completedIds = new Set(getCompletedModelIds(user));
  const favoriteIds = new Set(getFavoriteModelIds(user));
  const progressEntries = readStorage(storageKeys.studyProgress, []);
  const personalProgress = progressEntries.filter(item => item.userId === userIdOf(user));
  const studiedModels = completedIds.size;
  const totalModels = models.filter(model => model.isActive !== false).length || 1;
  const progressPercent = Math.min(100, Math.round((studiedModels / Math.max(totalModels, 12)) * 100));
  const totalStudyMinutes = personalProgress.reduce((sum, item) => sum + Number(item.studyMinutes || 0), 0);

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
    if (completedIds.has(model.id) || model.progressPercent >= 50) current.studied += 1;
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

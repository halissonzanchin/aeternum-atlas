export const storageKeys = {
  users: "aeternum.react.users",
  userProfiles: "aeternum.react.user_profiles",
  institutions: "aeternum.react.institutions",
  models: "aeternum.react.models",
  categories: "aeternum.react.categories",
  session: "aeternum.react.session",
  legacyTelemetry: "aeternum_access_logs",
  analyticsEvents: "aeternum_analytics_events_v2",
  accessLogs: "aeternum_model_access_logs_v2",
  learningSessions: "aeternum_learning_sessions_v2",
  learningEvents: "aeternum_learning_events_v2",
  learningQuizResults: "aeternum_learning_quiz_results_v2",
  telemetryMigration: "aeternum_telemetry_migration_v2",
  authProfile: "aeternum.react.auth_profile",
  favorites: "aeternum_favorites",
  modelNotes: "aeternum_model_notes",
  completedModels: "aeternum_completed_models",
  studyProgress: "aeternum_student_progress",
  studyAgenda: "aeternum_study_agenda",
  anatomicalQuizAttempts: "aeternum_anatomical_quiz_attempts",
  reportExports: "aeternum.react.report_exports",
  securityEvents: "aeternum.react.security_events"
};

function mergeUniqueById(current = [], incoming = []) {
  const seen = new Set();
  return [...current, ...incoming].filter((item, index) => {
    const key = item?.id || `${item?.userId || "anonymous"}:${item?.modelId || ""}:${item?.action || item?.eventType || ""}:${item?.createdAt || item?.startedAt || index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getLocalStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage || null;
}

export function readStorage(key, fallback) {
  const storage = getLocalStorage();
  if (!storage) return fallback;

  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  const storage = getLocalStorage();
  if (!storage) return value;

  storage.setItem(key, JSON.stringify(value));
  return value;
}

export function removeStorage(key) {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.removeItem(key);
}

export function migrateLegacyTelemetryStorage() {
  const migration = readStorage(storageKeys.telemetryMigration, {});
  if (migration?.splitKeysCompleted) return migration;

  const legacy = readStorage(storageKeys.legacyTelemetry, []);
  const items = Array.isArray(legacy) ? legacy : [];
  const analytics = items.filter(item => String(item?.id || "").startsWith("evt-") || Boolean(item?.eventType));
  const accessLogs = items.filter(item => {
    if (String(item?.id || "").startsWith("log-")) return true;
    return !item?.eventType && Boolean(item?.modelId) && Boolean(item?.action);
  });

  const currentAnalytics = readStorage(storageKeys.analyticsEvents, []);
  const currentAccessLogs = readStorage(storageKeys.accessLogs, []);
  writeStorage(storageKeys.analyticsEvents, mergeUniqueById(currentAnalytics, analytics).slice(0, 2000));
  writeStorage(storageKeys.accessLogs, mergeUniqueById(currentAccessLogs, accessLogs).slice(0, 2000));

  const completed = {
    splitKeysCompleted: true,
    completedAt: new Date().toISOString(),
    analyticsMigrated: analytics.length,
    accessLogsMigrated: accessLogs.length,
    legacyPreserved: true
  };
  writeStorage(storageKeys.telemetryMigration, completed);
  return completed;
}

export function clearStorageByPrefix(prefix) {
  const storage = getLocalStorage();
  if (!storage) return;

  Object.keys(storage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => storage.removeItem(key));
}

export function createLocalRepository({ key, seed = [], getId = item => item.id }) {
  function list() {
    const stored = readStorage(key, null);
    if (!stored) {
      writeStorage(key, seed);
      return seed;
    }
    return stored;
  }

  function saveAll(items) {
    return writeStorage(key, items);
  }

  function findById(id) {
    return list().find(item => getId(item) === id) || null;
  }

  function upsert(record) {
    const items = list();
    const id = getId(record);
    const exists = items.some(item => getId(item) === id);
    const nextItems = exists
      ? items.map(item => (getId(item) === id ? { ...item, ...record } : item))
      : [...items, record];

    saveAll(nextItems);
    return findById(id);
  }

  function remove(id) {
    const nextItems = list().filter(item => getId(item) !== id);
    saveAll(nextItems);
    return nextItems;
  }

  return {
    list,
    saveAll,
    findById,
    upsert,
    remove
  };
}

export const storageKeys = {
  users: "aeternum.react.users",
  userProfiles: "aeternum.react.user_profiles",
  institutions: "aeternum.react.institutions",
  models: "aeternum.react.models",
  categories: "aeternum.react.categories",
  session: "aeternum.react.session",
  analyticsEvents: "aeternum_access_logs",
  accessLogs: "aeternum_access_logs",
  favorites: "aeternum_favorites",
  completedModels: "aeternum_completed_models",
  studyProgress: "aeternum_student_progress",
  studyAgenda: "aeternum_study_agenda",
  reportExports: "aeternum.react.report_exports"
};

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

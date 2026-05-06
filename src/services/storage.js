export const storageKeys = {
  users: "aeternum.react.users",
  models: "aeternum.react.models",
  categories: "aeternum.react.categories",
  session: "aeternum.react.session",
  analyticsEvents: "aeternum_access_logs",
  accessLogs: "aeternum_access_logs",
  favorites: "aeternum_favorites",
  completedModels: "aeternum_completed_models",
  studyProgress: "aeternum_student_progress"
};

export function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

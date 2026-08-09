import {
  migrateLegacyTelemetryStorage,
  readStorage,
  storageKeys,
  writeStorage
} from "./storage/storageService";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/supabaseClient";

export const LEARNING_TELEMETRY_UPDATED_EVENT = "aeternum:learning-telemetry-updated";
export const DEFAULT_IDLE_TIMEOUT_MS = 90_000;
export const DEFAULT_HEARTBEAT_MS = 15_000;

const remoteWarnings = new Set();
const activeTrackedSessions = new Map();

function nowIso() {
  return new Date().toISOString();
}

function createUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues?.(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function userIdOf(user) {
  return user?.id || null;
}

function institutionIdOf(user) {
  return user?.institutionId || user?.institution_id || null;
}

function notifyUpdate(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LEARNING_TELEMETRY_UPDATED_EVENT, { detail }));
}

function uniqueById(items = []) {
  const seen = new Set();
  return items.filter((item, index) => {
    const key = item?.id || `${item?.userId || "anonymous"}:${item?.modelId || ""}:${item?.startedAt || item?.createdAt || index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function saveSessions(sessions, detail = {}) {
  writeStorage(storageKeys.learningSessions, uniqueById(sessions).slice(0, 4000));
  notifyUpdate({ collection: "sessions", ...detail });
}

function saveEvents(events, detail = {}) {
  writeStorage(storageKeys.learningEvents, uniqueById(events).slice(0, 8000));
  notifyUpdate({ collection: "events", ...detail });
}

function saveQuizResults(results, detail = {}) {
  writeStorage(storageKeys.learningQuizResults, uniqueById(results).slice(0, 2000));
  notifyUpdate({ collection: "quizResults", ...detail });
}

function warnRemoteOnce(operation, error) {
  if (!error || remoteWarnings.has(operation)) return;
  remoteWarnings.add(operation);
  console.warn(`[learning_telemetry] ${operation} indisponível; dados preservados localmente.`, error);
}

function migrateLegacyLearningTelemetry() {
  migrateLegacyTelemetryStorage();
  const migration = readStorage(storageKeys.telemetryMigration, {});
  if (migration?.learningCollectionsCompleted) return migration;

  const accessLogs = readStorage(storageKeys.accessLogs, []);
  const legacySessions = (Array.isArray(accessLogs) ? accessLogs : [])
    .filter(log => log?.modelId && Number(log?.durationSeconds) > 0)
    .map(log => ({
      id: createUuid(),
      legacyId: log.id,
      clientSessionId: null,
      userId: log.userId,
      institutionId: log.institutionId || null,
      scope: "viewer",
      modelId: log.modelId,
      startedAt: log.startedAt || log.createdAt || nowIso(),
      endedAt: log.endedAt || log.createdAt || null,
      lastHeartbeatAt: log.endedAt || log.createdAt || null,
      activeSeconds: Number(log.durationSeconds) || 0,
      idleSeconds: 0,
      status: "completed",
      endedReason: "legacy_migration",
      syncStatus: "local_legacy"
    }));

  const analytics = readStorage(storageKeys.analyticsEvents, []);
  const supportedEventTypes = new Set([
    "annotation_list_loaded",
    "annotation_selected",
    "annotation_focused",
    "start_anatomical_quiz",
    "finish_anatomical_quiz",
    "start_theoretical_quiz",
    "finish_theoretical_quiz"
  ]);
  const legacyEvents = (Array.isArray(analytics) ? analytics : [])
    .filter(event => supportedEventTypes.has(event?.eventType || event?.type || event?.action))
    .map(event => ({
      id: createUuid(),
      legacyId: event.id,
      userId: event.userId,
      institutionId: event.institutionId || null,
      sessionId: null,
      modelId: event.modelId || null,
      eventType: event.eventType || event.type || event.action,
      eventData: event.metadata || {},
      createdAt: event.createdAt || event.timestamp || nowIso(),
      syncStatus: "local_legacy"
    }));

  const anatomicalAttempts = readStorage(storageKeys.anatomicalQuizAttempts, []);
  const legacyQuizResults = (Array.isArray(anatomicalAttempts) ? anatomicalAttempts : []).map(attempt => ({
    id: attempt.id || createUuid(),
    userId: attempt.userId,
    institutionId: attempt.institutionId || null,
    modelId: attempt.modelId || null,
    quizId: attempt.quizId || null,
    quizType: "anatomical",
    status: attempt.status || "completed",
    score: Number(attempt.score) || 0,
    totalQuestions: Number(attempt.totalQuestions) || 0,
    percentage: Number(attempt.percentage) || 0,
    durationSeconds: Number(attempt.durationSeconds) || 0,
    startedAt: attempt.startedAt || null,
    finishedAt: attempt.finishedAt || attempt.createdAt || nowIso(),
    syncStatus: "local_legacy"
  }));

  saveSessions([...readStorage(storageKeys.learningSessions, []), ...legacySessions], { reason: "legacy_migration" });
  saveEvents([...readStorage(storageKeys.learningEvents, []), ...legacyEvents], { reason: "legacy_migration" });
  saveQuizResults([...readStorage(storageKeys.learningQuizResults, []), ...legacyQuizResults], { reason: "legacy_migration" });

  const completed = {
    ...migration,
    learningCollectionsCompleted: true,
    learningCollectionsCompletedAt: nowIso(),
    legacySessionsMigrated: legacySessions.length,
    legacyEventsMigrated: legacyEvents.length,
    legacyQuizResultsMigrated: legacyQuizResults.length
  };
  writeStorage(storageKeys.telemetryMigration, completed);
  return completed;
}

export function getLocalLearningTelemetry(user) {
  migrateLegacyLearningTelemetry();
  const userId = userIdOf(user);
  const belongsToUser = item => userId && item?.userId === userId;
  return {
    sessions: readStorage(storageKeys.learningSessions, []).filter(belongsToUser),
    events: readStorage(storageKeys.learningEvents, []).filter(belongsToUser),
    quizResults: readStorage(storageKeys.learningQuizResults, []).filter(belongsToUser),
    source: "local",
    synchronized: false,
    syncError: null
  };
}

function normalizeRemoteSession(session) {
  return {
    id: session.id,
    clientSessionId: session.client_session_id || session.id,
    userId: session.user_id,
    institutionId: session.institution_id,
    scope: session.scope || session.session_type || "viewer",
    modelId: session.model_id,
    startedAt: session.session_start,
    endedAt: session.session_end,
    lastHeartbeatAt: session.last_heartbeat_at,
    activeSeconds: Number(session.active_seconds ?? session.duration_seconds) || 0,
    idleSeconds: Number(session.idle_seconds) || 0,
    status: session.status || (session.session_end ? "completed" : "active"),
    endedReason: session.ended_reason || null,
    syncStatus: "supabase"
  };
}

function normalizeRemoteEvent(event) {
  return {
    id: event.id,
    userId: event.user_id,
    institutionId: event.institution_id,
    sessionId: event.session_id,
    modelId: event.model_id,
    eventType: event.event_type,
    eventData: event.event_data || {},
    createdAt: event.created_at,
    syncStatus: "supabase"
  };
}

function normalizeRemoteQuizResult(result) {
  return {
    id: result.id,
    userId: result.user_id,
    institutionId: result.institution_id,
    modelId: result.model_id,
    quizId: result.quiz_id,
    quizType: result.quiz_type || "anatomical",
    status: result.status || "completed",
    score: Number(result.score ?? result.correct_answers) || 0,
    totalQuestions: Number(result.total_questions) || 0,
    percentage: Number(result.percentage ?? result.accuracy) || 0,
    durationSeconds: Number(result.duration_seconds ?? result.time_spent) || 0,
    startedAt: result.started_at || null,
    finishedAt: result.finished_at || result.created_at,
    syncStatus: "supabase"
  };
}

export async function fetchLearningTelemetry(user) {
  const local = getLocalLearningTelemetry(user);
  const userId = userIdOf(user);
  if (!userId || !isSupabaseConfigured()) return local;

  const client = getSupabaseClient();
  try {
    const { error: reconcileError } = await client.rpc("reconcile_my_learning_sessions", {
      stale_after: "00:03:00"
    });
    if (reconcileError && reconcileError.code !== "PGRST202") {
      warnRemoteOnce("reconciliação de sessões", reconcileError);
    }

    const [sessionsResult, eventsResult, quizResult] = await Promise.all([
      client
        .from("viewer_learning_sessions")
        .select("id, client_session_id, user_id, institution_id, scope, model_id, session_start, session_end, last_heartbeat_at, active_seconds, idle_seconds, duration_seconds, status, ended_reason")
        .eq("user_id", userId)
        .order("session_start", { ascending: false }),
      client
        .from("viewer_learning_events")
        .select("id, user_id, institution_id, session_id, model_id, event_type, event_data, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      client
        .from("viewer_quiz_results")
        .select("id, user_id, institution_id, model_id, quiz_id, quiz_type, status, score, total_questions, percentage, duration_seconds, started_at, finished_at, correct_answers, accuracy, time_spent, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    ]);

    const firstError = sessionsResult.error || eventsResult.error || quizResult.error;
    if (firstError) throw firstError;

    return {
      sessions: uniqueById([...(sessionsResult.data || []).map(normalizeRemoteSession), ...local.sessions]),
      events: uniqueById([...(eventsResult.data || []).map(normalizeRemoteEvent), ...local.events]),
      quizResults: uniqueById([...(quizResult.data || []).map(normalizeRemoteQuizResult), ...local.quizResults]),
      source: "supabase",
      synchronized: true,
      syncError: null
    };
  } catch (error) {
    warnRemoteOnce("leitura remota", error);
    return { ...local, syncError: error?.message || "Telemetria remota indisponível." };
  }
}

function sessionPayload(session) {
  return {
    id: session.id,
    client_session_id: session.clientSessionId || session.id,
    user_id: session.userId,
    institution_id: session.institutionId,
    scope: session.scope,
    model_id: session.modelId,
    session_start: session.startedAt,
    session_end: session.endedAt,
    last_heartbeat_at: session.lastHeartbeatAt,
    active_seconds: Math.max(0, Math.round(session.activeSeconds || 0)),
    idle_seconds: Math.max(0, Math.round(session.idleSeconds || 0)),
    duration_seconds: Math.max(0, Math.round(session.activeSeconds || 0)),
    status: session.status,
    ended_reason: session.endedReason || null
  };
}

async function persistSessionRemote(session) {
  if (!session?.userId || !isSupabaseConfigured()) return false;
  try {
    const { error } = await getSupabaseClient()
      .from("viewer_learning_sessions")
      .upsert(sessionPayload(session), { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (error) {
    warnRemoteOnce("sincronização de sessão", error);
    return false;
  }
}

function createSession({ user, scope = "account", modelId = null }) {
  migrateLegacyLearningTelemetry();
  const startedAt = nowIso();
  const session = {
    id: createUuid(),
    clientSessionId: null,
    userId: userIdOf(user),
    institutionId: institutionIdOf(user),
    scope,
    modelId,
    startedAt,
    endedAt: null,
    lastHeartbeatAt: startedAt,
    activeSeconds: 0,
    idleSeconds: 0,
    status: "active",
    endedReason: null,
    syncStatus: "local"
  };
  session.clientSessionId = session.id;
  saveSessions([session, ...readStorage(storageKeys.learningSessions, [])], { reason: "session_started", sessionId: session.id });
  void persistSessionRemote(session);
  return session;
}

function updateSession(sessionId, patch) {
  const sessions = readStorage(storageKeys.learningSessions, []);
  let updated = null;
  const next = sessions.map(session => {
    if (session.id !== sessionId) return session;
    updated = { ...session, ...patch };
    return updated;
  });
  if (updated) saveSessions(next, { reason: "session_updated", sessionId });
  return updated;
}

function activeViewerSession(userId, modelId) {
  const sessions = readStorage(storageKeys.learningSessions, []);
  return sessions.find(session => (
    session.userId === userId
    && session.status === "active"
    && session.scope === "viewer"
    && (!modelId || session.modelId === modelId)
  ));
}

async function persistEventRemote(event) {
  if (!event?.userId || !isSupabaseConfigured()) return false;
  try {
    if (event.sessionId) {
      const parentSession = readStorage(storageKeys.learningSessions, [])
        .find(session => session.id === event.sessionId);
      if (parentSession) {
        const sessionPersisted = await persistSessionRemote(parentSession);
        if (!sessionPersisted) return false;
      }
    }

    const { error } = await getSupabaseClient().from("viewer_learning_events").insert({
      id: event.id,
      user_id: event.userId,
      institution_id: event.institutionId,
      session_id: event.sessionId,
      model_id: event.modelId,
      event_type: event.eventType,
      event_data: event.eventData || {},
      created_at: event.createdAt
    });
    if (error && error.code !== "23505") throw error;
    return true;
  } catch (error) {
    warnRemoteOnce("sincronização de eventos", error);
    return false;
  }
}

export function recordLearningEvent({ user, sessionId = null, modelId = null, eventType, eventData = {}, createdAt = nowIso() }) {
  if (!eventType || !userIdOf(user)) return null;
  migrateLegacyLearningTelemetry();
  const session = sessionId
    ? readStorage(storageKeys.learningSessions, []).find(item => item.id === sessionId)
    : activeViewerSession(userIdOf(user), modelId);
  const event = {
    id: createUuid(),
    userId: userIdOf(user),
    institutionId: institutionIdOf(user),
    sessionId: session?.id || null,
    modelId: modelId || session?.modelId || null,
    eventType,
    eventData,
    createdAt,
    syncStatus: "local"
  };
  saveEvents([event, ...readStorage(storageKeys.learningEvents, [])], { reason: eventType, eventId: event.id });
  const remoteSyncPromise = persistEventRemote(event);
  Object.defineProperty(event, "remoteSyncPromise", {
    value: remoteSyncPromise,
    enumerable: false
  });
  return event;
}

async function persistQuizResultRemote(result) {
  if (!result?.userId || !isSupabaseConfigured()) return false;
  try {
    const { error } = await getSupabaseClient().from("viewer_quiz_results").upsert({
      id: result.id,
      user_id: result.userId,
      institution_id: result.institutionId,
      model_id: result.modelId,
      quiz_id: result.quizId,
      quiz_type: result.quizType,
      status: result.status,
      score: result.score,
      total_questions: result.totalQuestions,
      percentage: result.percentage,
      duration_seconds: result.durationSeconds,
      correct_answers: result.score,
      incorrect_answers: Math.max(0, result.totalQuestions - result.score),
      accuracy: result.percentage,
      time_spent: result.durationSeconds,
      started_at: result.startedAt,
      finished_at: result.finishedAt
    }, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (error) {
    warnRemoteOnce("sincronização de simulados", error);
    return false;
  }
}

export function recordLearningQuizResult({ user, model, quiz, result, quizType = "anatomical" }) {
  if (!userIdOf(user) || !result) return null;
  migrateLegacyLearningTelemetry();
  const modelId = model?.id || quiz?.modelId || result.modelId || null;
  const quizId = quiz?.id || result.quizId || `${quizType}-${modelId || "unscoped"}`;
  const quizResult = {
    id: result.id || createUuid(),
    userId: userIdOf(user),
    institutionId: institutionIdOf(user),
    modelId,
    quizId,
    quizType,
    status: result.status || "completed",
    score: Number(result.score ?? result.correctAnswers) || 0,
    totalQuestions: Number(result.totalQuestions ?? result.objectiveTotal) || 0,
    percentage: Number(result.percentage) || 0,
    durationSeconds: Number(result.durationSeconds ?? result.timeSpent ?? result.time_spent) || 0,
    startedAt: result.startedAt || null,
    finishedAt: result.finishedAt || nowIso(),
    syncStatus: "local"
  };
  saveQuizResults([quizResult, ...readStorage(storageKeys.learningQuizResults, [])], { reason: "quiz_completed", quizResultId: quizResult.id });
  recordLearningEvent({
    user,
    modelId: quizResult.modelId,
    eventType: "quiz_completed",
    eventData: {
      quizId: quizResult.quizId,
      quizType,
      status: quizResult.status,
      score: quizResult.score,
      totalQuestions: quizResult.totalQuestions,
      percentage: quizResult.percentage,
      durationSeconds: quizResult.durationSeconds
    },
    createdAt: quizResult.finishedAt
  });
  void persistQuizResultRemote(quizResult);
  return quizResult;
}

export function startTrackedLearningSession({
  user,
  scope = "account",
  modelId = null,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  heartbeatMs = DEFAULT_HEARTBEAT_MS
}) {
  if (!userIdOf(user) || typeof window === "undefined" || typeof document === "undefined") {
    return {
      id: null,
      stop: () => null,
      flush: () => null,
      getSession: () => null,
      waitForRemote: () => Promise.resolve(false)
    };
  }

  let session = createSession({ user, scope, modelId });
  let stopped = false;
  let visible = !document.hidden;
  let lastTickAt = Date.now();
  let lastActivityAt = lastTickAt;
  let lastRemoteSyncAt = 0;
  let remoteStopPromise = Promise.resolve(false);

  recordLearningEvent({
    user,
    sessionId: session.id,
    modelId,
    eventType: "learning_session_started",
    eventData: { scope }
  });

  function accumulate(now = Date.now()) {
    if (stopped) return session;
    const elapsedMs = Math.max(0, now - lastTickAt);
    let activeMs = 0;
    if (visible) {
      const activeUntil = lastActivityAt + idleTimeoutMs;
      activeMs = Math.max(0, Math.min(now, activeUntil) - lastTickAt);
      activeMs = Math.min(activeMs, elapsedMs);
    }
    const idleMs = Math.max(0, elapsedMs - activeMs);
    session = {
      ...session,
      activeSeconds: Number(session.activeSeconds || 0) + activeMs / 1000,
      idleSeconds: Number(session.idleSeconds || 0) + idleMs / 1000,
      lastHeartbeatAt: new Date(now).toISOString()
    };
    lastTickAt = now;
    return session;
  }

  function persistLocal() {
    session = updateSession(session.id, {
      activeSeconds: Math.max(0, Math.round(session.activeSeconds || 0)),
      idleSeconds: Math.max(0, Math.round(session.idleSeconds || 0)),
      lastHeartbeatAt: session.lastHeartbeatAt
    }) || session;
    return session;
  }

  function flush({ remote = false } = {}) {
    if (stopped) return session;
    accumulate();
    persistLocal();
    const now = Date.now();
    if (remote || now - lastRemoteSyncAt >= 60_000) {
      lastRemoteSyncAt = now;
      void persistSessionRemote(session);
    }
    return session;
  }

  function handleActivity() {
    accumulate();
    lastActivityAt = Date.now();
  }

  function handleVisibilityChange() {
    accumulate();
    visible = !document.hidden;
    if (visible) lastActivityAt = Date.now();
    flush({ remote: true });
  }

  function stop(reason = "unmount") {
    if (stopped) return session;
    accumulate();
    stopped = true;
    session = updateSession(session.id, {
      activeSeconds: Math.max(0, Math.round(session.activeSeconds || 0)),
      idleSeconds: Math.max(0, Math.round(session.idleSeconds || 0)),
      lastHeartbeatAt: nowIso(),
      endedAt: nowIso(),
      status: "completed",
      endedReason: reason
    }) || { ...session, status: "completed", endedReason: reason, endedAt: nowIso() };
    const endedEvent = recordLearningEvent({
      user,
      sessionId: session.id,
      modelId,
      eventType: "learning_session_ended",
      eventData: {
        scope,
        reason,
        activeSeconds: session.activeSeconds,
        idleSeconds: session.idleSeconds
      }
    });
    remoteStopPromise = endedEvent?.remoteSyncPromise || persistSessionRemote(session);
    activeTrackedSessions.delete(session.id);
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pointerdown", handleActivity);
    window.removeEventListener("keydown", handleActivity);
    window.removeEventListener("touchstart", handleActivity);
    window.removeEventListener("wheel", handleActivity);
    window.removeEventListener("pagehide", handlePageHide);
    return session;
  }

  function handlePageHide() {
    stop("pagehide");
  }

  const interval = window.setInterval(() => flush(), heartbeatMs);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pointerdown", handleActivity, { passive: true });
  window.addEventListener("keydown", handleActivity);
  window.addEventListener("touchstart", handleActivity, { passive: true });
  window.addEventListener("wheel", handleActivity, { passive: true });
  window.addEventListener("pagehide", handlePageHide);

  const tracker = {
    id: session.id,
    stop,
    flush,
    getSession: () => session,
    waitForRemote: () => remoteStopPromise
  };
  activeTrackedSessions.set(session.id, tracker);
  return tracker;
}

export async function finalizeTrackedLearningSessionsForUser(userId, reason = "logout") {
  if (!userId) return 0;
  const trackers = Array.from(activeTrackedSessions.values())
    .filter(tracker => tracker.getSession()?.userId === userId);
  trackers.forEach(tracker => tracker.stop(reason));
  await Promise.allSettled(trackers.map(tracker => tracker.waitForRemote()));
  return trackers.length;
}


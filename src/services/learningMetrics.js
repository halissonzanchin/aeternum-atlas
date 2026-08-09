const DAY_MS = 24 * 60 * 60 * 1000;

function safeDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value || 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export function localDateKey(value) {
  const date = safeDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKey(value) {
  const date = safeDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function uniqueById(items = []) {
  const seen = new Set();
  return items.filter((item, index) => {
    const key = item?.id || item?.clientSessionId || `${item?.scope || "item"}:${item?.modelId || ""}:${item?.startedAt || item?.createdAt || index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractSessionTimestamp(session) {
  const raw = session?.startedAt || session?.started_at || session?.sessionStart || session?.session_start || session?.createdAt || session?.created_at || session?.lastHeartbeatAt || session?.last_heartbeat_at || session?.timestamp;
  return safeDate(raw) || new Date();
}

export function normalizedActiveSeconds(session) {
  const active = Number(session?.activeSeconds ?? session?.active_seconds);
  if (Number.isFinite(active) && active > 0) return active;
  const duration = Number(session?.durationSeconds ?? session?.duration_seconds);
  if (Number.isFinite(duration) && duration > 0) return duration;

  const start = extractSessionTimestamp(session);
  const end = safeDate(session?.endedAt || session?.ended_at || session?.lastHeartbeatAt || session?.last_heartbeat_at || session?.session_end);
  if (start && end && end.getTime() >= start.getTime()) {
    const diffSec = Math.round((end.getTime() - start.getTime()) / 1000);
    if (diffSec > 0) return diffSec;
  }
  return 0;
}

export function calculateLearningTotals(sessions = []) {
  return uniqueById(sessions).reduce((totals, session) => {
    const seconds = normalizedActiveSeconds(session);
    if ((session?.scope || session?.sessionType || session?.session_type) === "account") {
      totals.connectedSeconds += seconds;
      totals.accountSessions += 1;
    } else {
      totals.studySeconds += seconds;
      totals.viewerSessions += 1;
    }
    return totals;
  }, {
    connectedSeconds: 0,
    studySeconds: 0,
    accountSessions: 0,
    viewerSessions: 0
  });
}

function localeFor(language) {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";
  if (language === "de") return "de-DE";
  return "pt-BR";
}

function shortDayLabel(date, language) {
  return new Intl.DateTimeFormat(localeFor(language), { weekday: "short" })
    .format(date)
    .replace(".", "");
}

function shortMonthLabel(date, language) {
  return new Intl.DateTimeFormat(localeFor(language), { month: "short" })
    .format(date)
    .replace(".", "");
}

function viewerSessions(sessions = []) {
  return uniqueById(sessions).filter(session => {
    const scope = session?.scope || session?.sessionType || session?.session_type || "viewer";
    const active = normalizedActiveSeconds(session);
    return scope === "viewer" && active > 0;
  });
}

export function buildStudySeries(sessions = [], period = "week", options = {}) {
  const now = safeDate(options.now) || new Date();
  const language = options.language || "pt";
  const logs = Array.isArray(options.logs) ? options.logs : [];
  const observedSessions = viewerSessions(sessions);

  // Fallback logs mapping if observedSessions has no data for period
  const logEntries = logs.map(log => ({
    startedAt: log.createdAt || log.startedAt,
    activeSeconds: Number(log.durationSeconds) || 60
  }));
  const activeEntries = observedSessions.length ? observedSessions : logEntries;

  if (period === "year") {
    const buckets = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: monthKey(date),
        label: shortMonthLabel(date, language),
        seconds: 0
      };
    });
    const byKey = new Map(buckets.map(bucket => [bucket.key, bucket]));
    activeEntries.forEach(session => {
      const bucket = byKey.get(monthKey(extractSessionTimestamp(session)));
      if (bucket) bucket.seconds += normalizedActiveSeconds(session) || Number(session.activeSeconds) || 0;
    });
    return buckets.map(bucket => ({
      ...bucket,
      minutes: bucket.seconds > 0 ? Math.max(1, Math.round(bucket.seconds / 60)) : 0
    }));
  }

  if (period === "month") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29);
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const bucketStart = new Date(start.getTime() + index * 5 * DAY_MS);
      const bucketEnd = new Date(bucketStart.getTime() + 4 * DAY_MS);
      return {
        key: `${localDateKey(bucketStart)}:${localDateKey(bucketEnd)}`,
        label: `${pad(bucketStart.getDate())}/${pad(bucketStart.getMonth() + 1)}`,
        start: bucketStart,
        end: new Date(bucketEnd.setHours(23, 59, 59, 999)),
        seconds: 0
      };
    });
    activeEntries.forEach(session => {
      const date = extractSessionTimestamp(session);
      if (!date) return;
      const bucket = buckets.find(item => date >= item.start && date <= item.end);
      if (bucket) bucket.seconds += normalizedActiveSeconds(session) || Number(session.activeSeconds) || 0;
    });
    return buckets.map(bucket => ({
      key: bucket.key,
      label: bucket.label,
      seconds: bucket.seconds,
      minutes: bucket.seconds > 0 ? Math.max(1, Math.round(bucket.seconds / 60)) : 0
    }));
  }

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      key: localDateKey(date),
      label: shortDayLabel(date, language),
      seconds: 0
    };
  });
  const byKey = new Map(days.map(day => [day.key, day]));
  activeEntries.forEach(session => {
    const bucket = byKey.get(localDateKey(extractSessionTimestamp(session)));
    if (bucket) bucket.seconds += normalizedActiveSeconds(session) || Number(session.activeSeconds) || 0;
  });
  return days.map(day => ({
    ...day,
    minutes: day.seconds > 0 ? Math.max(1, Math.round(day.seconds / 60)) : 0
  }));
}

function modelAliases(model) {
  return [model?.id, model?.slug, model?.supabaseModelId, model?.model_id].filter(Boolean);
}

function modelSystem(model) {
  return model?.system || model?.category || model?.region || "Sistema anatômico";
}

function eventDataOf(event) {
  return event?.eventData || event?.event_data || event?.metadata || {};
}

function eventTypeOf(event) {
  return event?.eventType || event?.event_type || event?.type || event?.action || "";
}

export function buildSystemLearningMetrics({
  models = [],
  sessions = [],
  events = [],
  quizResults = [],
  completedModelIds = []
} = {}) {
  const modelByAlias = new Map();
  models.forEach(model => modelAliases(model).forEach(alias => modelByAlias.set(String(alias), model)));
  const completed = new Set(completedModelIds.map(String));
  const systems = new Map();
  const modelCoverage = new Map();

  function ensureSystem(system) {
    if (!systems.has(system)) {
      systems.set(system, {
        system,
        total: 0,
        studied: 0,
        activeSeconds: 0,
        annotationViewed: 0,
        annotationTotal: 0,
        quizAttempts: 0,
        quizCorrect: 0,
        quizQuestions: 0
      });
    }
    return systems.get(system);
  }

  models.forEach(model => {
    if (model?.isActive === false) return;
    const metric = ensureSystem(modelSystem(model));
    metric.total += 1;
    if (modelAliases(model).some(alias => completed.has(String(alias)))) metric.studied += 1;
  });

  viewerSessions(sessions).forEach(session => {
    const model = modelByAlias.get(String(session?.modelId || session?.model_id || ""));
    const metric = ensureSystem(modelSystem(model));
    metric.activeSeconds += normalizedActiveSeconds(session);
  });

  uniqueById(events).forEach(event => {
    const modelId = String(event?.modelId || event?.model_id || "");
    if (!modelId) return;
    const model = modelByAlias.get(modelId);
    const system = modelSystem(model);
    const data = eventDataOf(event);
    const type = eventTypeOf(event);
    const coverage = modelCoverage.get(modelId) || { system, total: 0, viewed: new Set() };
    if (type === "annotation_list_loaded") {
      coverage.total = Math.max(coverage.total, Number(data.annotationCount ?? event?.annotationCount) || 0);
    }
    if (["annotation_selected", "annotation_focused"].includes(type)) {
      const index = data.annotationIndex ?? event?.annotationIndex;
      if (index !== null && index !== undefined && index !== "") coverage.viewed.add(String(index));
    }
    modelCoverage.set(modelId, coverage);
  });

  modelCoverage.forEach(coverage => {
    const metric = ensureSystem(coverage.system);
    metric.annotationTotal += coverage.total;
    metric.annotationViewed += Math.min(coverage.total || coverage.viewed.size, coverage.viewed.size);
  });

  uniqueById(quizResults).forEach(result => {
    const modelId = String(result?.modelId || result?.model_id || "");
    const model = modelByAlias.get(modelId);
    const metric = ensureSystem(modelSystem(model));
    const totalQuestions = Number(result?.totalQuestions ?? result?.total_questions) || 0;
    const score = Number(result?.score ?? result?.correctAnswers ?? result?.correct_answers) || 0;
    if (totalQuestions <= 0) return;
    metric.quizAttempts += 1;
    metric.quizCorrect += Math.min(totalQuestions, score);
    metric.quizQuestions += totalQuestions;
  });

  return Array.from(systems.values()).map(metric => {
    const completionPercent = metric.total ? clampPercent((metric.studied / metric.total) * 100) : 0;
    const annotationCoveragePercent = metric.annotationTotal
      ? clampPercent((metric.annotationViewed / metric.annotationTotal) * 100)
      : null;
    const quizAccuracyPercent = metric.quizQuestions
      ? clampPercent((metric.quizCorrect / metric.quizQuestions) * 100)
      : null;
    const metricType = quizAccuracyPercent !== null
      ? "quiz"
      : annotationCoveragePercent !== null
        ? "annotations"
        : "completion";
    const percent = quizAccuracyPercent ?? annotationCoveragePercent ?? completionPercent;
    return {
      ...metric,
      studyMinutes: Math.round(metric.activeSeconds / 60),
      completionPercent,
      annotationCoveragePercent,
      quizAccuracyPercent,
      metricType,
      percent
    };
  }).sort((a, b) => b.activeSeconds - a.activeSeconds || a.system.localeCompare(b.system));
}

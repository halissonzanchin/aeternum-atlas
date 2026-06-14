import { supabase } from "../../lib/supabase";
import { normalizeRole, ROLES } from "../permissions/permissionService";
import { isSupabaseConfigured } from "../supabase/supabaseClient";

const ACTIVE_STATUSES = new Set(["active", "ativo"]);
const STUDENT_ROLES = new Set(["student", "aluno"]);
const EMPTY_TEXT = "Nenhum dado encontrado";

function numberOrZero(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function isActiveStatus(status) {
  return ACTIVE_STATUSES.has(String(status || "").toLowerCase());
}

function isStudentRole(role) {
  return STUDENT_ROLES.has(String(role || "").toLowerCase());
}

function isSuperAdminProfile(profile) {
  return normalizeRole(profile?.role) === ROLES.SUPER_ADMIN;
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(date, reference = new Date()) {
  return (
    date?.getFullYear() === reference.getFullYear() &&
    date?.getMonth() === reference.getMonth() &&
    date?.getDate() === reference.getDate()
  );
}

function isSameLocalMonth(date, reference = new Date()) {
  return (
    date?.getFullYear() === reference.getFullYear() &&
    date?.getMonth() === reference.getMonth()
  );
}

function isWithinLastMinutes(date, minutes) {
  if (!date) return false;
  return Date.now() - date.getTime() <= minutes * 60 * 1000;
}

function dayKey(date) {
  return String(date.getDate()).padStart(2, "0");
}

function datePart(value) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

function timePart(value) {
  const date = toDate(value);
  return date ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
}

function logRealData(message, payload = {}) {
  console.info(`[super-admin real-data] ${message}`, payload);
}

function normalizeStudentStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (["active", "ativo"].includes(normalized)) return "ativo";
  if (["inactive", "inativo"].includes(normalized)) return "inativo";
  if (["pending", "pendente"].includes(normalized)) return "pendente";
  if (["suspended", "bloqueado", "blocked"].includes(normalized)) return "bloqueado";
  return "pendente";
}

function eventTypeLabel(action) {
  const labels = {
    view_model: "abertura de modelo",
    favorite_model: "favoritou modelo",
    mark_as_studied: "marcou como estudado",
    open_sketchfab: "abriu no Sketchfab",
    copy_model_link: "copiou link",
    view_study_guide: "abriu guia de estudo",
    report_problem: "reportou problema",
    session_start: "início de sessão",
    session_end: "fim de sessão"
  };
  return labels[action] || action || "evento";
}

async function safeSupabaseQuery(label, query, fallbackValue = null) {
  try {
    const { data, error, count } = await query;
    if (error) {
      console.warn(`[admin-dashboard] ${label} não retornou dados reais.`, error.message);
      return { data: fallbackValue, count: null, error };
    }

    return { data, count, error: null };
  } catch (error) {
    console.warn(`[admin-dashboard] Falha ao consultar ${label}.`, error);
    return { data: fallbackValue, count: null, error };
  }
}

function createEmptyPlatformHealth(status = "online") {
  return {
    status,
    uptimePercent: 0,
    incidentsThisMonth: 0,
    totalDowntimeMinutes: 0,
    affectedUsers: 0,
    averageResponseTimeMs: 0,
    sketchfabLoadErrors: 0,
    loginErrors: 0,
    reportExportErrors: 0,
    routeErrors: 0,
    lastIncident: null
  };
}

function createEmptyInstitution(label = EMPTY_TEXT, dataSource = "empty") {
  return {
    id: "",
    slug: "",
    name: label,
    displayName: label,
    city: "",
    country: "",
    currency: "BRL",
    active: false,
    contractedCapacity: 0,
    contracted_capacity: 0,
    registeredStudents: 0,
    activeStudents: 0,
    active_students: 0,
    inactiveStudents: 0,
    pricePerStudent: 0,
    price_per_student: 0,
    contractStatus: "empty",
    licenseStatus: "empty",
    createdAt: "",
    updatedAt: "",
    dataSource
  };
}

function createEmptyAnalytics(platformHealth = createEmptyPlatformHealth()) {
  const now = new Date();
  return {
    snapshot: {
      activeUsersNow: 0,
      accessesToday: 0,
      accessesThisMonth: 0,
      totalStudyHoursThisMonth: 0,
      averageSessionMinutes: 0,
      returningUserRate: 0,
      modelCompletionRate: 0,
      platformStatus: platformHealth.status,
      uptimePercent: platformHealth.uptimePercent,
      incidentsThisMonth: platformHealth.incidentsThisMonth,
      errorsThisMonth: 0,
      blockedAccessAttempts: 0,
      affectedUsers: platformHealth.affectedUsers,
      totalDowntimeMinutes: platformHealth.totalDowntimeMinutes,
      lastIncident: platformHealth.lastIncident,
      averageResponseTimeMs: platformHealth.averageResponseTimeMs,
      sketchfabLoadErrors: platformHealth.sketchfabLoadErrors,
      loginErrors: platformHealth.loginErrors,
      reportExportErrors: platformHealth.reportExportErrors,
      routeErrors: platformHealth.routeErrors,
      lastUpdated: now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    },
    dailyAccessData: [],
    hourlyUsageData: [],
    systemStudyTimeData: [],
    mostAccessedModelsData: [],
    platformErrorsData: [],
    downtimeData: [],
    responseTimeData: [],
    platformIncidents: [],
    blockedAccessLogs: []
  };
}

async function getAuthenticatedProfile() {
  const { data: sessionData } = await safeSupabaseQuery(
    "auth.getSession",
    supabase.auth.getSession(),
    null
  );

  logRealData("status da sessão Supabase", {
    hasSession: Boolean(sessionData?.session),
    authUserId: sessionData?.session?.user?.id || null
  });

  const { data: authData, error: authError } = await safeSupabaseQuery(
    "auth.getUser",
    supabase.auth.getUser(),
    null
  );

  const authUser = authData?.user;
  if (authError || !authUser?.id) return null;

  const { data: profile } = await safeSupabaseQuery(
    "public.users do usuário autenticado",
    supabase
      .from("users")
      .select("id, institution_id, name, email, role, status")
      .eq("id", authUser.id)
      .maybeSingle(),
    null
  );

  logRealData("perfil administrativo carregado", {
    userId: profile?.id || null,
    role: profile?.role || null,
    status: profile?.status || null,
    institutionId: profile?.institution_id || null
  });

  return profile;
}

function normalizeInstitution(record, dataSource = "supabase") {
  const source = record || {};
  const contractedCapacity = numberOrZero(source.contracted_capacity ?? source.contractedCapacity);
  const activeStudents = numberOrZero(source.active_students ?? source.activeStudents);
  const pricePerStudent = numberOrZero(source.price_per_student ?? source.pricePerStudent);

  return {
    id: source.id || "",
    slug: source.slug || source.id || "",
    name: source.name || EMPTY_TEXT,
    displayName: source.name || EMPTY_TEXT,
    city: source.city || "",
    country: source.country || "",
    currency: source.currency || "BRL",
    active: source.active === true,
    contractedCapacity,
    contracted_capacity: contractedCapacity,
    activeStudents,
    active_students: activeStudents,
    pricePerStudent,
    price_per_student: pricePerStudent,
    contractStatus: source.contract_status || source.contractStatus || "unknown",
    licenseStatus: source.contract_status || source.contractStatus || "unknown",
    createdAt: source.created_at || source.createdAt || "",
    updatedAt: source.updated_at || source.updatedAt || "",
    dataSource
  };
}

async function loadRealInstitutions() {
  const { data } = await safeSupabaseQuery(
    "public.institutions lista real",
    supabase
      .from("institutions")
      .select("*")
      .order("created_at", { ascending: true }),
    []
  );

  const institutions = Array.isArray(data) ? data.map(record => normalizeInstitution(record, "supabase")) : [];
  logRealData("lista de instituições carregadas", {
    source: "public.institutions",
    total: institutions.length,
    ids: institutions.map(institution => institution.id)
  });

  return institutions;
}

function resolveTenantScope({ profile, institutions, preferredInstitutionId }) {
  const isSuperAdmin = isSuperAdminProfile(profile);

  if (isSuperAdmin && !preferredInstitutionId) {
    logRealData("tenant carregado", {
      scope: "global",
      institutionId: null,
      source: "public.institutions"
    });

    return {
      isSuperAdmin,
      scope: "global",
      institution: null,
      institutionId: null,
      reason: null
    };
  }

  const institutionId = isSuperAdmin ? preferredInstitutionId : profile?.institution_id || null;
  if (!institutionId) {
    return {
      isSuperAdmin,
      scope: "restricted",
      institution: null,
      institutionId: null,
      reason: "institution_id ausente."
    };
  }

  const institution = institutions.find(item => item.id === institutionId) || null;
  logRealData("tenant carregado", {
    scope: isSuperAdmin ? "tenant selecionado" : "tenant institucional",
    institutionId,
    found: Boolean(institution),
    active: institution?.active ?? null,
    source: "public.institutions"
  });

  if (!institution) {
    return {
      isSuperAdmin,
      scope: "restricted",
      institution: null,
      institutionId,
      reason: "Tenant institucional não encontrado no Supabase."
    };
  }

  if (!isSuperAdmin && !institution.active) {
    return {
      isSuperAdmin,
      scope: "restricted",
      institution,
      institutionId,
      reason: "Instituição inativa."
    };
  }

  return {
    isSuperAdmin,
    scope: "tenant",
    institution,
    institutionId,
    reason: null
  };
}

async function loadInstitutionRows(table, institutionId, select, options = {}) {
  const { allowGlobal = false, count: countOption, orderBy, ascending, limit } = options;

  if (!institutionId && !allowGlobal) {
    console.warn(`[admin-dashboard] Consulta public.${table} bloqueada: institution_id ausente.`);
    return { rows: [], count: 0, error: null };
  }

  let query = supabase.from(table).select(select, countOption ? { count: countOption } : undefined);
  if (institutionId) query = query.eq("institution_id", institutionId);
  if (orderBy) query = query.order(orderBy, { ascending: ascending ?? false });
  if (limit) query = query.limit(limit);

  logRealData("consulta Supabase preparada", {
    source: `public.${table}`,
    institutionId: institutionId || null,
    scope: institutionId ? "tenant" : allowGlobal ? "global" : "blocked"
  });

  const { data, count, error } = await safeSupabaseQuery(`public.${table}`, query, []);
  const rows = Array.isArray(data) ? data : [];

  if (table === "users") {
    logRealData("quantidade real de usuários", {
      source: "public.users",
      institutionId: institutionId || null,
      total: count ?? rows.length
    });
  }

  return { rows, count, error };
}

async function loadStudentProfilesByUsers(userIds) {
  if (!userIds.length) return { rows: [], count: 0, error: null };

  const { data, count, error } = await safeSupabaseQuery(
    "public.student_profiles por alunos reais",
    supabase
      .from("student_profiles")
      .select("user_id, course, semester, registration_number, progress_score, total_study_minutes, favorite_models, last_access_at")
      .in("user_id", userIds),
    []
  );

  return { rows: Array.isArray(data) ? data : [], count, error };
}

function aggregateUsageSummary(rows) {
  const summaries = Array.isArray(rows) ? rows : rows ? [rows] : [];
  if (!summaries.length) return null;

  const totalEvents = summaries.reduce((sum, item) => sum + numberOrZero(item.total_events), 0);
  const totalModelViews = summaries.reduce((sum, item) => sum + numberOrZero(item.total_model_views), 0);
  const totalStudySeconds = summaries.reduce((sum, item) => sum + numberOrZero(item.total_study_seconds), 0);
  const uniqueUsers = summaries.reduce((sum, item) => sum + numberOrZero(item.unique_users), 0);
  const lastEventAt = summaries
    .map(item => item.last_event_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    total_events: totalEvents,
    total_model_views: totalModelViews,
    unique_users: uniqueUsers,
    total_study_seconds: totalStudySeconds,
    avg_duration_seconds: totalModelViews ? totalStudySeconds / totalModelViews : 0,
    last_event_at: lastEventAt
  };
}

async function loadAnalyticsViews(institutionId) {
  const summaryQuery = institutionId
    ? supabase.from("institution_usage_summary").select("*").eq("institution_id", institutionId)
    : supabase.from("institution_usage_summary").select("*");

  const popularityQuery = institutionId
    ? supabase.from("model_popularity_summary").select("*").eq("institution_id", institutionId).order("total_views", { ascending: false }).limit(20)
    : supabase.from("model_popularity_summary").select("*").order("total_views", { ascending: false }).limit(20);

  const engagementQuery = institutionId
    ? supabase.from("user_engagement_summary").select("*").eq("institution_id", institutionId).order("last_access_at", { ascending: false }).limit(200)
    : supabase.from("user_engagement_summary").select("*").order("last_access_at", { ascending: false }).limit(200);

  const [usageSummary, popularitySummary, engagementSummary] = await Promise.all([
    safeSupabaseQuery("view institution_usage_summary", summaryQuery, []),
    safeSupabaseQuery("view model_popularity_summary", popularityQuery, []),
    safeSupabaseQuery("view user_engagement_summary", engagementQuery, [])
  ]);

  return {
    usageSummary: aggregateUsageSummary(usageSummary.data),
    modelPopularity: Array.isArray(popularitySummary.data) ? popularitySummary.data : [],
    userEngagement: Array.isArray(engagementSummary.data) ? engagementSummary.data : [],
    viewErrors: [usageSummary.error, popularitySummary.error, engagementSummary.error].filter(Boolean)
  };
}

function buildWeeklyUsage(logs, events) {
  const today = new Date();
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return { date, day: dayKey(date), access: 0 };
  });

  [...logs, ...events].forEach(item => {
    const date = toDate(item.created_at || item.timestamp);
    if (!date) return;

    const bucket = buckets.find(entry => isSameLocalDay(entry.date, date));
    if (bucket) bucket.access += 1;
  });

  return buckets.map(({ day, access }) => ({ day, access })).filter(item => item.access > 0);
}

function buildMostAccessedModels({ logs, models, popularity }) {
  const titleByModelId = new Map(models.map(model => [
    model.id,
    model.title || model.name || model.slug || "Modelo 3D"
  ]));

  if (popularity.length) {
    return popularity.map(item => ({
      id: item.model_id,
      title: titleByModelId.get(item.model_id) || item.model_title || item.model_id || "Modelo 3D",
      accesses: numberOrZero(item.total_views),
      studyHours: Math.round(numberOrZero(item.avg_duration_seconds) * numberOrZero(item.total_views) / 3600),
      completionRate: numberOrZero(item.completion_rate || 0)
    }));
  }

  const totals = new Map();
  logs.forEach(log => {
    if (!log.model_id) return;
    const current = totals.get(log.model_id) || { accesses: 0, duration: 0 };
    current.accesses += 1;
    current.duration += numberOrZero(log.duration_seconds);
    totals.set(log.model_id, current);
  });

  return Array.from(totals.entries())
    .map(([modelId, stats]) => ({
      id: modelId,
      title: titleByModelId.get(modelId) || modelId,
      accesses: stats.accesses,
      studyHours: Math.round(stats.duration / 3600),
      completionRate: 0
    }))
    .sort((a, b) => b.accesses - a.accesses)
    .slice(0, 8);
}

function buildSystemStudyTime(logs, models) {
  const modelById = new Map(models.map(model => [model.id, model]));
  const totals = new Map();

  logs.forEach(log => {
    const model = modelById.get(log.model_id);
    const system = model?.anatomical_system || "Não classificado";
    totals.set(system, (totals.get(system) || 0) + numberOrZero(log.duration_seconds));
  });

  return Array.from(totals.entries())
    .map(([system, seconds]) => ({ system, hours: Math.round(seconds / 3600) }))
    .filter(item => item.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8);
}

function buildHourlyUsage(logs, events) {
  const totals = new Map();
  [...logs, ...events].forEach(item => {
    const date = toDate(item.created_at);
    if (!date) return;
    const hour = `${String(date.getHours()).padStart(2, "0")}h`;
    totals.set(hour, (totals.get(hour) || 0) + 1);
  });

  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, accesses]) => ({ hour, accesses }));
}

function buildDailyAccess(logs, events) {
  const today = new Date();
  const buckets = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    return {
      date,
      day: dayKey(date),
      accesses: 0,
      activeUsers: new Set(),
      studyMinutes: 0
    };
  });

  logs.forEach(log => {
    const date = toDate(log.created_at);
    if (!date) return;
    const bucket = buckets.find(entry => isSameLocalDay(entry.date, date));
    if (!bucket) return;
    bucket.accesses += 1;
    if (log.user_id) bucket.activeUsers.add(log.user_id);
    bucket.studyMinutes += Math.round(numberOrZero(log.duration_seconds) / 60);
  });

  events.forEach(event => {
    const date = toDate(event.created_at);
    if (!date) return;
    const bucket = buckets.find(entry => isSameLocalDay(entry.date, date));
    if (!bucket) return;
    bucket.accesses += 1;
    if (event.user_id) bucket.activeUsers.add(event.user_id);
  });

  return buckets
    .map(bucket => ({
      day: bucket.day,
      accesses: bucket.accesses,
      activeUsers: bucket.activeUsers.size,
      studyMinutes: bucket.studyMinutes
    }))
    .filter(item => item.accesses > 0 || item.activeUsers > 0 || item.studyMinutes > 0);
}

function buildPlatformErrors(events) {
  const errorBuckets = new Map();
  events.forEach(event => {
    const value = `${event.event_type || ""} ${event.event_category || ""}`.toLowerCase();
    if (!value.includes("error") && !value.includes("erro") && !value.includes("fail") && !value.includes("falha") && !value.includes("blocked")) return;

    let type = "Erro geral";
    if (value.includes("login")) type = "Login";
    else if (value.includes("sketchfab") || value.includes("viewer")) type = "Sketchfab";
    else if (value.includes("report")) type = "Relatórios";
    else if (value.includes("route") || value.includes("rota")) type = "Rotas";
    else if (value.includes("timeout")) type = "Timeout";
    else if (value.includes("permission") || value.includes("blocked") || value.includes("permiss")) type = "Permissão";

    errorBuckets.set(type, (errorBuckets.get(type) || 0) + 1);
  });

  return Array.from(errorBuckets.entries()).map(([type, count]) => ({ type, count }));
}

function modelTitleMap(models) {
  return new Map(models.map(model => [model.id, model.title || model.slug || "Modelo 3D"]));
}

function buildMostAccessedModelsForAnalytics(mostAccessedModels) {
  return mostAccessedModels.map(item => ({
    model: item.title,
    accesses: item.accesses,
    studyMinutes: Math.max(numberOrZero(item.studyHours) * 60, 0),
    growthPercent: 0,
    completionRate: item.completionRate || 0
  }));
}

function buildIncidents(events) {
  return events
    .filter(event => {
      const value = `${event.event_type || ""} ${event.event_category || ""}`.toLowerCase();
      return value.includes("error") || value.includes("erro") || value.includes("fail") || value.includes("falha") || value.includes("incident");
    })
    .slice(0, 20)
    .map(event => {
      const metadata = event.metadata || {};
      return {
        id: event.id,
        date: datePart(event.created_at),
        time: timePart(event.created_at),
        module: metadata.module || event.event_category || "Plataforma",
        errorType: event.event_type || "erro",
        durationMinutes: numberOrZero(metadata.durationMinutes || metadata.duration_minutes),
        affectedUsers: numberOrZero(metadata.affectedUsers || metadata.affected_users) || (event.user_id ? 1 : 0),
        status: metadata.status || "Registrado",
        severity: metadata.severity || "Média",
        note: metadata.note || metadata.message || "Evento registrado em platform_events."
      };
    });
}

function buildBlockedAccessLogs(events, users) {
  const userById = new Map(users.map(user => [user.id, user]));
  return events
    .filter(event => {
      const value = `${event.event_type || ""} ${event.event_category || ""}`.toLowerCase();
      return value.includes("blocked") || value.includes("denied") || value.includes("permission") || value.includes("bloque");
    })
    .slice(0, 20)
    .map(event => {
      const user = userById.get(event.user_id) || {};
      const metadata = event.metadata || {};
      return {
        id: event.id,
        date: datePart(event.created_at),
        user: user.name || metadata.user || "Usuário",
        email: user.email || metadata.email || "-",
        reason: metadata.reason || event.event_type || "Acesso bloqueado",
        device: metadata.device || metadata.user_agent || "Dispositivo não informado",
        status: metadata.status || "Bloqueio registrado"
      };
    });
}

function buildStudentRows({ users, profiles, logs, models }) {
  const profileByUserId = new Map(profiles.map(profile => [profile.user_id, profile]));
  const titleByModel = modelTitleMap(models);
  const logsByUser = new Map();

  logs.forEach(log => {
    if (!log.user_id) return;
    const items = logsByUser.get(log.user_id) || [];
    items.push(log);
    logsByUser.set(log.user_id, items);
  });

  return users
    .filter(user => isStudentRole(user.role))
    .map(user => {
      const profile = profileByUserId.get(user.id) || {};
      const userLogs = (logsByUser.get(user.id) || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const modelCounts = new Map();
      const totalStudyMinutes = Math.round(userLogs.reduce((sum, log) => sum + numberOrZero(log.duration_seconds), 0) / 60);
      userLogs.forEach(log => {
        if (log.model_id) modelCounts.set(log.model_id, (modelCounts.get(log.model_id) || 0) + 1);
      });

      const [mostViewedModelId] = Array.from(modelCounts.entries()).sort((a, b) => b[1] - a[1])[0] || [];
      const studiedModels = modelCounts.size;
      const performanceScore = Math.min(100, Math.round(
        Math.min(userLogs.length, 40) * 1.4 +
        Math.min(totalStudyMinutes, 900) / 18 +
        studiedModels * 3
      ));

      return {
        id: user.id,
        institutionId: user.institution_id || "",
        name: user.name || user.email || "Aluno",
        email: user.email || "-",
        registration: profile.registration_number || "-",
        course: profile.course || "Medicina",
        semester: profile.semester || "Institucional",
        status: normalizeStudentStatus(user.status),
        createdAt: datePart(user.created_at),
        lastAccess: userLogs[0]?.created_at || profile.last_access_at || user.last_login || "",
        totalAccesses: userLogs.length,
        totalStudyMinutes,
        mostViewedContent: mostViewedModelId ? titleByModel.get(mostViewedModelId) || mostViewedModelId : "-",
        studiedModels,
        performanceScore,
        sessions: userLogs.length,
        completedModels: studiedModels,
        viewedContents: Array.from(modelCounts.keys()).map(modelId => titleByModel.get(modelId) || modelId)
      };
    });
}

function buildStudentHistoryByUser({ students, logs, models }) {
  const titleByModel = modelTitleMap(models);
  const history = {};

  students.forEach(student => {
    const userLogs = logs
      .filter(log => log.user_id === student.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 80)
      .map(log => ({
        id: log.id,
        date: datePart(log.created_at),
        time: timePart(log.created_at),
        eventType: eventTypeLabel(log.action),
        content: log.model_id ? titleByModel.get(log.model_id) || log.model_id : "-",
        durationMinutes: Math.round(numberOrZero(log.duration_seconds) / 60),
        device: log.device_type || log.metadata?.device || "Web",
        status: "Concluído"
      }));

    history[student.id] = userLogs;
  });

  return history;
}

function buildPlatformHealth(events) {
  const currentMonthEvents = events.filter(event => isSameLocalMonth(toDate(event.created_at)));
  const errorEvents = currentMonthEvents.filter(event => {
    const value = `${event.event_type || ""} ${event.event_category || ""}`.toLowerCase();
    return value.includes("error") || value.includes("erro") || value.includes("fail") || value.includes("falha");
  });

  const loginErrors = errorEvents.filter(event => `${event.event_type || ""}`.toLowerCase().includes("login")).length;
  const sketchfabErrors = errorEvents.filter(event => `${event.event_type || ""}`.toLowerCase().includes("sketchfab")).length;
  const reportErrors = errorEvents.filter(event => `${event.event_type || ""}`.toLowerCase().includes("report")).length;

  return {
    status: errorEvents.length > 10 ? "degradado" : "online",
    uptimePercent: errorEvents.length ? 99 : 100,
    incidentsThisMonth: errorEvents.length,
    totalDowntimeMinutes: 0,
    affectedUsers: new Set(errorEvents.map(event => event.user_id).filter(Boolean)).size,
    averageResponseTimeMs: 0,
    sketchfabLoadErrors: sketchfabErrors,
    loginErrors,
    reportExportErrors: reportErrors,
    routeErrors: errorEvents.filter(event => `${event.event_type || ""}`.toLowerCase().includes("route")).length,
    lastIncident: errorEvents[0]?.created_at || null
  };
}

function sumInstitutionCapacity(institutions) {
  return institutions.reduce((sum, institution) => sum + numberOrZero(institution.contractedCapacity), 0);
}

function sumInstitutionMaxRevenue(institutions) {
  return institutions.reduce((sum, institution) => (
    sum + numberOrZero(institution.contractedCapacity) * numberOrZero(institution.pricePerStudent)
  ), 0);
}

function calculateEstimatedRevenue({ institutions, activeStudentUsers }) {
  const priceByInstitution = new Map(institutions.map(institution => [
    institution.id,
    numberOrZero(institution.pricePerStudent)
  ]));

  return activeStudentUsers.reduce((sum, user) => {
    const unitPrice = priceByInstitution.get(user.institution_id) || 0;
    return sum + unitPrice;
  }, 0);
}

function buildDashboardPayload({
  scope,
  selectedInstitution,
  institutions,
  users,
  profiles,
  logs,
  events,
  models,
  views,
  source,
  profile
}) {
  const scopeInstitutions = scope === "global"
    ? institutions
    : selectedInstitution
      ? [selectedInstitution]
      : [];
  const displayInstitution = scope === "global"
    ? {
        ...createEmptyInstitution(scopeInstitutions.length ? "Todas as instituições reais" : EMPTY_TEXT, "supabase"),
        active: scopeInstitutions.some(institution => institution.active),
        contractStatus: "global",
        licenseStatus: "global"
      }
    : selectedInstitution || createEmptyInstitution(EMPTY_TEXT, "supabase");

  const studentUsers = users.filter(user => isStudentRole(user.role));
  const activeStudentUsers = studentUsers.filter(user => isActiveStatus(user.status));
  const registeredStudents = studentUsers.length;
  const activeStudents = activeStudentUsers.length;
  const inactiveStudents = Math.max(registeredStudents - activeStudents, 0);
  const contractedCapacity = sumInstitutionCapacity(scopeInstitutions);
  const maxRevenue = sumInstitutionMaxRevenue(scopeInstitutions);
  const pricePerStudent = scope === "tenant" ? numberOrZero(selectedInstitution?.pricePerStudent) : 0;
  const estimatedRevenue = calculateEstimatedRevenue({ institutions: scopeInstitutions, activeStudentUsers });
  const now = new Date();
  const currentMonthLogs = logs.filter(log => isSameLocalMonth(toDate(log.created_at), now));
  const todayLogs = logs.filter(log => isSameLocalDay(toDate(log.created_at), now));
  const totalStudySecondsFromLogs = currentMonthLogs.reduce((sum, log) => sum + numberOrZero(log.duration_seconds), 0);
  const usageSummary = views.usageSummary || {};
  const mostAccessedModelsData = buildMostAccessedModels({ logs, models, popularity: views.modelPopularity });
  const students = buildStudentRows({ users, profiles, logs, models });
  const studentHistoryByUser = buildStudentHistoryByUser({ students, logs, models });
  const dailyAccess = buildDailyAccess(logs, events);
  const hourlyUsage = buildHourlyUsage(logs, events);
  const systemStudyTime = buildSystemStudyTime(logs, models);
  const platformErrors = buildPlatformErrors(events);
  const platformIncidents = buildIncidents(events);
  const blockedAccessLogs = buildBlockedAccessLogs(events, users);
  const platformHealthData = buildPlatformHealth(events);
  const totalEvents = numberOrZero(usageSummary.total_events) || logs.length + events.length;
  const totalModelViews = numberOrZero(usageSummary.total_model_views) || logs.filter(log => log.action === "view_model").length;
  const totalStudySeconds = numberOrZero(usageSummary.total_study_seconds) || totalStudySecondsFromLogs;
  const uniqueActiveUsers = numberOrZero(usageSummary.unique_users) || new Set(logs.map(log => log.user_id).filter(Boolean)).size;
  const lastHourUsers = new Set([
    ...logs.filter(log => isWithinLastMinutes(toDate(log.created_at), 60)).map(log => log.user_id),
    ...events.filter(event => isWithinLastMinutes(toDate(event.created_at), 60)).map(event => event.user_id)
  ].filter(Boolean)).size;

  const averageSessionMinutes = Math.round((numberOrZero(usageSummary.avg_duration_seconds) || (totalModelViews ? totalStudySeconds / totalModelViews : 0)) / 60);
  const occupancyRate = contractedCapacity ? (registeredStudents / contractedCapacity) * 100 : 0;
  const mostAccessedContent = mostAccessedModelsData[0]?.title || EMPTY_TEXT;
  const lastUpdated = new Date();

  return {
    source,
    scope,
    selectedInstitutionId: selectedInstitution?.id || null,
    lastUpdated: lastUpdated.toISOString(),
    institutions,
    institution: {
      ...displayInstitution,
      registeredStudents,
      activeStudents,
      inactiveStudents,
      contractedCapacity,
      pricePerStudent
    },
    stats: {
      contractedCapacity,
      registeredStudents,
      activeStudents,
      inactiveStudents,
      occupancyRate,
      estimatedRevenue,
      maxRevenue,
      lostRevenue: Math.max(maxRevenue - estimatedRevenue, 0)
    },
    overviewMetrics: {
      activeNow: lastHourUsers || uniqueActiveUsers,
      accessesToday: todayLogs.length,
      accessesThisMonth: totalModelViews,
      totalStudyHoursThisMonth: Math.round(totalStudySeconds / 3600),
      mostAccessedContent,
      averageSessionMinutes,
      returnRate: 0,
      completionRate: 0,
      peakHour: "-",
      peakDay: "-"
    },
    usageData: buildWeeklyUsage(logs, events),
    mostAccessedModels: mostAccessedModelsData,
    platformHealth: platformHealthData,
    students,
    studentHistoryByUser,
    analytics: {
      snapshot: {
        activeUsersNow: lastHourUsers || uniqueActiveUsers,
        accessesToday: todayLogs.length,
        accessesThisMonth: totalModelViews,
        totalStudyHoursThisMonth: Math.round(totalStudySeconds / 3600),
        averageSessionMinutes,
        returningUserRate: 0,
        modelCompletionRate: 0,
        platformStatus: platformHealthData.status,
        uptimePercent: platformHealthData.uptimePercent,
        incidentsThisMonth: platformHealthData.incidentsThisMonth,
        errorsThisMonth: platformErrors.reduce((sum, item) => sum + numberOrZero(item.count), 0),
        blockedAccessAttempts: blockedAccessLogs.length,
        affectedUsers: platformHealthData.affectedUsers,
        totalDowntimeMinutes: platformHealthData.totalDowntimeMinutes,
        lastIncident: platformHealthData.lastIncident,
        averageResponseTimeMs: platformHealthData.averageResponseTimeMs,
        sketchfabLoadErrors: platformHealthData.sketchfabLoadErrors,
        loginErrors: platformHealthData.loginErrors,
        reportExportErrors: platformHealthData.reportExportErrors,
        routeErrors: platformHealthData.routeErrors,
        lastUpdated: lastUpdated.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      },
      dailyAccessData: dailyAccess,
      hourlyUsageData: hourlyUsage,
      systemStudyTimeData: systemStudyTime,
      mostAccessedModelsData: buildMostAccessedModelsForAnalytics(mostAccessedModelsData),
      platformErrorsData: platformErrors,
      downtimeData: [],
      responseTimeData: [],
      platformIncidents,
      blockedAccessLogs
    },
    raw: {
      profile,
      institutions,
      users,
      profiles,
      logs,
      events,
      models,
      views,
      totalEvents
    }
  };
}

export function getRestrictedInstitutionDashboardData(profile = null, reason = "institution_id ausente") {
  const now = new Date();
  const restrictedPlatformHealth = createEmptyPlatformHealth("degradado");

  return {
    source: "restricted",
    scope: "restricted",
    reason,
    selectedInstitutionId: null,
    lastUpdated: now.toISOString(),
    institutions: [],
    institution: {
      ...createEmptyInstitution("Tenant institucional não configurado", "restricted"),
      id: profile?.institution_id || "",
      contractStatus: "restricted",
      licenseStatus: "restricted"
    },
    stats: {
      contractedCapacity: 0,
      registeredStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      occupancyRate: 0,
      estimatedRevenue: 0,
      maxRevenue: 0,
      lostRevenue: 0
    },
    overviewMetrics: {
      activeNow: 0,
      accessesToday: 0,
      accessesThisMonth: 0,
      totalStudyHoursThisMonth: 0,
      averageSessionMinutes: 0,
      returnRate: 0,
      completionRate: 0,
      mostAccessedContent: "Restrito",
      peakHour: "-",
      peakDay: "-"
    },
    usageData: [],
    mostAccessedModels: [],
    platformHealth: restrictedPlatformHealth,
    students: [],
    studentHistoryByUser: {},
    analytics: createEmptyAnalytics(restrictedPlatformHealth),
    raw: {
      profile,
      institutions: [],
      users: [],
      profiles: [],
      logs: [],
      events: [],
      models: [],
      views: {}
    }
  };
}

export async function loadInstitutionDashboardData({ institutionId } = {}) {
  if (!isSupabaseConfigured()) {
    console.warn("[admin-dashboard] Supabase não configurado. Dashboard administrativo bloqueado por segurança.");
    return getRestrictedInstitutionDashboardData(null, "Supabase não configurado.");
  }

  const profile = await getAuthenticatedProfile();
  if (!profile?.id) {
    return getRestrictedInstitutionDashboardData(null, "Usuário administrativo não autenticado.");
  }

  const normalizedRole = normalizeRole(profile.role);
  const validAdminRole = [ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN].includes(normalizedRole);
  if (!validAdminRole || !isActiveStatus(profile.status)) {
    return getRestrictedInstitutionDashboardData(profile, "Usuário sem role administrativa ativa.");
  }

  if (!isSuperAdminProfile(profile) && !profile.institution_id) {
    return getRestrictedInstitutionDashboardData(profile, "Usuário autenticado sem institution_id.");
  }

  const allInstitutions = await loadRealInstitutions();
  const scopeInfo = resolveTenantScope({
    profile,
    institutions: allInstitutions,
    preferredInstitutionId: institutionId || null
  });

  if (scopeInfo.scope === "restricted") {
    return getRestrictedInstitutionDashboardData(profile, scopeInfo.reason || "Tenant inválido.");
  }

  const allowGlobal = scopeInfo.scope === "global" && scopeInfo.isSuperAdmin;
  const queryInstitutionId = allowGlobal ? null : scopeInfo.institutionId;
  const visibleInstitutions = scopeInfo.isSuperAdmin
    ? allInstitutions
    : scopeInfo.institution
      ? [scopeInfo.institution]
      : [];

  logRealData("institution_id utilizado", {
    institutionId: queryInstitutionId,
    scope: scopeInfo.scope,
    source: queryInstitutionId ? "tenant filter" : "global super_admin"
  });

  const usersResult = await loadInstitutionRows(
    "users",
    queryInstitutionId,
    "id, institution_id, name, email, role, status, created_at, last_login, avatar_url",
    { allowGlobal, count: "exact" }
  );
  const studentUserIds = usersResult.rows.filter(user => isStudentRole(user.role)).map(user => user.id);

  const [profilesResult, logsResult, eventsResult, modelsResult, views] = await Promise.all([
    loadStudentProfilesByUsers(studentUserIds),
    loadInstitutionRows("model_access_logs", queryInstitutionId, "id, institution_id, user_id, model_id, action, duration_seconds, metadata, created_at", { allowGlobal, orderBy: "created_at", limit: 5000 }),
    loadInstitutionRows("platform_events", queryInstitutionId, "id, institution_id, user_id, event_type, event_category, metadata, created_at", { allowGlobal, orderBy: "created_at", limit: 2000 }),
    loadInstitutionRows("models_3d", queryInstitutionId, "id, institution_id, title, slug, anatomical_system, anatomical_region, status, created_at", { allowGlobal, orderBy: "created_at", limit: 1000 }),
    loadAnalyticsViews(queryInstitutionId)
  ]);

  return buildDashboardPayload({
    scope: scopeInfo.scope,
    selectedInstitution: scopeInfo.institution,
    institutions: visibleInstitutions,
    users: usersResult.rows,
    profiles: profilesResult.rows,
    logs: logsResult.rows,
    events: eventsResult.rows,
    models: modelsResult.rows,
    views,
    source: "supabase",
    profile
  });
}

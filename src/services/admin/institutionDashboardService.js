import { supabase } from "../../lib/supabase.js";
import { normalizeRole, ROLES } from "../permissions/permissionService.js";
import { isSupabaseConfigured } from "../supabase/supabaseClient.js";

const ACTIVE_STATUSES = new Set(["active", "ativo"]);
const STUDENT_ROLES = new Set(["student", "aluno"]);
const EMPTY_TEXT = "Nenhum dado encontrado";

export const STUDENT_ACCOUNT_CATEGORIES = {
  FOUNDER: { key: "founder", label: "Homologação Interna (Fundadores)", badgeTone: "amber" },
  QA: { key: "qa", label: "Automação / QA", badgeTone: "purple" },
  DEMO: { key: "demo", label: "Demonstração Institucional", badgeTone: "blue" },
  EXTERNAL_BETA: { key: "beta", label: "Programa Beta (El Dorado)", badgeTone: "teal" },
  COMMERCIAL: { key: "commercial", label: "Aluno Comercial / Institucional", badgeTone: "emerald" },
  UNCLASSIFIED: { key: "unclassified", label: "Não Classificado", badgeTone: "neutral" }
};

const FOUNDER_IDS = new Set([
  "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4", // Halisson
  "a0168021-b8a2-4c35-8eab-c80240c10e07", // Victor
  "f2591fae-8c18-4eb7-a97d-ae5ae90c5b34", // Nicolas
  "e9931f64-4de9-46fc-9e56-6705345406cb", // Lucas
  "9f1cede4-3672-461b-bbe8-391dd59c988d", // Edgar
  "19f44fd4-cba0-4a35-95c7-b1c5e3e9c5a0"  // Admin
]);

const FOUNDER_EMAILS = new Set([
  "halissonzanchin@aeternumatlas.com",
  "halisson@aeternumatlas.com",
  "halisson.paz@gmail.com",
  "henriquebahia@aeternumatlas.com",
  "victor@aeternumatlas.com",
  "nicolasfigorelli@aeternumatlas.com",
  "nicolas@aeternumatlas.com",
  "lucasparedes@aeternumatlas.com",
  "lucas@aeternumatlas.com",
  "edgartorales@aeternumatlas.com",
  "edgar@aeternumatlas.com"
]);

export function classifyStudentAccount(user, options = {}) {
  const email = (user?.email || "").toLowerCase().trim();
  const userId = user?.id;

  // 1. Equipe Fundadora / Homologação Interna (identificadores estáveis: UUIDs canônicos ou e-mails exatos dos sócios)
  if (FOUNDER_IDS.has(userId) || FOUNDER_EMAILS.has(email)) {
    return STUDENT_ACCOUNT_CATEGORIES.FOUNDER;
  }

  // 2. Homologação Técnica / QA / E2E
  if (
    email.startsWith("qa.") ||
    email.includes("-qa-") ||
    email === "qa.voice.p0@aeternumatlas.com" ||
    email === "atlas-e2e-ai-tutor@aeternumatlas.com" ||
    email.startsWith("test.")
  ) {
    return STUDENT_ACCOUNT_CATEGORIES.QA;
  }

  // 3. Demonstração Institucional
  if (
    email === "demo.institucional@aeternumatlas.com" ||
    email === "demo@aeternumatlas.com" ||
    userId === "5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f"
  ) {
    return STUDENT_ACCOUNT_CATEGORIES.DEMO;
  }

  // 4. Participante Beta Externo Ativo (El Dorado) - Exige status 'activated' comprovado na fonte autorizada
  // DIRETRIZ P0.21-ADM.2.2: Distinguir approved, invited e activated.
  // Candidatos 'approved' ou 'invited' ainda não são participantes ativos na plataforma.
  // Quarentena sintética preservada via verificação de batch e source_origin.
  const isActivatedBeta = Boolean(
    options?.activatedBetaUserIds?.has(userId) ||
    options?.activatedBetaEmails?.has(email) ||
    (Array.isArray(options?.betaApplications) && options.betaApplications.some(app =>
      (app.user_id === userId || (app.email || "").toLowerCase().trim() === email) &&
      app.status === "activated" &&
      app.batch !== "synthetic_test" &&
      app.source_origin !== "synthetic_test"
    ))
  );
  if (isActivatedBeta) {
    return STUDENT_ACCOUNT_CATEGORIES.EXTERNAL_BETA;
  }

  // 5. Aluno Comercial / Institucional (Exige comprovação explícita de vínculo comercial/contratual faturável ativo)
  // DIRETRIZ R1-03: Matrícula acadêmica em turma (academic_class_students) NÃO é comprovação financeira.
  const isVerifiedCommercial = Boolean(
    options?.verifiedCommercialStudentIds?.has(userId) ||
    (options?.hasCommercialContract === true && options?.commercialStudentIds?.has(userId))
  );
  if (isVerifiedCommercial) {
    return STUDENT_ACCOUNT_CATEGORIES.COMMERCIAL;
  }

  // 6. Não Classificado (ausência de comprovação documental ou autorização confirmada)
  return STUDENT_ACCOUNT_CATEGORIES.UNCLASSIFIED;
}

export const CANONICAL_MODEL_METADATA = {
  "035701b7-a49f-4f3f-a0fc-b335675745be": {
    title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    system: "Sistema Nervoso Central",
    region: "Cabeça e Pescoço"
  },
  "2c57a03b-2c77-4119-b8bb-676ea59e9190": {
    title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    system: "Sistema Nervoso Central",
    region: "Cabeça e Pescoço"
  },
  "corte-sagital-cranio-humano-superficial": {
    title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    system: "Sistema Nervoso Central",
    region: "Cabeça e Pescoço"
  },
  "abb93126-c9be-4938-8eca-161f56864781": {
    title: "Coração Humano — Modelo Superficial 3D",
    system: "Sistema Cardiovascular",
    region: "Tórax"
  },
  "coracao-humano-superficial": {
    title: "Coração Humano — Modelo Superficial 3D",
    system: "Sistema Cardiovascular",
    region: "Tórax"
  },
  "coracao-edicao-morgue": {
    title: "Coração Humano — Edição Especial Morgue",
    system: "Sistema Cardiovascular",
    region: "Tórax"
  },
  "corte-sagital-sistema-reprodutor-feminino": {
    title: "Corte Sagital da Pelve Feminina / Sistema Reprodutor",
    system: "Sistema Reprodutor",
    region: "Pelve"
  }
};

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

function normalizeViewerSession(session) {
  return {
    id: session.id,
    institution_id: session.institution_id,
    user_id: session.user_id,
    model_id: session.model_id,
    action: "view_model",
    duration_seconds: numberOrZero(session.active_seconds),
    metadata: {
      scope: session.scope || "viewer",
      status: session.status || "completed",
      idleSeconds: numberOrZero(session.idle_seconds)
    },
    created_at: session.session_start || session.created_at
  };
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

export async function loadAnalyticsViews(institutionId) {
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
    isLegacySource: true,
    sourceTable: "public.model_access_logs",
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
    const canonicalMeta = CANONICAL_MODEL_METADATA[log.model_id] || {};
    const system = model?.anatomical_system || canonicalMeta.system || "Não classificado";
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
  const map = new Map();
  Object.entries(CANONICAL_MODEL_METADATA).forEach(([id, meta]) => {
    map.set(id, meta.title);
  });
  models.forEach(model => {
    map.set(model.id, model.title || model.slug || map.get(model.id) || "Modelo 3D");
    if (model.slug) {
      map.set(model.slug, model.title || model.slug);
    }
  });
  return map;
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

export function buildStudentRows({ users, profiles = [], logs = [], models = [], profilesError = null, options = {} }) {
  const profileByUserId = new Map((profiles || []).map(profile => [profile.user_id, profile]));
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
      const profile = profileByUserId.get(user.id);
      const isProfileMissing = !profile;
      const profileStatus = profilesError ? "query_error" : (isProfileMissing ? "missing_profile" : "available");
      const profileStatusLabel = profilesError
        ? "Falha na consulta"
        : isProfileMissing
          ? "Não cadastrado"
          : "Disponível";

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

      const accountCategory = classifyStudentAccount(user, options);

      return {
        id: user.id,
        institutionId: user.institution_id || "",
        name: user.name || user.email || "Aluno",
        email: user.email || "-",
        registration: profile?.registration_number || "—",
        course: profile?.course || "—",
        semester: profile?.semester || "—",
        profileStatus,
        profileStatusLabel,
        status: normalizeStudentStatus(user.status),
        createdAt: datePart(user.created_at),
        lastAccess: userLogs[0]?.created_at || profile?.last_access_at || user.last_login || "",
        totalAccesses: userLogs.length,
        totalStudyMinutes,
        mostViewedContent: mostViewedModelId ? titleByModel.get(mostViewedModelId) || mostViewedModelId : "-",
        studiedModels,
        performanceScore,
        sessions: userLogs.length,
        completedModels: studiedModels,
        viewedContents: Array.from(modelCounts.keys()).map(modelId => titleByModel.get(modelId) || modelId),
        accountCategory,
        accountCategoryKey: accountCategory.key,
        accountCategoryLabel: accountCategory.label,
        isProfileMissing
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
  if (!currentMonthEvents.length) {
    return createEmptyPlatformHealth("sem dados");
  }

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

export function calculateContractedRevenue({ institutions = [], selectedInstitution = null, scope = "tenant" } = {}) {
  const scopeInstitutions = scope === "global" ? institutions : (selectedInstitution ? [selectedInstitution] : []);
  const contractedCapacity = sumInstitutionCapacity(scopeInstitutions);
  const pricePerStudent = scope === "tenant" ? numberOrZero(selectedInstitution?.pricePerStudent) : 0;
  const isCertified = Boolean(selectedInstitution?.contractCertified === true && selectedInstitution?.contractStatus === "active");

  return {
    contractedCapacity,
    pricePerStudent,
    contractCertified: isCertified,
    currency: "BRL",
    currencySymbol: "R$",
    contractedRevenue: isCertified && contractedCapacity > 0 && pricePerStudent > 0 ? contractedCapacity * pricePerStudent : null,
    financialStatus: isCertified ? "configured" : "not_configured"
  };
}

export function buildGovernanceQuality({ profile, results, views }) {
  const tables = Object.fromEntries(
    Object.entries(results).map(([key, result]) => [
      key,
      {
        rows: result?.rows?.length || 0,
        state: result?.state || (result?.error ? "unavailable" : result?.rows?.length ? "observed" : "empty"),
        description: result?.description || null
      }
    ])
  );
  const unavailable = Object.entries(tables)
    .filter(([, item]) => item.state === "unavailable")
    .map(([key]) => key);
  const viewErrors = views?.viewErrors?.length || 0;
  const role = normalizeRole(profile?.role);

  return {
    status: unavailable.length || viewErrors ? "partial" : "policy_scoped",
    accessScope: role,
    policyScoped: [ROLES.COORDINATOR, ROLES.RECTOR].includes(role),
    unavailable,
    viewErrors,
    tables
  };
}

export function buildDashboardPayload({
  scope,
  selectedInstitution,
  institutions = [],
  users = [],
  profiles = [],
  logs = [],
  events = [],
  models = [],
  views = {},
  academicClasses = [],
  classStudents = [],
  academicSubjects = [],
  quality,
  source,
  profile,
  sessionMetrics = {},
  profilesError = null,
  options = {}
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
  const pricePerStudent = scope === "tenant" ? numberOrZero(selectedInstitution?.pricePerStudent) : 0;

  // DIRETRIZ R1-04: Contrato requer validação de status ativo e certificação formal de termos e moeda.
  const isContractCertified = Boolean(selectedInstitution?.contractCertified === true && selectedInstitution?.contractStatus === "active");
  const contractedRevenue = isContractCertified && contractedCapacity > 0 && pricePerStudent > 0
    ? contractedCapacity * pricePerStudent
    : null;
  const financialStatus = isContractCertified ? "configured" : "not_configured";

  const now = new Date();
  const currentMonthLogs = logs.filter(log => isSameLocalMonth(toDate(log.created_at), now));
  const todayLogs = logs.filter(log => isSameLocalDay(toDate(log.created_at), now));

  // DIRETRIZ R1-02: Alinhamento temporal rigoroso entre numerador e denominador
  // 1. Mês corrente:
  const currentMonthModelViews = currentMonthLogs.filter(log => log.action === "view_model").length;
  const currentMonthStudySeconds = currentMonthLogs.reduce((sum, log) => sum + numberOrZero(log.duration_seconds), 0);
  const currentMonthAverageSessionMinutes = Math.round((currentMonthModelViews ? currentMonthStudySeconds / currentMonthModelViews : 0) / 60);

  // 2. Histórico carregado (All-time dos registros disponíveis no escopo):
  const totalModelViews = logs.filter(log => log.action === "view_model").length;
  const allTimeStudySeconds = logs.reduce((sum, log) => sum + numberOrZero(log.duration_seconds), 0);
  const allTimeAverageSessionMinutes = Math.round((totalModelViews ? allTimeStudySeconds / totalModelViews : 0) / 60);

  // 3. Hoje:
  const todayModelViews = todayLogs.filter(log => log.action === "view_model").length;
  const todayStudySeconds = todayLogs.reduce((sum, log) => sum + numberOrZero(log.duration_seconds), 0);

  // Fonte canônica para modelos mais acessados deriva diretamente das sessões e do catálogo
  const mostAccessedModelsData = buildMostAccessedModels({ logs, models, popularity: [] });

  const enrolledStudentIds = new Set(classStudents.map(cs => cs.student_id).filter(Boolean));
  const students = buildStudentRows({
    users,
    profiles,
    logs,
    models,
    profilesError,
    options: {
      ...options,
      enrolledStudentIds,
      institutions: scopeInstitutions
    }
  });

  const studentHistoryByUser = buildStudentHistoryByUser({ students, logs, models });
  const dailyAccess = buildDailyAccess(logs, events);
  const hourlyUsage = buildHourlyUsage(logs, events);
  const systemStudyTime = buildSystemStudyTime(logs, models);
  const platformErrors = buildPlatformErrors(events);
  const platformIncidents = buildIncidents(events);
  const blockedAccessLogs = buildBlockedAccessLogs(events, users);
  const platformHealthData = buildPlatformHealth(events);

  // Métricas canônicas certificadas
  const totalEvents = logs.length + events.length;
  const uniqueActiveUsers = new Set(logs.map(log => log.user_id).filter(Boolean)).size;

  const lastHourUsers = new Set([
    ...logs.filter(log => isWithinLastMinutes(toDate(log.created_at), 60)).map(log => log.user_id),
    ...events.filter(event => isWithinLastMinutes(toDate(event.created_at), 60)).map(event => event.user_id)
  ].filter(Boolean)).size;

  const occupancyRate = contractedCapacity ? (registeredStudents / contractedCapacity) * 100 : 0;
  const mostAccessedContent = mostAccessedModelsData[0]?.title || EMPTY_TEXT;
  const lastUpdated = new Date();

  // DIRETRIZ P0.21-ADM.2.2: Transparência e integridade na amostragem PostgREST
  // Não declarar cobertura completa apenas porque a contagem é inferior ao limite;
  // total comprovado requer agregação analítica dedicada (programada para ADM.2.4).
  const sourceCoverage = {
    isLimitBounded: logs.length >= 5000 || events.length >= 2000,
    limits: {
      viewerSessionsLimit: 5000,
      platformEventsLimit: 2000,
      modelsLimit: 1000,
      classesLimit: 1000,
      membershipsLimit: 5000
    },
    observedCounts: {
      viewerSessions: logs.length,
      platformEvents: events.length,
      models: models.length,
      classes: academicClasses.length,
      memberships: classStudents.length
    },
    coverageStatus: logs.length >= 5000 ? "limit_bounded" : "observed_sample",
    limitationNotice: logs.length >= 5000
      ? "Limite de 5.000 sessões atingido. Totais históricos exigem agregação analítica ou paginação."
      : "Amostragem limitada aos registros observados no escopo PostgREST. Confirmação analítica integral programada para ADM.2.4."
  };

  const defaultBetaSummary = {
    status: "available",
    error: null,
    totalApplications: 0,
    pending: 0,
    approved: 0,
    invited: 0,
    activated: 0,
    maxCapacity: 30,
    availableSlots: 30,
    registrationOpen: false,
    scopeReviewRequiredInAdm23: true
  };
  const betaOperations = options?.betaOperationsSummary || defaultBetaSummary;

  return {
    source,
    scope,
    selectedInstitutionId: selectedInstitution?.id || null,
    lastUpdated: lastUpdated.toISOString(),
    institutions,
    betaOperations,
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
      contractCertified: isContractCertified,
      contractedRevenue,
      financialStatus,
      currency: "BRL",
      currencySymbol: "R$",
      indicativeCapacityValue: (contractedCapacity > 0 && pricePerStudent > 0) ? contractedCapacity * pricePerStudent : null,
      financialDisclaimer: "Módulo financeiro avançado com conciliação bancária e certificação de contratos previsto para a fase ADM.2.6.",
      estimatedRevenue: null,
      maxRevenue: null,
      lostRevenue: null
    },
    sourceCoverage,
    overviewMetrics: {
      activeNow: null,
      activeNowState: "unavailable",
      activeNowDescription: "Requer telemetria de presença instantânea em tempo real (heartbeat <= 5 min)",
      recentActivity1h: lastHourUsers,
      accessesToday: todayModelViews,
      accessesThisMonth: currentMonthModelViews,
      totalStudyHoursThisMonth: Math.round(currentMonthStudySeconds / 3600),
      mostAccessedContent,
      averageSessionMinutes: currentMonthAverageSessionMinutes,
      allTimeMetrics: {
        totalModelViews,
        totalStudyHours: Math.round(allTimeStudySeconds / 3600),
        averageSessionMinutes: allTimeAverageSessionMinutes
      },
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
    quality,
    sessionMetrics,
    analytics: {
      snapshot: {
        activeUsersNow: null,
        activeUsersNowState: "unavailable",
        activeUsersNowDescription: "Requer telemetria de presença instantânea em tempo real (heartbeat <= 5 min)",
        recentActivity1h: lastHourUsers,
        accessesToday: todayModelViews,
        accessesThisMonth: currentMonthModelViews,
        totalStudyHoursThisMonth: Math.round(currentMonthStudySeconds / 3600),
        averageSessionMinutes: currentMonthAverageSessionMinutes,
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
      academicClasses,
      classStudents,
      academicSubjects,
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
    quality: {
      status: "restricted",
      accessScope: normalizeRole(profile?.role),
      policyScoped: true,
      unavailable: [],
      viewErrors: 0,
      tables: {}
    },
    analytics: createEmptyAnalytics(restrictedPlatformHealth),
    raw: {
      profile,
      institutions: [],
      users: [],
      profiles: [],
      logs: [],
      events: [],
      models: [],
      academicClasses: [],
      classStudents: [],
      academicSubjects: [],
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
  const validInstitutionalRole = [
    ROLES.COORDINATOR,
    ROLES.RECTOR,
    ROLES.INSTITUTION_ADMIN,
    ROLES.SUPER_ADMIN
  ].includes(normalizedRole);
  if (!validInstitutionalRole || !isActiveStatus(profile.status)) {
    return getRestrictedInstitutionDashboardData(profile, "Usuário sem papel institucional ativo.");
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

  const [
    profilesResult,
    viewerSessionsResult,
    eventsResult,
    modelsResult,
    classesResult,
    classStudentsResult,
    views,
    betaAppsResult
  ] = await Promise.all([
    loadStudentProfilesByUsers(studentUserIds),
    loadInstitutionRows("viewer_learning_sessions", queryInstitutionId, "id, institution_id, user_id, model_id, scope, active_seconds, idle_seconds, status, session_start, created_at", { allowGlobal, orderBy: "session_start", limit: 5000 }),
    loadInstitutionRows("platform_events", queryInstitutionId, "id, institution_id, user_id, event_type, event_category, metadata, created_at", { allowGlobal, orderBy: "created_at", limit: 2000 }),
    loadInstitutionRows("models_3d", queryInstitutionId, "id, institution_id, title, slug, anatomical_system, anatomical_region, status, created_at", { allowGlobal, orderBy: "created_at", limit: 1000 }),
    loadInstitutionRows("academic_classes", queryInstitutionId, "id, institution_id, teacher_id, name, course, semester, status, created_at, updated_at", { allowGlobal, orderBy: "created_at", limit: 1000 }),
    loadInstitutionRows("academic_class_students", queryInstitutionId, "id, institution_id, class_id, student_id, created_at", { allowGlobal, orderBy: "created_at", limit: 5000 }),
    loadAnalyticsViews(queryInstitutionId),
    loadInstitutionRows("beta_applications", null, "id, email, user_id, status, batch, source_origin", { allowGlobal: true, limit: 1000 })
  ]);

  const realBetaApps = (betaAppsResult?.rows || []).filter(
    b => b.batch !== "synthetic_test" && b.source_origin !== "synthetic_test"
  );
  const activatedBetaUserIds = new Set(
    realBetaApps.filter(b => b.user_id && b.status === "activated").map(b => b.user_id)
  );
  const activatedBetaEmails = new Set(
    realBetaApps.filter(b => b.status === "activated").map(b => (b.email || "").toLowerCase().trim()).filter(Boolean)
  );

  const betaOperationsSummary = {
    status: betaAppsResult?.error ? "query_error" : "available",
    error: betaAppsResult?.error ? String(betaAppsResult.error) : null,
    totalApplications: realBetaApps.length,
    pending: realBetaApps.filter(b => b.status === "pending" || b.status === "under_review").length,
    approved: realBetaApps.filter(b => b.status === "approved").length,
    invited: realBetaApps.filter(b => b.status === "invited").length,
    activated: realBetaApps.filter(b => b.status === "activated").length,
    maxCapacity: 30,
    availableSlots: Math.max(0, 30 - realBetaApps.filter(b => b.status === "activated").length),
    registrationOpen: false, // beta_registration_open = false strictly preserved
    scopeReviewRequiredInAdm23: true
  };

  const subjectsResult = {
    rows: [],
    count: 0,
    state: "not_implemented",
    description: "public.academic_subjects não integra o esquema acadêmico autorizado atual. Disciplinas organizadas via academic_classes."
  };

  const allViewerSessions = viewerSessionsResult.rows.map(normalizeViewerSession);
  const viewer3dSessions = allViewerSessions.filter(session => (session.metadata?.scope || "viewer") === "viewer");
  const accountPortalSessions = allViewerSessions.filter(session => (session.metadata?.scope || "viewer") === "account");

  const logsResult = {
    ...viewerSessionsResult,
    rows: viewer3dSessions
  };

  const quality = buildGovernanceQuality({
    profile,
    views,
    results: {
      users: usersResult,
      studentProfiles: profilesResult,
      activityLogs: logsResult,
      platformEvents: eventsResult,
      models: modelsResult,
      classes: classesResult,
      classMemberships: classStudentsResult,
      subjects: subjectsResult
    }
  });

  const sessionMetrics = {
    canonicalSource: "viewer_learning_sessions",
    totalSessionsCount: allViewerSessions.length,
    viewer3dSessionsCount: viewer3dSessions.length,
    accountPortalSessionsCount: accountPortalSessions.length,
    totalActiveStudySeconds: allViewerSessions.reduce((sum, s) => sum + numberOrZero(s.duration_seconds), 0),
    viewer3dActiveStudySeconds: viewer3dSessions.reduce((sum, s) => sum + numberOrZero(s.duration_seconds), 0),
    accountActiveStudySeconds: accountPortalSessions.reduce((sum, s) => sum + numberOrZero(s.duration_seconds), 0)
  };

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
    academicClasses: classesResult.rows,
    classStudents: classStudentsResult.rows,
    academicSubjects: subjectsResult.rows,
    quality,
    sessionMetrics,
    source: "supabase",
    profile,
    profilesError: profilesResult.error,
    options: {
      activatedBetaUserIds,
      activatedBetaEmails,
      betaOperationsSummary,
      betaApplications: realBetaApps
    }
  });
}



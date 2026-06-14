import { supabase } from "../../lib/supabase";
import { getUserInstitutionId, isActiveUser, normalizeRole, ROLES } from "../permissions/permissionService";
import { isSupabaseConfigured } from "../supabase/supabaseClient";
import { listModelsForUser } from "../modelService";

const STUDENT_ROLES = new Set(["student", "aluno"]);

function numberOrZero(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeStudentStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (["active", "ativo"].includes(normalized)) return "ativo";
  if (["inactive", "inativo"].includes(normalized)) return "inativo";
  if (["pending", "pendente"].includes(normalized)) return "pendente";
  if (["suspended", "blocked", "bloqueado"].includes(normalized)) return "bloqueado";
  return "pendente";
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function withinLastDays(value, days) {
  const date = toDate(value);
  if (!date) return false;
  return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

function formatMinutes(minutes) {
  const safeMinutes = Math.max(0, Math.round(numberOrZero(minutes)));
  if (safeMinutes >= 60) {
    const hours = Math.floor(safeMinutes / 60);
    const rest = safeMinutes % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  }
  return `${safeMinutes} min`;
}

async function safeQuery(label, query, fallback = null) {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`[teacher-dashboard] ${label} não retornou dados reais.`, error.message);
      return fallback;
    }
    return data ?? fallback;
  } catch (error) {
    console.warn(`[teacher-dashboard] Falha ao consultar ${label}.`, error);
    return fallback;
  }
}

function createRestrictedTeacherPayload(reason) {
  return {
    restricted: true,
    reason,
    profile: null,
    institution: null,
    models: [],
    students: [],
    classes: [],
    studyGuides: [],
    lessons: [],
    notes: [],
    metrics: {
      classes: 0,
      students: 0,
      availableModels: 0,
      mostUsedModel: "",
      averageStudyTime: "0 min",
      activeStudentsThisWeek: 0,
      studyGuidesCreated: 0,
      pendingValidations: 0
    },
    reports: {
      classStudyTime: [],
      weeklyEvolution: [],
      systemPerformance: [],
      modelRanking: []
    }
  };
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStructuredList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }
}

function latestDate(values = []) {
  return values
    .map(toDate)
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())[0] || null;
}

function statusLabel(status, fallback = "ativo") {
  return String(status || fallback).toLowerCase();
}

function normalizeInstitution(record) {
  if (!record?.id) return null;
  return {
    id: record.id,
    name: record.name || record.slug || "",
    campus: record.city || "",
    city: record.city || "",
    country: record.country || "",
    active: record.active === true
  };
}

function normalizeTeacherProfile({ user, profile, institution }) {
  return {
    id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || ROLES.TEACHER,
    institution: institution?.name || "",
    campus: institution?.campus || "",
    department: profile?.department || "",
    specialties: [profile?.specialization].filter(Boolean),
    specialization: profile?.specialization || "",
    academicTitle: profile?.academic_title || ""
  };
}

function modelTitleMap(models) {
  return new Map(models.map(model => [model.id, model.title || model.slug || model.id]));
}

function buildStudents({ users, profiles, logs, models }) {
  const profileByUser = new Map(profiles.map(profile => [profile.user_id, profile]));
  const titleByModel = modelTitleMap(models);
  const logsByUser = new Map();

  logs.forEach(log => {
    if (!log.user_id) return;
    const current = logsByUser.get(log.user_id) || [];
    current.push(log);
    logsByUser.set(log.user_id, current);
  });

  return users.map(user => {
    const profile = profileByUser.get(user.id) || {};
    const userLogs = (logsByUser.get(user.id) || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const modelIds = new Set(userLogs.map(log => log.model_id).filter(Boolean));
    const totalStudyMinutesFromLogs = Math.round(userLogs.reduce((sum, log) => sum + numberOrZero(log.duration_seconds), 0) / 60);
    const totalStudyMinutes = numberOrZero(profile.total_study_minutes) || totalStudyMinutesFromLogs;

    return {
      id: user.id,
      name: user.name || user.email || "",
      registration: profile.registration_number || "-",
      className: profile.semester || profile.course || "-",
      lastAccess: userLogs[0]?.created_at || profile.last_access_at || user.last_login || "",
      totalStudyTime: formatMinutes(totalStudyMinutes),
      totalStudyMinutes,
      accessedModels: modelIds.size,
      progress: numberOrZero(profile.progress_score),
      status: normalizeStudentStatus(user.status),
      topModels: Array.from(modelIds).map(modelId => titleByModel.get(modelId) || modelId)
    };
  });
}

function buildClasses({ classes, memberships, students, logs }) {
  const studentById = new Map(students.map(student => [student.id, student]));
  const logsByStudentId = new Map();

  logs.forEach(log => {
    if (!log.user_id) return;
    const current = logsByStudentId.get(log.user_id) || [];
    current.push(log);
    logsByStudentId.set(log.user_id, current);
  });

  return classes.map(item => {
    const classMemberships = memberships.filter(membership => membership.class_id === item.id);
    const classStudents = classMemberships
      .map(membership => studentById.get(membership.student_id))
      .filter(Boolean);
    const studySeconds = classStudents.reduce((sum, student) => {
      const studentLogs = logsByStudentId.get(student.id) || [];
      return sum + studentLogs.reduce((inner, log) => inner + numberOrZero(log.duration_seconds), 0);
    }, 0);
    const lastActivity = latestDate(
      classStudents.flatMap(student => (logsByStudentId.get(student.id) || []).map(log => log.created_at))
    );
    const averageProgress = classStudents.length
      ? Math.round(classStudents.reduce((sum, student) => sum + numberOrZero(student.progress), 0) / classStudents.length)
      : 0;

    return {
      id: item.id,
      name: item.name || "",
      course: item.course || "",
      semester: item.semester || "",
      status: statusLabel(item.status, "active"),
      students: classStudents.length,
      averageProgress,
      totalStudyMinutes: Math.round(studySeconds / 60),
      totalStudyTime: formatMinutes(Math.round(studySeconds / 60)),
      lastActivityAt: lastActivity?.toISOString() || "",
      notes: item.notes || ""
    };
  });
}

function buildStudyGuides({ guides, classes, models }) {
  const classById = new Map(classes.map(item => [item.id, item]));
  const titleByModel = modelTitleMap(models);

  return guides.map(item => {
    const modelIds = normalizeStructuredList(item.model_ids);
    return {
      id: item.id,
      title: item.title || "",
      description: item.description || "",
      className: classById.get(item.class_id)?.name || "",
      objectives: normalizeStructuredList(item.objectives),
      modelTitles: modelIds.map(modelId => titleByModel.get(modelId) || modelId),
      dueDate: item.due_date || "",
      status: statusLabel(item.status, "draft"),
      createdAt: item.created_at || ""
    };
  });
}

function buildLessons({ lessons, classes, models }) {
  const classById = new Map(classes.map(item => [item.id, item]));
  const titleByModel = modelTitleMap(models);

  return lessons.map(item => {
    const modelIds = normalizeStructuredList(item.model_ids);
    return {
      id: item.id,
      title: item.title || "",
      className: classById.get(item.class_id)?.name || "",
      scheduledFor: item.scheduled_for || "",
      status: statusLabel(item.status, "planned"),
      modelTitles: modelIds.map(modelId => titleByModel.get(modelId) || modelId),
      keyStructures: normalizeStructuredList(item.key_structures),
      objectives: normalizeStructuredList(item.objectives),
      notes: item.notes || ""
    };
  });
}

function buildNotes({ notes, models }) {
  const titleByModel = modelTitleMap(models);

  return notes.map(item => ({
    id: item.id,
    title: item.structure || item.note_type || "",
    modelTitle: titleByModel.get(item.model_id) || "",
    noteType: item.note_type || "",
    description: item.description || "",
    priority: statusLabel(item.priority, "medium"),
    status: statusLabel(item.status, "open"),
    visibility: statusLabel(item.visibility, "private"),
    createdAt: item.created_at || ""
  }));
}

function buildModelRanking(logs, models) {
  const titleByModel = modelTitleMap(models);
  const counts = new Map();

  logs.forEach(log => {
    if (!log.model_id) return;
    counts.set(log.model_id, (counts.get(log.model_id) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([modelId, accesses]) => ({
      model: titleByModel.get(modelId) || modelId,
      accesses
    }))
    .sort((a, b) => b.accesses - a.accesses)
    .slice(0, 8);
}

function buildSystemPerformance(logs, models) {
  const modelById = new Map(models.map(model => [model.id, model]));
  const totals = new Map();

  logs.forEach(log => {
    const model = modelById.get(log.model_id);
    const label = model?.system || model?.anatomical_system || "Não classificado";
    totals.set(label, (totals.get(label) || 0) + 1);
  });

  return Array.from(totals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function buildWeeklyEvolution(logs) {
  const now = new Date();
  const buckets = Array.from({ length: 4 }, (_, index) => ({
    label: `Sem ${index + 1}`,
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (27 - index * 7)),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (21 - index * 7)),
    value: 0
  }));

  logs.forEach(log => {
    const date = toDate(log.created_at);
    if (!date) return;
    const bucket = buckets.find(item => date >= item.start && date <= new Date(item.end.getTime() + 24 * 60 * 60 * 1000));
    if (bucket) bucket.value += 1;
  });

  return buckets
    .map(({ label, value }) => ({ label, value }))
    .filter(item => item.value > 0);
}

function buildClassStudyTime(classes) {
  return classes
    .map(item => ({
      label: item.name || item.semester || "Turma",
      value: numberOrZero(item.totalStudyMinutes)
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function buildMetrics({ students, models, logs, modelRanking, classes, studyGuides, notes }) {
  const activeStudentsThisWeek = new Set(
    logs.filter(log => withinLastDays(log.created_at, 7)).map(log => log.user_id).filter(Boolean)
  ).size;
  const totalStudyMinutes = Math.round(logs.reduce((sum, log) => sum + numberOrZero(log.duration_seconds), 0) / 60);
  const averageStudyMinutes = students.length ? totalStudyMinutes / students.length : 0;
  const pendingValidations = notes.filter(note => !["resolved", "archived", "closed"].includes(note.status)).length;

  return {
    classes: classes.length,
    students: students.length,
    availableModels: models.length,
    mostUsedModel: modelRanking[0]?.model || "",
    averageStudyTime: formatMinutes(averageStudyMinutes),
    activeStudentsThisWeek,
    studyGuidesCreated: studyGuides.length,
    pendingValidations
  };
}

export async function loadTeacherDashboardData(user) {
  if (!isSupabaseConfigured()) {
    return createRestrictedTeacherPayload("Supabase não configurado.");
  }

  const role = normalizeRole(user?.role);
  const institutionId = getUserInstitutionId(user);

  if (![ROLES.TEACHER, ROLES.SUPER_ADMIN].includes(role)) {
    return createRestrictedTeacherPayload("Role docente inválida.");
  }

  if (!isActiveUser(user)) {
    return createRestrictedTeacherPayload("Usuário docente sem status ativo.");
  }

  if (!institutionId) {
    return createRestrictedTeacherPayload("institution_id obrigatório para a área docente.");
  }

  const institutionRecord = await safeQuery(
    "public.institutions",
    supabase
      .from("institutions")
      .select("id, name, city, country, active")
      .eq("id", institutionId)
      .maybeSingle(),
    null
  );
  const institution = normalizeInstitution(institutionRecord);

  if (!institution?.id || institution.active !== true) {
    return createRestrictedTeacherPayload("Instituição docente não encontrada ou inativa.");
  }

  const [
    teacherProfileRecord,
    studentUsers,
    models,
    classRecords,
    guideRecords,
    lessonRecords,
    noteRecords
  ] = await Promise.all([
    safeQuery(
      "public.teacher_profiles",
      supabase
        .from("teacher_profiles")
        .select("user_id, department, specialization, academic_title")
        .eq("user_id", user.id)
        .maybeSingle(),
      null
    ),
    safeQuery(
      "public.users estudantes",
      supabase
        .from("users")
        .select("id, institution_id, name, email, role, status, last_login")
        .eq("institution_id", institutionId)
        .in("role", Array.from(STUDENT_ROLES))
        .order("name", { ascending: true }),
      []
    ),
    listModelsForUser(user),
    safeQuery(
      "public.academic_classes",
      supabase
        .from("academic_classes")
        .select("id, institution_id, teacher_id, name, course, semester, status, notes, created_at, updated_at")
        .eq("institution_id", institutionId)
        .eq("teacher_id", user.id)
        .order("name", { ascending: true }),
      []
    ),
    safeQuery(
      "public.teacher_study_guides",
      supabase
        .from("teacher_study_guides")
        .select("id, institution_id, teacher_id, class_id, title, description, objectives, model_ids, due_date, status, created_at, updated_at")
        .eq("institution_id", institutionId)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false }),
      []
    ),
    safeQuery(
      "public.teacher_lesson_plans",
      supabase
        .from("teacher_lesson_plans")
        .select("id, institution_id, teacher_id, class_id, title, scheduled_for, model_ids, key_structures, objectives, notes, status, created_at, updated_at")
        .eq("institution_id", institutionId)
        .eq("teacher_id", user.id)
        .order("scheduled_for", { ascending: true }),
      []
    ),
    safeQuery(
      "public.teacher_anatomical_notes",
      supabase
        .from("teacher_anatomical_notes")
        .select("id, institution_id, teacher_id, model_id, structure, note_type, description, priority, status, visibility, created_at, updated_at")
        .eq("institution_id", institutionId)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false }),
      []
    )
  ]);

  const studentIds = Array.isArray(studentUsers) ? studentUsers.map(student => student.id).filter(Boolean) : [];
  const classIds = arrayOrEmpty(classRecords).map(item => item.id).filter(Boolean);
  const [studentProfiles, logs, classMemberships] = await Promise.all([
    studentIds.length
      ? safeQuery(
          "public.student_profiles",
          supabase
            .from("student_profiles")
            .select("user_id, course, semester, registration_number, progress_score, total_study_minutes, last_access_at")
            .in("user_id", studentIds),
          []
        )
      : [],
    safeQuery(
      "public.model_access_logs",
      supabase
        .from("model_access_logs")
        .select("id, institution_id, user_id, model_id, duration_seconds, created_at")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false })
        .limit(2500),
      []
    ),
    classIds.length
      ? safeQuery(
          "public.academic_class_students",
          supabase
            .from("academic_class_students")
            .select("id, institution_id, class_id, student_id, created_at")
            .eq("institution_id", institutionId)
            .in("class_id", classIds),
          []
        )
      : []
  ]);

  const safeUsers = Array.isArray(studentUsers) ? studentUsers : [];
  const safeProfiles = Array.isArray(studentProfiles) ? studentProfiles : [];
  const safeLogs = Array.isArray(logs) ? logs : [];
  const safeModels = Array.isArray(models) ? models : [];
  const students = buildStudents({ users: safeUsers, profiles: safeProfiles, logs: safeLogs, models: safeModels });
  const classes = buildClasses({
    classes: arrayOrEmpty(classRecords),
    memberships: arrayOrEmpty(classMemberships),
    students,
    logs: safeLogs
  });
  const studyGuides = buildStudyGuides({ guides: arrayOrEmpty(guideRecords), classes, models: safeModels });
  const lessons = buildLessons({ lessons: arrayOrEmpty(lessonRecords), classes, models: safeModels });
  const notes = buildNotes({ notes: arrayOrEmpty(noteRecords), models: safeModels });
  const modelRanking = buildModelRanking(safeLogs, safeModels);
  const systemPerformance = buildSystemPerformance(safeLogs, safeModels);
  const weeklyEvolution = buildWeeklyEvolution(safeLogs);

  return {
    restricted: false,
    reason: null,
    profile: normalizeTeacherProfile({ user, profile: teacherProfileRecord, institution }),
    institution,
    models: safeModels,
    students,
    classes,
    studyGuides,
    lessons,
    notes,
    metrics: buildMetrics({
      students,
      models: safeModels,
      logs: safeLogs,
      modelRanking,
      classes,
      studyGuides,
      notes
    }),
    reports: {
      classStudyTime: buildClassStudyTime(classes),
      weeklyEvolution,
      systemPerformance,
      modelRanking
    }
  };
}

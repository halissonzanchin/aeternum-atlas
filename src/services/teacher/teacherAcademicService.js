import { supabase } from "../../lib/supabase";
import { getUserInstitutionId, isActiveUser, normalizeRole, ROLES } from "../permissions/permissionService";
import { isSupabaseConfigured } from "../supabase/supabaseClient";

function assertTeacherOperationalScope(user) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado.");
  }

  const role = normalizeRole(user?.role);
  const institutionId = getUserInstitutionId(user);

  if (![ROLES.TEACHER, ROLES.SUPER_ADMIN].includes(role)) {
    throw new Error("Perfil docente inválido para esta operação.");
  }

  if (!isActiveUser(user)) {
    throw new Error("Usuário docente sem status ativo.");
  }

  if (!institutionId) {
    throw new Error("institution_id obrigatório para criar turmas.");
  }

  return {
    institutionId,
    teacherId: user.id
  };
}

export async function createTeacherClass(user, payload) {
  const { institutionId, teacherId } = assertTeacherOperationalScope(user);
  const name = String(payload?.name || "").trim();

  if (!name) {
    throw new Error("Informe o nome da turma.");
  }

  const insertPayload = {
    institution_id: institutionId,
    teacher_id: teacherId,
    name,
    course: String(payload?.course || "").trim() || null,
    semester: String(payload?.semester || "").trim() || null,
    notes: String(payload?.notes || "").trim() || null,
    status: payload?.status || "active"
  };

  const { data, error } = await supabase
    .from("academic_classes")
    .insert(insertPayload)
    .select("id, institution_id, teacher_id, name, course, semester, status, notes, created_at, updated_at")
    .single();

  if (error) {
    console.error("[teacher-academic] Falha ao criar turma.", error);
    throw new Error(error.message || "Não foi possível criar a turma.");
  }

  return data;
}

function normalizeTextList(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeGuideStatus(status) {
  return ["draft", "active", "completed", "archived"].includes(status) ? status : "draft";
}

export async function createTeacherStudyGuide(user, payload) {
  const { institutionId, teacherId } = assertTeacherOperationalScope(user);
  const title = String(payload?.title || "").trim();

  if (!title) {
    throw new Error("Informe o título do guia.");
  }

  const insertPayload = {
    institution_id: institutionId,
    teacher_id: teacherId,
    class_id: payload?.classId || null,
    title,
    description: String(payload?.description || "").trim() || null,
    objectives: normalizeTextList(payload?.objectives),
    model_ids: normalizeTextList(payload?.modelIds),
    due_date: payload?.dueDate || null,
    status: normalizeGuideStatus(payload?.status)
  };

  const { data, error } = await supabase
    .from("teacher_study_guides")
    .insert(insertPayload)
    .select("id, institution_id, teacher_id, class_id, title, description, objectives, model_ids, due_date, status, created_at, updated_at")
    .single();

  if (error) {
    console.error("[teacher-academic] Falha ao criar guia de estudo.", error);
    throw new Error(error.message || "Não foi possível criar o guia de estudo.");
  }

  return data;
}

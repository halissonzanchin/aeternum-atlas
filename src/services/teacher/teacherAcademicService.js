import { supabase } from "../../lib/supabase";
import { getUserInstitutionId, isActiveUser, normalizeRole, ROLES } from "../permissions/permissionService";
import { isSupabaseConfigured } from "../supabase/supabaseClient";

function assertTeacherOperationalScope(user) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado.");
  }

  const role = normalizeRole(user?.role);
  const institutionId = getUserInstitutionId(user);

  if (![ROLES.TEACHER, ROLES.SUPER_ADMIN, ROLES.COORDINATOR, ROLES.RECTOR].includes(role)) {
    throw new Error("Perfil docente inválido para esta operação.");
  }

  if (!isActiveUser(user)) {
    throw new Error("Usuário docente sem status ativo.");
  }

  if (!institutionId) {
    throw new Error("institution_id obrigatório para operações acadêmicas.");
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
    course: String(payload?.course || "").trim() || "Medicina",
    semester: String(payload?.semester || "").trim() || "1º Semestre",
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

export async function updateTeacherClass(user, classId, payload) {
  const { institutionId, teacherId } = assertTeacherOperationalScope(user);
  if (!classId) throw new Error("ID da turma obrigatório.");

  const updatePayload = {
    updated_at: new Date().toISOString()
  };
  if (payload.name) updatePayload.name = String(payload.name).trim();
  if (payload.course) updatePayload.course = String(payload.course).trim();
  if (payload.semester) updatePayload.semester = String(payload.semester).trim();
  if (payload.status) updatePayload.status = payload.status;
  if (payload.notes !== undefined) updatePayload.notes = payload.notes;

  const { data, error } = await supabase
    .from("academic_classes")
    .update(updatePayload)
    .eq("id", classId)
    .eq("institution_id", institutionId)
    .select()
    .single();

  if (error) {
    console.error("[teacher-academic] Falha ao atualizar turma.", error);
    throw new Error(error.message || "Não foi possível atualizar a turma.");
  }
  return data;
}

export async function deleteTeacherClass(user, classId) {
  const { institutionId } = assertTeacherOperationalScope(user);
  if (!classId) throw new Error("ID da turma obrigatório.");

  // Remove enrolled students first
  await supabase
    .from("academic_class_students")
    .delete()
    .eq("class_id", classId)
    .eq("institution_id", institutionId);

  const { error } = await supabase
    .from("academic_classes")
    .delete()
    .eq("id", classId)
    .eq("institution_id", institutionId);

  if (error) {
    console.error("[teacher-academic] Falha ao excluir turma.", error);
    throw new Error(error.message || "Não foi possível excluir a turma.");
  }
  return true;
}

export async function enrollStudentInClass(user, { classId, studentId }) {
  const { institutionId } = assertTeacherOperationalScope(user);
  if (!classId || !studentId) {
    throw new Error("classId e studentId são obrigatórios para matrícula.");
  }

  const { data, error } = await supabase
    .from("academic_class_students")
    .insert({
      institution_id: institutionId,
      class_id: classId,
      student_id: studentId
    })
    .select()
    .single();

  if (error) {
    console.error("[teacher-academic] Falha ao matricular aluno na turma.", error);
    throw new Error(error.message || "Não foi possível matricular o aluno.");
  }
  return data;
}

export async function removeStudentFromClass(user, { classId, studentId }) {
  const { institutionId } = assertTeacherOperationalScope(user);
  if (!classId || !studentId) {
    throw new Error("classId e studentId são obrigatórios.");
  }

  const { error } = await supabase
    .from("academic_class_students")
    .delete()
    .eq("class_id", classId)
    .eq("student_id", studentId)
    .eq("institution_id", institutionId);

  if (error) {
    console.error("[teacher-academic] Falha ao remover aluno da turma.", error);
    throw new Error(error.message || "Não foi possível remover o aluno da turma.");
  }
  return true;
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

export async function deleteTeacherStudyGuide(user, guideId) {
  const { institutionId, teacherId } = assertTeacherOperationalScope(user);
  if (!guideId) throw new Error("ID do guia obrigatório.");

  const { error } = await supabase
    .from("teacher_study_guides")
    .delete()
    .eq("id", guideId)
    .eq("institution_id", institutionId)
    .eq("teacher_id", teacherId);

  if (error) {
    console.error("[teacher-academic] Falha ao excluir guia de estudo.", error);
    throw new Error(error.message || "Não foi possível excluir o guia de estudo.");
  }
  return true;
}

export async function createTeacherAnatomicalNote(user, payload) {
  const { institutionId, teacherId } = assertTeacherOperationalScope(user);
  const structure = String(payload?.structure || payload?.title || "").trim();

  if (!structure) {
    throw new Error("Informe a estrutura anatômica observada.");
  }

  const insertPayload = {
    institution_id: institutionId,
    teacher_id: teacherId,
    model_id: payload?.modelId || null,
    structure,
    note_type: payload?.noteType || "observation",
    description: String(payload?.description || "").trim() || null,
    priority: payload?.priority || "medium",
    status: payload?.status || "open",
    visibility: payload?.visibility || "institution"
  };

  const { data, error } = await supabase
    .from("teacher_anatomical_notes")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("[teacher-academic] Falha ao registrar anotação anatômica.", error);
    throw new Error(error.message || "Não foi possível registrar a anotação.");
  }
  return data;
}

export async function updateTeacherProfile(user, payload) {
  const { teacherId } = assertTeacherOperationalScope(user);
  const department = String(payload?.department || "").trim();
  const specialization = String(payload?.specialization || "").trim();
  const academicTitle = String(payload?.academicTitle || "").trim();

  const { data, error } = await supabase
    .from("teacher_profiles")
    .upsert({
      user_id: teacherId,
      department: department || "Departamento de Morfologia e Anatomia Humana",
      specialization: specialization || "Anatomia Topográfica",
      academic_title: academicTitle || "Professor Adjunto"
    })
    .select()
    .single();

  if (error) {
    console.error("[teacher-academic] Falha ao atualizar perfil docente.", error);
    throw new Error(error.message || "Não foi possível atualizar o perfil.");
  }
  return data;
}

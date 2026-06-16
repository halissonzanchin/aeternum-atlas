import { getSupabaseClient, isSupabaseConfigured } from "../supabase/supabaseClient";

export async function fetchAcademicClasses(institutionId) {
  if (!institutionId || !isSupabaseConfigured()) return [];

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("academic_classes")
    .select("*, users:teacher_id(name), students:academic_class_students(count)")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("academicClassService.fetchAcademicClasses error:", error);
    return [];
  }

  return data.map(cls => ({
    ...cls,
    teacherName: cls.users?.name || "Professor não atribuído",
    studentCount: cls.students?.[0]?.count || 0
  }));
}

export async function createAcademicClass(institutionId, teacherId, payload) {
  if (!institutionId || !teacherId || !isSupabaseConfigured()) return null;

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("academic_classes")
    .insert([{
      institution_id: institutionId,
      teacher_id: teacherId,
      name: payload.name,
      course: payload.course || null,
      semester: payload.semester || null,
      status: payload.status || "active",
      notes: payload.notes || null
    }])
    .select()
    .single();

  if (error) {
    console.error("academicClassService.createAcademicClass error:", error);
    return null;
  }
  return data;
}

export async function enrollStudentInClass(institutionId, classId, studentId) {
  if (!institutionId || !classId || !studentId || !isSupabaseConfigured()) return false;

  const client = getSupabaseClient();
  const { error } = await client
    .from("academic_class_students")
    .insert([{
      institution_id: institutionId,
      class_id: classId,
      student_id: studentId
    }]);

  if (error) {
    console.error("academicClassService.enrollStudentInClass error:", error);
    return false;
  }
  return true;
}

export async function removeStudentFromClass(institutionId, classId, studentId) {
  if (!institutionId || !classId || !studentId || !isSupabaseConfigured()) return false;

  const client = getSupabaseClient();
  const { error } = await client
    .from("academic_class_students")
    .delete()
    .eq("class_id", classId)
    .eq("student_id", studentId)
    .eq("institution_id", institutionId);

  if (error) {
    console.error("academicClassService.removeStudentFromClass error:", error);
    return false;
  }
  return true;
}

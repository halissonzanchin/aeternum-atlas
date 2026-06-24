import { supabase } from "../../lib/supabase";
import { isSupabaseConfigured } from "../supabase/supabaseClient";
import { mockInstitutionRoi } from "../../demo/upe/dataset";

export async function fetchInstitutionRoi(institutionId) {
  if (import.meta.env.VITE_DEMO_MODE === 'upe' || institutionId === "upe-presidente-franco") {
    return mockInstitutionRoi;
  }

  if (!isSupabaseConfigured() || !institutionId) {
    return {
      totalViews: 0,
      totalQuizzes: 0,
      totalStudySeconds: 0,
      activeClasses: 0,
      activeStudents: 0,
      engagementLevel: "Sem dados",
      error: "Supabase não configurado",
      warning: null
    };
  }

  let warningMessage = null;

  try {
    // 1. Contar Turmas Ativas
    const { count: classesCount, error: classesError } = await supabase
      .from("academic_classes")
      .select("*", { count: 'exact', head: true })
      .eq("institution_id", institutionId)
      .eq("status", "active");

    // 2. Acessos aos modelos 3D
    const { data: accessLogs, error: accessError } = await supabase
      .from("model_access_logs")
      .select("session_duration_seconds, user_id")
      .eq("institution_id", institutionId);

    // 3. Simulados Anatômicos
    const { data: anatomicalAttempts, error: anatomicalError } = await supabase
      .from("anatomical_quiz_attempts")
      .select("duration_seconds, user_id")
      .eq("institution_id", institutionId)
      .eq("status", "completed");

    // 4. Simulados Teóricos (Fallback seguro)
    let theoreticalAttempts = [];
    const { data: theoAttempts, error: theoError } = await supabase
      .from("theoretical_quiz_attempts")
      .select("duration_seconds, user_id")
      .eq("institution_id", institutionId)
      .eq("status", "completed");

    if (theoError) {
      console.warn("[institutionRoiService] Falha ao buscar teóricos, ignorando.", theoError);
      warningMessage = "Tabelas de simulados teóricos ainda não migradas. Métricas parciais.";
    } else if (theoAttempts) {
      theoreticalAttempts = theoAttempts;
    }

    // Processamento
    const safeAccessLogs = accessLogs || [];
    const safeQuizzes = [...(anatomicalAttempts || []), ...theoreticalAttempts];

    const totalViews = safeAccessLogs.length;
    const totalQuizzes = safeQuizzes.length;
    
    let totalStudySeconds = 0;
    const uniqueUsers = new Set();

    safeAccessLogs.forEach(log => {
      totalStudySeconds += (log.session_duration_seconds || 0);
      if (log.user_id) uniqueUsers.add(log.user_id);
    });

    // Simulados anatômicos já estão no tempo de tela do Viewer.
    // Somamos apenas os teóricos (que podem ocorrer fora do Viewer) 
    // ou evitamos somar o tempo anatômico para evitar dupla contagem.
    if (anatomicalAttempts) {
      anatomicalAttempts.forEach(quiz => {
        if (quiz.user_id) uniqueUsers.add(quiz.user_id);
      });
    }

    if (theoreticalAttempts) {
      theoreticalAttempts.forEach(quiz => {
        totalStudySeconds += (quiz.duration_seconds || 0);
        if (quiz.user_id) uniqueUsers.add(quiz.user_id);
      });
    }

    const activeStudents = uniqueUsers.size;
    const activeClasses = classesCount || 0;

    // Calcular nível de engajamento
    let engagementLevel = "Baixo";
    if (totalViews > 1000 || totalQuizzes > 500) engagementLevel = "Moderado";
    if (totalViews > 5000 || totalQuizzes > 2000) engagementLevel = "Alto";
    if (totalViews > 10000 || totalQuizzes > 5000) engagementLevel = "Excelente";

    return {
      totalViews,
      totalQuizzes,
      totalStudySeconds,
      activeClasses,
      activeStudents,
      engagementLevel,
      error: null,
      warning: warningMessage
    };
  } catch (error) {
    console.error("[institutionRoiService] Erro crítico:", error);
    return {
      totalViews: 0,
      totalQuizzes: 0,
      totalStudySeconds: 0,
      activeClasses: 0,
      activeStudents: 0,
      engagementLevel: "Erro",
      error: error.message,
      warning: null
    };
  }
}

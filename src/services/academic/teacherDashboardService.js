import { supabase } from "../../lib/supabase";
import { isSupabaseConfigured } from "../supabase/supabaseClient";

export async function fetchTeacherDashboardAnalytics(institutionId, teacherId) {
  if (!isSupabaseConfigured() || !institutionId) {
    return {
      classAverage: 0,
      totalSimulations: 0,
      averageStudyTime: 0,
      studentsAtRisk: [],
      studentRanking: [],
      topModels: [],
      bottomModels: [],
      error: "Supabase não configurado"
    };
  }

  try {
    // 1. Encontrar as turmas deste professor
    let classIds = [];
    if (teacherId) {
      const { data: classes } = await supabase
        .from("academic_classes")
        .select("id")
        .eq("institution_id", institutionId)
        .eq("teacher_id", teacherId);
      if (classes) {
        classIds = classes.map(c => c.id);
      }
    }

    // 2. Buscar as tentativas anatômicas da instituição e filtrar por turma (se aplicável)
    let query = supabase
      .from("anatomical_quiz_attempts")
      .select(`
        id, 
        user_id, 
        class_id, 
        model_id, 
        score, 
        percentage, 
        duration_seconds,
        users ( id, name, email ),
        academic_classes ( id, name )
      `)
      .eq("institution_id", institutionId)
      .eq("status", "completed");

    if (classIds.length > 0) {
      query = query.in("class_id", classIds);
    }

    const { data: attempts, error: attemptsError } = await query;

    if (attemptsError || !attempts || attempts.length === 0) {
      return {
        classAverage: 0,
        totalSimulations: 0,
        averageStudyTime: 0,
        studentsAtRisk: [],
        studentRanking: [],
        topModels: [],
        bottomModels: [],
        error: attemptsError?.message || null
      };
    }

    // Calcular métricas
    let totalScore = 0;
    let totalDuration = 0;
    const studentStats = {};
    const modelStats = {};

    attempts.forEach(a => {
      totalScore += (a.percentage || 0);
      totalDuration += (a.duration_seconds || 0);

      const uid = a.user_id || "unknown";
      if (!studentStats[uid]) {
        studentStats[uid] = { 
          userId: uid, 
          name: a.users?.name || "Desconhecido",
          email: a.users?.email || "sem-email",
          className: a.academic_classes?.name || "Sem Turma",
          attempts: 0, 
          totalScore: 0, 
          totalDuration: 0 
        };
      }
      studentStats[uid].attempts += 1;
      studentStats[uid].totalScore += (a.percentage || 0);
      studentStats[uid].totalDuration += (a.duration_seconds || 0);

      const mid = a.model_id || "unknown";
      if (!modelStats[mid]) modelStats[mid] = { modelId: mid, attempts: 0, totalScore: 0 };
      modelStats[mid].attempts += 1;
      modelStats[mid].totalScore += (a.percentage || 0);
    });

    const classAverage = Math.round(totalScore / attempts.length);
    const averageStudyTime = Math.round(totalDuration / attempts.length);

    // Ranking de alunos
    const rankedStudents = Object.values(studentStats).map(s => ({
      ...s,
      averageScore: Math.round(s.totalScore / s.attempts)
    }));
    rankedStudents.sort((a, b) => b.averageScore - a.averageScore);
    const studentRanking = rankedStudents.slice(0, 10);

    // Alunos em risco (nota média < 50 ou menor que a média da turma - 20)
    const riskThreshold = Math.min(50, classAverage - 15);
    const studentsAtRisk = rankedStudents.filter(s => s.averageScore < riskThreshold).slice(0, 10);

    // Top models e bottom models
    const rankedModels = Object.values(modelStats).map(m => ({
      ...m,
      averageScore: Math.round(m.totalScore / m.attempts)
    }));
    const topModels = [...rankedModels].sort((a, b) => b.attempts - a.attempts).slice(0, 5);
    const bottomModels = [...rankedModels].sort((a, b) => a.averageScore - b.averageScore).slice(0, 5);

    return {
      classAverage,
      totalSimulations: attempts.length,
      averageStudyTime,
      studentsAtRisk,
      studentRanking,
      topModels,
      bottomModels,
      allStudents: rankedStudents,
      error: null
    };
  } catch (error) {
    console.warn("[teacherDashboardService] Falha:", error);
    return {
      classAverage: 0,
      totalSimulations: 0,
      averageStudyTime: 0,
      studentsAtRisk: [],
      studentRanking: [],
      topModels: [],
      bottomModels: [],
      allStudents: [],
      error: error.message
    };
  }
}

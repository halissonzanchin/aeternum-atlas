import { supabase } from "../../lib/supabase";
import { isSupabaseConfigured } from "../supabase/supabaseClient";

export async function fetchAcademicAnalytics(institutionId) {
  // Fallback seguro se não houver Supabase configurado
  if (!isSupabaseConfigured() || !institutionId) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      averageTimeSeconds: 0,
      topModels: [],
      difficultModels: [],
      kpiUsage: "Nenhum dado",
      error: "Supabase não configurado",
      warning: null
    };
  }

  let warningMessage = null;

  try {
    // Busca tentativas anatômicas
    const { data: anatomicalData, error: anatomicalError } = await supabase
      .from("anatomical_quiz_attempts")
      .select("id, model_id, score, percentage, duration_seconds")
      .eq("institution_id", institutionId)
      .eq("status", "completed");

    if (anatomicalError) {
      console.warn("[academicAnalyticsService] Erro ao buscar anatomical_quiz_attempts", anatomicalError);
    }

    // Tenta buscar teóricas (se a tabela ainda não existir, captura o erro e segue)
    let theoreticalData = [];
    const { data: theoData, error: theoError } = await supabase
      .from("theoretical_quiz_attempts")
      .select("id, model_id, score, percentage, duration_seconds")
      .eq("institution_id", institutionId)
      .eq("status", "completed");

    if (theoError) {
      console.warn("[academicAnalyticsService] Tabela theoretical_quiz_attempts não encontrada ou erro. Ignorando.", theoError);
      warningMessage = "Tabelas de simulados teóricos não migradas ou indisponíveis";
    } else if (theoData) {
      theoreticalData = theoData;
    }

    // Merge seguro
    const allAttempts = [...(anatomicalData || []), ...theoreticalData];

    if (!allAttempts.length) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        averageTimeSeconds: 0,
        topModels: [],
        difficultModels: [],
        kpiUsage: "Iniciante",
        error: null,
        warning: warningMessage
      };
    }

    // Agregação de dados
    let totalScore = 0;
    let totalDuration = 0;
    const modelStats = {};

    allAttempts.forEach(attempt => {
      totalScore += (attempt.percentage || 0);
      totalDuration += (attempt.duration_seconds || 0);

      const mId = attempt.model_id || "unknown";
      if (!modelStats[mId]) {
        modelStats[mId] = { id: mId, attempts: 0, totalScore: 0 };
      }
      modelStats[mId].attempts += 1;
      modelStats[mId].totalScore += (attempt.percentage || 0);
    });

    const averageScore = Math.round(totalScore / allAttempts.length);
    const averageTimeSeconds = Math.round(totalDuration / allAttempts.length);

    // Converte e ordena modelStats
    const modelsList = Object.values(modelStats).map(m => ({
      ...m,
      averageScore: Math.round(m.totalScore / m.attempts)
    }));

    const topModels = [...modelsList].sort((a, b) => b.attempts - a.attempts).slice(0, 5);
    const difficultModels = [...modelsList].sort((a, b) => a.averageScore - b.averageScore).slice(0, 5);

    let kpiUsage = "Baixo";
    if (allAttempts.length > 100) kpiUsage = "Médio";
    if (allAttempts.length > 1000) kpiUsage = "Alto";
    if (allAttempts.length > 10000) kpiUsage = "Avançado";

    return {
      totalAttempts: allAttempts.length,
      averageScore,
      averageTimeSeconds,
      topModels,
      difficultModels,
      kpiUsage,
      error: null,
      warning: warningMessage
    };

  } catch (error) {
    console.error("[academicAnalyticsService] Erro fatal no Analytics", error);
    return {
      totalAttempts: 0,
      averageScore: 0,
      averageTimeSeconds: 0,
      topModels: [],
      difficultModels: [],
      kpiUsage: "Erro",
      error: error.message,
      warning: null
    };
  }
}

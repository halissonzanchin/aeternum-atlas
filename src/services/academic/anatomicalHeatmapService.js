import { supabase } from "../../lib/supabase";
import { isSupabaseConfigured } from "../supabase/supabaseClient";
import { mockAnatomicalHeatmap } from "../../demo/upe/dataset";
import { isUpeDemoMode } from "../../demo/upe";

export async function fetchAnatomicalHeatmap(institutionId, user = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'upe' || institutionId === "upe-presidente-franco" || (user && isUpeDemoMode(user))) {
    return mockAnatomicalHeatmap;
  }

  if (!isSupabaseConfigured() || !institutionId) {
    return {
      totalAnswers: 0,
      totalErrors: 0,
      errorRate: 0,
      mostErroredStructures: [],
      mostDifficultModels: [],
      mostDifficultClasses: [],
      pedagogicalSuggestions: [],
      error: "Supabase não configurado"
    };
  }

  try {
    // 1. Obter todas as tentativas anatômicas da instituição
    const { data: attempts, error: attemptsError } = await supabase
      .from("anatomical_quiz_attempts")
      .select("id, class_id, model_id")
      .eq("institution_id", institutionId)
      .eq("status", "completed");

    if (attemptsError) {
      throw attemptsError;
    }

    if (!attempts || attempts.length === 0) {
      return {
        totalAnswers: 0,
        totalErrors: 0,
        errorRate: 0,
        mostErroredStructures: [],
        mostDifficultModels: [],
        mostDifficultClasses: [],
        pedagogicalSuggestions: [],
        error: null,
        warning: "Sem tentativas de simulados registradas."
      };
    }

    // Cria mapa de lookup rápido para não repetir loops complexos
    const attemptMap = new Map();
    attempts.forEach(a => attemptMap.set(a.id, a));

    // Array de IDs para query nas respostas. 
    // Em produção com +10k registros, isso exigiria uma RPC ou chunks.
    const attemptIds = Array.from(attemptMap.keys());
    
    // Fallback: se tivermos mais de 800 attempts, vamos pegar apenas as 800 mais recentes para evitar estourar o limite de URL/IN clause do PostgREST.
    // Futuramente, a Fase 3D.4 vai transferir isso para RPC no backend.
    const safeIds = attemptIds.slice(0, 800);
    
    let isTruncated = attemptIds.length > 800;

    const { data: answers, error: answersError } = await supabase
      .from("anatomical_quiz_answers")
      .select("attempt_id, marker_number, correct_answer, is_correct")
      .in("attempt_id", safeIds);

    if (answersError) {
      throw answersError;
    }

    if (!answers || answers.length === 0) {
       return {
        totalAnswers: 0,
        totalErrors: 0,
        errorRate: 0,
        mostErroredStructures: [],
        mostDifficultModels: [],
        mostDifficultClasses: [],
        pedagogicalSuggestions: [],
        error: null,
        warning: "Tentativas registradas, mas respostas ausentes."
      };
    }

    const totalAnswers = answers.length;
    let totalErrors = 0;

    // Agregadores
    const structureStats = {}; // por correct_answer + model_id
    const modelStats = {}; // por model_id
    const classStats = {}; // por class_id

    answers.forEach(ans => {
      const isError = ans.is_correct === false;
      if (isError) totalErrors++;

      const attempt = attemptMap.get(ans.attempt_id);
      if (!attempt) return;

      const modelId = attempt.model_id || "unknown";
      const classId = attempt.class_id || "unknown";
      
      const structureKey = `${modelId}::${ans.correct_answer || ans.marker_number || 'Desconhecida'}`;

      // Estatísticas da Estrutura
      if (!structureStats[structureKey]) {
        structureStats[structureKey] = { 
          modelId, 
          structureName: ans.correct_answer || `Marcador ${ans.marker_number}`, 
          total: 0, 
          errors: 0 
        };
      }
      structureStats[structureKey].total++;
      if (isError) structureStats[structureKey].errors++;

      // Estatísticas de Modelo
      if (!modelStats[modelId]) {
        modelStats[modelId] = { modelId, total: 0, errors: 0 };
      }
      modelStats[modelId].total++;
      if (isError) modelStats[modelId].errors++;

      // Estatísticas de Turma
      if (classId !== "unknown") {
        if (!classStats[classId]) {
          classStats[classId] = { classId, total: 0, errors: 0 };
        }
        classStats[classId].total++;
        if (isError) classStats[classId].errors++;
      }
    });

    const errorRate = totalAnswers > 0 ? Math.round((totalErrors / totalAnswers) * 100) : 0;

    // Converte e ordena (Top Erros)
    const sortedStructures = Object.values(structureStats)
      .map(s => ({ ...s, errorRate: Math.round((s.errors / s.total) * 100) }))
      .filter(s => s.total > 2) // Mínimo de amostragem
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 10);

    const sortedModels = Object.values(modelStats)
      .map(m => ({ ...m, errorRate: Math.round((m.errors / m.total) * 100) }))
      .filter(m => m.total > 5)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5);

    const sortedClasses = Object.values(classStats)
      .map(c => ({ ...c, errorRate: Math.round((c.errors / c.total) * 100) }))
      .filter(c => c.total > 5)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5);

    // Sugestões Pedagógicas
    const pedagogicalSuggestions = [];
    if (sortedStructures.length > 0) {
      pedagogicalSuggestions.push(`A estrutura "${sortedStructures[0].structureName}" é a mais errada (${sortedStructures[0].errorRate}% de falha). Recomendada aula de revisão emergencial.`);
    }
    if (errorRate > 40) {
      pedagogicalSuggestions.push(`A taxa de erro geral é muito alta (${errorRate}%). Avaliar calibragem de dificuldade dos testes.`);
    } else if (errorRate < 10 && totalAnswers > 50) {
       pedagogicalSuggestions.push(`Taxa de erro muito baixa (${errorRate}%). A turma pode estar achando os testes fáceis demais.`);
    }

    return {
      totalAnswers,
      totalErrors,
      errorRate,
      mostErroredStructures: sortedStructures,
      mostDifficultModels: sortedModels,
      mostDifficultClasses: sortedClasses,
      pedagogicalSuggestions,
      error: null,
      warning: isTruncated ? "Volume alto: Exibindo amostra das 800 tentativas mais recentes (recomenda-se migração para RPC na próxima fase)." : null
    };

  } catch (err) {
    console.error("[anatomicalHeatmapService] Erro fatal:", err);
    return {
      totalAnswers: 0,
      totalErrors: 0,
      errorRate: 0,
      mostErroredStructures: [],
      mostDifficultModels: [],
      mostDifficultClasses: [],
      pedagogicalSuggestions: [],
      error: err.message,
      warning: null
    };
  }
}

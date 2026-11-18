import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateQualifiedActiveTime,
  calculate3DExplorationMetrics,
  calculateFlashcardMetrics,
  calculateQuizMetrics,
  calculateAnatomicalMasteryBySystem,
  determineGlobalDataState,
  buildUnifiedStudySeries,
  ACADEMIC_DATA_STATES,
  RETENTION_STAGES
} from "../src/services/academicMetricsService.js";

test("1. Tempo ativo: deduplica sessões com intervalos sobrepostos (account e viewer simultâneos)", () => {
  const baseTime = new Date("2026-11-18T10:00:00Z");
  const sessions = [
    {
      id: "s-account-1",
      scope: "account",
      session_start: new Date("2026-11-18T10:00:00Z").toISOString(),
      active_seconds: 1800, // 10:00 às 10:30 (30 min)
      duration_seconds: 1800
    },
    {
      id: "s-viewer-1",
      scope: "viewer",
      session_start: new Date("2026-11-18T10:15:00Z").toISOString(),
      active_seconds: 1200, // 10:15 às 10:35 (20 min, sobreposto com os 15 min finais da conta)
      duration_seconds: 1200
    }
  ];

  const result = calculateQualifiedActiveTime(sessions, [], { now: baseTime });
  
  // Intervalo unificado: 10:00 às 10:35 = 35 minutos = 2100 segundos (NÃO 1800 + 1200 = 3000s!)
  assert.equal(result.totalActiveSeconds, 2100, "Intervalo sobreposto deve ser fundido e não somado em dobro");
  assert.equal(result.totalActiveMinutes, 35);
  assert.equal(result.intervalsCount, 1, "Deve resultar em 1 único intervalo contíguo");
});

test("2. Tempo ativo: sessões disjuntas somam normalmente", () => {
  const sessions = [
    {
      id: "s1",
      scope: "viewer",
      session_start: "2026-11-18T08:00:00Z",
      active_seconds: 600, // 10 min
      duration_seconds: 600
    },
    {
      id: "s2",
      scope: "account",
      session_start: "2026-11-18T09:00:00Z",
      active_seconds: 600, // 10 min
      duration_seconds: 600
    }
  ];

  const result = calculateQualifiedActiveTime(sessions);
  assert.equal(result.totalActiveSeconds, 1200);
  assert.equal(result.totalActiveMinutes, 20);
  assert.equal(result.intervalsCount, 2);
});

test("3. Tempo ativo: sessões abandonadas com 0s ativos não inflam o tempo", () => {
  const sessions = [
    {
      id: "s-abandoned",
      scope: "viewer",
      status: "abandoned",
      session_start: "2026-11-18T08:00:00Z",
      active_seconds: 0,
      duration_seconds: 7200 // 2 horas de relógio parado
    }
  ];

  const result = calculateQualifiedActiveTime(sessions);
  assert.equal(result.totalActiveSeconds, 0, "Sessão abandonada sem segundos ativos deve resultar em 0s");
  assert.equal(result.indisponivelSeconds, 7200);
});

test("4. Exploração 3D: calcula modelos distintos, revisitas e estruturas únicas examinadas", () => {
  const models = [
    { id: "coracao", slug: "coracao-humano", title: "Coração Humano", system: "Cardiovascular", markersCount: 10 },
    { id: "cerebro", slug: "cerebro-humano", title: "Cérebro Humano", system: "Nervoso", markersCount: 20 }
  ];

  const sessions = [
    { id: "s1", model_id: "coracao-humano", scope: "viewer", session_start: "2026-11-18T08:00:00Z" },
    { id: "s2", model_id: "coracao", scope: "viewer", session_start: "2026-11-18T09:00:00Z" } // revisita ao mesmo modelo
  ];

  const events = [
    { model_id: "coracao", event_type: "annotation_selected", event_data: { annotationIndex: 1 } },
    { model_id: "coracao-humano", event_type: "annotation_selected", event_data: { annotationIndex: 2 } },
    { model_id: "coracao-humano", event_type: "annotation_selected", event_data: { annotationIndex: 1 } } // duplicado
  ];

  const result = calculate3DExplorationMetrics(models, sessions, events);

  assert.equal(result.distinctModelsCount, 1, "Aliases 'coracao' e 'coracao-humano' devem resolver para 1 modelo");
  assert.equal(result.revisitedModelsCount, 1, "Segunda visita conta como revisita");
  assert.equal(result.totalStructuresExplored, 2, "Apenas índices distintos 1 e 2 devem ser computados");
});

test("5. Flashcards: calcula acurácia e classifica estágios longitudinais de retenção", () => {
  const events = [
    { event_type: "flashcard_reviewed", event_data: { cardId: "c1", rating: "good", topic: "Osteologia" } },
    { event_type: "flashcard_reviewed", event_data: { cardId: "c2", rating: "again", topic: "Osteologia" } }
  ];

  const reviews = [
    { card_id: "c1", repetitions: 7, interval_days: 14, is_correct: true, next_review_at: "2026-11-30T00:00:00Z" }
  ];

  const result = calculateFlashcardMetrics(reviews, events);

  assert.equal(result.totalCardsAnswered, 2);
  assert.equal(result.correctCount, 1);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.accuracyPercent, 50);
  assert.equal(result.stages.retencaoEstavelCount, 1, "Card com 7 repetições e 14 dias deve ser retenção estável");
});

test("6. Simulados: acurácia global ponderada evita distorção de média simples", () => {
  // Prova 1: 10 de 10 (100%)
  // Prova 2: 1 de 10 (10%)
  // Total: 11 acertos em 20 questões = 55%
  // Se fizesse média simples das porcentagens: (100 + 10) / 2 = 55%
  // Agora considere Prova 1: 1 de 1 (100%) e Prova 2: 1 de 9 (11,1%)
  // Total: 2 acertos em 10 questões = 20%!
  // Média simples seria (100% + 11,1%) / 2 = 55,5% (totalmente enganosa!)
  const attempts = [
    { quiz_id: "q1", total_questions: 1, score: 1, started_at: "2026-11-18T10:00:00Z" },
    { quiz_id: "q2", total_questions: 9, score: 1, started_at: "2026-11-18T11:00:00Z" }
  ];

  const result = calculateQuizMetrics(attempts, []);

  assert.equal(result.totalQuestionsSum, 10);
  assert.equal(result.totalHitsSum, 2);
  assert.equal(result.globalWeightedAccuracy, 20, "Acurácia global ponderada deve ser 20% e não a média ingênua de 55,5%");
});

test("7. Tríade por Sistema: previne divisão por zero em sistemas sem modelos", () => {
  const models = [
    { id: "m1", system: "Cardiovascular", markersCount: 10 },
    { id: "m2", system: "Sistema Vazio", markersCount: 0 }
  ];

  const result = calculateAnatomicalMasteryBySystem({
    models,
    explorationMetrics: { explorationByModel: [] },
    quizMetrics: { attempts: [] }
  });

  const emptySys = result.find(s => s.systemName === "Sistema Vazio");
  assert.ok(emptySys);
  assert.equal(emptySys.explorationCoveragePercent, 0, "0/0 deve resultar em 0% e não NaN");
  assert.equal(emptySys.dataState, ACADEMIC_DATA_STATES.SEM_HISTORICO);
});

test("8. Estados Globais de Dados: sem atividade retorna SEM_HISTORICO", () => {
  const state = determineGlobalDataState({
    totalActiveSeconds: 0,
    distinctModelsCount: 0,
    flashcardsAnswered: 0,
    quizAttempts: 0
  });
  assert.equal(state, ACADEMIC_DATA_STATES.SEM_HISTORICO);
});

test("9. Estados Globais de Dados: erro de rede retorna SINCRONIZACAO_INDISPONIVEL", () => {
  const state = determineGlobalDataState({
    totalActiveSeconds: 1200,
    distinctModelsCount: 2,
    syncError: "Network connection refused"
  });
  assert.equal(state, ACADEMIC_DATA_STATES.SINCRONIZACAO_INDISPONIVEL);
});

/**
 * AETERNUM ATLAS — ACADEMIC METRICS SERVICE (AETERNUM 26.1)
 * 
 * Motor Canônico de Telemetria e Métricas Acadêmicas Verificáveis.
 * Elimina metas arbitrárias, deduplica intervalos sobrepostos e garante
 * honestidade pedagógica na formação médica.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_QUALIFIED_SESSION_SECONDS = 4 * 3600; // 4 horas teto de saturação contínua
const STALE_HEARTBEAT_THRESHOLD_SECONDS = 180; // 3 minutos

export const ACADEMIC_DATA_STATES = Object.freeze({
  DADOS_DISPONIVEIS: "DADOS_DISPONIVEIS",
  SEM_HISTORICO: "SEM_HISTORICO",
  DADOS_PARCIAIS: "DADOS_PARCIAIS",
  SINCRONIZACAO_INDISPONIVEL: "SINCRONIZACAO_INDISPONIVEL"
});

export const RETENTION_STAGES = Object.freeze({
  AQUISICAO: "Aquisicao",       // 1-2 repetições
  CONSOLIDACAO: "Consolidacao", // 3-5 repetições, intervalo 3-6d
  ESTAVEL: "Estavel",           // >=6 repetições, intervalo >= 7d com acerto
  INSUFICIENTE: "Insuficiente"  // Sem histórico longitudinal
});

function safeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export function localDateKey(value) {
  const date = safeDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthKey(value) {
  const date = safeDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/**
 * 3.1 TEMPO ATIVO REAL
 * Deduplica intervalos sobrepostos de sessões 'account' e 'viewer'.
 */
export function calculateQualifiedActiveTime(sessions = [], events = [], options = {}) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const now = safeDate(options?.now) || new Date();
  const windowDays = Number(options?.windowDays) || null;
  const cutoff = windowDays ? new Date(now.getTime() - windowDays * DAY_MS) : null;

  const validSessions = safeSessions.filter(s => {
    if (!s) return false;
    const start = safeDate(s.session_start || s.startedAt || s.created_at);
    if (!start) return false;
    if (cutoff && start < cutoff) return false;
    return true;
  });

  // 1. Extrair intervalos temporais de cada sessão
  const rawIntervals = [];
  let comprovadoSeconds = 0;
  let estimadoSeconds = 0;
  let indisponivelSeconds = 0;
  let accountSessionsCount = 0;
  let viewerSessionsCount = 0;

  for (const s of validSessions) {
    const scope = String(s.scope || s.session_type || "viewer").toLowerCase();
    if (scope === "account") accountSessionsCount++;
    else viewerSessionsCount++;

    const start = safeDate(s.session_start || s.startedAt || s.created_at);
    if (!start) continue;

    const activeSec = Number(s.active_seconds ?? s.activeSeconds);
    const durationSec = Number(s.duration_seconds ?? s.durationSeconds);
    const status = String(s.status || "active").toLowerCase();

    // Se abandonada com 0s ativos, conta como indisponível
    if (status === "abandoned" && (!activeSec || activeSec <= 0)) {
      indisponivelSeconds += Math.max(0, durationSec || 0);
      continue;
    }

    let intervalDuration = 0;
    if (Number.isFinite(activeSec) && activeSec > 0) {
      intervalDuration = Math.min(activeSec, MAX_QUALIFIED_SESSION_SECONDS);
      comprovadoSeconds += intervalDuration;
    } else if (Number.isFinite(durationSec) && durationSec > 0 && durationSec <= 1800) {
      // Estimativa prudente: até 30 min se não houver active_seconds preenchido
      intervalDuration = durationSec;
      estimadoSeconds += intervalDuration;
    } else {
      indisponivelSeconds += Math.max(0, durationSec || 0);
      continue;
    }

    const end = new Date(start.getTime() + intervalDuration * 1000);
    rawIntervals.push({
      start: start.getTime(),
      end: end.getTime(),
      scope
    });
  }

  // 2. Deduplicação de intervalos sobrepostos (União de Intervalos)
  rawIntervals.sort((a, b) => a.start - b.start);

  const mergedIntervals = [];
  for (const current of rawIntervals) {
    if (!mergedIntervals.length) {
      mergedIntervals.push({ ...current });
      continue;
    }

    const last = mergedIntervals[mergedIntervals.length - 1];
    if (current.start <= last.end) {
      // Sobreposição encontrada! Estende o intervalo anterior sem somar em dobro
      last.end = Math.max(last.end, current.end);
    } else {
      mergedIntervals.push({ ...current });
    }
  }

  // 3. Tempo total deduplicado
  let totalDeduplicatedSeconds = 0;
  for (const interval of mergedIntervals) {
    totalDeduplicatedSeconds += Math.round((interval.end - interval.start) / 1000);
  }

  return {
    totalActiveSeconds: totalDeduplicatedSeconds,
    totalActiveMinutes: Math.round(totalDeduplicatedSeconds / 60),
    totalActiveHours: Number((totalDeduplicatedSeconds / 3600).toFixed(1)),
    comprovadoSeconds,
    estimadoSeconds,
    indisponivelSeconds,
    totalSessionsAnalyzed: validSessions.length,
    accountSessionsCount,
    viewerSessionsCount,
    intervalsCount: mergedIntervals.length
  };
}

/**
 * 3.2 EXPLORAÇÃO ANATÔMICA 3D
 * Modelos acessados, revisitados, estruturas inspecionadas e marcadores.
 */
export function calculate3DExplorationMetrics(models = [], sessions = [], events = [], userProgress = []) {
  const safeModels = Array.isArray(models) ? models : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const modelMap = new Map();
  safeModels.forEach(m => {
    if (!m) return;
    const id = String(m.id || m.slug);
    modelMap.set(id, m);
    if (m.slug) modelMap.set(String(m.slug), m);
    if (m.supabaseModelId) modelMap.set(String(m.supabaseModelId), m);
  });

  const accessedModelIds = new Set();
  const accessFrequency = new Map();
  const structuresExploredByModel = new Map();

  // 1. Analisar sessões viewer
  for (const s of safeSessions) {
    if (!s) continue;
    const rawId = s.model_id || s.modelId;
    if (!rawId) continue;
    const model = modelMap.get(String(rawId));
    const canonicalId = model ? String(model.slug || model.id) : String(rawId);

    accessedModelIds.add(canonicalId);
    accessFrequency.set(canonicalId, (accessFrequency.get(canonicalId) || 0) + 1);
  }

  // 2. Analisar eventos de seleção de marcadores anatômicos
  for (const e of safeEvents) {
    if (!e) continue;
    const eventType = e.event_type || e.eventType;
    if (!["annotation_selected", "annotation_focused"].includes(eventType)) continue;

    const rawId = e.model_id || e.modelId;
    if (!rawId) continue;
    const model = modelMap.get(String(rawId));
    const canonicalId = model ? String(model.slug || model.id) : String(rawId);

    const eventData = e.event_data || e.eventData || {};
    const markerIndex = eventData.annotationIndex ?? eventData.marker_number ?? eventData.index;
    if (markerIndex !== undefined && markerIndex !== null) {
      if (!structuresExploredByModel.has(canonicalId)) {
        structuresExploredByModel.set(canonicalId, new Set());
      }
      structuresExploredByModel.get(canonicalId).add(String(markerIndex));
    }
  }

  // 3. Consolidar métricas de exploração
  const distinctModelsCount = accessedModelIds.size;
  let totalRevisits = 0;
  for (const count of accessFrequency.values()) {
    if (count > 1) totalRevisits += (count - 1);
  }

  let totalStructuresExplored = 0;
  let totalValidatedMarkersInCatalog = 0;

  const explorationByModel = [];
  for (const model of safeModels) {
    if (!model || model.isActive === false) continue;
    const canonicalId = String(model.slug || model.id);
    const inspectedSet = structuresExploredByModel.get(canonicalId) || new Set();
    const inspectedCount = inspectedSet.size;
    const totalMarkers = Number(model.annotationsCount || model.markersCount || 10);

    totalStructuresExplored += inspectedCount;
    totalValidatedMarkersInCatalog += totalMarkers;

    const coverage = totalMarkers > 0 ? clamp(Math.round((inspectedCount / totalMarkers) * 100)) : 0;
    const accessCount = accessFrequency.get(canonicalId) || 0;

    explorationByModel.push({
      canonicalId,
      title: model.shortTitle || model.title || canonicalId,
      system: model.system || model.category || "Geral",
      inspectedStructures: inspectedCount,
      totalMarkers,
      coveragePercent: coverage,
      accessCount,
      isRevisited: accessCount > 1
    });
  }

  const overallCoverage = totalValidatedMarkersInCatalog > 0
    ? clamp(Math.round((totalStructuresExplored / totalValidatedMarkersInCatalog) * 100))
    : 0;

  return {
    distinctModelsCount,
    revisitedModelsCount: totalRevisits,
    totalStructuresExplored,
    totalValidatedMarkersInCatalog,
    overallCoveragePercent: overallCoverage,
    explorationByModel
  };
}

/**
 * 3.3 FLASHCARDS E RECUPERAÇÃO ATIVA
 * SM-2, cartões respondidos, acurácia e estágio longitudinal de retenção.
 */
export function calculateFlashcardMetrics(reviews = [], events = [], localDecks = []) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const reviewedCards = new Map();
  let correctCount = 0;
  let incorrectCount = 0;
  let pendingReviewsCount = 0;
  const now = new Date();

  // Processar eventos de telemetria
  for (const e of safeEvents) {
    if (!e) continue;
    const type = e.event_type || e.eventType;
    if (type !== "flashcard_reviewed") continue;
    const data = e.event_data || e.eventData || {};
    const cardId = data.cardId || e.id;
    const rating = String(data.rating || "").toLowerCase();
    const isCorrect = rating === "good" || rating === "easy" || rating === "correct";

    if (!reviewedCards.has(cardId)) {
      reviewedCards.set(cardId, {
        cardId,
        topic: data.topic || "Anatomia Geral",
        attempts: 0,
        corrects: 0,
        lastRating: rating,
        lastReviewedAt: safeDate(e.created_at) || now,
        intervalDays: 1,
        repetitions: 1
      });
    }

    const card = reviewedCards.get(cardId);
    card.attempts++;
    if (isCorrect) {
      card.corrects++;
      correctCount++;
    } else {
      incorrectCount++;
    }
  }

  // Processar registros estruturados de SM-2
  for (const r of safeReviews) {
    if (!r) continue;
    const cardId = r.card_id || r.cardId;
    if (!cardId) continue;
    const isCorrect = Boolean(r.is_correct ?? (r.rating === "good" || r.rating === "easy"));
    const nextReview = safeDate(r.next_review_at || r.nextReviewDate);
    if (nextReview && nextReview <= now) pendingReviewsCount++;

    const existing = reviewedCards.get(cardId) || {
      cardId,
      topic: r.topic || "Geral",
      attempts: 0,
      corrects: 0,
      repetitions: Number(r.repetitions) || 0,
      intervalDays: Number(r.interval_days || r.interval) || 1,
      lastReviewedAt: safeDate(r.reviewed_at || r.lastReviewed) || now
    };

    existing.repetitions = Math.max(existing.repetitions, Number(r.repetitions) || 0);
    existing.intervalDays = Math.max(existing.intervalDays, Number(r.interval_days || r.interval) || 1);
    reviewedCards.set(cardId, existing);
  }

  const totalAnswered = correctCount + incorrectCount;
  const accuracyPercent = totalAnswered > 0 ? clamp(Math.round((correctCount / totalAnswered) * 100)) : 0;

  // Classificação dos estágios longitudinais de retenção
  let aquisicaoCount = 0;
  let consolidacaoCount = 0;
  let retencaoEstavelCount = 0;

  for (const card of reviewedCards.values()) {
    if (card.repetitions >= 6 && card.intervalDays >= 7) {
      retencaoEstavelCount++;
    } else if (card.repetitions >= 3 || card.intervalDays >= 3) {
      consolidacaoCount++;
    } else {
      aquisicaoCount++;
    }
  }

  // Determinar status global de retenção com honestidade científica
  let overallRetentionStage = RETENTION_STAGES.INSUFICIENTE;
  if (retencaoEstavelCount >= 10) {
    overallRetentionStage = RETENTION_STAGES.ESTAVEL;
  } else if (consolidacaoCount >= 5) {
    overallRetentionStage = RETENTION_STAGES.CONSOLIDACAO;
  } else if (reviewedCards.size > 0) {
    overallRetentionStage = RETENTION_STAGES.AQUISICAO;
  }

  return {
    totalCardsAnswered: totalAnswered,
    correctCount,
    incorrectCount,
    accuracyPercent,
    uniqueCardsReviewed: reviewedCards.size,
    pendingReviewsCount,
    stages: {
      aquisicaoCount,
      consolidacaoCount,
      retencaoEstavelCount
    },
    overallRetentionStage
  };
}

/**
 * 3.4 SIMULADOS ANATÔMICOS
 * Acurácia global ponderada, tentativas deduplicadas e temas.
 */
export function calculateQuizMetrics(attempts = [], results = []) {
  const safeAttempts = Array.isArray(attempts) ? attempts : [];
  const safeResults = Array.isArray(results) ? results : [];
  const seenAttemptKeys = new Set();
  const validAttempts = [];

  // Deduplicar tentativas entre anatomical_quiz_attempts e viewer_quiz_results
  for (const a of safeAttempts) {
    if (!a) continue;
    const key = `${a.quiz_id || a.quizId}:${a.started_at || a.startedAt || a.created_at}`;
    if (seenAttemptKeys.has(key)) continue;
    seenAttemptKeys.add(key);

    const questions = Number(a.total_questions || a.totalQuestions) || 0;
    const hits = Number(a.score ?? a.correct_answers ?? a.correctAnswers) || 0;
    if (questions <= 0) continue;

    validAttempts.push({
      id: a.id,
      modelId: a.model_id || a.modelId,
      questions,
      hits: Math.min(questions, hits),
      percentage: Number(a.percentage) || Math.round((hits / questions) * 100),
      durationSeconds: Number(a.duration_seconds || a.durationSeconds) || 0,
      createdAt: safeDate(a.finished_at || a.created_at || a.started_at)
    });
  }

  for (const r of results) {
    const key = `${r.quiz_id || r.quizId || "viewer-quiz"}:${r.started_at || r.startedAt || r.created_at}`;
    if (seenAttemptKeys.has(key)) continue;
    seenAttemptKeys.add(key);

    const questions = Number(r.total_questions || r.totalQuestions) || 0;
    const hits = Number(r.score ?? r.correct_answers ?? r.correctAnswers) || 0;
    if (questions <= 0) continue;

    validAttempts.push({
      id: r.id,
      modelId: r.model_id || r.modelId,
      questions,
      hits: Math.min(questions, hits),
      percentage: Number(r.percentage) || Math.round((hits / questions) * 100),
      durationSeconds: Number(r.duration_seconds || r.durationSeconds) || 0,
      createdAt: safeDate(r.finished_at || r.created_at || r.started_at)
    });
  }

  const totalAttempts = validAttempts.length;
  let totalQuestionsSum = 0;
  let totalHitsSum = 0;

  for (const item of validAttempts) {
    totalQuestionsSum += item.questions;
    totalHitsSum += item.hits;
  }

  // Acurácia Ponderada Global: Soma(Acertos) / Soma(Questões Válidas)
  const globalWeightedAccuracy = totalQuestionsSum > 0
    ? clamp(Math.round((totalHitsSum / totalQuestionsSum) * 100))
    : null;

  return {
    totalAttempts,
    totalQuestionsSum,
    totalHitsSum,
    totalErrorsSum: totalQuestionsSum - totalHitsSum,
    globalWeightedAccuracy,
    attempts: validAttempts
  };
}

/**
 * 3.5 TRÍADE DE MAESTRIA POR SISTEMA ANATÔMICO
 * Não mistura cliques com acertos. Apresenta tríade honesta: Exploração 3D, SRS e Simulados.
 */
export function calculateAnatomicalMasteryBySystem({
  models = [],
  explorationMetrics,
  flashcardMetrics,
  quizMetrics
}) {
  const systemsMap = new Map();

  function getSystemEntry(name) {
    const normalized = String(name || "Sistema Geral").trim();
    if (!systemsMap.has(normalized)) {
      systemsMap.set(normalized, {
        systemName: normalized,
        modelsCount: 0,
        structuresInspected: 0,
        structuresTotal: 0,
        flashcardsAnswered: 0,
        flashcardsAccuracy: null,
        quizAttempts: 0,
        quizQuestions: 0,
        quizHits: 0,
        quizAccuracy: null,
        explorationCoveragePercent: 0,
        dataState: ACADEMIC_DATA_STATES.SEM_HISTORICO
      });
    }
    return systemsMap.get(normalized);
  }

  // Preencher modelos e estruturas
  for (const m of models) {
    if (m.isActive === false) continue;
    const sys = getSystemEntry(m.system || m.category || "Sistema Geral");
    sys.modelsCount++;
    sys.structuresTotal += Number(m.annotationsCount || m.markersCount || 0);
  }

  // Preencher exploração 3D
  if (explorationMetrics?.explorationByModel) {
    for (const exp of explorationMetrics.explorationByModel) {
      const sys = getSystemEntry(exp.system);
      sys.structuresInspected += exp.inspectedStructures;
    }
  }

  // Preencher simulados por modelo associado
  if (quizMetrics?.attempts) {
    for (const att of quizMetrics.attempts) {
      const model = models.find(m => String(m.id) === String(att.modelId) || String(m.slug) === String(att.modelId));
      const sys = getSystemEntry(model?.system || model?.category || "Sistema Geral");
      sys.quizAttempts++;
      sys.quizQuestions += att.questions;
      sys.quizHits += att.hits;
    }
  }

  // Consolidar indicadores da Tríade por sistema
  const result = [];
  for (const entry of systemsMap.values()) {
    if (entry.modelsCount === 0 && entry.quizAttempts === 0) continue;

    // Cobertura 3D
    entry.explorationCoveragePercent = entry.structuresTotal > 0
      ? clamp(Math.round((entry.structuresInspected / entry.structuresTotal) * 100))
      : 0;

    // Acurácia em Simulados
    entry.quizAccuracy = entry.quizQuestions > 0
      ? clamp(Math.round((entry.quizHits / entry.quizQuestions) * 100))
      : null;

    // Determinar Estado de Dados do Sistema
    const has3D = entry.structuresInspected > 0;
    const hasQuiz = entry.quizAttempts > 0;

    if (has3D && hasQuiz) {
      entry.dataState = ACADEMIC_DATA_STATES.DADOS_DISPONIVEIS;
    } else if (has3D || hasQuiz) {
      entry.dataState = ACADEMIC_DATA_STATES.DADOS_PARCIAIS;
    } else {
      entry.dataState = ACADEMIC_DATA_STATES.SEM_HISTORICO;
    }

    // Nível de Maturação Pedagógica (Honesto, sem notas misturadas)
    if (entry.dataState === ACADEMIC_DATA_STATES.DADOS_DISPONIVEIS && (entry.quizAccuracy || 0) >= 80 && entry.explorationCoveragePercent >= 75) {
      entry.masteryLevel = "Consolidado";
    } else if (entry.dataState === ACADEMIC_DATA_STATES.DADOS_PARCIAIS || entry.explorationCoveragePercent > 0) {
      entry.masteryLevel = "Em Formacao";
    } else {
      entry.masteryLevel = "Nao Iniciado";
    }

    result.push(entry);
  }

  return result.sort((a, b) => b.structuresInspected - a.structuresInspected || a.systemName.localeCompare(b.systemName));
}

/**
 * 3.6 DETERMINAÇÃO DO ESTADO GLOBAL DE DADOS (FASE 6)
 */
export function determineGlobalDataState({
  totalActiveSeconds = 0,
  distinctModelsCount = 0,
  flashcardsAnswered = 0,
  quizAttempts = 0,
  syncError = null,
  isSynchronized = true
}) {
  if (syncError) {
    return ACADEMIC_DATA_STATES.SINCRONIZACAO_INDISPONIVEL;
  }

  const hasActivity = totalActiveSeconds > 0 || distinctModelsCount > 0 || flashcardsAnswered > 0 || quizAttempts > 0;
  if (!hasActivity) {
    return ACADEMIC_DATA_STATES.SEM_HISTORICO;
  }

  const hasTime = totalActiveSeconds >= 300; // >= 5 minutos
  const hasExploration = distinctModelsCount >= 1;
  const hasAssessment = flashcardsAnswered > 0 || quizAttempts > 0;

  if (hasTime && hasExploration && hasAssessment) {
    return ACADEMIC_DATA_STATES.DADOS_DISPONIVEIS;
  }

  return ACADEMIC_DATA_STATES.DADOS_PARCIAIS;
}

/**
 * SÉRIE TEMPORAL MULTIMODAL UNIFICADA
 * Inclui sessões de estudo 3D, flashcards, tutor e simulados.
 */
export function buildUnifiedStudySeries(sessions = [], period = "week", options = {}) {
  const now = safeDate(options.now) || new Date();
  const language = options.language || "pt";

  // Agrupar sessões por data
  if (period === "year") {
    const buckets = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: monthKey(date),
        label: new Intl.DateTimeFormat(language === "en" ? "en-US" : "pt-BR", { month: "short" }).format(date).replace(".", ""),
        seconds3D: 0,
        secondsFlashcards: 0,
        secondsTutor: 0,
        totalSeconds: 0
      };
    });

    const byKey = new Map(buckets.map(b => [b.key, b]));
    for (const s of sessions) {
      const start = safeDate(s.session_start || s.startedAt || s.created_at);
      if (!start) continue;
      const b = byKey.get(monthKey(start));
      if (!b) continue;

      const sec = Math.min(Number(s.active_seconds || s.activeSeconds || s.duration_seconds || s.durationSeconds || 0), MAX_QUALIFIED_SESSION_SECONDS);
      const scope = String(s.scope || "viewer").toLowerCase();
      if (scope === "viewer") b.seconds3D += sec;
      else if (scope === "flashcards") b.secondsFlashcards += sec;
      else b.secondsTutor += sec;
      b.totalSeconds += sec;
    }

    return buckets.map(b => ({
      ...b,
      minutes: Math.round(b.totalSeconds / 60),
      hours: Number((b.totalSeconds / 3600).toFixed(1))
    }));
  }

  if (period === "month") {
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const start = new Date(now.getTime() - (29 - index * 5) * DAY_MS);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 4 * DAY_MS);
      end.setHours(23, 59, 59, 999);
      return {
        key: `${localDateKey(start)}:${localDateKey(end)}`,
        label: `${pad(start.getDate())}/${pad(start.getMonth() + 1)}`,
        start,
        end,
        totalSeconds: 0
      };
    });

    for (const s of sessions) {
      const start = safeDate(s.session_start || s.startedAt || s.created_at);
      if (!start) continue;
      const b = buckets.find(item => start >= item.start && start <= item.end);
      if (!b) continue;
      const sec = Math.min(Number(s.active_seconds || s.activeSeconds || s.duration_seconds || s.durationSeconds || 0), MAX_QUALIFIED_SESSION_SECONDS);
      b.totalSeconds += sec;
    }

    return buckets.map(b => ({
      key: b.key,
      label: b.label,
      totalSeconds: b.totalSeconds,
      minutes: Math.round(b.totalSeconds / 60),
      hours: Number((b.totalSeconds / 3600).toFixed(1))
    }));
  }

  // Padrão: 7 Dias
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      key: localDateKey(date),
      label: new Intl.DateTimeFormat(language === "en" ? "en-US" : "pt-BR", { weekday: "short" }).format(date).replace(".", ""),
      totalSeconds: 0
    };
  });

  const byKey = new Map(days.map(d => [d.key, d]));
  for (const s of sessions) {
    const start = safeDate(s.session_start || s.startedAt || s.created_at);
    if (!start) continue;
    const b = byKey.get(localDateKey(start));
    if (!b) continue;
    const sec = Math.min(Number(s.active_seconds || s.activeSeconds || s.duration_seconds || s.durationSeconds || 0), MAX_QUALIFIED_SESSION_SECONDS);
    b.totalSeconds += sec;
  }

  return days.map(d => ({
    ...d,
    minutes: Math.round(d.totalSeconds / 60),
    hours: Number((d.totalSeconds / 3600).toFixed(1))
  }));
}

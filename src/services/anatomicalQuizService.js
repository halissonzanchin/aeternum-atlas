import { supabase } from "../lib/supabase";
import { readStorage, storageKeys, writeStorage } from "./storage";
import { isSupabaseConfigured } from "./supabase/supabaseClient";

const DEFAULT_TIME_LIMIT_SECONDS = 300;
const MAX_QUIZ_QUESTIONS = 10;

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix = "quiz") {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
}

function userIdOf(user) {
  return user?.id || user?.email || "anonymous";
}

function institutionIdOf(user, model) {
  return user?.institutionId || user?.institution_id || model?.institutionId || model?.institution_id || null;
}

function modelTitle(model) {
  return model?.title || model?.shortTitle || "Modelo anatômico 3D";
}

export function normalizeQuizAnswer(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function markerLabel(number) {
  return String(number).padStart(2, "0");
}

function normalizeAcceptedAnswers(value, correctAnswer) {
  const source = Array.isArray(value) ? value : [];
  return Array.from(new Set([correctAnswer, ...source].filter(Boolean)));
}

function normalizeQuestion(row = {}, index = 0) {
  const markerNumber = Number(row.marker_number || row.markerNumber || index + 1);
  const correctAnswer = row.correct_answer || row.correctAnswer || row.title || row.name || "";

  return {
    id: row.id || createId("quiz-question"),
    markerNumber,
    markerLabel: markerLabel(markerNumber),
    correctAnswer,
    acceptedAnswers: normalizeAcceptedAnswers(row.accepted_answers || row.acceptedAnswers, correctAnswer),
    anatomicalDescription: row.anatomical_description || row.anatomicalDescription || row.description || "",
    orderIndex: Number.isFinite(Number(row.order_index ?? row.orderIndex)) ? Number(row.order_index ?? row.orderIndex) : index,
    annotationIndex: Number.isFinite(Number(row.annotation_index ?? row.annotationIndex))
      ? Number(row.annotation_index ?? row.annotationIndex)
      : index
  };
}

function buildQuestionsFromAnnotations(annotations = []) {
  return annotations
    .slice()
    .sort((a, b) => Number(a.index || 0) - Number(b.index || 0))
    .slice(0, MAX_QUIZ_QUESTIONS)
    .map((annotation, index) => normalizeQuestion({
      id: annotation.id || annotation.uid || `${annotation.name || "annotation"}-${index}`,
      marker_number: index + 1,
      correct_answer: annotation.name,
      accepted_answers: [annotation.name],
      anatomical_description: annotation.description || "",
      annotation_index: Number.isInteger(annotation.index) ? annotation.index : index,
      order_index: index
    }, index))
    .filter(question => question.correctAnswer);
}

function buildAnnotationQuiz({ model, user, annotations }) {
  const questions = buildQuestionsFromAnnotations(annotations);

  if (!questions.length) return null;

  return {
    id: createId("annotation-quiz"),
    source: "model_annotations",
    modelId: model?.id || "",
    institutionId: institutionIdOf(user, model),
    title: model?.anatomicalQuizTitle || `Simulado Anatômico - ${modelTitle(model)}`,
    description: model?.anatomicalQuizDescription || "Simulado gerado a partir das anotações anatômicas sincronizadas do modelo.",
    timeLimitSeconds: Number(model?.anatomicalQuizTimeLimitSeconds) || DEFAULT_TIME_LIMIT_SECONDS,
    active: true,
    questions
  };
}

function normalizeSupabaseQuiz(row = {}) {
  const questions = (row.anatomical_quiz_questions || [])
    .map(normalizeQuestion)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .slice(0, MAX_QUIZ_QUESTIONS);

  return {
    id: row.id,
    source: "supabase",
    modelId: row.model_id,
    institutionId: row.institution_id,
    title: row.title,
    description: row.description || "",
    timeLimitSeconds: Number(row.time_limit_seconds) || DEFAULT_TIME_LIMIT_SECONDS,
    active: row.active !== false,
    questions
  };
}

export async function getAnatomicalQuizForModel({ model, user, annotations = [] }) {
  const institutionId = institutionIdOf(user, model);

  if (isSupabaseConfigured() && model?.id && institutionId) {
    const { data, error } = await supabase
      .from("anatomical_quizzes")
      .select(`
        id,
        model_id,
        institution_id,
        title,
        description,
        time_limit_seconds,
        active,
        created_at,
        anatomical_quiz_questions (
          id,
          marker_number,
          correct_answer,
          accepted_answers,
          anatomical_description,
          order_index
        )
      `)
      .eq("model_id", model.id)
      .eq("institution_id", institutionId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const quiz = normalizeSupabaseQuiz(data);
      if (quiz.questions.length) return quiz;
    }

    if (error) {
      console.warn("[anatomical_quizzes] Tabela ou políticas ainda não disponíveis. Usando anotações reais do modelo.", error);
    }
  }

  return buildAnnotationQuiz({ model, user, annotations });
}

export function gradeAnatomicalQuiz({ quiz, answers = {}, startedAt, finishedAt = nowIso(), status = "completed" }) {
  const startedTime = startedAt ? new Date(startedAt).getTime() : Date.now();
  const finishedTime = new Date(finishedAt).getTime();
  const durationSeconds = Math.max(0, Math.round((finishedTime - startedTime) / 1000));
  const corrections = (quiz?.questions || []).map(question => {
    const rawAnswer = answers[question.id] ?? answers[question.markerNumber] ?? "";
    const normalizedAnswer = normalizeQuizAnswer(rawAnswer);
    const acceptedAnswers = normalizeAcceptedAnswers(question.acceptedAnswers, question.correctAnswer);
    const isCorrect = Boolean(normalizedAnswer) && acceptedAnswers.some(answer => normalizeQuizAnswer(answer) === normalizedAnswer);

    return {
      questionId: question.id,
      markerNumber: question.markerNumber,
      markerLabel: question.markerLabel,
      studentAnswer: String(rawAnswer || "").trim(),
      correctAnswer: question.correctAnswer,
      acceptedAnswers,
      anatomicalDescription: question.anatomicalDescription,
      isCorrect
    };
  });
  const score = corrections.filter(item => item.isCorrect).length;
  const totalQuestions = corrections.length;
  const percentage = totalQuestions ? Number(((score / totalQuestions) * 100).toFixed(2)) : 0;

  return {
    id: createId("quiz-result"),
    quizId: quiz?.id || "",
    source: quiz?.source || "local",
    startedAt: startedAt || nowIso(),
    finishedAt,
    durationSeconds,
    score,
    totalQuestions,
    percentage,
    status,
    corrections
  };
}

function readLocalAttempts() {
  const attempts = readStorage(storageKeys.anatomicalQuizAttempts, []);
  return Array.isArray(attempts) ? attempts : [];
}

function writeLocalAttempt({ quiz, model, user, result }) {
  const attempt = {
    id: result.id,
    quizId: quiz?.id || "",
    quizSource: quiz?.source || "local",
    modelId: model?.id || quiz?.modelId || "",
    modelTitle: modelTitle(model),
    institutionId: institutionIdOf(user, model),
    userId: userIdOf(user),
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    score: result.score,
    totalQuestions: result.totalQuestions,
    percentage: result.percentage,
    durationSeconds: result.durationSeconds,
    status: result.status,
    corrections: result.corrections
  };

  writeStorage(storageKeys.anatomicalQuizAttempts, [attempt, ...readLocalAttempts()].slice(0, 200));
  return attempt;
}

export async function recordAnatomicalQuizAttempt({ quiz, model, user, result }) {
  const localAttempt = writeLocalAttempt({ quiz, model, user, result });

  if (!isSupabaseConfigured() || quiz?.source !== "supabase") {
    return { data: localAttempt, error: null, persisted: "local" };
  }

  const institutionId = institutionIdOf(user, model);
  const userId = userIdOf(user);

  if (!quiz?.id || !model?.id || !institutionId || !userId || userId === "anonymous") {
    return { data: localAttempt, error: null, persisted: "local" };
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("anatomical_quiz_attempts")
    .insert({
      quiz_id: quiz.id,
      model_id: model.id,
      user_id: userId,
      institution_id: institutionId,
      started_at: result.startedAt,
      finished_at: result.finishedAt,
      score: result.score,
      total_questions: result.totalQuestions,
      percentage: result.percentage,
      duration_seconds: result.durationSeconds,
      status: result.status
    })
    .select("id")
    .single();

  if (attemptError || !attempt?.id) {
    console.warn("[anatomical_quiz_attempts] Registro remoto indisponível. Tentativa mantida localmente.", attemptError);
    return { data: localAttempt, error: attemptError, persisted: "local" };
  }

  const answersPayload = result.corrections.map(item => ({
    attempt_id: attempt.id,
    question_id: item.questionId,
    marker_number: item.markerNumber,
    student_answer: item.studentAnswer || null,
    correct_answer: item.correctAnswer,
    is_correct: item.isCorrect
  }));

  const { error: answersError } = await supabase
    .from("anatomical_quiz_answers")
    .insert(answersPayload);

  if (answersError) {
    console.warn("[anatomical_quiz_answers] Respostas remotas indisponíveis. Correção mantida localmente.", answersError);
  }

  return {
    data: { ...localAttempt, remoteAttemptId: attempt.id },
    error: answersError || null,
    persisted: answersError ? "local" : "supabase"
  };
}

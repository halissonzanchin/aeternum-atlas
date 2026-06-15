import { useState, useEffect, useCallback, useRef } from 'react';
import { trackEvent } from '../../../services/analytics/analyticsService';
import { getAnatomicalQuizForModel, gradeAnatomicalQuiz, recordAnatomicalQuizAttempt } from '../../../services/anatomicalQuizService';
import { listModelAnnotations } from '../../../services/modelAnnotationService';
import { useLanguage } from '../../../context/LanguageContext';

export function useViewerQuiz(model, user, annotationsState, setToast, setLeftOpen) {
  const { t } = useLanguage();
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizStartedAt, setQuizStartedAt] = useState(null);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(300);
  const [theoreticalQuizOpen, setTheoreticalQuizOpen] = useState(false);

  const quizAnswersRef = useRef({});
  const quizFinishLockRef = useRef(false);

  useEffect(() => {
    if (!model?.id) {
      setQuizOpen(false);
      setActiveQuiz(null);
      setQuizResult(null);
      setQuizStartedAt(null);
      setQuizAnswers({});
      setTheoreticalQuizOpen(false);
      quizAnswersRef.current = {};
    }
  }, [model?.id]);

  const handleFinishAnatomicalQuiz = useCallback(async (status = "completed") => {
    if (!activeQuiz?.questions?.length || quizResult || quizFinishLockRef.current) return;

    quizFinishLockRef.current = true;
    const finishedAt = new Date().toISOString();
    const result = gradeAnatomicalQuiz({
      quiz: activeQuiz,
      answers: quizAnswersRef.current,
      startedAt: quizStartedAt,
      finishedAt,
      status
    });

    setQuizResult(result);

    try {
      await recordAnatomicalQuizAttempt({ quiz: activeQuiz, model, user, result });
    } catch (error) {
      console.warn("[anatomical_quiz] Falha ao registrar tentativa remota/local.", error);
    }

    trackEvent({
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role,
      modelId: model?.id,
      eventType: "finish_anatomical_quiz",
      metadata: {
        quizId: activeQuiz.id,
        quizSource: activeQuiz.source,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        status
      }
    });

    setToast(t("viewer.anatomicalQuizCompleted", {
      score: result.score,
      total: result.totalQuestions,
      percentage: result.percentage
    }));
  }, [activeQuiz, model, quizResult, quizStartedAt, t, user, setToast]);

  useEffect(() => {
    if (!quizOpen || quizLoading || !activeQuiz?.questions?.length || quizResult || !quizStartedAt) return undefined;

    function tick() {
      const elapsedSeconds = Math.floor((Date.now() - new Date(quizStartedAt).getTime()) / 1000);
      const remaining = Math.max(0, (activeQuiz.timeLimitSeconds || 300) - elapsedSeconds);
      setQuizTimeRemaining(remaining);

      if (remaining <= 0) {
        handleFinishAnatomicalQuiz("time_expired");
      }
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [activeQuiz, handleFinishAnatomicalQuiz, quizLoading, quizOpen, quizResult, quizStartedAt]);

  async function handleOpenAnatomicalQuiz() {
    if (!model?.id) return;

    setQuizOpen(true);
    setQuizLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    quizAnswersRef.current = {};
    quizFinishLockRef.current = false;
    setLeftOpen(false);

    try {
      let annotations = annotationsState.sketchfabAnnotations;

      if (!annotations.length && annotationsState.isSketchfabModel) {
        annotations = await listModelAnnotations(model.id);
        if (annotations.length) {
          annotationsState.setSketchfabAnnotations(annotations);
          annotationsState.setActiveAnnotationIndex(current => Number.isInteger(current) ? current : 0);
        }
      }

      const nextQuiz = await getAnatomicalQuizForModel({ model, user, annotations });
      const startedAt = new Date().toISOString();

      setActiveQuiz(nextQuiz);
      setQuizStartedAt(startedAt);
      setQuizTimeRemaining(nextQuiz?.timeLimitSeconds || 300);

      if (!nextQuiz?.questions?.length) {
        setToast(t("viewer.anatomicalQuizUnavailable"));
        return;
      }

      trackEvent({
        userId: user?.id,
        institutionId: user?.institutionId,
        role: user?.role,
        modelId: model.id,
        eventType: "start_anatomical_quiz",
        metadata: {
          quizId: nextQuiz.id,
          quizSource: nextQuiz.source,
          totalQuestions: nextQuiz.questions.length,
          timeLimitSeconds: nextQuiz.timeLimitSeconds
        }
      });
    } catch (error) {
      console.error("[anatomical_quiz] Não foi possível iniciar o simulado.", error);
      setActiveQuiz(null);
      setToast(t("viewer.anatomicalQuizStartError"));
    } finally {
      setQuizLoading(false);
    }
  }

  function handleQuizAnswerChange(questionId, value) {
    const nextAnswers = {
      ...quizAnswersRef.current,
      [questionId]: value
    };

    quizAnswersRef.current = nextAnswers;
    setQuizAnswers(nextAnswers);
  }

  function handleQuizQuestionNavigate(question) {
    if (!question || quizResult) return;

    const rawIndex = Number.isFinite(Number(question.annotationIndex))
      ? Number(question.annotationIndex)
      : Number(question.markerNumber) - 1;
    const index = Math.trunc(rawIndex);

    if (!Number.isInteger(index) || index < 0) return;

    annotationsState.setActiveAnnotationIndex(index);
    annotationsState.setAnnotationNavigationRequest({
      index,
      silent: true,
      source: "anatomical_quiz",
      requestId: `${model?.id || "model"}-quiz-${index}-${Date.now()}`
    });
  }

  return {
    quizOpen,
    setQuizOpen,
    quizLoading,
    activeQuiz,
    quizAnswers,
    quizResult,
    quizTimeRemaining,
    theoreticalQuizOpen,
    setTheoreticalQuizOpen,
    handleOpenAnatomicalQuiz,
    handleFinishAnatomicalQuiz,
    handleQuizAnswerChange,
    handleQuizQuestionNavigate
  };
}

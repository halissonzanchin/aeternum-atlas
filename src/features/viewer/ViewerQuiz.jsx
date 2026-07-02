import { useViewer } from './ViewerContext';
import AnatomicalQuizModal from '../../components/AnatomicalQuiz/AnatomicalQuizModal';
import TheoreticalQuizModal from '../../components/TheoreticalQuiz/TheoreticalQuizModal';
import { trackEvent } from '../../services/analytics/analyticsService';

export default function ViewerQuiz() {
  const {
    model,
    user,
    setToast,
    quiz: {
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
    },
    annotations: {
      activeAnnotationIndex,
    }
  } = useViewer();

  return (
    <>
      {quizOpen && (
        <AnatomicalQuizModal
          open={quizOpen}
          model={model}
          quiz={activeQuiz}
          loading={quizLoading}
          answers={quizAnswers}
          result={quizResult}
          timeRemaining={quizTimeRemaining}
          activeAnnotationIndex={activeAnnotationIndex}
          onAnswerChange={handleQuizAnswerChange}
          onQuestionNavigate={handleQuizQuestionNavigate}
          onClose={() => setQuizOpen(false)}
          onFinish={handleFinishAnatomicalQuiz}
          onRestart={handleOpenAnatomicalQuiz}
        />
      )}

      {theoreticalQuizOpen && (
        <TheoreticalQuizModal
          open={theoreticalQuizOpen}
          model={model}
          user={user}
          onClose={() => setTheoreticalQuizOpen(false)}
          onQuestionNavigate={handleQuizQuestionNavigate}
          onCompleted={result => {
            trackEvent({
              userId: user?.id,
              institutionId: user?.institutionId,
              role: user?.role,
              modelId: model.id,
              eventType: "finish_theoretical_quiz",
              metadata: {
                score: result.score,
                objectiveTotal: result.objectiveTotal,
                percentage: result.percentage,
                status: result.status
              }
            });
            setToast(`Simulado teórico finalizado: ${result.score}/${result.objectiveTotal} (${result.percentage}%).`);
          }}
        />
      )}
    </>
  );
}

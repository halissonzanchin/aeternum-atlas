import LineIcon from "../icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

function formatQuizTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getTimerParts(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return {
    minutes: String(Math.floor(safeSeconds / 60)).padStart(2, "0"),
    seconds: String(safeSeconds % 60).padStart(2, "0")
  };
}

function resultTone(isCorrect) {
  return isCorrect ? "is-correct" : "is-incorrect";
}

export default function AnatomicalQuizModal({
  open,
  model,
  quiz,
  loading = false,
  answers = {},
  result = null,
  timeRemaining = 0,
  onAnswerChange,
  onQuestionNavigate,
  onClose,
  onFinish,
  onRestart
}) {
  const { t } = useLanguage();
  if (!open) return null;

  const questions = quiz?.questions || [];
  const hasQuestions = questions.length > 0;
  const timeLimit = quiz?.timeLimitSeconds || 300;
  const timeProgress = Math.max(0, Math.min(100, (timeRemaining / timeLimit) * 100));
  const timerAngle = Math.round((1 - (timeRemaining / timeLimit)) * 360);
  const timerClass = timeRemaining <= 60 && !result ? "is-urgent" : "";
  const timerParts = getTimerParts(timeRemaining);
  const answeredCount = questions.filter(question => String(answers[question.id] || "").trim()).length;
  const timeLimitMinutes = Math.max(1, Math.round(timeLimit / 60));

  return (
    <div className="viewer-quiz-backdrop" role="dialog" aria-modal="true" aria-labelledby="anatomical-quiz-title">
      <section className="viewer-quiz-panel">
        <div className="viewer-quiz-header">
          <div className="min-w-0">
            <p className="viewer-eyebrow">{t("viewer.anatomicalQuizEyebrow")}</p>
            <h2 id="anatomical-quiz-title">{t("viewer.anatomicalQuizTitle")}</h2>
            <p>{model?.title || quiz?.title}</p>
          </div>

          <div className="viewer-quiz-header-actions">
            <button type="button" className="viewer-icon-button" onClick={onClose} aria-label={t("viewer.closeAnatomicalQuiz")} data-tooltip={t("viewer.closeAnatomicalQuiz")}>
              <LineIcon name="close" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="viewer-quiz-empty">
            <LineIcon name="target" className="h-8 w-8" />
            <strong>{t("viewer.anatomicalQuizPreparing")}</strong>
          </div>
        ) : null}

        {!loading && !hasQuestions ? (
          <div className="viewer-quiz-empty">
            <LineIcon name="target" className="h-8 w-8" />
            <strong>{t("viewer.anatomicalQuizUnavailable")}</strong>
            <p>{t("viewer.anatomicalQuizUnavailableHint")}</p>
          </div>
        ) : null}

        {!loading && hasQuestions ? (
          <>
            <div className="viewer-quiz-dashboard">
              <div className={`viewer-quiz-timer-dial ${timerClass}`} style={{ "--timer-angle": `${timerAngle}deg` }}>
                <div className="viewer-quiz-timer-face" aria-label={t("viewer.anatomicalQuizTimerLabel", { time: formatQuizTime(timeRemaining) })}>
                  <LineIcon name="timer" className="h-5 w-5" />
                  <strong>{timerParts.minutes}</strong>
                  <span>{timerParts.seconds}</span>
                </div>
              </div>

              <div className="viewer-quiz-status-grid">
                <div>
                  <span>{t("viewer.anatomicalQuizQuestionCount")}</span>
                  <strong>{questions.length}</strong>
                </div>
                <div>
                  <span>{t("viewer.anatomicalQuizAnsweredCount")}</span>
                  <strong>{answeredCount}/{questions.length}</strong>
                </div>
                <div>
                  <span>{t("viewer.anatomicalQuizTimeLimit")}</span>
                  <strong>{timeLimitMinutes} min</strong>
                </div>
              </div>
            </div>

            <div className="viewer-quiz-timebar" aria-hidden="true">
              <span style={{ width: `${timeProgress}%` }} />
            </div>

            {result ? (
              <div className="viewer-quiz-result-summary">
                <div>
                  <span>{t("viewer.anatomicalQuizScore")}</span>
                  <strong>{result.score}/{result.totalQuestions}</strong>
                </div>
                <div>
                  <span>{t("viewer.anatomicalQuizPercentage")}</span>
                  <strong>{result.percentage}%</strong>
                </div>
                <div>
                  <span>{t("viewer.anatomicalQuizDuration")}</span>
                  <strong>{formatQuizTime(result.durationSeconds)}</strong>
                </div>
              </div>
            ) : null}

            <form
              className="viewer-quiz-form"
              onSubmit={event => {
                event.preventDefault();
                onFinish?.("completed");
              }}
            >
              <div className="viewer-quiz-question-list">
                {questions.map(question => {
                  const correction = result?.corrections?.find(item => item.questionId === question.id);
                  const answer = answers[question.id] || "";

                  return (
                    <div key={question.id} className={`viewer-quiz-question ${correction ? resultTone(correction.isCorrect) : ""}`}>
                      <button
                        type="button"
                        className="viewer-quiz-question-number"
                        onClick={() => onQuestionNavigate?.(question)}
                        aria-label={t("viewer.anatomicalQuizNavigateMarker", { marker: question.markerLabel })}
                        disabled={Boolean(result)}
                      >
                        {question.markerLabel}
                      </button>
                      <input
                        aria-label={t("viewer.anatomicalQuizAnswerLabel", { marker: question.markerLabel })}
                        value={answer}
                        onChange={event => onAnswerChange?.(question.id, event.target.value)}
                        onFocus={() => onQuestionNavigate?.(question)}
                        placeholder={t("viewer.anatomicalQuizAnswerPlaceholder")}
                        disabled={Boolean(result)}
                        autoComplete="off"
                      />
                      {correction ? (
                        <span className="viewer-quiz-correction">
                          {correction.isCorrect
                            ? t("viewer.anatomicalQuizCorrect", { answer: correction.correctAnswer })
                            : t("viewer.anatomicalQuizIncorrect", {
                                student: correction.studentAnswer || t("viewer.anatomicalQuizBlankAnswer"),
                                answer: correction.correctAnswer
                              })}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="viewer-quiz-actions">
                {result ? (
                  <button type="button" className="viewer-secondary-button" onClick={onRestart}>
                    <LineIcon name="target" className="h-4 w-4" />
                    {t("viewer.anatomicalQuizRetry")}
                  </button>
                ) : (
                  <button type="submit" className="viewer-primary-button">
                    <LineIcon name="clipboardCheck" className="h-4 w-4" />
                    {t("viewer.anatomicalQuizFinish")}
                  </button>
                )}
                <button type="button" className="viewer-secondary-button" onClick={onClose}>
                  {t("viewer.closeAnatomicalQuiz")}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </section>
    </div>
  );
}

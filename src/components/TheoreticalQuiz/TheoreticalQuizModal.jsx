import { useEffect, useMemo, useRef, useState } from "react";
import AeternumLogo from "../AeternumLogo";
import LineIcon from "../icons/LineIcon";
import {
  clearTheoreticalQuizProgress,
  createTheoreticalQuizState,
  getTheoreticalQuizForModel,
  gradeTheoreticalQuiz,
  isFillCorrect,
  loadTheoreticalQuizProgress,
  recordTheoreticalQuizAttempt,
  saveTheoreticalQuizProgress,
  sectionCompletion
} from "../../services/theoreticalQuizService";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatClock(seconds) {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${pad2(minutes)}:${pad2(remainingSeconds)}`;
}

function formatLongTime(seconds) {
  if (!Number.isFinite(seconds)) return "90 min";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds ? `${minutes} min ${remainingSeconds}s` : `${minutes} min`;
}

function answerLetter(index) {
  return String.fromCharCode(65 + index);
}

function getTotalCompletion(sections, answers, revealed) {
  return sections.reduce(
    (acc, section) => {
      const current = sectionCompletion(section, answers, revealed);
      return {
        completed: acc.completed + current.completed,
        total: acc.total + current.total
      };
    },
    { completed: 0, total: 0 }
  );
}

function normalizeStatusTone(isCorrect) {
  if (isCorrect === true) return "is-correct";
  if (isCorrect === false) return "is-incorrect";
  return "";
}

function TheoryTimer({ remaining, total }) {
  const progress = total ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const angle = Math.round(progress * 360);
  const handAngle = Math.round((1 - progress) * 360);
  const urgent = remaining <= 60;

  return (
    <div
      className={`theory-timer ${urgent ? "is-urgent" : ""}`}
      style={{
        "--theory-timer-angle": `${angle}deg`,
        "--theory-timer-hand": `${handAngle}deg`
      }}
      aria-label={`Tiempo restante ${formatClock(remaining)}`}
    >
      <div className="theory-timer-ticks" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, index) => (
          <span key={index} style={{ "--tick": index }} />
        ))}
      </div>
      <div className="theory-timer-scale" aria-hidden="true">
        <span>60</span>
        <span>15</span>
        <span>30</span>
        <span>45</span>
      </div>
      <span className="theory-timer-hand" aria-hidden="true" />
      <div className="theory-timer-face">
        <LineIcon name="timer" className="h-5 w-5" />
        <strong>{formatClock(remaining)}</strong>
        <small>{urgent ? "Ultimo minuto" : "tiempo restante"}</small>
      </div>
    </div>
  );
}

function ResultRadar({ data = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 280;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    const radius = 98;
    const points = data.length || 5;

    ctx.font = "11px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    [0.25, 0.5, 0.75, 1].forEach(scale => {
      ctx.beginPath();
      Array.from({ length: points }).forEach((_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / points;
        const x = center + Math.cos(angle) * radius * scale;
        const y = center + Math.sin(angle) * radius * scale;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.stroke();
    });

    data.forEach((item, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / points;
      const x = center + Math.cos(angle) * (radius + 30);
      const y = center + Math.sin(angle) * (radius + 30);
      ctx.fillStyle = "rgba(226, 232, 240, 0.82)";
      ctx.fillText(item.topic.replace("Anatomía ", "Anat. "), x, y);
    });

    ctx.beginPath();
    data.forEach((item, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / points;
      const valueRadius = radius * Math.max(0.08, (item.percentage || 0) / 100);
      const x = center + Math.cos(angle) * valueRadius;
      const y = center + Math.sin(angle) * valueRadius;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(47, 184, 181, 0.24)";
    ctx.fill();
    ctx.strokeStyle = "rgba(47, 184, 181, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data]);

  return <canvas className="theory-radar" ref={canvasRef} aria-label="Grafico radar de desempeno tematico" />;
}

function TheoryModelBadge({ type = "heart" }) {
  if (type === "brain") {
    return (
      <div className="theory-brain-badge" aria-hidden="true">
        <svg viewBox="0 0 180 140" className="theory-brain-svg">
          <path
            className="theory-brain-outline"
            d="M34 83 C18 52 38 20 73 18 C96 3 132 17 143 43 C165 51 165 88 140 99 C125 122 88 123 68 110 C51 113 38 102 34 83 Z"
          />
          <path
            className="theory-brain-callosum"
            d="M55 69 C72 43 111 42 132 63 C116 60 94 61 78 72 C69 78 61 78 55 69 Z"
          />
          <path
            className="theory-brain-ventricle"
            d="M78 76 C87 68 105 67 116 75 C106 77 94 83 88 93"
          />
          <path
            className="theory-brain-cerebellum"
            d="M112 92 C127 83 145 88 150 101 C142 117 117 117 104 106 C103 100 106 96 112 92 Z"
          />
          <path
            className="theory-brain-stem"
            d="M98 94 C95 107 99 122 111 134"
          />
          <path
            className="theory-brain-sulci"
            d="M49 51 C62 43 76 41 90 44 M42 70 C57 62 68 62 82 66 M96 35 C112 36 126 43 136 55 M119 82 C133 76 145 78 154 88"
          />
          <circle className="theory-brain-marker" cx="88" cy="73" r="4" />
          <circle className="theory-brain-marker" cx="126" cy="97" r="3" />
        </svg>
      </div>
    );
  }

  if (type === "pelvis") {
    return (
      <div className="theory-pelvis-badge" aria-hidden="true">
        <svg viewBox="0 0 180 140" className="theory-pelvis-svg">
          <path
            className="theory-pelvis-bone"
            d="M35 28 C20 54 22 97 53 116 C68 125 80 111 76 94 C70 70 71 54 89 43 C107 54 110 70 104 94 C100 111 112 125 127 116 C158 97 160 54 145 28 C130 47 113 55 89 55 C65 55 50 47 35 28 Z"
          />
          <path
            className="theory-uterus-main"
            d="M78 38 C73 50 75 62 88 68 C101 62 104 50 99 38 C94 31 83 31 78 38 Z"
          />
          <path className="theory-uterus-cavity" d="M88 69 C86 83 86 94 88 111" />
          <path className="theory-vagina-canal" d="M80 85 C82 103 84 119 88 132 C92 119 94 103 96 85" />
          <path className="theory-pelvis-axis" d="M28 98 C54 86 70 83 88 84 C106 83 126 87 152 98" />
          <circle className="theory-ovary-marker" cx="62" cy="60" r="5" />
          <circle className="theory-ovary-marker" cx="114" cy="60" r="5" />
        </svg>
      </div>
    );
  }

  return (
    <div className="theory-heart-badge" aria-hidden="true">
      <svg viewBox="0 0 160 180" className="theory-heart-svg">
        <path className="theory-heart-vessel theory-heart-vessel-blue" d="M58 40 C52 20 63 8 78 19 C90 29 82 52 70 68" />
        <path className="theory-heart-vessel theory-heart-vessel-blue" d="M94 41 C99 18 120 9 130 24 C139 38 124 55 105 67" />
        <path className="theory-heart-vessel theory-heart-vessel-red" d="M76 39 C83 11 106 8 113 30 C118 46 103 61 88 74" />
        <path className="theory-heart-vessel theory-heart-vessel-red" d="M111 58 C133 50 151 56 154 72 C139 72 125 76 113 86" />
        <path className="theory-heart-back" d="M38 58 C27 66 19 82 21 101 C24 126 42 151 72 166 C94 148 106 117 101 91 C97 71 80 56 59 58 Z" />
        <path className="theory-heart-main" d="M63 57 C75 45 95 44 111 56 C132 72 134 103 121 128 C108 154 82 171 70 174 C48 158 29 139 23 113 C16 80 34 56 63 57 Z" />
        <path className="theory-heart-highlight" d="M52 82 C41 98 45 126 65 145" />
        <path className="theory-heart-fold" d="M96 70 C83 85 78 113 82 149" />
      </svg>
    </div>
  );
}

export default function TheoreticalQuizModal({ open, model, user, onClose, onCompleted }) {
  const quiz = useMemo(() => getTheoreticalQuizForModel(model), [model]);
  const [state, setState] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState("multiple");
  const [timeRemaining, setTimeRemaining] = useState(quiz?.timeLimitSeconds || 3600);
  const [examMode, setExamMode] = useState(false);
  const backdropRef = useRef(null);

  const sections = Array.isArray(quiz?.sections) ? quiz.sections : [];
  const activeSection = sections.find(section => section.id === activeSectionId) || sections[0] || null;
  const answers = state?.answers || {};
  const revealed = state?.revealed || {};
  const completion = useMemo(() => getTotalCompletion(sections, answers, revealed), [answers, revealed, sections]);
  const completionPercentage = completion.total ? Math.round((completion.completed / completion.total) * 100) : 0;
  const result = state?.result;
  const isLocked = Boolean(result);
  const modelTitle = quiz?.modelTitle || model?.title || "Modelo Anatômico";
  const modalReady = Boolean(state);

  useEffect(() => {
    if (!open) return;

    const saved = loadTheoreticalQuizProgress(model, user, quiz);
    const nextState = saved || createTheoreticalQuizState(quiz);
    setState(nextState);
    setActiveSectionId("multiple");
    setTimeRemaining(quiz.timeLimitSeconds);
  }, [model, open, quiz, user]);

  useEffect(() => {
    if (!open || !state) return;
    saveTheoreticalQuizProgress(model, user, state);
  }, [model, open, state, user]);

  function finishQuiz(status = "completed") {
    if (!state || state.result) return;

    const nextResult = {
      ...gradeTheoreticalQuiz(quiz, state),
      status
    };
    const nextState = {
      ...state,
      finishedAt: nextResult.finishedAt,
      result: nextResult
    };

    setState(nextState);
    recordTheoreticalQuizAttempt({ quiz, model, user, state: nextState, result: nextResult })
      .catch(err => console.warn("[TheoreticalQuizModal] Falha ao registrar simulado:", err));
    onCompleted?.(nextResult);
  }

  useEffect(() => {
    if (!open || !state?.startedAt || state?.result) return undefined;

    function tick() {
      const elapsedSeconds = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000);
      const remaining = Math.max(0, quiz.timeLimitSeconds - elapsedSeconds);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        const nextResult = {
          ...gradeTheoreticalQuiz(quiz, state),
          status: "time_expired"
        };
        const nextState = {
          ...state,
          finishedAt: nextResult.finishedAt,
          result: nextResult
        };
        setState(nextState);
        recordTheoreticalQuizAttempt({ quiz, model, user, state: nextState, result: nextResult })
          .catch(err => console.warn("[TheoreticalQuizModal] Falha ao registrar simulado:", err));
        onCompleted?.(nextResult);
      }
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [model, onCompleted, open, quiz, state, user]);

  useEffect(() => {
    if (!open || !modalReady) return;
    backdropRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeSectionId, modalReady, open]);

  if (!open) return null;

  if (!state || !sections.length || !activeSection) {
    return (
      <div className="theory-quiz-backdrop" role="dialog" aria-modal="true">
        <section className="theory-quiz-shell">
          <div className="theory-quiz-commandbar">
            <div><p>Simulado Indisponível</p></div>
            <button type="button" className="viewer-icon-button" onClick={onClose}>
              <LineIcon name="close" />
            </button>
          </div>
          <main className="theory-quiz-content grid place-items-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-serif text-clinicalWhite mb-2">Simulado Teórico em Construção</h2>
              <p className="text-textMuted">O questionário para este modelo ainda não está disponível.</p>
              <button className="viewer-primary-button mt-6" onClick={onClose}>Voltar ao modelo</button>
            </div>
          </main>
        </section>
      </div>
    );
  }

  function updateAnswer(questionId, patch) {
    if (isLocked) return;
    setState(previous => ({
      ...previous,
      answers: {
        ...previous.answers,
        [questionId]: {
          ...(previous.answers[questionId] || {}),
          ...patch
        }
      }
    }));
  }

  function updateMatchingAnswer(exerciseId, pairId, optionId) {
    if (isLocked) return;
    setState(previous => ({
      ...previous,
      answers: {
        ...previous.answers,
        [exerciseId]: {
          ...(previous.answers[exerciseId] || {}),
          pairs: {
            ...(previous.answers[exerciseId]?.pairs || {}),
            [pairId]: optionId
          }
        }
      }
    }));
  }

  function toggleReveal(questionId) {
    setState(previous => ({
      ...previous,
      revealed: {
        ...previous.revealed,
        [questionId]: !previous.revealed[questionId]
      }
    }));
  }

  function restartQuiz() {
    clearTheoreticalQuizProgress(model, user);
    setState(createTheoreticalQuizState(quiz));
    setTimeRemaining(quiz.timeLimitSeconds);
    setActiveSectionId("multiple");
  }

  function renderMultipleChoice(section) {
    return (
      <div className="theory-question-stack">
        {section.questions.map((question, index) => {
          const selectedIndex = answers[question.id]?.selectedIndex;
          const showExplanation = revealed[question.id] || isLocked;
          const status = isLocked ? normalizeStatusTone(selectedIndex === question.correctIndex) : "";

          return (
            <article key={question.id} className={`theory-question-card ${status}`}>
              <div className="theory-question-heading">
                <span>{pad2(index + 1)}</span>
                <div>
                  <small>{question.topic}</small>
                  <h3>{question.question}</h3>
                </div>
              </div>

              <div className="theory-option-list">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedIndex === optionIndex;
                  const isCorrect = question.correctIndex === optionIndex;
                  const optionTone = showExplanation
                    ? isCorrect
                      ? "is-correct"
                      : isSelected
                        ? "is-incorrect"
                        : ""
                    : "";

                  return (
                    <button
                      key={option}
                      type="button"
                      className={`theory-option ${isSelected ? "is-selected" : ""} ${optionTone}`}
                      onClick={() => updateAnswer(question.id, { selectedIndex: optionIndex })}
                      disabled={isLocked}
                    >
                      <strong>{answerLetter(optionIndex)})</strong>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              <button type="button" className="theory-link-button" onClick={() => toggleReveal(question.id)}>
                {showExplanation ? "Ocultar explicación" : "Mostrar explicación"}
              </button>

              {showExplanation ? (
                <div className="theory-explanation">
                  <strong>Respuesta correcta: {answerLetter(question.correctIndex)}) {question.options[question.correctIndex]}</strong>
                  {question.explanations.map((explanation, explanationIndex) => (
                    <p key={explanation}>
                      <b>{answerLetter(explanationIndex)})</b> {explanation}
                    </p>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  function renderTrueFalse(section) {
    return (
      <div className="theory-question-stack">
        {section.questions.map((question, index) => {
          const selectedValue = answers[question.id]?.value;
          const showExplanation = revealed[question.id] || isLocked;
          const status = isLocked ? normalizeStatusTone(selectedValue === question.correctAnswer) : "";

          return (
            <article key={question.id} className={`theory-question-card ${status}`}>
              <div className="theory-question-heading">
                <span>{pad2(index + 1)}</span>
                <div>
                  <small>{question.topic}</small>
                  <h3>{question.statement}</h3>
                </div>
              </div>

              <div className="theory-binary-row">
                {[true, false].map(value => (
                  <button
                    key={String(value)}
                    type="button"
                    className={`theory-option ${selectedValue === value ? "is-selected" : ""} ${
                      showExplanation && value === question.correctAnswer ? "is-correct" : ""
                    } ${showExplanation && selectedValue === value && selectedValue !== question.correctAnswer ? "is-incorrect" : ""}`}
                    onClick={() => updateAnswer(question.id, { value })}
                    disabled={isLocked}
                  >
                    <LineIcon name={value ? "check" : "close"} className="h-4 w-4" />
                    <span>{value ? "Verdadero" : "Falso"}</span>
                  </button>
                ))}
              </div>

              <button type="button" className="theory-link-button" onClick={() => toggleReveal(question.id)}>
                {showExplanation ? "Ocultar explicación" : "Ver explicación"}
              </button>

              {showExplanation ? (
                <div className="theory-explanation">
                  <strong>Respuesta correcta: {question.correctAnswer ? "Verdadero" : "Falso"}</strong>
                  <p>{question.explanation}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  function renderMatching(section) {
    return (
      <div className="theory-question-stack">
        {section.questions.map((exercise, index) => {
          const showExplanation = revealed[exercise.id] || isLocked;
          const selectedPairs = answers[exercise.id]?.pairs || {};

          return (
            <article key={exercise.id} className="theory-question-card theory-matching-card">
              <div className="theory-question-heading">
                <span>{pad2(index + 1)}</span>
                <div>
                  <small>{exercise.topic}</small>
                  <h3>{exercise.title}</h3>
                </div>
              </div>

              <div className="theory-matching-grid">
                {exercise.pairs.map(pair => {
                  const selectedOption = selectedPairs[pair.id] || "";
                  const isCorrect = selectedOption === pair.correctOptionId;
                  const rowTone = showExplanation && selectedOption ? normalizeStatusTone(isCorrect) : "";
                  const correctOption = exercise.options.find(option => option.id === pair.correctOptionId);

                  return (
                    <label key={pair.id} className={`theory-match-row ${rowTone}`}>
                      <span>{pair.prompt}</span>
                      <select
                        value={selectedOption}
                        onChange={event => updateMatchingAnswer(exercise.id, pair.id, event.target.value)}
                        disabled={isLocked}
                      >
                        <option value="">Seleccionar relación</option>
                        {exercise.options.map(option => (
                          <option key={option.id} value={option.id}>{option.text}</option>
                        ))}
                      </select>
                      {showExplanation ? <small>Correcto: {correctOption?.text}</small> : null}
                    </label>
                  );
                })}
              </div>

              <button type="button" className="theory-link-button" onClick={() => toggleReveal(exercise.id)}>
                {showExplanation ? "Ocultar corrección" : "Ver corrección"}
              </button>

              {showExplanation ? (
                <div className="theory-explanation">
                  <p>{exercise.explanation}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  function renderShort(section) {
    return (
      <div className="theory-question-stack">
        {section.questions.map((question, index) => {
          const showAnswer = revealed[question.id];

          return (
            <article key={question.id} className="theory-question-card">
              <div className="theory-question-heading">
                <span>{pad2(index + 1)}</span>
                <div>
                  <small>{question.topic}</small>
                  <h3>{question.question}</h3>
                </div>
              </div>

              <textarea
                className="theory-textarea"
                value={answers[question.id]?.text || ""}
                onChange={event => updateAnswer(question.id, { text: event.target.value })}
                placeholder="Desarrolle su respuesta con lenguaje anatómico universitario..."
                disabled={isLocked}
              />

              <button type="button" className="theory-link-button" onClick={() => toggleReveal(question.id)}>
                {showAnswer ? "Ocultar respuesta modelo" : "Mostrar respuesta modelo"}
              </button>

              {showAnswer ? (
                <div className="theory-explanation">
                  <strong>Respuesta modelo</strong>
                  <p>{question.expectedAnswer}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  function renderFill(section) {
    return (
      <div className="theory-question-stack">
        {section.questions.map((question, index) => {
          const value = answers[question.id]?.value || "";
          const showAnswer = revealed[question.id] || isLocked;
          const isCorrect = value ? isFillCorrect(question, value) : null;
          const status = showAnswer && value ? normalizeStatusTone(isCorrect) : "";

          return (
            <article key={question.id} className={`theory-question-card ${status}`}>
              <div className="theory-question-heading">
                <span>{pad2(index + 1)}</span>
                <div>
                  <small>{question.topic}</small>
                  <h3>{question.prompt}</h3>
                </div>
              </div>

              <input
                className="theory-input"
                value={value}
                onChange={event => updateAnswer(question.id, { value: event.target.value })}
                placeholder="Palabra faltante"
                disabled={isLocked}
              />

              <button type="button" className="theory-link-button" onClick={() => toggleReveal(question.id)}>
                {showAnswer ? "Ocultar respuesta" : "Mostrar respuesta"}
              </button>

              {showAnswer ? (
                <div className="theory-explanation">
                  <strong>Respuesta: {question.answer}</strong>
                  {question.acceptedAnswers?.length ? <p>También válido: {question.acceptedAnswers.join(", ")}</p> : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  function renderActiveSection() {
    if (activeSection.id === "multiple") return renderMultipleChoice(activeSection);
    if (activeSection.id === "truefalse") return renderTrueFalse(activeSection);
    if (activeSection.id === "matching") return renderMatching(activeSection);
    if (activeSection.id === "short") return renderShort(activeSection);
    if (activeSection.id === "fill") return renderFill(activeSection);
    return null;
  }

  return (
    <div
      ref={backdropRef}
      className={`theory-quiz-backdrop ${examMode ? "is-exam-mode" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theory-quiz-title"
    >
      <section className="theory-quiz-shell">
        <div className="theory-quiz-commandbar">
          <div>
            <p>Modo universitario premium</p>
            <strong>Tiempo estimado: 90 minutos</strong>
          </div>
          <div className="theory-quiz-command-actions">
            <button
              type="button"
              className={`theory-mode-toggle ${examMode ? "is-active" : ""}`}
              onClick={() => setExamMode(value => !value)}
            >
              <LineIcon name="note" className="h-4 w-4" />
              <span>Modo examen</span>
            </button>
            <button type="button" className="viewer-icon-button" onClick={onClose} aria-label="Cerrar simulado teórico">
              <LineIcon name="close" />
            </button>
          </div>
        </div>

        <header className="theory-institution-header">
          <div className="theory-school-seal">
            <AeternumLogo variant="symbol" size="sm" theme="transparent" className="theory-school-logo" />
          </div>
          <div>
            <p className="theory-university">UNIVERSIDAD PRIVADA DEL ESTE</p>
            <p>FACULTAD DE CIENCIAS MÉDICAS - Prof. Dr. Manuel Riveros</p>
            <p>Sede Presidente Franco</p>
            <h1 id="theory-quiz-title">PRUEBA DE ANATOMÍA TOPOGRÁFICA Y DESCRIPTIVA</h1>
            <strong>{quiz.subtitle}</strong>
            <span>{quiz.course}</span>
          </div>
        </header>

        <div className="theory-exam-fields" aria-label="Campos institucionales de la prueba">
          {["Fecha", "Nombre", "Turno", "Matrícula"].map(label => (
            <label key={label}>
              <span>{label}</span>
              <i />
            </label>
          ))}
        </div>

        <div className="theory-quiz-body">
          <aside className="theory-quiz-sidebar">
            <TheoryTimer remaining={timeRemaining} total={quiz.timeLimitSeconds} />

            <div className="theory-quick-stats">
              <div>
                <span>Progreso general</span>
                <strong>{completionPercentage}%</strong>
              </div>
              <div>
                <span>Actividades</span>
                <strong>{completion.completed}/{completion.total}</strong>
              </div>
              <div>
                <span>Tiempo total</span>
                <strong>{formatLongTime(quiz.timeLimitSeconds)}</strong>
              </div>
            </div>

            <div className="theory-progressbar" aria-hidden="true">
              <span style={{ width: `${completionPercentage}%` }} />
            </div>

            <nav className="theory-section-nav" aria-label="Secciones del simulado teórico">
              {sections.map(section => {
                const current = sectionCompletion(section, answers, revealed);
                const sectionPercentage = current.total ? Math.round((current.completed / current.total) * 100) : 0;

                return (
                  <button
                    key={section.id}
                    type="button"
                    className={activeSection.id === section.id ? "is-active" : ""}
                    onClick={() => setActiveSectionId(section.id)}
                  >
                    <span>{section.title}</span>
                    <strong>{sectionPercentage}%</strong>
                  </button>
                );
              })}
            </nav>

            <div className="theory-sidebar-actions">
              {result ? (
                <button type="button" className="viewer-primary-button" onClick={restartQuiz}>
                  Refazer prova
                </button>
              ) : (
                <button type="button" className="viewer-primary-button" onClick={() => finishQuiz("completed")}>
                  Finalizar simulado
                </button>
              )}
            </div>
          </aside>

          <main className="theory-quiz-content">
            <div className="theory-model-banner">
              <div>
                <p>Avaliação vinculada ao modelo 3D</p>
                <h2>{modelTitle}</h2>
              </div>
              <TheoryModelBadge type={quiz.visualType} />
            </div>

            {result ? (
              <section className="theory-result-panel">
                <div>
                  <p>Resultado final</p>
                  <h2>{result.score}/{result.objectiveTotal} acertos</h2>
                  <strong>{result.percentage}% de aprovechamiento</strong>
                  <span>{quiz.resultMessage}</span>
                </div>
                <ResultRadar data={result.radar} />
                <div className="theory-section-performance">
                  {result.sectionPerformance.map(section => (
                    <article key={section.id}>
                      <span>{section.formative ? "formativo" : "objetivo"}</span>
                      <strong>{section.title}</strong>
                      <p>{section.score}/{section.total} - {section.percentage}%</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="theory-section-heading">
              <div>
                <p>{activeSection.title}</p>
                <h2>{activeSection.expectedCount} ejercicios</h2>
              </div>
              <span>{activeSection.id === "short" ? "Evaluación formativa con respuesta modelo" : "Corrección automática disponible"}</span>
            </section>

            {renderActiveSection()}

            <footer className="theory-exam-footer">
              <span>Plataforma académica desarrollada para simulación de evaluación universitaria</span>
              <strong>Aeternum Atlas</strong>
            </footer>
          </main>
        </div>
      </section>
    </div>
  );
}

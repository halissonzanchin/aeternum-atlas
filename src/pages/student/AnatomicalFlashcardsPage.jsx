import { useState, useMemo, useEffect, useCallback } from "react";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";
import { useAtlasAITutorSession } from "../../context/AtlasAITutorSessionContext";
import {
  A26Button,
  A26Card,
  A26Field,
  A26Metric,
  A26SegmentedControl,
  A26Surface,
  A26Toolbar
} from "../../components/aeternum-26";
import { generateAnatomicalFlashcards } from "../../services/ai/flashcardGenerationService";
import {
  recordCardReview,
  getSavedDecks,
  saveDeckToCollection,
  deleteDeckFromCollection,
  scheduleFlashcardStudyEvent
} from "../../services/ai/flashcardSpacedRepetitionService";
import { recordLearningEvent } from "../../services/learningTelemetryService";
import "../../styles/AnatomicalFlashcards.css";

const QUICK_TOPIC_CHIPS_BY_LANG = {
  pt: [
    "Clavícula e Ombro",
    "Úmero e Braço",
    "Vértebras Cervicais",
    "Fêmur e Osteologia",
    "Vascularização do Coração",
    "Pares Cranianos"
  ],
  es: [
    "Clavícula y Hombro",
    "Húmero y Brazo",
    "Vértebras Cervicales",
    "Fémur y Osteología",
    "Vascularización del Corazón",
    "Pares Craneales"
  ],
  en: [
    "Clavicle and Shoulder",
    "Humerus and Arm",
    "Cervical Vertebrae",
    "Femur and Osteology",
    "Heart Vascularization",
    "Cranial Nerves"
  ],
  de: [
    "Schlüsselbein und Schulter",
    "Oberarmknochen und Arm",
    "Halswirbel",
    "Femur und Osteologie",
    "Herzgefäßversorgung",
    "Hirnnerven"
  ]
};

const DEFAULT_TOPIC_BY_LANG = {
  pt: "Clavícula e Ombro",
  es: "Clavícula y Hombro",
  en: "Clavicle and Shoulder",
  de: "Schlüsselbein und Schulter"
};

export default function AnatomicalFlashcardsPage({ user }) {
  const { t, language } = useLanguage();
  const langKey = ["pt", "es", "en", "de"].includes(language) ? language : "pt";
  const { connectionMode, openTutor } = useAtlasAITutorSession();
  const userId = user?.id || "student-default";

  // Generator Config State (NotebookLM Pattern)
  const [topicInput, setTopicInput] = useState(() => DEFAULT_TOPIC_BY_LANG[langKey] || "Clavícula e Ombro");
  const [cardCount, setCardCount] = useState("many"); // few | standard | many
  const [difficulty, setDifficulty] = useState("Difícil");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationNotice, setGenerationNotice] = useState("");

  // Deck & Player State (Anki Pattern)
  const [activeDeck, setActiveDeck] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedbackState, setFeedbackState] = useState(null); // "correct" | "wrong" | null
  const [sessionResults, setSessionResults] = useState([]); // [{ card, result: "correct" | "wrong" }]
  const [isFinished, setIsFinished] = useState(false);

  // Saved Decks Collection State
  const [savedDecks, setSavedDecks] = useState([]);
  const [isDeckSaved, setIsDeckSaved] = useState(false);
  const [scheduledNotice, setScheduledNotice] = useState("");

  const quickTopicChips = QUICK_TOPIC_CHIPS_BY_LANG[langKey] || QUICK_TOPIC_CHIPS_BY_LANG.pt;
  const currentCard = activeDeck?.cards?.[currentIndex];

  // Update default topic when language switches if not actively studying a deck
  useEffect(() => {
    if (!activeDeck) {
      setTopicInput((prev) => {
        const allDefaults = Object.values(DEFAULT_TOPIC_BY_LANG);
        if (allDefaults.includes(prev)) {
          return DEFAULT_TOPIC_BY_LANG[langKey] || DEFAULT_TOPIC_BY_LANG.pt;
        }
        return prev;
      });
    }
  }, [langKey, activeDeck]);

  // Load saved decks on mount
  useEffect(() => {
    setSavedDecks(getSavedDecks(userId));
  }, [userId]);

  // Keyboard Hotkeys Listener (Anki Style: Space = Flip, 1 = Wrong, 2 = Correct, E = Explain)
  useEffect(() => {
    function handleKeyDown(e) {
      if (!activeDeck || isFinished) return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === "1" || e.code === "ArrowLeft") {
        e.preventDefault();
        handleRateCard("wrong");
      } else if (e.key === "2" || e.code === "ArrowRight") {
        e.preventDefault();
        handleRateCard("correct");
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        if (currentCard) handleExplainWithAI(currentCard);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDeck, currentIndex, isFinished, currentCard, feedbackState]);

  async function handleGenerateDeck(customTopic) {
    const selectedTopic = customTopic || topicInput;
    if (!String(selectedTopic || "").trim()) {
      const errorMsg = {
        pt: "Informe um tema anatômico antes de gerar o baralho.",
        es: "Ingresa un tema anatómico antes de generar la baraja.",
        en: "Please enter an anatomical topic before generating the deck.",
        de: "Bitte geben Sie ein anatomisches Thema ein, bevor Sie das Deck generieren."
      };
      setGenerationError(errorMsg[langKey] || errorMsg.pt);
      return;
    }
    setIsGenerating(true);
    setGenerationError("");
    setGenerationNotice("");
    setIsFinished(false);
    setSessionResults([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsDeckSaved(false);
    setScheduledNotice("");

    try {
      const generated = await generateAnatomicalFlashcards({
        topic: selectedTopic,
        difficulty,
        cardCount,
        language: langKey
      });
      setActiveDeck(generated);
      setGenerationNotice(generated.generationNotice || "");
    } catch (err) {
      console.error("Erro ao gerar flashcards:", err);
      setGenerationError(err?.message || "Não foi possível gerar o baralho agora.");
    } finally {
      setIsGenerating(false);
    }
  }

  const handleRateCard = useCallback((rating) => {
    if (!currentCard || feedbackState) return;

    // Trigger visual punch feedback
    setFeedbackState(rating);

    // Save SM-2 Spaced Repetition Progress
    recordCardReview({
      userId,
      cardId: currentCard.id,
      rating,
      topic: currentCard.topic,
      difficulty: currentCard.difficulty || activeDeck?.difficulty
    });

    // Record learning event telemetry
    recordLearningEvent({
      user,
      eventType: "flashcard_reviewed",
      eventData: {
        cardId: currentCard.id,
        topic: currentCard.topic,
        rating,
        difficulty: currentCard.difficulty || activeDeck?.difficulty,
        source: currentCard.sourceCitation
      }
    });

    const newResult = { card: currentCard, result: rating };
    const updatedResults = [...sessionResults, newResult];
    setSessionResults(updatedResults);

    // Animate to next card after 320ms feedback delay
    setTimeout(() => {
      setFeedbackState(null);
      setIsFlipped(false);

      if (currentIndex + 1 < activeDeck.cards.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
        // Telemetry on deck completion
        const correctCount = updatedResults.filter(r => r.result === "correct").length;
        const total = updatedResults.length;
        recordLearningEvent({
          user,
          eventType: "flashcard_deck_completed",
          eventData: {
            deckTitle: activeDeck.title,
            topic: activeDeck.topic,
            totalCards: total,
            correctCount,
            scorePercent: total ? Math.round((correctCount / total) * 100) : 0
          }
        });
      }
    }, 320);
  }, [currentCard, feedbackState, userId, activeDeck, user, sessionResults, currentIndex]);

  function handleSaveCurrentDeck() {
    if (!activeDeck) return;
    const updated = saveDeckToCollection(userId, activeDeck);
    setSavedDecks(updated);
    setIsDeckSaved(true);
    const saveNotice = {
      pt: `⭐ Baralho "${activeDeck.title}" salvo na sua coleção permanente!`,
      es: `⭐ ¡Baraja "${activeDeck.title}" guardada en tu colección permanente!`,
      en: `⭐ Deck "${activeDeck.title}" saved to your permanent collection!`,
      de: `⭐ Deck "${activeDeck.title}" in Ihrer dauerhaften Sammlung gespeichert!`
    };
    setScheduledNotice(saveNotice[langKey] || saveNotice.pt);
    setTimeout(() => setScheduledNotice(""), 3500);
  }

  function handleDeleteSavedDeck(deck) {
    if (!deck) return;
    const updated = deleteDeckFromCollection(userId, deck.id || deck.title);
    setSavedDecks(updated);
    const deleteNotice = {
      pt: `🗑️ Baralho "${deck.title}" removido da sua coleção!`,
      es: `🗑️ ¡Baraja "${deck.title}" eliminada de tu colección!`,
      en: `🗑️ Deck "${deck.title}" removed from your collection!`,
      de: `🗑️ Deck "${deck.title}" aus Ihrer Sammlung entfernt!`
    };
    setScheduledNotice(deleteNotice[langKey] || deleteNotice.pt);
    setTimeout(() => setScheduledNotice(""), 3500);
  }

  async function handleScheduleReview(intervalDays = 1) {
    const topic = activeDeck?.title || topicInput;
    const evt = await scheduleFlashcardStudyEvent(user, topic, intervalDays);
    if (evt) {
      const schNotice = {
        pt: `✅ Revisão agendada na sua Agenda de Estudos para ${evt.date} às ${evt.time || evt.startTime || "09:00"}!`,
        es: `✅ ¡Repaso programado en tu Agenda de Estudio para el ${evt.date} a las ${evt.time || evt.startTime || "09:00"}!`,
        en: `✅ Review scheduled in your Study Agenda for ${evt.date} at ${evt.time || evt.startTime || "09:00"}!`,
        de: `✅ Wiederholung in Ihrem Studienplan für ${evt.date} um ${evt.time || evt.startTime || "09:00"} geplant!`
      };
      setScheduledNotice(schNotice[langKey] || schNotice.pt);
      setTimeout(() => setScheduledNotice(""), 4500);
    }
  }

  function handleLoadSavedDeck(deck) {
    setActiveDeck(deck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setSessionResults([]);
    setIsDeckSaved(true);
  }

  function handleExplainWithAI(card) {
    if (!card) return;
    const promptMap = {
      pt: `Estou estudando o Flashcard de Anatomia sobre "${card.topic}". Pergunta: "${card.front}". Resposta: "${card.back}". Pode me explicar com detalhes anatômicos e clínicos como se eu estivesse em uma aula prática?`,
      es: `Estoy estudiando el Flashcard de Anatomía sobre "${card.topic}". Pregunta: "${card.front}". Respuesta: "${card.back}". ¿Podrías explicarme con detalles anatómicos y clínicos como si estuviéramos en una clase práctica?`,
      en: `I am studying the Anatomy Flashcard on "${card.topic}". Question: "${card.front}". Answer: "${card.back}". Could you explain this with anatomical and clinical details as if in a practical anatomy lab?`,
      de: `Ich lerne mit der Anatomie-Karteikarte über "${card.topic}". Frage: "${card.front}". Antwort: "${card.back}". Könnten Sie mir das mit anatomischen und klinischen Details wie in einem praktischen Präparierkurs erklären?`
    };
    const prompt = promptMap[langKey] || promptMap.pt;
    openTutor({
      prompt,
      context: {
        source: "flashcards",
        route: "/flashcards",
        topic: card.topic,
        difficulty: card.difficulty || activeDeck?.difficulty,
        cardId: card.id,
        learningObjective: card.learningObjective || null,
        language: langKey
      },
      contextLabel: `Flashcards · ${card.topic}`
    });
  }

  function handleRestartWrongOnly() {
    const wrongCards = sessionResults.filter(r => r.result === "wrong").map(r => r.card);
    if (!wrongCards.length) return;

    const suffixMap = {
      pt: "(Reforço)",
      es: "(Refuerzo)",
      en: "(Review)",
      de: "(Wiederholung)"
    };

    setActiveDeck({
      ...activeDeck,
      title: `${activeDeck.title} ${suffixMap[langKey] || suffixMap.pt}`,
      cards: wrongCards
    });
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setSessionResults([]);
  }

  const performanceStats = useMemo(() => {
    if (!sessionResults.length) return { rate: 0, correct: 0, wrong: 0 };
    const correct = sessionResults.filter(r => r.result === "correct").length;
    const wrong = sessionResults.length - correct;
    const rate = Math.round((correct / sessionResults.length) * 100);
    return { rate, correct, wrong };
  }, [sessionResults]);

  const masteredTopics = useMemo(() => {
    return Array.from(new Set(sessionResults.filter(r => r.result === "correct").map(r => r.card.topic)));
  }, [sessionResults]);

  const reviewTopics = useMemo(() => {
    return Array.from(new Set(sessionResults.filter(r => r.result === "wrong").map(r => r.card.topic)));
  }, [sessionResults]);

  return (
    <div className="a26-flashcards-container">
      {/* Hero Header - Liquid Glass Aeternum 26.1 */}
      <A26Surface material="regular" tone="teal" className="a26-flashcards-hero">
        <div>
          <span className="a26-kicker">{t("flashcards.kicker", { defaultValue: "Revisão Ativa & Repetição Espaçada SM-2" })}</span>
          <h1 className="text-2xl md:text-3xl font-bold text-agedGold tracking-tight mt-1">
            {t("flashcards.title", { defaultValue: "Flashcards Anatômicos Inteligentes" })}
          </h1>
          <p className="text-xs md:text-sm text-textMuted mt-1">
            {t("flashcards.subtitle", { defaultValue: "Combine um banco anatômico curado, repetição espaçada e o Tutor IA autenticado em baralhos sem perguntas duplicadas." })}
          </p>
        </div>

        {activeDeck && (
          <A26Button variant="liquid" onClick={() => setActiveDeck(null)} icon={<LineIcon name="reset" />}>
            {t("flashcards.newDeck", { defaultValue: "Novo Baralho" })}
          </A26Button>
        )}
      </A26Surface>

      {/* Mode 1: Generator Modal & Config (NotebookLM Pattern) */}
      {!activeDeck && (
        <A26Surface material="regular" className="a26-generator-surface p-6 space-y-6">
          <div className="a26-flashcard-trustline" aria-live="polite">
            <span className={`a26-flashcard-status-dot is-${connectionMode || "offline"}`} aria-hidden="true" />
            <strong>{t("flashcards.trustlineCurated", { defaultValue: "Banco curado disponível" })}</strong>
            <span>{connectionMode === "online" ? t("flashcards.trustlineOnline", { defaultValue: "Tutor IA online para temas personalizados" }) : t("flashcards.trustlineOffline", { defaultValue: "Tutor IA indisponível; temas curados continuam funcionando" })}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-2">
                {t("flashcards.cardCountLabel", { defaultValue: "Número de Cards" })}
              </label>
              <A26SegmentedControl
                options={[
                  { label: t("flashcards.fewCards", { defaultValue: "Até 5" }), value: "few" },
                  { label: t("flashcards.standardCards", { defaultValue: "Até 10" }), value: "standard" },
                  { label: t("flashcards.manyCards", { defaultValue: "Até 20" }), value: "many" }
                ]}
                value={cardCount}
                onChange={setCardCount}
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-2">
                {t("flashcards.difficultyLabel", { defaultValue: "Nível de Dificuldade" })}
              </label>
              <A26SegmentedControl
                options={[
                  { label: t("flashcards.easy", { defaultValue: "Fácil" }), value: "Fácil" },
                  { label: t("flashcards.medium", { defaultValue: "Médio (padrão)" }), value: "Médio" },
                  { label: t("flashcards.hard", { defaultValue: "Difícil" }), value: "Difícil" }
                ]}
                value={difficulty}
                onChange={setDifficulty}
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-2">
              {t("flashcards.topicPromptLabel", { defaultValue: "Qual deve ser o tema?" })}
            </label>
            <A26Field
              label={t("flashcards.topicFieldLabel", { defaultValue: "Tema anatômico" })}
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              placeholder={t("flashcards.topicPlaceholder", { defaultValue: "Digite o assunto (ex: Vértebras Cervicais, Fêmur, Artéria Coronária...)" })}
              error={generationError || undefined}
              className="w-full"
            />
          </div>

          <div className="a26-chips-wrapper flex flex-wrap gap-2">
            {quickTopicChips.map(chip => (
              <A26Button
                key={chip}
                type="button"
                variant="ghost"
                className="a26-quick-chip"
                onClick={() => {
                  setTopicInput(chip);
                  handleGenerateDeck(chip);
                }}
              >
                + {chip}
              </A26Button>
            ))}
          </div>

          {generationError ? <p className="a26-generation-message is-error" role="alert">{generationError}</p> : null}
          {generationNotice ? <p className="a26-generation-message" aria-live="polite">{generationNotice}</p> : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <A26Button
              variant="primary"
              onClick={() => handleGenerateDeck()}
              loading={isGenerating}
              icon={<LineIcon name="spark" />}
            >
              {isGenerating ? t("flashcards.generating", { defaultValue: "Gerando baralho anatômico..." }) : t("flashcards.generateButton", { defaultValue: "Gerar Baralho com IA" })}
            </A26Button>
          </div>

          {/* Saved Decks Section */}
          {savedDecks.length > 0 && (
            <div className="pt-6 border-t border-glassBorder/40">
              <span className="a26-kicker">{t("flashcards.savedDecksTitle", { defaultValue: "Minha Coleção de Baralhos Salvos" })}</span>
              <h3 className="text-base font-bold text-agedGold mb-3">{t("flashcards.savedDecksTitle", { defaultValue: "Meus Baralhos Salvos" })} ({savedDecks.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {savedDecks.map(deck => (
                  <A26Card
                    key={deck.id || deck.title}
                    material="clear"
                    interactive
                    className="a26-saved-deck"
                    onClick={() => handleLoadSavedDeck(deck)}
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-textMain line-clamp-1">{deck.title}</h4>
                      <span className="text-[11px] text-emerald-400">{deck.cards?.length} cards · {deck.difficulty}</span>
                    </div>
                    <button
                      type="button"
                      title={t("flashcards.deleteDeck", { defaultValue: "Excluir baralho da coleção" })}
                      className="p-1.5 text-textMuted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSavedDeck(deck);
                      }}
                    >
                      <LineIcon name="trash" />
                    </button>
                  </A26Card>
                ))}
              </div>
            </div>
          )}
        </A26Surface>
      )}

      {/* Mode 2: Interactive 3D Player (Anki Pattern with Image Occlusion & Hotkeys) */}
      {activeDeck && !isFinished && currentCard && (
        <div className="a26-flashcard-player-container">
          <A26Toolbar label={t("flashcards.title", { defaultValue: "Informações do baralho" })} className="a26-player-meta">
            <div>
              <h2 className="text-lg font-bold text-agedGold">{activeDeck.title}</h2>
              <span className="text-xs text-textMuted">{t("flashcards.sourcePrefix", { defaultValue: "Origem:" })} {currentCard.sourceCitation}</span>
            </div>
            <div className="flex items-center gap-3">
              {!isDeckSaved && (
                <A26Button variant="ghost" onClick={handleSaveCurrentDeck} icon={<LineIcon name="bookmark" />}>
                  ⭐ {t("actions.save", { defaultValue: "Salvar" })}
                </A26Button>
              )}
              <span className="a26-card-counter font-mono text-sm">
                {currentIndex + 1} / {activeDeck.cards.length}
              </span>
            </div>
          </A26Toolbar>

          {generationNotice ? <p className="a26-generation-message" aria-live="polite">{generationNotice}</p> : null}

          {/* 3D Stage Container with Standalone Feedback Overlay */}
          <div className="relative w-full">
            {feedbackState === "correct" && (
              <div className="a26-feedback-overlay is-correct pointer-events-none z-50">
                <span>{t("flashcards.correctButton", { defaultValue: "Entendido! ✓" })}</span>
              </div>
            )}
            {feedbackState === "wrong" && (
              <div className="a26-feedback-overlay is-wrong pointer-events-none z-50">
                <span>{t("flashcards.wrongButton", { defaultValue: "Preciso Revisar ✕" })}</span>
              </div>
            )}

            {/* 3D Flip Card Container */}
            <div
              className={`a26-flashcard-3d-wrapper ${isFlipped ? "is-flipped" : ""}`}
              onClick={() => setIsFlipped(!isFlipped)}
              onKeyDown={(event) => {
                if (["Enter", " "].includes(event.key)) {
                  event.preventDefault();
                  setIsFlipped(prev => !prev);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={isFlipped ? t("flashcards.hideAnswer", { defaultValue: "Mostrar pergunta" }) : t("flashcards.showAnswer", { defaultValue: "Mostrar resposta" })}
            >
              {/* Front Side - Minimal & Clean (NotebookLM Pattern) */}
              <A26Surface material="regular" tone="teal" className="a26-flashcard-face a26-flashcard-face--front">
                <div className="a26-flashcard-header">
                  <span className="a26-kicker">{t("flashcards.frontSide", { defaultValue: "Frente" })}</span>
                  <span className="a26-flashcard-citation">{currentCard.topic}</span>
                </div>

                <div className="a26-flashcard-body">
                  {currentCard.imageUrl && (
                    <img src={currentCard.imageUrl} alt={currentCard.topic} className="a26-flashcard-img" />
                  )}
                  <p className="a26-flashcard-text">{currentCard.front}</p>
                </div>

                <div className="a26-flashcard-footer">
                  <span className="a26-flashcard-hint">{t("flashcards.flipCardHint", { defaultValue: "Espaço ou Enter para virar · 1 (Erro) · 2 (Acerto) · E (Explicar)" })}</span>
                </div>
              </A26Surface>

              {/* Back Side - Direct Answer & Tutor AI Action */}
              <A26Surface material="regular" tone="gold" className="a26-flashcard-face a26-flashcard-face--back">
                <div className="a26-flashcard-header">
                  <span className="a26-kicker text-agedGold">{t("flashcards.backSide", { defaultValue: "Verso · Resposta" })}</span>
                  <span className="a26-flashcard-citation">{currentCard.sourceCitation}</span>
                </div>

                <div className="a26-flashcard-body">
                  <p className="a26-flashcard-text text-teal-300 font-bold text-xl">{currentCard.back}</p>
                  {currentCard.explanation ? <p className="a26-flashcard-explanation">{currentCard.explanation}</p> : null}
                </div>

                <div className="a26-flashcard-footer">
                  <span className="a26-flashcard-hint">{t("flashcards.flipCardHint", { defaultValue: "Avalie seu conhecimento abaixo" })}</span>
                  <A26Button
                    type="button"
                    variant="liquid"
                    size="sm"
                    className="a26-flashcard-tutor-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExplainWithAI(currentCard);
                    }}
                    icon={<LineIcon name="spark" />}
                  >
                    {t("flashcards.explainButton", { defaultValue: "✨ Explicar com Tutor IA" })}
                  </A26Button>
                </div>
              </A26Surface>
            </div>
          </div>

          {/* Anki Rating Controls */}
          <A26Toolbar label={t("flashcards.title", { defaultValue: "Avaliação do cartão" })} className="a26-anki-controls">
            <A26Button
              type="button"
              variant="ghost"
              aria-label={t("agenda.previous", { defaultValue: "Cartão anterior" })}
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              ‹
            </A26Button>

            <A26Button
              type="button"
              variant="danger"
              onClick={() => handleRateCard("wrong")}
              disabled={Boolean(feedbackState)}
            >
              ✕ {t("flashcards.wrongButton", { defaultValue: "Preciso Revisar (1)" })}
            </A26Button>

            <A26Button
              type="button"
              variant="liquid"
              onClick={() => handleRateCard("correct")}
              disabled={Boolean(feedbackState)}
            >
              ✓ {t("flashcards.correctButton", { defaultValue: "Acertei (2)" })}
            </A26Button>

            <A26Button
              type="button"
              variant="ghost"
              aria-label={t("agenda.next", { defaultValue: "Próximo cartão" })}
              onClick={() => setCurrentIndex(prev => Math.min(activeDeck.cards.length - 1, prev + 1))}
              disabled={currentIndex === activeDeck.cards.length - 1}
            >
              ›
            </A26Button>
          </A26Toolbar>
        </div>
      )}

      {/* Mode 3: Performance Results Report & Spaced Repetition Agenda Sync */}
      {isFinished && (
        <A26Card material="substantial" tone="teal" className="a26-performance-report-card">
          <span className="a26-kicker">{t("flashcards.kicker", { defaultValue: "Relatório de Desempenho e Repetição Espaçada SM-2" })}</span>
          <h2 className="text-2xl font-bold text-agedGold">{t("flashcards.congratulations", { defaultValue: "Parabéns! Revisão Concluída" })}</h2>
          <p className="text-sm text-textMuted max-w-xl mx-auto">
            {t("flashcards.reviewSummary", { defaultValue: "Os dados deste teste foram gravados na memória da sua conta e o intervalo de repetição espaçada foi atualizado." })}
          </p>

          <div className="a26-report-metrics-grid">
            <A26Metric label={t("flashcards.accuracyRate", { defaultValue: "Taxa de acerto" })} value={`${performanceStats.rate}%`} tone={performanceStats.rate >= 70 ? "teal" : "gold"} />
            <A26Metric label={t("flashcards.correctButton", { defaultValue: "Cartões acertados" })} value={performanceStats.correct} tone="teal" />
            <A26Metric label={t("flashcards.wrongButton", { defaultValue: "Cartões a reforçar" })} value={performanceStats.wrong} tone="gold" />
          </div>

          <div className="a26-topics-mastery-list">
            <div className="a26-topic-column is-strong">
              <h3>🟢 {t("flashcards.masteredTopics", { defaultValue: "Tópicos Dominados" })}</h3>
              {masteredTopics.length ? (
                <ul>
                  {masteredTopics.map(topic => <li key={topic}>{topic}</li>)}
                </ul>
              ) : (
                <p className="text-xs text-textMuted">—</p>
              )}
            </div>

            <div className="a26-topic-column is-weak">
              <h3>🔴 {t("flashcards.reviewTopics", { defaultValue: "Tópicos para Revisar" })}</h3>
              {reviewTopics.length ? (
                <ul>
                  {reviewTopics.map(topic => <li key={topic}>{topic}</li>)}
                </ul>
              ) : (
                <p className="text-xs text-textMuted">—</p>
              )}
            </div>
          </div>

          {scheduledNotice && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 text-center my-4">
              {scheduledNotice}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {performanceStats.wrong > 0 && (
              <A26Button variant="primary" onClick={handleRestartWrongOnly} icon={<LineIcon name="reset" />}>
                🔄 {t("flashcards.restartWrongOnly", { defaultValue: "Revisar Somente Erros" })} ({performanceStats.wrong})
              </A26Button>
            )}

            <A26Button variant="ghost" onClick={() => handleScheduleReview(1)} icon={<LineIcon name="calendar" />}>
              📅 {t("flashcards.scheduleReview", { defaultValue: "Agendar Próxima Revisão" })}
            </A26Button>

            <A26Button variant="liquid" onClick={() => setActiveDeck(null)}>
              ✨ {t("flashcards.newDeck", { defaultValue: "Novo Baralho" })}
            </A26Button>
          </div>
        </A26Card>
      )}
    </div>
  );
}

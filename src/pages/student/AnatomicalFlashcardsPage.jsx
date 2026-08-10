import { useState, useMemo, useEffect } from "react";
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
  scheduleFlashcardStudyEvent
} from "../../services/ai/flashcardSpacedRepetitionService";
import "../../styles/AnatomicalFlashcards.css";

const QUICK_TOPIC_CHIPS = [
  "+ Clavícula e Ombro",
  "+ Úmero e Braço",
  "+ Vértebras Cervicais",
  "+ Fêmur e Osteologia",
  "+ Vascularização do Coração",
  "+ Pares Cranianos"
];

export default function AnatomicalFlashcardsPage({ user, navigate }) {
  const { language, t } = useLanguage();
  const { sendMessage } = useAtlasAITutorSession();
  const userId = user?.id || "student-default";

  // Generator Config State (NotebookLM Pattern)
  const [topicInput, setTopicInput] = useState("Fêmur");
  const [cardCount, setCardCount] = useState("many"); // few | standard | many
  const [difficulty, setDifficulty] = useState("Difícil");
  const [isGenerating, setIsGenerating] = useState(false);

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

  const currentCard = activeDeck?.cards?.[currentIndex];

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
  }, [activeDeck, currentIndex, isFinished, currentCard]);

  async function handleGenerateDeck(customTopic) {
    const selectedTopic = customTopic || topicInput;
    setIsGenerating(true);
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
        includeImages: true
      });
      setActiveDeck(generated);
    } catch (err) {
      console.error("Erro ao gerar flashcards RAG:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRateCard(result) {
    if (!currentCard) return;

    // Record SuperMemo SM-2 Spaced Repetition Rating
    recordCardReview(userId, currentCard.id, result === "correct" ? "good" : "again");

    setFeedbackState(result);
    setSessionResults(prev => [...prev, { card: currentCard, result }]);

    setTimeout(() => {
      setFeedbackState(null);
      setIsFlipped(false);

      if (currentIndex < activeDeck.cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
        saveMemoryToTutorSession([...sessionResults, { card: currentCard, result }]);
      }
    }, 450);
  }

  function saveMemoryToTutorSession(results) {
    const correctCount = results.filter(r => r.result === "correct").length;
    const wrongCount = results.length - correctCount;
    const rate = Math.round((correctCount / (results.length || 1)) * 100);

    const memoryPayload = {
      timestamp: new Date().toISOString(),
      deckTitle: activeDeck?.title,
      totalCards: results.length,
      correctCount,
      wrongCount,
      rate,
      masteredTopics: results.filter(r => r.result === "correct").map(r => r.card.topic),
      reviewTopics: results.filter(r => r.result === "wrong").map(r => r.card.topic)
    };

    try {
      localStorage.setItem(`aeternum_student_flashcard_memory:${userId}`, JSON.stringify(memoryPayload));
      sendMessage(
        `[SISTEMA DE MEMÓRIA 360°]: O estudante concluiu a sessão de Flashcards "${activeDeck?.title}" com ${rate}% de acerto (${correctCount} acertos, ${wrongCount} erros). Tópicos para reforçar: ${memoryPayload.reviewTopics.join(", ") || "Nenhum"}.`,
        { silent: true }
      );
    } catch (err) {
      console.warn("Erro ao salvar memória do aluno:", err);
    }
  }

  function handleSaveCurrentDeck() {
    if (!activeDeck) return;
    const success = saveDeckToCollection(userId, activeDeck);
    if (success) {
      setIsDeckSaved(true);
      setSavedDecks(getSavedDecks(userId));
    }
  }

  function handleScheduleReview(intervalDays = 1) {
    const evt = scheduleFlashcardStudyEvent(activeDeck?.title || topicInput, intervalDays);
    if (evt) {
      setScheduledNotice(`✅ Revisão agendada na sua Agenda de Estudos para ${evt.date} às ${evt.time}!`);
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
    const prompt = `Estou estudando o Flashcard de Anatomia sobre "${card.topic}". Pergunta: "${card.front}". Resposta: "${card.back}". Pode me explicar com detalhes anatômicos e clínicos como se eu estivesse em uma aula prática?`;
    window.dispatchEvent(new CustomEvent("aeternum:open-tutor", { detail: { prompt } }));
  }

  function handleRestartWrongOnly() {
    const wrongCards = sessionResults.filter(r => r.result === "wrong").map(r => r.card);
    if (!wrongCards.length) return;

    setActiveDeck({
      ...activeDeck,
      title: `${activeDeck.title} (Reforço)`,
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
      <A26Surface material="liquid" className="a26-flashcards-hero">
        <div>
          <span className="a26-kicker">Revisão Ativa & Repetição Espaçada SM-2</span>
          <h1 className="text-2xl md:text-3xl font-bold text-agedGold tracking-tight mt-1">
            Flashcards Anatômicos Inteligentes
          </h1>
          <p className="text-xs md:text-sm text-textMuted mt-1">
            Sintetize baralhos didáticos a partir dos 14 livros oficiais da anatomia médica e sincronize seu desempenho com o Tutor IA.
          </p>
        </div>

        {activeDeck && (
          <A26Button variant="liquid" onClick={() => setActiveDeck(null)} icon={<LineIcon name="reset" />}>
            Novo Baralho
          </A26Button>
        )}
      </A26Surface>

      {/* Mode 1: Generator Modal & Config (NotebookLM Pattern) */}
      {!activeDeck && (
        <A26Surface material="liquid" className="a26-generator-surface p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-2">
                Número de Cards
              </label>
              <A26SegmentedControl
                options={[
                  { label: "Menos (~5)", value: "few" },
                  { label: "Padrão (~10)", value: "standard" },
                  { label: "Mais (~20)", value: "many" }
                ]}
                value={cardCount}
                onChange={setCardCount}
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-2">
                Nível de Dificuldade
              </label>
              <A26SegmentedControl
                options={[
                  { label: "Fácil", value: "Fácil" },
                  { label: "Médio (padrão)", value: "Médio" },
                  { label: "Difícil", value: "Difícil" }
                ]}
                value={difficulty}
                onChange={setDifficulty}
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-2">
              Qual deve ser o tema?
            </label>
            <A26Field
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              placeholder="Digite o assunto (ex: Vértebras Cervicais, Fêmur, Artéria Coronária...)"
              className="w-full"
            />
          </div>

          <div className="a26-chips-wrapper flex flex-wrap gap-2">
            {QUICK_TOPIC_CHIPS.map(chip => (
              <button
                key={chip}
                type="button"
                className="a26-quick-chip"
                onClick={() => {
                  const cleaned = chip.replace(/^\+\s*/, "");
                  setTopicInput(cleaned);
                  handleGenerateDeck(cleaned);
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <A26Button
              variant="primary"
              onClick={() => handleGenerateDeck()}
              loading={isGenerating}
              icon={<LineIcon name="spark" />}
            >
              {isGenerating ? "Sintetizando RAG..." : "Gerar Baralho de Flashcards"}
            </A26Button>
          </div>

          {/* Saved Decks Section */}
          {savedDecks.length > 0 && (
            <div className="pt-6 border-t border-glassBorder/40">
              <span className="a26-kicker">Sua Coleção Pessoal</span>
              <h3 className="text-base font-bold text-agedGold mb-3">Meus Baralhos Salvos ({savedDecks.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {savedDecks.map(deck => (
                  <div
                    key={deck.id || deck.title}
                    className="p-3 bg-glassSurface/50 border border-glassBorder rounded-xl hover:border-emerald-500/50 cursor-pointer transition"
                    onClick={() => handleLoadSavedDeck(deck)}
                  >
                    <h4 className="text-sm font-semibold text-textMain line-clamp-1">{deck.title}</h4>
                    <span className="text-[11px] text-emerald-400">{deck.cards?.length} cards · {deck.difficulty}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </A26Surface>
      )}

      {/* Mode 2: Interactive 3D Player (Anki Pattern with Image Occlusion & Hotkeys) */}
      {activeDeck && !isFinished && currentCard && (
        <div className="a26-flashcard-player-container">
          <div className="a26-player-meta flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-agedGold">{activeDeck.title}</h2>
              <span className="text-xs text-textMuted">Fonte RAG: {currentCard.sourceCitation}</span>
            </div>
            <div className="flex items-center gap-3">
              {!isDeckSaved && (
                <A26Button variant="ghost" onClick={handleSaveCurrentDeck} icon={<LineIcon name="bookmark" />}>
                  ⭐ Salvar Baralho
                </A26Button>
              )}
              <span className="a26-card-counter font-mono text-sm">
                {currentIndex + 1} / {activeDeck.cards.length}
              </span>
            </div>
          </div>

          {/* 3D Stage Container with Standalone Feedback Overlay */}
          <div className="relative w-full">
            {feedbackState === "correct" && (
              <div className="a26-feedback-overlay is-correct pointer-events-none z-50">
                <span>Entendido! ✓</span>
              </div>
            )}
            {feedbackState === "wrong" && (
              <div className="a26-feedback-overlay is-wrong pointer-events-none z-50">
                <span>Você consegue da próxima vez ✕</span>
              </div>
            )}

            {/* 3D Flip Card Container */}
            <div
              className={`a26-flashcard-3d-wrapper ${isFlipped ? "is-flipped" : ""}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front Side - Minimal & Clean (NotebookLM Pattern) */}
            <div className="a26-flashcard-face a26-flashcard-face--front">
              <div className="a26-flashcard-header">
                <span className="a26-kicker">Frente</span>
                <span className="a26-flashcard-citation">{currentCard.topic}</span>
              </div>

              <div className="a26-flashcard-body">
                {currentCard.imageUrl && (
                  <img src={currentCard.imageUrl} alt={currentCard.topic} className="a26-flashcard-img" />
                )}
                <p className="a26-flashcard-text">{currentCard.front}</p>
              </div>

              <span className="a26-flashcard-hint">Veja a resposta</span>
            </div>

            {/* Back Side - Direct Answer & Tutor AI Action */}
            <div className="a26-flashcard-face a26-flashcard-face--back">
              <div className="a26-flashcard-header">
                <span className="a26-kicker text-agedGold">Verso · Resposta</span>
                <span className="a26-flashcard-citation">{currentCard.sourceCitation}</span>
              </div>

              <div className="a26-flashcard-body">
                <p className="a26-flashcard-text text-teal-300 font-bold text-xl">{currentCard.back}</p>
              </div>

              <div className="flex items-center justify-between w-full">
                <span className="a26-flashcard-hint">Avalie seu conhecimento abaixo</span>
                <A26Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExplainWithAI(currentCard);
                  }}
                  icon={<LineIcon name="spark" />}
                >
                  ✨ Explicar com Tutor IA
                </A26Button>
              </div>
            </div>
          </div>
        </div>

        {/* Anki Rating Controls */}
          <div className="a26-anki-controls flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              className="a26-anki-btn"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              ‹
            </button>

            <button
              type="button"
              className="a26-anki-btn is-wrong"
              onClick={() => handleRateCard("wrong")}
            >
              ✕ Errei
            </button>

            <button
              type="button"
              className="a26-anki-btn is-correct"
              onClick={() => handleRateCard("correct")}
            >
              ✓ Acertei
            </button>

            <button
              type="button"
              className="a26-anki-btn"
              onClick={() => setCurrentIndex(prev => Math.min(activeDeck.cards.length - 1, prev + 1))}
              disabled={currentIndex === activeDeck.cards.length - 1}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Mode 3: Performance Results Report & Spaced Repetition Agenda Sync */}
      {isFinished && (
        <A26Card material="substantial" tone="teal" className="a26-performance-report-card">
          <span className="a26-kicker">Relatório de Desempenho e Repetição Espaçada SM-2</span>
          <h2 className="text-2xl font-bold text-agedGold">Baralho Concluído!</h2>
          <p className="text-sm text-textMuted max-w-xl mx-auto">
            Os dados deste teste foram gravados na memória da sua conta e o intervalo de repetição espaçada foi atualizado.
          </p>

          <div className="a26-report-metrics-grid">
            <A26Metric label="Taxa de acerto" value={`${performanceStats.rate}%`} tone={performanceStats.rate >= 70 ? "teal" : "gold"} />
            <A26Metric label="Cartões acertados" value={performanceStats.correct} tone="teal" />
            <A26Metric label="Cartões a reforçar" value={performanceStats.wrong} tone="gold" />
          </div>

          <div className="a26-topics-mastery-list">
            <div className="a26-topic-column is-strong">
              <h3>🟢 Tópicos Dominados</h3>
              {masteredTopics.length ? (
                <ul>
                  {masteredTopics.map(t => <li key={t}>{t} (Acertado)</li>)}
                </ul>
              ) : (
                <p className="text-xs text-textMuted">Nenhum tópico dominado nesta rodada.</p>
              )}
            </div>

            <div className="a26-topic-column is-weak">
              <h3>🔴 Tópicos de Reforço Urgente</h3>
              {reviewTopics.length ? (
                <ul>
                  {reviewTopics.map(t => <li key={t}>{t} (Requer revisão)</li>)}
                </ul>
              ) : (
                <p className="text-xs text-textMuted">Parabéns! Nenhum erro registrado nesta sessão.</p>
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
                🔄 Repetir Apenas os Errados ({performanceStats.wrong})
              </A26Button>
            )}

            <A26Button variant="ghost" onClick={() => handleScheduleReview(1)} icon={<LineIcon name="calendar" />}>
              📅 Agendar Revisão em 24h na Agenda
            </A26Button>

            <A26Button variant="liquid" onClick={() => setActiveDeck(null)}>
              ✨ Criar Novo Baralho
            </A26Button>
          </div>
        </A26Card>
      )}
    </div>
  );
}

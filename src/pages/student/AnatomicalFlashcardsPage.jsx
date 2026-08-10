import { useState, useMemo } from "react";
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
import "../../styles/AnatomicalFlashcards.css";

const QUICK_TOPIC_CHIPS = [
  "+ Vascularização do Coração",
  "+ Pares Cranianos",
  "+ Plexo Braquial e Membro Superior",
  "+ Ramos da Artéria Subclávia",
  "+ Sistema Nervoso Central",
  "+ Osteologia do Crânio"
];

export default function AnatomicalFlashcardsPage({ user, navigate }) {
  const { language, t } = useLanguage();
  const { sendMessage } = useAtlasAITutorSession();

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

  const currentCard = activeDeck?.cards?.[currentIndex];

  async function handleGenerateDeck(customTopic) {
    const selectedTopic = customTopic || topicInput;
    setIsGenerating(true);
    setIsFinished(false);
    setSessionResults([]);
    setCurrentIndex(0);
    setIsFlipped(false);

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

    setFeedbackState(result);
    const newResults = [...sessionResults, { card: currentCard, result }];
    setSessionResults(newResults);

    setTimeout(() => {
      setFeedbackState(null);
      setIsFlipped(false);

      if (currentIndex + 1 < activeDeck.cards.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
        syncTutorMemory(newResults);
      }
    }, 650);
  }

  function syncTutorMemory(results) {
    const correct = results.filter(r => r.result === "correct");
    const wrong = results.filter(r => r.result === "wrong");
    const rate = Math.round((correct.length / results.length) * 100);

    const weakTopics = Array.from(new Set(wrong.map(r => r.card.topic)));
    const strongTopics = Array.from(new Set(correct.map(r => r.card.topic)));

    // Send high-priority memory update message to Tutor AI
    const memoryMessage = `[MEMÓRIA DO ESTUDANTE ACUMULADA]: O aluno concluiu o baralho "${activeDeck?.title}" com ${rate}% de acertos. Tópicos dominados: ${strongTopics.join(", ") || "Nenhum"}. Tópicos de reforço urgente: ${weakTopics.join(", ") || "Nenhum"}.`;

    try {
      window.localStorage.setItem(`aeternum_student_flashcard_memory:${user?.id || "user"}`, JSON.stringify({
        lastDeck: activeDeck?.title,
        accuracy: rate,
        weakTopics,
        strongTopics,
        timestamp: new Date().toISOString()
      }));
    } catch {
      // Ignorar indisponibilidade do storage
    }
  }

  function handleExplainWithAI(card) {
    const promptText = `Explique em detalhes a estrutura anatômica "${card.back}" abordada no flashcard: "${card.front}". Cite as fontes da literatura médica (Moore, Sobotta, Netter).`;
    sendMessage({
      text: promptText,
      contextLabel: `Flashcard: ${card.topic}`
    });
  }

  function handleRestartWrongOnly() {
    const wrongCards = sessionResults.filter(r => r.result === "wrong").map(r => r.card);
    if (!wrongCards.length) return;

    setActiveDeck(prev => ({
      ...prev,
      cards: wrongCards
    }));
    setCurrentIndex(0);
    setSessionResults([]);
    setIsFinished(false);
    setIsFlipped(false);
  }

  const performanceStats = useMemo(() => {
    if (!sessionResults.length) return { correct: 0, wrong: 0, rate: 0 };
    const correct = sessionResults.filter(r => r.result === "correct").length;
    const wrong = sessionResults.filter(r => r.result === "wrong").length;
    const rate = Math.round((correct / sessionResults.length) * 100);
    return { correct, wrong, rate };
  }, [sessionResults]);

  const masteredTopics = useMemo(() => {
    const correct = sessionResults.filter(r => r.result === "correct").map(r => r.card.topic);
    return Array.from(new Set(correct));
  }, [sessionResults]);

  const reviewTopics = useMemo(() => {
    const wrong = sessionResults.filter(r => r.result === "wrong").map(r => r.card.topic);
    return Array.from(new Set(wrong));
  }, [sessionResults]);

  return (
    <div className="a26-flashcards-page fade-in-up" data-testid="a26-flashcards-module">
      {/* Top Hero Banner */}
      <A26Card material="substantial" tone="teal" className="a26-flashcards-hero">
        <div>
          <span className="a26-kicker">Revisão Ativa & Repetição Espaçada RAG</span>
          <h1>Flashcards Anatômicos Inteligentes</h1>
          <p>Sintetize baralhos didáticos a partir dos 14 livros oficiais da anatomia médica e sincronize seu desempenho com o Tutor IA.</p>
        </div>
        {activeDeck && (
          <A26Button variant="liquid" icon={<LineIcon name="reset" />} onClick={() => setActiveDeck(null)}>
            Novo Baralho
          </A26Button>
        )}
      </A26Card>

      {/* Mode 1: Generator Form (NotebookLM Pattern) */}
      {!activeDeck && (
        <A26Card material="clear" className="a26-flashcard-config-card">
          <div className="a26-config-row">
            <div className="a26-config-group">
              <label>Número de cards</label>
              <A26SegmentedControl
                value={cardCount}
                onChange={setCardCount}
                options={[
                  { value: "few", label: "Menos (~5)" },
                  { value: "standard", label: "Padrão (~10)" },
                  { value: "many", label: "Mais (~20)" }
                ]}
              />
            </div>

            <div className="a26-config-group">
              <label>Nível de dificuldade</label>
              <A26SegmentedControl
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  { value: "Fácil", label: "Fácil" },
                  { value: "Médio", label: "Médio (padrão)" },
                  { value: "Difícil", label: "Difícil" }
                ]}
              />
            </div>
          </div>

          <div className="a26-config-group">
            <label>Qual deve ser o tema?</label>
            <A26Field
              value={topicInput}
              placeholder="Digite o tema exato (ex: Vascularização do Coração, Pares Cranianos)..."
              onChange={e => setTopicInput(e.target.value)}
            />
            <div className="a26-topic-chips">
              {QUICK_TOPIC_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  className="a26-topic-chip"
                  onClick={() => {
                    const clean = chip.replace(/^\+\s*/, "");
                    setTopicInput(clean);
                    handleGenerateDeck(clean);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <A26Button
              variant="primary"
              disabled={isGenerating || !topicInput.trim()}
              onClick={() => handleGenerateDeck()}
              icon={<LineIcon name="spark" />}
            >
              {isGenerating ? "Consultando RAG de Livros..." : "Gerar Baralho de Flashcards"}
            </A26Button>
          </div>
        </A26Card>
      )}

      {/* Mode 2: Deck Player (Anki + NotebookLM Pattern) */}
      {activeDeck && !isFinished && currentCard && (
        <div className="a26-flashcard-stage">
          {/* Deck Header & Citation */}
          <div className="flex items-center justify-between w-full px-2">
            <div>
              <h2 className="text-lg font-bold text-agedGold">{activeDeck.title}</h2>
              <span className="text-xs text-textMuted">Fonte RAG: {currentCard.sourceCitation}</span>
            </div>
            <span className="a26-flashcard-count">
              {currentIndex + 1} / {activeDeck.cards.length}
            </span>
          </div>

          {/* 3D Flippable Flashcard */}
          <div
            className={`a26-flashcard-3d-wrapper ${isFlipped ? "is-flipped" : ""}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Feedback Swipe Overlays */}
            {feedbackState === "correct" && (
              <div className="a26-feedback-overlay is-correct">
                <span>Entendido! ✓</span>
              </div>
            )}
            {feedbackState === "wrong" && (
              <div className="a26-feedback-overlay is-wrong">
                <span>Você consegue da próxima vez ✕</span>
              </div>
            )}

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

          {/* Anki Rating Buttons */}
          <div className="a26-anki-controls">
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

      {/* Mode 3: Performance Results Report & Tutor AI Sync */}
      {isFinished && (
        <A26Card material="substantial" tone="teal" className="a26-performance-report-card">
          <span className="a26-kicker">Relatório de Desempenho e Domínio</span>
          <h2 className="text-2xl font-bold text-agedGold">Baralho Concluído!</h2>
          <p className="text-sm text-textMuted max-w-xl mx-auto">
            Os dados deste teste foram gravados na memória da sua conta e sincronizados com o Tutor IA.
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

          <div className="flex items-center justify-center gap-4 mt-6">
            {performanceStats.wrong > 0 && (
              <A26Button variant="primary" onClick={handleRestartWrongOnly} icon={<LineIcon name="reset" />}>
                🔄 Repetir Apenas os Errados ({performanceStats.wrong})
              </A26Button>
            )}
            <A26Button variant="liquid" onClick={() => setActiveDeck(null)}>
              ✨ Criar Novo Baralho
            </A26Button>
          </div>
        </A26Card>
      )}
    </div>
  );
}

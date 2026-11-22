import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";
import { useAtlasAITutorSession } from "../../context/AtlasAITutorSessionContext";
import {
  A26Button,
  A26Card,
  A26FeatureShell,
  A26Metric,
  A26PageHeader,
  A26Surface,
  A26Toolbar
} from "../../components/aeternum-26";
import FlashcardDeckConfigurator from "../../components/student/FlashcardDeckConfigurator";
import {
  generateAnatomicalFlashcards,
  normalizeGenerationMode,
  FLASHCARD_GENERATION_MODES
} from "../../services/ai/flashcardGenerationService";
import { selectCuratedFlashcards } from "../../data/anatomicalFlashcardBank";
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
    "Plexo Braquial",
    "Ramificações da Artéria Maxilar",
    "Vértebras Cervicais",
    "Fêmur e Osteologia",
    "Pares Cranianos"
  ],
  es: [
    "Clavícula y Hombro",
    "Plexo Braquial",
    "Ramas de la Arteria Maxilar",
    "Vértebras Cervicales",
    "Fémur y Osteología",
    "Pares Craneales"
  ],
  en: [
    "Clavicle and Shoulder",
    "Brachial Plexus",
    "Maxillary Artery Branches",
    "Cervical Vertebrae",
    "Femur and Osteology",
    "Cranial Nerves"
  ],
  de: [
    "Schlüsselbein und Schulter",
    "Plexus brachialis",
    "Äste der Arteria maxillaris",
    "Halswirbel",
    "Femur und Osteologie",
    "Hirnnerven"
  ]
};

const DEFAULT_TOPIC_BY_LANG = {
  pt: "Clavícula e Ombro",
  es: "Clavícula y Hombro",
  en: "Clavicle and Shoulder",
  de: "Schlüsselbein und Schulter"
};

function resolveOperationTimeoutMs(cardCountKey) {
  if (cardCountKey === "few") return 95000;
  if (cardCountKey === "standard") return 180000;
  return 300000;
}

function resolveRequestedCardCount(cardCountKey) {
  if (cardCountKey === "few") return 5;
  if (cardCountKey === "standard") return 10;
  return 20;
}

function resolveCountKeyFromNumber(num) {
  if (num <= 5) return "few";
  if (num <= 10) return "standard";
  return "many";
}

export default function AnatomicalFlashcardsPage({ user }) {
  const { t, language } = useLanguage();
  const langKey = ["pt", "es", "en", "de"].includes(language) ? language : "pt";
  const { connectionMode, openTutor } = useAtlasAITutorSession();
  const userId = user?.id || "student-default";

  // Initial Configurator State
  const [topicInput, setTopicInput] = useState(() => DEFAULT_TOPIC_BY_LANG[langKey] || "Clavícula e Ombro");
  const [cardCount, setCardCount] = useState("few"); // few (5) | standard (10) | many (20)
  const [difficulty, setDifficulty] = useState("Médio");

  // Popover Draft Configurator State (Isolated from active study session)
  const [draftTopic, setDraftTopic] = useState(() => DEFAULT_TOPIC_BY_LANG[langKey] || "Clavícula e Ombro");
  const [draftCardCount, setDraftCardCount] = useState("few");
  const [draftDifficulty, setDraftDifficulty] = useState("Médio");

  // Generation & Availability State (Separated Validation vs Operational Error)
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [operationalError, setOperationalError] = useState("");
  const [generationNotice, setGenerationNotice] = useState("");

  // Deck & Player State (Single Unified 3D Flashcard)
  const [activeDeck, setActiveDeck] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedbackState, setFeedbackState] = useState(null); // "correct" | "wrong" | null
  const [sessionResults, setSessionResults] = useState([]); // [{ card, result: "correct" | "wrong" }]
  const [isFinished, setIsFinished] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);

  // Saved Decks Collection State
  const [savedDecks, setSavedDecks] = useState([]);
  const [isDeckSaved, setIsDeckSaved] = useState(false);
  const [scheduledNotice, setScheduledNotice] = useState("");
  const generationAbortTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const generationSeqRef = useRef(0);

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

  // Clear abort controller and timer on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (abortErr) {
          console.debug("Flashcards abort cleanup notice:", abortErr);
        }
      }
      if (generationAbortTimerRef.current) {
        clearTimeout(generationAbortTimerRef.current);
      }
    };
  }, []);

  const handleOpenAdjustPopover = useCallback(() => {
    if (!isConfigDrawerOpen && activeDeck) {
      setDraftTopic(activeDeck.topic || topicInput);
      setDraftDifficulty(activeDeck.difficulty || difficulty);
      setDraftCardCount(resolveCountKeyFromNumber(activeDeck.requestedCount || activeDeck.cards?.length || 5));
      setValidationError("");
    }
    setIsConfigDrawerOpen((prev) => !prev);
  }, [isConfigDrawerOpen, activeDeck, topicInput, difficulty]);

  const handleCancelGeneration = useCallback(() => {
    generationSeqRef.current += 1;
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (abortErr) {
        console.debug("Flashcard generation manual abort:", abortErr);
      }
      abortControllerRef.current = null;
    }
    if (generationAbortTimerRef.current) {
      clearTimeout(generationAbortTimerRef.current);
      generationAbortTimerRef.current = null;
    }
    setIsGenerating(false);
    setGenerationProgress(null);
    const cancelNotices = {
      pt: "Geração cancelada. Seus parâmetros e estudo em andamento foram preservados.",
      es: "Generación cancelada. Tus parámetros y estudio en curso fueron preservados.",
      en: "Generation cancelled. Your parameters and active study progress were preserved.",
      de: "Generierung abgebrochen. Ihre Parameter und Ihr Lernfortschritt blieben erhalten."
    };
    setGenerationNotice(cancelNotices[langKey] || cancelNotices.pt);
  }, [langKey]);

  async function handleGenerateDeck({
    customTopic = null,
    customDifficulty = null,
    customCardCount = null,
    fromPopover = false
  } = {}) {
    const selectedTopic = String(customTopic !== null ? customTopic : (fromPopover ? draftTopic : topicInput) || "").trim();
    const selectedDifficulty = customDifficulty || (fromPopover ? draftDifficulty : difficulty);
    const selectedCardCount = customCardCount || (fromPopover ? draftCardCount : cardCount);

    if (!selectedTopic) {
      const errorMsg = {
        pt: "Informe um tema anatômico válido antes de gerar o baralho.",
        es: "Ingresa un tema anatómico válido antes de generar la baraja.",
        en: "Please enter a valid anatomical topic before generating the deck.",
        de: "Bitte geben Sie ein gültiges anatomisches Thema ein, bevor Sie das Deck generieren."
      };
      setValidationError(errorMsg[langKey] || errorMsg.pt);
      return;
    }

    setValidationError("");
    setOperationalError("");
    setGenerationNotice("");
    setIsGenerating(true);

    const requestedNum = resolveRequestedCardCount(selectedCardCount);
    setGenerationProgress({
      stage: "preparing_evidence",
      completedCount: 0,
      requestedCount: requestedNum,
      batchIndex: 1,
      totalBatches: Math.max(1, Math.ceil(requestedNum / 5))
    });

    // Abort any previous pending generation
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (abortErr) {
        console.debug("Previous flashcard generation abort notice:", abortErr);
      }
    }
    const currentSeq = ++generationSeqRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (generationAbortTimerRef.current) {
      clearTimeout(generationAbortTimerRef.current);
    }

    const timeoutMs = resolveOperationTimeoutMs(selectedCardCount);
    const timeoutSec = Math.round(timeoutMs / 1000);

    const timeoutPromise = new Promise((_, reject) => {
      generationAbortTimerRef.current = setTimeout(() => {
        if (generationSeqRef.current !== currentSeq) return;
        try {
          controller.abort();
        } catch (abortErr) {
          console.debug("Flashcards timeout abort notice:", abortErr);
        }
        const timeoutMsg = {
          pt: `O serviço de inferência com Qwen 3.5 4B no Gateway local está ocupado ou excedeu o tempo da operação (${timeoutSec}s). Seus parâmetros e estudo atual foram preservados. Você pode tentar novamente ou utilizar o banco curado.`,
          es: `El servicio de inferencia con Qwen 3.5 4B en el Gateway local está ocupado (${timeoutSec}s). Tus parámetros y estudio actual fueron preservados. Intenta nuevamente o usa el banco curado.`,
          en: `The local Qwen 3.5 4B inference service is busy or exceeded the operation window (${timeoutSec}s). Your settings and study progress are preserved. Try again or use the curated bank.`,
          de: `Der lokale Qwen 3.5 4B Inferenzdienst ist ausgelastet (${timeoutSec}s). Ihre Parameter und Ihr Lernfortschritt blieben erhalten. Bitte erneut versuchen oder kuratierte Datenbank nutzen.`
        };
        const err = new Error(timeoutMsg[langKey] || timeoutMsg.pt);
        err.code = "AI_GATEWAY_TIMEOUT";
        reject(err);
      }, timeoutMs);
    });

    try {
      const generationPromise = generateAnatomicalFlashcards({
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        cardCount: selectedCardCount,
        language: langKey,
        preferTutorOnly: true,
        signal: controller.signal,
        onProgress: (prog) => {
          if (generationSeqRef.current !== currentSeq) return;
          setGenerationProgress(prog);
        }
      });

      const generated = await Promise.race([generationPromise, timeoutPromise]);
      if (generationSeqRef.current !== currentSeq) return;

      if (generationAbortTimerRef.current) {
        clearTimeout(generationAbortTimerRef.current);
        generationAbortTimerRef.current = null;
      }

      // Sync active parameters only after validated generation succeeds
      setTopicInput(selectedTopic);
      setDifficulty(selectedDifficulty);
      setCardCount(selectedCardCount);
      setDraftTopic(selectedTopic);
      setDraftDifficulty(selectedDifficulty);
      setDraftCardCount(selectedCardCount);

      setActiveDeck(generated);
      if (typeof window !== "undefined") {
        window.__A26_ACTIVE_FLASHCARD_DECK__ = generated;
      }
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
      setSessionResults([]);
      setIsDeckSaved(false);
      setScheduledNotice("");
      setGenerationNotice(generated.generationNotice || "");
      setIsConfigDrawerOpen(false);
    } catch (err) {
      if (generationSeqRef.current !== currentSeq) return;
      if (err?.code === "REQUEST_ABORTED" || err?.name === "AbortError") {
        return;
      }
      console.error("Erro operacional ao gerar flashcards:", err);
      if (err?.code === "INVALID_TOPIC") {
        setValidationError(err?.message || "Informe um tema anatômico válido.");
      } else {
        setOperationalError(
          err?.message ||
          "O serviço de inferência local (Qwen 3.5 4B) não pôde concluir a geração agora. Seus parâmetros e estudo atual foram preservados."
        );
      }
    } finally {
      if (generationSeqRef.current === currentSeq) {
        if (generationAbortTimerRef.current) {
          clearTimeout(generationAbortTimerRef.current);
          generationAbortTimerRef.current = null;
        }
        setIsGenerating(false);
        setGenerationProgress(null);
      }
    }
  }

  function handleLoadCuratedFallback({ fromPopover = false } = {}) {
    const selectedTopic = String((fromPopover ? draftTopic : topicInput) || "").trim() || DEFAULT_TOPIC_BY_LANG[langKey];
    const selectedDifficulty = fromPopover ? draftDifficulty : difficulty;
    const selectedCardCount = fromPopover ? draftCardCount : cardCount;
    const requested = resolveRequestedCardCount(selectedCardCount);

    // Abort any running AI generation so a late response never overwrites the curated deck
    generationSeqRef.current += 1;
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        // ignore abort error
      }
      abortControllerRef.current = null;
    }
    if (generationAbortTimerRef.current) {
      clearTimeout(generationAbortTimerRef.current);
      generationAbortTimerRef.current = null;
    }
    setIsGenerating(false);
    setGenerationProgress(null);

    let curatedSelection = selectCuratedFlashcards({
      topic: selectedTopic,
      difficulty: selectedDifficulty,
      count: requested,
      language: langKey
    });

    if (!curatedSelection?.cards?.length) {
      curatedSelection = selectCuratedFlashcards({
        topic: "Clavícula e Ombro",
        difficulty: selectedDifficulty,
        count: requested,
        language: langKey
      });
    }

    if (curatedSelection?.cards?.length) {
      const matchedTitle = curatedSelection.matchedTopic?.title || selectedTopic;
      const cards = curatedSelection.cards;
      const isPartial = cards.length < requested;
      const curatedNotices = {
        pt: isPartial
          ? `Banco editorial curado Aeternum 26.1: ${cards.length} cartões disponíveis de até ${requested} solicitados (sem duplicação artificial).`
          : `Baralho curado do acervo editorial Aeternum 26.1 (${cards.length} cartões verificados sem duplicatas).`,
        es: isPartial
          ? `Banco curado Aeternum 26.1: ${cards.length} tarjetas disponibles de hasta ${requested} solicitadas.`
          : `Baraja curada del banco editorial Aeternum 26.1 (${cards.length} tarjetas verificadas).`,
        en: isPartial
          ? `Aeternum 26.1 curated bank: ${cards.length} cards available of up to ${requested} requested (no artificial duplication).`
          : `Curated deck from Aeternum 26.1 editorial bank (${cards.length} verified cards).`,
        de: isPartial
          ? `Kuratierte Datenbank Aeternum 26.1: ${cards.length} Karten verfügbar von bis zu ${requested} angeforderten.`
          : `Kuratiertes Deck aus der Aeternum 26.1 Datenbank (${cards.length} geprüfte Karten).`
      };

      setTopicInput(matchedTitle);
      setDifficulty(selectedDifficulty);
      setCardCount(selectedCardCount);
      setDraftTopic(matchedTitle);
      setDraftDifficulty(selectedDifficulty);
      setDraftCardCount(selectedCardCount);

      setActiveDeck({
        id: `curated-${Date.now()}`,
        title: `Flashcards: ${matchedTitle}`,
        topic: matchedTitle,
        system: curatedSelection.matchedTopic?.system || "Anatomia Humana",
        difficulty: selectedDifficulty,
        sources: ["SRC-MOORE-7TH-BR", "SRC-TA2-2019"],
        requestedCount: requested,
        generatedCount: cards.length,
        validatedCount: cards.length,
        tutorGeneratedCount: 0,
        curatedIncludedCount: cards.length,
        rejectedCount: 0,
        isPartial,
        generationMode: FLASHCARD_GENERATION_MODES.CURATED,
        generationNotice: curatedNotices[langKey] || curatedNotices.pt,
        cards
      });
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
      setSessionResults([]);
      setIsDeckSaved(false);
      setValidationError("");
      setOperationalError("");
      setGenerationNotice(curatedNotices[langKey] || curatedNotices.pt);
      setIsConfigDrawerOpen(false);
    }
  }

  const handleRateCard = useCallback((rating) => {
    if (!currentCard || feedbackState) return;

    setFeedbackState(rating);

    recordCardReview({
      userId,
      cardId: currentCard.id,
      rating,
      topic: currentCard.topic,
      difficulty: currentCard.difficulty || activeDeck?.difficulty
    });

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

    setTimeout(() => {
      setFeedbackState(null);
      setIsFlipped(false);

      if (currentIndex + 1 < activeDeck.cards.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsFinished(true);
        const correctCount = updatedResults.filter((r) => r.result === "correct").length;
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

  function handleExplainWithAI(card) {
    if (!card) return;
    const promptMap = {
      pt: `Estou estudando o Flashcard sobre "${card.topic}".\nPergunta do cartão: "${card.front}"\nResposta proposta pelo cartão: "${card.back}"\nExplicação do cartão: "${card.explanation || ''}"\n\nPor favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`,
      es: `Estoy estudiando el Flashcard sobre "${card.topic}".\nPregunta de la tarjeta: "${card.front}"\nRespuesta propuesta por la tarjeta: "${card.back}"\nExplicación de la tarjeta: "${card.explanation || ''}"\n\nPor favor, analiza científicamente esta tarjeta como un profesor de anatomía: verifica si la respuesta propuesta y la explicación son correctas o si contienen premisas falsas, señala cualquier error con rigor anatómico y explícame con detalle la morfología, relaciones topográficas y correlaciones clínicas pertinentes.`,
      en: `I am studying the Flashcard on "${card.topic}".\nCard Question: "${card.front}"\nProposed Answer on Card: "${card.back}"\nCard Explanation: "${card.explanation || ''}"\n\nPlease scientifically analyze this flashcard as an anatomy professor: verify whether the proposed answer and explanation are correct or contain false premises, point out any errors with anatomical rigor, and explain in detail the relevant morphology, topographical relationships, and clinical correlations.`,
      de: `Ich lerne mit der Karteikarte über "${card.topic}".\nFrage der Karte: "${card.front}"\nVorgeschlagene Antwort auf der Karte: "${card.back}"\nErklärung der Karte: "${card.explanation || ''}"\n\nBitte analysieren Sie diese Karteikarte wissenschaftlich wie ein Anatomieprofessor: Überprüfen Sie, ob die vorgeschlagene Antwort und Erklärung korrekt sind oder falsche Prämissen enthalten, weisen Sie mit anatomischer Strenge auf etwaige Fehler hin und erklären Sie ausführlich die relevante Morphologie, topografische Beziehungen und klinische Korrelationen.`
    };
    const prompt = promptMap[langKey] || promptMap.pt;
    openTutor({
      prompt,
      context: {
        task: "explain_flashcard",
        source: "flashcard-explanation",
        originModule: "flashcards",
        route: "/flashcards",
        topic: card.topic,
        difficulty: card.difficulty || activeDeck?.difficulty,
        cardId: card.id,
        question: card.front,
        proposedAnswer: card.back,
        existingExplanation: card.explanation || null,
        sourceProvenance: card.sourceCitation || card.provenance || card.source || null,
        learningObjective: card.learningObjective || null,
        language: langKey
      },
      contextLabel: `Flashcards · ${card.topic}`
    });
  }

  // Keyboard Hotkeys Listener (Anki Style: Space/Enter = Flip, 1 = Wrong, 2 = Correct, E = Explain)
  useEffect(() => {
    function handleKeyDown(e) {
      if (!activeDeck || isFinished || isConfigDrawerOpen) return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
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
  }, [activeDeck, currentIndex, isFinished, isConfigDrawerOpen, currentCard, handleRateCard]);

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
    generationSeqRef.current += 1;
    const normalizedMode = normalizeGenerationMode(deck.generationMode, {
      tutorCount: deck.tutorGeneratedCount,
      curatedCount: deck.curatedIncludedCount
    });
    setActiveDeck({
      ...deck,
      generationMode: normalizedMode
    });
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setSessionResults([]);
    setIsDeckSaved(true);
    setValidationError("");
    setOperationalError("");
    setIsConfigDrawerOpen(false);
  }

  function handleRestartWrongOnly() {
    const wrongCards = sessionResults.filter((r) => r.result === "wrong").map((r) => r.card);
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
    setIsConfigDrawerOpen(false);
  }

  const performanceStats = useMemo(() => {
    if (!sessionResults.length) return { rate: 0, correct: 0, wrong: 0 };
    const correct = sessionResults.filter((r) => r.result === "correct").length;
    const wrong = sessionResults.length - correct;
    const rate = Math.round((correct / sessionResults.length) * 100);
    return { rate, correct, wrong };
  }, [sessionResults]);

  const masteredTopics = useMemo(() => {
    return Array.from(new Set(sessionResults.filter((r) => r.result === "correct").map((r) => r.card.topic)));
  }, [sessionResults]);

  const reviewTopics = useMemo(() => {
    return Array.from(new Set(sessionResults.filter((r) => r.result === "wrong").map((r) => r.card.topic)));
  }, [sessionResults]);

  const normalizedActiveMode = useMemo(() => {
    if (!activeDeck) return FLASHCARD_GENERATION_MODES.CURATED;
    return normalizeGenerationMode(activeDeck.generationMode, {
      tutorCount: activeDeck.tutorGeneratedCount,
      curatedCount: activeDeck.curatedIncludedCount
    });
  }, [activeDeck]);

  const activeModeLabel = useMemo(() => {
    const labels = {
      pt: {
        [FLASHCARD_GENERATION_MODES.CURATED]: "Curado",
        [FLASHCARD_GENERATION_MODES.TUTOR]: "Tutor IA",
        [FLASHCARD_GENERATION_MODES.HYBRID]: "Híbrido"
      },
      es: {
        [FLASHCARD_GENERATION_MODES.CURATED]: "Curado",
        [FLASHCARD_GENERATION_MODES.TUTOR]: "Tutor IA",
        [FLASHCARD_GENERATION_MODES.HYBRID]: "Híbrido"
      },
      en: {
        [FLASHCARD_GENERATION_MODES.CURATED]: "Curated",
        [FLASHCARD_GENERATION_MODES.TUTOR]: "AI Tutor",
        [FLASHCARD_GENERATION_MODES.HYBRID]: "Hybrid"
      },
      de: {
        [FLASHCARD_GENERATION_MODES.CURATED]: "Kuratiert",
        [FLASHCARD_GENERATION_MODES.TUTOR]: "KI-Tutor",
        [FLASHCARD_GENERATION_MODES.HYBRID]: "Hybrid"
      }
    };
    const set = labels[langKey] || labels.pt;
    return set[normalizedActiveMode] || set[FLASHCARD_GENERATION_MODES.CURATED];
  }, [normalizedActiveMode, langKey]);

  const activeAvailabilitySummary = useMemo(() => {
    if (!activeDeck?.cards?.length) return "";
    const available = activeDeck.cards.length;
    const requested = activeDeck.requestedCount || available;
    if (langKey === "es") {
      return available < requested
        ? `${available} tarjetas disponibles de hasta ${requested} solicitadas`
        : `${available} tarjetas disponibles`;
    }
    if (langKey === "en") {
      return available < requested
        ? `${available} cards available of up to ${requested} requested`
        : `${available} cards available`;
    }
    if (langKey === "de") {
      return available < requested
        ? `${available} Karten verfügbar von bis zu ${requested} angeforderten`
        : `${available} Karten verfügbar`;
    }
    return available < requested
      ? `${available} cartões disponíveis de até ${requested} solicitados`
      : `${available} cartões disponíveis`;
  }, [activeDeck, langKey]);

  const hasActiveStudyProgress = Boolean(activeDeck && (currentIndex > 0 || sessionResults.length > 0 || isFlipped));
  const hasPendingPopoverChanges = Boolean(
    activeDeck && (
      String(draftTopic || "").trim() !== String(activeDeck.topic || "").trim() ||
      draftDifficulty !== activeDeck.difficulty ||
      resolveRequestedCardCount(draftCardCount) !== (activeDeck.requestedCount || activeDeck.cards?.length)
    )
  );

  return (
    <A26FeatureShell
      variant="tool"
      className="a26-flashcards-container"
      header={
        <A26PageHeader
          variant="compact"
          eyebrow={activeDeck ? (activeDeck.system || t("flashcards.kicker", { defaultValue: "Revisão Ativa & Repetição Espaçada SM-2" })) : t("flashcards.kicker", { defaultValue: "Revisão Ativa & Repetição Espaçada SM-2" })}
          title={activeDeck ? activeDeck.title : t("flashcards.title", { defaultValue: "Flashcards Anatômicos Inteligentes" })}
          description={null}
          primaryAction={
            activeDeck ? (
              <div className="flex items-center gap-2">
                <A26Button
                  variant={isConfigDrawerOpen ? "liquid" : "ghost"}
                  size="sm"
                  onClick={handleOpenAdjustPopover}
                  icon={<LineIcon name="settings" />}
                  aria-expanded={isConfigDrawerOpen}
                  aria-haspopup="dialog"
                  title={isConfigDrawerOpen ? "Fechar painel de parâmetros" : "Ajustar parâmetros do baralho"}
                >
                  ⚙️ {isConfigDrawerOpen ? t("actions.close", { defaultValue: "Fechar Ajuste" }) : t("actions.configure", { defaultValue: "Ajustar Baralho" })}
                </A26Button>
                {!isDeckSaved && (
                  <A26Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveCurrentDeck}
                    icon={<LineIcon name="bookmark" />}
                  >
                    ⭐ {t("actions.save", { defaultValue: "Salvar" })}
                  </A26Button>
                )}
                <A26Button
                  variant="liquid"
                  size="sm"
                  onClick={() => {
                    handleCancelGeneration();
                    setActiveDeck(null);
                    setIsConfigDrawerOpen(false);
                    setValidationError("");
                    setOperationalError("");
                  }}
                  icon={<LineIcon name="reset" />}
                >
                  {t("flashcards.newDeck", { defaultValue: "Novo Baralho" })}
                </A26Button>
              </div>
            ) : null
          }
        />
      }
    >
      {/* Mode 1: Modern Proportional Initial Configurator */}
      {!activeDeck && (
        <FlashcardDeckConfigurator
          mode="initial"
          open
          langKey={langKey}
          connectionMode={connectionMode}
          topicValue={topicInput}
          onTopicChange={(val) => {
            setTopicInput(val);
            if (validationError) setValidationError("");
          }}
          cardCountValue={cardCount}
          onCardCountChange={setCardCount}
          difficultyValue={difficulty}
          onDifficultyChange={setDifficulty}
          quickTopicChips={quickTopicChips}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          validationError={validationError}
          operationalError={operationalError}
          generationNotice={generationNotice}
          onGenerateAI={() => handleGenerateDeck({ fromPopover: false })}
          onUseCurated={() => handleLoadCuratedFallback({ fromPopover: false })}
          onCancelGeneration={handleCancelGeneration}
          savedDecks={savedDecks}
          onLoadSavedDeck={handleLoadSavedDeck}
          onDeleteSavedDeck={handleDeleteSavedDeck}
        />
      )}

      {/* Mode 2: Interactive 3D Player — Single Unified Flashcard with Flip in Place */}
      {activeDeck && !isFinished && currentCard && (
        <div className="a26-flashcard-player-container">
          {/* Active Deck Status Bar */}
          <div className="a26-flashcard-active-bar" role="region" aria-label="Progresso e status do baralho">
            <div className="a26-deck-status-left">
              <span className="a26-deck-chip a26-deck-chip--difficulty">
                {activeDeck.difficulty}
              </span>
              <span
                className={`a26-deck-chip a26-deck-chip--mode is-mode-${normalizedActiveMode}`}
                data-generation-mode={normalizedActiveMode}
              >
                {activeModeLabel}
              </span>
              <span className="a26-deck-availability-tag" title={activeAvailabilitySummary}>
                {activeAvailabilitySummary}
              </span>
              {currentCard.sourceCitation && (
                <span className="a26-deck-source-tag" title={currentCard.sourceCitation}>
                  {currentCard.sourceCitation}
                </span>
              )}
              {currentCard.quarantine && (
                <span className="a26-deck-quarantine-tag" title={currentCard.quarantineReason || "Sob revisão científica"}>
                  ⚠️ {t("flashcards.quarantineBadge", { defaultValue: "Sob Revisão Científica" })}
                </span>
              )}
            </div>

            <div className="a26-deck-status-center">
              <div className="a26-deck-counter-label">
                <span>{t("flashcards.cardProgress", { defaultValue: "Card" })}</span>
                <strong>{currentIndex + 1}</strong>
                <span>/ {activeDeck.cards.length}</span>
              </div>
              <div
                className="a26-deck-progress-track"
                role="progressbar"
                aria-valuenow={currentIndex + 1}
                aria-valuemin={1}
                aria-valuemax={activeDeck.cards.length}
              >
                <div
                  className="a26-deck-progress-fill"
                  style={{ width: `${Math.round(((currentIndex + 1) / activeDeck.cards.length) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Floating Adjust Deck Popover / Mobile Bottom Sheet (Never Displaces 3D Card!) */}
          <FlashcardDeckConfigurator
            mode="popover"
            open={isConfigDrawerOpen}
            langKey={langKey}
            connectionMode={connectionMode}
            topicValue={draftTopic}
            onTopicChange={(val) => {
              setDraftTopic(val);
              if (validationError) setValidationError("");
            }}
            cardCountValue={draftCardCount}
            onCardCountChange={setDraftCardCount}
            difficultyValue={draftDifficulty}
            onDifficultyChange={setDraftDifficulty}
            quickTopicChips={quickTopicChips}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            validationError={validationError}
            operationalError={operationalError}
            generationNotice={generationNotice}
            hasActiveStudyProgress={hasActiveStudyProgress}
            hasPendingChanges={hasPendingPopoverChanges}
            onGenerateAI={() => handleGenerateDeck({ fromPopover: true })}
            onUseCurated={() => handleLoadCuratedFallback({ fromPopover: true })}
            onCancelGeneration={handleCancelGeneration}
            onClose={() => setIsConfigDrawerOpen(false)}
          />

          {scheduledNotice && (
            <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 text-center w-full">
              {scheduledNotice}
            </div>
          )}

          {/* Preserved 3D Flashcard Stage (Approved In-Place Flip Mechanism) */}
          <div className="a26-flashcard-stage">
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

            {/* Single Unified 3D Flip Card */}
            <div
              className={`a26-flashcard-3d-wrapper ${isFlipped ? "is-flipped" : ""}`}
              onClick={() => setIsFlipped((prev) => !prev)}
              onKeyDown={(event) => {
                if (["Enter", " "].includes(event.key)) {
                  event.preventDefault();
                  setIsFlipped((prev) => !prev);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={isFlipped ? t("flashcards.hideAnswer", { defaultValue: "Mostrar pergunta" }) : t("flashcards.showAnswer", { defaultValue: "Mostrar resposta" })}
            >
              {/* Front Side: Minimal & Balanced Pergunta */}
              <A26Surface material="regular" tone="teal" className="a26-flashcard-face a26-flashcard-face--front">
                <div className="a26-flashcard-header">
                  <span className="a26-kicker">{t("flashcards.frontSide", { defaultValue: "Frente" })}</span>
                  <span className="a26-flashcard-citation">{currentCard.topic}</span>
                </div>

                <div className={`a26-flashcard-body ${(currentCard.front?.length || 0) > 130 || currentCard.front?.includes("\n") ? "is-long-content" : ""}`}>
                  {currentCard.imageUrl && (
                    <img src={currentCard.imageUrl} alt={currentCard.topic} className="a26-flashcard-img" />
                  )}
                  <p className="a26-flashcard-text">{currentCard.front}</p>
                </div>

                <div className="a26-flashcard-footer">
                  <span className="a26-flashcard-hint">
                    {t("flashcards.flipCardHint", { defaultValue: "Espaço ou Enter para virar · 1 (Erro) · 2 (Acerto) · E (Explicar)" })}
                  </span>
                </div>
              </A26Surface>

              {/* Back Side: Resposta Anatômica + Tutor IA */}
              <A26Surface material="regular" tone="gold" className="a26-flashcard-face a26-flashcard-face--back">
                <div className="a26-flashcard-header">
                  <span className="a26-kicker text-agedGold">{t("flashcards.backSide", { defaultValue: "Verso · Resposta" })}</span>
                  <span className="a26-flashcard-citation">{currentCard.sourceCitation}</span>
                </div>

                <div className={`a26-flashcard-body ${((currentCard.back?.length || 0) + (currentCard.explanation?.length || 0) > 130 || currentCard.back?.includes("\n")) ? "is-long-content" : ""}`}>
                  {currentCard.quarantine && (
                    <div className="a26-flashcard-quarantine-notice">
                      <span className="a26-quarantine-icon">⚠️</span>
                      <span>{t("flashcards.quarantineNotice", { defaultValue: "Contradição anatômica fática detectada. Use 'Explicar com Tutor IA' para visualizar a anatomia canônica corrigida." })}</span>
                    </div>
                  )}
                  <p className="a26-flashcard-text a26-flashcard-answer-text">{currentCard.back}</p>
                  {currentCard.explanation ? (
                    <p className="a26-flashcard-explanation">{currentCard.explanation}</p>
                  ) : null}
                </div>

                <div className="a26-flashcard-footer">
                  <span className="a26-flashcard-hint">
                    {t("flashcards.flipCardHint", { defaultValue: "Avalie sua retenção abaixo" })}
                  </span>
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

          {/* Anki SM-2 Navigation & Rating Controls */}
          <A26Toolbar label={t("flashcards.title", { defaultValue: "Avaliação do cartão" })} className="a26-anki-controls">
            <A26Button
              type="button"
              variant="ghost"
              aria-label={t("agenda.previous", { defaultValue: "Cartão anterior" })}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
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
              onClick={() => setCurrentIndex((prev) => Math.min(activeDeck.cards.length - 1, prev + 1))}
              disabled={currentIndex >= activeDeck.cards.length - 1}
            >
              ›
            </A26Button>
          </A26Toolbar>
        </div>
      )}

      {/* Mode 3: Final Performance Report & Spaced Repetition Scheduling */}
      {activeDeck && isFinished && (
        <A26Card material="substantial" tone="teal" className="a26-performance-report-card">
          <span className="a26-kicker">{t("flashcards.kicker", { defaultValue: "Relatório de Desempenho e Repetição Espaçada SM-2" })}</span>
          <h2 className="text-2xl font-bold text-agedGold">{t("flashcards.congratulations", { defaultValue: "Parabéns! Revisão Concluída" })}</h2>
          <p className="text-sm text-textMuted max-w-xl mx-auto">
            {t("flashcards.reportSubtitle", { defaultValue: "Seus resultados foram registrados no motor de repetição espaçada SM-2 e na telemetria acadêmica." })}
          </p>

          <div className="a26-report-metrics-grid">
            <A26Metric label={t("flashcards.retentionRate", { defaultValue: "Taxa de Retenção" })} value={`${performanceStats.rate}%`} tone="teal" />
            <A26Metric label={t("flashcards.masteredCards", { defaultValue: "Cartões Dominados" })} value={String(performanceStats.correct)} tone="teal" />
            <A26Metric label={t("flashcards.needsReview", { defaultValue: "Para Revisar" })} value={String(performanceStats.wrong)} tone="gold" />
          </div>

          <div className="a26-topics-mastery-list">
            <div className="a26-topic-column is-strong">
              <h3 className="text-emerald-400 font-semibold">✓ {t("flashcards.strongTopics", { defaultValue: "Conceitos Consolidados" })}</h3>
              {masteredTopics.length ? (
                <ul>{masteredTopics.map((topic) => <li key={topic}>• {topic}</li>)}</ul>
              ) : (
                <p className="text-xs text-textMuted">—</p>
              )}
            </div>

            <div className="a26-topic-column is-weak">
              <h3 className="text-rose-400 font-semibold">! {t("flashcards.weakTopics", { defaultValue: "Prioridade de Revisão" })}</h3>
              {reviewTopics.length ? (
                <ul>{reviewTopics.map((topic) => <li key={topic}>• {topic}</li>)}</ul>
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
              <A26Button variant="primary" onClick={handleRestartWrongOnly}>
                🔄 {t("flashcards.reviewErrorsOnly", { defaultValue: `Revisar Apenas Erros (${performanceStats.wrong})` })}
              </A26Button>
            )}
            <A26Button variant="liquid" onClick={() => handleScheduleReview(1)}>
              📅 {t("flashcards.scheduleTomorrow", { defaultValue: "Agendar Revisão (Amanhã)" })}
            </A26Button>
            <A26Button variant="ghost" onClick={handleSaveCurrentDeck} disabled={isDeckSaved}>
              ⭐ {isDeckSaved ? t("flashcards.saved", { defaultValue: "Salvo na Coleção" }) : t("flashcards.saveDeck", { defaultValue: "Salvar Baralho" })}
            </A26Button>
            <A26Button
              variant="ghost"
              onClick={() => {
                setActiveDeck(null);
                setIsFinished(false);
                setSessionResults([]);
              }}
            >
              {t("flashcards.newDeck", { defaultValue: "Novo Baralho" })}
            </A26Button>
          </div>
        </A26Card>
      )}
    </A26FeatureShell>
  );
}

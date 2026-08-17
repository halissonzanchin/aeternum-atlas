import { createAgendaEvent } from "../studyAgendaService.js";
import { getSupabaseClient } from "../supabase/supabaseClient.js";

const STORAGE_KEY_PREFIX = "aeternum_flashcard_sm2_data";
const SAVED_DECK_VERSION = 2;

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeSavedDeck(deck, deckIndex = 0) {
  if (!deck || !Array.isArray(deck.cards)) return null;

  const seenQuestions = new Set();
  const seenAnswers = new Set();
  const cards = deck.cards.reduce((result, card, cardIndex) => {
    const front = String(card?.front || "").trim();
    const back = String(card?.back || "").trim();
    const questionKey = normalizeText(front);
    const answerKey = normalizeText(back);
    if (!questionKey || !answerKey || seenQuestions.has(questionKey) || seenAnswers.has(answerKey)) {
      return result;
    }

    seenQuestions.add(questionKey);
    seenAnswers.add(answerKey);
    result.push({
      ...card,
      id: card.id || `legacy-card-${deckIndex}-${cardIndex}`,
      front,
      back,
      difficulty: card.difficulty || deck.difficulty || "Médio",
      sourceCitation: card.origin === "curated" || card.origin === "tutor"
        ? card.sourceCitation
        : "Baralho salvo anteriormente",
      origin: card.origin || "legacy",
      imageUrl: card.imageVerified === true ? card.imageUrl : undefined
    });
    return result;
  }, []);

  if (!cards.length) return null;
  return {
    ...deck,
    id: deck.id || `legacy-deck-${deckIndex}`,
    version: SAVED_DECK_VERSION,
    cards
  };
}

export function getCardRepetitionData(userId = "default", cardId = "") {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}:${userId}`);
    if (!raw) return getDefaultCardData(cardId);
    const store = JSON.parse(raw);
    return store[cardId] || getDefaultCardData(cardId);
  } catch (err) {
    console.warn("Erro ao ler dados SM-2:", err);
    return getDefaultCardData(cardId);
  }
}

export function recordCardReview(userId = "default", cardId = "", rating = "good") {
  // Rating values: 'again' (1), 'hard' (2), 'good' (4), 'easy' (5)
  const current = getCardRepetitionData(userId, cardId);
  let { repetitions, easeFactor, interval } = current;

  let quality = 4;
  if (rating === "again") quality = 1;
  if (rating === "hard") quality = 2;
  if (rating === "good") quality = 4;
  if (rating === "easy") quality = 5;

  // Calculate new Ease Factor (EF)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Calculate new interval (in days)
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  const updatedData = {
    cardId,
    repetitions,
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    lastReviewed: new Date().toISOString(),
    nextReviewDate: nextReviewDate.toISOString()
  };

  saveCardRepetitionData(userId, cardId, updatedData);
  return updatedData;
}

function saveCardRepetitionData(userId, cardId, data) {
  try {
    const key = `${STORAGE_KEY_PREFIX}:${userId}`;
    const raw = localStorage.getItem(key);
    const store = raw ? JSON.parse(raw) : {};
    store[cardId] = data;
    localStorage.setItem(key, JSON.stringify(store));
  } catch (err) {
    console.warn("Erro ao salvar dados SM-2:", err);
  }
}

function getDefaultCardData(cardId) {
  return {
    cardId,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 1,
    lastReviewed: null,
    nextReviewDate: new Date().toISOString()
  };
}

export function getSavedDecks(userId = "default") {
  try {
    const key = `aeternum_saved_flashcard_decks:${userId}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(normalizeSavedDeck)
      .filter(Boolean);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(key, JSON.stringify(normalized));
    }
    return normalized;
  } catch (err) {
    return [];
  }
}

export function saveDeckToCollection(userId = "default", deck) {
  if (!deck || !deck.cards) return;
  try {
    const saved = getSavedDecks(userId);
    const existsIndex = saved.findIndex(d => d.title === deck.title);
    const updatedDeck = {
      ...deck,
      id: deck.id || `saved-deck-${Date.now()}`,
      version: SAVED_DECK_VERSION,
      savedAt: new Date().toISOString()
    };

    if (existsIndex >= 0) {
      saved[existsIndex] = updatedDeck;
    } else {
      saved.unshift(updatedDeck);
    }

    localStorage.setItem(`aeternum_saved_flashcard_decks:${userId}`, JSON.stringify(saved));
    return true;
  } catch (err) {
    console.warn("Erro ao salvar baralho:", err);
    return false;
  }
}

export function deleteDeckFromCollection(userId = "default", deckIdOrTitle = "") {
  try {
    const saved = getSavedDecks(userId);
    const filtered = saved.filter(d => d.id !== deckIdOrTitle && d.title !== deckIdOrTitle);
    localStorage.setItem(`aeternum_saved_flashcard_decks:${userId}`, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.warn("Erro ao excluir baralho da coleção:", err);
    return getSavedDecks(userId);
  }
}

export async function scheduleFlashcardStudyEvent(user, topicTitle = "", intervalDays = 1) {
  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + intervalDays);
    const dateStr = targetDate.toISOString().split("T")[0];

    const payload = {
      title: `Revisão Espaçada: ${topicTitle}`,
      description: `Sessão de repetição espaçada agendada automaticamente pelo motor SM-2 para o tema ${topicTitle}.`,
      date: dateStr,
      startTime: "09:00",
      endTime: "10:00",
      type: "flashcards",
      priority: "medium",
      anatomicalSystem: "Geral",
      linkedFlashcardDeck: topicTitle,
      linkedFlashcardRoute: "/flashcards",
      reminder: "15min",
      status: "pending"
    };

    let currentUser = user;
    if (!currentUser?.id) {
      const { data } = await getSupabaseClient().auth.getSession();
      if (data?.session?.user) {
        currentUser = data.session.user;
      }
    }

    if (currentUser?.id) {
      const { event, error } = await createAgendaEvent(currentUser, payload);
      if (event) {
        return {
          ...event,
          date: dateStr,
          time: event.startTime || "09:00"
        };
      }
      if (error) {
        console.warn("Falha ao criar evento remoto na agenda:", error);
      }
    }

    // Fallback estruturado
    return {
      id: `evt-flashcard-${Date.now()}`,
      title: `Revisão Espaçada: ${topicTitle}`,
      date: dateStr,
      time: "09:00",
      type: "flashcards",
      location: "/flashcards",
      description: `Sessão de repetição espaçada agendada automaticamente pelo motor SM-2 para o tema ${topicTitle}.`,
      status: "pending"
    };
  } catch (err) {
    console.warn("Erro ao agendar evento de estudo:", err);
    return null;
  }
}

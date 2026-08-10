/**
 * Motor de Repetição Espaçada SM-2 (SuperMemo / Anki Spaced Repetition Algorithm)
 * Calcula fatores de facilidade (Ease Factor - EF), intervalos e datas de próxima revisão.
 */

const STORAGE_KEY_PREFIX = "aeternum_flashcard_sm2_data";

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
    const raw = localStorage.getItem(`aeternum_saved_flashcard_decks:${userId}`);
    return raw ? JSON.parse(raw) : [];
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

export function scheduleFlashcardStudyEvent(topicTitle = "", intervalDays = 1) {
  try {
    const raw = localStorage.getItem("aeternum_study_events");
    const events = raw ? JSON.parse(raw) : [];
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + intervalDays);

    const newEvent = {
      id: `evt-flashcard-${Date.now()}`,
      title: `Revisão Espaçada RAG: ${topicTitle}`,
      date: targetDate.toISOString().split("T")[0],
      time: "09:00",
      category: "Revisão Espaçada",
      system: "Flashcards",
      location: "/flashcards",
      description: `Sessão de repetição espaçada agendada automaticamente pelo motor SM-2 para o tema ${topicTitle}.`,
      status: "pending"
    };

    events.unshift(newEvent);
    localStorage.setItem("aeternum_study_events", JSON.stringify(events));
    return newEvent;
  } catch (err) {
    console.warn("Erro ao agendar evento de estudo:", err);
    return null;
  }
}

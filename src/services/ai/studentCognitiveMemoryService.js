/**
 * Memória Cognitiva & Repetição Espaçada do Estudante
 * Armazena e analisa acertos, dúvidas recorrentes e tópicos fracos
 */

const STORAGE_KEY = "aeternum_student_cognitive_memory_v1";

export const studentCognitiveMemoryService = {
  getMemory() {
    if (typeof window === "undefined") return { weakTopics: [], studiedTopics: [], lastActive: null };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { weakTopics: [], studiedTopics: [], lastActive: null };
    } catch {
      return { weakTopics: [], studiedTopics: [], lastActive: null };
    }
  },

  recordTopicReview(topicName, successScore = 100) {
    if (!topicName || typeof window === "undefined") return;
    const memory = this.getMemory();
    const existingIndex = memory.studiedTopics.findIndex((t) => t.name?.toLowerCase() === topicName.toLowerCase());

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      memory.studiedTopics[existingIndex].reviewCount += 1;
      memory.studiedTopics[existingIndex].lastScore = successScore;
      memory.studiedTopics[existingIndex].lastReviewed = now;
    } else {
      memory.studiedTopics.push({
        name: topicName,
        reviewCount: 1,
        lastScore: successScore,
        lastReviewed: now
      });
    }

    // Se o score foi baixo (< 70), registra como tópico fraco para revisão futura
    if (successScore < 70) {
      if (!memory.weakTopics.includes(topicName)) {
        memory.weakTopics.push(topicName);
      }
    } else {
      memory.weakTopics = memory.weakTopics.filter((t) => t.toLowerCase() !== topicName.toLowerCase());
    }

    memory.lastActive = now;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch (e) {
      console.warn("[CognitiveMemory] Falha ao persistir no localStorage", e);
    }
  },

  getProactiveReviewSuggestion() {
    const memory = this.getMemory();
    if (memory.weakTopics.length > 0) {
      const weak = memory.weakTopics[0];
      return {
        hasSuggestion: true,
        topic: weak,
        prompt: `Notei que você recentemente revisou "${weak}". Gostaria de fazer uma sessão rápida de 3 perguntas para consolidar sua retenção?`
      };
    }
    return { hasSuggestion: false };
  }
};

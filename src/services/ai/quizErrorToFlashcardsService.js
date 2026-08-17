import { saveDeckToCollection, scheduleFlashcardStudyEvent } from "./flashcardSpacedRepetitionService.js";

/**
 * Extrai erros de um simulado teórico estruturado (múltipla escolha, V/F, emparelhamento, lacunas e respostas curtas).
 */
export function extractTheoreticalErrorsToCards(quiz, answers = {}, result = null, model = null) {
  if (!quiz) return [];
  const cards = [];
  const sections = quiz.sections || [];

  sections.forEach(section => {
    const questions = section.questions || [];

    questions.forEach((q, qIndex) => {
      const studentAnswer = answers[q.id];

      // Múltipla escolha
      if (section.id === "multiple") {
        const isCorrect = studentAnswer !== undefined && studentAnswer === q.correctIndex;
        if (!isCorrect) {
          const correctOptionText = q.options?.[q.correctIndex] || "Opção correta";
          const explanation = q.explanations?.[q.correctIndex] || "Revisão do conceito anatômico fundamental.";
          cards.push({
            id: `err-theory-${q.id || qIndex}-${Date.now()}`,
            front: `[${section.title}] ${q.question}`,
            back: correctOptionText,
            explanation: explanation,
            difficulty: "Médio",
            topic: q.topic || section.title || "Anatomia Geral",
            sourceCitation: `Simulado Teórico: ${quiz.title || model?.title || "Atlas"}`,
            origin: "quiz-error",
            modelId: model?.id || quiz.id,
            modelTitle: model?.title || quiz.title
          });
        }
      }

      // Verdadeiro ou Falso
      else if (section.id === "truefalse") {
        const isCorrect = studentAnswer !== undefined && studentAnswer === q.correctValue;
        if (!isCorrect) {
          const correctValLabel = q.correctValue ? "VERDADEIRO" : "FALSO";
          cards.push({
            id: `err-tf-${q.id || qIndex}-${Date.now()}`,
            front: `[V/F] ${q.statement}`,
            back: `${correctValLabel}: ${q.explanation || ""}`,
            explanation: q.explanation || "Conceito anátomo-fisiológico.",
            difficulty: "Médio",
            topic: q.topic || section.title || "Anatomia Geral",
            sourceCitation: `Simulado Teórico: ${quiz.title || "Atlas"}`,
            origin: "quiz-error",
            modelId: model?.id,
            modelTitle: model?.title
          });
        }
      }

      // Emparelhamento (Matching)
      else if (section.id === "matching") {
        const isCorrect = studentAnswer !== undefined && studentAnswer === q.correctMatchId;
        if (!isCorrect) {
          const matchTarget = (section.targets || []).find(t => t.id === q.correctMatchId);
          cards.push({
            id: `err-match-${q.id || qIndex}-${Date.now()}`,
            front: `[Correspondência Anatômica] ${q.premise}`,
            back: matchTarget ? matchTarget.label : "Correspondência correta",
            explanation: q.clinicalRelation || "Relação anátomo-topográfica.",
            difficulty: "Difícil",
            topic: section.title || "Anatomia Topográfica",
            sourceCitation: `Simulado Teórico: ${quiz.title || "Atlas"}`,
            origin: "quiz-error",
            modelId: model?.id,
            modelTitle: model?.title
          });
        }
      }

      // Preenchimento de Lacunas (Fill-in)
      else if (section.id === "fill") {
        const studentText = String(studentAnswer || "").trim().toLowerCase();
        const accepted = (q.acceptedAnswers || [q.correctAnswer || ""]).map(a => String(a).trim().toLowerCase());
        const isCorrect = accepted.includes(studentText);
        if (!isCorrect) {
          cards.push({
            id: `err-fill-${q.id || qIndex}-${Date.now()}`,
            front: `[Preenchimento de Lacuna] ${q.template}`,
            back: q.correctAnswer || accepted[0] || "",
            explanation: q.explanation || "Terminologia anatômica oficial.",
            difficulty: "Médio",
            topic: section.title || "Anatomia",
            sourceCitation: `Simulado Teórico: ${quiz.title || "Atlas"}`,
            origin: "quiz-error",
            modelId: model?.id,
            modelTitle: model?.title
          });
        }
      }

      // Questões Curtas / Casos Clínicos (Short answers)
      else if (section.id === "short") {
        cards.push({
          id: `err-short-${q.id || qIndex}-${Date.now()}`,
          front: `[Caso Clínico] ${q.caseDescription || q.question}`,
          back: q.modelAnswer || "Resposta modelo",
          explanation: q.clinicalCriteria || q.criteria || "Critério de avaliação clínica.",
          difficulty: "Difícil",
          topic: q.topic || section.title || "Correlação Clínica",
          sourceCitation: `Simulado Teórico: ${quiz.title || "Atlas"}`,
          origin: "quiz-error",
          modelId: model?.id,
          modelTitle: model?.title
        });
      }
    });
  });

  return cards;
}

/**
 * Extrai erros de marcações anatômicas 3D não identificadas ou erradas.
 */
export function extractAnatomicalErrorsToCards(quiz, answers = {}, result = null, model = null) {
  if (!quiz || !Array.isArray(quiz.questions)) return [];
  const cards = [];
  const corrections = result?.corrections || [];

  quiz.questions.forEach((q, index) => {
    const correction = corrections.find(item => item.questionId === q.id);
    const isCorrect = correction ? correction.isCorrect : false;

    if (!isCorrect) {
      cards.push({
        id: `err-anat-${q.id || index}-${Date.now()}`,
        front: `[Identificação Anatômica 3D] Qual estrutura anatômica corresponde à marcação ${q.markerLabel || `#${index + 1}`} no modelo ${model?.title || quiz?.title}?`,
        back: q.expectedAnswer || q.label || correction?.correctAnswer || "Estrutura anatômica",
        explanation: `Identificação espacial no modelo 3D: ${model?.title || quiz?.title}. Estrutura: ${q.expectedAnswer || q.label || "Anatomia"}.`,
        difficulty: "Médio",
        topic: q.system || model?.category || "Anatomia 3D",
        sourceCitation: `Simulado 3D: ${model?.title || "Atlas"}`,
        origin: "quiz-error",
        modelId: model?.id,
        modelTitle: model?.title
      });
    }
  });

  return cards;
}

/**
 * Cria o baralho de reforço na coleção do estudante e agenda a repetição espaçada.
 */
export async function convertErrorsToStudyDeckAndSchedule({
  user,
  deckTitle = "Reforço de Erros",
  cards = [],
  modelId = "",
  modelTitle = "",
  intervalDays = 1
}) {
  if (!cards.length) return null;

  const userId = user?.id || "student-default";
  const finalDeckTitle = deckTitle.startsWith("Reforço:") ? deckTitle : `Reforço: ${deckTitle}`;

  const deck = {
    id: `deck-errors-${Date.now()}`,
    title: finalDeckTitle,
    difficulty: "Médio",
    theme: "Reforço de Simulado",
    modelId,
    modelTitle,
    origin: "quiz-errors",
    cards
  };

  // 1. Salva o baralho na coleção permanente
  saveDeckToCollection(userId, deck);

  // 2. Agenda a revisão na agenda de estudos canônica
  const event = await scheduleFlashcardStudyEvent(user, finalDeckTitle, intervalDays);

  return {
    deck,
    event,
    cardCount: cards.length
  };
}

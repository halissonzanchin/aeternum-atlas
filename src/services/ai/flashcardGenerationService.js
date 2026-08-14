import {
  FLASHCARD_DIFFICULTIES,
  normalizeFlashcardText,
  selectCuratedFlashcards
} from "../../data/anatomicalFlashcardBank";
import { atlasAITutorService } from "../../features/atlas-viewer/ai/atlasAITutorService";

const CARD_COUNTS = Object.freeze({ few: 5, standard: 10, many: 20 });
const GENERATED_SOURCE = "Tutor IA · conteúdo gerado";

function resolveDifficulty(value) {
  return FLASHCARD_DIFFICULTIES.includes(value) ? value : "Médio";
}

function stableHash(value = "") {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function parseJsonArray(text = "") {
  const normalized = String(text).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = normalized.indexOf("[");
  const end = normalized.lastIndexOf("]");
  if (start < 0 || end <= start) return [];

  try {
    const parsed = JSON.parse(normalized.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeTutorCard(entry, { topic, difficulty, index }) {
  const front = String(entry?.front || "").trim();
  const back = String(entry?.back || "").trim();
  const explanation = String(entry?.explanation || "").trim();
  const learningObjective = String(entry?.learningObjective || "Integração anatômica").trim();

  if (front.length < 18 || back.length < 3 || explanation.length < 18) return null;
  if (/estrutura médica correspondente|tratado de anatomia|tuberosidade ou crista/i.test(`${front} ${back}`)) return null;

  return {
    id: `fc-ai-${stableHash(`${topic}|${difficulty}|${front}|${index}`)}`,
    topic,
    difficulty,
    learningObjective,
    front,
    back,
    explanation,
    sourceCitation: GENERATED_SOURCE,
    origin: "tutor"
  };
}

function deduplicateCards(cards = []) {
  const seenQuestions = new Set();
  const seenAnswers = new Set();

  return cards.filter((entry) => {
    const questionKey = normalizeFlashcardText(entry?.front);
    const answerKey = normalizeFlashcardText(entry?.back);
    if (!questionKey || !answerKey || seenQuestions.has(questionKey) || seenAnswers.has(answerKey)) return false;
    seenQuestions.add(questionKey);
    seenAnswers.add(answerKey);
    return true;
  });
}

function buildTutorPrompt({ topic, difficulty, count, existingCards }) {
  const existingQuestions = existingCards.map((entry) => `- ${entry.front}`).join("\n") || "- nenhuma";
  return [
    "Você está gerando flashcards para uma plataforma acadêmica de anatomia humana.",
    `Tema: ${topic}`,
    `Dificuldade: ${difficulty}`,
    `Quantidade: ${count}`,
    "Retorne SOMENTE um array JSON válido, sem markdown e sem texto adicional.",
    "Cada item deve conter: front, back, explanation e learningObjective.",
    "Crie questões diferentes entre si, com uma única resposta inequívoca e linguagem anatômica precisa.",
    "Distribua objetivos entre reconhecimento, relações espaciais, função, integração clínica e raciocínio aplicado.",
    "Não invente páginas, capítulos, livros, imagens, estatísticas ou referências bibliográficas.",
    "Não produza placeholders, respostas genéricas nem repita o mesmo fato com outras palavras.",
    "Evite repetir estas perguntas já presentes no baralho:",
    existingQuestions
  ].join("\n");
}

async function generateTutorCards({ topic, difficulty, count, existingCards }) {
  if (count <= 0) return [];
  const response = await atlasAITutorService.processMessageStream(
    buildTutorPrompt({ topic, difficulty, count, existingCards }),
    {
      source: "flashcards",
      route: "/flashcards",
      sectionTitle: topic,
      sectionQuestion: `Gerar ${count} flashcards de nível ${difficulty}`
    }
  );

  if (response?.mode !== "online" || !response?.text) return [];
  return parseJsonArray(response.text)
    .map((entry, index) => sanitizeTutorCard(entry, { topic, difficulty, index }))
    .filter(Boolean);
}

export async function generateAnatomicalFlashcards({
  topic = "",
  difficulty = "Médio",
  cardCount = "standard"
} = {}) {
  const requestedCount = CARD_COUNTS[cardCount] || CARD_COUNTS.standard;
  const cleanTopic = String(topic || "").trim();
  const resolvedDifficulty = resolveDifficulty(difficulty);
  if (!cleanTopic) throw new Error("Informe um tema anatômico para gerar o baralho.");

  const curatedSelection = selectCuratedFlashcards({
    topic: cleanTopic,
    difficulty: resolvedDifficulty,
    count: requestedCount
  });
  const curatedCards = curatedSelection.cards;
  const canonicalTopic = curatedSelection.matchedTopic?.title || cleanTopic;
  const missingCount = Math.max(0, requestedCount - curatedCards.length);

  let tutorCards = [];
  if (missingCount > 0) {
    tutorCards = await generateTutorCards({
      topic: canonicalTopic,
      difficulty: resolvedDifficulty,
      count: missingCount,
      existingCards: curatedCards
    });
  }

  const cards = deduplicateCards([...curatedCards, ...tutorCards]).slice(0, requestedCount);
  if (!cards.length) {
    throw new Error("O Tutor IA não conseguiu gerar um baralho confiável agora. Tente novamente quando a conexão estiver disponível ou escolha um tema curado.");
  }

  const generationMode = curatedCards.length && tutorCards.length
    ? "hybrid"
    : tutorCards.length
      ? "tutor"
      : "curated";
  const generationNotice = cards.length < requestedCount
    ? `Foram preparados ${cards.length} cartões únicos dos ${requestedCount} solicitados. Não duplicamos perguntas para completar artificialmente o baralho.`
    : generationMode === "hybrid"
      ? "Baralho híbrido: banco editorial Aeternum 26.1 complementado pelo Tutor IA autenticado."
      : generationMode === "tutor"
        ? "Baralho personalizado gerado pelo Tutor IA autenticado. Revise criticamente conteúdos clínicos antes de aplicá-los."
        : "Baralho composto pelo banco editorial Aeternum 26.1, sem repetição de perguntas. Use-o para estudo e submeta conteúdos avaliativos à revisão docente.";

  return {
    id: `deck-${stableHash(`${canonicalTopic}|${resolvedDifficulty}|${cards.map((entry) => entry.id).join("|")}`)}`,
    title: `Flashcards: ${canonicalTopic}`,
    topic: canonicalTopic,
    system: curatedSelection.matchedTopic?.system || "Anatomia humana",
    difficulty: resolvedDifficulty,
    sources: Array.from(new Set(cards.map((entry) => entry.sourceCitation))),
    requestedCount,
    generationMode,
    generationNotice,
    cards
  };
}

export const flashcardGenerationInternals = Object.freeze({
  deduplicateCards,
  parseJsonArray,
  resolveDifficulty
});

import {
  FLASHCARD_DIFFICULTIES,
  normalizeFlashcardText,
  selectCuratedFlashcards
} from "../../data/anatomicalFlashcardBank";
import { atlasAITutorService } from "../../features/atlas-viewer/ai/atlasAITutorService";

const CARD_COUNTS = Object.freeze({ few: 5, standard: 10, many: 20 });
const GENERATED_SOURCES = {
  pt: "Tutor IA · conteúdo gerado",
  es: "Tutor IA · contenido generado",
  en: "AI Tutor · generated content",
  de: "KI-Tutor · generierter Inhalt"
};

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

function sanitizeTutorCard(entry, { topic, difficulty, index, language = "pt" }) {
  const front = String(entry?.front || "").trim();
  const back = String(entry?.back || "").trim();
  const explanation = String(entry?.explanation || "").trim();
  const defaultObj = {
    pt: "Integração anatômica",
    es: "Integración anatómica",
    en: "Anatomical integration",
    de: "Anatomische Integration"
  };
  const learningObjective = String(entry?.learningObjective || defaultObj[language] || "Integração anatômica").trim();

  if (front.length < 18 || back.length < 3 || explanation.length < 18) return null;
  if (/estrutura médica correspondente|tratado de anatomia|tuberosidade ou crista|estructura médica correspondiente/i.test(`${front} ${back}`)) return null;

  const citation = GENERATED_SOURCES[language] || GENERATED_SOURCES.pt;

  return {
    id: `fc-ai-${stableHash(`${topic}|${difficulty}|${front}|${index}`)}`,
    topic,
    difficulty,
    learningObjective,
    front,
    back,
    explanation,
    sourceCitation: citation,
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

function buildTutorPrompt({ topic, difficulty, count, existingCards, language = "pt" }) {
  const existingQuestions = existingCards.map((entry) => `- ${entry.front}`).join("\n") || "- nenhuma";

  const languageDirectives = {
    pt: "Idioma de saída OBRIGATÓRIO: Português (pt-BR). Gere todas as perguntas, respostas e explicações estritamente em português.",
    es: "Idioma de salida OBLIGATORIO: Español (es-ES). Genera todas las preguntas, respuestas y explicaciones estrictamente en español.",
    en: "MANDATORY output language: English (en-US). Generate all questions, answers, and explanations strictly in English.",
    de: "ERFORDERLICHE Ausgabesprache: Deutsch (de-DE). Erstelle alle Fragen, Antworten und Erklärungen ausschließlich auf Deutsch."
  };

  const selectedDirective = languageDirectives[language] || languageDirectives.pt;

  return [
    "Você está gerando flashcards para uma plataforma acadêmica de anatomia humana.",
    selectedDirective,
    `Tema: ${topic}`,
    `Dificuldade: ${difficulty}`,
    `Quantidade: ${count}`,
    "Retorne SOMENTE um array JSON válido, sem markdown e sem texto adicional.",
    "Cada item deve conter: front, back, explanation e learningObjective.",
    "Crie questões diferentes entre si, com uma única resposta inequívoca e linguagem anatômica precisa no idioma solicitado.",
    "Distribua objetivos entre reconhecimento, relações espaciais, função, integração clínica e raciocínio aplicado.",
    "Não invente páginas, capítulos, livros, imagens, estatísticas ou referências bibliográficas.",
    "Não produza placeholders, respostas genéricas nem repita o mesmo fato com outras palavras.",
    "Evite repetir estas perguntas já presentes no baralho:",
    existingQuestions
  ].join("\n");
}

async function generateTutorCards({ topic, difficulty, count, existingCards, language = "pt" }) {
  if (count <= 0) return [];
  const response = await atlasAITutorService.processMessageStream(
    buildTutorPrompt({ topic, difficulty, count, existingCards, language }),
    {
      source: "flashcards",
      route: "/flashcards",
      sectionTitle: topic,
      sectionQuestion: `Gerar ${count} flashcards de nível ${difficulty} no idioma ${language}`,
      language
    }
  );

  if (response?.mode !== "online" || !response?.text) return [];
  return parseJsonArray(response.text)
    .map((entry, index) => sanitizeTutorCard(entry, { topic, difficulty, index, language }))
    .filter(Boolean);
}

export async function generateAnatomicalFlashcards({
  topic = "",
  difficulty = "Médio",
  cardCount = "standard",
  language = "pt"
} = {}) {
  const requestedCount = CARD_COUNTS[cardCount] || CARD_COUNTS.standard;
  const cleanTopic = String(topic || "").trim();
  const resolvedDifficulty = resolveDifficulty(difficulty);
  const langKey = ["pt", "es", "en", "de"].includes(language) ? language : "pt";

  if (!cleanTopic) {
    const errorMsgs = {
      pt: "Informe um tema anatômico para gerar o baralho.",
      es: "Ingresa un tema anatómico para generar la baraja.",
      en: "Please specify an anatomical topic to generate the deck.",
      de: "Geben Sie ein anatomisches Thema ein, um das Deck zu generieren."
    };
    throw new Error(errorMsgs[langKey] || errorMsgs.pt);
  }

  const curatedSelection = selectCuratedFlashcards({
    topic: cleanTopic,
    difficulty: resolvedDifficulty,
    count: requestedCount,
    language: langKey
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
      existingCards: curatedCards,
      language: langKey
    });
  }

  const cards = deduplicateCards([...curatedCards, ...tutorCards]).slice(0, requestedCount);
  if (!cards.length) {
    const errorEmpty = {
      pt: "O Tutor IA não conseguiu gerar um baralho confiável agora. Tente novamente quando a conexão estiver disponível ou escolha um tema curado.",
      es: "El Tutor IA no pudo generar una baraja confiable ahora. Inténtalo de nuevo cuando la conexión esté disponible o elige un tema curado.",
      en: "The AI Tutor could not generate a reliable deck at this time. Please try again when connection is available or select a curated topic.",
      de: "Der KI-Tutor konnte derzeit kein zuverlässiges Deck generieren. Bitte versuchen Sie es später erneut oder wählen Sie ein kuratiertes Thema."
    };
    throw new Error(errorEmpty[langKey] || errorEmpty.pt);
  }

  const generationMode = curatedCards.length && tutorCards.length
    ? "hybrid"
    : tutorCards.length
      ? "tutor"
      : "curated";

  const notices = {
    pt: {
      less: `Foram preparados ${cards.length} cartões únicos dos ${requestedCount} solicitados. Não duplicamos perguntas para completar artificialmente o baralho.`,
      hybrid: "Baralho híbrido: banco editorial Aeternum 26.1 complementado pelo Tutor IA autenticado.",
      tutor: "Baralho personalizado gerado pelo Tutor IA autenticado. Revise criticamente conteúdos clínicos antes de aplicá-los.",
      curated: "Baralho composto pelo banco editorial Aeternum 26.1, sem repetição de perguntas. Use-o para estudo e submeta conteúdos avaliativos à revisão docente."
    },
    es: {
      less: `Se prepararon ${cards.length} tarjetas únicas de las ${requestedCount} solicitadas. No duplicamos preguntas para completar artificialmente el mazo.`,
      hybrid: "Baraja híbrida: banco editorial Aeternum 26.1 complementado por el Tutor IA autenticado.",
      tutor: "Baraja personalizada generada por el Tutor IA autenticado. Revisa críticamente los contenidos clínicos antes de aplicarlos.",
      curated: "Baraja compuesta por el banco editorial Aeternum 26.1, sin repetición de preguntas. Úsala para el estudio y somete contenidos evaluativos a revisión docente."
    },
    en: {
      less: `Prepared ${cards.length} unique cards of the ${requestedCount} requested. We do not duplicate questions to artificially fill the deck.`,
      hybrid: "Hybrid deck: Aeternum 26.1 editorial bank supplemented by authenticated AI Tutor.",
      tutor: "Custom deck generated by authenticated AI Tutor. Critically review clinical content before applying.",
      curated: "Deck composed from the Aeternum 26.1 editorial bank, with zero duplicate questions."
    },
    de: {
      less: `Es wurden ${cards.length} eindeutige Karten von den ${requestedCount} angeforderten vorbereitet. Wir duplizieren keine Fragen, um das Deck künstlich aufzufüllen.`,
      hybrid: "Hybrides Deck: Redaktionelle Aeternum 26.1 Datenbank ergänzt durch den authentifizierten KI-Tutor.",
      tutor: "Benutzerdefiniertes Deck, generiert vom authentifizierten KI-Tutor.",
      curated: "Deck aus der redaktionellen Aeternum 26.1 Datenbank ohne doppelte Fragen."
    }
  };

  const currentNoticeSet = notices[langKey] || notices.pt;
  const generationNotice = cards.length < requestedCount
    ? currentNoticeSet.less
    : currentNoticeSet[generationMode];

  const deckTitles = {
    pt: `Flashcards: ${canonicalTopic}`,
    es: `Flashcards: ${canonicalTopic}`,
    en: `Flashcards: ${canonicalTopic}`,
    de: `Karteikarten: ${canonicalTopic}`
  };

  return {
    id: `deck-${stableHash(`${canonicalTopic}|${resolvedDifficulty}|${cards.map((entry) => entry.id).join("|")}`)}`,
    title: deckTitles[langKey] || deckTitles.pt,
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

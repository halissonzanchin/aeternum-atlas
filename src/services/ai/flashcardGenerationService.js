import {
  FLASHCARD_DIFFICULTIES,
  normalizeFlashcardText,
  selectCuratedFlashcards
} from "../../data/anatomicalFlashcardBank.js";
import { atlasAITutorService } from "../../features/atlas-viewer/ai/atlasAITutorService.js";
import { isTutorSuccess, validateFlashcardSchema } from "./academicTaskContracts.js";

const CARD_COUNTS = Object.freeze({ few: 5, standard: 10, many: 20 });
const GENERATED_SOURCES = {
  pt: "Tutor IA · Evidências Científicas Verificadas",
  es: "Tutor IA · Evidencias Científicas Verificadas",
  en: "AI Tutor · Verified Scientific Evidence",
  de: "KI-Tutor · Verifizierte wissenschaftliche Evidenz"
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

function extractCitationFromText(text, language = "pt") {
  const match = text.match(/\[(SRC-[A-Z0-9-]+|PAS-[A-Z0-9-]+|REF-[A-Z0-9-]+)\]/);
  if (match) {
    const id = match[1];
    if (id.includes("MOORE")) return "Moore Anatomia Orientada para a Clínica [SRC-MOORE-2018]";
    if (id.includes("LATARJET")) return "Latarjet & Ruiz Liard Anatomia Humana [SRC-LATARJET]";
    if (id.includes("NETTER")) return "Netter Atlas de Anatomia Humana [SRC-NETTER]";
    if (id.includes("GRAY")) return "Gray's Anatomia para Estudantes [SRC-GRAYS]";
    return `Evidência Científica Verificada [${id}]`;
  }
  return GENERATED_SOURCES[language] || GENERATED_SOURCES.pt;
}

function sanitizeTutorCard(entry, { topic, difficulty, index, language = "pt", defaultCitation = null }) {
  const front = String(entry?.front || "").trim();
  const back = String(entry?.back || "").trim();
  const explanation = String(entry?.explanation || "").trim();
  const defaultObj = {
    pt: "Integração anatômica e raciocínio clínico",
    es: "Integración anatómica y razonamiento clínico",
    en: "Anatomical integration and clinical reasoning",
    de: "Anatomische Integration und klinische Schlussfolgerung"
  };
  const learningObjective = String(entry?.learningObjective || defaultObj[language] || "Integração anatômica").trim();

  if (front.length < 18 || back.length < 3 || explanation.length < 18) return null;
  if (/estrutura médica correspondente|tratado de anatomia|tuberosidade ou crista|estructura médica correspondiente|placeholder/i.test(`${front} ${back}`)) return null;

  const citation = defaultCitation || extractCitationFromText(explanation, language);

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

function extractCardsFromScientificProse(topic, rawText, { difficulty = "Médio", count = 5, language = "pt" } = {}) {
  const citation = extractCitationFromText(rawText, language);
  const clean = rawText.replace(/\[(?:PAS|SRC|REF)-[^\]]+\]/g, "").trim();
  const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 25);

  const clauses = clean
    .split(/(?:[;:\n]|\.\s+)/)
    .map((c) => c.trim())
    .filter((c) => c.length >= 25 && c.length <= 260);

  const factsPool = clauses.length >= 4 ? clauses : sentences;
  const cards = [];

  const templates = [
    {
      predicate: (s) => /é o segmento|origina|projeta|estrutura principal|rede nervosa|vaso arterial|formada por|emerge/i.test(s),
      front: `Qual é a origem anatômica, conformação estrutural e trajeto de ${topic}?`,
      objective: "Identificação da origem anatômica, morfologia e trajeto estrutural",
      prefix: "Origem e trajeto anatômico"
    },
    {
      predicate: (s) => /situa-se|regi[aã]o|anterior|posterior|lateral|medial|mediastin|tri[âa]ngulo|compartimento|delimitada/i.test(s),
      front: `Quais são as relações topográficas e espaciais características de ${topic}?`,
      objective: "Compreensão das relações anatômicas regionais e compartimentais",
      prefix: "Relações topográficas e limites"
    },
    {
      predicate: (s) => /ramos|art[eé]rias|nervo|inerva|emiss[aã]o|fixando|fixa|bifurca|anastomose|seios/i.test(s),
      front: `Quais emissões vasculares, ramos ou fixações principais emergem de ${topic}?`,
      objective: "Identificação de ramos colaterais, inervação e arquitetura vascular",
      prefix: "Emissões e ramos vasculares"
    },
    {
      predicate: (s) => /varia|anomalia|aneurisma|dissec|cl[ií]nic|trauma|cir[uú]rgic|vulnerabil/i.test(s),
      front: `Quais variações anatômicas documentadas e correlações clínico-cirúrgicas aplicam-se a ${topic}?`,
      objective: "Reconhecimento de variações anatômicas e relevância clínica aplicada",
      prefix: "Correlação clínica e variações"
    },
    {
      predicate: (s) => /press[aã]o|fun[cç][aã]o|estabilidade|ciclo|parede|endot[eé]l|m[uú]scul|abductor|flex|valva|seio/i.test(s),
      front: `Como a arquitetura morfológica e histológica de ${topic} sustenta sua função anatômica?`,
      objective: "Integração biomecânica e funcionalidade fisiomorfológica",
      prefix: "Biomecânica e integridade tecidual"
    },
    {
      predicate: (s) => /lateralmente|delimitada|veia cava|peric[aá]rdio/i.test(s),
      front: `Quais são as estruturas que delimitam as relações laterais de ${topic}?`,
      objective: "Delimitação anatômica lateral e sintopia",
      prefix: "Limites laterais"
    },
    {
      predicate: (s) => /posteriormente|arco a[oó]rtico|seio carot[ií]deo|es[oó]fago|v[eé]rtebra/i.test(s),
      front: `Como se estabelecem as relações anatômicas posteriores de ${topic}?`,
      objective: "Sintopia e planos posteriores",
      prefix: "Relações posteriores"
    },
    {
      predicate: (s) => /medialmente|cora[cç][aã]o|tronco pulmonar|ventr[ií]culo/i.test(s),
      front: `Quais elementos anatômicos estabelecem a relação medial de ${topic}?`,
      objective: "Relação medial e continuidade cardíaca",
      prefix: "Relação medial"
    },
    {
      predicate: (s) => /seios da aorta|valsalva|v[aá]lvulas semilunares/i.test(s),
      front: `Como se caracterizam os seios aórticos (de Valsalva) na raiz de ${topic}?`,
      objective: "Seios aórticos e anatomia da raiz",
      prefix: "Seios de Valsalva"
    },
    {
      predicate: (s) => /coron[aá]ria direita|coron[aá]ria esquerda|sulcos coron[aá]rios/i.test(s),
      front: `De onde emergem e como se distribuem as artérias coronárias em relação a ${topic}?`,
      objective: "Origem e trajeto das artérias coronárias",
      prefix: "Emergência coronária"
    },
    {
      predicate: (s) => /bifurca|altura|t3|t4|arco|transi[cç][aã]o/i.test(s),
      front: `Em qual nível vertebral ocorre a transição de ${topic} para o arco aórtico?`,
      objective: "Níveis vertebrais e marcos esqueléticos",
      prefix: "Transição e nível esquelético"
    },
    {
      predicate: (s) => /fixa|parede interna|ventr[ií]culo esquerdo|mioc[aá]rdio/i.test(s),
      front: `Como se dá a fixação anatômica proximal de ${topic} no miocárdio?`,
      objective: "Fixação e ancoragem miocárdica",
      prefix: "Fixação miocárdica proximal"
    },
    {
      predicate: (s) => /cirurgias card[ií]acas|mediastinais|procedimento|canula/i.test(s),
      front: `Por que o conhecimento das relações de ${topic} é crucial em cirurgia cardíaca?`,
      objective: "Aplicações em cirurgia cardíaca e mediastinal",
      prefix: "Relevância cirúrgica"
    },
    {
      predicate: (s) => /acess[oó]ria|hep[aá]tica|mesent[eé]rica|tronco cel[ií]aco|10 a 15%/i.test(s),
      front: `Quais variações vasculares em troncos arteriais adjacentes relacionam-se com ${topic}?`,
      objective: "Variações arteriais em ramos adjacentes",
      prefix: "Variações vasculares vizinhas"
    },
    {
      predicate: (s) => /irrigam o mioc[aá]rdio|atrioventricular|interventricular/i.test(s),
      front: `Qual é o território de irrigação primário sustentado pelos ramos de ${topic}?`,
      objective: "Territórios vasculares e perfusão miocárdica",
      prefix: "Irrigação miocárdica"
    },
    {
      predicate: (s) => /peric[aá]rdio|folheto|seroso|cavidade peric[aá]rdica/i.test(s),
      front: `Como se dispõe o folheto pericárdico seroso em torno de ${topic}?`,
      objective: "Envoltório pericárdico e reflexões serosas",
      prefix: "Envoltório pericárdico"
    },
    {
      predicate: (s) => /dissec|aneurisma|stanford|tamponamento/i.test(s),
      front: `Quais riscos anátomo-patológicos afetam a integridade parietal de ${topic}?`,
      objective: "Vulnerabilidade parietal e dissecções",
      prefix: "Patologia e vulnerabilidade"
    },
    {
      predicate: (s) => /fluxo|press[aã]o sist[oó]lica|complac[eê]ncia/i.test(s),
      front: `Qual o papel biomecânico da complacência elástica na parede de ${topic}?`,
      objective: "Hemodinâmica e complacência elástica",
      prefix: "Hemodinâmica vascular"
    },
    {
      predicate: (s) => /terminologia|nomenclatura|ifa|anatômica/i.test(s),
      front: `Como a Terminologia Anatomica padroniza as divisões e acidentes de ${topic}?`,
      objective: "Padronização Terminologia Anatomica",
      prefix: "Terminologia oficial"
    },
    {
      predicate: (s) => /exame|semiologia|ausculta|ecocardiograma/i.test(s),
      front: `Como os marcos topográficos de ${topic} orientam o exame físico e a ausculta?`,
      objective: "Propedêutica física e semiologia",
      prefix: "Semiologia e propedêutica"
    }
  ];

  const usedAnswers = new Set();

  for (let i = 0; i < templates.length && cards.length < count; i += 1) {
    const tpl = templates[i];
    let matching = factsPool.find((f) => tpl.predicate(f) && !usedAnswers.has(normalizeFlashcardText(f)));
    if (!matching) {
      matching = factsPool[i % factsPool.length];
    }

    let finalBack = matching.trim();
    if (usedAnswers.has(normalizeFlashcardText(finalBack))) {
      finalBack = `${tpl.prefix}: ${finalBack}`;
    }

    usedAnswers.add(normalizeFlashcardText(finalBack));

    const card = sanitizeTutorCard(
      {
        front: tpl.front,
        back: finalBack,
        explanation: paragraphs[i % paragraphs.length] || matching.trim(),
        learningObjective: tpl.objective
      },
      { topic, difficulty, index: i, language, defaultCitation: citation }
    );
    if (card && validateFlashcardSchema(card)?.valid) {
      cards.push(card);
    }
  }

  return cards;
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

async function generateTutorCards({ topic, difficulty, count, existingCards, language = "pt", sendTutorMessage = null }) {
  if (count <= 0) return [];
  const prompt = buildTutorPrompt({ topic, difficulty, count, existingCards, language });
  let response;

  if (typeof sendTutorMessage === "function") {
    response = await sendTutorMessage({
      text: prompt,
      context: {
        source: "flashcards",
        task: "generate_flashcards",
        route: "/flashcards",
        sectionTitle: topic,
        sectionQuestion: `Gerar ${count} flashcards de nível ${difficulty} no idioma ${language}`,
        language
      }
    });
  } else {
    response = await atlasAITutorService.processMessageStream(
      prompt,
      {
        source: "flashcards",
        task: "generate_flashcards",
        route: "/flashcards",
        sectionTitle: topic,
        sectionQuestion: `Gerar ${count} flashcards de nível ${difficulty} no idioma ${language}`,
        language
      }
    );
  }

  if (!isTutorSuccess(response)) return [];

  // 1. Tentar parse estruturado direto de JSON Array
  const jsonCards = parseJsonArray(response.text)
    .map((entry, index) => sanitizeTutorCard(entry, { topic, difficulty, index, language }))
    .filter(Boolean);

  if (jsonCards.length > 0) {
    return jsonCards;
  }

  // 2. Fallback semântico determinístico a partir de resposta científica em prosa do TutorEngine
  return extractCardsFromScientificProse(topic, response.text, { difficulty, count, language });
}

export async function generateAnatomicalFlashcards({
  topic = "",
  difficulty = "Médio",
  cardCount = "standard",
  language = "pt",
  sendTutorMessage = null
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
      language: langKey,
      sendTutorMessage
    });

    // Se o pedido era de lote grande (20) e a primeira inferência gerou menos, executa lote complementar
    if (requestedCount > 10 && (curatedCards.length + tutorCards.length) < requestedCount && tutorCards.length > 0) {
      const remainingNeeded = requestedCount - (curatedCards.length + tutorCards.length);
      const secondBatch = await generateTutorCards({
        topic: `${canonicalTopic} - relações clínicas e funcionais`,
        difficulty: resolvedDifficulty,
        count: remainingNeeded,
        existingCards: [...curatedCards, ...tutorCards],
        language: langKey,
        sendTutorMessage
      });
      tutorCards = [...tutorCards, ...secondBatch];
    }
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
      tutor: "Baralho personalizado gerado pelo Tutor IA autenticado com evidências científicas verificadas.",
      curated: "Baralho composto pelo banco editorial Aeternum 26.1, sem repetição de perguntas."
    },
    es: {
      less: `Se prepararon ${cards.length} tarjetas únicas de las ${requestedCount} solicitadas. No duplicamos preguntas para completar artificialmente el mazo.`,
      hybrid: "Baraja híbrida: banco editorial Aeternum 26.1 complementado por el Tutor IA autenticado.",
      tutor: "Baraja personalizada generada por el Tutor IA autenticado con evidencias científicas verificadas.",
      curated: "Baraja compuesta por el banco editorial Aeternum 26.1, sin repetición de preguntas."
    },
    en: {
      less: `Prepared ${cards.length} unique cards of the ${requestedCount} requested. We do not duplicate questions to artificially fill the deck.`,
      hybrid: "Hybrid deck: Aeternum 26.1 editorial bank supplemented by authenticated AI Tutor.",
      tutor: "Custom deck generated by authenticated AI Tutor with verified scientific evidence.",
      curated: "Deck composed from the Aeternum 26.1 editorial bank, with zero duplicate questions."
    },
    de: {
      less: `Es wurden ${cards.length} eindeutige Karten von den ${requestedCount} angeforderten vorbereitet. Wir duplizieren keine Fragen, um das Deck künstlich aufzufüllen.`,
      hybrid: "Hybrides Deck: Redaktionelle Aeternum 26.1 Datenbank ergänzt durch den authentifizierten KI-Tutor.",
      tutor: "Benutzerdefiniertes Deck, generiert vom authentifizierten KI-Tutor mit verifizierten wissenschaftlichen Belegen.",
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
  resolveDifficulty,
  extractCardsFromScientificProse,
  extractCitationFromText
});

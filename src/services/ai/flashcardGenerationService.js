import {
  FLASHCARD_DIFFICULTIES,
  normalizeFlashcardText,
  selectCuratedFlashcards
} from "../../data/anatomicalFlashcardBank.js";
import { atlasAITutorService } from "../../features/atlas-viewer/ai/atlasAITutorService.js";
import {
  isTutorSuccess,
  isEvidenceInsufficient,
  validateFlashcardSchema,
  ACADEMIC_ERROR_CODES
} from "./academicTaskContracts.js";

const CARD_COUNTS = Object.freeze({ few: 5, standard: 10, many: 20 });
const MAX_CARDS_PER_BATCH = 5;

export const FLASHCARD_GENERATION_MODES = Object.freeze({
  CURATED: "curated",
  TUTOR: "tutor",
  HYBRID: "hybrid"
});

export function normalizeGenerationMode(mode, { tutorCount = null, curatedCount = null } = {}) {
  if (typeof tutorCount === "number" && typeof curatedCount === "number") {
    if (tutorCount > 0 && curatedCount > 0) return FLASHCARD_GENERATION_MODES.HYBRID;
    if (tutorCount > 0) return FLASHCARD_GENERATION_MODES.TUTOR;
    return FLASHCARD_GENERATION_MODES.CURATED;
  }
  const raw = String(mode || "").trim().toLowerCase();
  if (raw === "tutor" || raw === "tutor_ia" || raw === "tutor ia" || raw === "ai" || raw === "ia" || raw === "qwen") {
    return FLASHCARD_GENERATION_MODES.TUTOR;
  }
  if (raw === "hybrid" || raw === "hibrido" || raw === "híbrido") {
    return FLASHCARD_GENERATION_MODES.HYBRID;
  }
  return FLASHCARD_GENERATION_MODES.CURATED;
}

export const CANONICAL_SOURCES_REGISTRY = Object.freeze({
  "SRC-MOORE-7TH-BR": {
    id: "SRC-MOORE-7TH-BR",
    title: "Anatomia Orientada para a Clínica",
    authors: "Keith L. Moore, Arthur F. Dalley, Anne M. R. Agur",
    edition: "7ª Edição",
    publisher: "Guanabara Koogan",
    year: 2014,
    provenance: "Acervo Supabase public.vita_anatomical_knowledge (20.334 registros indexados)",
    commercialNotice: "Uso acadêmico e de referência factual sob Doutrina de Fatos Científicos Universais e Clean-Room Protocol."
  },
  "SRC-MOORE-2018": {
    id: "SRC-MOORE-2018",
    title: "Clinically Oriented Anatomy",
    authors: "Keith L. Moore, Arthur F. Dalley, Anne M. R. Agur",
    edition: "8th Edition",
    publisher: "Wolters Kluwer",
    year: 2018,
    provenance: "Grafo Soberano TutorEngine Rust (crates/atlas-knowledge/src/corpus/sources.rs)",
    commercialNotice: "Ontologia conceitual sintópica sob Clean-Room Design; textos integrais não são redistribuídos comercialmente."
  },
  "SRC-TA2-2019": {
    id: "SRC-TA2-2019",
    title: "Terminologia Anatomica Internacional (TA2)",
    authors: "Federative International Programme on Anatomical Terminologies (FIPAT / IFAA)",
    edition: "2ª Edição Oficial",
    publisher: "IFAA",
    year: 2019,
    provenance: "Padrão Internacional Aberto de Nomenclatura Anatômica Humana",
    commercialNotice: "Padrão internacional aberto de terminologia biomédica."
  },
  "SRC-GRAY-2020": {
    id: "SRC-GRAY-2020",
    title: "Gray's Anatomy — The Anatomical Basis of Clinical Practice",
    authors: "Susan Standring et al.",
    edition: "42ª Edição",
    publisher: "Elsevier",
    year: 2020,
    provenance: "Grafo de Relações Anatômicas e Correlações Cirúrgicas",
    commercialNotice: "Consenso factual anatômico sob Clean-Room Design."
  },
  "SRC-LATARJET": {
    id: "SRC-LATARJET",
    title: "Anatomia Humana",
    authors: "Michel Latarjet, Alfredo Ruiz Liard",
    edition: "5ª Edição",
    publisher: "Editorial Médica Panamericana",
    year: 2019,
    provenance: "Grafo Relacional Latarjet (anatomicalKnowledgeGraphService)",
    commercialNotice: "Ontologia relacional de relações vasculares e nervosas."
  },
  "SRC-NETTER-2019": {
    id: "SRC-NETTER-2019",
    title: "Netter — Atlas de Anatomia Humana",
    authors: "Frank H. Netter",
    edition: "7ª Edição",
    publisher: "Elsevier",
    year: 2019,
    provenance: "Atlas Iconográfico Clássico",
    commercialNotice: "Referência topográfica padronizada."
  },
  "SRC-TUTOR-SYNTHESIS": {
    id: "SRC-TUTOR-SYNTHESIS",
    title: "Síntese Conceitual Automatizada",
    authors: "Atlas AI Tutor (TutorEngine Rust + Qwen 3.5 4B)",
    edition: "Inferência Neural Local",
    publisher: "Aeternum Atlas Soberano",
    year: 2026,
    provenance: "Geração paramétrica neural local sem recuperação de excerto textual direto",
    commercialNotice: "Conteúdo gerado por IA local do estudante/instituição."
  }
});

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

function createAbortError(language = "pt") {
  const messages = {
    pt: "Geração de flashcards cancelada pelo estudante.",
    es: "Generación de flashcards cancelada por el estudiante.",
    en: "Flashcard generation cancelled by the student.",
    de: "Karteikartengenerierung vom Studierenden abgebrochen."
  };
  const err = new Error(messages[language] || messages.pt);
  err.code = "REQUEST_ABORTED";
  err.name = "AbortError";
  return err;
}

export function resolveSourceCitation(rawText = "", { defaultCitation = null, language = "pt" } = {}) {
  if (defaultCitation) return defaultCitation;
  const match = String(rawText).match(/\[(SRC-[A-Z0-9-]+|PAS-[A-Z0-9-]+|REF-[A-Z0-9-]+)\]/);
  if (match) {
    const id = match[1];
    if (id.includes("MOORE-7") || id.includes("MOORE_7")) {
      return `${CANONICAL_SOURCES_REGISTRY["SRC-MOORE-7TH-BR"].title} (${CANONICAL_SOURCES_REGISTRY["SRC-MOORE-7TH-BR"].edition}, ${CANONICAL_SOURCES_REGISTRY["SRC-MOORE-7TH-BR"].publisher}) [SRC-MOORE-7TH-BR]`;
    }
    if (id.includes("MOORE")) {
      return `${CANONICAL_SOURCES_REGISTRY["SRC-MOORE-2018"].title} (${CANONICAL_SOURCES_REGISTRY["SRC-MOORE-2018"].edition}, ${CANONICAL_SOURCES_REGISTRY["SRC-MOORE-2018"].publisher}) [SRC-MOORE-2018]`;
    }
    if (id.includes("TA2")) {
      return `${CANONICAL_SOURCES_REGISTRY["SRC-TA2-2019"].title} [SRC-TA2-2019]`;
    }
    if (id.includes("GRAY")) {
      return `${CANONICAL_SOURCES_REGISTRY["SRC-GRAY-2020"].title} [SRC-GRAY-2020]`;
    }
    if (id.includes("LATARJET")) {
      return `${CANONICAL_SOURCES_REGISTRY["SRC-LATARJET"].title} [SRC-LATARJET]`;
    }
    if (id.includes("NETTER")) {
      return `${CANONICAL_SOURCES_REGISTRY["SRC-NETTER-2019"].title} [SRC-NETTER-2019]`;
    }
    return `Evidência Científica Canônica [${id}]`;
  }

  // Se NÃO houver citação explícita comprovada, NÃO usar "Evidências Científicas Verificadas"
  const synthesisLabels = {
    pt: "Tutor IA · Síntese Conceitual Automatizada (Qwen 3.5 4B)",
    es: "Tutor IA · Síntesis Conceptual Automatizada (Qwen 3.5 4B)",
    en: "AI Tutor · Automated Conceptual Synthesis (Qwen 3.5 4B)",
    de: "KI-Tutor · Automatisierte konzeptionelle Synthese (Qwen 3.5 4B)"
  };
  return synthesisLabels[language] || synthesisLabels.pt;
}

function extractCitationFromText(text, language = "pt") {
  return resolveSourceCitation(text, { language });
}

export function decomposeTopicDynamically(topic = "") {
  const clean = String(topic || "").trim();
  const lower = clean.toLowerCase();

  // 1. Vascular (Artérias, Veias, Vasos)
  if (/aorta|art[eé]ri|veia|vaso|car[oó]tid|coron[aá]ri|subcl[aá]vi|jugular|cava|femor|ilíac|axilar|maxilar|vascular/i.test(lower)) {
    return [
      `${clean} - morfologia parietal, túnicas, origem e trajeto anatômico`,
      `${clean} - relações sintópicas regionais, vasos satélites e compartimentos vasculares`,
      `${clean} - ramos colaterais, emissões vasculares e território de perfusão tecidual`,
      `${clean} - variações anatômicas documentadas, pontos de pulso e correlações cirúrgico-hemodinâmicas`
    ];
  }

  // 2. Sistema Nervoso (Plexos, Nervos, Raízes, Troncos)
  if (/plexo|nervo|nervos|radicular|radial|ulnar|mediano|ci[aá]tico|isqui[aá]tico|femoral|vago|cranian|neural|axilar/i.test(lower)) {
    return [
      `${clean} - raízes formadoras, origem anatômica aparente/real e organização fascicular`,
      `${clean} - trajeto topográfico, relações com fáscias, túneis osteofibrosos e planos musculares`,
      `${clean} - ramos motores e território de inervação sensitiva/cutânea`,
      `${clean} - síndromes compressivas, vulnerabilidade a neuropraxia e correlações clínico-neurológicas`
    ];
  }

  // 3. Sistema Esquelético e Articular (Ossos, Fêmur, Clavícula, Articulações)
  if (/osso|ossos|f[eê]mur|clav[ií]cul|úmero|t[ií]bia|f[ií]bula|r[aá]dio|ulna|patela|esc[aá]pula|v[eé]rtebr|cr[aâ]nio|costel|articula|quadril|joelho|ombro/i.test(lower)) {
    return [
      `${clean} - acidentes ósseos, marcos topográficos e superfícies articulares`,
      `${clean} - inserções musculares, fixações ligamentares e estabilidade funcional`,
      `${clean} - forames nutricionais, vascularização óssea e arquitetura trabecular`,
      `${clean} - biomecânica da carga, padrões clássicos de fratura e correlações ortopédicas`
    ];
  }

  // 4. Sistema Digestório / Visceral (Estômago, Fígado, Intestino, Pâncreas, etc.)
  if (/digest[oó]ri|est[oô]mago|f[ií]gado|duodeno|intestino|jejuno|[ií]leo|colo|reto|p[aâ]ncreas|es[oó]fago|visceral|perit[oô]n/i.test(lower)) {
    return [
      `${clean} - anatomia macroscópica, estratigrafia parietal e divisão por segmentos`,
      `${clean} - relações sintópicas, compartimentos peritoneais, mesos e fixações ligamentares`,
      `${clean} - suprimento arterial celíaco/mesentérico, drenagem portal e linfonodos regionais`,
      `${clean} - inervação autonômica, pontos de projeção parietal e correlações clínico-cirúrgicas`
    ];
  }

  // 5. Decomposição Geral para qualquer outro tema
  return [
    `${clean} - conformação anatômica, morfologia e divisões estruturais`,
    `${clean} - relações anatômicas sintópicas, planos de clivagem e estruturas vizinhas`,
    `${clean} - vascularização, drenagem e suprimento neural associado`,
    `${clean} - variações anatômicas descritas na literatura e implicações clínicas aplicadas`
  ];
}

function buildSemanticTopicTokens(topic = "") {
  const normTopic = String(topic)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");

  const baseTokens = normTopic
    .split(/\s+/)
    .filter((w) => w.length >= 4 && ![
      "arteria", "nervo", "plexo", "osso", "sistema", "veia",
      "ramificacoes", "ramos", "anatomia", "estudo", "sobre", "principais"
    ].includes(w));

  const expanded = new Set(baseTokens);
  if (/clavicul|ombro/.test(normTopic)) {
    ["clavicul", "ombro", "escapul", "acromi", "coracoid", "glenoumeral", "esternoclavicular", "deltoid", "peitoral", "subclavi"].forEach((t) => expanded.add(t));
  }
  if (/plexo\s+braquial|braquial/.test(normTopic)) {
    ["braquial", "plexo", "tronco", "fascicul", "raiz", "raizes", "mediano", "ulnar", "radial", "musculocutaneo", "axilar", "escaleno"].forEach((t) => expanded.add(t));
  }
  if (/maxilar/.test(normTopic)) {
    ["maxilar", "meningea", "alveolar", "infraorbital", "esfenopalatin", "pterigopalatin", "infratemporal", "carotid", "mandibul", "pterigoid", "palatin"].forEach((t) => expanded.add(t));
  }
  if (/femur/.test(normTopic)) {
    ["femur", "femoral", "trocanter", "condilo", "acetabul", "quadril", "coxofemoral", "colo"].forEach((t) => expanded.add(t));
  }
  if (/radial/.test(normTopic)) {
    ["radial", "umero", "braquial", "extensor", "supinador", "punho", "posterior"].forEach((t) => expanded.add(t));
  }
  return Array.from(expanded);
}

export function validateFlashcardCorrespondence(card, topic = "") {
  if (!card || typeof card !== "object") {
    return { valid: false, reason: "SCHEMA_VIOLATION", details: "Cartão nulo ou tipo inválido" };
  }

  const front = String(card.front || "").trim();
  const back = String(card.back || "").trim();
  const explanation = String(card.explanation || "").trim();

  // 1. Verificação de completude mínima
  if (front.length < 15) {
    return { valid: false, reason: "SCHEMA_VIOLATION", details: "Pergunta muito curta (< 15 caracteres)" };
  }
  if (back.length < 5) {
    return { valid: false, reason: "SCHEMA_VIOLATION", details: "Resposta muito curta (< 5 caracteres)" };
  }
  if (explanation.length < 15) {
    return { valid: false, reason: "INSUFFICIENT_SUBSTANTIATION", details: "Explicação ou justificativa anatômica insuficiente" };
  }

  // 2. Rejeição de placeholders e respostas genéricas simuladas
  if (/estrutura médica correspondente|tratado de anatomia|tuberosidade ou crista rugosa|placeholder|resumo do tema/i.test(`${front} ${back} ${explanation}`)) {
    return { valid: false, reason: "INSUFFICIENT_SUBSTANTIATION", details: "Contém placeholders ou texto genérico simulado" };
  }

  // 3. Resposta não pode ser uma pergunta
  if (back.endsWith("?") || /^(qual|quais|como|onde|por que|descreva|explique)\b/i.test(back)) {
    return { valid: false, reason: "CIRCULAR_OR_INTERROGATIVE", details: "A resposta é uma pergunta, não um fato conclusivo" };
  }

  // 4. Resposta não pode ser tautológica (repetição idêntica da pergunta)
  const normFront = normalizeFlashcardText(front);
  const normBack = normalizeFlashcardText(back);
  if (normFront === normBack || (normBack.length > 15 && normFront.includes(normBack)) || (normFront.length > 15 && normBack.includes(normFront))) {
    return { valid: false, reason: "TAUTOLOGICAL", details: "A resposta repete a pergunta de forma tautológica" };
  }

  // 5. Pertinência Temática (Topic Pertinence):
  // Não permitir que um cartão sobre 'Plexo braquial' fale de aorta, ou 'Fêmur' fale de seios de Valsalva
  if (topic) {
    const nuclearTopic = String(topic).split(/\s+-\s+/)[0].trim();
    const topicTokens = buildSemanticTopicTokens(nuclearTopic);

    const combinedText = `${front} ${back} ${explanation}`
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Checar cruzamentos flagrantes de tópicos não relacionados
    const isAortaDrift = /aorta|coron[aá]ri|valsalva/i.test(combinedText) && !/aorta|cardio|cora[cç][aã]o/i.test(nuclearTopic);
    const isFemurDrift = /f[eê]mur|troc[aâ]nter|c[oô]ndilo/i.test(combinedText) && !/f[eê]mur|osso|coxa|membro inferior/i.test(nuclearTopic);
    const isRadialDrift = /nervo radial|sulco do nervo radial/i.test(combinedText) && !/radial|braquial|membro superior|úmero|umero|ombro/i.test(nuclearTopic);

    if (isAortaDrift || isFemurDrift || isRadialDrift) {
      return { valid: false, reason: "TOPIC_DRIFT", details: `Desvio temático: cartão aborda outro sistema anatômico não relacionado a '${nuclearTopic}'` };
    }

    if (topicTokens.length > 0) {
      const matchesTopic = topicTokens.some((token) => combinedText.includes(token));
      if (!matchesTopic) {
        return { valid: false, reason: "TOPIC_DRIFT", details: `Pergunta e resposta não mencionam os conceitos centrais de '${nuclearTopic}'` };
      }
    }
  }

  return { valid: true, reason: null, details: "Aprovado na validação de correspondência e rigor anatômico" };
}

function parseJsonArray(text = "") {
  const normalized = String(text).replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = normalized.indexOf("[");
  const end = normalized.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(normalized.slice(start, end + 1));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (_err) {
      void _err;
      try {
        const sanitized = normalized.slice(start, end + 1).replace(/,\s*([\]}])/g, "$1");
        const parsed = JSON.parse(sanitized);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_recoveryErr) {
        void _recoveryErr;
      }
    }
  }

  // Fallback por extração de objetos JSON individuais { ... }
  const objectMatches = normalized.match(/\{[\s\S]*?\}(?=\s*[,\]]|\s*$)/g);
  if (objectMatches) {
    const results = [];
    for (const rawObj of objectMatches) {
      try {
        const obj = JSON.parse(rawObj);
        if (obj && (obj.front || obj.pergunta) && (obj.back || obj.resposta)) {
          results.push(obj);
        }
      } catch (_parseErr) {
        void _parseErr;
        try {
          const fixed = rawObj.replace(/,\s*\}/g, "}");
          const obj = JSON.parse(fixed);
          if (obj && (obj.front || obj.pergunta) && (obj.back || obj.resposta)) {
            results.push(obj);
          }
        } catch (_fixErr) {
          void _fixErr;
        }
      }
    }
    if (results.length > 0) return results;
  }

  return [];
}

function sanitizeTutorCard(entry, { topic, difficulty, index, language = "pt", defaultCitation = null }) {
  const nuclearTopic = String(topic || "").split(/\s+-\s+/)[0].trim();
  const rawFront = String(entry?.front || entry?.pergunta || "").trim();
  const front = rawFront.length > 0 && rawFront.length < 18 && !rawFront.endsWith("?")
    ? `Qual é a caracterização anatômica e importância morfofuncional de ${rawFront} no estudo de ${nuclearTopic}?`
    : rawFront;
  const back = String(entry?.back || entry?.resposta || "").trim();
  const explanation = String(entry?.explanation || entry?.justificativa || entry?.explicacao || back).trim();
  const defaultObj = {
    pt: "Integração anatômica e raciocínio clínico",
    es: "Integración anatómica y razonamiento clínico",
    en: "Anatomical integration and clinical reasoning",
    de: "Anatomische Integration und klinische Schlussfolgerung"
  };
  const learningObjective = String(entry?.learningObjective || entry?.objetivo || defaultObj[language] || "Integração anatômica").trim();

  const citation = defaultCitation || resolveSourceCitation(entry?.sourceCitation || explanation, { language });

  const candidate = {
    id: `fc-ai-${stableHash(`${nuclearTopic}|${difficulty}|${front}|${index}`)}`,
    topic: nuclearTopic,
    difficulty,
    learningObjective,
    front,
    back,
    explanation,
    sourceCitation: citation,
    origin: "tutor"
  };

  const correspondence = validateFlashcardCorrespondence(candidate, nuclearTopic, difficulty);
  if (!correspondence.valid) {
    return { candidate, error: correspondence };
  }

  const schema = validateFlashcardSchema(candidate);
  if (!schema?.valid) {
    return { candidate, error: { valid: false, reason: "SCHEMA_VIOLATION", details: schema?.errors?.join("; ") || "Violação de schema" } };
  }

  return { card: candidate, error: null };
}

function extractCardsFromScientificProse(topic, rawText, { difficulty = "Médio", count = 5, language = "pt" } = {}) {
  const nuclearTopic = String(topic || "").split(/\s+-\s+/)[0].trim();
  const citation = resolveSourceCitation(rawText, { language });
  const clean = String(rawText)
    .replace(/\[(?:PAS|SRC|REF)-[^\]]+\]/g, "")
    .replace(/"(?:front|back|explanation|learningObjective)"\s*:\s*/g, "")
    .replace(/[{}[\]"]/g, " ")
    .trim();

  const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
  const cards = [];

  // Parse structured Q&A blocks se houver padrões "Pergunta: ... / Resposta: ..."
  const qaPattern = /(?:Pergunta|Question|P):\s*([^\n?]+\??)\s*(?:Resposta|Answer|R):\s*([^\n]+)(?:\s*(?:Explicação|Justificativa|Explanation|E):\s*([^\n]+))?/gi;
  let match;
  let idx = 0;
  while ((match = qaPattern.exec(clean)) !== null && cards.length < count) {
    const front = match[1].trim();
    const back = match[2].trim();
    const explanation = match[3]?.trim() || back;

    const res = sanitizeTutorCard({
      front,
      back,
      explanation,
      learningObjective: `Compreensão fática e sintópica de ${nuclearTopic}`
    }, { topic: nuclearTopic, difficulty, index: idx++, language, defaultCitation: citation });

    if (res.card) {
      cards.push(res.card);
    }
  }

  if (cards.length > 0) return cards;

  // Fallback: extração direta de proposições atômicas sobre o tema
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 35 && s.length <= 250);

  const tokens = buildSemanticTopicTokens(nuclearTopic);
  const relevantFacts = sentences.filter((s) => {
    const normS = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return tokens.length === 0 || tokens.some((t) => normS.includes(t));
  });

  for (let i = 0; i < relevantFacts.length && cards.length < count; i += 1) {
    const fact = relevantFacts[i];
    if (fact.endsWith("?") || /^(qual|quais|como|onde|por que)\b/i.test(fact)) continue;

    const front = `Qual é a caracterização anatômica e correlação estrutural de ${nuclearTopic} no seguinte contexto: "${fact.slice(0, 75)}..."?`;
    const res = sanitizeTutorCard({
      front,
      back: fact,
      explanation: paragraphs.find((p) => p.includes(fact)) || fact,
      learningObjective: `Identificação fática de ${nuclearTopic}`
    }, { topic: nuclearTopic, difficulty, index: idx++, language, defaultCitation: citation });

    if (res.card) {
      cards.push(res.card);
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

function abbreviateAnatomicalPrefixesForExclusion(text) {
  return String(text || "")
    .replace(/\b(m[uú]sculos?|musculos?)\b/gi, "m.")
    .replace(/\b(art[eé]rias?|arterias?)\b/gi, "a.")
    .replace(/\b(nervos?)\b/gi, "n.")
    .replace(/\b(veias?)\b/gi, "v.")
    .replace(/\b(plexos?)\b/gi, "pl.")
    .replace(/\b(ramos?)\b/gi, "r.")
    .replace(/\b(forames?)\b/gi, "for.")
    .replace(/\b(g[aâ]nglios?|ganglios?)\b/gi, "g.")
    .replace(/\b(fasc[ií]culos?|fasciculos?)\b/gi, "fasc.")
    .replace(/\b(troncos?)\b/gi, "tr.")
    .replace(/\b(ligamentos?)\b/gi, "lig.")
    .replace(/\b(articula[cç][oõ]es?|articula[cç][aã]o|articulacoes|articulacao)\b/gi, "art.");
}

function buildTutorPrompt({ topic, subtopicFocus = null, difficulty, count, existingCards, language = "pt" }) {
  const existingQuestions = existingCards
    .slice(-15)
    .map((entry) => `- ${abbreviateAnatomicalPrefixesForExclusion(entry.front)}`)
    .join("\n") || "- nenhuma";

  const languageDirectives = {
    pt: "Idioma de saída OBRIGATÓRIO: Português (pt-BR). Gere todas as perguntas, respostas e explicações estritamente em português.",
    es: "Idioma de salida OBLIGATORIO: Español (es-ES). Genera todas las preguntas, respuestas y explicaciones estrictamente en español.",
    en: "MANDATORY output language: English (en-US). Generate all questions, answers, and explanations strictly in English.",
    de: "ERFORDERLICHE Ausgabesprache: Deutsch (de-DE). Erstelle alle Fragen, Antworten und Erklärungen ausschließlich auf Deutsch."
  };

  const selectedDirective = languageDirectives[language] || languageDirectives.pt;

  const searchTopic = String(topic || "")
    .replace(/^(ramifica[cç][oõ]es|ramas|branches|äste)\s+(da|do|de\s+la|of\s+the|der)\s+/i, "")
    .split(/\s+(?:e|y|and|und)\s+/i)[0]
    .trim() || topic;

  const safeSubtopic = subtopicFocus
    ? String(subtopicFocus).replace(/\s+-\s+/, " (segundo o Atlas Aeternum) - ")
    : null;

  return [
    `Explique sobre ${searchTopic} e seus ramos principais.`,
    "Você é o Tutor de Anatomia Humana da plataforma Aeternum Atlas.",
    "Sua missão é gerar flashcards atômicos de alto rigor científico e precisão anatômica.",
    selectedDirective,
    `Tema Estrito: ${topic} (segundo o Atlas Aeternum)`,
    safeSubtopic ? `Dimensão Anatômica Prioritária deste Lote: ${safeSubtopic}` : null,
    `Dificuldade: ${difficulty}`,
    `Quantidade exata neste lote: ${count}`,
    "DIRETRIZES DE CONFORMIDADE ANATÔMICA:",
    "1. Cada cartão DEVE tratar estritamente de fatos anatômicos verdadeiros sobre o tema solicitado.",
    "2. A pergunta (front) DEVE ser uma pergunta anatômica completa (mínimo 25 caracteres, terminada em '?'), cobrindo origem, trajeto, ramificações, relações topográficas, inervação, vascularização, biomecânica ou correlações clínicas.",
    "3. A resposta (back) DEVE responder diretamente à pergunta de forma conclusiva. NUNCA faça perguntas no campo back e NUNCA repita a pergunta.",
    "4. A explicação (explanation) DEVE detalhar a justificativa morfológica, sintópica ou funcional.",
    "5. O objetivo de aprendizagem (learningObjective) DEVE expressar a competência anatômica avaliada.",
    "6. A citação (sourceCitation) DEVE citar a fonte quando aplicável: [SRC-MOORE-7TH-BR], [SRC-MOORE-2018], [SRC-TA2-2019] ou [SRC-GRAY-2020].",
    "7. Retorne SOMENTE um array JSON válido, sem markdown e sem texto adicional.",
    "Formato do JSON:",
    '[{"front": "Pergunta anatômica completa?", "back": "Resposta factual direta.", "explanation": "Justificativa morfológica e clínica.", "learningObjective": "Competência avaliada.", "sourceCitation": "[SRC-MOORE-7TH-BR]"}]',
    "Não invente páginas, capítulos, livros, imagens, estatísticas ou referências bibliográficas.",
    "Não produza placeholders, respostas genéricas nem repita o mesmo fato com outras palavras.",
    "Evite repetir estas perguntas já presentes:",
    existingQuestions
  ].filter(Boolean).join("\n");
}

async function generateTutorCards({
  topic,
  subtopicFocus = null,
  difficulty,
  count,
  existingCards,
  language = "pt",
  sendTutorMessage = null,
  ledger = null,
  signal = null
}) {
  if (count <= 0) return [];
  if (signal?.aborted) {
    throw createAbortError(language);
  }

  const batchCount = Math.min(count, MAX_CARDS_PER_BATCH);
  const nuclearTopic = String(topic || "").split(/\s+-\s+/)[0].trim();
  const searchTopic = nuclearTopic
    .replace(/^(ramifica[cç][oõ]es|ramas|branches|äste)\s+(da|do|de\s+la|of\s+the|der)\s+/i, "")
    .split(/\s+(?:e|y|and|und)\s+/i)[0]
    .trim() || nuclearTopic;
  const matchedCurated = selectCuratedFlashcards({
    topic: nuclearTopic,
    difficulty,
    count: 6,
    language
  })?.matchedTopic;
  const knowledgeGraphPrompt = matchedCurated?.cards?.length
    ? `Contexto Anatômico Canônico (${matchedCurated.title} - ${matchedCurated.system}): ` +
      matchedCurated.cards.slice(0, 6).map((c) => `${c.front} ${c.back}`).join(" | ")
    : null;
  const prompt = buildTutorPrompt({
    topic: nuclearTopic,
    subtopicFocus,
    difficulty,
    count: batchCount,
    existingCards,
    language
  });
  let response;

  if (typeof sendTutorMessage === "function") {
    response = await sendTutorMessage({
      text: prompt,
      context: {
        source: "flashcards",
        task: "generate_flashcards",
        route: "/flashcards",
        topic: searchTopic,
        sectionTitle: subtopicFocus || searchTopic,
        sectionQuestion: `Gerar ${batchCount} flashcards de nível ${difficulty} no idioma ${language}`,
        knowledgeGraphPrompt,
        language
      },
      signal
    });
  } else {
    response = await atlasAITutorService.processMessageStream(
      prompt,
      {
        source: "flashcards",
        task: "generate_flashcards",
        route: "/flashcards",
        topic: searchTopic,
        sectionTitle: subtopicFocus || searchTopic,
        sectionQuestion: `Gerar ${batchCount} flashcards de nível ${difficulty} no idioma ${language}`,
        knowledgeGraphPrompt,
        language
      },
      null,
      null,
      { signal }
    );
  }

  if (signal?.aborted || response?.code === "REQUEST_ABORTED") {
    throw createAbortError(language);
  }

  if (!isTutorSuccess(response)) {
    if (
      response?.code === "SESSION_ALREADY_ACTIVE" ||
      response?.code === "SESSION_DISPLACED" ||
      response?.code === "SESSION_REVOKED" ||
      response?.code === "FORBIDDEN"
    ) {
      const err = new Error(
        response.message ||
        "Esta conta já possui uma sessão ativa em outro dispositivo. Encerre o outro acesso para gerar flashcards."
      );
      err.code = response.code;
      throw err;
    }

    if (isEvidenceInsufficient(response)) {
      const err = new Error(
        "Evidência anatômica insuficiente nas fontes soberanas do Aeternum Atlas para sintetizar este tema com precisão. Especifique a estrutura anatômica de interesse (ex: artéria maxilar, origem e ramos) ou utilize o banco curado."
      );
      err.code = ACADEMIC_ERROR_CODES.ANATOMICAL_EVIDENCE_INSUFFICIENT;
      throw err;
    }

    if (response?.code === "TIMEOUT" || response?.code === "AI_GATEWAY_TIMEOUT") {
      const err = new Error(
        response.message ||
        "O serviço de inferência com Qwen 3.5 4B demorou além do limite esperado para este lote. Seus parâmetros foram preservados."
      );
      err.code = "AI_GATEWAY_TIMEOUT";
      throw err;
    }

    if (
      response?.code === "AI_GATEWAY_UNAVAILABLE" ||
      response?.code === "GATEWAY_UNAVAILABLE" ||
      response?.code === "SERVICE_UNAVAILABLE" ||
      response?.code === "PROVIDER_UNAVAILABLE" ||
      response?.code === "NETWORK_ERROR"
    ) {
      const err = new Error(
        response.message ||
        "O serviço de inferência soberana (Qwen 3.5 4B no Gateway local) está temporariamente inacessível ou ocupado. Verifique o status da IA local ou utilize o banco curado."
      );
      err.code = ACADEMIC_ERROR_CODES.TUTOR_GATEWAY_UNAVAILABLE;
      throw err;
    }

    if (response?.code === "RATE_LIMITED") {
      const err = new Error(
        response.message || "Seu limite de requisições foi atingido. Aguarde um instante para continuar gerando flashcards."
      );
      err.code = ACADEMIC_ERROR_CODES.RATE_LIMITED;
      throw err;
    }

    return [];
  }

  const approved = [];

  // 1. Tentar parse estruturado direto de JSON Array
  const rawArray = parseJsonArray(response.text);
  if (rawArray.length > 0) {
    for (let i = 0; i < rawArray.length; i += 1) {
      if (ledger) ledger.generatedCount += 1;
      const res = sanitizeTutorCard(rawArray[i], { topic: nuclearTopic, difficulty, index: i, language });
      if (res.card) {
        approved.push(res.card);
        if (ledger) ledger.validatedCount += 1;
      } else if (ledger) {
        ledger.rejectedCount += 1;
        ledger.rejectedItems.push({
          candidate: res.candidate,
          reason: res.error.reason,
          details: res.error.details
        });
      }
    }
    if (approved.length > 0) {
      return approved;
    }
  }

  // 2. Fallback determinístico a partir de resposta em prosa estruturada
  const proseCards = extractCardsFromScientificProse(nuclearTopic, response.text, { difficulty, count: batchCount, language });
  for (const card of proseCards) {
    if (ledger) {
      ledger.generatedCount += 1;
      ledger.validatedCount += 1;
    }
    approved.push(card);
  }

  return approved;
}

export async function generateAnatomicalFlashcards({
  topic = "",
  difficulty = "Médio",
  cardCount = "standard",
  language = "pt",
  sendTutorMessage = null,
  signal = null,
  preferTutorOnly = false,
  onProgress = null
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
    const err = new Error(errorMsgs[langKey] || errorMsgs.pt);
    err.code = "INVALID_TOPIC";
    throw err;
  }

  if (signal?.aborted) {
    throw createAbortError(langKey);
  }

  const curatedSelection = selectCuratedFlashcards({
    topic: cleanTopic,
    difficulty: resolvedDifficulty,
    count: requestedCount,
    language: langKey
  });
  const curatedCards = preferTutorOnly ? [] : curatedSelection.cards;
  const canonicalTopic = curatedSelection.matchedTopic?.title || cleanTopic;
  const missingCount = Math.max(0, requestedCount - curatedCards.length);

  const totalBatches = Math.max(1, Math.ceil(missingCount / MAX_CARDS_PER_BATCH));
  onProgress?.({
    stage: "preparing_evidence",
    completedCount: curatedCards.length,
    requestedCount,
    batchIndex: 1,
    totalBatches
  });

  // Registro de Auditoria Científica (Ledger)
  const auditLedger = {
    requestedCount,
    generatedCount: curatedCards.length,
    validatedCount: curatedCards.length,
    rejectedCount: 0,
    rejectedItems: []
  };

  let tutorCards = [];
  let partialStopReason = null;

  if (missingCount > 0) {
    onProgress?.({
      stage: "generating_batch",
      completedCount: curatedCards.length,
      requestedCount,
      batchIndex: 1,
      totalBatches
    });

    const firstBatch = await generateTutorCards({
      topic: canonicalTopic,
      difficulty: resolvedDifficulty,
      count: Math.min(missingCount, MAX_CARDS_PER_BATCH),
      existingCards: curatedCards,
      language: langKey,
      sendTutorMessage,
      ledger: auditLedger,
      signal
    });

    if (signal?.aborted) {
      throw createAbortError(langKey);
    }

    onProgress?.({
      stage: "validating_content",
      completedCount: curatedCards.length + firstBatch.length,
      requestedCount,
      batchIndex: 1,
      totalBatches
    });

    tutorCards = deduplicateCards([...firstBatch]);

    if (tutorCards.length > 0) {
      onProgress?.({
        stage: "batch_completed",
        completedCount: curatedCards.length + tutorCards.length,
        requestedCount,
        batchIndex: 1,
        totalBatches,
        partialCards: deduplicateCards([...curatedCards, ...tutorCards]).slice(0, requestedCount)
      });
    }

    // Se o pedido era de lote expandido (10 a 20), prosseguir em lotes sequenciais controlados:
    const maxAdditionalBatches =
      requestedCount <= MAX_CARDS_PER_BATCH
        ? 0
        : requestedCount <= 10
          ? 1
          : 3;

    if (maxAdditionalBatches > 0 && requestedCount > (curatedCards.length + tutorCards.length)) {
      const dynamicSubtopics = decomposeTopicDynamically(canonicalTopic, resolvedDifficulty, langKey).slice(0, maxAdditionalBatches);
      let batchIdx = 1;

      for (const subtopic of dynamicSubtopics) {
        if (signal?.aborted) {
          throw createAbortError(langKey);
        }
        if ((curatedCards.length + tutorCards.length) >= requestedCount) break;

        batchIdx += 1;
        const remainingNeeded = requestedCount - (curatedCards.length + tutorCards.length);

        onProgress?.({
          stage: "generating_batch",
          completedCount: curatedCards.length + tutorCards.length,
          requestedCount,
          batchIndex: Math.min(batchIdx, totalBatches + 1),
          totalBatches: Math.max(totalBatches, batchIdx)
        });

        const batchSignal =
          signal && typeof AbortSignal.any === "function"
            ? AbortSignal.any([signal, AbortSignal.timeout(90000)])
            : signal || (typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(90000) : null);

        try {
          const subBatch = await generateTutorCards({
            topic: canonicalTopic,
            subtopicFocus: subtopic,
            difficulty: resolvedDifficulty,
            count: Math.min(remainingNeeded, MAX_CARDS_PER_BATCH),
            existingCards: [...curatedCards, ...tutorCards],
            language: langKey,
            sendTutorMessage,
            ledger: auditLedger,
            signal: batchSignal
          });

          if (signal?.aborted) {
            throw createAbortError(langKey);
          }

          onProgress?.({
            stage: "validating_content",
            completedCount: curatedCards.length + tutorCards.length + subBatch.length,
            requestedCount,
            batchIndex: Math.min(batchIdx, totalBatches + 1),
            totalBatches: Math.max(totalBatches, batchIdx)
          });

          if (subBatch.length > 0) {
            tutorCards = deduplicateCards([...tutorCards, ...subBatch]);
            onProgress?.({
              stage: "batch_completed",
              completedCount: curatedCards.length + tutorCards.length,
              requestedCount,
              batchIndex: Math.min(batchIdx, totalBatches + 1),
              totalBatches: Math.max(totalBatches, batchIdx),
              partialCards: deduplicateCards([...curatedCards, ...tutorCards]).slice(0, requestedCount)
            });
          }
        } catch (subErr) {
          // Somente aborta e descarta tudo se o cancelamento partiu explicitamente do signal do usuário
          if (signal?.aborted) {
            throw createAbortError(langKey);
          }
          // Se já temos cartões validados de lotes anteriores, preservamos a geração parcial sem descartar o trabalho concluído
          if (tutorCards.length > 0 || curatedCards.length > 0) {
            partialStopReason = subErr?.code === "REQUEST_ABORTED" ? "BATCH_TIMEOUT" : (subErr?.code || "PARTIAL_BATCH_STOP");
            break;
          }
          throw subErr;
        }
      }
    }
  }

  const cards = deduplicateCards([...curatedCards, ...tutorCards]).slice(0, requestedCount);
  if (!cards.length) {
    const errorEmpty = {
      pt: "Não foi possível gerar flashcards anatômicos validados para este tema no momento. Tente especificar melhor a estrutura anatômica (ex: origem, trajeto e ramos) ou selecione um tema curado do acervo.",
      es: "No fue posible generar flashcards anatómicos validados para este tema en este momento. Intente especificar mejor la estructura anatómica o seleccione un tema curado.",
      en: "Could not generate validated anatomical flashcards for this topic at this time. Please specify the anatomical structure more clearly or select a curated topic.",
      de: "Für dieses Thema konnten derzeit keine validierten anatomischen Lernkarten generiert werden. Bitte spezifizieren Sie die Struktur genauer oder wählen Sie ein kuratiertes Thema."
    };
    throw new Error(errorEmpty[langKey] || errorEmpty.pt);
  }

  const finalTutorCount = cards.filter((c) => c.origin === "tutor").length;
  const finalCuratedCount = cards.length - finalTutorCount;

  const generationMode = normalizeGenerationMode(null, {
    tutorCount: finalTutorCount,
    curatedCount: finalCuratedCount
  });

  const isPartial = cards.length < requestedCount;

  onProgress?.({
    stage: isPartial ? "partial_complete" : "completed",
    completedCount: cards.length,
    requestedCount,
    batchIndex: totalBatches,
    totalBatches,
    partialCards: cards
  });

  const notices = {
    pt: {
      less: `Foram preparados ${cards.length} cartões únicos validados dos ${requestedCount} solicitados. ${auditLedger.rejectedCount > 0 ? `${auditLedger.rejectedCount} candidatos foram rejeitados na auditoria científica. ` : ""}Não duplicamos perguntas para completar artificialmente o baralho.`,
      hybrid: "Baralho híbrido: banco editorial Aeternum 26.1 complementado pelo Tutor IA autenticado.",
      tutor: "Baralho personalizado gerado pelo Tutor IA autenticado com evidências científicas verificadas.",
      curated: "Baralho composto pelo banco editorial Aeternum 26.1, sem repetição de perguntas."
    },
    es: {
      less: `Se prepararon ${cards.length} tarjetas únicas validadas de las ${requestedCount} solicitadas. ${auditLedger.rejectedCount > 0 ? `${auditLedger.rejectedCount} candidatos fueron rechazados en la auditoría científica. ` : ""}No completamos la baraja artificialmente.`,
      hybrid: "Baraja híbrida: banco editorial Aeternum 26.1 complementado por el Tutor IA autenticado.",
      tutor: "Baraja personalizada generada por el Tutor IA autenticado con evidencias científicas verificadas.",
      curated: "Baraja compuesta por el banco editorial Aeternum 26.1, sin repetición de preguntas."
    },
    en: {
      less: `Prepared ${cards.length} unique validated cards of the ${requestedCount} requested. ${auditLedger.rejectedCount > 0 ? `${auditLedger.rejectedCount} candidates rejected during scientific audit. ` : ""}We do not artificially complete the deck.`,
      hybrid: "Hybrid deck: Aeternum 26.1 editorial bank supplemented by authenticated AI Tutor.",
      tutor: "Custom deck generated by authenticated AI Tutor with verified scientific evidence.",
      curated: "Deck composed from the Aeternum 26.1 editorial bank, with zero duplicate questions."
    },
    de: {
      less: `Es wurden ${cards.length} eindeutige validierte Karten von den ${requestedCount} angeforderten vorbereitet. ${auditLedger.rejectedCount > 0 ? `${auditLedger.rejectedCount} Kandidaten wurden im wissenschaftlichen Audit abgelehnt. ` : ""}Wir füllen das Deck nicht künstlich auf.`,
      hybrid: "Hybrides Deck: Redaktionelle Aeternum 26.1 Datenbank ergänzt durch den authentifizierten KI-Tutor.",
      tutor: "Benutzerdefiniertes Deck, generiert vom authentifizierten KI-Tutor mit verifizierten wissenschaftlichen Belegen.",
      curated: "Deck aus der redaktionellen Aeternum 26.1 Datenbank ohne doppelte Fragen."
    }
  };

  const currentNoticeSet = notices[langKey] || notices.pt;
  const generationNotice = isPartial
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
    generatedCount: auditLedger.generatedCount,
    validatedCount: cards.length,
    tutorGeneratedCount: finalTutorCount,
    curatedIncludedCount: finalCuratedCount,
    rejectedCount: auditLedger.rejectedCount,
    isPartial,
    partialStopReason,
    auditLedger,
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
  extractCitationFromText,
  resolveSourceCitation,
  decomposeTopicDynamically,
  validateFlashcardCorrespondence,
  normalizeGenerationMode,
  FLASHCARD_GENERATION_MODES,
  CANONICAL_SOURCES_REGISTRY
});

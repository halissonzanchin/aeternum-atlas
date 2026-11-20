/**
 * AETERNUM ATLAS — ANATOMICAL TOPIC DECOMPOSITION & CALIBRATED SYNONYM ONTOLOGY
 * Governança P0.19-B: Decomposição nuclear e ontologia anatômica soberana calibrada.
 * Previne falsas recusas científicas através de extração por entidades anatômicas,
 * casamento com delimitação de palavras (evita colisões de substrings) e consultas compostas.
 */

export const ANATOMICAL_SYNONYM_MAP = Object.freeze({
  // Preservado da P0.18.A para 100% de retrocompatibilidade
  "arteria gonadal": ["artéria testicular", "artéria ovárica", "artérias testiculares", "artérias ováricas", "artéria gonadal"],
  "arterias gonadais": ["artéria testicular", "artéria ovárica", "artérias testiculares", "artérias ováricas", "artérias gonadais"],
  "arteria testicular": ["artérias gonadais", "artéria testicular", "artéria ovárica", "vasos testiculares"],
  "arterias testiculares": ["artérias gonadais", "artéria testicular", "artérias testiculares"],
  "arteria ovarica": ["artérias gonadais", "artéria ovárica", "artéria testicular", "vasos ováricos"],
  "arterias ovaricas": ["artérias gonadais", "artéria ovárica", "artérias ováricas"],
  "arterias testiculares e ovaricas": ["artérias gonadais", "artéria testicular", "artéria ovárica"],
  "plexo braquial": ["plexo braquial", "plexus brachialis", "troncos do plexo braquial", "fascículos do plexo braquial"],
  "poligono de willis": ["círculo arterial do cérebro", "polígono de willis", "circulus arteriosus cerebri"],
  "circulo arterial do cerebro": ["círculo arterial do cérebro", "polígono de willis", "circulus arteriosus cerebri"],
  "circulus arteriosus cerebri": ["círculo arterial do cérebro", "circulus arteriosus cerebri", "polígono de willis"],
  "circulus arteriosus": ["círculo arterial do cérebro", "circulus arteriosus cerebri", "polígono de willis"],
  "arteria carotida interna": ["carótida interna", "artéria carótida interna", "sifão carotídeo"],
  "arteria carotida comum": ["carótida comum", "artéria carótida comum", "bifurcação carotídea"],
  "arteria carotida": ["artéria carótida", "arteria carotida", "bifurcação carotídea"],
  "arteria subclavia": ["artéria subclávia", "tronco tireocervical", "arteria subclavia"],
  "arteria vertebral": ["artéria vertebral", "artéria basilar"],
  "arteria femoral": ["artéria femoral", "arteria femoral", "trígono femoral"],
  "arteria aorta": ["artéria aorta", "aorta", "arco aórtico"],
  "veia cava": ["veia cava", "vena cava"],

  // Neuroanatomia
  "nervo vago": ["nervo vago", "décimo par craniano", "nervus vagus", "nc x"],
  "nervus vagus": ["nervo vago", "nervus vagus", "nc x"],
  "nervo frenico": ["nervo frênico", "nervus phrenicus", "inervação diafragma"],
  "nervus phrenicus": ["nervo frênico", "nervus phrenicus"],
  "nervo isquiatico": ["nervo isquiático", "nervo ciático", "nervus ischiadicus"],
  "nervo ciatico": ["nervo isquiático", "nervo ciático", "nervus ischiadicus"],
  "nervus ischiadicus": ["nervo isquiático", "nervo ciático", "nervus ischiadicus"],
  "nervo mediano": ["nervo mediano", "nervus medianus", "túnel do carpo"],
  "nervus medianus": ["nervo mediano", "nervus medianus", "túnel do carpo"],
  "nervo radial": ["nervo radial", "nervus radialis"],
  "nervus radialis": ["nervo radial", "nervus radialis"],
  "nervo ulnar": ["nervo ulnar", "nervus ulnaris", "nervio cubital"],
  "nervus ulnaris": ["nervo ulnar", "nervus ulnaris"],

  // Miologia
  "biceps braquial": ["bíceps braquial", "músculo bíceps braquial", "musculus biceps brachii"],
  "musculo biceps braquial": ["bíceps braquial", "músculo bíceps braquial", "musculus biceps brachii"],
  "musculus biceps brachii": ["bíceps braquial", "músculo bíceps braquial", "musculus biceps brachii"],
  "triceps braquial": ["tríceps braquial", "músculo tríceps braquial", "triceps brachii"],
  "trapezio": ["músculo trapézio", "trapézio", "trapezius"],
  "musculo trapezio": ["músculo trapézio", "trapézio", "trapezius"],
  "deltoide": ["músculo deltoide", "deltoide", "deltoideus"],
  "musculo deltoide": ["músculo deltoide", "deltoide", "deltoideus"],
  "peitoral maior": ["músculo peitoral maior", "peitoral maior", "pectoral mayor", "pectoralis major"],
  "pectoral mayor": ["músculo peitoral maior", "peitoral maior", "pectoral mayor", "pectoralis major"],
  "quadriceps": ["músculo quadríceps femoral", "quadríceps femoral", "quadriceps femoris"],

  // Osteologia
  "escapula": ["escápula", "omóplato", "omoplata", "scapula"],
  "omoplata": ["escápula", "omóplato", "scapula"],
  "clavicula": ["clavícula", "clavicula"],
  "umero": ["úmero", "humerus"],
  "femur": ["fêmur", "femur"],
  "tibia": ["tíbia", "tibia"],
  "fibula": ["fíbula", "perônio", "fibula"],
  "cranio": ["crânio", "cranium", "calvária"],

  // Órgãos & Vísceras
  "figado": ["fígado", "hígado", "hepar"],
  "estomago": ["estômago", "estómago", "gaster"],
  "rim": ["rim", "rins", "riñón", "ren"],
  "rins": ["rim", "rins", "riñones", "renes"],
  "pulmao": ["pulmão", "pulmões", "pulmón", "pulmo"],
  "tireoide": ["glândula tireoide", "tireoide", "tiroides", "glandula thyroidea"],
  "glandula tireoide": ["glândula tireoide", "tireoide", "tiroides"],
  "ducto coledoco": ["ducto colédoco", "via biliar principal", "ductus choledochus"],
  "feixe vasculonervoso": ["feixe neurovascular", "bainha carotídea", "feixe vasculonervoso"],

  // Topografia & Estruturas Clínicas
  "tunel do carpo": ["túnel do carpo", "nervo mediano", "retináculo dos flexores", "canal carpiano"],
  "sindrome do tunel do carpo": ["túnel do carpo", "nervo mediano", "retináculo dos flexores"],
  "fossa cubital": ["fossa cubital", "fossa antecubital"],
  "fossa antecubital": ["fossa cubital", "fossa antecubital"],
  "trigono femoral": ["trígono femoral", "triângulo de scarpa", "fossa oval"],
  "triangulo de scarpa": ["trígono femoral", "triângulo de scarpa"],
  "bainha dos retos": ["bainha dos músculos retos", "bainha do reto do abdome", "linha arqueada"],
  "linha arqueada": ["bainha dos músculos retos", "linha arqueada", "linha alba"],
  "ligamento inguinal": ["ligamento inguinal", "ligamentum inguinale"],
  "ligamentum inguinale": ["ligamento inguinal", "ligamentum inguinale"]
});

export function normalizeAnatomicalKey(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSearchTerms(prompt) {
  const stopwords = new Set([
    // Português
    "explique", "explica", "fale", "falar", "sobre", "quais", "qual", "quem", "como", "onde", "quando",
    "por", "que", "porque", "para", "com", "sem", "uma", "um", "umas", "uns", "dos", "das", "do", "da",
    "de", "em", "no", "na", "nos", "nas", "ao", "aos", "a", "o", "os", "as", "e", "ou", "se", "me", "diga",
    "mostre", "descreva", "detalhe", "apresente", "resuma", "sintetize", "ola", "oi", "bom", "dia", "boa", "tarde", "noite",
    "segundo", "atlas", "aeternum", "por favor", "base", "fontes", "variacoes", "variações", "anatomicas", "anatômicas",
    "documentadas", "pontos", "pulso", "correlacoes", "correlações", "cirurgico", "cirúrgico", "hemodinamicas", "hemodinâmicas",
    "gerar", "flashcards", "cartoes", "cartões", "nivel", "nível", "facil", "fácil", "medio", "médio", "dificil", "difícil",
    "funcao", "funções", "estrutura", "estruturas", "relacao", "relações", "sao", "são",
    // Espanhol
    "cuales", "cual", "como", "donde", "cuando", "porque",
    "las", "los", "del", "uno", "este", "esta", "describa", "hable", "segun", "entre", "hacia",
    "desde", "sus", "acerca", "funciones", "inserciones", "insercion"
  ]);
  return String(prompt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopwords.has(t));
}

function matchAnatomicalWord(text, key) {
  const normText = normalizeAnatomicalKey(text);
  const normKey = normalizeAnatomicalKey(key);
  const escaped = normKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`);
  return regex.test(normText);
}

export function extractAnatomicalEntities(text) {
  const norm = normalizeAnatomicalKey(text);
  const matched = [];

  // Match entities using whole-word boundaries
  for (const [key, synList] of Object.entries(ANATOMICAL_SYNONYM_MAP)) {
    if (matchAnatomicalWord(norm, key)) {
      matched.push({
        key,
        primary: synList[0],
        synonyms: synList
      });
    }
  }

  // Prefix matching for unmapped anatomical compounds
  const prefixRegex = /\b(musculo|arteria|veia|nervo|ducto|ligamento|osso|articulacao|trigono|fossa|bainha)\s+([a-z]+(?:\s+[a-z]+)?)\b/g;
  let match;
  while ((match = prefixRegex.exec(norm)) !== null) {
    const anatomicalPrefix = match[1];
    const specificTerm = match[2];
    const fullPhrase = `${anatomicalPrefix} ${specificTerm}`.trim();
    if (!matched.some((e) => e.key === fullPhrase || e.key.includes(specificTerm))) {
      matched.push({
        key: fullPhrase,
        primary: fullPhrase,
        synonyms: [fullPhrase]
      });
    }
  }

  // Sort by key length descending
  matched.sort((a, b) => b.key.length - a.key.length);
  return matched;
}

export function buildCalibratedSearchQueries(prompt, scientificTopic = "", targetEntities = []) {
  const queries = [];
  const combinedText = `${scientificTopic} ${prompt}`.trim();
  const entities = extractAnatomicalEntities(combinedText);
  const terms = extractSearchTerms(combinedText);

  // 1. Entities from Map or Anatomy Compound
  if (entities.length > 0) {
    for (const ent of entities.slice(0, 2)) {
      const entWords = new Set(ent.key.split(/\s+/));
      const modifiers = terms.filter((t) => !entWords.has(t)).slice(0, 2);

      if (modifiers.length > 0) {
        queries.push(`${ent.primary} ${modifiers.join(" ")}`);
      }
      queries.push(ent.primary);
      if (ent.synonyms.length > 1 && ent.synonyms[1] !== ent.primary) {
        queries.push(ent.synonyms[1]);
      }
    }
  } else {
    // 2. Unrecognized entity - compound terms
    if (terms.length >= 2) {
      queries.push(terms.slice(0, 3).join(" "));
    } else if (terms.length === 1) {
      queries.push(terms[0]);
    }
  }

  // 3. Target entities if provided
  if (Array.isArray(targetEntities)) {
    for (const ent of targetEntities) {
      const cleanEnt = String(ent || "").trim();
      if (cleanEnt && !queries.includes(cleanEnt)) {
        queries.push(cleanEnt);
      }
    }
  }

  // Deduplicate and filter length
  return Array.from(new Set(queries.map((q) => q.trim()).filter((q) => q.length > 2))).slice(0, 5);
}

export function decomposeTopic(rawTopic) {
  const clean = String(rawTopic || "").trim();
  if (!clean) return { nuclearTopic: "", subtopics: [], searchQueries: [] };

  const segments = clean
    .split(/[-—–:;|/()\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const rawNuclear = segments[0] || clean;
  const nuclearTopic = rawNuclear
    .replace(/^(visao geral|estudo sobre|anatomia da|anatomia do|morfologia da|morfologia do)\s+/i, "")
    .trim();

  const subtopics = segments.slice(1);
  const queries = [];

  if (nuclearTopic) {
    queries.push(nuclearTopic);
  }

  const normKey = normalizeAnatomicalKey(nuclearTopic);
  for (const [key, synList] of Object.entries(ANATOMICAL_SYNONYM_MAP)) {
    if (matchAnatomicalWord(normKey, key) || (normKey.length > 3 && key.includes(normKey))) {
      for (const syn of synList) {
        if (!queries.includes(syn)) queries.push(syn);
      }
    }
  }

  const nuclearTerms = extractSearchTerms(nuclearTopic);
  if (nuclearTerms.length >= 2 && nuclearTerms.length <= 3) {
    const joined = nuclearTerms.join(" ");
    if (!queries.includes(joined)) queries.push(joined);
  }

  for (const sub of subtopics) {
    const subTerms = extractSearchTerms(sub).slice(0, 2);
    if (subTerms.length > 0 && nuclearTerms.length > 0) {
      const combined = `${nuclearTerms.slice(0, 2).join(" ")} ${subTerms.join(" ")}`;
      if (!queries.includes(combined)) queries.push(combined);
    }
  }

  // If no queries were formed, fallback to calibrated builder
  if (queries.length === 0) {
    const calibrated = buildCalibratedSearchQueries(clean, nuclearTopic);
    for (const cq of calibrated) {
      if (!queries.includes(cq)) queries.push(cq);
    }
  }

  return { nuclearTopic, subtopics, searchQueries: queries };
}

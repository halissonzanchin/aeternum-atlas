import assert from "node:assert/strict";

// Enhanced Synonym Map
export const ANATOMICAL_SYNONYM_MAP = Object.freeze({
  // Existing keys preserved for 100% backward compatibility
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
  
  // Nervos
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

function matchAnatomicalWord(normText, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const fullPhrase = `${match[1]} ${match[2]}`.trim();
    if (!matched.some((e) => e.key === fullPhrase || e.key.includes(match[2]))) {
      matched.push({
        key: fullPhrase,
        primary: fullPhrase,
        synonyms: [fullPhrase]
      });
    }
  }

  // Sort by key length descending so specific multi-word entities take precedence over single-word
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
    // 2. Unrecognized entity - use compound terms rather than full long sentence
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

// Compatibility wrapper for decomposeTopic
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
  const searchQueries = buildCalibratedSearchQueries(clean, nuclearTopic);

  return { nuclearTopic, subtopics, searchQueries };
}

// Verification checks
console.log("=== RUNNING UNIT VERIFICATION OF CALIBRATED DECOMPOSER ===");

// Check 1: No false substring match for "rim" in "comprimida"
const testTC35 = "Qual estrutura é comprimida na síndrome do túnel do carpo e quais são os déficits motores?";
const entitiesTC35 = extractAnatomicalEntities(testTC35);
console.log("TC-35 Entities detected:", entitiesTC35.map(e => e.key));
assert.ok(!entitiesTC35.some(e => e.key === "rim"), "FATAL: 'rim' must NOT be matched inside 'comprimida'!");
assert.ok(entitiesTC35.some(e => e.key.includes("tunel do carpo")), "Must match 'tunel do carpo'!");
const queriesTC35 = buildCalibratedSearchQueries(testTC35);
console.log("TC-35 Generated Queries:", queriesTC35);
assert.ok(queriesTC35.some(q => q.includes("túnel do carpo")), "Queries must contain 'túnel do carpo'!");

// Check 2: Backward compatibility with P0.18.A gonadal test
const gonadalInput = "artérias gonadais - variações anatômicas documentadas, pontos de pulso e correlações cirúrgico-hemodinâmicas";
const gonadalResult = decomposeTopic(gonadalInput);
assert.equal(gonadalResult.nuclearTopic, "artérias gonadais");
assert.ok(gonadalResult.searchQueries.some(q => q.includes("testicular") || q.includes("ovárica") || q.includes("artérias gonadais")));
assert.ok(!gonadalResult.searchQueries.some(q => q.split(" ").length > 5));

// Check 3: Latin TA2
const latinResult = buildCalibratedSearchQueries("Quais estruturas formam o circulus arteriosus cerebri?");
console.log("Latin Circulus Arteriosus Queries:", latinResult);
assert.ok(latinResult.some(q => q.includes("circulus arteriosus cerebri") || q.includes("círculo arterial do cérebro")));

// Check 4: Negative control (fictitious)
const fictResult = buildCalibratedSearchQueries("Qual é a vascularização do nervo telecinético subquântico na calvária?");
console.log("Fictitious Queries:", fictResult);
assert.ok(fictResult.some(q => q.includes("nervo telecinetico")));

console.log("ALL 4 UNIT VERIFICATION CHECKS PASSED PERFECTLY!");

import { getMgmtToken } from "./supabase_admin_helper.mjs";

// Strict TLS using Windows System Root CA store

// --- Enhanced Ontology & Term Extraction ---
export const ENHANCED_ANATOMICAL_SYNONYM_MAP = {
  // Miologia
  "biceps braquial": ["bíceps braquial", "músculo bíceps braquial", "biceps brachii"],
  "musculo biceps braquial": ["bíceps braquial", "músculo bíceps braquial", "biceps brachii"],
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

  // Neuroanatomia
  "nervo vago": ["nervo vago", "nervio vago", "nervus vagus", "décimo par craniano", "nc x"],
  "nervo frenico": ["nervo frênico", "nervio frenico", "nervus phrenicus"],
  "nervo isquiatico": ["nervo isquiático", "nervo ciático", "nervio ciatico", "nervus ischiadicus"],
  "nervo ciatico": ["nervo isquiático", "nervo ciático", "nervus ischiadicus"],
  "nervo mediano": ["nervo mediano", "nervio mediano", "nervus medianus", "túnel do carpo"],
  "nervo radial": ["nervo radial", "nervio radial", "nervus radialis"],
  "nervo ulnar": ["nervo ulnar", "nervio cubital", "nervus ulnaris"],
  "plexo braquial": ["plexo braquial", "plexo braquial", "plexus brachialis"],
  "poligono de willis": ["polígono de willis", "círculo arterial do cérebro", "circulus arteriosus cerebri"],
  "circulo arterial do cerebro": ["círculo arterial do cérebro", "polígono de willis", "circulus arteriosus cerebri"],

  // Cardiovascular & Angiologia
  "coracao": ["coração", "corazón", "heart", "miocárdio"],
  "ventriculo esquerdo": ["ventrículo esquerdo", "ventriculo izquierdo", "left ventricle"],
  "ventriculo direito": ["ventrículo direito", "ventriculo derecho", "right ventricle"],
  "atrio direito": ["átrio direito", "atrio derecho", "aurícula derecha"],
  "atrio esquerdo": ["átrio esquerdo", "atrio izquierdo", "aurícula izquierda"],
  "arteria subclavia": ["artéria subclávia", "arteria subclavia", "subclavian artery"],
  "arteria carotida": ["artéria carótida", "arteria carotida", "carotid artery"],
  "arteria femoral": ["artéria femoral", "arteria femoral", "femoral artery"],
  "arteria aorta": ["artéria aorta", "aorta", "arco aórtico"],
  "veia cava": ["veia cava", "vena cava"],
  
  // Órgãos & Vísceras
  "figado": ["fígado", "hígado", "hepar"],
  "estomago": ["estômago", "estómago", "gaster"],
  "rim": ["rim", "rins", "riñón", "ren"],
  "rins": ["rim", "rins", "riñones", "renes"],
  "pulmao": ["pulmão", "pulmões", "pulmón", "pulmo"],
  "tireoide": ["glândula tireoide", "tireoide", "tiroides", "glandula thyroidea"],
  "ducto coledoco": ["ducto colédoco", "via biliar principal", "ductus choledochus"]
};

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
    "funcao", "funções", "estrutura", "estruturas", "relacao", "relações",
    // Espanhol
    "cuales", "cual", "como", "donde", "cuando", "por", "que", "porque", "para", "con", "sin",
    "las", "los", "del", "una", "uno", "este", "esta", "describa", "hable", "segun", "entre", "hacia",
    "desde", "sus", "sobre", "acerca", "funciones", "inserciones", "insercion"
  ]);
  return prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.has(t));
}

export function extractAnatomicalEntities(text) {
  const norm = normalizeAnatomicalKey(text);
  const matchedEntities = [];

  // 1. Direct match in ontology map
  for (const [key, synList] of Object.entries(ENHANCED_ANATOMICAL_SYNONYM_MAP)) {
    if (norm.includes(key)) {
      matchedEntities.push({
        key,
        primary: synList[0],
        synonyms: synList
      });
    }
  }

  // 2. Anatomical prefix patterns (e.g., musculo X, arteria X, nervo X, veia X)
  const prefixRegex = /\b(musculo|arteria|veia|nervo|ducto|ligamento|osso|articulacao|trigono|fossa)\s+([a-z]+(?:\s+[a-z]+)?)\b/g;
  let match;
  while ((match = prefixRegex.exec(norm)) !== null) {
    const fullPhrase = `${match[1]} ${match[2]}`.trim();
    if (!matchedEntities.some(e => e.key === fullPhrase || e.key.includes(match[2]))) {
      matchedEntities.push({
        key: fullPhrase,
        primary: fullPhrase,
        synonyms: [fullPhrase]
      });
    }
  }

  return matchedEntities;
}

export function buildQualifiedSearchQueries(prompt, scientificTopic = "") {
  const queries = [];
  const combinedText = `${scientificTopic} ${prompt}`.trim();
  const entities = extractAnatomicalEntities(combinedText);
  const terms = extractSearchTerms(combinedText);

  // Level 1: Identified Entities with Qualified Modifiers
  if (entities.length > 0) {
    for (const ent of entities.slice(0, 2)) {
      // Find qualifying terms that are not part of the entity key
      const entWords = new Set(ent.key.split(/\s+/));
      const modifiers = terms.filter(t => !entWords.has(t)).slice(0, 2);

      if (modifiers.length > 0) {
        // Qualified query (e.g. "biceps braquial insercao")
        queries.push(`${ent.primary} ${modifiers.join(" ")}`);
      }
      // Exact entity (e.g. "biceps braquial")
      queries.push(ent.primary);
      
      // Top synonym if distinct
      if (ent.synonyms.length > 1 && ent.synonyms[1] !== ent.primary) {
        queries.push(ent.synonyms[1]);
      }
    }
  }

  // Level 2: If no entity or more queries needed, construct concise noun phrase from clean terms
  if (queries.length < 3 && terms.length > 0) {
    if (terms.length <= 3) {
      queries.push(terms.join(" "));
    } else {
      queries.push(terms.slice(0, 3).join(" "));
      queries.push(terms.slice(0, 2).join(" "));
    }
  }

  // Deduplicate and filter length
  return Array.from(new Set(queries.map(q => q.trim()).filter(q => q.length > 2))).slice(0, 5);
}

// Test against Supabase
async function testEngine() {
  const token = await getMgmtToken();
  const testPrompts = [
    "Quais são as inserções proximais e distais do músculo bíceps braquial?",
    "Qual é o trajeto e os ramos principais do nervo vago no tórax?",
    "Qual é a espessura da parede do ventrículo esquerdo em comparação ao direito?",
    "Quais são os acidentes anatômicos da face posterior da escápula?",
    "Descreva as três partes da artéria subclávia e seus ramos colaterais.",
    "¿Cuáles son las inserciones del músculo pectoral mayor según Latarjet?",
    "Qual é a função do nervo telecinético subquântico na transmissão interdimensional?" // Fictitious
  ];

  console.log("=== TESTING QUALIFIED RETRIEVAL ENGINE ===");

  for (const prompt of testPrompts) {
    console.log(`\nQuestion: "${prompt}"`);
    const queries = buildQualifiedSearchQueries(prompt);
    console.log(`Generated Queries (${queries.length}):`, queries);

    let totalChunks = 0;
    const foundSources = [];

    for (const q of queries) {
      if (foundSources.length >= 4) break;
      const sql = `
        SELECT id, book_title, page_number, substring(content from 1 for 120) as snippet,
               ts_rank_cd(to_tsvector('public.pt_unaccent', coalesce(book_title, '') || ' ' || coalesce(content, '')), websearch_to_tsquery('public.pt_unaccent', '${q}'), 32)::float as rank
        FROM public.vita_anatomical_knowledge
        WHERE to_tsvector('public.pt_unaccent', coalesce(book_title, '') || ' ' || coalesce(content, '')) @@ websearch_to_tsquery('public.pt_unaccent', '${q}')
        ORDER BY rank DESC
        LIMIT 4;
      `;
      const res = await (await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql })
      })).json();

      if (Array.isArray(res) && res.length > 0) {
        for (const row of res) {
          if (!foundSources.some(s => s.id === row.id)) {
            foundSources.push(row);
          }
        }
      }
    }

    const isSufficient = foundSources.length > 0;
    console.log(`Retrieved Sources: ${foundSources.length}`);
    if (foundSources.length > 0) {
      console.log(`Top Source: [${foundSources[0].book_title}] (p. ${foundSources[0].page_number}) - "${foundSources[0].snippet}..."`);
      console.log(`Evidence Gate: PASS (SOURCE_EVIDENCE_SUFFICIENT)`);
    } else {
      console.log(`Evidence Gate: BLOCKED (NO_SOURCES_RETRIEVED - Transparent Honest Refusal)`);
    }
  }
}

// Only run directly if executed as main
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  testEngine().catch(console.error);
}

/**
 * AETERNUM ATLAS — ANATOMICAL TOPIC DECOMPOSITION & SYNONYM ONTOLOGY
 * Governança P0.18.A: Decomposição nuclear e ontologia anatômica soberana.
 */

export const ANATOMICAL_SYNONYM_MAP = Object.freeze({
  "arteria gonadal": ["artéria testicular", "artéria ovárica", "artérias testiculares", "artérias ováricas", "artéria gonadal"],
  "arterias gonadais": ["artéria testicular", "artéria ovárica", "artérias testiculares", "artérias ováricas", "artérias gonadais"],
  "arteria testicular": ["artérias gonadais", "artéria testicular", "artéria ovárica", "vasos testiculares"],
  "arterias testiculares": ["artérias gonadais", "artéria testicular", "artérias testiculares"],
  "arteria ovarica": ["artérias gonadais", "artéria ovárica", "artéria testicular", "vasos ováricos"],
  "arterias ovaricas": ["artérias gonadais", "artéria ovárica", "artérias ováricas"],
  "arterias testiculares e ovaricas": ["artérias gonadais", "artéria testicular", "artéria ovárica"],
  "plexo braquial": ["plexo braquial", "plexus brachialis", "troncos do plexo braquial", "fascículos do plexo braquial"],
  "poligono de willis": ["círculo arterial do cérebro", "polígono de willis", "circulus arteriosus cerebri"],
  "circulo arterial do cerebro": ["círculo arterial do cérebro", "polígono de willis"],
  "arteria carotida interna": ["carótida interna", "artéria carótida interna", "sifão carotídeo"],
  "arteria carotida comum": ["carótida comum", "artéria carótida comum", "bifurcação carotídea"],
  "arteria subclavia": ["artéria subclávia", "tronco tireocervical"],
  "arteria vertebral": ["artéria vertebral", "artéria basilar"],
  "nervo vago": ["nervo vago", "décimo par craniano", "nervus vagus", "nc x"],
  "nervo frenico": ["nervo frênico", "inervação diafragma"],
  "nervo isquiatico": ["nervo isquiático", "nervo ciático", "nervus ischiadicus"],
  "nervo ciatico": ["nervo isquiático", "nervo ciático", "nervus ischiadicus"],
  "nervo mediano": ["nervo mediano", "nervus medianus", "túnel do carpo"],
  "ducto coledoco": ["ducto colédoco", "via biliar principal", "ductus choledochus"],
  "feixe vasculonervoso": ["feixe neurovascular", "bainha carotídea", "feixe vasculonervoso"]
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
    "explique", "explica", "fale", "falar", "sobre", "quais", "qual", "quem", "como", "onde", "quando",
    "por", "que", "porque", "para", "com", "sem", "uma", "um", "umas", "uns", "dos", "das", "do", "da",
    "de", "em", "no", "na", "nos", "nas", "ao", "aos", "a", "o", "os", "as", "e", "ou", "se", "me", "diga",
    "mostre", "descreva", "detalhe", "apresente", "resuma", "sintetize", "ola", "oi", "bom", "dia", "boa", "tarde", "noite",
    "segundo", "atlas", "aeternum", "por favor", "base", "fontes", "variacoes", "variações", "anatomicas", "anatômicas",
    "documentadas", "pontos", "pulso", "correlacoes", "correlações", "cirurgico", "cirúrgico", "hemodinamicas", "hemodinâmicas",
    "gerar", "flashcards", "cartoes", "cartões", "nivel", "nível", "facil", "fácil", "medio", "médio", "dificil", "difícil"
  ]);
  return String(prompt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopwords.has(t));
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
    if (normKey.includes(key) || key.includes(normKey)) {
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

  return { nuclearTopic, subtopics, searchQueries: queries };
}

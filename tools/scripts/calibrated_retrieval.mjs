// AETERNUM ATLAS — CALIBRATED ANATOMICAL RETRIEVAL ENGINE (P0.19-B)
// Authority Layer 3: Qualified ontology, whole-word matching, TA2/Latin, and Evidence Gate fail-closed

export const ENHANCED_ANATOMICAL_SYNONYM_MAP = Object.freeze({
  // Preserved from P0.18.A for 100% backward compatibility
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
  "trigono carotico": ["trígono carotídeo", "trígono carótico", "trigonum caroticum", "bainha carotídea"],
  "trigono carotideo": ["trígono carotídeo", "trígono carótico", "trigonum caroticum", "bainha carotídea"],
  "tunel do carpo": ["túnel do carpo", "nervo mediano", "retináculo dos flexores", "canal carpiano"],
  "sindrome do tunel do carpo": ["túnel do carpo", "nervo mediano", "retináculo dos flexores"],
  "fossa cubital": ["fossa cubital", "fossa antecubital"],
  "fossa antecubital": ["fossa cubital", "fossa antecubital"],
  "trigono femoral": ["trígono femoral", "triângulo de scarpa", "fossa oval"],
  "triangulo de scarpa": ["trígono femoral", "triângulo de scarpa"],
  "bainha dos retos": ["bainha dos músculos retos", "bainha do reto do abdome", "linha arqueada"],
  "linha arqueada": ["bainha dos músculos retos", "linha arqueada", "linha alba"],
  "ligamento inguinal": ["ligamento inguinal", "ligamentum inguinale"],
  "ligamentum inguinale": ["ligamento inguinal", "ligamentum inguinale"],
  "trigono de hesselbach": ["trígono inguinal", "trígono de hesselbach", "fóvea inguinal medial"],
  "trigono inguinal": ["trígono inguinal", "trígono de hesselbach", "fóvea inguinal medial"],
  "forame omental": ["forame omental", "forame epiploico", "forame de winslow", "hiato de winslow"],
  "forame de winslow": ["forame omental", "forame de winslow", "foramen omentale"],
  "trigono de calot": ["trígono de calot", "trígono cisto-hepático", "trígono hepatobiliar"],
  "trigono cisto-hepatico": ["trígono de calot", "trígono cisto-hepático", "trígono hepatobiliar"],
  "ducto toracico": ["ducto torácico", "cisterna do quilo", "ductus thoracicus"],
  "cisterna do quilo": ["cisterna do quilo", "ducto torácico", "cisterna chyli"],
  "arteria lusoria": ["artéria subclávia direita aberrante", "arteria lusoria", "arco aórtico"],
  "rim em ferradura": ["rim em ferradura", "rins em ferradura", "fusão renal"],
  "diverticulo de meckel": ["divertículo de meckel", "ducto onfalomesentérico", "ducto vitelino"],
  "arteria coronaria": ["artéria coronária", "coronária esquerda", "coronária direita", "interventricular anterior"],
  "arteria coronaria esquerda": ["artéria coronária esquerda", "ramo interventricular anterior", "ramo circunflexo"],
  "arteria coronaria direita": ["artéria coronária direita", "ramo interventricular posterior", "ramo marginal direito"],
  "manguito rotador": ["manguito rotador", "supraespinal", "infraespinal", "subescapular", "redondo menor"],
  "pata de ganso": ["pata de ganso", "pes anserinus", "sartório", "grácil", "semitendíneo"],
  "pes anserinus": ["pata de ganso", "pes anserinus", "sartório", "grácil", "semitendíneo"],
  "esfenoide": ["osso esfenoide", "sela túrcica", "asa maior do esfenoide"],
  "osso esfenoide": ["osso esfenoide", "sela túrcica", "asa maior do esfenoide"],
  "temporal": ["osso temporal", "porção petrosa", "processo mastoide"],
  "osso temporal": ["osso temporal", "porção petrosa", "processo mastoide"],
  "etmoide": ["osso etmoide", "lâmina crivosa", "crista galli"],
  "osso etmoide": ["osso etmoide", "lâmina crivosa", "crista galli"],
  "atlas": ["vértebra atlas", "primeira vértebra cervical", "c1"],
  "axis": ["vértebra áxis", "dente do áxis", "processo odontoide", "c2"]
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

export function matchAnatomicalWord(text, key) {
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
  for (const [key, synList] of Object.entries(ENHANCED_ANATOMICAL_SYNONYM_MAP)) {
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

  // Sort by key length descending so specific multi-word entities take precedence
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

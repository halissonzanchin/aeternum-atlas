/**
 * Aeternum Atlas — Canonical Spatial 3D Model Resolver
 * 
 * Strict anatomical entity resolver for Spatial AI 3D viewport guidance.
 * Maps user queries and tutor explanations to verified local 3D models.
 * 
 * Invariants:
 * 1. Strictly canonical: Uses IFAA entities and controlled synonyms in pt, es, en, de.
 * 2. Strict disambiguation: "cabeça" never matches cranial model if accompanied by
 *    "úmero", "fêmur", "rádio", "costela", "humeral", "femoral", etc.
 * 3. Generic rejection: Words like "osso", "ombro", "músculo", "anatomia" never match.
 * 4. Transparent local catalog reality: Entities absent from local catalog (e.g. Scapula,
 *    Clavicle, Femur, Masseter) return matchType "NO_MATCH" with explicit status message,
 *    never substituting an unrelated model.
 * 5. Preservation: Preserves currently viewed model unless explicit match requires change.
 */

import { LOCAL_MODELS } from "../../data/localModels.js";

function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Registry of Canonical IFAA Anatomical Entities with Local 3D Model associations.
 */
export const CANONICAL_SPATIAL_REGISTRY = [
  // -------------------------------------------------------------------------
  // 1. NEUROCRANIUM & BRAIN (Model Available: corte-sagital-cranio-humano-superficial)
  // -------------------------------------------------------------------------
  {
    entityId: "A02.1.00.001",
    canonicalName: "Crânio / Encéfalo",
    localizedNames: {
      pt: "Crânio Humano e Encéfalo",
      en: "Human Skull and Encephalon",
      es: "Cráneo Humano y Encéfalo",
      de: "Menschlicher Schädel und Gehirn"
    },
    modelSlug: "corte-sagital-cranio-humano-superficial",
    modelTitle: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    markers: [
      { id: "m1", label: "Telencéfalo & Córtex", index: 0 },
      { id: "m2", label: "Corpo Caloso", index: 1 },
      { id: "m3", label: "Tronco Encefálico", index: 2 },
      { id: "m4", label: "Cerebelo", index: 3 }
    ],
    // Primary keywords across pt, es, en, de
    keywords: [
      "cranio", "calvaria", "neurocranio", "viscerocranio",
      "encefalo", "cerebro", "telencefalo", "cortex cerebral",
      "corpo caloso", "tronco encefalico", "cerebelo", "meninges",
      "diencefalo",
      // English
      "skull", "cranium", "calvaria", "neurocranium",
      "brain", "encephalon", "cerebrum", "cerebral cortex",
      "corpus callosum", "brainstem", "brain stem", "cerebellum",
      // Spanish
      "craneo", "corteza cerebral", "cuerpo calloso",
      // German
      "schadel", "schaedel", "kranium", "gehirn", "hirn",
      "grosshirn", "kleinhirn", "hirnstamm", "balken", "hirnhaute"
    ],
    // Special test for "cabeça" / "head" / "cabeza" / "kopf" to avoid long bone heads
    requiresHeadDisambiguation: true
  },

  // -------------------------------------------------------------------------
  // 2. FEMALE REPRODUCTIVE SYSTEM & PELVIS (Model Available: corte-sagital-sistema-reprodutor-feminino)
  // -------------------------------------------------------------------------
  {
    entityId: "A09.1.01.001",
    canonicalName: "Sistema Reprodutor Feminino",
    localizedNames: {
      pt: "Sistema Reprodutor Feminino (Corte Sagital)",
      en: "Female Reproductive System (Sagittal Section)",
      es: "Sistema Reproductor Femenino (Corte Sagital)",
      de: "Weibliches Fortpflanzungssystem (Sagittalschnitt)"
    },
    modelSlug: "corte-sagital-sistema-reprodutor-feminino",
    modelTitle: "Corte Sagital do Sistema Reprodutor Feminino — Modelo 3D",
    markers: [
      { id: "f1", label: "Útero & Cavidade Uterina", index: 0 },
      { id: "f2", label: "Bexiga Urinária", index: 1 },
      { id: "f3", label: "Fundo de Saco de Douglas", index: 2 },
      { id: "f4", label: "Canal Vaginal & Cérvix", index: 3 }
    ],
    keywords: [
      "reprodutor feminino", "utero", "cavidade uterina", "colo do utero",
      "cervix", "canal vaginal", "vagina", "fundo de saco de douglas",
      "escavacao retouterina", "pelve feminina", "ginecologia",
      // English
      "female reproductive", "uterus", "uterine cavity", "uterine cervix",
      "vaginal canal", "pouch of douglas", "rectouterine pouch", "female pelvis",
      // Spanish
      "sistema reproductor femenino", "cuello uterino", "pelvis femenina",
      // German
      "weibliches fortpflanzungssystem", "gebarmutter", "gebaermutter", "gebärmutter", "uterus",
      "weibliches becken", "douglas raum", "scheide"
    ],
    requiresHeadDisambiguation: false
  },

  // -------------------------------------------------------------------------
  // 3. HEART & CARDIOVASCULAR (Model Available: coracao-edicao-morgue)
  // -------------------------------------------------------------------------
  {
    entityId: "A12.1.00.001",
    canonicalName: "Coração Humano",
    localizedNames: {
      pt: "Coração Humano (Edição Morgue)",
      en: "Human Heart (Morgue Edition)",
      es: "Corazón Humano (Edición Morgue)",
      de: "Menschliches Herz (Morgue-Ausgabe)"
    },
    modelSlug: "coracao-edicao-morgue",
    modelTitle: "Coração Humano — Edição Morgue 3D",
    markers: [
      { id: "h1", label: "Ápice Cardíaco", index: 0 },
      { id: "h2", label: "Ventrículo Esquerdo", index: 1 },
      { id: "h3", label: "Tronco da Aorta", index: 2 },
      { id: "h4", label: "Sulco Coronário", index: 3 }
    ],
    keywords: [
      "coracao", "miocardio", "ventriculo", "atrio", "tronco da aorta",
      "aorta ascendente", "sulco coronario", "apice cardiaco", "pericardio",
      // English
      "heart", "myocardium", "cardiac", "ventricle", "atrium",
      "aorta", "coronary sulcus", "cardiac apex", "pericardium",
      // Spanish
      "corazon", "auricula", "surco coronario", "vertice cardiaco",
      // German
      "herz", "myokard", "herzkammer", "vorhof", "herzspitze",
      "sulcus coronarius", "perikard"
    ],
    requiresHeadDisambiguation: false
  },

  // -------------------------------------------------------------------------
  // 4. SCAPULA (NO LOCAL 3D MODEL AVAILABLE)
  // -------------------------------------------------------------------------
  {
    entityId: "A02.4.01.001",
    canonicalName: "Escápula",
    localizedNames: {
      pt: "Escápula",
      en: "Scapula",
      es: "Escápula",
      de: "Scapula (Schulterblatt)"
    },
    modelSlug: null,
    modelTitle: null,
    markers: [],
    keywords: [
      "escapula", "omoplata", "fossa subescapular", "fossa supraespinhosa",
      "fossa supraespinhal", "fossa infraespinhosa", "fossa infraespinhal",
      "espinha da escapula", "espinha escapular", "processo coracoide",
      "acromio", "cavidade glenoidal", "glenoide",
      // English
      "scapula", "shoulder blade", "subscapular fossa", "supraspinous fossa",
      "infraspinous fossa", "scapular spine", "spine of the scapula",
      "coracoid process", "acromion", "glenoid cavity",
      // Spanish
      "omoplato", "fosa subescapular", "fosa supraespinosa",
      "fosa infraespinosa", "espina de la escapula", "apofisis coracoides",
      "cavidad glenoidea",
      // German
      "schulterblatt", "fossa subscapularis", "fossa supraspinata",
      "fossa infraspinata", "spina scapulae", "processus coracoideus",
      "cavitas glenoidalis"
    ],
    requiresHeadDisambiguation: false
  },

  // -------------------------------------------------------------------------
  // 5. CLAVICLE (NO LOCAL 3D MODEL AVAILABLE)
  // -------------------------------------------------------------------------
  {
    entityId: "A02.4.02.001",
    canonicalName: "Clavícula",
    localizedNames: {
      pt: "Clavícula",
      en: "Clavicle",
      es: "Clavícula",
      de: "Clavicula (Schlüsselbein)"
    },
    modelSlug: null,
    modelTitle: null,
    markers: [],
    keywords: [
      "clavicula", "extremidade acromial da clavicula", "extremidade esternal da clavicula",
      "clavicle", "collarbone", "acromial end", "sternal end",
      "schlusselbein", "schluesselbein"
    ],
    requiresHeadDisambiguation: false
  },

  // -------------------------------------------------------------------------
  // 6. ACROMIOCLAVICULAR JOINT (NO LOCAL 3D MODEL AVAILABLE)
  // -------------------------------------------------------------------------
  {
    entityId: "A03.5.01.001",
    canonicalName: "Articulação Acromioclavicular",
    localizedNames: {
      pt: "Articulação Acromioclavicular",
      en: "Acromioclavicular Joint",
      es: "Articulación Acromioclavicular",
      de: "Acromioclaviculargelenk"
    },
    modelSlug: null,
    modelTitle: null,
    markers: [],
    keywords: [
      "articulacao acromioclavicular", "acromioclavicular joint", "ac joint",
      "articulacion acromioclavicular", "acromioclaviculargelenk", "schultereckgelenk"
    ],
    requiresHeadDisambiguation: false
  },

  // -------------------------------------------------------------------------
  // 7. FEMUR (NO LOCAL 3D MODEL AVAILABLE)
  // -------------------------------------------------------------------------
  {
    entityId: "A02.5.04.001",
    canonicalName: "Fêmur",
    localizedNames: {
      pt: "Fêmur",
      en: "Femur",
      es: "Fémur",
      de: "Femur (Oberschenkelknochen)"
    },
    modelSlug: null,
    modelTitle: null,
    markers: [],
    keywords: [
      "femur", "trocanter maior", "trocanter menor", "colo do femur",
      "thigh bone", "greater trochanter", "lesser trochanter", "femoral neck",
      "trocanter", "cuello femoral", "oberschenkelknochen", "femurhals"
    ],
    requiresHeadDisambiguation: false
  },

  // -------------------------------------------------------------------------
  // 8. MASSETER MUSCLE (NO LOCAL 3D MODEL AVAILABLE)
  // -------------------------------------------------------------------------
  {
    entityId: "A04.1.04.002",
    canonicalName: "Músculo Masseter",
    localizedNames: {
      pt: "Músculo Masseter",
      en: "Masseter Muscle",
      es: "Músculo Masetero",
      de: "Musculus masseter"
    },
    modelSlug: null,
    modelTitle: null,
    markers: [],
    keywords: [
      "masseter", "musculo masseter", "masseter muscle",
      "masetero", "musculo masetero", "musculus masseter", "kaumuskel"
    ],
    requiresHeadDisambiguation: false
  },

  // -------------------------------------------------------------------------
  // 9. HUMERUS (NO LOCAL 3D MODEL AVAILABLE)
  // -------------------------------------------------------------------------
  {
    entityId: "A02.4.04.001",
    canonicalName: "Úmero",
    localizedNames: {
      pt: "Úmero",
      en: "Humerus",
      es: "Húmero",
      de: "Humerus (Oberarmknochen)"
    },
    modelSlug: null,
    modelTitle: null,
    markers: [],
    keywords: [
      "umero", "tuberculo maior", "tuberculo menor", "colo cirurgico do umero",
      "humerus", "greater tubercle", "lesser tubercle",
      "humero", "oberarmknochen"
    ],
    requiresHeadDisambiguation: false
  }
];

/**
 * Checks if the occurrence of "cabeça" is genuine cranial/head context
 * or refers to the head of a long bone (humerus, femur, radius, etc.).
 */
function isGenuineCranialHead(text) {
  const norm = normalizeText(text);

  // If there's no mention of head words, return false
  const hasHead = /\b(?:cabeca|cabeça|head|cabeza|kopf|caput)\b/.test(norm);
  if (!hasHead) return false;

  // Disqualifiers: head of long bones or muscles
  const boneHeadPatterns = [
    /\bcabeca\s+(?:do|de)?\s*(?:umero|femur|radio|costela|fibula)\b/,
    /\bcabeza\s+(?:del|de)?\s*(?:humero|femur|radio|costilla|perone)\b/,
    /\b(?:humeral|femoral|radial|rib)\s+head\b/,
    /\bhead\s+of\s+(?:the\s+)?(?:humerus|femur|radius|rib|fibula)\b/,
    /\b(?:humerus|femur|radius|rippen)kopf\b/,
    /\bcaput\s+(?:humeri|femoris|radii|costae)\b/,
    /\bcabeca\s+(?:longa|curta|medial|lateral)\b/,
    /\bcabeza\s+(?:larga|corta|medial|lateral)\b/,
    /\b(?:long|short)\s+head\b/,
    /\b(?:langer|kurzer)\s+kopf\b/
  ];

  const hasBoneHead = boneHeadPatterns.some((pattern) => pattern.test(norm));

  // Positive cranial contexts
  const cranialHeadPatterns = [
    /\b(?:anatomia\s+da\s+cabeca|cabeca\s+e\s+pescoco|ossos\s+da\s+cabeca|corte\s+(?:sagital\s+)?da\s+cabeca|modelo\s+da\s+cabeca)\b/,
    /\b(?:head\s+anatomy|head\s+and\s+neck|bones\s+of\s+the\s+head|sagittal\s+head)\b/,
    /\b(?:anatomia\s+de\s+la\s+cabeza|cabeza\s+y\s+cuello|huesos\s+de\s+la\s+cabeza)\b/,
    /\b(?:kopfanatomie|kopf\s+und\s+hals|schadel\s+und\s+kopf|schaedel\s+und\s+kopf)\b/
  ];

  const hasPositiveCranialHead = cranialHeadPatterns.some((pattern) => pattern.test(norm));

  if (hasBoneHead && !hasPositiveCranialHead) {
    return false;
  }

  return true;
}

/**
 * Rejects pure generic words that must NEVER match a 3D model.
 */
const GENERIC_ANATOMICAL_STOPWORDS = new Set([
  "osso", "ossos", "ombro", "ombros", "musculo", "musculos", "anatomia",
  "anatomico", "anatomica", "organo", "orgao", "estrutura", "estruturas",
  "parte", "corpo", "sistema", "regiao", "peca", "corte",
  "bone", "bones", "shoulder", "shoulders", "muscle", "muscles", "anatomy",
  "anatomical", "organ", "structure", "part", "body", "system", "region",
  "hueso", "huesos", "hombro", "hombros", "musculo", "musculos",
  "knochen", "schulter", "muskel", "muskeln", "anatomie", "organ"
]);

/**
 * Matches an anatomical text against canonical entities.
 */
function identifyCanonicalEntity(text) {
  if (!text || typeof text !== "string") return null;

  const norm = normalizeText(text);
  if (!norm) return null;

  // Don't match if the query is just a generic stopword
  const words = norm.split(" ").filter(Boolean);
  if (words.length === 1 && GENERIC_ANATOMICAL_STOPWORDS.has(words[0])) {
    return null;
  }

  // Iterate over registry
  for (const entry of CANONICAL_SPATIAL_REGISTRY) {
    // Check keywords
    const matchedKw = entry.keywords.find((kw) => {
      const normKw = normalizeText(kw);
      if (!normKw) return false;
      // Word boundary match
      const regex = new RegExp(`\\b${normKw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`);
      return regex.test(norm);
    });

    if (matchedKw) {
      return entry;
    }

    // Check head disambiguation if applicable
    if (entry.requiresHeadDisambiguation && isGenuineCranialHead(norm)) {
      return entry;
    }
  }

  return null;
}

/**
 * Resolves 3D model mapping from inquiry context.
 * 
 * @param {Object} params
 * @param {string} params.userQuery - User question/prompt
 * @param {string} [params.aiResponseText] - AI response text
 * @param {string} [params.currentPath] - Current URL path
 * @param {string} [params.language] - Current UI language ('pt' | 'es' | 'en' | 'de')
 * @param {Object} [params.context3d] - Viewport 3D context
 * @returns {Object} Resolution result
 */
export function resolveCanonicalSpatialModel({
  userQuery = "",
  slugOrId = "",
  selectedStructure = "",
  aiResponseText = "",
  currentPath = "",
  language = "pt",
  context3d = null
}) {
  const lang = ["pt", "es", "en", "de"].includes(language) ? language : "pt";
  const primaryInquiry = String(userQuery || [slugOrId, selectedStructure].filter(Boolean).join(" ")).trim();

  // 1. Prioritize primary inquiry as main intent
  let resolvedEntry = null;
  if (primaryInquiry) {
    resolvedEntry = identifyCanonicalEntity(primaryInquiry);
  }

  // 2. Fallback to 3D context if active in viewer
  if (!resolvedEntry && context3d?.selectedStructureId) {
    resolvedEntry = identifyCanonicalEntity(context3d.selectedStructureId);
  }

  // 3. Fallback to AI response text ONLY if user query didn't yield an entity
  // and strictly enforcing disambiguation rules
  if (!resolvedEntry && aiResponseText && typeof aiResponseText === "string") {
    // Take the opening subject (first 250 characters) to avoid false matches on secondary joints
    const leadText = aiResponseText.slice(0, 250);
    resolvedEntry = identifyCanonicalEntity(leadText) || identifyCanonicalEntity(aiResponseText);
  }

  // If no anatomical entity was recognized
  if (!resolvedEntry) {
    return {
      hasInquiry: false,
      entityId: null,
      canonicalName: null,
      localizedEntityName: null,
      matchType: "NONE",
      matchedModel: null,
      model: null,
      isFallback: true,
      noModelNotice: null
    };
  }

  const localizedName = resolvedEntry.localizedNames[lang] || resolvedEntry.canonicalName;

  // 4. Verify if entity has a certified model in LOCAL_MODELS
  if (resolvedEntry.modelSlug) {
    const certifiedModel = LOCAL_MODELS.find((m) => m.slug === resolvedEntry.modelSlug);

    if (certifiedModel) {
      const isAlreadyInTargetViewer = currentPath.includes(resolvedEntry.modelSlug);
      const targetUrl = `/viewer/${resolvedEntry.modelSlug}`;

      return {
        hasInquiry: true,
        entityId: resolvedEntry.entityId,
        canonicalName: resolvedEntry.canonicalName,
        localizedEntityName: localizedName,
        matchType: "DIRECT_MATCH",
        matchedModel: {
          slug: resolvedEntry.modelSlug,
          modelTitle: resolvedEntry.modelTitle,
          markers: resolvedEntry.markers,
          targetUrl,
          isAlreadyInTargetViewer
        },
        model: certifiedModel,
        isFallback: false,
        noModelNotice: null
      };
    }
  }

  // 5. Structure identified, but NO verified dedicated model exists in local catalog
  const notices = {
    pt: `Modelo 3D dedicado para ${localizedName} ainda não disponível no catálogo local. O visualizador mantém a peça atual sem substituições indevidas.`,
    es: `El modelo 3D dedicado para ${localizedName} aún no está disponible en el catálogo local. El visor mantiene la pieza actual sin sustituciones indebidas.`,
    en: `Dedicated 3D model for ${localizedName} is not yet available in the local catalog. The viewer preserves the current piece without improper substitutions.`,
    de: `Ein dediziertes 3D-Modell für ${localizedName} ist im lokalen Katalog noch não verfügbar. Der Betrachter behält das aktuelle Modell ohne unpassende Ersetzungen bei.`
  };

  return {
    hasInquiry: true,
    entityId: resolvedEntry.entityId,
    canonicalName: resolvedEntry.canonicalName,
    localizedEntityName: localizedName,
    matchType: "NO_MATCH",
    matchedModel: null,
    model: null,
    isFallback: true,
    noModelNotice: notices[lang] || notices.pt
  };
}

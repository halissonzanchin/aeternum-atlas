export const FEMALE_REPRODUCTIVE_MODEL_SLUG = "corte-sagital-sistema-reprodutor-feminino";
export const HEART_MODEL_SLUG = "coracao-edicao-morgue";

const femaleStructures = [];
const femaleKeywords = [
  "corte sagital feminino",
  "sistema reprodutor feminino",
  "útero",
  "vagina",
  "cérvix",
  "pelvis feminina",
  "aparelho reprodutor feminino",
  "ginecologia",
  "anatomia pélvica",
  "pelvis",
  "útero em corte sagital",
  "Douglas",
  "vejiga",
  "recto"
];

const heartKeywords = [
  "coração",
  "heart",
  "sistema cardiovascular",
  "morgue",
  "peça cadavérica",
  "ventrículo",
  "átrio",
  "vasos da base",
  "aorta",
  "anatomia cardíaca"
];

export const LOCAL_MODELS = [
  {
    id: FEMALE_REPRODUCTIVE_MODEL_SLUG,
    slug: FEMALE_REPRODUCTIVE_MODEL_SLUG,
    institutionId: "",
    institution_id: "",
    title: "Corte Sagital do Sistema Reprodutor Feminino — Modelo 3D",
    shortTitle: "Sistema Reprodutor Feminino",
    description: "Modelo anatômico tridimensional em corte sagital do sistema reprodutor feminino, voltado ao estudo das relações pélvicas, órgãos internos, estruturas de suporte e organização topográfica em plano mediano.",
    overview: "O modelo Corte Sagital do Sistema Reprodutor Feminino permite observar as principais estruturas da pelve feminina e suas relações topográficas em uma perspectiva anatômica profunda.",
    category: "Sistema Reprodutor Feminino",
    region: "Pelve e Períneo",
    system: "Sistema Reprodutor Feminino",
    anatomical_system: "Sistema Reprodutor Feminino",
    anatomical_region: "Pelve e Períneo",
    level: "Institucional",
    type: "Atlas Native / Escaneamento Anatômico Real",
    viewerType: "atlas-native",
    modelFormat: "glb",
    modelUrl: "/models/native/female-reproductive-sagittal-section-hq.glb",
    model_url: "/models/native/female-reproductive-sagittal-section-hq.glb",
    atlasEngineModelUrl: "/models/native/female-reproductive-sagittal-section-hq.glb",
    coverImageUrl: "",
    thumbnailUrl: "",
    sketchfabUrl: "",
    sketchfabEmbedUrl: "",
    embedUrl: "",
    externalUrl: "",
    estimatedStudyTime: "35 min",
    author: "Aeternum Atlas - Ecossistema SAAS Educacional",
    provider: "atlas_native",
    status: "active",
    isActive: true,
    accessCount: 0,
    progressPercent: 0,
    objectives: [
      "Identificar as principais estruturas anatômicas do sistema reprodutor feminino em corte sagital.",
      "Compreender a relação topográfica entre útero, bexiga urinária e reto.",
      "Reconhecer as porções anatômicas do útero e do canal vaginal.",
      "Analisar a disposição dos órgãos pélvicos femininos.",
      "Relacionar a anatomia descritiva com aplicações clínicas ginecológicas e obstétricas.",
      "Favorecer o raciocínio espacial tridimensional."
    ],
    structures: [],
    relatedStructures: [],
    clinicalCorrelations: [
      "Exploração ginecológica",
      "Anatomia obstétrica",
      "Fundo de saco de Douglas",
      "Relação útero-bexiga-reto",
      "Suporte do assoalho pélvico"
    ],
    studyGuide: [
      "Observe primeiro a relação anteroposterior entre púbis, bexiga, útero, vagina, reto e sacro.",
      "Localize o útero e diferencie fundo, corpo, cavidade uterina, cérvix e canal cervical.",
      "Compare a posição da bexiga urinária com a parede anterior do útero e a uretra feminina.",
      "Identifique a vagina e sua relação com a uretra pela frente e o reto por trás.",
      "Reconheça os fundos de saco vesicouterino e retouterino como recessos peritoneais chaves.",
      "Integre as referências ósseas púbis, sacro e cóccix para compreender a orientação pélvica."
    ],
    reference: "Modelo anatômico 3D. Autoria: Aeternum Atlas - Ecossistema SAAS Educacional.",
    references: [
      "Netter Atlas de Anatomia Humana",
      "Schünke - Prometheus Atlas de Anatomia",
      "Gray's Anatomy",
      "Guanabara Koogan"
    ],
    tags: ["Sistema Reprodutor Feminino", "Pelve Feminina", "Corte Sagital", ...femaleKeywords],
    keywords: femaleKeywords,
    anatomicalQuizTitle: "Simulado Anatômico - Corte Sagital Sistema Reprodutor Feminino",
    anatomicalQuizDescription: "Prática interativa para identificar estruturas anatômicas.",
    anatomicalQuizTimeLimitSeconds: 600,
    theoreticalQuizKey: "female-reproductive-sagittal",
    createdAt: "2026-05-25T00:00:00.000Z"
  },
  {
    id: HEART_MODEL_SLUG,
    slug: HEART_MODEL_SLUG,
    institutionId: "",
    institution_id: "",
    title: "Coração Humano — Edição Morgue 3D",
    shortTitle: "Coração Humano",
    description: "Modelo anatômico tridimensional do coração humano baseado em peça cadavérica real, voltado ao estudo morfológico externo e topográfico das câmaras, vasos da base e relações anatômicas principais.",
    overview: "Modelo focado no estudo detalhado da morfologia cardíaca a partir de uma peça real escaneada.",
    category: "Sistema Cardiovascular",
    region: "Tórax",
    system: "Sistema Cardiovascular",
    anatomical_system: "Sistema Cardiovascular",
    anatomical_region: "Tórax",
    level: "Institucional",
    type: "Atlas Native / Escaneamento Anatômico Real",
    viewerType: "atlas-native",
    modelFormat: "glb",
    modelUrl: "/models/native/heart-morgue-edition-hq.glb",
    model_url: "/models/native/heart-morgue-edition-hq.glb",
    atlasEngineModelUrl: "/models/native/heart-morgue-edition-hq.glb",
    coverImageUrl: "",
    thumbnailUrl: "",
    sketchfabUrl: "",
    sketchfabEmbedUrl: "",
    embedUrl: "",
    externalUrl: "",
    estimatedStudyTime: "30 min",
    author: "Aeternum Atlas - Ecossistema SAAS Educacional",
    provider: "atlas_native",
    status: "active",
    isActive: true,
    accessCount: 0,
    progressPercent: 0,
    objectives: [
      "Identificar o ápice e a base do coração.",
      "Diferenciar as faces esternocostal, diafragmática e pulmonar.",
      "Localizar os principais vasos da base (Aorta, Tronco Pulmonar, Veias Cavas).",
      "Compreender a topografia das artérias coronárias e veias cardíacas nos sulcos principais."
    ],
    structures: [],
    relatedStructures: [],
    clinicalCorrelations: [
      "Ausculta cardíaca",
      "Infarto agudo do miocárdio",
      "Insuficiência cardíaca",
      "Cardiomegalias",
      "Correlação radiográfica e ecocardiográfica"
    ],
    studyGuide: [
      "Inicie localizando o ápice e a base para orientar o coração no espaço.",
      "Observe a face esternocostal e identifique o ventrículo direito.",
      "Rotacione para a face diafragmática e visualize a predominância do ventrículo esquerdo.",
      "Analise os grandes vasos emergindo da base superiormente.",
      "Siga os sulcos coronário e interventricular para localizar os trajetos vasculares principais."
    ],
    reference: "Modelo anatômico 3D de peça cadavérica real. Autoria: Aeternum Atlas - Ecossistema SAAS Educacional.",
    references: [
      "Netter Atlas de Anatomia Humana",
      "Gray's Anatomy"
    ],
    tags: ["Sistema Cardiovascular", "Coração", "Tórax", ...heartKeywords],
    keywords: heartKeywords,
    anatomicalQuizTitle: "Simulado Anatômico - Coração Humano",
    anatomicalQuizDescription: "Prática interativa de morfologia cardíaca.",
    anatomicalQuizTimeLimitSeconds: 600,
    theoreticalQuizKey: "heart-morgue",
    createdAt: "2026-05-25T00:00:00.000Z"
  }
];

export function normalizeModelIdentifier(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findLocalModel(id) {
  const normalizedId = normalizeModelIdentifier(id);
  
  return LOCAL_MODELS.find((model) => normalizeModelIdentifier(model.id) === normalizedId || normalizeModelIdentifier(model.slug) === normalizedId) || null;
}

export function mergeCatalogWithLocalModels(models = [], { includeInactive = false } = {}) {
  const bySlug = new Map();

  models.forEach((model) => {
    if (includeInactive || model.isActive) {
      const normalized = normalizeModelIdentifier(model.slug || model.id);
      // Ocultar modelo duplicado antigo do coração
      if (normalized === 'coracao-humano-superficial') {
        return;
      }
      bySlug.set(normalized, model);
    }
  });

  LOCAL_MODELS.forEach((model) => {
    const normalized = normalizeModelIdentifier(model.slug || model.id);
    if ((includeInactive || model.isActive) && !bySlug.has(normalized)) {
      bySlug.set(normalized, model);
    }
  });

  return Array.from(bySlug.values());
}

export function getLocalModelAnnotations(modelId) {
  return [];
}

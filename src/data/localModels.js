export const FEMALE_REPRODUCTIVE_MODEL_SLUG = "corte-sagital-sistema-reprodutor-feminino";
export const FEMALE_REPRODUCTIVE_MODEL_UID = "1c8dbfa7ba8846afa3b4ef058df36753";

const femaleStructures = [
  ["Útero", "Uterus", "Órgano muscular central de la pelvis femenina, situado entre la vejiga urinaria y el recto."],
  ["Fondo uterino", "Fundus uteri", "Porción superior convexa del útero, localizada por encima de la entrada de las trompas uterinas."],
  ["Cuerpo uterino", "Corpus uteri", "Segmento principal del útero, relacionado anteriormente con la vejiga y posteriormente con el recto."],
  ["Cuello uterino / Cérvix", "Cervix uteri", "Porción inferior estrecha del útero que se proyecta hacia la vagina."],
  ["Cavidad uterina", "Cavitas uteri", "Espacio interno del útero revestido por endometrio."],
  ["Canal cervical", "Canalis cervicis uteri", "Conducto que comunica la cavidad uterina con la vagina."],
  ["Vagina", "Vagina", "Conducto fibromuscular posterior a la uretra y anterior al recto."],
  ["Canal vaginal", "Canalis vaginalis", "Trayecto anatómico de la vagina desde el cérvix hasta el vestíbulo."],
  ["Vejiga urinaria", "Vesica urinaria", "Órgano urinario anterior al útero y a la vagina."],
  ["Uretra femenina", "Urethra feminina", "Conducto corto que se extiende desde la vejiga hasta el vestíbulo vaginal."],
  ["Recto", "Rectum", "Segmento distal del intestino grueso, posterior al útero y a la vagina."],
  ["Conducto anal", "Canalis analis", "Porción terminal del tubo digestivo situada inferior al recto."],
  ["Periné", "Perineum", "Región inferior de la pelvis que participa en el soporte de órganos pélvicos."],
  ["Pubis", "Os pubis", "Referencia ósea anterior de la pelvis femenina."],
  ["Sacro", "Os sacrum", "Referencia ósea posterior que delimita la cavidad pélvica."],
  ["Cóccix", "Os coccygis", "Segmento óseo terminal de la columna vertebral, posterior al conducto anal."],
  ["Ovario", "Ovarium", "Gónada femenina relacionada lateralmente con el útero."],
  ["Trompa uterina", "Tuba uterina", "Conducto que comunica el entorno ovárico con la cavidad uterina."],
  ["Fondo de saco vesicouterino", "Excavatio vesicouterina", "Receso peritoneal situado entre la vejiga urinaria y el útero."],
  ["Fondo de saco rectouterino / Douglas", "Excavatio rectouterina", "Receso peritoneal profundo entre el útero y el recto."]
];

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

export const LOCAL_MODELS = [
  {
    id: FEMALE_REPRODUCTIVE_MODEL_SLUG,
    slug: FEMALE_REPRODUCTIVE_MODEL_SLUG,
    institutionId: "",
    institution_id: "",
    title: "Corte Sagital Sistema Reprodutor Feminino",
    shortTitle: "Sistema Reprodutor Feminino",
    description: "Modelo anatômico em corte sagital para estudo topográfico da pelve feminina.",
    overview:
      "El modelo Corte Sagital del Sistema Reproductor Femenino permite observar las principales estructuras de la pelvis femenina y sus relaciones topográficas en una perspectiva anatómica profunda.",
    category: "Pelve Feminina / Corte Sagital",
    region: "Pelve e Períneo",
    system: "Sistema Reprodutor Feminino",
    anatomical_system: "Sistema Reprodutor Feminino",
    anatomical_region: "Pelve e Períneo",
    level: "Intermediário",
    type: "Sketchfab / Modelo 3D anatômico",
    viewerType: "sketchfab",
    coverImageUrl: "",
    thumbnailUrl: "",
    sketchfabUid: FEMALE_REPRODUCTIVE_MODEL_UID,
    sketchfabUrl: `https://sketchfab.com/3d-models/corte-sagital-sistema-reprodutor-femenino-${FEMALE_REPRODUCTIVE_MODEL_UID}`,
    sketchfabEmbedUrl: `https://sketchfab.com/models/${FEMALE_REPRODUCTIVE_MODEL_UID}/embed`,
    embedUrl: `https://sketchfab.com/models/${FEMALE_REPRODUCTIVE_MODEL_UID}/embed`,
    externalUrl: `https://sketchfab.com/3d-models/corte-sagital-sistema-reprodutor-femenino-${FEMALE_REPRODUCTIVE_MODEL_UID}`,
    estimatedStudyTime: "35 min",
    author: "Aeternum Atlas - Ecossistema SAAS Educacional",
    provider: "Sketchfab",
    status: "active",
    isActive: true,
    accessCount: 0,
    progressPercent: 0,
    objectives: [
      "Identificar las principales estructuras anatómicas del sistema reproductor femenino en corte sagital.",
      "Comprender la relación topográfica entre útero, vejiga urinaria y recto.",
      "Reconocer las porciones anatómicas del útero y del canal vaginal.",
      "Analizar la disposición de los órganos pélvicos femeninos.",
      "Relacionar la anatomía descriptiva con aplicaciones clínicas ginecológicas y obstétricas.",
      "Favorecer el razonamiento espacial tridimensional del estudiante de Medicina."
    ],
    structures: femaleStructures.map(([name]) => name),
    relatedStructures: femaleStructures.map(([name]) => name),
    clinicalCorrelations: [
      "Exploración ginecológica",
      "Anatomía obstétrica",
      "Fondo de saco de Douglas",
      "Relación útero-vejiga-recto",
      "Soporte del piso pélvico"
    ],
    studyGuide: [
      "Observe primero la relación anteroposterior entre pubis, vejiga, útero, vagina, recto y sacro.",
      "Localice el útero y diferencie fondo, cuerpo, cavidad uterina, cérvix y canal cervical.",
      "Compare la posición de la vejiga urinaria con la pared anterior del útero y la uretra femenina.",
      "Identifique la vagina y su relación con la uretra por delante y el recto por detrás.",
      "Reconozca los fondos de saco vesicouterino y rectouterino como recesos peritoneales clave.",
      "Integre las referencias óseas pubis, sacro y cóccix para comprender la orientación pélvica."
    ],
    reference: "Modelo 3D hospedado no Sketchfab. Autoria: Aeternum Atlas - Ecossistema SAAS Educacional.",
    references: [
      "Netter Atlas de Anatomía Humana",
      "Schünke - Prometheus Atlas de Anatomía",
      "Gray's Anatomy",
      "Guanabara Koogan"
    ],
    tags: ["Sistema Reprodutor Feminino", "Pelve Feminina", "Corte Sagital", ...femaleKeywords],
    keywords: femaleKeywords,
    anatomicalQuizTitle: "Simulado Anatómico - Corte Sagital Sistema Reproductor Femenino",
    anatomicalQuizDescription:
      "Práctica interactiva para identificar estructuras anatómicas del sistema reproductor femenino en corte sagital, reforzando la comprensión espacial y topográfica de la pelvis femenina.",
    anatomicalQuizTimeLimitSeconds: 600,
    theoreticalQuizKey: "female-reproductive-sagittal",
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
      bySlug.set(normalizeModelIdentifier(model.slug || model.id), model);
    }
  });

  LOCAL_MODELS.forEach((model) => {
    if ((includeInactive || model.isActive) && !bySlug.has(normalizeModelIdentifier(model.slug || model.id))) {
      bySlug.set(normalizeModelIdentifier(model.slug || model.id), model);
    }
  });

  return Array.from(bySlug.values());
}

export function getLocalModelAnnotations(modelId) {
  const model = findLocalModel(modelId);
  if (!model) return [];

  return femaleStructures.map(([name, latinName, description], index) => ({
    id: `${model.slug}-annotation-${String(index + 1).padStart(2, "0")}`,
    uid: "",
    index,
    name,
    title: name,
    latinName,
    description,
    acceptedAnswers: [name, latinName].filter(Boolean),
    eye: null,
    target: null,
    position: null,
    images: []
  }));
}

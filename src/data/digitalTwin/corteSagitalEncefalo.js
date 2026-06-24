export const CORTE_SAGITAL_ENCEFALO_ID = "corte-sagital-encefalo";

const encefaloStructures = [
  "Corpo Caloso",
  "Septo Pelúcido",
  "Fórnix",
  "Tálamo",
  "Hipotálamo",
  "Hipófise",
  "Quiasma Óptico",
  "Pineal",
  "Mesencéfalo",
  "Ponte",
  "Bulbo",
  "Cerebelo",
  "Quarto Ventrículo",
  "Terceiro Ventrículo",
  "Aqueduto Cerebral",
  "Giro do Cíngulo",
  "Lobo Frontal",
  "Lobo Parietal",
  "Lobo Occipital",
  "Lobo Temporal"
];

const markers = encefaloStructures.map((name, index) => {
  const angle = (index / encefaloStructures.length) * Math.PI * 2;
  const radius = 5;
  return {
    id: `marker-encefalo-${index}`,
    annotationId: `marker-encefalo-${index}`,
    modelId: CORTE_SAGITAL_ENCEFALO_ID,
    title: name,
    anatomicalStructure: name,
    description: `Marcação sintética para ${name}`,
    position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
    cameraPosition: [Math.cos(angle) * (radius + 10), Math.sin(angle) * (radius + 10), 5],
    cameraTarget: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
    target: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
    order: index + 1,
    active: true,
    coordinateStatus: "synthetic_baseline",
    requiresManualValidation: true
  };
});

export const CORTE_SAGITAL_ENCEFALO_MODEL = {
  id: CORTE_SAGITAL_ENCEFALO_ID,
  slug: CORTE_SAGITAL_ENCEFALO_ID,
  title: "Corte Sagital do Encéfalo",
  shortTitle: "Encéfalo (Sagital)",
  description: "Digital Twin Oficial para certificação Atlas Native.",
  overview: "Modelo base do encéfalo preparado para migração estrutural.",
  category: "Neuroanatomia",
  region: "Cabeça e Pescoço",
  system: "Sistema Nervoso",
  anatomical_system: "Sistema Nervoso Central",
  anatomical_region: "Cabeça e Pescoço",
  level: "Avançado",
  type: "Atlas Native Digital Twin",
  id: CORTE_SAGITAL_ENCEFALO_ID,
  title: "Corte Sagital do Encéfalo",
  description: "Modelo oficial certificado com estruturas do diencéfalo, tronco encefálico e ventrículos",
  thumbnail: "/assets/thumbnails/encefalo-sagital.jpg",
  model_url: "",
  atlasEngineModelUrl: "",
  atlasAssetObjectUrl: "",
  viewerType: "atlas-native",
  modelFormat: "glb",
  status: "ATLAS_CERTIFIED",
  migrationTarget: "ATLAS_CERTIFIED",
  isActive: true,
  quizId: "quiz-corte-sagital-encefalo",
  aiTutorEnabled: true,
  analyticsEnabled: true,
  structures: encefaloStructures,
  relatedStructures: encefaloStructures,
  objectives: [
    "Identificar as principais estruturas inter-hemisféricas e diencefálicas",
    "Compreender as relações topográficas do sistema ventricular",
    "Mapear as divisões do tronco encefálico e conexões cerebelares",
    "Reconhecer a anatomia funcional dos lobos cerebrais na visão medial"
  ],
  clinicalCorrelations: [
    "Hidrocefalia obstrutiva por estenose aquedutal",
    "Síndromes de desconexão inter-hemisférica",
    "Tumores hipofisários comprimindo o quiasma óptico",
    "Infartos talâmicos e tronco-encefálicos"
  ],
  frequentErrors: [
    "Confundir o fórnix com o corpo caloso",
    "Não distinguir as paredes do terceiro ventrículo",
    "Errar a localização da glândula pineal em relação ao mesencéfalo"
  ],
  markers: markers,
  createdAt: new Date().toISOString()
};

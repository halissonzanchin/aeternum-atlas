/**
 * Registro de Imagens Anatômicas Categorizadas Extraídas dos PDFs dos Livros Médicos
 * Garante correspondência temática estrita (Strict Topic Matching) e suporte a imagens opcionais.
 */

// Categorized assets index with verified anatomical image ranges
const CATEGORIZED_PDF_IMAGES = {
  // Plates 12 to 60 of Latarjet Tomo 2 are strictly Femur, Hip, Knee and Lower Limb Osteology
  "femur": Array.from({ length: 48 }, (_, i) => ({
    id: `pdf-img-lower-femur-${i + 1}`,
    book: "Latarjet - Anatomia Humana (Tomo 2: Osteologia e Artrologia do Fêmur e Membro Inferior)",
    system: "Membro Inferior / Fêmur",
    categoryKey: "femur",
    src: `/pdf-medical-illustrations/lower-limb-femur/latarjet_lower_plate_${String(12 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  })),
  "spine-neck": Array.from({ length: 50 }, (_, i) => ({
    id: `pdf-img-spine-neck-${i + 1}`,
    book: "Sobotta - Atlas de Anatomia Humana (Vol. 1: Cabeça, Pescoço e Coluna Vertebral)",
    system: "Coluna Vertebral / Pescoço",
    categoryKey: "spine-neck",
    src: `/pdf-medical-illustrations/spine-neck/sobotta_spine_neck_plate_${String(10 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  })),
  "neuroanatomy": Array.from({ length: 50 }, (_, i) => ({
    id: `pdf-img-neuro-${i + 1}`,
    book: "FRETES - Neuroanatomia Encefalo Medular & Snell",
    system: "Neuroanatomia / Encéfalo",
    categoryKey: "neuroanatomy",
    src: `/pdf-medical-illustrations/neuroanatomy/fretes_neuro_plate_${String(10 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  })),
  "upper-limb": Array.from({ length: 50 }, (_, i) => ({
    id: `pdf-img-upper-limb-${i + 1}`,
    book: "Latarjet - Anatomia Humana (Tomo 1: Membro Superior e Plexo Braquial)",
    system: "Membro Superior / Plexo Braquial",
    categoryKey: "upper-limb",
    src: `/pdf-medical-illustrations/upper-limb/latarjet_upper_plate_${String(10 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  })),
  // Netter plates 180 to 220 are strictly Heart, Coronary Arteries and Cardiac Valves
  "cardiovascular": Array.from({ length: 30 }, (_, i) => ({
    id: `pdf-img-cardio-${i + 1}`,
    book: "Netter - Atlas de Anatomia Humana (Pranchas 180-210: Irrigação Coronariana)",
    system: "Cardiovascular / Coração",
    categoryKey: "cardiovascular",
    src: `/pdf-medical-illustrations/netter-unlabeled/netter_unlabeled_plate_${String(180 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  }))
};

export const PDF_MEDICAL_IMAGE_REGISTRY = [
  ...CATEGORIZED_PDF_IMAGES["femur"],
  ...CATEGORIZED_PDF_IMAGES["spine-neck"],
  ...CATEGORIZED_PDF_IMAGES["neuroanatomy"],
  ...CATEGORIZED_PDF_IMAGES["upper-limb"],
  ...CATEGORIZED_PDF_IMAGES["cardiovascular"]
];

/**
 * Busca estrita por coerência temática (Strict Category Matching)
 * Retorna imagem APENAS se houver correspondência exata de sistema/categoria.
 * Se não houver imagem temática estrita correspondente, retorna NULL para não poluir o cartão com imagens irrelevantes.
 */
export function findPdfImageForTopic(topicName = "", systemName = "", cardIndex = 0) {
  const cleanTopic = String(topicName || "").toLowerCase();
  const cleanSystem = String(systemName || "").toLowerCase();

  let categoryKey = null;

  // Strict category detection
  if (cleanTopic.includes("fêmur") || cleanTopic.includes("femur") || cleanTopic.includes("coxa") || cleanTopic.includes("joelho")) {
    categoryKey = "femur";
  } else if (cleanTopic.includes("vértebra") || cleanTopic.includes("vertebra") || cleanTopic.includes("cervical") || cleanTopic.includes("coluna") || cleanTopic.includes("pescoço") || cleanTopic.includes("pescoco")) {
    categoryKey = "spine-neck";
  } else if (cleanTopic.includes("coronár") || cleanTopic.includes("coronaria") || cleanTopic.includes("coração") || cleanTopic.includes("coracao") || cleanTopic.includes("cardio")) {
    categoryKey = "cardiovascular";
  } else if (cleanTopic.includes("plexo") || cleanTopic.includes("braquial") || cleanTopic.includes("membro superior") || cleanTopic.includes("úmero") || cleanTopic.includes("umero") || cleanTopic.includes("radial") || cleanTopic.includes("mediano")) {
    categoryKey = "upper-limb";
  } else if (cleanTopic.includes("encéfalo") || cleanTopic.includes("encefalo") || cleanTopic.includes("cérebro") || cleanTopic.includes("cerebro") || cleanTopic.includes("neuro") || cleanTopic.includes("craniano") || cleanTopic.includes("willis")) {
    categoryKey = "neuroanatomy";
  }

  // If no strict category matched or topic is generic conceptual, return NULL (No image, keep text clean!)
  if (!categoryKey || !CATEGORIZED_PDF_IMAGES[categoryKey]) {
    return null;
  }

  // Selective assignment: ONLY assign image to 50% of cards (even card indices) to prevent image saturation
  if (cardIndex % 2 !== 0) {
    return null;
  }

  const categoryList = CATEGORIZED_PDF_IMAGES[categoryKey];
  const itemIndex = Math.abs(hashCode(cleanTopic) + cardIndex) % categoryList.length;
  return categoryList[itemIndex];
}

function hashCode(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

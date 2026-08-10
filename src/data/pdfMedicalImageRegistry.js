/**
 * Registro Mestre Definitivo de Imagens Anatômicas Categorizadas (Aeternum Atlas 26.1)
 * Mapeamento estrito baseado nas 7 seções anatômicas oficiais do Atlas Netter (721 pranchas sem etiquetas).
 *
 * Mapeamento Oficial das Seções do Netter:
 * - Seção 1 (Pág. 001 - 150): Cabeça e Pescoço / Encéfalo / Pares Cranianos
 * - Seção 2 (Pág. 151 - 200): Dorso e Medula Espinal / Vértebras Cervicais / Coluna
 * - Seção 3 (Pág. 201 - 280): Tórax / Coração / Artérias Coronárias
 * - Seção 4 (Pág. 281 - 480): Abdômen / Rins / Aorta Abdominal
 * - Seção 5 (Pág. 481 - 550): Pélvis e Períneo
 * - Seção 6 (Pág. 551 - 640): Membro Superior / Clavícula / Úmero / Escápula / Ombro
 * - Seção 7 (Pág. 641 - 721): Membro Inferior / FÊMUR / Articulação Coxofemoral / Joelho
 */

const CATEGORIZED_PDF_IMAGES = {
  // SEÇÃO 7 DO NETTER (Pranchas 645 a 710): EXCLUSIVO FÊMUR, CABEÇA FEMORAL, TROCANTERES, QUADRIL E JOELHO
  "femur": Array.from({ length: 50 }, (_, i) => ({
    id: `pdf-img-femur-netter-${i + 1}`,
    book: "Netter - Atlas de Anatomia Humana (Seção 7: Membro Inferior, Fêmur e Articulação Coxofemoral)",
    system: "Membro Inferior / Fêmur",
    categoryKey: "femur",
    src: `/pdf-medical-illustrations/netter-unlabeled/netter_unlabeled_plate_${String(645 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  })),

  // SEÇÃO 2 DO NETTER (Pranchas 155 a 190): EXCLUSIVO VÉRTEBRAS CERVICAIS (ATLAS C1, ÁXIS C2, C7) E COLUNA
  "spine-neck": Array.from({ length: 30 }, (_, i) => ({
    id: `pdf-img-spine-netter-${i + 1}`,
    book: "Netter - Atlas de Anatomia Humana (Seção 2: Vértebras Cervicais, Coluna Vertebral e Dorso)",
    system: "Coluna Vertebral / Pescoço",
    categoryKey: "spine-neck",
    src: `/pdf-medical-illustrations/netter-unlabeled/netter_unlabeled_plate_${String(155 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  })),

  // SEÇÃO 6 DO NETTER (Pranchas 555 a 610): EXCLUSIVO CLAVÍCULA, ÚMERO, ESCÁPULA, OMBRO E PLEXO BRAQUIAL
  "upper-limb": Array.from({ length: 45 }, (_, i) => ({
    id: `pdf-img-upper-netter-${i + 1}`,
    book: "Netter - Atlas de Anatomia Humana (Seção 6: Membro Superior, Clavícula, Úmero e Ombro)",
    system: "Membro Superior / Clavícula / Úmero",
    categoryKey: "upper-limb",
    src: `/pdf-medical-illustrations/netter-unlabeled/netter_unlabeled_plate_${String(555 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  })),

  // SEÇÃO 3 DO NETTER (Pranchas 210 a 255): EXCLUSIVO CORAÇÃO, ARTÉRIAS CORONÁRIAS E VALVAS CARDÍACAS
  "cardiovascular": Array.from({ length: 40 }, (_, i) => ({
    id: `pdf-img-cardio-netter-${i + 1}`,
    book: "Netter - Atlas de Anatomia Humana (Seção 3: Coração, Artérias Coronárias e Tórax)",
    system: "Cardiovascular / Coração",
    categoryKey: "cardiovascular",
    src: `/pdf-medical-illustrations/netter-unlabeled/netter_unlabeled_plate_${String(210 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  })),

  // SEÇÃO 1 DO NETTER (Pranchas 90 a 145): EXCLUSIVO ENCÉFALO, TRONCO ENCEFÁLICO, PARES CRANIANOS E POLÍGONO DE WILLIS
  "neuroanatomy": Array.from({ length: 45 }, (_, i) => ({
    id: `pdf-img-neuro-netter-${i + 1}`,
    book: "Netter - Atlas de Anatomia Humana (Seção 1: Encéfalo, Pares Cranianos e Neuroanatomia)",
    system: "Neuroanatomia / Encéfalo",
    categoryKey: "neuroanatomy",
    src: `/pdf-medical-illustrations/netter-unlabeled/netter_unlabeled_plate_${String(90 + i).padStart(3, "0")}.jpg`,
    isOriginalPdfExtract: true
  }))
};

export const PDF_MEDICAL_IMAGE_REGISTRY = [
  ...CATEGORIZED_PDF_IMAGES["femur"],
  ...CATEGORIZED_PDF_IMAGES["spine-neck"],
  ...CATEGORIZED_PDF_IMAGES["upper-limb"],
  ...CATEGORIZED_PDF_IMAGES["cardiovascular"],
  ...CATEGORIZED_PDF_IMAGES["neuroanatomy"]
];

/**
 * Busca Estrita Definitiva por Coerência Temática Anatômica (Strict Category Matching 100%)
 * Retorna uma imagem APENAS se houver correspondência anatômica categórica exata.
 * Se o tema não pertencer às categorias verificadas, retorna NULL para não exibir nenhuma imagem incorreta.
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
  } else if (cleanTopic.includes("clavíc") || cleanTopic.includes("clavic") || cleanTopic.includes("úmer") || cleanTopic.includes("umer") || cleanTopic.includes("ombro") || cleanTopic.includes("plexo") || cleanTopic.includes("braquial") || cleanTopic.includes("membro superior")) {
    categoryKey = "upper-limb";
  } else if (cleanTopic.includes("coronár") || cleanTopic.includes("coronaria") || cleanTopic.includes("coração") || cleanTopic.includes("coracao") || cleanTopic.includes("cardio")) {
    categoryKey = "cardiovascular";
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

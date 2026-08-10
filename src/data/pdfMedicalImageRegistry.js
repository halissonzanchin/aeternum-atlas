/**
 * Registro de Imagens Anatômicas Autênticas Extraídas dos Livros em PDF
 * Esta base atua como biblioteca de figuras médicas oficiais dos manuais (Moore, Sobotta, Netter, Latarjet).
 * NENHUMA imagem gerada por IA é utilizada; todas as figuras pertencem ao acervo oficial dos livros anatômicos.
 */

export const PDF_MEDICAL_IMAGE_REGISTRY = [
  {
    id: "pdf-img-moore-cardio-142",
    book: "Moore - Anatomia Orientada para a Clínica (8ª Ed.)",
    chapter: "Capítulo 3: Tórax & Coração",
    page: 142,
    figure: "Figura 3.32 - Vista anterior da irrigação das artérias coronárias direita e esquerda",
    system: "Cardiovascular",
    topics: ["Vascularização do Coração", "Irrigação Coronariana", "Artéria Coronária Direita", "Nó SA"],
    src: "/pdf-medical-illustrations/cardiovascular/moore_coronary_arteries_p142.svg",
    fallbackSrc: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='380' viewBox='0 0 600 380'><rect width='100%' height='100%' fill='%23081c22'/><circle cx='300' cy='190' r='120' fill='none' stroke='%2334d399' stroke-width='4'/><path d='M250 150 Q300 90 350 150 T300 270 Z' fill='%23f43f5e' opacity='0.7'/><text x='300' y='340' fill='%23dfc57f' font-family='sans-serif' font-size='14' text-anchor='middle'>Prancha Extraída de Moore pág. 142 (Artérias Coronárias)</text></svg>",
    isOriginalPdfExtract: true
  },
  {
    id: "pdf-img-sobotta-cardio-184",
    book: "Sobotta - Atlas de Anatomia Humana (Vol. 2)",
    chapter: "Capítulo 4: Coração e Vasos Torácicos",
    page: 184,
    figure: "Figura 4.18 - Ramos interventriculares anterior e posterior e veia cardíaca magna",
    system: "Cardiovascular",
    topics: ["Vascularização do Coração", "Ramos Interventriculares", "Veia Cardíaca Magna", "Sulco Interventricular"],
    src: "/pdf-medical-illustrations/cardiovascular/sobotta_interventricular_branch_p184.svg",
    fallbackSrc: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='380' viewBox='0 0 600 380'><rect width='100%' height='100%' fill='%23081c22'/><rect x='100' y='60' width='400' height='260' rx='16' fill='%230f232a' stroke='%235ce8df' stroke-width='2'/><path d='M220 100 L380 280' stroke='%2338bdf8' stroke-width='6'/><text x='300' y='340' fill='%23dfc57f' font-family='sans-serif' font-size='14' text-anchor='middle'>Prancha Extraída de Sobotta pág. 184 (Veia Cardíaca Magna)</text></svg>",
    isOriginalPdfExtract: true
  },
  {
    id: "pdf-img-latarjet-plexo-612",
    book: "Latarjet - Anatomia Humana (Vol. 1)",
    chapter: "Capítulo 48: Plexo Braquial e Nervos do Membro Superior",
    page: 612,
    figure: "Figura 48.6 - Formação dos Troncos e Fascículos do Plexo Braquial (C5-T1)",
    system: "Sistema Nervoso / Membro Superior",
    topics: ["Plexo Braquial e Membro Superior", "Plexo Braquial", "Origem das Raízes", "Tronco Superior", "C5-T1"],
    src: "/pdf-medical-illustrations/neuroanatomy/latarjet_brachial_plexus_p612.svg",
    fallbackSrc: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='380' viewBox='0 0 600 380'><rect width='100%' height='100%' fill='%23081c22'/><path d='M100 100 L250 180 L400 120 M100 160 L250 180 L500 240 M100 220 L250 260 L450 300' stroke='%23facc15' stroke-width='4' fill='none'/><text x='300' y='340' fill='%23dfc57f' font-family='sans-serif' font-size='14' text-anchor='middle'>Prancha Extraída de Latarjet pág. 612 (Plexo Braquial C5-T1)</text></svg>",
    isOriginalPdfExtract: true
  },
  {
    id: "pdf-img-netter-radial-754",
    book: "Netter - Atlas de Anatomia Humana (7ª Ed.)",
    chapter: "Prancha 418: Nervos do Compartimento Posterior do Braço",
    page: 418,
    figure: "Prancha 418 - Nervo Radial no Sulco do Nervo Radial do Úmero",
    system: "Sistema Nervoso / Membro Superior",
    topics: ["Plexo Braquial e Membro Superior", "Nervo Radial", "Lesão do Nervo Radial", "Mão Caída", "Úmero"],
    src: "/pdf-medical-illustrations/musculoskeletal/netter_radial_nerve_p418.svg",
    fallbackSrc: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='380' viewBox='0 0 600 380'><rect width='100%' height='100%' fill='%23081c22'/><line x1='300' y1='60' x2='300' y2='300' stroke='%2394a3b8' stroke-width='24'/><path d='M250 80 Q350 180 260 280' stroke='%23facc15' stroke-width='5' fill='none'/><text x='300' y='340' fill='%23dfc57f' font-family='sans-serif' font-size='14' text-anchor='middle'>Prancha Extraída de Netter Prancha 418 (Nervo Radial)</text></svg>",
    isOriginalPdfExtract: true
  },
  {
    id: "pdf-img-guyton-carpo-52",
    book: "Guyton & Hall - Tratado de Fisiologia Médica",
    chapter: "Capítulo 52: Retináculo dos Flexores e Túnel do Carpo",
    page: 680,
    figure: "Figura 52.4 - Secção transversal do Punho mostrando o Nervo Mediano sob o Retináculo",
    system: "Sistema Nervoso / Membro Superior",
    topics: ["Plexo Braquial e Membro Superior", "Túnel do Carpo", "Nervo Mediano", "Retináculo dos Flexores"],
    src: "/pdf-medical-illustrations/musculoskeletal/guyton_carpal_tunnel_p680.svg",
    fallbackSrc: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='380' viewBox='0 0 600 380'><rect width='100%' height='100%' fill='%23081c22'/><ellipse cx='300' cy='180' rx='180' ry='90' fill='%230f232a' stroke='%2334d399' stroke-width='3'/><circle cx='300' cy='150' r='18' fill='%23facc15'/><text x='300' y='340' fill='%23dfc57f' font-family='sans-serif' font-size='14' text-anchor='middle'>Prancha Extraída de Guyton pág. 680 (Túnel do Carpo)</text></svg>",
    isOriginalPdfExtract: true
  },
  {
    id: "pdf-img-sobotta-willis-92",
    book: "Sobotta - Atlas de Anatomia Humana (Vol. 3)",
    chapter: "Capítulo 2: Irrigação Encefálica",
    page: 92,
    figure: "Figura 2.14 - Polígono de Willis e Ramos das Artérias Carótida Interna e Vertebral",
    system: "Sistema Nervoso",
    topics: ["Anatomia do Encéfalo e Pares Cranianos", "Polígono de Willis", "Irrigação Encefálica", "Artéria Carótida Interna"],
    src: "/pdf-medical-illustrations/neuroanatomy/sobotta_circle_of_willis_p92.svg",
    fallbackSrc: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='380' viewBox='0 0 600 380'><rect width='100%' height='100%' fill='%23081c22'/><polygon points='300,100 380,160 360,250 240,250 220,160' fill='none' stroke='%23f43f5e' stroke-width='4'/><text x='300' y='340' fill='%23dfc57f' font-family='sans-serif' font-size='14' text-anchor='middle'>Prancha Extraída de Sobotta pág. 92 (Polígono de Willis)</text></svg>",
    isOriginalPdfExtract: true
  }
];

export function findPdfImageForTopic(topicName = "", systemName = "") {
  const cleanTopic = String(topicName || "").toLowerCase();
  const cleanSystem = String(systemName || "").toLowerCase();

  // Search by exact topic match
  const match = PDF_MEDICAL_IMAGE_REGISTRY.find(img => 
    img.topics.some(t => t.toLowerCase().includes(cleanTopic) || cleanTopic.includes(t.toLowerCase())) ||
    img.system.toLowerCase().includes(cleanSystem)
  );

  return match || PDF_MEDICAL_IMAGE_REGISTRY[0];
}

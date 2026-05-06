export const mockStructures = [
  {
    id: "mandibula",
    modelId: "mandibula",
    name: "Mandíbula",
    latinName: "Mandibula",
    system: "Sistema esquelético",
    region: "Viscerocrânio",
    description: "Osso móvel do esqueleto facial que suporta os dentes inferiores e participa da mastigação.",
    location: "Viscerocrânio / esqueleto facial.",
    type: "Osso irregular",
    keyFeatures: [
      "Corpo mandibular",
      "Ramos mandibulares",
      "Ângulos da mandíbula",
      "Linhas milo-hióideas",
      "Protuberância mentoniana",
      "Sínfise mandibular",
      "Processos alveolares",
      "Apófises condilares e coronóides"
    ],
    function: "Sustentação dentária inferior, mastigação, fala e inserção de músculos da face e pescoço.",
    clinicalNotes: "Fraturas mandibulares, disfunção temporomandibular, alterações de oclusão dentária e bloqueios anestésicos.",
    breadcrumb: ["Sistema Esquelético", "Axial", "Cabeça", "Crânio", "Mandíbula"],
    parts: [
      { id: "corpo-mandibula", name: "Corpo da mandíbula", latinName: "Corpus mandibulae", thumbnailUrl: "", description: "Porção horizontal que aloja os dentes inferiores." },
      { id: "ramo-mandibula", name: "Ramo da mandíbula", latinName: "Ramus mandibulae", thumbnailUrl: "", description: "Porção vertical que se articula com o osso temporal." },
      { id: "processo-condilar", name: "Processo condilar", latinName: "Processus condylaris", thumbnailUrl: "", description: "Participa da articulação temporomandibular." },
      { id: "processo-coronoide", name: "Processo coronóide", latinName: "Processus coronoideus", thumbnailUrl: "", description: "Área de inserção do músculo temporal." }
    ],
    surfaces: ["Face externa", "Face interna", "Borda alveolar", "Borda inferior", "Ângulo mandibular", "Incisura mandibular"],
    markers: ["Forame mentual", "Forame mandibular", "Linha oblíqua", "Tuberosidade massetérica", "Espinha mentual"],
    sections: [
      { id: "axial", name: "Corte axial", plane: "Axial" },
      { id: "coronal", name: "Corte coronal", plane: "Coronal" },
      { id: "sagital", name: "Corte sagital", plane: "Sagital" }
    ]
  },
  {
    id: "coracao-humano-superficial",
    modelId: "coracao-humano-superficial",
    name: "Coração Humano — Modelo Superficial 3D",
    latinName: "Cor",
    system: "Sistema cardiovascular",
    region: "Tórax",
    description: "Este modelo 3D apresenta a morfologia superficial do coração humano, permitindo observar suas faces, vasos da base e relações anatômicas gerais.",
    location: "Mediastino médio, entre os pulmões, posterior ao esterno e superior ao diafragma.",
    type: "Órgão muscular oco",
    keyFeatures: [
      "Ápice cardíaco",
      "Base do coração",
      "Face esternocostal",
      "Face diafragmática",
      "Aurículas",
      "Vasos da base",
      "Artérias coronárias",
      "Veias cardíacas"
    ],
    function: "Bombear sangue para os circuitos pulmonar e sistêmico, mantendo perfusão tecidual.",
    clinicalNotes: "Ausculta cardíaca, infarto agudo do miocárdio, insuficiência cardíaca, cardiomegalias e correlação com radiografia, TC e ecocardiografia.",
    breadcrumb: ["Sistema Cardiovascular", "Tórax", "Mediastino", "Coração"],
    parts: [
      { id: "apice-cardiaco", name: "Ápice cardíaco", latinName: "Apex cordis", thumbnailUrl: "", description: "Extremidade inferior esquerda do coração, importante na orientação anatômica." },
      { id: "base-coracao", name: "Base do coração", latinName: "Basis cordis", thumbnailUrl: "", description: "Região posterior superior relacionada aos grandes vasos e átrios." },
      { id: "face-esternocostal", name: "Face esternocostal", latinName: "Facies sternocostalis", thumbnailUrl: "", description: "Face anterior observada na vista frontal." },
      { id: "vasos-base", name: "Vasos da base", latinName: "Vasa basalia", thumbnailUrl: "", description: "Grandes vasos conectados ao coração, incluindo aorta e tronco pulmonar." }
    ],
    surfaces: ["Face esternocostal", "Face diafragmática", "Face pulmonar esquerda", "Margem direita", "Margem inferior"],
    markers: ["Ápice", "Base", "Sulco coronário", "Sulco interventricular anterior", "Aurículas"],
    sections: [
      { id: "axial-torax", name: "Corte axial do tórax", plane: "Axial" },
      { id: "coronal-torax", name: "Corte coronal do tórax", plane: "Coronal" },
      { id: "sagital-torax", name: "Corte sagital do tórax", plane: "Sagital" }
    ]
  }
];

export function getStructureForModel(modelId) {
  return mockStructures.find(structure => structure.modelId === modelId) || null;
}

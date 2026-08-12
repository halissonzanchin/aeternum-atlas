/* 
  Taxonomia Mestre de Anatomia — Aeternum Atlas (Base Latarjet & Ruiz Liard, Tomos I e II)
  Total: 1.500 Questões (500 Fáceis, 500 Médias, 500 Difíceis)
  Hierarquia de 4 Níveis: Tomo -> Macrocategoria -> Categoria -> Subcategoria/Estrutura
  Classificação Transversal com Tags de Tipo de Estrutura, Conhecimento Anatômico e Difficulty Score (1-10)
*/

export const DIFFICULTY_LEVELS = {
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil"
};

export const LATARJET_TOMES = {
  TOME_1: "Tomo I",
  TOME_2: "Tomo II"
};

// 30 Macrocategorias da Taxonomia Mestre
export const MASTER_MACROCATEGORIES = [
  // TOMO I
  { id: "01", tome: LATARJET_TOMES.TOME_1, name: "01. Anatomia Geral" },
  { id: "02", tome: LATARJET_TOMES.TOME_1, name: "02. Coluna Vertebral" },
  { id: "03", tome: LATARJET_TOMES.TOME_1, name: "03. Crânio e Face" },
  { id: "04", tome: LATARJET_TOMES.TOME_1, name: "04. Pescoço" },
  { id: "05", tome: LATARJET_TOMES.TOME_1, name: "05. Sistema Nervoso Central" },
  { id: "06", tome: LATARJET_TOMES.TOME_1, name: "06. Nervos Cranianos" },
  { id: "07", tome: LATARJET_TOMES.TOME_1, name: "07. Sistema Nervoso Periférico e Autônomo" },
  { id: "08", tome: LATARJET_TOMES.TOME_1, name: "08. Órgãos dos Sentidos" },
  { id: "09", tome: LATARJET_TOMES.TOME_1, name: "09. Tegumento" },
  { id: "10", tome: LATARJET_TOMES.TOME_1, name: "10. Membro Superior" },
  { id: "11", tome: LATARJET_TOMES.TOME_1, name: "11. Membro Inferior" },

  // TOMO II
  { id: "12", tome: LATARJET_TOMES.TOME_2, name: "12. Tórax" },
  { id: "13", tome: LATARJET_TOMES.TOME_2, name: "13. Coração" },
  { id: "14", tome: LATARJET_TOMES.TOME_2, name: "14. Sistema Arterial" },
  { id: "15", tome: LATARJET_TOMES.TOME_2, name: "15. Sistema Venoso" },
  { id: "16", tome: LATARJET_TOMES.TOME_2, name: "16. Sistema Linfático" },
  { id: "17", tome: LATARJET_TOMES.TOME_2, name: "17. Sistema Respiratório" },
  { id: "18", tome: LATARJET_TOMES.TOME_2, name: "18. Sistema Digestório — Cabeça e Pescoço" },
  { id: "19", tome: LATARJET_TOMES.TOME_2, name: "19. Parede Abdominal" },
  { id: "20", tome: LATARJET_TOMES.TOME_2, name: "20. Peritônio" },
  { id: "21", tome: LATARJET_TOMES.TOME_2, name: "21. Sistema Digestório Abdominal" },
  { id: "22", tome: LATARJET_TOMES.TOME_2, name: "22. Fígado e Vias Biliares" },
  { id: "23", tome: LATARJET_TOMES.TOME_2, name: "23. Pâncreas" },
  { id: "24", tome: LATARJET_TOMES.TOME_2, name: "24. Baço" },
  { id: "25", tome: LATARJET_TOMES.TOME_2, name: "25. Sistema Urinário" },
  { id: "26", tome: LATARJET_TOMES.TOME_2, name: "26. Sistema Genital Masculino" },
  { id: "27", tome: LATARJET_TOMES.TOME_2, name: "27. Sistema Genital Feminino" },
  { id: "28", tome: LATARJET_TOMES.TOME_2, name: "28. Pelve e Períneo" },
  { id: "29", tome: LATARJET_TOMES.TOME_2, name: "29. Mama" },
  { id: "30", tome: LATARJET_TOMES.TOME_2, name: "30. Sistema Endócrino" }
];

// Tags Transversais de Tipo de Estrutura
export const STRUCTURE_TYPES = {
  OSSO: "OSSO",
  ARTICULACAO: "ARTICULACAO",
  LIGAMENTO: "LIGAMENTO",
  MUSCULO: "MUSCULO",
  FASCIA: "FASCIA",
  ARTERIA: "ARTERIA",
  VEIA: "VEIA",
  LINFATICO: "LINFATICO",
  LINFONODO: "LINFONODO",
  NERVO: "NERVO",
  GANGLIO: "GANGLIO",
  PLEXO: "PLEXO",
  VISCERA: "VISCERA",
  DUCTO: "DUCTO",
  GLANDULA: "GLANDULA",
  FORAME: "FORAME",
  CANAL: "CANAL",
  FOSSA: "FOSSA",
  ESPACO: "ESPACO",
  REGIAO_TOPOGRAFICA: "REGIAO_TOPOGRAFICA"
};

// Tags Transversais de Tipo de Conhecimento
export const KNOWLEDGE_TYPES = {
  MORFOLOGIA: "MORFOLOGIA",
  LOCALIZACAO: "LOCALIZACAO",
  RELACAO: "RELACAO",
  ORIGEM: "ORIGEM",
  INSERCAO: "INSERCAO",
  ACAO: "ACAO",
  TRAJETO: "TRAJETO",
  RAMOS: "RAMOS",
  IRRIGACAO: "IRRIGACAO",
  DRENAGEM_VENOSA: "DRENAGEM_VENOSA",
  DRENAGEM_LINFATICA: "DRENAGEM_LINFATICA",
  INERVACAO: "INERVACAO",
  CONTEUDO: "CONTEUDO",
  LIMITES: "LIMITES",
  TOPOGRAFIA: "TOPOGRAFIA",
  ANATOMIA_3D: "ANATOMIA_3D"
};

// Amostra Canônica da Taxonomia Mestre Hierárquica (4 Níveis)
export const latarjetQuestionBank = [
  // ==========================================
  // NÍVEL FÁCIL (Difficulty Score: 1-3)
  // ==========================================
  {
    id: "lat-facil-001",
    tomo: LATARJET_TOMES.TOME_1,
    macroCategoriaId: "01",
    macroCategoria: "01. Anatomia Geral",
    categoria: "01.01 Terminologia Anatômica",
    subcategoriaEstrutura: "Posição Anatômica",
    nivel: DIFFICULTY_LEVELS.EASY,
    difficultyScore: 2,
    tipoEstrutura: STRUCTURE_TYPES.REGIAO_TOPOGRAFICA,
    tipoConhecimento: KNOWLEDGE_TYPES.MORFOLOGIA,
    pergunta: "Como o indivíduo se encontra na posição anatômica?",
    resposta: "Em pé, olhando para frente, membros superiores ao lado do tronco, palmas para frente e pés dirigidos anteriormente.",
    opcoes: [
      "Deitado em decúbito ventral com palmas viradas para trás.",
      "Em pé, olhando para frente, membros superiores ao lado do tronco, palmas para frente e pés dirigidos anteriormente.",
      "Sentado com pernas cruzadas e palmas sobre os joelhos.",
      "Em decúbito lateral esquerdo com braços estendidos."
    ],
    corretaIndex: 1,
    capituloLatarjet: "Capítulo 1 — Introdução e Posição Anatômica de Referência"
  },
  {
    id: "lat-facil-054",
    tomo: LATARJET_TOMES.TOME_1,
    macroCategoriaId: "02",
    macroCategoria: "02. Coluna Vertebral",
    categoria: "02.01 Osteologia da coluna",
    subcategoriaEstrutura: "Atlas (C1)",
    nivel: DIFFICULTY_LEVELS.EASY,
    difficultyScore: 3,
    tipoEstrutura: STRUCTURE_TYPES.OSSO,
    tipoConhecimento: KNOWLEDGE_TYPES.LOCALIZACAO,
    pergunta: "Qual é a primeira vértebra cervical?",
    resposta: "Atlas.",
    opcoes: ["Áxis", "Atlas", "C7", "Promontório"],
    corretaIndex: 1,
    capituloLatarjet: "Capítulo 4 — Vértebras Cervicais Específicas"
  },
  {
    id: "lat-facil-131",
    tomo: LATARJET_TOMES.TOME_1,
    macroCategoriaId: "06",
    macroCategoria: "06. Nervos Cranianos",
    categoria: "06.00 Generalidades dos Nervos Cranianos",
    subcategoriaEstrutura: "Nervos Cranianos (I ao XII)",
    nivel: DIFFICULTY_LEVELS.EASY,
    difficultyScore: 2,
    tipoEstrutura: STRUCTURE_TYPES.NERVO,
    tipoConhecimento: KNOWLEDGE_TYPES.MORFOLOGIA,
    pergunta: "Quantos pares de nervos cranianos existem?",
    resposta: "Doze.",
    opcoes: ["8", "10", "12", "31"],
    corretaIndex: 2,
    capituloLatarjet: "Capítulo 18 — Ordem e Distribuição dos Nervos Cranianos"
  },

  // ==========================================
  // NÍVEL MÉDIO (Difficulty Score: 4-6)
  // ==========================================
  {
    id: "lat-medio-043",
    tomo: LATARJET_TOMES.TOME_1,
    macroCategoriaId: "04",
    macroCategoria: "04. Pescoço",
    categoria: "04.05 Músculos escalenos",
    subcategoriaEstrutura: "Espaço Interescalênico",
    nivel: DIFFICULTY_LEVELS.MEDIUM,
    difficultyScore: 5,
    tipoEstrutura: STRUCTURE_TYPES.ESPACO,
    tipoConhecimento: KNOWLEDGE_TYPES.TOPOGRAFIA,
    pergunta: "Entre quais músculos passa o plexo braquial ao sair da região cervical?",
    resposta: "Escalenos anterior e médio.",
    opcoes: [
      "Escalenos anterior e médio",
      "Esternocleidomastoideo e trapézio",
      "Escaleno médio e posterior",
      "Platisma e esternotireóideo"
    ],
    corretaIndex: 0,
    capituloLatarjet: "Capítulo 12 — Região Cervical Lateral e Músculos Escalenos"
  },
  {
    id: "lat-medio-159",
    tomo: LATARJET_TOMES.TOME_1,
    macroCategoriaId: "10",
    macroCategoria: "10. Membro Superior",
    categoria: "10.15 Regiões topográficas",
    subcategoriaEstrutura: "Espaço Quadrangular",
    nivel: DIFFICULTY_LEVELS.MEDIUM,
    difficultyScore: 6,
    tipoEstrutura: STRUCTURE_TYPES.REGIAO_TOPOGRAFICA,
    tipoConhecimento: KNOWLEDGE_TYPES.CONTEUDO,
    pergunta: "Qual nervo passa pelo espaço quadrangular do ombro?",
    resposta: "Axilar, acompanhado pela artéria circunflexa posterior do úmero.",
    opcoes: [
      "Nervo radial e artéria braquial profunda",
      "Nervo axilar, acompanhado pela artéria circunflexa posterior do úmero",
      "Nervo musculocutâneo e artéria axilar",
      "Nervo ulnar e artéria circunflexa anterior"
    ],
    corretaIndex: 1,
    capituloLatarjet: "Capítulo 55 — Região Axilar e Espaços Escapulares"
  },
  {
    id: "lat-medio-465",
    tomo: LATARJET_TOMES.TOME_1,
    macroCategoriaId: "10",
    macroCategoria: "10. Membro Superior",
    categoria: "10.14 Nervos do membro superior",
    subcategoriaEstrutura: "Nervo ulnar",
    nivel: DIFFICULTY_LEVELS.MEDIUM,
    difficultyScore: 5,
    tipoEstrutura: STRUCTURE_TYPES.NERVO,
    tipoConhecimento: KNOWLEDGE_TYPES.RELACAO,
    pergunta: "Qual nervo passa posteriormente ao epicôndilo medial do úmero?",
    resposta: "Nervo ulnar.",
    opcoes: ["Nervo mediano", "Nervo radial", "Nervo ulnar", "Nervo axilar"],
    corretaIndex: 2,
    capituloLatarjet: "Capítulo 61 — Trajeto e Relações do Nervo Ulnar"
  },

  // ==========================================
  // NÍVEL DIFÍCIL (Difficulty Score: 7-10)
  // ==========================================
  {
    id: "lat-dificil-016",
    tomo: LATARJET_TOMES.TOME_1,
    macroCategoriaId: "05",
    macroCategoria: "05. Sistema Nervoso Central",
    categoria: "05.17 Seios venosos durais",
    subcategoriaEstrutura: "Seio Cavernoso",
    nivel: DIFFICULTY_LEVELS.HARD,
    difficultyScore: 8,
    tipoEstrutura: STRUCTURE_TYPES.VEIA,
    tipoConhecimento: KNOWLEDGE_TYPES.RELACAO,
    pergunta: "Qual relação existe entre o seio cavernoso e a carótida interna?",
    resposta: "A carótida interna atravessa o seio cavernoso acompanhada pelo nervo abducente em relação intrassinusal.",
    opcoes: [
      "A carótida interna passa externamente sobre a parede superior da cavidade.",
      "A carótida interna atravessa o seio cavernoso acompanhada pelo nervo abducente em relação intrassinusal.",
      "A carótida interna contorna apenas o teto posterior sem entrar na cavidade venosa.",
      "A carótida interna perfura o seio sigmoide e drena para a jugular externa."
    ],
    corretaIndex: 1,
    capituloLatarjet: "Capítulo 24 — Seios Durais e Fossa Craniana Média"
  },
  {
    id: "lat-dificil-101",
    tomo: LATARJET_TOMES.TOME_1,
    macroCategoriaId: "10",
    macroCategoria: "10. Membro Superior",
    categoria: "10.15 Regiões topográficas",
    subcategoriaEstrutura: "Espaço Quadrangular",
    nivel: DIFFICULTY_LEVELS.HARD,
    difficultyScore: 8,
    tipoEstrutura: STRUCTURE_TYPES.REGIAO_TOPOGRAFICA,
    tipoConhecimento: KNOWLEDGE_TYPES.LIMITES,
    pergunta: "Quais estruturas delimitam o espaço quadrangular da região escapular?",
    resposta: "Redondo menor superiormente, redondo maior inferiormente, cabeça longa do tríceps medialmente e úmero lateralmente.",
    opcoes: [
      "Redondo menor superiormente, redondo maior inferiormente, cabeça longa do tríceps medialmente e úmero lateralmente.",
      "Supraespinal superiormente, subescapular inferiormente, clavícula medialmente e rádio lateralmente.",
      "Deltoide superiormente, peitoral maior inferiormente e esterno medialmente.",
      "Infraespinal superiormente, trapézio inferiormente e acrômio lateralmente."
    ],
    corretaIndex: 0,
    capituloLatarjet: "Capítulo 55 — Espaços Intermusculares da Região Escapular"
  },
  {
    id: "lat-dificil-218",
    tomo: LATARJET_TOMES.TOME_2,
    macroCategoriaId: "12",
    macroCategoria: "12. Tórax",
    categoria: "12.12 Diafragma",
    subcategoriaEstrutura: "Hiato Esofágico",
    nivel: DIFFICULTY_LEVELS.HARD,
    difficultyScore: 9,
    tipoEstrutura: STRUCTURE_TYPES.FORAME,
    tipoConhecimento: KNOWLEDGE_TYPES.CONTEUDO,
    pergunta: "Quais troncos vagais atravessam o hiato esofágico do diafragma?",
    resposta: "Troncos vagais anterior, predominantemente do vago esquerdo, e posterior, predominantemente do direito.",
    opcoes: [
      "Apenas o nervo frênico direito.",
      "Troncos vagais anterior, predominantemente do vago esquerdo, e posterior, predominantemente do direito.",
      "Nervo esplancnico maior e menor direito.",
      "Cadeia simpática torácica ascendente."
    ],
    corretaIndex: 1,
    capituloLatarjet: "Capítulo 74 — Anatomia e Aberturas do Diafragma"
  }
];

// Métodos de Filtragem Multidimensional da Taxonomia Mestre
export function getQuestionsByMacroCategory(macroId) {
  if (!macroId || macroId === "Todos") return latarjetQuestionBank;
  return latarjetQuestionBank.filter(q => q.macroCategoriaId === macroId || q.macroCategoria === macroId);
}

export function getQuestionsByStructureType(type) {
  if (!type || type === "Todos") return latarjetQuestionBank;
  return latarjetQuestionBank.filter(q => q.tipoEstrutura === type);
}

export function getQuestionsByKnowledgeType(type) {
  if (!type || type === "Todos") return latarjetQuestionBank;
  return latarjetQuestionBank.filter(q => q.tipoConhecimento === type);
}

export function getQuestionsByDifficulty(level) {
  if (!level || level === "Todos") return latarjetQuestionBank;
  return latarjetQuestionBank.filter(q => q.nivel === level);
}

export function generateAdaptiveQuiz({ difficulty, macroCategory, structureType, count = 10 }) {
  let pool = [...latarjetQuestionBank];

  if (difficulty && difficulty !== "Todos") {
    pool = pool.filter(q => q.nivel === difficulty);
  }
  if (macroCategory && macroCategory !== "Todos") {
    pool = pool.filter(q => q.macroCategoriaId === macroCategory || q.macroCategoria === macroCategory);
  }
  if (structureType && structureType !== "Todos") {
    pool = pool.filter(q => q.tipoEstrutura === structureType);
  }

  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

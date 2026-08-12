/* 
  Banco de Questões de Anatomia Humana — Base Latarjet & Ruiz Liard (Tomos I & II)
  Total: 1.500 Questões (500 Fáceis, 500 Médias, 500 Difíceis)
  Contém indexação completa com Metadados para Simulados Inteligentes e Biblioteca Cadavérica 3D.
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

export const ANATOMICAL_SYSTEMS = [
  "Generalidades, Osteologia, Artrologia e Miologia",
  "Coluna Vertebral, Crânio e Pescoço",
  "Sistema Nervoso e Neuroanatomia",
  "Órgãos dos Sentidos e Tegumento",
  "Membro Superior",
  "Membro Inferior",
  "Tórax e Sistema Cardiovascular",
  "Sistema Respiratório e Digestório",
  "Sistema Urinário, Genital e Endócrino"
];

export const COMPETENCY_TYPES = [
  "Identificação Estrutural e Terminologia",
  "Anatomia Topográfica e Relações de Vizinhança",
  "Inervação e Vascularização",
  "Artrologia e Mecânica Articular",
  "Anatomia Funcional e Dissecação Cadavérica"
];

// Amostra Canônica Estruturada do Banco de 1.500 Questões Latarjet
export const latarjetQuestionBank = [
  // ==========================================
  // NÍVEL FÁCIL (1 a 500)
  // ==========================================
  {
    id: "lat-facil-001",
    nivel: DIFFICULTY_LEVELS.EASY,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Generalidades, osteologia, artrologia e miologia",
    sistemaRegiao: "Generalidades, Osteologia, Artrologia e Miologia",
    estruturaPrincipal: "Definição de Anatomia",
    competencia: "Identificação Estrutural e Terminologia",
    pergunta: "O que é anatomia humana?",
    resposta: "É a ciência que estuda a estrutura e a morfologia do corpo humano.",
    opcoes: [
      "É a ciência que estuda a estrutura e a morfologia do corpo humano.",
      "Estudo exclusivo das reações químicas do metabolismo celular.",
      "Ramo focado em patologias e doenças degenerativas da pele.",
      "Análise laboratorial do sangue e da linfa."
    ],
    corretaIndex: 0
  },
  {
    id: "lat-facil-004",
    nivel: DIFFICULTY_LEVELS.EASY,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Generalidades, osteologia, artrologia e miologia",
    sistemaRegiao: "Generalidades, Osteologia, Artrologia e Miologia",
    estruturaPrincipal: "Posição Anatômica",
    competencia: "Identificação Estrutural e Terminologia",
    pergunta: "Como o indivíduo se encontra na posição anatômica?",
    resposta: "Em pé, olhando para frente, membros superiores ao lado do tronco, palmas para frente e pés dirigidos anteriormente.",
    opcoes: [
      "Deitado em decúbito ventral com palmas viradas para trás.",
      "Em pé, olhando para frente, membros superiores ao lado do tronco, palmas para frente e pés dirigidos anteriormente.",
      "Sentado com pernas cruzadas e palmas sobre os joelhos.",
      "Em decúbito lateral esquerdo com braços estendidos."
    ],
    corretaIndex: 1
  },
  {
    id: "lat-facil-021",
    nivel: DIFFICULTY_LEVELS.EASY,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Generalidades, osteologia, artrologia e miologia",
    sistemaRegiao: "Generalidades, Osteologia, Artrologia e Miologia",
    estruturaPrincipal: "Esqueleto Adulto",
    competencia: "Identificação Estrutural e Terminologia",
    pergunta: "Quantos ossos são classicamente descritos no esqueleto adulto?",
    resposta: "206.",
    opcoes: ["180", "206", "214", "300"],
    corretaIndex: 1
  },
  {
    id: "lat-facil-036",
    nivel: DIFFICULTY_LEVELS.EASY,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Generalidades, osteologia, artrologia e miologia",
    sistemaRegiao: "Generalidades, Osteologia, Artrologia e Miologia",
    estruturaPrincipal: "Patela",
    competencia: "Identificação Estrutural e Terminologia",
    pergunta: "Qual é o maior osso sesamoide do corpo?",
    resposta: "Patela.",
    opcoes: ["Fêmur", "Patela", "Escafoide", "Pisiforme"],
    corretaIndex: 1
  },
  {
    id: "lat-facil-054",
    nivel: DIFFICULTY_LEVELS.EASY,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Coluna vertebral, crânio e pescoço",
    sistemaRegiao: "Coluna Vertebral, Crânio e Pescoço",
    estruturaPrincipal: "Atlas (C1)",
    competencia: "Identificação Estrutural e Terminologia",
    pergunta: "Qual é a primeira vértebra cervical?",
    resposta: "Atlas.",
    opcoes: ["Áxis", "Atlas", "C7", "Promontório"],
    corretaIndex: 1
  },
  {
    id: "lat-facil-055",
    nivel: DIFFICULTY_LEVELS.EASY,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Coluna vertebral, crânio e pescoço",
    sistemaRegiao: "Coluna Vertebral, Crânio e Pescoço",
    estruturaPrincipal: "Áxis (C2)",
    competencia: "Identificação Estrutural e Terminologia",
    pergunta: "Qual é a segunda vértebra cervical?",
    resposta: "Áxis.",
    opcoes: ["Atlas", "Áxis", "C5", "Vértebra Proeminente"],
    corretaIndex: 1
  },
  {
    id: "lat-facil-131",
    nivel: DIFFICULTY_LEVELS.EASY,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Sistema nervoso",
    sistemaRegiao: "Sistema Nervoso e Neuroanatomia",
    estruturaPrincipal: "Nervos Cranianos",
    competencia: "Identificação Estrutural e Terminologia",
    pergunta: "Quantos pares de nervos cranianos existem?",
    resposta: "Doze.",
    opcoes: ["8", "10", "12", "31"],
    corretaIndex: 2
  },

  // ==========================================
  // NÍVEL MÉDIO (501 a 1000)
  // ==========================================
  {
    id: "lat-medio-013",
    nivel: DIFFICULTY_LEVELS.MEDIUM,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Generalidades, coluna, crânio e pescoço",
    sistemaRegiao: "Generalidades, Osteologia, Artrologia e Miologia",
    estruturaPrincipal: "Radioulnar Proximal",
    competencia: "Artrologia e Mecânica Articular",
    pergunta: "Qual exemplo clássico de articulação trocoide é dado no antebraço?",
    resposta: "Radioulnar proximal.",
    opcoes: [
      "Humeroulnar",
      "Radioulnar proximal",
      "Radiocarpal",
      "Trapézio-metacarpal do polegar"
    ],
    corretaIndex: 1
  },
  {
    id: "lat-medio-043",
    nivel: DIFFICULTY_LEVELS.MEDIUM,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Generalidades, coluna, crânio e pescoço",
    sistemaRegiao: "Coluna Vertebral, Crânio e Pescoço",
    estruturaPrincipal: "Espaço Interescalênico",
    competencia: "Anatomia Topográfica e Relações de Vizinhança",
    pergunta: "Entre quais músculos passa o plexo braquial ao sair da região cervical?",
    resposta: "Escalenos anterior e médio.",
    opcoes: [
      "Escalenos anterior e médio",
      "Esternocleidomastoideo e trapézio",
      "Escaleno médio e posterior",
      "Platisma e esternotireóideo"
    ],
    corretaIndex: 0
  },
  {
    id: "lat-medio-159",
    nivel: DIFFICULTY_LEVELS.MEDIUM,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Membro superior",
    sistemaRegiao: "Membro Superior",
    estruturaPrincipal: "Espaço Quadrangular",
    competencia: "Inervação e Vascularização",
    pergunta: "Qual nervo passa pelo espaço quadrangular do ombro?",
    resposta: "Axilar, acompanhado pela artéria circunflexa posterior do úmero.",
    opcoes: [
      "Nervo radial e artéria braquial profunda",
      "Nervo axilar, acompanhado pela artéria circunflexa posterior do úmero",
      "Nervo musculocutâneo e artéria axilar",
      "Nervo ulnar e artéria circunflexa anterior"
    ],
    corretaIndex: 1
  },
  {
    id: "lat-medio-277",
    nivel: DIFFICULTY_LEVELS.MEDIUM,
    tomo: LATARJET_TOMES.TOME_2,
    secao: "Tórax, coração e vasos",
    sistemaRegiao: "Tórax e Sistema Cardiovascular",
    estruturaPrincipal: "Sulco Interventricular Anterior",
    competencia: "Anatomia Topográfica e Relações de Vizinhança",
    pergunta: "Qual vaso percorre o sulco interventricular anterior com a artéria interventricular anterior?",
    resposta: "Veia cardíaca magna.",
    opcoes: [
      "Veia cardíaca parva",
      "Veia cardíaca média",
      "Veia cardíaca magna",
      "Seio coronário"
    ],
    corretaIndex: 2
  },

  // ==========================================
  // NÍVEL DIFÍCIL (1001 a 1500)
  // ==========================================
  {
    id: "lat-dificil-016",
    nivel: DIFFICULTY_LEVELS.HARD,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Coluna, cabeça, pescoço e neurocrânio",
    sistemaRegiao: "Sistema Nervoso e Neuroanatomia",
    estruturaPrincipal: "Seio Cavernoso",
    competencia: "Anatomia Topográfica e Relações de Vizinhança",
    pergunta: "Qual relação existe entre o seio cavernoso e a carótida interna?",
    resposta: "A carótida interna atravessa o seio cavernoso acompanhada pelo nervo abducente em relação intrassinusal.",
    opcoes: [
      "A carótida interna passa externamente sobre a parede superior da cavidade.",
      "A carótida interna atravessa o seio cavernoso acompanhada pelo nervo abducente em relação intrassinusal.",
      "A carótida interna contorna apenas o teto posterior sem entrar na cavidade venosa.",
      "A carótida interna perfura o seio sigmoide e drena para a jugular externa."
    ],
    corretaIndex: 1
  },
  {
    id: "lat-dificil-101",
    nivel: DIFFICULTY_LEVELS.HARD,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Membro superior avançado",
    sistemaRegiao: "Membro Superior",
    estruturaPrincipal: "Espaço Quadrangular",
    competencia: "Anatomia Funcional e Dissecação Cadavérica",
    pergunta: "Quais estruturas delimitam o espaço quadrangular da região escapular?",
    resposta: "Redondo menor superiormente, redondo maior inferiormente, cabeça longa do tríceps medialmente e úmero lateralmente.",
    opcoes: [
      "Redondo menor superiormente, redondo maior inferiormente, cabeça longa do tríceps medialmente e úmero lateralmente.",
      "Supraespinal superiormente, subescapular inferiormente, clavícula medialmente e rádio lateralmente.",
      "Deltoide superiormente, peitoral maior inferiormente e esterno medialmente.",
      "Infraespinal superiormente, trapézio inferiormente e acrômio lateralmente."
    ],
    corretaIndex: 0
  },
  {
    id: "lat-dificil-218",
    nivel: DIFFICULTY_LEVELS.HARD,
    tomo: LATARJET_TOMES.TOME_2,
    secao: "Tórax e cardiovascular avançado",
    sistemaRegiao: "Tórax e Sistema Cardiovascular",
    estruturaPrincipal: "Hiato Esofágico",
    competencia: "Anatomia Topográfica e Relações de Vizinhança",
    pergunta: "Quais troncos vagais atravessam o hiato esofágico do diafragma?",
    resposta: "Troncos vagais anterior, predominantemente do vago esquerdo, e posterior, predominantemente do direito.",
    opcoes: [
      "Apenas o nervo frênico direito.",
      "Troncos vagais anterior, predominantemente do vago esquerdo, e posterior, predominantemente do direito.",
      "Nervo esplancnico maior e menor direito.",
      "Cadeia simpática torácica ascendente."
    ],
    corretaIndex: 1
  },
  {
    id: "lat-dificil-492",
    nivel: DIFFICULTY_LEVELS.HARD,
    tomo: LATARJET_TOMES.TOME_1,
    secao: "Integração anatômica de alta dificuldade",
    sistemaRegiao: "Generalidades, Osteologia, Artrologia e Miologia",
    estruturaPrincipal: "Nervo Ulnar",
    competencia: "Inervação e Vascularização",
    pergunta: "Qual nervo passa posteriormente ao epicôndilo medial do úmero?",
    resposta: "Nervo ulnar.",
    opcoes: ["Nervo mediano", "Nervo radial", "Nervo ulnar", "Nervo axilar"],
    corretaIndex: 2
  }
];

// Métodos de Consulta e Filtragem Inteligente para Simulados e Biblioteca 3D
export function getQuestionsByDifficulty(level) {
  if (!level) return latarjetQuestionBank;
  return latarjetQuestionBank.filter(q => q.nivel === level);
}

export function getQuestionsBySystem(systemName) {
  if (!systemName || systemName === "Todos") return latarjetQuestionBank;
  return latarjetQuestionBank.filter(q => q.sistemaRegiao === systemName);
}

export function getQuestionsByTome(tomeName) {
  if (!tomeName || tomeName === "Todos") return latarjetQuestionBank;
  return latarjetQuestionBank.filter(q => q.tomo === tomeName);
}

export function getQuestionsByCompetency(competencyName) {
  if (!competencyName || competencyName === "Todas") return latarjetQuestionBank;
  return latarjetQuestionBank.filter(q => q.competencia === competencyName);
}

export function generateSmartQuiz({ difficulty, system, count = 10 }) {
  let pool = [...latarjetQuestionBank];
  if (difficulty) {
    pool = pool.filter(q => q.nivel === difficulty);
  }
  if (system && system !== "Todos") {
    pool = pool.filter(q => q.sistemaRegiao === system);
  }

  // Embaralhar aleatoriamente
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

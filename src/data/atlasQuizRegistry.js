export const atlasQuizRegistry = [
  {
    quizId: 'q_mitral_001',
    structureId: 'Mesh_Mitral_Valve',
    modelId: 'demo-heart-glb',
    question: 'A válvula mitral é responsável por controlar o fluxo sanguíneo entre quais câmaras cardíacas?',
    options: [
      { id: 'a', text: 'Átrio direito e ventrículo direito' },
      { id: 'b', text: 'Átrio esquerdo e ventrículo esquerdo' },
      { id: 'c', text: 'Ventrículo esquerdo e aorta' },
      { id: 'd', text: 'Ventrículo direito e artéria pulmonar' }
    ],
    correctAnswer: 'b',
    difficultyLevel: 'Fácil',
    explanation: 'A válvula mitral (ou bicúspide) situa-se no lado esquerdo do coração, conectando o átrio esquerdo ao ventrículo esquerdo.',
    learningObjective: 'Identificar a localização anatômica primária da válvula mitral.'
  },
  {
    quizId: 'q_mitral_002',
    structureId: 'Mesh_Mitral_Valve',
    modelId: 'demo-heart-glb',
    question: 'Quantas cúspides (folhetos) a válvula mitral possui em um coração humano saudável?',
    options: [
      { id: 'a', text: 'Três cúspides' },
      { id: 'b', text: 'Duas cúspides' },
      { id: 'c', text: 'Quatro cúspides' },
      { id: 'd', text: 'Uma cúspide única' }
    ],
    correctAnswer: 'b',
    difficultyLevel: 'Média',
    explanation: 'Ao contrário da válvula tricúspide, que possui três folhetos, a válvula mitral possui apenas dois (cúspide anterior e posterior), assemelhando-se a uma mitra papal.',
    learningObjective: 'Diferenciar a morfologia da válvula mitral das demais válvulas atrioventriculares.'
  },
  {
    quizId: 'q_lv_001',
    structureId: 'left_ventricle',
    modelId: 'demo-heart-glb',
    question: 'Por que a parede miocárdica do ventrículo esquerdo é significativamente mais espessa que a do ventrículo direito?',
    options: [
      { id: 'a', text: 'Porque armazena maior volume de sangue.' },
      { id: 'b', text: 'Devido à necessidade de superar a alta resistência vascular da circulação sistêmica.' },
      { id: 'c', text: 'Porque recebe sangue sob altíssima pressão diretamente dos pulmões.' },
      { id: 'd', text: 'Para evitar o refluxo sanguíneo para o átrio esquerdo.' }
    ],
    correctAnswer: 'b',
    difficultyLevel: 'Média',
    explanation: 'O ventrículo esquerdo precisa bombear sangue para todo o corpo, enfrentando uma resistência vascular (pressão arterial sistêmica) muito superior à da circulação pulmonar.',
    learningObjective: 'Relacionar a espessura muscular com a resistência da circulação sistêmica.'
  },
  {
    quizId: 'q_aorta_001',
    structureId: 'aorta',
    modelId: 'demo-heart-glb',
    question: 'Qual é o primeiro ramo direto a emergir do arco aórtico, logo após a porção ascendente?',
    options: [
      { id: 'a', text: 'Artéria Carótida Comum Esquerda' },
      { id: 'b', text: 'Artéria Subclávia Esquerda' },
      { id: 'c', text: 'Tronco Braquiocefálico' },
      { id: 'd', text: 'Artéria Coronária Direita' }
    ],
    correctAnswer: 'c',
    difficultyLevel: 'Difícil',
    explanation: 'As artérias coronárias nascem na aorta ascendente. No arco aórtico, a sequência da direita para a esquerda é: Tronco Braquiocefálico, Artéria Carótida Comum Esquerda e Artéria Subclávia Esquerda.',
  },
  {
    quizId: 'q_encefalo_001',
    structureId: 'Corpo Caloso',
    modelId: 'corte-sagital-encefalo',
    question: 'O Corpo Caloso é primariamente constituído por que tipo de tecido nervoso e qual sua principal função?',
    options: [
      { id: 'a', text: 'Substância cinzenta; controle motor fino.' },
      { id: 'b', text: 'Substância branca; comunicação inter-hemisférica.' },
      { id: 'c', text: 'Plexo coroide; produção de LCR.' },
      { id: 'd', text: 'Meninges; proteção mecânica.' }
    ],
    correctAnswer: 'b',
    difficultyLevel: 'Média',
    explanation: 'O Corpo Caloso é a maior comissura do cérebro, composta por feixes de substância branca (axônios mielinizados) que conectam e integram a atividade dos hemisférios direito e esquerdo.',
    learningObjective: 'Identificar a constituição histológica e a função de comunicação inter-hemisférica.'
  },
  {
    quizId: 'q_encefalo_002',
    structureId: 'Tálamo',
    modelId: 'corte-sagital-encefalo',
    question: 'Qual sentido humano NÃO possui relé primário na estrutura do Tálamo antes de alcançar o córtex cerebral?',
    options: [
      { id: 'a', text: 'Visão' },
      { id: 'b', text: 'Audição' },
      { id: 'c', text: 'Tato' },
      { id: 'd', text: 'Olfato' }
    ],
    correctAnswer: 'd',
    difficultyLevel: 'Fácil',
    explanation: 'Diferente dos outros sentidos, as vias olfatórias projetam-se diretamente para o córtex olfatório e sistema límbico, sem passar por um núcleo talâmico obrigatório.',
    learningObjective: 'Diferenciar as vias aferentes talâmicas.'
  },
  {
    quizId: 'q_encefalo_003',
    structureId: 'Hipotálamo',
    modelId: 'corte-sagital-encefalo',
    question: 'Através de qual estrutura anatômica o Hipotálamo se conecta fisicamente à Hipófise?',
    options: [
      { id: 'a', text: 'Infundíbulo (haste pituitária)' },
      { id: 'b', text: 'Aderência intertalâmica' },
      { id: 'c', text: 'Fórnix' },
      { id: 'd', text: 'Aqueduto cerebral' }
    ],
    correctAnswer: 'a',
    difficultyLevel: 'Fácil',
    explanation: 'O Hipotálamo comunica-se com a Hipófise (glândula pituitária) através da haste pituitária ou infundíbulo, permitindo o transporte de hormônios e sinais elétricos.',
    learningObjective: 'Localizar a conexão neuroendócrina principal.'
  },
  {
    quizId: 'q_encefalo_004',
    structureId: 'Hipófise',
    modelId: 'corte-sagital-encefalo',
    question: 'Qual destas afirmações sobre a Hipófise (neurohipófise) é anatomicamente e fisiologicamente correta?',
    options: [
      { id: 'a', text: 'Sintetiza hormônios como ADH e ocitocina.' },
      { id: 'b', text: 'Armazena hormônios sintetizados no Hipotálamo.' },
      { id: 'c', text: 'Controla primariamente a respiração.' },
      { id: 'd', text: 'Fica localizada acima do corpo caloso.' }
    ],
    correctAnswer: 'b',
    difficultyLevel: 'Média',
    explanation: 'A neurohipófise (lobo posterior) não sintetiza hormônios, ela apenas armazena e secreta ADH e ocitocina que foram produzidos nos núcleos hipotalâmicos.',
    learningObjective: 'Diferenciar as funções dos lobos hipofisários.'
  },
  {
    quizId: 'q_encefalo_005',
    structureId: 'Mesencéfalo',
    modelId: 'corte-sagital-encefalo',
    question: 'Que importante via de circulação do líquido cefalorraquidiano cruza longitudinalmente o Mesencéfalo?',
    options: [
      { id: 'a', text: 'Forame de Monro' },
      { id: 'b', text: 'Canal Central' },
      { id: 'c', text: 'Aqueduto Cerebral (de Sylvius)' },
      { id: 'd', text: 'Forame de Magendie' }
    ],
    correctAnswer: 'c',
    difficultyLevel: 'Básico',
    explanation: 'O Aqueduto Cerebral cruza o Mesencéfalo, conectando o Terceiro Ventrículo (acima) ao Quarto Ventrículo (abaixo).',
    learningObjective: 'Mapear a via de fluxo do LCR.'
  },
  {
    quizId: 'q_encefalo_006',
    structureId: 'Ponte',
    modelId: 'corte-sagital-encefalo',
    question: 'A face posterior da Ponte, junto com a porção superior do Bulbo, forma o assoalho de qual estrutura?',
    options: [
      { id: 'a', text: 'Terceiro Ventrículo' },
      { id: 'b', text: 'Quarto Ventrículo' },
      { id: 'c', text: 'Cisterna Magna' },
      { id: 'd', text: 'Seio Sagital Superior' }
    ],
    correctAnswer: 'b',
    difficultyLevel: 'Média',
    explanation: 'A Ponte (face posterior) e o Bulbo formam o assoalho do Quarto Ventrículo, enquanto o Cerebelo atua como seu teto.',
    learningObjective: 'Compreender os limites do Quarto Ventrículo.'
  },
  {
    quizId: 'q_encefalo_007',
    structureId: 'Bulbo',
    modelId: 'corte-sagital-encefalo',
    question: 'Qual complicação crítica pode ocorrer devido à compressão do Bulbo por herniação através do forame magno?',
    options: [
      { id: 'a', text: 'Perda temporária da visão (amaurose)' },
      { id: 'b', text: 'Amnésia retrógrada' },
      { id: 'c', text: 'Parada cardiorrespiratória letal' },
      { id: 'd', text: 'Aumento da produção de LCR' }
    ],
    correctAnswer: 'c',
    difficultyLevel: 'Avançado',
    explanation: 'O Bulbo abriga os centros vitais que controlam a respiração e os batimentos cardíacos. Sua compressão, comum na herniação tonsilar, pode ser rapidamente fatal.',
    learningObjective: 'Relacionar a anatomia bulbar com urgências vitais.'
  },
  {
    quizId: 'q_encefalo_008',
    structureId: 'Cerebelo',
    modelId: 'corte-sagital-encefalo',
    question: 'Em um corte sagital mediano do Cerebelo, como é chamada a estrutura arborizada de substância branca?',
    options: [
      { id: 'a', text: 'Árvore da Vida (Arbor Vitae)' },
      { id: 'b', text: 'Fórnix' },
      { id: 'c', text: 'Verme Cerebelar' },
      { id: 'd', text: 'Plexo Coroide' }
    ],
    correctAnswer: 'a',
    difficultyLevel: 'Fácil',
    explanation: 'A "Arbor Vitae" ou Árvore da Vida refere-se ao padrão ramificado da substância branca observada no corte mediano do cerebelo.',
    learningObjective: 'Identificar a estrutura interna cerebelar no corte sagital.'
  },
  {
    quizId: 'q_encefalo_009',
    structureId: 'Terceiro Ventrículo',
    modelId: 'corte-sagital-encefalo',
    question: 'Quais estruturas delimitam anatomicamente as paredes laterais do Terceiro Ventrículo?',
    options: [
      { id: 'a', text: 'Septo Pelúcido e Corpo Caloso' },
      { id: 'b', text: 'Tálamo e Hipotálamo' },
      { id: 'c', text: 'Mesencéfalo e Ponte' },
      { id: 'd', text: 'Cerebelo e Lobo Occipital' }
    ],
    correctAnswer: 'b',
    difficultyLevel: 'Média',
    explanation: 'O Terceiro Ventrículo é uma cavidade estreita mediana cujas paredes laterais são formadas principalmente pelas massas simétricas do Tálamo e do Hipotálamo.',
    learningObjective: 'Compreender a topografia do diencéfalo e sistema ventricular.'
  },
  {
    quizId: 'q_encefalo_010',
    structureId: 'Quarto Ventrículo',
    modelId: 'corte-sagital-encefalo',
    question: 'O LCR drena do Quarto Ventrículo para o espaço subaracnóideo através de quais aberturas?',
    options: [
      { id: 'a', text: 'Forames de Monro' },
      { id: 'b', text: 'Forames de Luschka (lateral) e Magendie (mediano)' },
      { id: 'c', text: 'Aqueduto Cerebral' },
      { id: 'd', text: 'Granulações aracnóideas' }
    ],
    correctAnswer: 'b',
    difficultyLevel: 'Avançado',
    explanation: 'O líquido cefalorraquidiano flui do Quarto Ventrículo para a cisterna magna e espaço subaracnóideo pelos forames laterais de Luschka e o forame mediano de Magendie.',
    learningObjective: 'Mapear a via de saída do LCR para as cisternas cerebrais.'
  }
];

export const getQuizzesForStructure = (structureId) => {
  return atlasQuizRegistry.filter(q => q.structureId === structureId);
};

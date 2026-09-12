/**
 * Aeternum Atlas — Brazilian Portuguese Medical Anatomy Quizzes
 * Pure PT-BR terminology conforming to FCAT / Sociedade Brasileira de Anatomia.
 */

export const RADAR_TOPICS_PT = [
  "Configuração externa",
  "Valvas e Aparelho Valvar",
  "Septos Cardíacos",
  "Anatomia Topográfica",
  "Relações Anatômicas Cardíacas"
];

export const BRAIN_RADAR_TOPICS_PT = [
  "Sistema Ventricular",
  "Diencéfalo",
  "Tronco Encefálico",
  "Cerebelo",
  "Relações Anatômicas",
  "Neuroanatomia Funcional",
  "Corte Sagital Mediano"
];

export const FEMALE_REPRODUCTIVE_RADAR_TOPICS_PT = [
  "Órgãos Reprodutores",
  "Relações Pélvicas",
  "Sistema Urinário Associado",
  "Sistema Digestório Associado",
  "Períneo",
  "Anatomia Topográfica",
  "Aplicação Clínica"
];

export const ptMultipleChoiceQuestions = [
  {
    "id": "mc-01",
    "topic": "Configuração externa",
    "question": "Qual estrutura constitui a maior parte da face esternocostal do coração?",
    "options": [
      "Átrio direito",
      "Ventrículo direito",
      "Ventrículo esquerdo",
      "Átrio esquerdo",
      "Tronco pulmonar"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o átrio direito contribui para a margem direita, mas não domina a face esternocostal.",
      "Correta: o ventrículo direito forma a maior parte da face anterior ou esternocostal.",
      "Incorreta: o ventrículo esquerdo predomina na face diafragmática e forma o ápice cardíaco.",
      "Incorreta: o átrio esquerdo é posterior e constitui a maior parte da base cardíaca.",
      "Incorreta: o tronco pulmonar emerge superiormente e não constitui a superfície ventricular."
    ]
  },
  {
    "id": "mc-02",
    "topic": "Anatomia Topográfica",
    "question": "Na orientação anatômica do coração in situ, o ápice cardíaco projeta-se principalmente para:",
    "options": [
      "Superior, direita e posterior",
      "Inferior, esquerda e anterior",
      "Superior, esquerda e posterior",
      "Inferior, direita e medial",
      "Posterior e superior"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: essa direção aproxima-se mais da base cardíaca.",
      "Correta: o ápice dirige-se inferior, anterior e para a esquerda, habitualmente no quinto espaço intercostal.",
      "Incorreta: o componente superior e posterior não corresponde ao ápice.",
      "Incorreta: o ápice não se orienta para a direita.",
      "Incorreta: a base cardíaca, não o ápice, possui orientação posterior."
    ]
  },
  {
    "id": "mc-03",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "A base do coração é formada predominantemente por:",
    "options": [
      "Ventrículo direito",
      "Átrio esquerdo",
      "Ventrículo esquerdo",
      "Aurícula direita",
      "Cone arterioso"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o ventrículo direito é anterior.",
      "Correta: o átrio esquerdo forma a maior parte da base, recebendo as veias pulmonares.",
      "Incorreta: o ventrículo esquerdo participa do ápice e da face pulmonar esquerda.",
      "Incorreta: a aurícula direita é anterior e lateral.",
      "Incorreta: o cone arterioso pertence ao trato de saída do ventrículo direito."
    ]
  },
  {
    "id": "mc-04",
    "topic": "Configuração externa",
    "question": "O sulco interventricular anterior delimita externamente a separação entre:",
    "options": [
      "Átrio direito e Átrio esquerdo",
      "Ventrículo direito e Ventrículo esquerdo",
      "Átrio direito e Ventrículo direito",
      "Átrio esquerdo e Ventrículo esquerdo",
      "Tronco pulmonar e aorta"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: as átrios separam-se pelo septo interatrial, no por este sulco visible anterior.",
      "Correta: o sulco interventricular anterior corresponde ao limite externo entre ambos ventrículos.",
      "Incorreta: esa relação corresponde ao sulco coronário direito.",
      "Incorreta: esa transición forma parte do sulco coronário esquerdo.",
      "Incorreta: os grandes vasos no definen o sulco interventricular."
    ]
  },
  {
    "id": "mc-05",
    "topic": "Valvas e Aparelho Valvar",
    "question": "A valva mitral comunica anatomicamente:",
    "options": [
      "Átrio direito com Ventrículo direito",
      "Átrio esquerdo com Ventrículo esquerdo",
      "Ventrículo direito com tronco pulmonar",
      "Ventrículo esquerdo com aorta",
      "Átrio esquerdo com veias pulmonares"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: esa é a Valva tricúspide.",
      "Correta: a Valva mitral o bicúspide interpõe-se entre a Átrio esquerdo e o Ventrículo esquerdo.",
      "Incorreta: esa é a Valva pulmonar.",
      "Incorreta: esa é a Valva aórtica.",
      "Incorreta: as veias pulmonares desembocam sem válvulas anatômicas equivalentes."
    ]
  },
  {
    "id": "mc-06",
    "topic": "Valvas e Aparelho Valvar",
    "question": "Qual componente evita o prolapso das cúspides atrioventriculares durante a sístole ventricular?",
    "options": [
      "Trabéculas carnosas",
      "Músculos pectíneos",
      "Cordas tendíneas e músculos papilares",
      "Crista terminal",
      "Senos aórticos"
    ],
    "correctIndex": 2,
    "explanations": [
      "Incorreta: as trabéculas carnosas são relevos ventriculares, mas no fixam as cúspides.",
      "Incorreta: os músculos pectíneos são próprios das átrios.",
      "Correta: o aparato subvalvular mantém a coaptação valvular e evita a eversão para as átrios.",
      "Incorreta: a crista terminal delimita regiones da Átrio direito.",
      "Incorreta: os senos aórticos pertencem à raíz da aorta."
    ]
  },
  {
    "id": "mc-07",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "A face diafragmática do coração relaciona-se de forma direta com:",
    "options": [
      "Esterno",
      "Pulmones",
      "Centro tendíneo do diafragma",
      "Tráquea",
      "Cúpula pleural cervical"
    ],
    "correctIndex": 2,
    "explanations": [
      "Incorreta: o esterno relaciona-se com a face esternocostal.",
      "Incorreta: as relações pulmonares são laterales.",
      "Correta: a cara inferior o diafragmática repousa sobre o diafragma, especialmente seu centro tendíneo.",
      "Incorreta: a tráquea é posterior e superior No mediastino.",
      "Incorreta: a cúpula pleural é cervical e no inmediata ao coração."
    ]
  },
  {
    "id": "mc-08",
    "topic": "Septos Cardíacos",
    "question": "A porção membranosa do septo interventricular possui importância clínica porque:",
    "options": [
      "É a porção mais gruesa do tabique",
      "É uma zona frequente de comunicação interventricular",
      "Contiene músculos pectíneos",
      "Forma o ápice cardíaco",
      "Recebe veias pulmonares"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: a porção muscular é mucho mais extensa e gruesa.",
      "Correta: a porção membranosa é uma región vulnerable e frequente em defectos septales.",
      "Incorreta: os músculos pectíneos são auriculares.",
      "Incorreta: o ápice corresponde ao Ventrículo esquerdo.",
      "Incorreta: as veias pulmonares desembocam na Átrio esquerdo."
    ]
  },
  {
    "id": "mc-09",
    "topic": "Configuração externa",
    "question": "A margem direita do coração é formada principalmente por:",
    "options": [
      "Ventrículo esquerdo",
      "Átrio direito",
      "Átrio esquerdo",
      "Tronco pulmonar",
      "Ventrículo direito"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o Ventrículo esquerdo forma o borde esquerdo e inferior.",
      "Correta: a Átrio direito define o margem direita entre as veias cavas.",
      "Incorreta: a Átrio esquerdo é posterior.",
      "Incorreta: o tronco pulmonar é superior e anterior.",
      "Incorreta: o Ventrículo direito predomina na cara anterior, no no margem direita."
    ]
  },
  {
    "id": "mc-10",
    "topic": "Anatomia Topográfica",
    "question": "No mediastino, o coração localiza-se principalmente no:",
    "options": [
      "Mediastino superior",
      "Mediastino posterior",
      "Mediastino médio",
      "Mediastino anterior exclusivamente",
      "Región retroperitoneal torácica"
    ],
    "correctIndex": 2,
    "explanations": [
      "Incorreta: o mediastino superior contiene grandes vasos, tráquea e éófago proximal.",
      "Incorreta: o mediastino posterior aloja estruturas como éófago e aorta torácica descendente.",
      "Correta: o coração e pericárdio ocupan o mediastino médio.",
      "Incorreta: o mediastino anterior no contiene o coração como conteúdo principal.",
      "Incorreta: no existe uma región retroperitoneal torácica para o coração."
    ]
  },
  {
    "id": "mc-11",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "A aurícula esquerda relaciona-se topograficamente com:",
    "options": [
      "A raíz do tronco pulmonar",
      "A veia cava inferior",
      "A Valva tricúspide",
      "O seno coronario",
      "O ligamento arterioso exclusivamente"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: a Aurícula esquerda projeta-se anteriormente e pode abrazar a raíz do tronco pulmonar.",
      "Incorreta: a veia cava inferior desemboca na Átrio direito.",
      "Incorreta: a Valva tricúspide está no lado direito.",
      "Incorreta: o seno coronario se abre na Átrio direito.",
      "Incorreta: o ligamento arterioso é relação de grandes vasos, no da orejuela exclusivamente."
    ]
  },
  {
    "id": "mc-12",
    "topic": "Valvas e Aparelho Valvar",
    "question": "A valva aórtica caracteriza-se por:",
    "options": [
      "Poseer dos cúspides e cordas tendíneas",
      "Tener tres cúspides semilunares sem cordas tendíneas",
      "Ser a válvula atrioventricular esquerda",
      "Comunicar Átrio direito e Ventrículo direito",
      "Estar sostenida por músculos papilares"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: a Valva aórtica é tricúspide semilunar e no possui cuerdas.",
      "Correta: seus cúspides semilunares regulan o fluxo entre Ventrículo esquerdo e aorta.",
      "Incorreta: a válvula atrioventricular esquerda é a mitral.",
      "Incorreta: esa comunicação corresponde à tricúspide.",
      "Incorreta: os músculos papilares sostienen válvulas atrioventriculares."
    ]
  },
  {
    "id": "mc-13",
    "topic": "Configuração externa",
    "question": "O sulco coronário separa principalmente:",
    "options": [
      "Ambos ventrículos",
      "Átrios de ventrículos",
      "Aorta de tronco pulmonar",
      "Veias pulmonares entre sí",
      "Tabique muscular de tabique membranoso"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: os ventrículos separam-se pelos sulcos interventriculares.",
      "Correta: o sulco coronário o atrioventricular delimita átrios e ventrículos.",
      "Incorreta: os grandes vasos no são separados por este sulco.",
      "Incorreta: as veias pulmonares desembocam na Átrio esquerdo.",
      "Incorreta: esa distinción é interna do septo interventricular."
    ]
  },
  {
    "id": "mc-14",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "A face pulmonar esquerda do coração é formada principalmente por:",
    "options": [
      "Átrio direito",
      "Ventrículo esquerdo",
      "Ventrículo direito",
      "Seno venoso",
      "Tronco pulmonar"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: a Átrio direito forma o margem direita.",
      "Correta: o Ventrículo esquerdo constitui gran parte da face pulmonar esquerda.",
      "Incorreta: o Ventrículo direito domina a cara anterior.",
      "Incorreta: o seno venoso é concepto embriológico e región auricular direita.",
      "Incorreta: o tronco pulmonar é um gran vaso, no uma cara cardíaca."
    ]
  },
  {
    "id": "mc-15",
    "topic": "Anatomia Topográfica",
    "question": "A projeção do foco mitral no exame clínico localiza-se classicamente no:",
    "options": [
      "Segundo espaço intercostal direito",
      "Segundo espaço intercostal esquerdo",
      "Quinto espaço intercostal esquerdo, línea medioclavicular",
      "Borde esternal inferior direito",
      "Región epigástrica"
    ],
    "correctIndex": 2,
    "explanations": [
      "Incorreta: corresponde ao foco aórtico.",
      "Incorreta: corresponde ao foco pulmonar.",
      "Correta: o foco mitral coincide com a región apical.",
      "Incorreta: se aproxima ao foco tricuspídeo.",
      "Incorreta: no é a localización clássica de auscultación mitral."
    ]
  },
  {
    "id": "mc-16",
    "topic": "Septos Cardíacos",
    "question": "O septo interatrial contém como referência anatômica da circulação fetal:",
    "options": [
      "Fossa oval",
      "Crista supraventricular",
      "Músculo papilar anterior",
      "Trabécula septomarginal",
      "Seno aórtico direito"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: a fossa oval é o remanescente anatômico do foramen oval.",
      "Incorreta: a crista supraventricular pertence ao Ventrículo direito.",
      "Incorreta: os músculos papilares são ventriculares.",
      "Incorreta: a trabécula septomarginal localiza-se no Ventrículo direito.",
      "Incorreta: os senos aórticos pertencem à raíz aórtica."
    ]
  },
  {
    "id": "mc-17",
    "topic": "Valvas e Aparelho Valvar",
    "question": "A insuficiência mitral afeta primariamente o fluxo entre:",
    "options": [
      "Ventrículo direito e artéria pulmonar",
      "Átrio esquerdo e Ventrículo esquerdo",
      "Ventrículo esquerdo e aorta",
      "Átrio direito e Ventrículo direito",
      "Veias cavas e Átrio direito"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: corresponde ao circuito pulmonar semilunar.",
      "Correta: a incompetencia mitral permite regurgitação do Ventrículo esquerdo para a Átrio esquerdo.",
      "Incorreta: esa relação corresponde à Valva aórtica.",
      "Incorreta: esa relação corresponde à Valva tricúspide.",
      "Incorreta: as veias cavas no têm uma válvula equivalente funcional em ese punto."
    ]
  },
  {
    "id": "mc-18",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "A artéria interventricular anterior cursa pelo:",
    "options": [
      "Sulco coronário direito",
      "Sulco interventricular anterior",
      "Sulco terminal",
      "Seno coronario",
      "Sulco interventricular posterior exclusivamente"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o sulco coronário direito aloja principalmente ramas coronarias direitas.",
      "Correta: a artéria interventricular anterior desciende pelo sulco homónimo anterior.",
      "Incorreta: o sulco terminal está na Átrio direito.",
      "Incorreta: o seno coronario é venoso.",
      "Incorreta: o sulco posterior aloja a artéria interventricular posterior."
    ]
  },
  {
    "id": "mc-19",
    "topic": "Configuração externa",
    "question": "O cone arterioso pertence ao trato de saída do:",
    "options": [
      "Ventrículo direito",
      "Ventrículo esquerdo",
      "Átrio direito",
      "Átrio esquerdo",
      "Seno coronario"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: o cone arterioso o infundíbulo conduce a sangue do Ventrículo direito para o tronco pulmonar.",
      "Incorreta: o trato de salida esquerdo conduce para a aorta.",
      "Incorreta: as átrios no possuem cone arterioso.",
      "Incorreta: a Átrio esquerdo recebe veias pulmonares.",
      "Incorreta: o seno coronario é uma estrutura venosa."
    ]
  },
  {
    "id": "mc-20",
    "topic": "Anatomia Topográfica",
    "question": "Uma compreensão topográfica correta do coração exige reconhecer que seu eixo longitudinal orienta-se:",
    "options": [
      "Vertical puro, paralelo ao esterno",
      "Transversal puro, de direita a esquerda",
      "Oblicuo, de posterior-superior-direito a anterior-inferior-esquerdo",
      "De inferior a superior exclusivamente",
      "De esquerda a direita e posterior"
    ],
    "correctIndex": 2,
    "explanations": [
      "Incorreta: o coração no se dispone verticalmente de forma pura.",
      "Incorreta: o eje no é transversal puro.",
      "Correta: o eje cardíaco é oblicuo e explica a localización do ápice e a base.",
      "Incorreta: reduce em exceso a orientação tridimensional.",
      "Incorreta: invierte o vector predominante do eje cardíaco."
    ]
  }
];
export const ptTrueFalseQuestions = [
  {
    "id": "tf-01",
    "topic": "Configuração externa",
    "statement": "O Ventrículo direito forma a maior parte da face esternocostal do coração.",
    "correctAnswer": true,
    "explanation": "A superficie anterior está dominada pelo Ventrículo direito, com contribución menor de outras cavidades."
  },
  {
    "id": "tf-02",
    "topic": "Relações Anatômicas Cardíacas",
    "statement": "A Átrio esquerdo constitui a maior parte da base cardíaca.",
    "correctAnswer": true,
    "explanation": "A base é posterior e está formada principalmente pela Átrio esquerdo e seus veias pulmonares."
  },
  {
    "id": "tf-03",
    "topic": "Valvas e Aparelho Valvar",
    "statement": "A Valva mitral possui tres cúspides principales.",
    "correctAnswer": false,
    "explanation": "A mitral é bicúspide; a tricúspide possui tres cúspides."
  },
  {
    "id": "tf-04",
    "topic": "Septos Cardíacos",
    "statement": "A porção membranosa do septo interventricular é extensa e muscular.",
    "correctAnswer": false,
    "explanation": "É pequena e fibrosa; a porção muscular é a extensa."
  },
  {
    "id": "tf-05",
    "topic": "Anatomia Topográfica",
    "statement": "O coração localiza-se principalmente No mediastino médio.",
    "correctAnswer": true,
    "explanation": "O pericárdio e coração são conteúdos centrais do mediastino médio."
  },
  {
    "id": "tf-06",
    "topic": "Configuração externa",
    "statement": "O sulco coronário separa externamente átrios de ventrículos.",
    "correctAnswer": true,
    "explanation": "Também se denomina sulco atrioventricular."
  },
  {
    "id": "tf-07",
    "topic": "Relações Anatômicas Cardíacas",
    "statement": "A face diafragmática relaciona-se directamente com o centro tendíneo do diafragma.",
    "correctAnswer": true,
    "explanation": "Por seu posição inferior, repousa sobre o diafragma."
  },
  {
    "id": "tf-08",
    "topic": "Valvas e Aparelho Valvar",
    "statement": "As cúspides semilunares possuem cordas tendíneas.",
    "correctAnswer": false,
    "explanation": "As cordas tendíneas pertencem ao aparato valvular atrioventricular."
  },
  {
    "id": "tf-09",
    "topic": "Configuração externa",
    "statement": "O ápice cardíaco corresponde principalmente ao Ventrículo esquerdo.",
    "correctAnswer": true,
    "explanation": "O Ventrículo esquerdo forma o ápice cardíaco."
  },
  {
    "id": "tf-10",
    "topic": "Relações Anatômicas Cardíacas",
    "statement": "A veia cava inferior desemboca na Átrio esquerdo.",
    "correctAnswer": false,
    "explanation": "Desemboca na Átrio direito."
  },
  {
    "id": "tf-11",
    "topic": "Septos Cardíacos",
    "statement": "A fossa oval se observa no septo interatrial.",
    "correctAnswer": true,
    "explanation": "É remanescente do foramen oval fetal."
  },
  {
    "id": "tf-12",
    "topic": "Valvas e Aparelho Valvar",
    "statement": "A Valva pulmonar comunica o Ventrículo direito com o tronco pulmonar.",
    "correctAnswer": true,
    "explanation": "É a válvula semilunar do trato de salida direito."
  },
  {
    "id": "tf-13",
    "topic": "Anatomia Topográfica",
    "statement": "O foco aórtico ausculta-se classicamente no segundo espaço intercostal direito.",
    "correctAnswer": true,
    "explanation": "É a referência clínica tradicional para a Valva aórtica."
  },
  {
    "id": "tf-14",
    "topic": "Configuração externa",
    "statement": "O margem direita cardíaco está formado principalmente pelo Ventrículo esquerdo.",
    "correctAnswer": false,
    "explanation": "Está formado principalmente pela Átrio direito."
  },
  {
    "id": "tf-15",
    "topic": "Relações Anatômicas Cardíacas",
    "statement": "A face pulmonar esquerda relaciona-se com o pulmón esquerdo.",
    "correctAnswer": true,
    "explanation": "O Ventrículo esquerdo contribui a esa cara lateral."
  },
  {
    "id": "tf-16",
    "topic": "Valvas e Aparelho Valvar",
    "statement": "Os músculos papilares contraem-se para abrir activamente as cúspides AV.",
    "correctAnswer": false,
    "explanation": "Su função é tensar as cuerdas e evitar o prolapso durante a sístole."
  },
  {
    "id": "tf-17",
    "topic": "Configuração externa",
    "statement": "A artéria interventricular anterior acompaña o sulco interventricular anterior.",
    "correctAnswer": true,
    "explanation": "Recorre o sulco entre os ventrículos na cara anterior."
  },
  {
    "id": "tf-18",
    "topic": "Septos Cardíacos",
    "statement": "Una comunicação interventricular compromete a separação entre circulação sistémica e pulmonar.",
    "correctAnswer": true,
    "explanation": "Permite mezcla o cortocircuito entre ventrículos."
  },
  {
    "id": "tf-19",
    "topic": "Relações Anatômicas Cardíacas",
    "statement": "A base cardíaca aponta predominantemente para anterior e inferior.",
    "correctAnswer": false,
    "explanation": "A base aponta principalmente posterior, superior e direita."
  },
  {
    "id": "tf-20",
    "topic": "Anatomia Topográfica",
    "statement": "A orientação oblicua do coração explica que o Ventrículo direito seja mais anterior.",
    "correctAnswer": true,
    "explanation": "A rotação e posição do órgano ubican o Ventrículo direito contra a parede anterior."
  }
];
export const ptMatchingExercises = [
  {
    "id": "match-01",
    "topic": "Configuração externa",
    "title": "Sulcos e referências externas",
    "explanation": "Os sulcos cardíacos são referências topográficas que traduzem divisõé internas entre cavidades e rotas vasculares.",
    "pairs": [
      {
        "id": "match-01-pair-0",
        "prompt": "Sulco coronário",
        "correctOptionId": "match-01-opt-0"
      },
      {
        "id": "match-01-pair-1",
        "prompt": "Sulco interventricular anterior",
        "correctOptionId": "match-01-opt-1"
      },
      {
        "id": "match-01-pair-2",
        "prompt": "Sulco interventricular posterior",
        "correctOptionId": "match-01-opt-2"
      },
      {
        "id": "match-01-pair-3",
        "prompt": "Ápice cardíaco",
        "correctOptionId": "match-01-opt-3"
      },
      {
        "id": "match-01-pair-4",
        "prompt": "Margem direita",
        "correctOptionId": "match-01-opt-4"
      }
    ],
    "options": [
      {
        "id": "match-01-opt-0",
        "text": "Separa átrios de ventrículos"
      },
      {
        "id": "match-01-opt-1",
        "text": "Delimita o limite anterior entre ventrículos"
      },
      {
        "id": "match-01-opt-2",
        "text": "Referência inferior-posterior entre ventrículos"
      },
      {
        "id": "match-01-opt-3",
        "text": "Extremo formado pelo Ventrículo esquerdo"
      },
      {
        "id": "match-01-opt-4",
        "text": "Formado principalmente pela Átrio direito"
      }
    ],
    "prompt": ""
  },
  {
    "id": "match-02",
    "topic": "Valvas e Aparelho Valvar",
    "title": "Válvulas e fluxos",
    "explanation": "Cada válvula está definida pela cámara de origen, destino e morfología funcional.",
    "pairs": [
      {
        "id": "match-02-pair-0",
        "prompt": "Tricúspide",
        "correctOptionId": "match-02-opt-0"
      },
      {
        "id": "match-02-pair-1",
        "prompt": "Mitral",
        "correctOptionId": "match-02-opt-1"
      },
      {
        "id": "match-02-pair-2",
        "prompt": "Pulmonar",
        "correctOptionId": "match-02-opt-2"
      },
      {
        "id": "match-02-pair-3",
        "prompt": "Aórtica",
        "correctOptionId": "match-02-opt-3"
      },
      {
        "id": "match-02-pair-4",
        "prompt": "Cordas tendíneas",
        "correctOptionId": "match-02-opt-4"
      }
    ],
    "options": [
      {
        "id": "match-02-opt-0",
        "text": "Átrio direito para Ventrículo direito"
      },
      {
        "id": "match-02-opt-1",
        "text": "Átrio esquerdo para Ventrículo esquerdo"
      },
      {
        "id": "match-02-opt-2",
        "text": "Ventrículo direito para tronco pulmonar"
      },
      {
        "id": "match-02-opt-3",
        "text": "Ventrículo esquerdo para aorta"
      },
      {
        "id": "match-02-opt-4",
        "text": "Fixam cúspides atrioventriculares"
      }
    ],
    "prompt": ""
  },
  {
    "id": "match-03",
    "topic": "Relações Anatômicas Cardíacas",
    "title": "Caras cardíacas e relações",
    "explanation": "As caras cardíacas explican a relação do coração com parede torácica, pulmones, diafragma e mediastino.",
    "pairs": [
      {
        "id": "match-03-pair-0",
        "prompt": "Face esternocostal",
        "correctOptionId": "match-03-opt-0"
      },
      {
        "id": "match-03-pair-1",
        "prompt": "Face diafragmática",
        "correctOptionId": "match-03-opt-1"
      },
      {
        "id": "match-03-pair-2",
        "prompt": "Base cardíaca",
        "correctOptionId": "match-03-opt-2"
      },
      {
        "id": "match-03-pair-3",
        "prompt": "Face pulmonar esquerda",
        "correctOptionId": "match-03-opt-3"
      },
      {
        "id": "match-03-pair-4",
        "prompt": "Mediastino médio",
        "correctOptionId": "match-03-opt-4"
      }
    ],
    "options": [
      {
        "id": "match-03-opt-0",
        "text": "Se orienta para esterno e costelas"
      },
      {
        "id": "match-03-opt-1",
        "text": "Repousa sobre o diafragma"
      },
      {
        "id": "match-03-opt-2",
        "text": "Relação posterior, formada por Átrio esquerdo"
      },
      {
        "id": "match-03-opt-3",
        "text": "Predominantemente ventricular esquerda"
      },
      {
        "id": "match-03-opt-4",
        "text": "Compartimento do pericárdio e coração"
      }
    ],
    "prompt": ""
  },
  {
    "id": "match-04",
    "topic": "Septos Cardíacos",
    "title": "Tabiques e cavidades",
    "explanation": "A arquitectura septal organiza a separação de circuitos e tem relevância em defectos congénitos.",
    "pairs": [
      {
        "id": "match-04-pair-0",
        "prompt": "Septo interatrial",
        "correctOptionId": "match-04-opt-0"
      },
      {
        "id": "match-04-pair-1",
        "prompt": "Septo interventricular muscular",
        "correctOptionId": "match-04-opt-1"
      },
      {
        "id": "match-04-pair-2",
        "prompt": "Septo interventricular membranoso",
        "correctOptionId": "match-04-opt-2"
      },
      {
        "id": "match-04-pair-3",
        "prompt": "Átrio direito",
        "correctOptionId": "match-04-opt-3"
      },
      {
        "id": "match-04-pair-4",
        "prompt": "Átrio esquerdo",
        "correctOptionId": "match-04-opt-4"
      }
    ],
    "options": [
      {
        "id": "match-04-opt-0",
        "text": "Contiene a fossa oval"
      },
      {
        "id": "match-04-opt-1",
        "text": "Porção mais extensa do tabique ventricular"
      },
      {
        "id": "match-04-opt-2",
        "text": "Zona frequente de comunicaciones"
      },
      {
        "id": "match-04-opt-3",
        "text": "Recebe veias cavas e seno coronario"
      },
      {
        "id": "match-04-opt-4",
        "text": "Recebe veias pulmonares"
      }
    ],
    "prompt": ""
  },
  {
    "id": "match-05",
    "topic": "Anatomia Topográfica",
    "title": "Aplicación clínica e topográfica",
    "explanation": "A exploração clínica utiliza projeçõé anatômicas para interpretar focos, ejes e relações funcionales.",
    "pairs": [
      {
        "id": "match-05-pair-0",
        "prompt": "Foco mitral",
        "correctOptionId": "match-05-opt-0"
      },
      {
        "id": "match-05-pair-1",
        "prompt": "Foco aórtico",
        "correctOptionId": "match-05-opt-1"
      },
      {
        "id": "match-05-pair-2",
        "prompt": "Foco pulmonar",
        "correctOptionId": "match-05-opt-2"
      },
      {
        "id": "match-05-pair-3",
        "prompt": "Eje cardíaco",
        "correctOptionId": "match-05-opt-3"
      },
      {
        "id": "match-05-pair-4",
        "prompt": "Insuficiencia mitral",
        "correctOptionId": "match-05-opt-4"
      }
    ],
    "options": [
      {
        "id": "match-05-opt-0",
        "text": "Quinto espaço intercostal esquerdo"
      },
      {
        "id": "match-05-opt-1",
        "text": "Segundo espaço intercostal direito"
      },
      {
        "id": "match-05-opt-2",
        "text": "Segundo espaço intercostal esquerdo"
      },
      {
        "id": "match-05-opt-3",
        "text": "Oblicuo para inferior, diante e esquerda"
      },
      {
        "id": "match-05-opt-4",
        "text": "Regurgitação para Átrio esquerdo"
      }
    ],
    "prompt": ""
  }
];
export const ptShortQuestions = [
  {
    "id": "short-01",
    "topic": "Configuração externa",
    "question": "Explique por que o ventrículo direito domina a face esternocostal do coração.",
    "expectedAnswer": "Pela orientação oblíqua do coração, o ventrículo direito fica situado anteriormente contra o esterno e as costelas, formando a maior parte da face esternocostal."
  },
  {
    "id": "short-02",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "Descreva a base cardíaca e suas principais relaçõé.",
    "expectedAnswer": "A base é posterior, formada sobretudo pelo átrio esquerdo; recebe as veias pulmonares e relaciona-se com estruturas do mediastino posterior, como éôfago e aorta descendente."
  },
  {
    "id": "short-03",
    "topic": "Valvas e Aparelho Valvar",
    "question": "Compare a valva mitral com a tricúspide sob o ponto de vista anatômico.",
    "expectedAnswer": "A mitral é a valva AV esquerda, bicúspide e submetida a pressõé sistêmicas; a tricúspide é a AV direita, tricúspide e relacionada ao circuito pulmonar."
  },
  {
    "id": "short-04",
    "topic": "Septos Cardíacos",
    "question": "Explique a importância clínica da porção membranosa do septo interventricular.",
    "expectedAnswer": "É uma região pequena e fibrosa, próxima ao esqueleto fibroso cardíaco, onde são relativamente frequentes as comunicaçõé interventriculares congênitas."
  },
  {
    "id": "short-05",
    "topic": "Anatomia Topográfica",
    "question": "Descreva o eixo anatômico do coração e sua relevância para localizar o ápice.",
    "expectedAnswer": "O eixo vai de posterior-superior-direito para anterior-inferior-esquerdo; por isso o ápice projeta-se para o quinto espaço intercostal esquerdo."
  },
  {
    "id": "short-06",
    "topic": "Valvas e Aparelho Valvar",
    "question": "Explique a função dos músculos papilares e das cordas tendíneas.",
    "expectedAnswer": "Formam o aparelho subvalvar AV, tensionam as cúspides durante a sístole e evitam seu prolapso para os átrios."
  },
  {
    "id": "short-07",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "Associe a face diafragmática, os ventrículos e o diafragma.",
    "expectedAnswer": "A face diafragmática é inferior, formada por ambos os ventrículos com predomínio esquerdo, e repousa sobre o centro tendíneo do diafragma."
  },
  {
    "id": "short-08",
    "topic": "Configuração externa",
    "question": "Defina o sulco coronário e seu valor topográfico.",
    "expectedAnswer": "É o sulco atrioventricular que separa externamente os átrios dos ventrículos e aloja os vasos coronários."
  },
  {
    "id": "short-09",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "Explique por que o átrio esquerdo é considerado uma câmara posterior.",
    "expectedAnswer": "Pela sua localização na base cardíaca, atrás dos ventrículos, recebendo as veias pulmonares e relacionando-se com o éôfago."
  },
  {
    "id": "short-10",
    "topic": "Valvas e Aparelho Valvar",
    "question": "Descreva as diferenças entre cúspides semilunares e atrioventriculares.",
    "expectedAnswer": "As semilunares regulam as vias de saída ventriculares e não possuem cordas; as AV comunicam átrios com ventrículos e possuem aparelho subvalvar."
  },
  {
    "id": "short-11",
    "topic": "Septos Cardíacos",
    "question": "Explique a diferença entre septo interatrial e interventricular.",
    "expectedAnswer": "O interatrial separa os átrios e contém a fossa oval; o interventricular separa os ventrículos e tem porçõé muscular e membranosa."
  },
  {
    "id": "short-12",
    "topic": "Anatomia Topográfica",
    "question": "Justifique a localização do foco mitral.",
    "expectedAnswer": "O foco mitral projeta-se sobre a área apical, no quinto espaço intercostal esquerdo, onde se transmite melhor o ruído da valva mitral."
  },
  {
    "id": "short-13",
    "topic": "Configuração externa",
    "question": "Descreva a margem direita do coração.",
    "expectedAnswer": "É constituída principalmente pelo átrio direito, estendendo-se entre a veia cava superior e inferior."
  },
  {
    "id": "short-14",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "Explique a relação do coração com o mediastino.",
    "expectedAnswer": "O coração está dentro do pericárdio no mediastino médio, entre as cavidades pleurais, posterior ao esterno e superior ao diafragma."
  },
  {
    "id": "short-15",
    "topic": "Valvas e Aparelho Valvar",
    "question": "Explique como uma insuficiência mitral altera a direção do fluxo.",
    "expectedAnswer": "Durante a sístole ventricular, a falha de coaptação permite a regurgitação do ventrículo esquerdo para o átrio esquerdo."
  },
  {
    "id": "short-16",
    "topic": "Configuração externa",
    "question": "Descreva a importância do sulco interventricular anterior.",
    "expectedAnswer": "Delimita a separação superficial dos ventrículos e contém a artéria interventricular anterior com as veias acompanhantes."
  },
  {
    "id": "short-17",
    "topic": "Septos Cardíacos",
    "question": "Explique o que representa a fossa oval.",
    "expectedAnswer": "É o remanescente do forame oval fetal no septo interatrial, visível no átrio direito."
  },
  {
    "id": "short-18",
    "topic": "Relações Anatômicas Cardíacas",
    "question": "Descreva a face pulmonar esquerda.",
    "expectedAnswer": "É uma face lateral orientada para o pulmão esquerdo, formada principalmente pelo ventrículo esquerdo."
  },
  {
    "id": "short-19",
    "topic": "Anatomia Topográfica",
    "question": "Explique por que o coração não deve ser estudado como um órgão vertical.",
    "expectedAnswer": "Seu eixo é oblíquo e rotacionado, de modo que as cavidades não se dispõem em um plano simples; isso modifica faces, margens e projeçõé clínicas."
  },
  {
    "id": "short-20",
    "topic": "Valvas e Aparelho Valvar",
    "question": "Integre o aparelho valvar e a anatomia funcional ventricular.",
    "expectedAnswer": "A contração ventricular aumenta a pressão; o aparelho valvar AV mantém o fechamento competente, enquanto as semilunares abrem-se para permitir a ejeção."
  }
];
export const ptFillQuestions = [
  {
    "id": "fill-01",
    "topic": "Anatomia Topográfica",
    "prompt": "O coração ocupa principalmente o mediastino ____.",
    "answer": "Médio",
    "acceptedAnswers": [
      "Médio",
      "Mediastino médio"
    ]
  },
  {
    "id": "fill-02",
    "topic": "Valvas e Aparelho Valvar",
    "prompt": "A válvula ____ possui tres cúspides.",
    "answer": "Tricúspide",
    "acceptedAnswers": [
      "Tricúspide",
      "Tricuspide"
    ]
  },
  {
    "id": "fill-03",
    "topic": "Configuração externa",
    "prompt": "O ápice cardíaco corresponde ao ventrículo ____.",
    "answer": "Esquerdo",
    "acceptedAnswers": [
      "Esquerdo"
    ]
  },
  {
    "id": "fill-04",
    "topic": "Septos Cardíacos",
    "prompt": "O septo interventricular é convexo para a cavidade ventricular ____.",
    "answer": "Direita",
    "acceptedAnswers": [
      "Direita"
    ]
  },
  {
    "id": "fill-05",
    "topic": "Valvas e Aparelho Valvar",
    "prompt": "As artérias coronarias nacen dos senos de ____.",
    "answer": "Valsalva",
    "acceptedAnswers": [
      "Valsalva",
      "Aorta",
      "Senos aorticos",
      "Senos aórticos"
    ]
  },
  {
    "id": "fill-06",
    "topic": "Relações Anatômicas Cardíacas",
    "prompt": "A face diafragmática repousa sobre o ____.",
    "answer": "Diafragma",
    "acceptedAnswers": [
      "Diafragma"
    ]
  },
  {
    "id": "fill-07",
    "topic": "Configuração externa",
    "prompt": "O sulco ____ separa átrios de ventrículos.",
    "answer": "Coronario",
    "acceptedAnswers": [
      "Coronario",
      "Atrioventricular"
    ]
  },
  {
    "id": "fill-08",
    "topic": "Relações Anatômicas Cardíacas",
    "prompt": "A Átrio esquerdo forma gran parte da ____ cardíaca.",
    "answer": "Base",
    "acceptedAnswers": [
      "Base"
    ]
  },
  {
    "id": "fill-09",
    "topic": "Valvas e Aparelho Valvar",
    "prompt": "As cordas tendíneas se insertan em músculos ____.",
    "answer": "Papilares",
    "acceptedAnswers": [
      "Papilares"
    ]
  },
  {
    "id": "fill-10",
    "topic": "Septos Cardíacos",
    "prompt": "A fossa oval localiza-se no tabique ____.",
    "answer": "Interatrial",
    "acceptedAnswers": [
      "Interatrial",
      "Interatrial"
    ]
  }
];

export const ptBrainMultipleChoiceQuestions = [
  {
    "id": "brain-mc-01",
    "topic": "Corte Sagital Mediano",
    "question": "Em um corte sagital mediano do encéfalo, qual estrutura constitui a principal comissura inter-hemisférica?",
    "options": [
      "Fórnix",
      "Corpo caloso",
      "Comissura posterior",
      "Septo pelúcido",
      "Tálamo"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o fórnix pertence ao sistema límbico e no é a gran comissura entre hemisférios.",
      "Correta: o corpo caloso é a mayor comissura inter-hemisférica e conecta áreas corticales homólogas.",
      "Incorreta: a comissura posterior é pequena e relaciona-se com reflejos pupilares e región mesencefálica.",
      "Incorreta: o septo pelúcido é uma lâmina medial entre corpo caloso e fórnix.",
      "Incorreta: o tálamo é um relevo diencefálico, no uma comissura cortical."
    ]
  },
  {
    "id": "brain-mc-02",
    "topic": "Sistema Ventricular",
    "question": "O aqueduto cerebral observado no plano sagital comunica anatomicamente:",
    "options": [
      "Ventrículo lateral e terceiro ventrículo",
      "Terceiro ventrículo e quarto ventrículo",
      "Quarto ventrículo e canal central cervical",
      "Cisterna magna e ventrículo lateral",
      "Asta temporal e asta occipital"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: esa comunicação corresponde aos forámenes interventriculares.",
      "Correta: o aqueduto cerebral atraviesa o mesencéfalo e conecta o tercer com o quarto ventrículo.",
      "Incorreta: o quarto ventrículo pode continuar para o canal central, mas no mediante o acueducto.",
      "Incorreta: a cisterna magna pertence ao espaço subaracnoideo.",
      "Incorreta: esas astas são porções do ventrículo lateral."
    ]
  },
  {
    "id": "brain-mc-03",
    "topic": "Diencéfalo",
    "question": "Qual relação topográfica define melhor o terceiro ventrículo no corte sagital mediano?",
    "options": [
      "Localiza-se dentro do cerebelo",
      "Encontra-se entre estruturas diencefálicas",
      "Está posterior ao quarto ventrículo",
      "Ocupa o interior do ponte",
      "Localiza-se lateral ao corpo caloso"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o cerebelo relaciona-se com o quarto ventrículo, no contiene o tercero.",
      "Correta: o terceiro ventrículo é uma cavidade impar do diencéfalo, entre tálamos e hipotálamo.",
      "Incorreta: o terceiro ventrículo é superior e anterior ao quarto ventrículo.",
      "Incorreta: o ponte relaciona-se com a parede anterior do quarto ventrículo.",
      "Incorreta: o corpo caloso está superior; o terceiro ventrículo é medial e inferior."
    ]
  },
  {
    "id": "brain-mc-04",
    "topic": "Relações Anatômicas",
    "question": "A hipófise localiza-se na sela túrcica e relaciona-se superiormente de forma relevante com:",
    "options": [
      "Vermis cerebelar",
      "Quiasma óptico e hipotálamo",
      "Bulbo",
      "Sulco calcarino",
      "Corpo caloso"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o vermis está Na linha média do cerebelo, posterior ao tronco encefálico.",
      "Correta: a hipófise localiza-se inferior ao hipotálamo e perto do quiasma óptico.",
      "Incorreta: o bulbo está caudal ao ponte e lejos da sela túrcica.",
      "Incorreta: o sulco calcarino é occipital e cortical.",
      "Incorreta: o corpo caloso é superior e telencefálico."
    ]
  },
  {
    "id": "brain-mc-05",
    "topic": "Cerebelo",
    "question": "Na linha média do cerebelo, visível no corte sagital, a estrutura que une funcionalmente ambos os hemisférios cerebelares é:",
    "options": [
      "Vermis",
      "Tálamo",
      "Fórnix",
      "Mesencéfalo",
      "Quiasma óptico"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: o vermis é a porção média do cerebelo e participa em coordinación axial e postural.",
      "Incorreta: o tálamo pertence ao diencéfalo.",
      "Incorreta: o fórnix é uma vía límbica telencefálica.",
      "Incorreta: o mesencéfalo forma parte do tronco encefálico.",
      "Incorreta: o quiasma óptico pertence à vía visual basal."
    ]
  },
  {
    "id": "brain-mc-06",
    "topic": "Corte Sagital Mediano",
    "question": "Que porção do corpo calloso corresponde à sua extremidade posterior espessada?",
    "options": [
      "Rodilla",
      "Rostro",
      "Tronco",
      "Esplenio",
      "Comissura anterior"
    ],
    "correctIndex": 3,
    "explanations": [
      "Incorreta: a rodilla é a curvatura anterior do corpo caloso.",
      "Incorreta: o rostro é a prolongación inferoanterior.",
      "Incorreta: o tronco é a porção central.",
      "Correta: o esplenio é o extremo posterior engrosado do corpo caloso.",
      "Incorreta: a comissura anterior é outra comissura, independiente do corpo caloso."
    ]
  },
  {
    "id": "brain-mc-07",
    "topic": "Neuroanatomia Funcional",
    "question": "O fórnix é interpretado anatomicamente como uma via relacionada principalmente com:",
    "options": [
      "Sistema piramidal motor",
      "Circuitos límbicos e memoria",
      "Audición primaria",
      "Vía somatosensitiva espinotalámica",
      "Control directo de músculos extraoculares"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o sistema piramidal desciende por cápsula interna, tronco e medula.",
      "Correta: o fórnix conecta formación hipocampal com cuerpos mamilares e outras regiones límbicas.",
      "Incorreta: a audición primaria relaciona-se com corteza temporal e vías auditivas.",
      "Incorreta: a vía espinotalámica asciende por tronco e tálamo.",
      "Incorreta: o control ocular depende de núcleos do tronco e vías supranucleares."
    ]
  },
  {
    "id": "brain-mc-08",
    "topic": "Diencéfalo",
    "question": "O tálamo, visto em relação ao terceiro ventrículo, é reconhecido principalmente como:",
    "options": [
      "Centro de relevo sensitivo e motor para a corteza",
      "Glándula endocrina alojada na sela túrcica",
      "Porção caudal do tronco encefálico",
      "Comissura inter-hemisférica mayor",
      "Corteza visual primaria"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: o tálamo é um relevo diencefálico esencial para múltiples vías para a corteza.",
      "Incorreta: esa descripción corresponde à hipófise.",
      "Incorreta: a porção caudal do tronco corresponde ao bulbo.",
      "Incorreta: a comissura mayor é o corpo caloso.",
      "Incorreta: a corteza visual primaria localiza-se alrededor do sulco calcarino."
    ]
  },
  {
    "id": "brain-mc-09",
    "topic": "Diencéfalo",
    "question": "O hipotálamo forma parte do assoalho e paredes inferiores do terceiro ventrículo e associa-se predominantemente com:",
    "options": [
      "Coordinación fina dos miembros",
      "Regulación neuroendocrina e autónoma",
      "Decusación piramidal exclusiva",
      "Procesamiento auditivo cortical",
      "Producción mecánica de líquido cefalorraquidiano"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: esa função relaciona-se principalmente com o cerebelo.",
      "Correta: o hipotálamo integra respostas autonómicas, endocrinas, térmicas, alimentarias e homeostáticas.",
      "Incorreta: a decusación piramidal pertence ao bulbo caudal.",
      "Incorreta: o procesamiento auditivo cortical é temporal.",
      "Incorreta: o LCR se produce principalmente em plexos coroideos."
    ]
  },
  {
    "id": "brain-mc-10",
    "topic": "Tronco Encefálico",
    "question": "O mesencéfalo localiza-se topograficamente:",
    "options": [
      "Entre diencéfalo e ponte",
      "Entre ponte e bulbo únicamente",
      "Posterior ao cerebelo",
      "Inferior à medula espinal",
      "Dentro do ventrículo lateral"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: o mesencéfalo conecta o diencéfalo com o ponte e contiene o aqueduto cerebral.",
      "Incorreta: esa relação corresponde ao ponte respecto do bulbo.",
      "Incorreta: o cerebelo está posterior ao tronco, no anterior ao mesencéfalo.",
      "Incorreta: a medula espinal continúa caudalmente com o bulbo.",
      "Incorreta: o ventrículo lateral pertence ao telencéfalo."
    ]
  },
  {
    "id": "brain-mc-11",
    "topic": "Sistema Ventricular",
    "question": "O quarto ventrículo localiza-se entre:",
    "options": [
      "Corpo caloso e fórnix",
      "Tálamos direito e esquerdo",
      "Ponte/bulbo anteriormente e cerebelo posteriormente",
      "Quiasma óptico e hipófise",
      "Lóbulo frontal e lóbulo parietal"
    ],
    "correctIndex": 2,
    "explanations": [
      "Incorreta: esa relação se acerca aos ventrículos laterales e septo pelúcido.",
      "Incorreta: entre os tálamos localiza-se o terceiro ventrículo.",
      "Correta: o quarto ventrículo se abre atrás do ponte e bulbo e diante do cerebelo.",
      "Incorreta: esa é uma relação selar/supraselar.",
      "Incorreta: no describe uma cavidade ventricular."
    ]
  },
  {
    "id": "brain-mc-12",
    "topic": "Relações Anatômicas",
    "question": "O septo pelúcido é identificado na linha média como uma lâmina situada principalmente entre:",
    "options": [
      "Corpo caloso e fórnix",
      "Tálamo e ponte",
      "Hipófise e quiasma óptico",
      "Vermis e quarto ventrículo",
      "Bulbo e medula espinal"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: o septo pelúcido separa regiones dos ventrículos laterales entre corpo caloso e fórnix.",
      "Incorreta: tálamo e ponte pertencem a niveles distintos.",
      "Incorreta: esa relação corresponde à región selar.",
      "Incorreta: o vermis relaciona-se com o teto do quarto ventrículo, no com o septum.",
      "Incorreta: esa continuidad é caudal e do tronco."
    ]
  },
  {
    "id": "brain-mc-13",
    "topic": "Relações Anatômicas",
    "question": "O sulco calcarino associa-se anatomicamente com:",
    "options": [
      "Corteza visual primaria",
      "Área motora primaria",
      "Centro respiratorio bulbar",
      "Vía olfatoria basal",
      "Núcleo rojo mesencefálico"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: alrededor do sulco calcarino localiza-se a corteza visual primaria do lóbulo occipital.",
      "Incorreta: o área motora primaria situa-se no giro precentral.",
      "Incorreta: centros respiratorios se ubican em tronco encefálico.",
      "Incorreta: a vía olfatoria é basal e telencefálica.",
      "Incorreta: o núcleo rojo está no mesencéfalo."
    ]
  },
  {
    "id": "brain-mc-14",
    "topic": "Corte Sagital Mediano",
    "question": "O sulco parietoccipital visível na face medial delimita principalmente:",
    "options": [
      "Lóbulo temporal e lóbulo frontal",
      "Lóbulo parietal e lóbulo occipital",
      "Cerebelo e bulbo",
      "Tálamo e hipotálamo",
      "Ponte e mesencéfalo"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: esa relação corresponde a outras referências laterales.",
      "Correta: o sulco parietooccipital é uma referência medial entre os lóbulos parietal e occipital.",
      "Incorreta: cerebelo e bulbo separam-se por relações do quarto ventrículo e cisternas.",
      "Incorreta: tálamo e hipotálamo são regiones diencefálicas.",
      "Incorreta: ponte e mesencéfalo pertencem ao tronco encefálico."
    ]
  },
  {
    "id": "brain-mc-15",
    "topic": "Diencéfalo",
    "question": "A glândula pineal ou epífise relaciona-se com:",
    "options": [
      "Teto posterior do terceiro ventrículo",
      "Assoalho do quarto ventrículo",
      "Sela túrcica",
      "Asta temporal do ventrículo lateral",
      "Decusación das pirámides"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: a pineal pertence ao epitálamo e localiza-se na región posterior do teto do terceiro ventrículo.",
      "Incorreta: o assoalho do quarto ventrículo relaciona-se com o romboencéfalo.",
      "Incorreta: a sela túrcica aloja a hipófise.",
      "Incorreta: o asta temporal pertence ao ventrículo lateral.",
      "Incorreta: a decusación piramidal é bulbar."
    ]
  },
  {
    "id": "brain-mc-16",
    "topic": "Tronco Encefálico",
    "question": "A ponte é reconhecida no corte sagital como uma proeminência do tronco encefálico situada:",
    "options": [
      "Entre mesencéfalo e bulbo",
      "Entre tálamo e corpo caloso",
      "Posterior ao vermis",
      "Dentro da sela túrcica",
      "Superior ao corpo caloso"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: o ponte interpõe-se entre o mesencéfalo e o bulbo e forma a parede anterior do quarto ventrículo.",
      "Incorreta: esa región é supratentorial e diencefálica/telencefálica.",
      "Incorreta: o vermis está posterior ao tronco.",
      "Incorreta: a sela túrcica aloja a hipófise.",
      "Incorreta: o corpo caloso está superior e telencefálico."
    ]
  },
  {
    "id": "brain-mc-17",
    "topic": "Tronco Encefálico",
    "question": "O bulbo continua-se caudalmente com:",
    "options": [
      "Tálamo",
      "Medula espinal",
      "Corpo caloso",
      "Hipófise",
      "Ventrículo lateral"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o tálamo é diencefálico e superior ao tronco.",
      "Correta: o bulbo constitui a transición caudal do encéfalo para a medula espinal.",
      "Incorreta: o corpo caloso é telencefálico.",
      "Incorreta: a hipófise é endocrina e selar.",
      "Incorreta: o ventrículo lateral pertence ao sistema ventricular telencefálico."
    ]
  },
  {
    "id": "brain-mc-18",
    "topic": "Relações Anatômicas",
    "question": "Uma lesão expansiva hipofisária pode comprometer precocemente o quiasma óptico por sua relação:",
    "options": [
      "Posterior e inferior à hipófise",
      "Superior e anterior à hipófise",
      "Dentro do quarto ventrículo",
      "No vermis cerebelar",
      "Caudal ao bulbo"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: invierte a relação anatômica principal.",
      "Correta: o quiasma óptico situa-se superior e anterior à hipófise, por eso pode comprimirse.",
      "Incorreta: no pertence ao quarto ventrículo.",
      "Incorreta: o vermis é cerebelar e posterior.",
      "Incorreta: o bulbo está caudal e distante da sela túrcica."
    ]
  },
  {
    "id": "brain-mc-19",
    "topic": "Sistema Ventricular",
    "question": "Uma obstrução do aqueduto cerebral produziria dilatação predominante de:",
    "options": [
      "Quarto ventrículo aislado",
      "Ventrículos laterales e terceiro ventrículo",
      "Canal central medular exclusivamente",
      "Cisterna magna sem cambios ventriculares",
      "Seno sagital superior"
    ],
    "correctIndex": 1,
    "explanations": [
      "Incorreta: o quarto ventrículo queda distal à obstrução.",
      "Correta: ao bloquearse o acueducto se dilatan as cavidades proximales: ventrículos laterales e tercero.",
      "Incorreta: o canal central no é a cavidade proximal principal.",
      "Incorreta: o problema primario é intraventricular, no cisternal aislado.",
      "Incorreta: o seno sagital superior pertence ao drenaje venoso dural."
    ]
  },
  {
    "id": "brain-mc-20",
    "topic": "Corte Sagital Mediano",
    "question": "Qual conjunto de estruturas é característico de uma leitura anatômica do corte sagital mediano do encéfalo?",
    "options": [
      "Corpo caloso, fórnix, terceiro ventrículo, tronco encefálico e vermis",
      "Ínsula, putamen, cápsula externa e claustro",
      "Núcleo caudado, globo pálido e tálamo lateral",
      "Asta temporal, hipocampo e amígdala lateral",
      "Corteza auditiva, opérculo frontal e sulco lateral"
    ],
    "correctIndex": 0,
    "explanations": [
      "Correta: esas estruturas são referências mediales claves para estudiar o plano sagital.",
      "Incorreta: corresponde a estruturas profundas laterales, no ao plano mediano.",
      "Incorreta: incluye núcleos basales e relações laterales.",
      "Incorreta: describe estruturas temporales mediales/laterales, no o corte mediano clássico.",
      "Incorreta: se refiere à superficie lateral e región silviana."
    ]
  }
];
export const ptBrainTrueFalseQuestions = [
  {
    "id": "brain-tf-01",
    "topic": "Corte Sagital Mediano",
    "statement": "O corpo caloso constitui a principal comissura inter-hemisférica.",
    "correctAnswer": true,
    "explanation": "É a gran vía comisural que conecta áreas corticales de ambos hemisférios."
  },
  {
    "id": "brain-tf-02",
    "topic": "Sistema Ventricular",
    "statement": "O aqueduto cerebral comunica os ventrículos laterales com o terceiro ventrículo.",
    "correctAnswer": false,
    "explanation": "Os ventrículos laterales comunican com o tercero pelos forámenes interventriculares; o acueducto comunica tercero e cuarto."
  },
  {
    "id": "brain-tf-03",
    "topic": "Sistema Ventricular",
    "statement": "O quarto ventrículo localiza-se entre o tronco encefálico e o cerebelo.",
    "correctAnswer": true,
    "explanation": "Su parede anterior relaciona-se com ponte e bulbo, e seu teto com estruturas cerebelares."
  },
  {
    "id": "brain-tf-04",
    "topic": "Diencéfalo",
    "statement": "O tálamo pertence ao telencéfalo.",
    "correctAnswer": false,
    "explanation": "O tálamo é uma estrutura do diencéfalo."
  },
  {
    "id": "brain-tf-05",
    "topic": "Relações Anatômicas",
    "statement": "A hipófise se aloja na sela túrcica.",
    "correctAnswer": true,
    "explanation": "A fosa hipofisaria da sela túrcica contiene a glándula hipófise."
  },
  {
    "id": "brain-tf-06",
    "topic": "Relações Anatômicas",
    "statement": "O quiasma óptico está por debajo da hipófise.",
    "correctAnswer": false,
    "explanation": "Localiza-se superior e anterior respecto à hipófise."
  },
  {
    "id": "brain-tf-07",
    "topic": "Cerebelo",
    "statement": "O vermis é a porção média do cerebelo.",
    "correctAnswer": true,
    "explanation": "O vermis ocupa a línea média cerebelar e conecta ambos hemisférios cerebelares."
  },
  {
    "id": "brain-tf-08",
    "topic": "Relações Anatômicas",
    "statement": "O sulco calcarino relaciona-se com a corteza visual primaria.",
    "correctAnswer": true,
    "explanation": "A corteza visual primaria se organiza alrededor do sulco calcarino."
  },
  {
    "id": "brain-tf-09",
    "topic": "Neuroanatomia Funcional",
    "statement": "O fórnix é uma vía motora principal do sistema piramidal.",
    "correctAnswer": false,
    "explanation": "O fórnix pertence a circuitos límbicos vinculados com memoria."
  },
  {
    "id": "brain-tf-10",
    "topic": "Diencéfalo",
    "statement": "O hipotálamo participa em funções neuroendocrinas e autonómicas.",
    "correctAnswer": true,
    "explanation": "Integra homeostasis, eje hipotálamo-hipofisario e control autonómico."
  },
  {
    "id": "brain-tf-11",
    "topic": "Diencéfalo",
    "statement": "A glândula pineal localiza-se anterior ao quiasma óptico.",
    "correctAnswer": false,
    "explanation": "A pineal é posterior, na región epitálamica do teto do terceiro ventrículo."
  },
  {
    "id": "brain-tf-12",
    "topic": "Relações Anatômicas",
    "statement": "O septo pelúcido situa-se entre o corpo caloso e o fórnix.",
    "correctAnswer": true,
    "explanation": "Esa lâmina contribui à separação medial dos ventrículos laterales."
  },
  {
    "id": "brain-tf-13",
    "topic": "Tronco Encefálico",
    "statement": "O ponte situa-se entre o mesencéfalo e o bulbo.",
    "correctAnswer": true,
    "explanation": "É o segmento médio do tronco encefálico."
  },
  {
    "id": "brain-tf-14",
    "topic": "Corte Sagital Mediano",
    "statement": "O corpo caloso localiza-se inferior ao terceiro ventrículo.",
    "correctAnswer": false,
    "explanation": "O corpo caloso é superior; o terceiro ventrículo encontra-se inferior e medial no diencéfalo."
  },
  {
    "id": "brain-tf-15",
    "topic": "Tronco Encefálico",
    "statement": "O aqueduto cerebral atraviesa o mesencéfalo.",
    "correctAnswer": true,
    "explanation": "É uma cavidade estrecha dentro do mesencéfalo."
  },
  {
    "id": "brain-tf-16",
    "topic": "Sistema Ventricular",
    "statement": "O terceiro ventrículo é uma cavidade impar e medial.",
    "correctAnswer": true,
    "explanation": "Pertence ao sistema ventricular diencefálico e ocupa a línea média."
  },
  {
    "id": "brain-tf-17",
    "topic": "Cerebelo",
    "statement": "O cerebelo localiza-se anterior ao ponte.",
    "correctAnswer": false,
    "explanation": "O cerebelo situa-se posterior ao ponte e ao quarto ventrículo."
  },
  {
    "id": "brain-tf-18",
    "topic": "Tronco Encefálico",
    "statement": "O bulbo continúa caudalmente com a medula espinal.",
    "correctAnswer": true,
    "explanation": "É a transición anatômica entre encéfalo e medula."
  },
  {
    "id": "brain-tf-19",
    "topic": "Corte Sagital Mediano",
    "statement": "O sulco parietooccipital é um reparo importante da cara medial do hemisfério cerebral.",
    "correctAnswer": true,
    "explanation": "Delimita regiones parietales e occipitales na superficie medial."
  },
  {
    "id": "brain-tf-20",
    "topic": "Diencéfalo",
    "statement": "O hipotálamo forma parte do assoalho e paredes inferiores do terceiro ventrículo.",
    "correctAnswer": true,
    "explanation": "Su relação ventricular explica seu posição central no eje neuroendocrino."
  }
];
export const ptBrainMatchingExercises = [
  {
    "id": "brain-match-01",
    "topic": "Sistema Ventricular",
    "title": "Sistema ventricular e comunicaciones",
    "explanation": "O sistema ventricular se comprende como uma secuencia de cavidades comunicantes que conducen líquido cefalorraquidiano.",
    "pairs": [
      {
        "id": "brain-match-01-pair-0",
        "prompt": "Ventrículo lateral",
        "correctOptionId": "brain-match-01-opt-0"
      },
      {
        "id": "brain-match-01-pair-1",
        "prompt": "Foramen interventricular",
        "correctOptionId": "brain-match-01-opt-1"
      },
      {
        "id": "brain-match-01-pair-2",
        "prompt": "Terceiro ventrículo",
        "correctOptionId": "brain-match-01-opt-2"
      },
      {
        "id": "brain-match-01-pair-3",
        "prompt": "Aqueduto cerebral",
        "correctOptionId": "brain-match-01-opt-3"
      },
      {
        "id": "brain-match-01-pair-4",
        "prompt": "Quarto ventrículo",
        "correctOptionId": "brain-match-01-opt-4"
      }
    ],
    "options": [
      {
        "id": "brain-match-01-opt-0",
        "text": "Cavidade telencefálica par"
      },
      {
        "id": "brain-match-01-opt-1",
        "text": "Comunica ventrículo lateral com terceiro ventrículo"
      },
      {
        "id": "brain-match-01-opt-2",
        "text": "Cavidade impar do diencéfalo"
      },
      {
        "id": "brain-match-01-opt-3",
        "text": "Comunica tercer e quarto ventrículo"
      },
      {
        "id": "brain-match-01-opt-4",
        "text": "Cavidade entre tronco encefálico e cerebelo"
      }
    ],
    "prompt": ""
  },
  {
    "id": "brain-match-02",
    "topic": "Diencéfalo",
    "title": "Estruturas diencefálicas",
    "explanation": "O diencéfalo integra relevos sensitivos, control neuroendocrino e estruturas epitalámicas.",
    "pairs": [
      {
        "id": "brain-match-02-pair-0",
        "prompt": "Tálamo",
        "correctOptionId": "brain-match-02-opt-0"
      },
      {
        "id": "brain-match-02-pair-1",
        "prompt": "Hipotálamo",
        "correctOptionId": "brain-match-02-opt-1"
      },
      {
        "id": "brain-match-02-pair-2",
        "prompt": "Epífisis",
        "correctOptionId": "brain-match-02-opt-2"
      },
      {
        "id": "brain-match-02-pair-3",
        "prompt": "Cuerpos mamilares",
        "correctOptionId": "brain-match-02-opt-3"
      },
      {
        "id": "brain-match-02-pair-4",
        "prompt": "Quiasma óptico",
        "correctOptionId": "brain-match-02-opt-4"
      }
    ],
    "options": [
      {
        "id": "brain-match-02-opt-0",
        "text": "Relevo principal para a corteza"
      },
      {
        "id": "brain-match-02-opt-1",
        "text": "Regulación autonómica e endocrina"
      },
      {
        "id": "brain-match-02-opt-2",
        "text": "Glândula pineal do epitálamo"
      },
      {
        "id": "brain-match-02-opt-3",
        "text": "Referência límbica hipotalámica"
      },
      {
        "id": "brain-match-02-opt-4",
        "text": "Decusación parcial de fibras visuales"
      }
    ],
    "prompt": ""
  },
  {
    "id": "brain-match-03",
    "topic": "Tronco Encefálico",
    "title": "Tronco encefálico em plano sagital",
    "explanation": "O tronco encefálico organiza continuidad anatômica entre encéfalo, cerebelo e medula espinal.",
    "pairs": [
      {
        "id": "brain-match-03-pair-0",
        "prompt": "Mesencéfalo",
        "correctOptionId": "brain-match-03-opt-0"
      },
      {
        "id": "brain-match-03-pair-1",
        "prompt": "Ponte",
        "correctOptionId": "brain-match-03-opt-1"
      },
      {
        "id": "brain-match-03-pair-2",
        "prompt": "Bulbo",
        "correctOptionId": "brain-match-03-opt-2"
      },
      {
        "id": "brain-match-03-pair-3",
        "prompt": "Pedúnculos cerebrales",
        "correctOptionId": "brain-match-03-opt-3"
      },
      {
        "id": "brain-match-03-pair-4",
        "prompt": "Assoalho do quarto ventrículo",
        "correctOptionId": "brain-match-03-opt-4"
      }
    ],
    "options": [
      {
        "id": "brain-match-03-opt-0",
        "text": "Contiene o aqueduto cerebral"
      },
      {
        "id": "brain-match-03-opt-1",
        "text": "Prominencia entre mesencéfalo e bulbo"
      },
      {
        "id": "brain-match-03-opt-2",
        "text": "Continuación caudal para a medula espinal"
      },
      {
        "id": "brain-match-03-opt-3",
        "text": "Relevos anteriores mesencefálicos"
      },
      {
        "id": "brain-match-03-opt-4",
        "text": "Relação dorsal de ponte e bulbo"
      }
    ],
    "prompt": ""
  },
  {
    "id": "brain-match-04",
    "topic": "Cerebelo",
    "title": "Cerebelo e relações ventriculares",
    "explanation": "O cerebelo se interpreta por seu organización média, hemisférica e por seu relação com o quarto ventrículo.",
    "pairs": [
      {
        "id": "brain-match-04-pair-0",
        "prompt": "Vermis",
        "correctOptionId": "brain-match-04-opt-0"
      },
      {
        "id": "brain-match-04-pair-1",
        "prompt": "Hemisférios cerebelares",
        "correctOptionId": "brain-match-04-opt-1"
      },
      {
        "id": "brain-match-04-pair-2",
        "prompt": "Árbol da vida",
        "correctOptionId": "brain-match-04-opt-2"
      },
      {
        "id": "brain-match-04-pair-3",
        "prompt": "Teto do quarto ventrículo",
        "correctOptionId": "brain-match-04-opt-3"
      },
      {
        "id": "brain-match-04-pair-4",
        "prompt": "Coordinación postural",
        "correctOptionId": "brain-match-04-opt-4"
      }
    ],
    "options": [
      {
        "id": "brain-match-04-opt-0",
        "text": "Porção média do cerebelo"
      },
      {
        "id": "brain-match-04-opt-1",
        "text": "Porções laterales do cerebelo"
      },
      {
        "id": "brain-match-04-opt-2",
        "text": "Sustancia blanca cerebelar ramificada"
      },
      {
        "id": "brain-match-04-opt-3",
        "text": "Relação cerebelar posterior"
      },
      {
        "id": "brain-match-04-opt-4",
        "text": "Função asociada a regiones medianas cerebelares"
      }
    ],
    "prompt": ""
  },
  {
    "id": "brain-match-05",
    "topic": "Corte Sagital Mediano",
    "title": "Reparos do corte sagital",
    "explanation": "O corte sagital mediano permite integrar estruturas comisurales, límbicas, ventriculares e corticales mediales.",
    "pairs": [
      {
        "id": "brain-match-05-pair-0",
        "prompt": "Corpo caloso",
        "correctOptionId": "brain-match-05-opt-0"
      },
      {
        "id": "brain-match-05-pair-1",
        "prompt": "Fórnix",
        "correctOptionId": "brain-match-05-opt-1"
      },
      {
        "id": "brain-match-05-pair-2",
        "prompt": "Septo pelúcido",
        "correctOptionId": "brain-match-05-opt-2"
      },
      {
        "id": "brain-match-05-pair-3",
        "prompt": "Sulco calcarino",
        "correctOptionId": "brain-match-05-opt-3"
      },
      {
        "id": "brain-match-05-pair-4",
        "prompt": "Sulco parietooccipital",
        "correctOptionId": "brain-match-05-opt-4"
      }
    ],
    "options": [
      {
        "id": "brain-match-05-opt-0",
        "text": "Principal comissura inter-hemisférica"
      },
      {
        "id": "brain-match-05-opt-1",
        "text": "Vía límbica relacionada com memoria"
      },
      {
        "id": "brain-match-05-opt-2",
        "text": "Lâmina entre corpo caloso e fórnix"
      },
      {
        "id": "brain-match-05-opt-3",
        "text": "Reparo de corteza visual primaria"
      },
      {
        "id": "brain-match-05-opt-4",
        "text": "Limite medial entre parietal e occipital"
      }
    ],
    "prompt": ""
  }
];
export const ptBrainShortQuestions = [
  {
    "id": "brain-short-01",
    "topic": "Corte Sagital Mediano",
    "question": "Explique a importância do corte sagital mediano para o estudio da neuroanatomía topográfica.",
    "expectedAnswer": "O corte sagital mediano expone estruturas impares o médias como corpo caloso, fórnix, terceiro ventrículo, tronco encefálico, vermis e relações diencefálicas, permitindo integrar cavidades, comissuras e ejes funcionales."
  },
  {
    "id": "brain-short-02",
    "topic": "Sistema Ventricular",
    "question": "Describa a secuencia anatômica do fluxo ventricular desde os ventrículos laterales até o quarto ventrículo.",
    "expectedAnswer": "O LCR pasa desde os ventrículos laterales pelos forámenes interventriculares ao terceiro ventrículo, continúa pelo aqueduto cerebral no mesencéfalo e llega ao quarto ventrículo."
  },
  {
    "id": "brain-short-03",
    "topic": "Diencéfalo",
    "question": "Compare tálamo e hipotálamo desde o punto de vista topográfico e funcional.",
    "expectedAnswer": "O tálamo é um gran relevo diencefálico superior e lateral ao terceiro ventrículo; o hipotálamo é inferior, forma parte do assoalho ventricular e regula funções autonómicas e endocrinas."
  },
  {
    "id": "brain-short-04",
    "topic": "Relações Anatômicas",
    "question": "Explique a relação entre hipófise, hipotálamo e quiasma óptico.",
    "expectedAnswer": "A hipófise se aloja na sela túrcica, se conecta ao hipotálamo pelo infundíbulo e relaciona-se superior/anteriormente com o quiasma óptico, lo que explica síntomas visuales em lesiones selares."
  },
  {
    "id": "brain-short-05",
    "topic": "Tronco Encefálico",
    "question": "Describa a posição do mesencéfalo e seu relação com o aqueduto cerebral.",
    "expectedAnswer": "O mesencéfalo localiza-se entre diencéfalo e ponte; o aqueduto cerebral lo atraviesa e comunica o tercer com o quarto ventrículo."
  },
  {
    "id": "brain-short-06",
    "topic": "Cerebelo",
    "question": "Explique a relevância do vermis No corte sagital.",
    "expectedAnswer": "O vermis é a porção média do cerebelo, visible no plano sagital, vinculada a coordinación axial, postura e equilibrio, e relacionada com o teto do quarto ventrículo."
  },
  {
    "id": "brain-short-07",
    "topic": "Neuroanatomia Funcional",
    "question": "Describa a função anatômica general do fórnix.",
    "expectedAnswer": "O fórnix é uma vía de sustancia blanca do sistema límbico que conecta a formación hipocampal com cuerpos mamilares e regiones septales, participando em circuitos de memoria."
  },
  {
    "id": "brain-short-08",
    "topic": "Corte Sagital Mediano",
    "question": "Explique as porções principales do corpo caloso e seu valor topográfico.",
    "expectedAnswer": "O corpo caloso incluye rostro, rodilla, tronco e esplenio; seu identificación orienta a lectura do telencéfalo medial e a relação com septo pelúcido e fórnix."
  },
  {
    "id": "brain-short-09",
    "topic": "Sistema Ventricular",
    "question": "Explique por qué uma obstrução do aqueduto cerebral produce hidrocefalia supratentorial.",
    "expectedAnswer": "Ao obstruirse o acueducto, se bloquea o drenaje desde o tercer ao quarto ventrículo, dilatándose as cavidades proximales: ventrículos laterales e terceiro ventrículo."
  },
  {
    "id": "brain-short-10",
    "topic": "Relações Anatômicas",
    "question": "Describa o septo pelúcido e seus relações.",
    "expectedAnswer": "O septo pelúcido é uma lâmina medial fina situada entre corpo caloso e fórnix, relacionada com a separação dos ventrículos laterales."
  },
  {
    "id": "brain-short-11",
    "topic": "Relações Anatômicas",
    "question": "Explique a relevância do sulco calcarino.",
    "expectedAnswer": "O sulco calcarino, na cara medial occipital, é referência topográfica da corteza visual primaria, por lo que integra anatomía superficial e função visual."
  },
  {
    "id": "brain-short-12",
    "topic": "Corte Sagital Mediano",
    "question": "Defina a importância do sulco parietooccipital na cara medial.",
    "expectedAnswer": "O sulco parietooccipital delimita regiones parietales e occipitales na superficie medial, ayudando a orientar a lectura lobar do corte sagital."
  },
  {
    "id": "brain-short-13",
    "topic": "Tronco Encefálico",
    "question": "Compare ponte e bulbo em uma vista sagital.",
    "expectedAnswer": "O ponte é uma prominencia intermedia entre mesencéfalo e bulbo; o bulbo é caudal, continúa com a medula espinal e contiene centros vitales e vías largas."
  },
  {
    "id": "brain-short-14",
    "topic": "Diencéfalo",
    "question": "Explique a posição da glândula pineal.",
    "expectedAnswer": "A pineal pertence ao epitálamo e localiza-se na región posterior do teto do terceiro ventrículo, perto da comissura posterior."
  },
  {
    "id": "brain-short-15",
    "topic": "Neuroanatomia Funcional",
    "question": "Integre cerebelo, tronco encefálico e quarto ventrículo.",
    "expectedAnswer": "O quarto ventrículo interpõe-se entre ponte/bulbo e cerebelo; esta relação explica a continuidad entre vías do tronco, coordinación cerebelar e circulação do LCR."
  },
  {
    "id": "brain-short-16",
    "topic": "Relações Anatômicas",
    "question": "Explique por qué o quiasma óptico é vulnerable em tumores hipofisarios.",
    "expectedAnswer": "Por seu posição superior e anterior à hipófise, uma expansión selar pode comprimir o quiasma e alterar fibras visuales cruzadas."
  },
  {
    "id": "brain-short-17",
    "topic": "Sistema Ventricular",
    "question": "Describa o terceiro ventrículo e seus límites generales.",
    "expectedAnswer": "É uma cavidade impar medial do diencéfalo, relacionada lateralmente com tálamos, inferiormente com hipotálamo e posteriormente com aqueduto cerebral."
  },
  {
    "id": "brain-short-18",
    "topic": "Cerebelo",
    "question": "Explique o significado anatômico do árbol da vida.",
    "expectedAnswer": "O árbol da vida é a disposición ramificada da sustancia blanca cerebelar, visible em cortes sagitales e rodeada por corteza cerebelar."
  },
  {
    "id": "brain-short-19",
    "topic": "Corte Sagital Mediano",
    "question": "Mencione estruturas que permiten reconocer que um corte é mediano e no lateral.",
    "expectedAnswer": "A presencia de corpo caloso completo, fórnix médio, terceiro ventrículo, vermis, tronco em línea média e relações hipotalámicas sugiere um corte sagital mediano."
  },
  {
    "id": "brain-short-20",
    "topic": "Neuroanatomia Funcional",
    "question": "Explique como relaciona-se a anatomía topográfica com a interpretación clínica neurológica.",
    "expectedAnswer": "A topografía permite vincular estruturas com funções; por ejemplo, lesiones do acueducto producen hidrocefalia, lesiones cerebelares causan ataxia e compresión quiasmática altera campos visuales."
  }
];
export const ptBrainFillQuestions = [
  {
    "id": "brain-fill-01",
    "topic": "Corte Sagital Mediano",
    "prompt": "O corpo ____ constitui a principal comissura inter-hemisférica.",
    "answer": "Calloso",
    "acceptedAnswers": [
      "Calloso",
      "Corpo caloso"
    ]
  },
  {
    "id": "brain-fill-02",
    "topic": "Sistema Ventricular",
    "prompt": "O aqueduto cerebral comunica o terceiro ventrículo com o ____ ventrículo.",
    "answer": "Cuarto",
    "acceptedAnswers": [
      "Cuarto",
      "4",
      "Iv"
    ]
  },
  {
    "id": "brain-fill-03",
    "topic": "Cerebelo",
    "prompt": "O vermis pertence ao ____.",
    "answer": "Cerebelo",
    "acceptedAnswers": [
      "Cerebelo"
    ]
  },
  {
    "id": "brain-fill-04",
    "topic": "Relações Anatômicas",
    "prompt": "A hipófise localiza-se na silla ____.",
    "answer": "Turca",
    "acceptedAnswers": [
      "Turca",
      "Sela túrcica"
    ]
  },
  {
    "id": "brain-fill-05",
    "topic": "Relações Anatômicas",
    "prompt": "O sulco ____ relaciona-se com a corteza visual primaria.",
    "answer": "Calcarino",
    "acceptedAnswers": [
      "Calcarino",
      "Calcarina"
    ]
  },
  {
    "id": "brain-fill-06",
    "topic": "Diencéfalo",
    "prompt": "O ____ participa no control neuroendocrino e autonómico.",
    "answer": "Hipotálamo",
    "acceptedAnswers": [
      "Hipotálamo",
      "Hipotalamo"
    ]
  },
  {
    "id": "brain-fill-07",
    "topic": "Tronco Encefálico",
    "prompt": "O aqueduto cerebral atraviesa o ____.",
    "answer": "Mesencéfalo",
    "acceptedAnswers": [
      "Mesencéfalo",
      "Mesencefalo"
    ]
  },
  {
    "id": "brain-fill-08",
    "topic": "Neuroanatomia Funcional",
    "prompt": "O ____ é uma vía límbica relacionada com memoria.",
    "answer": "Fórnix",
    "acceptedAnswers": [
      "Fórnix",
      "Fornix"
    ]
  },
  {
    "id": "brain-fill-09",
    "topic": "Diencéfalo",
    "prompt": "O ____ actúa como relevo sensitivo principal para a corteza.",
    "answer": "Tálamo",
    "acceptedAnswers": [
      "Tálamo",
      "Talamo"
    ]
  },
  {
    "id": "brain-fill-10",
    "topic": "Relações Anatômicas",
    "prompt": "O septum ____ localiza-se entre o corpo caloso e o fórnix.",
    "answer": "Pellucidum",
    "acceptedAnswers": [
      "Pellucidum",
      "Pelucido",
      "Pellúcido"
    ]
  }
];

export const ptFemaleMultipleChoiceQuestions = [
  {
    "id": "female-mc-01",
    "topic": "Relações Pélvicas",
    "question": "Em um corte sagital mediano da pelve feminina, entre quais órgãos situa-se topograficamente o útero?",
    "options": [
      "Entre o púbis e a bexiga urinária",
      "Entre a bexiga urinária e o reto",
      "Entre o reto e o sacro",
      "Entre a uretra e o canal anal",
      "Entre o ovario e a tuba uterina"
    ],
    "correctIndex": 1,
    "explanations": [
      "Entre o púbis e a bexiga urinária não corresponde à relação topográfica principal avaliada neste modelo.",
      "Entre a bexiga urinária e o reto é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Entre o reto e o sacro não corresponde à relação topográfica principal avaliada neste modelo.",
      "Entre a uretra e o canal anal não corresponde à relação topográfica principal avaliada neste modelo.",
      "Entre o ovario e a tuba uterina não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-02",
    "topic": "Relações Pélvicas",
    "question": "Qual recesso peritoneal localiza-se entre a bexiga urinária e o útero?",
    "options": [
      "Fundo de saco retouterino",
      "Recesso paracólico",
      "Fundo de saco vesicouterino",
      "Recesso hepatorrenal",
      "Bolsa omental"
    ],
    "correctIndex": 2,
    "explanations": [
      "Fundo de saco retouterino não corresponde à relação topográfica principal avaliada neste modelo.",
      "Recesso paracólico não corresponde à relação topográfica principal avaliada neste modelo.",
      "Fundo de saco vesicouterino é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Recesso hepatorrenal não corresponde à relação topográfica principal avaliada neste modelo.",
      "Bolsa omental não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-03",
    "topic": "Relações Pélvicas",
    "question": "O fundo de saco retouterino, também denominado fundo de saco de Douglas, localiza-se principalmente entre:",
    "options": [
      "Bexiga e púbis",
      "Uretra e vagina",
      "Útero/vagina posterior e reto",
      "Sacro e cóccix",
      "Ovario e parede abdominal"
    ],
    "correctIndex": 2,
    "explanations": [
      "Bexiga e púbis não corresponde à relação topográfica principal avaliada neste modelo.",
      "Uretra e vagina não corresponde à relação topográfica principal avaliada neste modelo.",
      "Útero/vagina posterior e reto é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Sacro e cóccix não corresponde à relação topográfica principal avaliada neste modelo.",
      "Ovario e parede abdominal não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-04",
    "topic": "Órgãos Reprodutores",
    "question": "Qual estrutura corresponde à porção inferior estreita do útero que se projeta para a vagina?",
    "options": [
      "Fundo uterino",
      "Corpo uterino",
      "Colo do útero o colo do útero",
      "Tuba uterina",
      "Ovario"
    ],
    "correctIndex": 2,
    "explanations": [
      "Fundo uterino não corresponde à relação topográfica principal avaliada neste modelo.",
      "Corpo uterino não corresponde à relação topográfica principal avaliada neste modelo.",
      "Colo do útero o colo do útero é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Tuba uterina não corresponde à relação topográfica principal avaliada neste modelo.",
      "Ovario não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-05",
    "topic": "Sistema Urinário Associado",
    "question": "Na pelve feminina, a uretra localiza-se tipicamente:",
    "options": [
      "Anterior ao canal vaginal",
      "Posterior ao reto",
      "Superior ao fundo uterino",
      "Dentro da cavidade uterina",
      "Posterior ao sacro"
    ],
    "correctIndex": 0,
    "explanations": [
      "Anterior ao canal vaginal é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Posterior ao reto não corresponde à relação topográfica principal avaliada neste modelo.",
      "Superior ao fundo uterino não corresponde à relação topográfica principal avaliada neste modelo.",
      "Dentro da cavidade uterina não corresponde à relação topográfica principal avaliada neste modelo.",
      "Posterior ao sacro não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-06",
    "topic": "Anatomia Topográfica",
    "question": "Qual estrutura óssea constitui uma referência posterior importante no corte sagital da pelve feminina?",
    "options": [
      "Púbis",
      "Sacro",
      "Ísquio anterior",
      "Clavícula",
      "Esterno"
    ],
    "correctIndex": 1,
    "explanations": [
      "Púbis não corresponde à relação topográfica principal avaliada neste modelo.",
      "Sacro é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Ísquio anterior não corresponde à relação topográfica principal avaliada neste modelo.",
      "Clavícula não corresponde à relação topográfica principal avaliada neste modelo.",
      "Esterno não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-07",
    "topic": "Órgãos Reprodutores",
    "question": "O fundo uterino corresponde a:",
    "options": [
      "A porção superior redondeada do útero",
      "O canal entre colo do útero e vagina",
      "O extremo inferior do canal anal",
      "O ligamento que une ovario e útero",
      "A parede posterior da bexiga"
    ],
    "correctIndex": 0,
    "explanations": [
      "A porção superior redondeada do útero é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "O canal entre colo do útero e vagina não corresponde à relação topográfica principal avaliada neste modelo.",
      "O extremo inferior do canal anal não corresponde à relação topográfica principal avaliada neste modelo.",
      "O ligamento que une ovario e útero não corresponde à relação topográfica principal avaliada neste modelo.",
      "A parede posterior da bexiga não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-08",
    "topic": "Órgãos Reprodutores",
    "question": "O corpo uterino define-se topograficamente como:",
    "options": [
      "A porção principal do útero entre fundo e colo",
      "A cavidade do reto",
      "A parte distal da uretra",
      "O segmento externo do periné",
      "O borde posterior do sacro"
    ],
    "correctIndex": 0,
    "explanations": [
      "A porção principal do útero entre fundo e colo é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "A cavidade do reto não corresponde à relação topográfica principal avaliada neste modelo.",
      "A parte distal da uretra não corresponde à relação topográfica principal avaliada neste modelo.",
      "O segmento externo do periné não corresponde à relação topográfica principal avaliada neste modelo.",
      "O borde posterior do sacro não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-09",
    "topic": "Relações Pélvicas",
    "question": "A posição habitual de anteversão/anteflexão uterina orienta o corpo do útero para:",
    "options": [
      "O sacro e o reto",
      "A bexiga urinária",
      "O canal anal",
      "A parede posterior do abdomen",
      "O cóccix"
    ],
    "correctIndex": 1,
    "explanations": [
      "O sacro e o reto não corresponde à relação topográfica principal avaliada neste modelo.",
      "A bexiga urinária é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "O canal anal não corresponde à relação topográfica principal avaliada neste modelo.",
      "A parede posterior do abdomen não corresponde à relação topográfica principal avaliada neste modelo.",
      "O cóccix não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-10",
    "topic": "Relações Pélvicas",
    "question": "O canal vaginal relaciona-se topograficamente com:",
    "options": [
      "Uretra anterior e reto posterior",
      "Reto anterior e bexiga posterior",
      "Sacro anterior e púbis posterior",
      "Ovario medial e uretra posterior",
      "Bexiga superior e tálamo inferior"
    ],
    "correctIndex": 0,
    "explanations": [
      "Uretra anterior e reto posterior é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Reto anterior e bexiga posterior não corresponde à relação topográfica principal avaliada neste modelo.",
      "Sacro anterior e púbis posterior não corresponde à relação topográfica principal avaliada neste modelo.",
      "Ovario medial e uretra posterior não corresponde à relação topográfica principal avaliada neste modelo.",
      "Bexiga superior e tálamo inferior não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-11",
    "topic": "Sistema Digestório Associado",
    "question": "O reto, em relação ao aparelho reprodutor feminino, encontra-se principalmente:",
    "options": [
      "Anterior al útero",
      "Posterior al útero e à vagina",
      "Dentro do colo do útero",
      "Superior à bexiga urinária",
      "Lateral ao púbis"
    ],
    "correctIndex": 1,
    "explanations": [
      "Anterior al útero não corresponde à relação topográfica principal avaliada neste modelo.",
      "Posterior al útero e à vagina é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Dentro do colo do útero não corresponde à relação topográfica principal avaliada neste modelo.",
      "Superior à bexiga urinária não corresponde à relação topográfica principal avaliada neste modelo.",
      "Lateral ao púbis não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-12",
    "topic": "Períneo",
    "question": "O períneo possui importância anatômica porque:",
    "options": [
      "Forma o teto da cavidade torácica",
      "Participa no suporte inferior das vísceras pélvicas",
      "Constitui a principal comissura cerebral",
      "É uma cavidade do útero",
      "Sustituye ao ligamento ancho"
    ],
    "correctIndex": 1,
    "explanations": [
      "Forma o teto da cavidade torácica não corresponde à relação topográfica principal avaliada neste modelo.",
      "Participa no suporte inferior das vísceras pélvicas é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Constitui a principal comissura cerebral não corresponde à relação topográfica principal avaliada neste modelo.",
      "É uma cavidade do útero não corresponde à relação topográfica principal avaliada neste modelo.",
      "Sustituye ao ligamento ancho não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-13",
    "topic": "Órgãos Reprodutores",
    "question": "A tuba uterina relaciona-se principalmente com:",
    "options": [
      "A bexiga urinária e a uretra",
      "O ovario e o útero",
      "O reto e o canal anal",
      "O sacro e o cóccix",
      "O púbis e a sínfise"
    ],
    "correctIndex": 1,
    "explanations": [
      "A bexiga urinária e a uretra não corresponde à relação topográfica principal avaliada neste modelo.",
      "O ovario e o útero é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "O reto e o canal anal não corresponde à relação topográfica principal avaliada neste modelo.",
      "O sacro e o cóccix não corresponde à relação topográfica principal avaliada neste modelo.",
      "O púbis e a sínfise não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-14",
    "topic": "Órgãos Reprodutores",
    "question": "O canal cervical comunica diretamente:",
    "options": [
      "A cavidade uterina com a vagina",
      "A bexiga com a uretra",
      "O reto com o ano",
      "O ovario com o saco de Douglas",
      "O sacro com o púbis"
    ],
    "correctIndex": 0,
    "explanations": [
      "A cavidade uterina com a vagina é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "A bexiga com a uretra não corresponde à relação topográfica principal avaliada neste modelo.",
      "O reto com o ano não corresponde à relação topográfica principal avaliada neste modelo.",
      "O ovario com o saco de Douglas não corresponde à relação topográfica principal avaliada neste modelo.",
      "O sacro com o púbis não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-15",
    "topic": "Anatomia Topográfica",
    "question": "Qual estrutura óssea é uma referência anterior no corte sagital da pelve feminina?",
    "options": [
      "Sacro",
      "Cóccix",
      "Púbis",
      "Vértebra torácica",
      "Escápula"
    ],
    "correctIndex": 2,
    "explanations": [
      "Sacro não corresponde à relação topográfica principal avaliada neste modelo.",
      "Cóccix não corresponde à relação topográfica principal avaliada neste modelo.",
      "Púbis é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Vértebra torácica não corresponde à relação topográfica principal avaliada neste modelo.",
      "Escápula não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-16",
    "topic": "Sistema Urinário Associado",
    "question": "A bexiga urinária localiza-se no compartimento pélvico:",
    "options": [
      "Anterior al útero",
      "Posterior ao reto",
      "Superior ao sacro",
      "Dentro do canal anal",
      "Lateral ao encéfalo"
    ],
    "correctIndex": 0,
    "explanations": [
      "Anterior al útero é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Posterior ao reto não corresponde à relação topográfica principal avaliada neste modelo.",
      "Superior ao sacro não corresponde à relação topográfica principal avaliada neste modelo.",
      "Dentro do canal anal não corresponde à relação topográfica principal avaliada neste modelo.",
      "Lateral ao encéfalo não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-17",
    "topic": "Anatomia Topográfica",
    "question": "O valor acadêmico do corte sagital feminino baseia-se principalmente no fato de permitir:",
    "options": [
      "Ver únicamente ossos do cráneo",
      "Integrar relações entre órganos reproductores, urinarios e digestivos",
      "Evaluar solo músculos do braço",
      "Sustituir a exploração anatômica tridimensional",
      "Mostrar exclusivamente vasos coronarios"
    ],
    "correctIndex": 1,
    "explanations": [
      "Ver únicamente ossos do cráneo não corresponde à relação topográfica principal avaliada neste modelo.",
      "Integrar relações entre órganos reproductores, urinarios e digestivos é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Evaluar solo músculos do braço não corresponde à relação topográfica principal avaliada neste modelo.",
      "Sustituir a exploração anatômica tridimensional não corresponde à relação topográfica principal avaliada neste modelo.",
      "Mostrar exclusivamente vasos coronarios não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-18",
    "topic": "Relações Pélvicas",
    "question": "O fórnice vaginal posterior relaciona-se clinicamente com:",
    "options": [
      "Fundo de saco retouterino",
      "Fundo uterino",
      "Uretra feminina",
      "Sínfise púbica",
      "Canal cervical anterior"
    ],
    "correctIndex": 0,
    "explanations": [
      "Fundo de saco retouterino é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Fundo uterino não corresponde à relação topográfica principal avaliada neste modelo.",
      "Uretra feminina não corresponde à relação topográfica principal avaliada neste modelo.",
      "Sínfise púbica não corresponde à relação topográfica principal avaliada neste modelo.",
      "Canal cervical anterior não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-19",
    "topic": "Aplicação Clínica",
    "question": "O acúmulo de líquido no fundo de saco de Douglas é melhor compreendido ao reconhecer sua relação com:",
    "options": [
      "O espaço posterior al útero e anterior ao reto",
      "A cavidade torácica",
      "O ventrículo cerebral lateral",
      "A face esternocostal do coração",
      "O canal medular cervical"
    ],
    "correctIndex": 0,
    "explanations": [
      "O espaço posterior al útero e anterior ao reto é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "A cavidade torácica não corresponde à relação topográfica principal avaliada neste modelo.",
      "O ventrículo cerebral lateral não corresponde à relação topográfica principal avaliada neste modelo.",
      "A face esternocostal do coração não corresponde à relação topográfica principal avaliada neste modelo.",
      "O canal medular cervical não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  },
  {
    "id": "female-mc-20",
    "topic": "Aplicação Clínica",
    "question": "Qual abordagem melhor integra a anatomia do modelo em ginecologia e obstetrícia?",
    "options": [
      "Memorizar nombres sem relações",
      "Relacionar útero, vagina, bexiga, reto, periné e referências óseas",
      "Analizar solo a piel superficial",
      "Eliminar a orientação sagital",
      "Estudiar únicamente estruturas masculinas"
    ],
    "correctIndex": 1,
    "explanations": [
      "Memorizar nombres sem relações não corresponde à relação topográfica principal avaliada neste modelo.",
      "Relacionar útero, vagina, bexiga, reto, periné e referências óseas é correta porque descreve a relação anatômica esperada no corte sagital da pelve feminina.",
      "Analizar solo a piel superficial não corresponde à relação topográfica principal avaliada neste modelo.",
      "Eliminar a orientação sagital não corresponde à relação topográfica principal avaliada neste modelo.",
      "Estudiar únicamente estruturas masculinas não corresponde à relação topográfica principal avaliada neste modelo."
    ]
  }
];
export const ptFemaleTrueFalseQuestions = [
  {
    "id": "female-tf-01",
    "topic": "Relações Pélvicas",
    "statement": "O útero situa-se entre a bexiga urinária e o reto No corte sagital feminino.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-02",
    "topic": "Sistema Urinário Associado",
    "statement": "A bexiga urinária encontra-se posterior ao reto.",
    "correctAnswer": false,
    "explanation": "A afirmación é falsa porque invierte o desplaza uma relação anatômica fundamental do corte sagital feminino."
  },
  {
    "id": "female-tf-03",
    "topic": "Relações Pélvicas",
    "statement": "O fundo de saco retouterino localiza-se posterior al útero.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-04",
    "topic": "Órgãos Reprodutores",
    "statement": "O colo do útero corresponde à cúpula superior do útero.",
    "correctAnswer": false,
    "explanation": "A afirmación é falsa porque invierte o desplaza uma relação anatômica fundamental do corte sagital feminino."
  },
  {
    "id": "female-tf-05",
    "topic": "Sistema Urinário Associado",
    "statement": "A uretra feminina localiza-se anterior ao canal vaginal.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-06",
    "topic": "Sistema Digestório Associado",
    "statement": "O reto situa-se anterior à bexiga urinária.",
    "correctAnswer": false,
    "explanation": "A afirmación é falsa porque invierte o desplaza uma relação anatômica fundamental do corte sagital feminino."
  },
  {
    "id": "female-tf-07",
    "topic": "Órgãos Reprodutores",
    "statement": "O fundo uterino é a porção superior do útero.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-08",
    "topic": "Órgãos Reprodutores",
    "statement": "O canal cervical comunica a cavidade uterina com a vagina.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-09",
    "topic": "Períneo",
    "statement": "O periné no participa no suporte anatômico do assoalho pélvico.",
    "correctAnswer": false,
    "explanation": "A afirmación é falsa porque invierte o desplaza uma relação anatômica fundamental do corte sagital feminino."
  },
  {
    "id": "female-tf-10",
    "topic": "Anatomia Topográfica",
    "statement": "O sacro constitui uma referência óseja posterior da pelve.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-11",
    "topic": "Órgãos Reprodutores",
    "statement": "A tuba uterina relaciona-se com o útero e o ovario.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-12",
    "topic": "Órgãos Reprodutores",
    "statement": "O ovario localiza-se dentro da cavidade uterina.",
    "correctAnswer": false,
    "explanation": "A afirmación é falsa porque invierte o desplaza uma relação anatômica fundamental do corte sagital feminino."
  },
  {
    "id": "female-tf-13",
    "topic": "Relações Pélvicas",
    "statement": "O fundo de saco vesicouterino localiza-se entre bexiga e útero.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-14",
    "topic": "Relações Pélvicas",
    "statement": "A vagina relaciona-se com uretra anteriormente e reto posteriormente.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-15",
    "topic": "Anatomia Topográfica",
    "statement": "O púbis é uma referência posterior da pelve feminina.",
    "correctAnswer": false,
    "explanation": "A afirmación é falsa porque invierte o desplaza uma relação anatômica fundamental do corte sagital feminino."
  },
  {
    "id": "female-tf-16",
    "topic": "Aplicação Clínica",
    "statement": "O fundo de saco de Douglas tem relevância clínica por acumulación de líquido pélvico.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-17",
    "topic": "Relações Pélvicas",
    "statement": "A anteflexión describe uma relação angular entre corpo e colo do útero.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-18",
    "topic": "Sistema Digestório Associado",
    "statement": "O canal anal localiza-se superior à cavidade uterina.",
    "correctAnswer": false,
    "explanation": "A afirmación é falsa porque invierte o desplaza uma relação anatômica fundamental do corte sagital feminino."
  },
  {
    "id": "female-tf-19",
    "topic": "Aplicação Clínica",
    "statement": "O corte sagital ayuda a correlacionar anatomía pélvica com imagen ginecológica.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  },
  {
    "id": "female-tf-20",
    "topic": "Órgãos Reprodutores",
    "statement": "O colo do útero forma parte do útero.",
    "correctAnswer": true,
    "explanation": "A afirmación é verdadera según a disposición topográfica clássica da pelve feminina."
  }
];
export const ptFemaleMatchingExercises = [
  {
    "id": "female-match-01",
    "topic": "Relações Pélvicas",
    "prompt": "Associe cada estrutura com seu posição topográfica principal.",
    "left": [
      "Útero",
      "Bexiga urinária",
      "Reto",
      "Púbis",
      "Sacro"
    ],
    "right": [
      "Órgano central entre bexiga e reto",
      "Relação anterior al útero",
      "Relação posterior al útero e vagina",
      "Referência óseja anterior",
      "Referência óseja posterior"
    ],
    "correct": [
      0,
      1,
      2,
      3,
      4
    ],
    "explanation": "A lectura sagital organiza a pelve em relações anterior, média e posterior.",
    "options": [
      {
        "id": "female-match-01-opt-0",
        "text": "Órgano central entre bexiga e reto"
      },
      {
        "id": "female-match-01-opt-1",
        "text": "Relação anterior al útero"
      },
      {
        "id": "female-match-01-opt-2",
        "text": "Relação posterior al útero e vagina"
      },
      {
        "id": "female-match-01-opt-3",
        "text": "Referência óseja anterior"
      },
      {
        "id": "female-match-01-opt-4",
        "text": "Referência óseja posterior"
      }
    ],
    "pairs": [
      {
        "id": "female-match-01-pair-0",
        "prompt": "Útero",
        "correctOptionId": "female-match-01-opt-0"
      },
      {
        "id": "female-match-01-pair-1",
        "prompt": "Bexiga urinária",
        "correctOptionId": "female-match-01-opt-1"
      },
      {
        "id": "female-match-01-pair-2",
        "prompt": "Reto",
        "correctOptionId": "female-match-01-opt-2"
      },
      {
        "id": "female-match-01-pair-3",
        "prompt": "Púbis",
        "correctOptionId": "female-match-01-opt-3"
      },
      {
        "id": "female-match-01-pair-4",
        "prompt": "Sacro",
        "correctOptionId": "female-match-01-opt-4"
      }
    ],
    "title": ""
  },
  {
    "id": "female-match-02",
    "topic": "Órgãos Reprodutores",
    "prompt": "Associe as partes uterinas com seu descripción.",
    "left": [
      "Fundo uterino",
      "Corpo uterino",
      "Colo do útero",
      "Cavidade uterina",
      "Canal cervical"
    ],
    "right": [
      "Porção superior redondeada",
      "Porção principal entre fundo e colo",
      "Segmento inferior projetado para a vagina",
      "Lúmen interno do útero",
      "Comunicação entre cavidade uterina e vagina"
    ],
    "correct": [
      0,
      1,
      2,
      3,
      4
    ],
    "explanation": "As porções uterinas permiten orientar o eje reproductor no modelo.",
    "options": [
      {
        "id": "female-match-02-opt-0",
        "text": "Porção superior redondeada"
      },
      {
        "id": "female-match-02-opt-1",
        "text": "Porção principal entre fundo e colo"
      },
      {
        "id": "female-match-02-opt-2",
        "text": "Segmento inferior projetado para a vagina"
      },
      {
        "id": "female-match-02-opt-3",
        "text": "Lúmen interno do útero"
      },
      {
        "id": "female-match-02-opt-4",
        "text": "Comunicação entre cavidade uterina e vagina"
      }
    ],
    "pairs": [
      {
        "id": "female-match-02-pair-0",
        "prompt": "Fundo uterino",
        "correctOptionId": "female-match-02-opt-0"
      },
      {
        "id": "female-match-02-pair-1",
        "prompt": "Corpo uterino",
        "correctOptionId": "female-match-02-opt-1"
      },
      {
        "id": "female-match-02-pair-2",
        "prompt": "Colo do útero",
        "correctOptionId": "female-match-02-opt-2"
      },
      {
        "id": "female-match-02-pair-3",
        "prompt": "Cavidade uterina",
        "correctOptionId": "female-match-02-opt-3"
      },
      {
        "id": "female-match-02-pair-4",
        "prompt": "Canal cervical",
        "correctOptionId": "female-match-02-opt-4"
      }
    ],
    "title": ""
  },
  {
    "id": "female-match-03",
    "topic": "Relações Pélvicas",
    "prompt": "Associe os recessos e referências peritoneais.",
    "left": [
      "Fundo de saco vesicouterino",
      "Fundo de saco retouterino",
      "Fórnix vaginal posterior",
      "Peritônio pélvico",
      "Douglas"
    ],
    "right": [
      "Entre bexiga e útero",
      "Entre útero/vagina posterior e reto",
      "Relação próxima ao recesso retouterino",
      "Forma recessos sobre vísceras pélvicas",
      "Nome clínico do fundo de saco retouterino"
    ],
    "correct": [
      0,
      1,
      2,
      3,
      4
    ],
    "explanation": "Os recessos peritoneais são claves para comprender anatomía clínica pélvica.",
    "options": [
      {
        "id": "female-match-03-opt-0",
        "text": "Entre bexiga e útero"
      },
      {
        "id": "female-match-03-opt-1",
        "text": "Entre útero/vagina posterior e reto"
      },
      {
        "id": "female-match-03-opt-2",
        "text": "Relação próxima ao recesso retouterino"
      },
      {
        "id": "female-match-03-opt-3",
        "text": "Forma recessos sobre vísceras pélvicas"
      },
      {
        "id": "female-match-03-opt-4",
        "text": "Nome clínico do fundo de saco retouterino"
      }
    ],
    "pairs": [
      {
        "id": "female-match-03-pair-0",
        "prompt": "Fundo de saco vesicouterino",
        "correctOptionId": "female-match-03-opt-0"
      },
      {
        "id": "female-match-03-pair-1",
        "prompt": "Fundo de saco retouterino",
        "correctOptionId": "female-match-03-opt-1"
      },
      {
        "id": "female-match-03-pair-2",
        "prompt": "Fórnix vaginal posterior",
        "correctOptionId": "female-match-03-opt-2"
      },
      {
        "id": "female-match-03-pair-3",
        "prompt": "Peritônio pélvico",
        "correctOptionId": "female-match-03-opt-3"
      },
      {
        "id": "female-match-03-pair-4",
        "prompt": "Douglas",
        "correctOptionId": "female-match-03-opt-4"
      }
    ],
    "title": ""
  },
  {
    "id": "female-match-04",
    "topic": "Conductos anatômicos",
    "prompt": "Associe cada conducto com seu função o continuidad.",
    "left": [
      "Vagina",
      "Uretra feminina",
      "Canal anal",
      "Tuba uterina",
      "Canal cervical"
    ],
    "right": [
      "Canal reproductor inferior",
      "Conduce orina desde a bexiga",
      "Segmento terminal digestivo",
      "Relaciona útero com ovario",
      "Une cavidade uterina com vagina"
    ],
    "correct": [
      0,
      1,
      2,
      3,
      4
    ],
    "explanation": "Distinguir conductos evita confundir sistemas reproductor, urinario e digestivo.",
    "options": [
      {
        "id": "female-match-04-opt-0",
        "text": "Canal reproductor inferior"
      },
      {
        "id": "female-match-04-opt-1",
        "text": "Conduce orina desde a bexiga"
      },
      {
        "id": "female-match-04-opt-2",
        "text": "Segmento terminal digestivo"
      },
      {
        "id": "female-match-04-opt-3",
        "text": "Relaciona útero com ovario"
      },
      {
        "id": "female-match-04-opt-4",
        "text": "Une cavidade uterina com vagina"
      }
    ],
    "pairs": [
      {
        "id": "female-match-04-pair-0",
        "prompt": "Vagina",
        "correctOptionId": "female-match-04-opt-0"
      },
      {
        "id": "female-match-04-pair-1",
        "prompt": "Uretra feminina",
        "correctOptionId": "female-match-04-opt-1"
      },
      {
        "id": "female-match-04-pair-2",
        "prompt": "Canal anal",
        "correctOptionId": "female-match-04-opt-2"
      },
      {
        "id": "female-match-04-pair-3",
        "prompt": "Tuba uterina",
        "correctOptionId": "female-match-04-opt-3"
      },
      {
        "id": "female-match-04-pair-4",
        "prompt": "Canal cervical",
        "correctOptionId": "female-match-04-opt-4"
      }
    ],
    "title": ""
  },
  {
    "id": "female-match-05",
    "topic": "Aplicação Clínica",
    "prompt": "Associe cada concepto com seu relevância clínica.",
    "left": [
      "Fundo de saco de Douglas",
      "Colo do útero",
      "Bexiga distendida",
      "Corpo perineal",
      "Sacro"
    ],
    "right": [
      "Pode acumular líquido pélvico",
      "Accesible em exploração ginecológica",
      "Modifica relaçõé anteriores",
      "Suporte do assoalho pélvico",
      "Referência do eixo pélvico posterior"
    ],
    "correct": [
      0,
      1,
      2,
      3,
      4
    ],
    "explanation": "A anatomía topográfica fundamenta a exploração, imagen e razonamiento gineco-obstétrico.",
    "options": [
      {
        "id": "female-match-05-opt-0",
        "text": "Pode acumular líquido pélvico"
      },
      {
        "id": "female-match-05-opt-1",
        "text": "Accesible em exploração ginecológica"
      },
      {
        "id": "female-match-05-opt-2",
        "text": "Modifica relaçõé anteriores"
      },
      {
        "id": "female-match-05-opt-3",
        "text": "Suporte do assoalho pélvico"
      },
      {
        "id": "female-match-05-opt-4",
        "text": "Referência do eixo pélvico posterior"
      }
    ],
    "pairs": [
      {
        "id": "female-match-05-pair-0",
        "prompt": "Fundo de saco de Douglas",
        "correctOptionId": "female-match-05-opt-0"
      },
      {
        "id": "female-match-05-pair-1",
        "prompt": "Colo do útero",
        "correctOptionId": "female-match-05-opt-1"
      },
      {
        "id": "female-match-05-pair-2",
        "prompt": "Bexiga distendida",
        "correctOptionId": "female-match-05-opt-2"
      },
      {
        "id": "female-match-05-pair-3",
        "prompt": "Corpo perineal",
        "correctOptionId": "female-match-05-opt-3"
      },
      {
        "id": "female-match-05-pair-4",
        "prompt": "Sacro",
        "correctOptionId": "female-match-05-opt-4"
      }
    ],
    "title": ""
  }
];
export const ptFemaleShortQuestions = [
  {
    "id": "female-short-01",
    "topic": "Anatomia Topográfica",
    "question": "Explique a importância do corte sagital para estudiar a pelve feminina.",
    "expectedAnswer": "O corte sagital permite visualizar simultáneamente útero, vagina, bexiga, uretra, reto, canal anal, púbis, sacro e periné, integrando relações espaciales difíciles de comprender em vistas planas aisladas."
  },
  {
    "id": "female-short-02",
    "topic": "Relações Pélvicas",
    "question": "Describa a relação topográfica entre útero, bexiga urinária e reto.",
    "expectedAnswer": "A bexiga situa-se anterior al útero, o útero ocupa uma posição média e o reto se dispone posterior ao aparato reproductor, relação clave para imagen, exploração e cirugía."
  },
  {
    "id": "female-short-03",
    "topic": "Órgãos Reprodutores",
    "question": "Enumere e describa as porções principales do útero visibles no modelo.",
    "expectedAnswer": "Se reconocen fundo uterino superior, corpo uterino como porção principal, colo do útero o colo do útero como segmento inferior, cavidade uterina e canal cervical."
  },
  {
    "id": "female-short-04",
    "topic": "Órgãos Reprodutores",
    "question": "Explique a função topográfica do colo do útero e do canal cervical.",
    "expectedAnswer": "O colo do útero constitui a transición inferior do útero para a vagina; o canal cervical comunica cavidade uterina e canal vaginal."
  },
  {
    "id": "female-short-05",
    "topic": "Relações Pélvicas",
    "question": "Describa a posição da vagina em relação com uretra e reto.",
    "expectedAnswer": "A vagina situa-se posterior a uretra e bexiga, e anterior ao reto, formando um eje inferior reproductor que se continúa com o colo do útero."
  },
  {
    "id": "female-short-06",
    "topic": "Sistema Urinário Associado",
    "question": "Explique a relação anatômica de bexiga e uretra feminina No corte sagital.",
    "expectedAnswer": "A bexiga ocupa o compartimento anterior; a uretra é corta e desciende anterior ao canal vaginal até o vestíbulo."
  },
  {
    "id": "female-short-07",
    "topic": "Sistema Digestório Associado",
    "question": "Describa a posição do reto e canal anal.",
    "expectedAnswer": "O reto situa-se posterior a útero e vagina, continuándose inferiormente com o canal anal em relação com o periné posterior."
  },
  {
    "id": "female-short-08",
    "topic": "Relações Pélvicas",
    "question": "Explique a importância do fundo de saco retouterino.",
    "expectedAnswer": "O fundo de saco retouterino o de Douglas é o recesso peritoneal mais declive em bipedestación e relaciona-se com acumulación de líquido pélvico."
  },
  {
    "id": "female-short-09",
    "topic": "Relações Pélvicas",
    "question": "Diferencie fundo de saco vesicouterino e rectouterino.",
    "expectedAnswer": "O vesicouterino localiza-se entre bexiga e útero; o rectouterino localiza-se entre útero/vagina posterior e reto."
  },
  {
    "id": "female-short-10",
    "topic": "Períneo",
    "question": "Describa o valor anatômico do periné Na pelve feminina.",
    "expectedAnswer": "O periné constitui a región inferior de cierre e Suporte do assoalho pélvico, relevante para continencia, parto e sostén visceral."
  },
  {
    "id": "female-short-11",
    "topic": "Anatomia Topográfica",
    "question": "Explique a utilidad de púbis, sacro e cóccix como referências.",
    "expectedAnswer": "O púbis delimita a referência anterior, enquanto sacro e cóccix orientan o limite posterior e inferior, ayudando a leer o eixo pélvico."
  },
  {
    "id": "female-short-12",
    "topic": "Órgãos Reprodutores",
    "question": "Integre ovario e tuba uterina dentro do estudio sagital.",
    "expectedAnswer": "Aunque podem verse lateralizados, ovario e tuba uterina completan o eje reproductor e se relacionan com o útero na región anexial."
  },
  {
    "id": "female-short-13",
    "topic": "Relações Pélvicas",
    "question": "Defina anteversión e anteflexión uterina em términos topográficos.",
    "expectedAnswer": "Anteversión describe a inclinación do eje uterino respecto à vagina; anteflexión, o ángulo entre corpo e colo do útero para anterior."
  },
  {
    "id": "female-short-14",
    "topic": "Anatomia Topográfica",
    "question": "Organice a pelve feminina em compartimentos funcionales.",
    "expectedAnswer": "Pode analizarse em compartimento anterior urinario, médio reproductor e posterior digestivo, todos visibles No corte sagital."
  },
  {
    "id": "female-short-15",
    "topic": "Aplicação Clínica",
    "question": "Explique uma aplicación ginecológica do modelo.",
    "expectedAnswer": "O modelo ayuda a comprender exploração cervical, relações uterinas, fundo de saco de Douglas e correlación com ecografía o resonancia pélvica."
  },
  {
    "id": "female-short-16",
    "topic": "Aplicação Clínica",
    "question": "Explique a relevância obstétrica da anatomía sagital pélvica.",
    "expectedAnswer": "O conocimiento de vagina, colo do útero, útero, periné e eje óseo pélvico orienta o razonamiento do canal do parto e suporte perineal."
  },
  {
    "id": "female-short-17",
    "topic": "Aplicação Clínica",
    "question": "Associe o corte sagital com a interpretación de imagen.",
    "expectedAnswer": "Permite comparar órganos pélvicos por planos e reconocer desplazamientos, distensión vesical, masas uterinas o colecciones pélvicas."
  },
  {
    "id": "female-short-18",
    "topic": "Órgãos Reprodutores",
    "question": "Describa a continuidad cavidade uterina-canal cervical-vagina.",
    "expectedAnswer": "A cavidade uterina se estrecha inferiormente para o canal cervical, que atraviesa o colo do útero e se abre ao canal vaginal."
  },
  {
    "id": "female-short-19",
    "topic": "Relações Pélvicas",
    "question": "Explique por qué os recessos peritoneais são relevantes em anatomía aplicada.",
    "expectedAnswer": "Os recessos são espaços potenciales donde pode acumularse líquido o extenderse patología, e orientan procedimientos diagnósticos."
  },
  {
    "id": "female-short-20",
    "topic": "Aplicação Clínica",
    "question": "Integre os sistemas reproductor, urinario e digestivo em uma explicación topográfica.",
    "expectedAnswer": "O modelo mostra uma relação tridimensional: bexiga e uretra anteriores, útero e vagina centrais, reto e canal anal posteriores, com suporte inferior perineal e referências óseas."
  }
];
export const ptFemaleFillQuestions = [
  {
    "id": "female-fill-01",
    "topic": "Relações Pélvicas",
    "prompt": "O útero situa-se entre bexiga urinária e ____.",
    "answer": "Reto",
    "acceptedAnswers": [
      "Reto"
    ]
  },
  {
    "id": "female-fill-02",
    "topic": "Órgãos Reprodutores",
    "prompt": "O fundo ____ corresponde à porção superior do útero.",
    "answer": "Uterino",
    "acceptedAnswers": [
      "Uterino"
    ]
  },
  {
    "id": "female-fill-03",
    "topic": "Órgãos Reprodutores",
    "prompt": "O colo do útero também se denomina ____.",
    "answer": "Colo do útero",
    "acceptedAnswers": [
      "Colo do útero",
      "Cervix"
    ]
  },
  {
    "id": "female-fill-04",
    "topic": "Órgãos Reprodutores",
    "prompt": "O canal cervical comunica cavidade uterina com ____.",
    "answer": "Vagina",
    "acceptedAnswers": [
      "Vagina"
    ]
  },
  {
    "id": "female-fill-05",
    "topic": "Sistema Urinário Associado",
    "prompt": "A bexiga urinária localiza-se ____ al útero.",
    "answer": "Anterior",
    "acceptedAnswers": [
      "Anterior"
    ]
  },
  {
    "id": "female-fill-06",
    "topic": "Relações Pélvicas",
    "prompt": "O fundo de saco retouterino se conoce como fundo de saco de ____.",
    "answer": "Douglas",
    "acceptedAnswers": [
      "Douglas"
    ]
  },
  {
    "id": "female-fill-07",
    "topic": "Sistema Urinário Associado",
    "prompt": "A uretra feminina localiza-se anterior ao canal ____.",
    "answer": "Vaginal",
    "acceptedAnswers": [
      "Vaginal"
    ]
  },
  {
    "id": "female-fill-08",
    "topic": "Anatomia Topográfica",
    "prompt": "O sacro constitui uma referência óseja ____ da pelve.",
    "answer": "Posterior",
    "acceptedAnswers": [
      "Posterior"
    ]
  },
  {
    "id": "female-fill-09",
    "topic": "Órgãos Reprodutores",
    "prompt": "A tuba uterina relaciona-se lateralmente com o ____.",
    "answer": "Ovario",
    "acceptedAnswers": [
      "Ovario"
    ]
  },
  {
    "id": "female-fill-10",
    "topic": "Períneo",
    "prompt": "O periné participa no suporte do assoalho ____.",
    "answer": "Pélvico",
    "acceptedAnswers": [
      "Pélvico",
      "Pelvico"
    ]
  }
];

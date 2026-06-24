export const atlasEducationalRegistry = {
  'left_ventricle': { /* ... existing ... */ },
  'Corpo Caloso': {
    structureId: 'Corpo Caloso',
    structureName: 'Corpo Caloso',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'A maior comissura do cérebro, formada por substância branca, conectando os hemisférios cerebrais esquerdo e direito.',
    clinicalImportance: 'Agenesia do corpo caloso pode causar déficits de coordenação e problemas de aprendizagem. Lesões podem resultar em síndrome de desconexão inter-hemisférica.',
    learningObjectives: [
      'Identificar as partes: rostro, joelho, corpo e esplênio',
      'Compreender sua função na comunicação inter-hemisférica'
    ],
    commonMistakes: [
      'Confundir o fórnix com o corpo caloso no corte sagital medial'
    ],
    relatedStructures: ['Giro do Cíngulo', 'Septo Pelúcido', 'Fórnix'],
    academicFocus: 'Substância branca e vias comissurais'
  },
  'Septo Pelúcido': {
    structureId: 'Septo Pelúcido',
    structureName: 'Septo Pelúcido',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Básico',
    shortExplanation: 'Fina membrana vertical de tecido nervoso que separa os ventrículos laterais no cérebro.',
    clinicalImportance: 'A ausência do septo pelúcido pode estar associada a displasia septo-óptica, uma síndrome congênita rara.',
    learningObjectives: [
      'Localizar o septo pelúcido entre o corpo caloso e o fórnix',
      'Reconhecer seu papel como parede medial dos ventrículos laterais'
    ],
    commonMistakes: [
      'Achar que é uma estrutura sólida e não uma fina lâmina membranosa'
    ],
    relatedStructures: ['Corpo Caloso', 'Fórnix', 'Ventrículos Laterais'],
    academicFocus: 'Anatomia ventricular'
  },
  'Fórnix': {
    structureId: 'Fórnix',
    structureName: 'Fórnix',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Avançado',
    shortExplanation: 'Feixe de fibras nervosas em forma de C que atua como a principal via de saída do hipocampo, essencial para a memória.',
    clinicalImportance: 'Lesões bilaterais no fórnix podem levar a amnésia anterógrada severa, afetando a capacidade de formar novas memórias declarativas.',
    learningObjectives: [
      'Identificar as colunas, corpo e pilares do fórnix',
      'Compreender seu papel no sistema límbico e circuito de Papez'
    ],
    commonMistakes: [
      'Não associar o fórnix diretamente ao hipocampo inferiormente'
    ],
    relatedStructures: ['Corpo Mamilares', 'Hipocampo', 'Septo Pelúcido'],
    academicFocus: 'Sistema Límbico'
  },
  'Tálamo': {
    structureId: 'Tálamo',
    structureName: 'Tálamo',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Avançado',
    shortExplanation: 'Grande massa ovóide de substância cinzenta que funciona como a principal estação retransmissora de informações sensoriais e motoras para o córtex cerebral.',
    clinicalImportance: 'Infartos talâmicos podem causar a Síndrome Talâmica de Dejerine-Roussy, caracterizada por dor crônica e perda sensorial.',
    learningObjectives: [
      'Compreender a função de filtro sensitivo',
      'Identificar a aderência intertalâmica (quando presente)'
    ],
    commonMistakes: [
      'Esquecer que o olfato é o único sentido que não passa primeiramente pelo tálamo'
    ],
    relatedStructures: ['Hipotálamo', 'Terceiro Ventrículo', 'Cápsula Interna'],
    academicFocus: 'Vias aferentes e eferentes'
  },
  'Hipotálamo': {
    structureId: 'Hipotálamo',
    structureName: 'Hipotálamo',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Avançado',
    shortExplanation: 'Região do diencéfalo responsável por regular o sistema nervoso autônomo, endócrino e funções vitais como fome, sede e temperatura.',
    clinicalImportance: 'Lesões hipotalâmicas podem causar distúrbios endócrinos graves, diabetes insipidus, e alterações drásticas de peso e regulação térmica.',
    learningObjectives: [
      'Identificar sua localização anteroinferior em relação ao tálamo',
      'Compreender sua conexão com a glândula pituitária (hipófise)'
    ],
    commonMistakes: [
      'Confundir anatomicamente com o tálamo ou subtálamo'
    ],
    relatedStructures: ['Hipófise', 'Quiasma Óptico', 'Tálamo'],
    academicFocus: 'Neuroendocrinologia'
  },
  'Hipófise': {
    structureId: 'Hipófise',
    structureName: 'Hipófise',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'Glândula mestre do sistema endócrino, localizada na sela túrcica do osso esfenoide, conectada ao hipotálamo.',
    clinicalImportance: 'Adenomas hipofisários podem comprimir o quiasma óptico, resultando em hemianopsia bitemporal (perda da visão periférica).',
    learningObjectives: [
      'Diferenciar adenohipófise (anterior) e neurohipófise (posterior)',
      'Identificar a haste hipofisária (infundíbulo)'
    ],
    commonMistakes: [
      'Desconhecer que a neurohipófise não sintetiza hormônios, apenas armazena os do hipotálamo'
    ],
    relatedStructures: ['Hipotálamo', 'Quiasma Óptico', 'Osso Esfenoide'],
    academicFocus: 'Anatomia endócrina'
  },
  'Quiasma Óptico': {
    structureId: 'Quiasma Óptico',
    structureName: 'Quiasma Óptico',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'Estrutura em forma de X onde as fibras dos nervos ópticos cruzam parcialmente, permitindo a visão binocular.',
    clinicalImportance: 'Sua proximidade com a glândula pituitária o torna vulnerável a compressão por tumores hipofisários.',
    learningObjectives: [
      'Compreender o decussamento das fibras nasais da retina',
      'Localizar sua posição imediatamente anterior ao infundíbulo'
    ],
    commonMistakes: [
      'Assumir que todas as fibras ópticas cruzam no quiasma (apenas as nasais o fazem)'
    ],
    relatedStructures: ['Nervo Óptico', 'Trato Óptico', 'Hipófise'],
    academicFocus: 'Vias Ópticas'
  },
  'Pineal': {
    structureId: 'Pineal',
    structureName: 'Glândula Pineal',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Básico',
    shortExplanation: 'Pequena glândula endócrina no epitálamo que produz melatonina, regulando os ritmos circadianos.',
    clinicalImportance: 'Pode calcificar com a idade, tornando-se um marco útil em radiografias de crânio e tomografias para avaliar desvio da linha média.',
    learningObjectives: [
      'Identificar sua localização posterior ao terceiro ventrículo',
      'Relacionar com os colículos superiores do mesencéfalo'
    ],
    commonMistakes: [
      'Confundir com o hipotálamo em termos de função regulatória do sono'
    ],
    relatedStructures: ['Epitálamo', 'Mesencéfalo', 'Terceiro Ventrículo'],
    academicFocus: 'Ciclo circadiano e neuroimagem'
  },
  'Mesencéfalo': {
    structureId: 'Mesencéfalo',
    structureName: 'Mesencéfalo',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Avançado',
    shortExplanation: 'Porção superior do tronco encefálico, envolvida em reflexos visuais, auditivos e controle motor.',
    clinicalImportance: 'A substância negra do mesencéfalo sofre degeneração na Doença de Parkinson, afetando a regulação do movimento motor.',
    learningObjectives: [
      'Identificar os colículos (teto) e pedúnculos cerebrais',
      'Localizar o aqueduto cerebral cruzando o mesencéfalo'
    ],
    commonMistakes: [
      'Não identificar os limites entre mesencéfalo e ponte visualmente no corte sagital'
    ],
    relatedStructures: ['Ponte', 'Aqueduto Cerebral', 'Pineal'],
    academicFocus: 'Tronco encefálico e vias motoras'
  },
  'Ponte': {
    structureId: 'Ponte',
    structureName: 'Ponte',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'Estrutura bulbosa do tronco encefálico situada entre o mesencéfalo e o bulbo, rica em tratos fibrosos cruzados que conectam o cérebro ao cerebelo.',
    clinicalImportance: 'A síndrome da ponte (locked-in syndrome) causada por infarto pontino ventral resulta em paralisia total dos músculos voluntários, exceto do movimento ocular.',
    learningObjectives: [
      'Identificar a protuberância pontina anterior',
      'Relacionar a face posterior da ponte com o quarto ventrículo'
    ],
    commonMistakes: [
      'Errar a localização dos nervos cranianos V a VIII que emergem desta região'
    ],
    relatedStructures: ['Cerebelo', 'Bulbo', 'Mesencéfalo', 'Quarto Ventrículo'],
    academicFocus: 'Tronco encefálico'
  },
  'Bulbo': {
    structureId: 'Bulbo',
    structureName: 'Bulbo Raquidiano',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Avançado',
    shortExplanation: 'A parte mais inferior do tronco encefálico, conecta o cérebro à medula espinhal e controla centros vitais autonômicos (respiração, frequência cardíaca).',
    clinicalImportance: 'Traumas ou compressão bulbar (ex: herniação tonsilar) podem causar parada cardiorrespiratória letal aguda.',
    learningObjectives: [
      'Identificar a transição cervicomedular e as pirâmides',
      'Compreender o papel do bulbo no controle visceral e autonômico'
    ],
    commonMistakes: [
      'Não distinguir visualmente a decussação das pirâmides'
    ],
    relatedStructures: ['Ponte', 'Medula Espinhal', 'Cerebelo'],
    academicFocus: 'Centros vitais e reflexos'
  },
  'Cerebelo': {
    structureId: 'Cerebelo',
    structureName: 'Cerebelo',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Avançado',
    shortExplanation: 'Grande estrutura situada na fossa craniana posterior, fundamental para a coordenação motora, equilíbrio e tônus muscular.',
    clinicalImportance: 'Lesões cerebelares manifestam-se no mesmo lado do corpo (ipsilateral), causando ataxia, dismetria e marcha ébria.',
    learningObjectives: [
      'Diferenciar o verme cerebelar dos hemisférios laterais',
      'Visualizar a estrutura da árvore da vida (arbor vitae)'
    ],
    commonMistakes: [
      'Esquecer que o cerebelo possui mais neurônios que o resto do cérebro inteiro'
    ],
    relatedStructures: ['Ponte', 'Bulbo', 'Quarto Ventrículo'],
    academicFocus: 'Coordenação e controle motor fino'
  },
  'Quarto Ventrículo': {
    structureId: 'Quarto Ventrículo',
    structureName: 'Quarto Ventrículo',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'Cavidade em forma de tenda preenchida com líquido cefalorraquidiano (LCR), localizada entre o tronco encefálico e o cerebelo.',
    clinicalImportance: 'Tumores no quarto ventrículo (ex: ependimomas) podem obstruir o fluxo de LCR, resultando em hidrocefalia não comunicante.',
    learningObjectives: [
      'Identificar seu teto (cerebelo) e assoalho (ponte e bulbo)',
      'Traçar a passagem de LCR a partir do aqueduto de Sylvius'
    ],
    commonMistakes: [
      'Achar que ele se comunica diretamente com os ventrículos laterais sem passar pelo terceiro'
    ],
    relatedStructures: ['Ponte', 'Bulbo', 'Cerebelo', 'Aqueduto Cerebral'],
    academicFocus: 'Sistema Ventricular'
  },
  'Terceiro Ventrículo': {
    structureId: 'Terceiro Ventrículo',
    structureName: 'Terceiro Ventrículo',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'Uma fenda sagital preenchida por líquido cefalorraquidiano (LCR) no centro do diencéfalo, entre os dois tálamos.',
    clinicalImportance: 'A dilatação do terceiro ventrículo ocorre na hidrocefalia, exercendo pressão contra as estruturas talâmicas e hipotalâmicas circundantes.',
    learningObjectives: [
      'Reconhecer sua parede medial formada pelo tálamo e hipotálamo',
      'Localizar os forames de Monro (interventriculares)'
    ],
    commonMistakes: [
      'Confundir o recesso pineal ou quiasmático com o principal corpo ventricular'
    ],
    relatedStructures: ['Tálamo', 'Hipotálamo', 'Aqueduto Cerebral'],
    academicFocus: 'Sistema Ventricular'
  },
  'Aqueduto Cerebral': {
    structureId: 'Aqueduto Cerebral',
    structureName: 'Aqueduto Cerebral (de Sylvius)',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'Canal estreito que atravessa o mesencéfalo e conecta o terceiro ao quarto ventrículo.',
    clinicalImportance: 'Ponto mais estreito do sistema ventricular. Estenose aquedutal é uma causa comum de hidrocefalia obstrutiva congênita.',
    learningObjectives: [
      'Visualizar o aqueduto atravessando o tegmento e o teto do mesencéfalo',
      'Entender o fluxo caudal do LCR'
    ],
    commonMistakes: [
      'Pensar que a obstrução causa expansão no quarto ventrículo (ela expande o 3º e os laterais)'
    ],
    relatedStructures: ['Mesencéfalo', 'Terceiro Ventrículo', 'Quarto Ventrículo'],
    academicFocus: 'Vias de drenagem liquórica'
  },
  'Giro do Cíngulo': {
    structureId: 'Giro do Cíngulo',
    structureName: 'Giro do Cíngulo',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Avançado',
    shortExplanation: 'Um componente curvo proeminente do córtex cerebral límbico localizado imediatamente acima do corpo caloso.',
    clinicalImportance: 'Desempenha papel vital no processamento emocional, aprendizado e regulação da dor. A cingulotomia já foi usada para tratar dor refratária crônica e TOC grave.',
    learningObjectives: [
      'Identificar o giro acima do sulco do corpo caloso',
      'Reconhecer seu papel executivo emocional na circuitaria límbica'
    ],
    commonMistakes: [
      'Ignorar sua extensão contínua para o giro para-hipocampal'
    ],
    relatedStructures: ['Corpo Caloso', 'Lobo Frontal'],
    academicFocus: 'Sistema Límbico Córtex'
  },
  'Lobo Frontal': {
    structureId: 'Lobo Frontal',
    structureName: 'Lobo Frontal',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'O maior dos lobos cerebrais, responsável por funções cognitivas superiores, planejamento, personalidade e controle motor voluntário.',
    clinicalImportance: 'Lesões (ex: acidente vascular cerebral ou Phineas Gage) podem causar profunda mudança de personalidade, perda de inibições ou afasia motora (Broca).',
    learningObjectives: [
      'Localizar sua extensão anterior ao sulco central',
      'Diferenciar área motora primária, área de Broca e córtex pré-frontal'
    ],
    commonMistakes: [
      'Esquecer seu papel crucial no controle do movimento ocular sacádico'
    ],
    relatedStructures: ['Lobo Parietal', 'Corpo Caloso', 'Giro do Cíngulo'],
    academicFocus: 'Funções executivas'
  },
  'Lobo Parietal': {
    structureId: 'Lobo Parietal',
    structureName: 'Lobo Parietal',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'Região cortical principal para a integração e processamento de estímulos somatossensoriais, propriocepção e navegação espacial.',
    clinicalImportance: 'Lesões no lobo parietal direito podem resultar em "heminegligência", onde o paciente ignora o lado esquerdo de seu corpo e do mundo.',
    learningObjectives: [
      'Localizar o córtex somatossensorial primário no giro pós-central',
      'Delimitar seus limites a partir do sulco central e parieto-occipital'
    ],
    commonMistakes: [
      'Confundir sua fronteira anatômica com o lobo temporal inferiormente'
    ],
    relatedStructures: ['Lobo Frontal', 'Lobo Occipital', 'Lobo Temporal'],
    academicFocus: 'Homúnculo sensorial'
  },
  'Lobo Occipital': {
    structureId: 'Lobo Occipital',
    structureName: 'Lobo Occipital',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Básico',
    shortExplanation: 'Lobo mais posterior do cérebro, dedicado primariamente ao processamento e interpretação da visão.',
    clinicalImportance: 'Um infarto na artéria cerebral posterior afeta o lobo occipital, causando hemianopsia homônima contralateral com poupança macular.',
    learningObjectives: [
      'Identificar o sulco calcarino na visão sagital',
      'Localizar o córtex visual primário adjacente ao sulco'
    ],
    commonMistakes: [
      'Associar cegueira cortical a um déficit periférico do olho'
    ],
    relatedStructures: ['Lobo Parietal', 'Cerebelo'],
    academicFocus: 'Processamento Visual'
  },
  'Lobo Temporal': {
    structureId: 'Lobo Temporal',
    structureName: 'Lobo Temporal',
    discipline: 'Neuroanatomia',
    semester: '3º Semestre',
    difficultyLevel: 'Intermediário',
    shortExplanation: 'Lobo inferior lateral que processa informações auditivas, semânticas, memória (hipocampo) e emoções (amígdala).',
    clinicalImportance: 'O lobo temporal mesial é o sítio mais comum de epilepsia refratária focal em adultos. Lesões bilaterais causam síndrome de Klüver-Bucy.',
    learningObjectives: [
      'Identificar o giro temporal superior onde ocorre a audição primária',
      'Entender a importância do polo temporal e aspecto medial'
    ],
    commonMistakes: [
      'Não associar a área de Wernicke com o plano temporal'
    ],
    relatedStructures: ['Lobo Frontal', 'Lobo Parietal'],
    academicFocus: 'Audição, linguagem e memória'
  }
};

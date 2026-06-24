// Registro que alimentará o contexto de Injeção da LLM no futuro
export const atlasAiTutorRegistry = {
  'left_ventricle': {
    modelId: 'demo-heart-glb',
    structureId: 'left_ventricle',
    whatIsIt: 'O ventrículo esquerdo é a principal câmara de bombeamento do coração, responsável por enviar sangue oxigenado para todo o corpo sistêmico.',
    clinicalCorrelations: [
      'Insuficiência Cardíaca Congestiva (ICC)',
      'Hipertrofia Ventricular Esquerda (HVE)',
      'Infarto do Miocárdio (parede anterior, lateral ou inferior)'
    ],
    learningObjectives: [
      'Entender o papel da parede espessa muscular',
      'Relacionar a sístole ventricular com a abertura da válvula aórtica',
      'Diferenciar pressões do lado esquerdo vs direito'
    ],
    commonMistakes: [
      'Confundir a espessura da parede do VE com a do VD',
      'Esquecer que as veias pulmonares desaguam no átrio, não no ventrículo',
      'Desconhecer a irrigação das artérias coronárias'
    ],
    relatedStructures: ['Aorta', 'Átrio Esquerdo', 'Válvula Mitral', 'Músculo Papilar'],
    recommendedQuestions: [
      'Quais são os sinais clínicos de falência do ventrículo esquerdo?',
      'Como a pressão arterial sistêmica afeta a espessura desta parede?',
      'Qual a diferença entre sístole e diástole nesta câmara?'
    ]
  },
  'aorta': {
    modelId: 'demo-heart-glb',
    structureId: 'aorta',
    whatIsIt: 'A aorta é a maior artéria do corpo, encarregada de distribuir sangue oxigenado do ventrículo esquerdo para a circulação sistêmica.',
    clinicalCorrelations: [
      'Aneurisma de Aorta',
      'Dissecção Aórtica',
      'Coartação da Aorta'
    ],
    learningObjectives: [
      'Identificar arco aórtico, porção ascendente e descendente',
      'Memorizar os três troncos principais que saem do arco',
      'Entender a função dos barorreceptores locais'
    ],
    commonMistakes: [
      'Errar a ordem dos ramos: Braquiocefálico, Carótida Comum Esquerda, Subclávia Esquerda',
      'Confundir a veia cava superior com a porção ascendente',
      'Não associar o ligamento arterioso à estrutura'
    ],
    relatedStructures: ['Ventrículo Esquerdo', 'Artéria Pulmonar', 'Veia Cava Superior'],
    recommendedQuestions: [
      'Como ocorre uma dissecção aórtica?',
      'Quais artérias nascem do arco da aorta?',
      'Qual a relação anatômica entre a aorta e a artéria pulmonar?'
    ]
  },
  'Mesh_Mitral_Valve': {
    modelId: 'demo-heart-glb',
    structureId: 'Mesh_Mitral_Valve',
    whatIsIt: 'A válvula mitral (ou bicúspide) regula o fluxo de sangue do átrio esquerdo para o ventrículo esquerdo, impedindo o refluxo durante a sístole.',
    clinicalCorrelations: [
      'Prolapso da Válvula Mitral',
      'Estenose Mitral (frequentemente de origem reumática)',
      'Insuficiência Mitral (Regurgitação)'
    ],
    learningObjectives: [
      'Compreender o mecanismo de abertura diastólica',
      'Relacionar a válvula com o fechamento audível (B1 na ausculta cardíaca)',
      'Reconhecer o papel das cordoalhas tendíneas'
    ],
    commonMistakes: [
      'Achar que a válvula mitral possui três folhetos (cúspides)',
      'Afirmar que a válvula mitral fica no lado direito do coração',
      'Acreditar que os músculos papilares "puxam" a válvula para abri-la (eles impedem que ela prolapse)'
    ],
    relatedStructures: ['Átrio Esquerdo', 'Ventrículo Esquerdo', 'Músculos Papilares', 'Cordoalhas Tendíneas'],
    recommendedQuestions: [
      'O que causa o som da primeira bulha cardíaca (B1)?',
      'Qual a diferença estrutural entre a válvula mitral e a tricúspide?',
      'O que é o prolapso da válvula mitral?'
    ]
  },
  'Corpo Caloso': { modelId: 'corte-sagital-encefalo', structureId: 'Corpo Caloso', whatIsIt: 'A maior comissura de substância branca conectando os hemisférios cerebrais.', clinicalCorrelations: ['Agenesia do corpo caloso', 'Síndrome de desconexão'], learningObjectives: ['Identificar partes do corpo caloso'], commonMistakes: ['Confundir com fórnix'], relatedStructures: ['Giro do Cíngulo', 'Septo Pelúcido'], recommendedQuestions: ['Qual a função do corpo caloso?', 'Quais as partes constituintes desta estrutura?', 'O que ocorre em uma lesão calosiana?', 'Como diferenciar rostro de esplênio?', 'Qual a relação com os ventrículos laterais?'] },
  'Septo Pelúcido': { modelId: 'corte-sagital-encefalo', structureId: 'Septo Pelúcido', whatIsIt: 'Fina membrana vertical separando os ventrículos laterais.', clinicalCorrelations: ['Displasia septo-óptica'], learningObjectives: ['Localizar o septo pelúcido'], commonMistakes: ['Achar que é uma estrutura maciça'], relatedStructures: ['Corpo Caloso', 'Fórnix'], recommendedQuestions: ['Qual a embriologia do septo pelúcido?', 'Onde fica localizado exatamente?', 'O que é a cavidade do septo pelúcido?', 'Quais as consequências de sua ausência?', 'Como visualizá-lo em RM?'] },
  'Fórnix': { modelId: 'corte-sagital-encefalo', structureId: 'Fórnix', whatIsIt: 'Feixe de fibras associado à memória no sistema límbico.', clinicalCorrelations: ['Amnésia anterógrada'], learningObjectives: ['Identificar as colunas e pilares'], commonMistakes: ['Desconectar do hipocampo'], relatedStructures: ['Hipocampo', 'Corpos Mamilares'], recommendedQuestions: ['Qual a função do fórnix?', 'De onde se originam suas fibras?', 'Como ele se divide?', 'Qual a relação com os corpos mamilares?', 'O que é o circuito de Papez?'] },
  'Tálamo': { modelId: 'corte-sagital-encefalo', structureId: 'Tálamo', whatIsIt: 'Massa ovóide retransmissora de sinais sensoriais e motores.', clinicalCorrelations: ['Síndrome de Dejerine-Roussy'], learningObjectives: ['Compreender a função de filtro sensitivo'], commonMistakes: ['Esquecer a via olfatória direta'], relatedStructures: ['Hipotálamo', 'Terceiro Ventrículo'], recommendedQuestions: ['Por que o tálamo é a porta de entrada do córtex?', 'Quais sentidos passam por ele?', 'Onde fica a aderência intertalâmica?', 'Quais seus principais núcleos?', 'Como uma lesão talâmica se manifesta?'] },
  'Hipotálamo': { modelId: 'corte-sagital-encefalo', structureId: 'Hipotálamo', whatIsIt: 'Região diencefálica central do sistema neuroendócrino e autonômico.', clinicalCorrelations: ['Diabetes insipidus', 'Distúrbios de termorregulação'], learningObjectives: ['Conexão com a hipófise'], commonMistakes: ['Confundir com o tálamo na imagem'], relatedStructures: ['Hipófise', 'Quiasma Óptico'], recommendedQuestions: ['Qual a principal função do hipotálamo?', 'Como ele participa do controle endócrino?', 'Quais núcleos são mais cobrados?', 'Qual a relação anatômica com a hipófise?', 'Quais hormônios ele produz?'] },
  'Hipófise': { modelId: 'corte-sagital-encefalo', structureId: 'Hipófise', whatIsIt: 'Glândula pituitária localizada na sela túrcica.', clinicalCorrelations: ['Adenoma hipofisário'], learningObjectives: ['Diferenciar os lobos anterior e posterior'], commonMistakes: ['Achar que a neurohipófise sintetiza hormônios'], relatedStructures: ['Hipotálamo', 'Sela Túrcica'], recommendedQuestions: ['Qual a diferença entre adenohipófise e neurohipófise?', 'Onde a hipófise se aloja?', 'O que é o sistema porta-hipofisário?', 'Como tumores aqui afetam a visão?', 'Quais hormônios são armazenados nela?'] },
  'Quiasma Óptico': { modelId: 'corte-sagital-encefalo', structureId: 'Quiasma Óptico', whatIsIt: 'Local de cruzamento parcial das fibras dos nervos ópticos.', clinicalCorrelations: ['Hemianopsia bitemporal'], learningObjectives: ['Compreender o decussamento retinal'], commonMistakes: ['Assumir que todas as fibras cruzam'], relatedStructures: ['Hipófise', 'Nervo Óptico'], recommendedQuestions: ['O que é o quiasma óptico?', 'Quais fibras se cruzam nele?', 'Por que um tumor de hipófise causa hemianopsia bitemporal?', 'Qual o trajeto do nervo óptico?', 'Qual a diferença entre trato e nervo óptico?'] },
  'Pineal': { modelId: 'corte-sagital-encefalo', structureId: 'Pineal', whatIsIt: 'Glândula no epitálamo produtora de melatonina.', clinicalCorrelations: ['Calcificação fisiológica', 'Tumor de pineal'], learningObjectives: ['Localizar posteriormente ao terceiro ventrículo'], commonMistakes: ['Confundir função com a da hipófise'], relatedStructures: ['Mesencéfalo', 'Terceiro Ventrículo'], recommendedQuestions: ['Qual a função da glândula pineal?', 'Onde está anatomicamente localizada?', 'O que é o relógio biológico humano?', 'O que ocorre quando a pineal calcifica?', 'Qual a relação com os colículos superiores?'] },
  'Mesencéfalo': { modelId: 'corte-sagital-encefalo', structureId: 'Mesencéfalo', whatIsIt: 'Parte superior do tronco encefálico.', clinicalCorrelations: ['Doença de Parkinson'], learningObjectives: ['Identificar teto e pedúnculos cerebrais'], commonMistakes: ['Não achar o aqueduto cerebral'], relatedStructures: ['Ponte', 'Aqueduto Cerebral'], recommendedQuestions: ['Quais nervos cranianos se originam no mesencéfalo?', 'O que é a substância negra?', 'Para que servem os colículos?', 'Como ocorre o fluxo liquórico nesta área?', 'Quais os limites do mesencéfalo?'] },
  'Ponte': { modelId: 'corte-sagital-encefalo', structureId: 'Ponte', whatIsIt: 'Protuberância do tronco encefálico entre o mesencéfalo e o bulbo.', clinicalCorrelations: ['Locked-in syndrome'], learningObjectives: ['Identificar sua protuberância anterior'], commonMistakes: ['Errar nervos associados (V a VIII)'], relatedStructures: ['Bulbo', 'Cerebelo'], recommendedQuestions: ['Quais tratos passam pela ponte?', 'Qual a função dos pedúnculos cerebelares médios?', 'O que é a síndrome do encarceramento (locked-in)?', 'Qual sua relação com o quarto ventrículo?', 'Quais nervos cranianos emergem daqui?'] },
  'Bulbo': { modelId: 'corte-sagital-encefalo', structureId: 'Bulbo', whatIsIt: 'Parte inferior do tronco encefálico que controla centros vitais.', clinicalCorrelations: ['Herniação tonsilar letal'], learningObjectives: ['Identificar as pirâmides e olivas'], commonMistakes: ['Não perceber a transição cervicomedular'], relatedStructures: ['Ponte', 'Medula Espinhal'], recommendedQuestions: ['Onde se decussam as pirâmides motores?', 'Quais centros vitais o bulbo abriga?', 'O que ocorre na herniação do forame magno?', 'Qual a diferença entre as olivas e as pirâmides?', 'Quais nervos cranianos têm origem bulbar?'] },
  'Cerebelo': { modelId: 'corte-sagital-encefalo', structureId: 'Cerebelo', whatIsIt: 'Centro de coordenação motora situado na fossa posterior.', clinicalCorrelations: ['Ataxia', 'Marcha ébria'], learningObjectives: ['Diferenciar verme dos hemisférios'], commonMistakes: ['Confundir as pedúnculos'], relatedStructures: ['Ponte', 'Bulbo', 'Quarto Ventrículo'], recommendedQuestions: ['O que é a árvore da vida?', 'Como o cerebelo controla o movimento?', 'O que acontece em lesões cerebelares contralaterais?', 'Qual o papel do verme?', 'Como se comunica com o tronco encefálico?'] },
  'Quarto Ventrículo': { modelId: 'corte-sagital-encefalo', structureId: 'Quarto Ventrículo', whatIsIt: 'Cavidade liquórica entre o tronco e o cerebelo.', clinicalCorrelations: ['Hidrocefalia obstrutiva inferior'], learningObjectives: ['Identificar seu teto e assoalho'], commonMistakes: ['Esquecer dos forames de Luschka e Magendie'], relatedStructures: ['Cerebelo', 'Ponte', 'Bulbo'], recommendedQuestions: ['Quais os limites do quarto ventrículo?', 'Como o LCR sai desta estrutura?', 'O que forma o assoalho ventricular aqui?', 'Qual a relação com a fossa rombóide?', 'O que acontece se ele for obstruído?'] },
  'Terceiro Ventrículo': { modelId: 'corte-sagital-encefalo', structureId: 'Terceiro Ventrículo', whatIsIt: 'Cavidade mediana do diencéfalo.', clinicalCorrelations: ['Hipertensão intracraniana'], learningObjectives: ['Localizar entre os tálamos'], commonMistakes: ['Confundir com espaço extra-axial'], relatedStructures: ['Tálamo', 'Hipotálamo'], recommendedQuestions: ['Quais estruturas formam as paredes do terceiro ventrículo?', 'Como o LCR chega ao terceiro ventrículo?', 'Onde fica a aderência intertalâmica em relação a ele?', 'Qual a importância do forame de Monro?', 'Quais recessos o terceiro ventrículo possui?'] },
  'Aqueduto Cerebral': { modelId: 'corte-sagital-encefalo', structureId: 'Aqueduto Cerebral', whatIsIt: 'Canal liquórico estreito do mesencéfalo.', clinicalCorrelations: ['Estenose aquedutal'], learningObjectives: ['Visualizar seu trajeto vertical'], commonMistakes: ['Ignorar o teto do mesencéfalo'], relatedStructures: ['Mesencéfalo', 'Terceiro Ventrículo', 'Quarto Ventrículo'], recommendedQuestions: ['O que conecta o aqueduto de Sylvius?', 'Por que é um ponto crítico de obstrução liquórica?', 'Ele passa por qual região do encéfalo?', 'O que causa estenose aquedutal?', 'Como identificar no corte sagital medial?'] },
  'Giro do Cíngulo': { modelId: 'corte-sagital-encefalo', structureId: 'Giro do Cíngulo', whatIsIt: 'Componente do córtex límbico acima do corpo caloso.', clinicalCorrelations: ['Alterações emocionais', 'Cirurgia de dor'], learningObjectives: ['Reconhecer seu papel no sistema límbico'], commonMistakes: ['Tratar como parte motora simples'], relatedStructures: ['Corpo Caloso', 'Lobo Frontal'], recommendedQuestions: ['O que é o giro do cíngulo?', 'Qual a sua função primária no sistema nervoso?', 'O que é a cingulotomia?', 'Como se estende até o lobo temporal?', 'Quais estruturas delimitam este giro?'] },
  'Lobo Frontal': { modelId: 'corte-sagital-encefalo', structureId: 'Lobo Frontal', whatIsIt: 'Maior lobo cerebral, cuida do intelecto e motor.', clinicalCorrelations: ['Afasia de Broca', 'Síndrome pré-frontal'], learningObjectives: ['Localizar área motora primária'], commonMistakes: ['Ignorar limites posteriores'], relatedStructures: ['Lobo Parietal', 'Corpo Caloso'], recommendedQuestions: ['Qual o limite posterior do lobo frontal?', 'Qual a função do córtex motor primário?', 'O que aconteceu no caso Phineas Gage?', 'Onde se localiza a área de Broca?', 'Quais funções executivas dependem dele?'] },
  'Lobo Parietal': { modelId: 'corte-sagital-encefalo', structureId: 'Lobo Parietal', whatIsIt: 'Lobo somatossensorial e de integração espacial.', clinicalCorrelations: ['Heminegligência espacial'], learningObjectives: ['Localizar córtex somatossensorial primário'], commonMistakes: ['Confundir limite temporal'], relatedStructures: ['Lobo Frontal', 'Lobo Occipital'], recommendedQuestions: ['Para que serve o lobo parietal?', 'O que é heminegligência (negligência unilateral)?', 'Onde fica o giro pós-central?', 'O que é o homúnculo de Penfield sensorial?', 'Como diferenciá-lo no corte sagital?'] },
  'Lobo Occipital': { modelId: 'corte-sagital-encefalo', structureId: 'Lobo Occipital', whatIsIt: 'Lobo posterior especializado na visão.', clinicalCorrelations: ['Hemianopsia'], learningObjectives: ['Identificar sulco calcarino'], commonMistakes: ['Confundir via visual'], relatedStructures: ['Lobo Parietal', 'Cerebelo'], recommendedQuestions: ['Qual a função do lobo occipital?', 'O que ocorre em uma lesão neste lobo?', 'Onde fica o córtex visual primário?', 'Qual a relevância do sulco calcarino?', 'Como a visão cruza até este lobo?'] },
  'Lobo Temporal': { modelId: 'corte-sagital-encefalo', structureId: 'Lobo Temporal', whatIsIt: 'Lobo da audição e memória.', clinicalCorrelations: ['Epilepsia do lobo temporal', 'Síndrome de Wernicke'], learningObjectives: ['Localizar lobo ínfero-lateral'], commonMistakes: ['Desconhecer área medial límbica'], relatedStructures: ['Lobo Frontal', 'Hipocampo'], recommendedQuestions: ['Qual o principal papel do lobo temporal?', 'Onde ocorre o processamento auditivo primário?', 'O que é a área de Wernicke?', 'Qual a relação do lobo temporal com a memória (hipocampo)?', 'Quais sintomas de epilepsia do lobo temporal mesial?'] }
};

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
  },
  {
    id: "corte-sagital-cranio-humano-superficial",
    modelId: "corte-sagital-cranio-humano-superficial",
    name: "Corte Sagital do Crânio Humano - Modelo Superficial 3D",
    viewer_type: "atlas-native",
    model_format: "glb",
    model_url: "/models/native/corte-sagital-cranio-humano-superficial.glb",
    status: "active",
    atlasAssetStatus: "ready",
    latinName: "Sectio sagittalis cranii",
    system: "Sistema nervoso",
    region: "Cabeça e pescoço",
    description: "Modelo anatômico em corte sagital da cabeça humana, útil para observar relações entre encéfalo, cavidades cranianas, vias aéreas superiores e planos medianos.",
    location: "Cabeça em plano sagital mediano.",
    type: "Corte anatômico tridimensional",
    keyFeatures: [
      "Cerebelo",
      "Cuarto Ventrículo",
      "Cuña",
      "Cuerpo Calloso",
      "Hipófisis",
      "Giro Subcalloso:",
      "Hoz del Cerebro Anterior",
      "Médula Oblongada",
      "Mesencéfalo",
      "Giro Cingular"
    ],
    function: "Apoiar o estudo topográfico das estruturas cranianas e encefálicas em plano sagital.",
    clinicalNotes: "Relevante para correlação com neuroanatomia, anatomia de cabeça e pescoço e interpretação inicial de cortes medianos em imagem.",
    breadcrumb: ["Sistema Nervoso", "Cabeça e Pescoço", "Corte Sagital"],
    metadata: {
      legacy_annotations_backup: true,
      legacy_annotation_positions: null,
      legacy_annotation_source: "sketchfab",
      marker_review_started_at: new Date().toISOString(),
      marker_review_status: "in_progress"
    },
    parts: [
      { id: "cerebelo", name: "Cerebelo", latinName: "Cerebellum", thumbnailUrl: "", description: "Principal órgão do cerebelo, responsável pela coordenação motora.", position: [0.05, 1.2, -0.6], cameraPosition: [0.3, 1.3, -1.0], cameraTarget: [0.05, 1.2, -0.6] },
      { id: "cuarto-ventriculo", name: "Quarto Ventrículo", latinName: "Ventriculus quartus", thumbnailUrl: "", description: "Cavidade do rombencéfalo preenchida por líquor.", position: [0.0, 1.25, -0.4], cameraPosition: [0.2, 1.3, -0.7], cameraTarget: [0.0, 1.25, -0.4] },
      { id: "cuna", name: "Cunha", latinName: "Cuneus", thumbnailUrl: "", description: "Lobo occipital localizado na face medial do hemisfério.", position: [0.0, 1.6, -0.8], cameraPosition: [0.3, 1.8, -1.2], cameraTarget: [0.0, 1.6, -0.8] },
      { id: "cuerpo-calloso", name: "Corpo Caloso", latinName: "Corpus callosum", thumbnailUrl: "", description: "Feixe de fibras nervosas conectando os hemisférios cerebrais.", position: [0.0, 1.5, 0.1], cameraPosition: [0.3, 1.6, 0.4], cameraTarget: [0.0, 1.5, 0.1] },
      { id: "hipofisis", name: "Hipófise", latinName: "Hypophysis", thumbnailUrl: "", description: "Glândula endócrina na base do cérebro.", position: [0.0, 1.1, 0.2], cameraPosition: [0.2, 1.1, 0.4], cameraTarget: [0.0, 1.1, 0.2] },
      { id: "giro-subcalloso", name: "Giro Subcaloso", latinName: "Gyrus subcallosus", thumbnailUrl: "", description: "Pequena área cortical na região frontal basal.", position: [0.0, 1.3, 0.3], cameraPosition: [0.2, 1.4, 0.5], cameraTarget: [0.0, 1.3, 0.3] },
      { id: "hoz-cerebro-anterior", name: "Foice do Cérebro (Anterior)", latinName: "Falx cerebri", thumbnailUrl: "", description: "Prega da dura-máter separando os hemisférios.", position: [0.0, 1.8, 0.5], cameraPosition: [0.4, 2.0, 0.8], cameraTarget: [0.0, 1.8, 0.5] },
      { id: "medula-oblongada", name: "Bulbo (Medula Oblonga)", latinName: "Medulla oblongata", thumbnailUrl: "", description: "Porção inferior do tronco encefálico.", position: [0.0, 0.9, -0.3], cameraPosition: [0.2, 1.0, -0.6], cameraTarget: [0.0, 0.9, -0.3] },
      { id: "mesencefalo", name: "Mesencéfalo", latinName: "Mesencephalon", thumbnailUrl: "", description: "Porção superior do tronco encefálico.", position: [0.0, 1.3, -0.1], cameraPosition: [0.2, 1.4, -0.3], cameraTarget: [0.0, 1.3, -0.1] },
      { id: "giro-cingular", name: "Giro do Cíngulo", latinName: "Gyrus cinguli", thumbnailUrl: "", description: "Giro situado imediatamente acima do corpo caloso.", position: [0.0, 1.6, 0.1], cameraPosition: [0.3, 1.8, 0.4], cameraTarget: [0.0, 1.6, 0.1] },
      { id: "talamo", name: "Tálamo", latinName: "Thalamus", thumbnailUrl: "", description: "Principal estação retransmissora de informações sensoriais do encéfalo.", position: [0.0, 1.35, 0.0], cameraPosition: [0.25, 1.45, 0.2], cameraTarget: [0.0, 1.35, 0.0] },
      { id: "hipotalamo", name: "Hipotálamo", latinName: "Hypothalamus", thumbnailUrl: "", description: "Centro regulador do sistema autônomo e endócrino.", position: [0.0, 1.25, 0.1], cameraPosition: [0.2, 1.35, 0.3], cameraTarget: [0.0, 1.25, 0.1] },
      { id: "ponte", name: "Ponte", latinName: "Pons", thumbnailUrl: "", description: "Porção média dilatada do tronco encefálico.", position: [0.0, 1.1, -0.2], cameraPosition: [0.25, 1.2, -0.5], cameraTarget: [0.0, 1.1, -0.2] },
      { id: "ventriculo-lateral", name: "Ventrículo Lateral", latinName: "Ventriculus lateralis", thumbnailUrl: "", description: "Cavidade pareada contendo líquor nos hemisférios.", position: [0.05, 1.45, 0.0], cameraPosition: [0.3, 1.55, 0.3], cameraTarget: [0.05, 1.45, 0.0] },
      { id: "septo-pelucido", name: "Septo Pelúcido", latinName: "Septum pellucidum", thumbnailUrl: "", description: "Lâmina fina que separa os ventrículos laterais.", position: [0.0, 1.4, 0.2], cameraPosition: [0.25, 1.5, 0.4], cameraTarget: [0.0, 1.4, 0.2] },
      { id: "fornix", name: "Fórnix", latinName: "Fornix", thumbnailUrl: "", description: "Feixe de fibras do sistema límbico inferior ao septo pelúcido.", position: [0.0, 1.38, 0.15], cameraPosition: [0.25, 1.48, 0.35], cameraTarget: [0.0, 1.38, 0.15] },
      { id: "quiasma-optico", name: "Quiasma Óptico", latinName: "Chiasma opticum", thumbnailUrl: "", description: "Cruzamento das fibras dos nervos ópticos.", position: [0.0, 1.15, 0.3], cameraPosition: [0.2, 1.25, 0.5], cameraTarget: [0.0, 1.15, 0.3] },
      { id: "medula-espinal", name: "Medula Espinal", latinName: "Medulla spinalis", thumbnailUrl: "", description: "Segmento inicial da medula abaixo do forame magno.", position: [0.0, 0.7, -0.3], cameraPosition: [0.25, 0.8, -0.6], cameraTarget: [0.0, 0.7, -0.3] }
    ],
    surfaces: ["Plano sagital mediano", "Base craniana", "Região nasal", "Região oral", "Segmento cervical superior"],
    markers: ["Corpo caloso", "Tronco encefálico", "Palato duro", "Seio frontal", "Forame magno"],
    sections: [
      { id: "sagital-mediano", name: "Plano sagital mediano", plane: "Sagital" },
      { id: "parasagital", name: "Plano parassagital", plane: "Sagital" }
    ]
  },
  {
    id: "corte-sagital-sistema-reprodutor-feminino",
    modelId: "corte-sagital-sistema-reprodutor-feminino",
    name: "Corte Sagital Sistema Reprodutor Feminino",
    latinName: "Sectio sagittalis pelvis femininae",
    system: "Sistema reprodutor feminino",
    region: "Pelve e períneo",
    description: "Modelo anatômico em corte sagital da pelve feminina, útil para observar as relações entre órgãos reprodutores, urinários e digestivos.",
    location: "Pelve feminina em plano sagital mediano.",
    type: "Corte anatômico tridimensional",
    keyFeatures: [
      "Útero",
      "Fondo uterino",
      "Cuerpo uterino",
      "Cuello uterino / Cérvix",
      "Cavidad uterina",
      "Canal cervical",
      "Vagina",
      "Canal vaginal",
      "Vejiga urinaria",
      "Uretra femenina",
      "Recto",
      "Conducto anal",
      "Periné",
      "Pubis",
      "Sacro",
      "Cóccix",
      "Ovario",
      "Trompa uterina",
      "Fondo de saco vesicouterino",
      "Fondo de saco rectouterino / Douglas"
    ],
    function: "Apoiar o estudo topográfico da pelve feminina e a compreensão tridimensional das relações útero-vagina-bexiga-reto.",
    clinicalNotes: "Relevante para anatomia ginecológica, obstetrícia, exploração pélvica, avaliação do fundo de saco de Douglas e correlação com imagem.",
    breadcrumb: ["Sistema Reprodutor Feminino", "Pelve e Períneo", "Corte Sagital"],
    parts: [
      { id: "utero", name: "Útero", latinName: "Uterus", thumbnailUrl: "", description: "Órgano muscular central entre la vejiga urinaria y el recto." },
      { id: "fondo-uterino", name: "Fondo uterino", latinName: "Fundus uteri", thumbnailUrl: "", description: "Porción superior convexa del útero." },
      { id: "cuerpo-uterino", name: "Cuerpo uterino", latinName: "Corpus uteri", thumbnailUrl: "", description: "Segmento principal situado entre el fondo y el cuello uterino." },
      { id: "cervix", name: "Cuello uterino / Cérvix", latinName: "Cervix uteri", thumbnailUrl: "", description: "Porción inferior del útero que se proyecta hacia la vagina." },
      { id: "cavidad-uterina", name: "Cavidad uterina", latinName: "Cavitas uteri", thumbnailUrl: "", description: "Espacio interno revestido por endometrio." },
      { id: "canal-cervical", name: "Canal cervical", latinName: "Canalis cervicis uteri", thumbnailUrl: "", description: "Comunica la cavidad uterina con la vagina." },
      { id: "vagina", name: "Vagina", latinName: "Vagina", thumbnailUrl: "", description: "Conducto fibromuscular posterior a la uretra y anterior al recto." },
      { id: "canal-vaginal", name: "Canal vaginal", latinName: "Canalis vaginalis", thumbnailUrl: "", description: "Trayecto anatómico desde el cérvix hasta el vestíbulo." },
      { id: "vejiga-urinaria", name: "Vejiga urinaria", latinName: "Vesica urinaria", thumbnailUrl: "", description: "Órgano urinario anterior al útero y a la vagina." },
      { id: "uretra-femenina", name: "Uretra femenina", latinName: "Urethra feminina", thumbnailUrl: "", description: "Conducto urinario corto situado anterior a la vagina." },
      { id: "recto", name: "Recto", latinName: "Rectum", thumbnailUrl: "", description: "Segmento distal del intestino grueso posterior al útero y a la vagina." },
      { id: "conducto-anal", name: "Conducto anal", latinName: "Canalis analis", thumbnailUrl: "", description: "Porción terminal del tubo digestivo." },
      { id: "perine", name: "Periné", latinName: "Perineum", thumbnailUrl: "", description: "Región inferior de soporte de los órganos pélvicos." },
      { id: "pubis", name: "Pubis", latinName: "Os pubis", thumbnailUrl: "", description: "Referencia ósea anterior de la pelvis." },
      { id: "sacro", name: "Sacro", latinName: "Os sacrum", thumbnailUrl: "", description: "Referencia ósea posterior de la cavidad pélvica." },
      { id: "coccix", name: "Cóccix", latinName: "Os coccygis", thumbnailUrl: "", description: "Segmento terminal de la columna vertebral." },
      { id: "ovario", name: "Ovario", latinName: "Ovarium", thumbnailUrl: "", description: "Gónada femenina relacionada lateralmente con el útero." },
      { id: "trompa-uterina", name: "Trompa uterina", latinName: "Tuba uterina", thumbnailUrl: "", description: "Conducto que se extiende desde el útero hacia el ovario." },
      { id: "fondo-vesicouterino", name: "Fondo de saco vesicouterino", latinName: "Excavatio vesicouterina", thumbnailUrl: "", description: "Receso peritoneal entre vejiga y útero." },
      { id: "fondo-rectouterino", name: "Fondo de saco rectouterino / Douglas", latinName: "Excavatio rectouterina", thumbnailUrl: "", description: "Receso peritoneal profundo entre útero y recto." }
    ],
    surfaces: ["Plano sagital mediano", "Compartimento anterior", "Compartimento medio", "Compartimento posterior", "Piso pélvico"],
    markers: ["Útero", "Vagina", "Vejiga urinaria", "Recto", "Sacro", "Fondo de saco de Douglas"],
    sections: [
      { id: "sagital-pelve", name: "Plano sagital da pelve", plane: "Sagital" },
      { id: "topografia-pelvica", name: "Relações topográficas pélvicas", plane: "Topográfico" }
    ]
  }
];

export function getStructureForModel(modelId) {
  return mockStructures.find(structure => structure.modelId === modelId) || null;
}

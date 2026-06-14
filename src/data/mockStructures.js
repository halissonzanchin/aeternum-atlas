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
    name: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
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
    parts: [
      { id: "cerebelo", name: "Cerebelo", latinName: "Cerebellum", thumbnailUrl: "", description: "Anotação 01 no modelo Sketchfab." },
      { id: "cuarto-ventriculo", name: "Cuarto Ventrículo", latinName: "Ventriculus quartus", thumbnailUrl: "", description: "Anotação 02 no modelo Sketchfab." },
      { id: "cuna", name: "Cuña", latinName: "Cuneus", thumbnailUrl: "", description: "Anotação 03 no modelo Sketchfab." },
      { id: "cuerpo-calloso", name: "Cuerpo Calloso", latinName: "Corpus callosum", thumbnailUrl: "", description: "Anotação 04 no modelo Sketchfab." },
      { id: "hipofisis", name: "Hipófisis", latinName: "Hypophysis", thumbnailUrl: "", description: "Anotação 05 no modelo Sketchfab." },
      { id: "giro-subcalloso", name: "Giro Subcalloso:", latinName: "Gyrus subcallosus", thumbnailUrl: "", description: "Anotação 06 no modelo Sketchfab." },
      { id: "hoz-cerebro-anterior", name: "Hoz del Cerebro Anterior", latinName: "Falx cerebri", thumbnailUrl: "", description: "Anotação 07 no modelo Sketchfab." },
      { id: "medula-oblongada", name: "Médula Oblongada", latinName: "Medulla oblongata", thumbnailUrl: "", description: "Anotação 08 no modelo Sketchfab." },
      { id: "mesencefalo", name: "Mesencéfalo", latinName: "Mesencephalon", thumbnailUrl: "", description: "Anotação 09 no modelo Sketchfab." },
      { id: "giro-cingular", name: "Giro Cingular", latinName: "Gyrus cinguli", thumbnailUrl: "", description: "Anotação 10 no modelo Sketchfab." }
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

import { readStorage, writeStorage } from "./storage/storageService";

const STORAGE_KEY = "aeternum_theoretical_quiz_progress";
export const THEORETICAL_QUIZ_TIME_LIMIT_SECONDS = 90 * 60;

const RADAR_TOPICS = [
  "Configuración externa",
  "Válvulas",
  "Tabiques",
  "Anatomía topográfica",
  "Relaciones cardíacas"
];

const BRAIN_RADAR_TOPICS = [
  "Sistema ventricular",
  "Diencéfalo",
  "Tronco encefálico",
  "Cerebelo",
  "Relaciones anatómicas",
  "Neuroanatomía funcional",
  "Corte sagital mediano"
];

const FEMALE_REPRODUCTIVE_RADAR_TOPICS = [
  "Órganos reproductores",
  "Relaciones pélvicas",
  "Sistema urinario asociado",
  "Sistema digestivo asociado",
  "Periné",
  "Anatomía topográfica",
  "Aplicación clínica"
];

const multipleChoiceQuestions = [
  {
    id: "mc-01",
    topic: "Configuración externa",
    question: "¿Cuál estructura constituye la mayor parte de la cara esternocostal del corazón?",
    options: ["Aurícula derecha", "Ventrículo derecho", "Ventrículo izquierdo", "Aurícula izquierda", "Tronco pulmonar"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: la aurícula derecha contribuye al borde derecho, pero no domina la cara esternocostal.",
      "Correcta: el ventrículo derecho forma la mayor parte de la superficie anterior o esternocostal.",
      "Incorrecta: el ventrículo izquierdo predomina en la cara diafragmática y forma el vértice.",
      "Incorrecta: la aurícula izquierda es posterior y participa en la base cardíaca.",
      "Incorrecta: el tronco pulmonar emerge superiormente y no constituye la superficie ventricular."
    ]
  },
  {
    id: "mc-02",
    topic: "Anatomía topográfica",
    question: "En la orientación anatómica del corazón in situ, el vértice cardíaco se proyecta principalmente hacia:",
    options: ["Arriba, derecha y posterior", "Abajo, izquierda y anterior", "Arriba, izquierda y posterior", "Abajo, derecha y medial", "Posterior y superior"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: esa dirección se aproxima más a la base cardíaca.",
      "Correcta: el vértice se dirige inferior, anterior e izquierdamente, habitualmente al quinto espacio intercostal.",
      "Incorrecta: el componente superior y posterior no corresponde al vértice.",
      "Incorrecta: el vértice no se orienta hacia la derecha.",
      "Incorrecta: la base, no el vértice, tiene orientación posterior."
    ]
  },
  {
    id: "mc-03",
    topic: "Relaciones cardíacas",
    question: "La base del corazón está formada predominantemente por:",
    options: ["Ventrículo derecho", "Aurícula izquierda", "Ventrículo izquierdo", "Orejuela derecha", "Cono arterioso"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el ventrículo derecho es anterior.",
      "Correcta: la aurícula izquierda forma la mayor parte de la base, recibiendo las venas pulmonares.",
      "Incorrecta: el ventrículo izquierdo participa en el vértice y cara pulmonar izquierda.",
      "Incorrecta: la orejuela derecha es anterior y lateral.",
      "Incorrecta: el cono arterioso pertenece al tracto de salida del ventrículo derecho."
    ]
  },
  {
    id: "mc-04",
    topic: "Configuración externa",
    question: "El surco interventricular anterior marca externamente la separación entre:",
    options: ["Aurícula derecha y aurícula izquierda", "Ventrículo derecho y ventrículo izquierdo", "Aurícula derecha y ventrículo derecho", "Aurícula izquierda y ventrículo izquierdo", "Tronco pulmonar y aorta"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: las aurículas se separan por el tabique interauricular, no por este surco visible anterior.",
      "Correcta: el surco interventricular anterior corresponde al límite externo entre ambos ventrículos.",
      "Incorrecta: esa relación corresponde al surco coronario derecho.",
      "Incorrecta: esa transición forma parte del surco coronario izquierdo.",
      "Incorrecta: los grandes vasos no definen el surco interventricular."
    ]
  },
  {
    id: "mc-05",
    topic: "Válvulas",
    question: "La válvula mitral comunica anatómicamente:",
    options: ["Aurícula derecha con ventrículo derecho", "Aurícula izquierda con ventrículo izquierdo", "Ventrículo derecho con tronco pulmonar", "Ventrículo izquierdo con aorta", "Aurícula izquierda con venas pulmonares"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: esa es la válvula tricúspide.",
      "Correcta: la válvula mitral o bicúspide se interpone entre la aurícula izquierda y el ventrículo izquierdo.",
      "Incorrecta: esa es la válvula pulmonar.",
      "Incorrecta: esa es la válvula aórtica.",
      "Incorrecta: las venas pulmonares desembocan sin válvulas anatómicas equivalentes."
    ]
  },
  {
    id: "mc-06",
    topic: "Válvulas",
    question: "¿Cuál componente evita el prolapso de las valvas auriculoventriculares durante la sístole ventricular?",
    options: ["Trabéculas carnosas", "Músculos pectíneos", "Cuerdas tendinosas y músculos papilares", "Cresta terminal", "Senos aórticos"],
    correctIndex: 2,
    explanations: [
      "Incorrecta: las trabéculas carnosas son relieves ventriculares, pero no fijan las valvas.",
      "Incorrecta: los músculos pectíneos son propios de las aurículas.",
      "Correcta: el aparato subvalvular mantiene la coaptación valvular y evita la eversión hacia las aurículas.",
      "Incorrecta: la cresta terminal delimita regiones de la aurícula derecha.",
      "Incorrecta: los senos aórticos pertenecen a la raíz de la aorta."
    ]
  },
  {
    id: "mc-07",
    topic: "Relaciones cardíacas",
    question: "La cara diafragmática del corazón se relaciona de forma inmediata con:",
    options: ["Esternón", "Pulmones", "Centro tendinoso del diafragma", "Tráquea", "Cúpula pleural cervical"],
    correctIndex: 2,
    explanations: [
      "Incorrecta: el esternón se relaciona con la cara esternocostal.",
      "Incorrecta: las relaciones pulmonares son laterales.",
      "Correcta: la cara inferior o diafragmática descansa sobre el diafragma, especialmente su centro tendinoso.",
      "Incorrecta: la tráquea es posterior y superior en el mediastino.",
      "Incorrecta: la cúpula pleural es cervical y no inmediata al corazón."
    ]
  },
  {
    id: "mc-08",
    topic: "Tabiques",
    question: "La porción membranosa del tabique interventricular tiene importancia clínica porque:",
    options: ["Es la porción más gruesa del tabique", "Es una zona frecuente de comunicación interventricular", "Contiene músculos pectíneos", "Forma el vértice cardíaco", "Recibe venas pulmonares"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: la porción muscular es mucho más extensa y gruesa.",
      "Correcta: la porción membranosa es una región vulnerable y frecuente en defectos septales.",
      "Incorrecta: los músculos pectíneos son auriculares.",
      "Incorrecta: el vértice corresponde al ventrículo izquierdo.",
      "Incorrecta: las venas pulmonares desembocan en la aurícula izquierda."
    ]
  },
  {
    id: "mc-09",
    topic: "Configuración externa",
    question: "El borde derecho del corazón está formado principalmente por:",
    options: ["Ventrículo izquierdo", "Aurícula derecha", "Aurícula izquierda", "Tronco pulmonar", "Ventrículo derecho"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el ventrículo izquierdo forma el borde izquierdo e inferior.",
      "Correcta: la aurícula derecha define el borde derecho entre las venas cavas.",
      "Incorrecta: la aurícula izquierda es posterior.",
      "Incorrecta: el tronco pulmonar es superior y anterior.",
      "Incorrecta: el ventrículo derecho predomina en la cara anterior, no en el borde derecho."
    ]
  },
  {
    id: "mc-10",
    topic: "Anatomía topográfica",
    question: "En el mediastino, el corazón se ubica principalmente en:",
    options: ["Mediastino superior", "Mediastino posterior", "Mediastino medio", "Mediastino anterior exclusivamente", "Región retroperitoneal torácica"],
    correctIndex: 2,
    explanations: [
      "Incorrecta: el mediastino superior contiene grandes vasos, tráquea y esófago proximal.",
      "Incorrecta: el mediastino posterior aloja estructuras como esófago y aorta torácica descendente.",
      "Correcta: el corazón y pericardio ocupan el mediastino medio.",
      "Incorrecta: el mediastino anterior no contiene el corazón como contenido principal.",
      "Incorrecta: no existe una región retroperitoneal torácica para el corazón."
    ]
  },
  {
    id: "mc-11",
    topic: "Relaciones cardíacas",
    question: "La orejuela izquierda se relaciona topográficamente con:",
    options: ["La raíz del tronco pulmonar", "La vena cava inferior", "La válvula tricúspide", "El seno coronario", "El ligamento arterioso exclusivamente"],
    correctIndex: 0,
    explanations: [
      "Correcta: la orejuela izquierda se proyecta anteriormente y puede abrazar la raíz del tronco pulmonar.",
      "Incorrecta: la vena cava inferior desemboca en la aurícula derecha.",
      "Incorrecta: la válvula tricúspide está en el lado derecho.",
      "Incorrecta: el seno coronario se abre en la aurícula derecha.",
      "Incorrecta: el ligamento arterioso es relación de grandes vasos, no de la orejuela exclusivamente."
    ]
  },
  {
    id: "mc-12",
    topic: "Válvulas",
    question: "La válvula aórtica se caracteriza por:",
    options: ["Poseer dos valvas y cuerdas tendinosas", "Tener tres valvas semilunares sin cuerdas tendinosas", "Ser la válvula auriculoventricular izquierda", "Comunicar aurícula derecha y ventrículo derecho", "Estar sostenida por músculos papilares"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: la válvula aórtica es tricúspide semilunar y no posee cuerdas.",
      "Correcta: sus valvas semilunares regulan el flujo entre ventrículo izquierdo y aorta.",
      "Incorrecta: la válvula auriculoventricular izquierda es la mitral.",
      "Incorrecta: esa comunicación corresponde a la tricúspide.",
      "Incorrecta: los músculos papilares sostienen válvulas auriculoventriculares."
    ]
  },
  {
    id: "mc-13",
    topic: "Configuración externa",
    question: "El surco coronario separa principalmente:",
    options: ["Ambos ventrículos", "Aurículas de ventrículos", "Aorta de tronco pulmonar", "Venas pulmonares entre sí", "Tabique muscular de tabique membranoso"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: los ventrículos se separan por los surcos interventriculares.",
      "Correcta: el surco coronario o auriculoventricular delimita aurículas y ventrículos.",
      "Incorrecta: los grandes vasos no son separados por este surco.",
      "Incorrecta: las venas pulmonares desembocan en la aurícula izquierda.",
      "Incorrecta: esa distinción es interna del tabique interventricular."
    ]
  },
  {
    id: "mc-14",
    topic: "Relaciones cardíacas",
    question: "La cara pulmonar izquierda del corazón está formada principalmente por:",
    options: ["Aurícula derecha", "Ventrículo izquierdo", "Ventrículo derecho", "Seno venoso", "Tronco pulmonar"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: la aurícula derecha forma el borde derecho.",
      "Correcta: el ventrículo izquierdo constituye gran parte de la cara pulmonar izquierda.",
      "Incorrecta: el ventrículo derecho domina la cara anterior.",
      "Incorrecta: el seno venoso es concepto embriológico y región auricular derecha.",
      "Incorrecta: el tronco pulmonar es un gran vaso, no una cara cardíaca."
    ]
  },
  {
    id: "mc-15",
    topic: "Anatomía topográfica",
    question: "La proyección del foco mitral en la exploración clínica se localiza clásicamente en:",
    options: ["Segundo espacio intercostal derecho", "Segundo espacio intercostal izquierdo", "Quinto espacio intercostal izquierdo, línea medioclavicular", "Borde esternal inferior derecho", "Región epigástrica"],
    correctIndex: 2,
    explanations: [
      "Incorrecta: corresponde al foco aórtico.",
      "Incorrecta: corresponde al foco pulmonar.",
      "Correcta: el foco mitral coincide con la región apical.",
      "Incorrecta: se aproxima al foco tricuspídeo.",
      "Incorrecta: no es la localización clásica de auscultación mitral."
    ]
  },
  {
    id: "mc-16",
    topic: "Tabiques",
    question: "El tabique interauricular contiene como referencia anatómica de la circulación fetal:",
    options: ["Fosa oval", "Cresta supraventricular", "Músculo papilar anterior", "Trabécula septomarginal", "Seno aórtico derecho"],
    correctIndex: 0,
    explanations: [
      "Correcta: la fosa oval es el remanente anatómico del foramen oval.",
      "Incorrecta: la cresta supraventricular pertenece al ventrículo derecho.",
      "Incorrecta: los músculos papilares son ventriculares.",
      "Incorrecta: la trabécula septomarginal se ubica en el ventrículo derecho.",
      "Incorrecta: los senos aórticos pertenecen a la raíz aórtica."
    ]
  },
  {
    id: "mc-17",
    topic: "Válvulas",
    question: "La insuficiencia mitral afecta primariamente el flujo entre:",
    options: ["Ventrículo derecho y arteria pulmonar", "Aurícula izquierda y ventrículo izquierdo", "Ventrículo izquierdo y aorta", "Aurícula derecha y ventrículo derecho", "Venas cavas y aurícula derecha"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: corresponde al circuito pulmonar semilunar.",
      "Correcta: la incompetencia mitral permite regurgitación del ventrículo izquierdo hacia la aurícula izquierda.",
      "Incorrecta: esa relación corresponde a la válvula aórtica.",
      "Incorrecta: esa relación corresponde a la válvula tricúspide.",
      "Incorrecta: las venas cavas no tienen una válvula equivalente funcional en ese punto."
    ]
  },
  {
    id: "mc-18",
    topic: "Relaciones cardíacas",
    question: "La arteria interventricular anterior discurre por:",
    options: ["Surco coronario derecho", "Surco interventricular anterior", "Surco terminal", "Seno coronario", "Surco interventricular posterior exclusivamente"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el surco coronario derecho aloja principalmente ramas coronarias derechas.",
      "Correcta: la arteria interventricular anterior desciende por el surco homónimo anterior.",
      "Incorrecta: el surco terminal está en la aurícula derecha.",
      "Incorrecta: el seno coronario es venoso.",
      "Incorrecta: el surco posterior aloja la arteria interventricular posterior."
    ]
  },
  {
    id: "mc-19",
    topic: "Configuración externa",
    question: "El cono arterioso pertenece al tracto de salida de:",
    options: ["Ventrículo derecho", "Ventrículo izquierdo", "Aurícula derecha", "Aurícula izquierda", "Seno coronario"],
    correctIndex: 0,
    explanations: [
      "Correcta: el cono arterioso o infundíbulo conduce la sangre del ventrículo derecho hacia el tronco pulmonar.",
      "Incorrecta: el tracto de salida izquierdo conduce hacia la aorta.",
      "Incorrecta: las aurículas no poseen cono arterioso.",
      "Incorrecta: la aurícula izquierda recibe venas pulmonares.",
      "Incorrecta: el seno coronario es una estructura venosa."
    ]
  },
  {
    id: "mc-20",
    topic: "Anatomía topográfica",
    question: "Una comprensión topográfica correcta del corazón exige reconocer que su eje largo se orienta:",
    options: ["Vertical puro, paralelo al esternón", "Transversal puro, de derecha a izquierda", "Oblicuo, de posterior-superior-derecho a anterior-inferior-izquierdo", "De inferior a superior exclusivamente", "De izquierda a derecha y posterior"],
    correctIndex: 2,
    explanations: [
      "Incorrecta: el corazón no se dispone verticalmente de forma pura.",
      "Incorrecta: el eje no es transversal puro.",
      "Correcta: el eje cardíaco es oblicuo y explica la localización del vértice y la base.",
      "Incorrecta: reduce en exceso la orientación tridimensional.",
      "Incorrecta: invierte el vector predominante del eje cardíaco."
    ]
  }
];

const trueFalseQuestions = [
  ["tf-01", "Configuración externa", "El ventrículo derecho forma la mayor parte de la cara esternocostal del corazón.", true, "La superficie anterior está dominada por el ventrículo derecho, con contribución menor de otras cavidades."],
  ["tf-02", "Relaciones cardíacas", "La aurícula izquierda constituye la mayor parte de la base cardíaca.", true, "La base es posterior y está formada principalmente por la aurícula izquierda y sus venas pulmonares."],
  ["tf-03", "Válvulas", "La válvula mitral posee tres valvas principales.", false, "La mitral es bicúspide; la tricúspide posee tres valvas."],
  ["tf-04", "Tabiques", "La porción membranosa del tabique interventricular es extensa y muscular.", false, "Es pequeña y fibrosa; la porción muscular es la extensa."],
  ["tf-05", "Anatomía topográfica", "El corazón se localiza principalmente en el mediastino medio.", true, "El pericardio y corazón son contenidos centrales del mediastino medio."],
  ["tf-06", "Configuración externa", "El surco coronario separa externamente aurículas de ventrículos.", true, "También se denomina surco auriculoventricular."],
  ["tf-07", "Relaciones cardíacas", "La cara diafragmática se relaciona directamente con el centro tendinoso del diafragma.", true, "Por su posición inferior, descansa sobre el diafragma."],
  ["tf-08", "Válvulas", "Las válvulas semilunares poseen cuerdas tendinosas.", false, "Las cuerdas tendinosas pertenecen al aparato valvular auriculoventricular."],
  ["tf-09", "Configuración externa", "El vértice cardíaco corresponde principalmente al ventrículo izquierdo.", true, "El ventrículo izquierdo forma el ápice cardíaco."],
  ["tf-10", "Relaciones cardíacas", "La vena cava inferior desemboca en la aurícula izquierda.", false, "Desemboca en la aurícula derecha."],
  ["tf-11", "Tabiques", "La fosa oval se observa en el tabique interauricular.", true, "Es remanente del foramen oval fetal."],
  ["tf-12", "Válvulas", "La válvula pulmonar comunica el ventrículo derecho con el tronco pulmonar.", true, "Es la válvula semilunar del tracto de salida derecho."],
  ["tf-13", "Anatomía topográfica", "El foco aórtico se ausculta clásicamente en el segundo espacio intercostal derecho.", true, "Es la referencia clínica tradicional para la válvula aórtica."],
  ["tf-14", "Configuración externa", "El borde derecho cardíaco está formado principalmente por el ventrículo izquierdo.", false, "Está formado principalmente por la aurícula derecha."],
  ["tf-15", "Relaciones cardíacas", "La cara pulmonar izquierda se relaciona con el pulmón izquierdo.", true, "El ventrículo izquierdo contribuye a esa cara lateral."],
  ["tf-16", "Válvulas", "Los músculos papilares se contraen para abrir activamente las valvas AV.", false, "Su función es tensar las cuerdas y evitar el prolapso durante la sístole."],
  ["tf-17", "Configuración externa", "La arteria interventricular anterior acompaña el surco interventricular anterior.", true, "Recorre el surco entre los ventrículos en la cara anterior."],
  ["tf-18", "Tabiques", "Una comunicación interventricular compromete la separación entre circulación sistémica y pulmonar.", true, "Permite mezcla o cortocircuito entre ventrículos."],
  ["tf-19", "Relaciones cardíacas", "La base cardíaca mira predominantemente hacia anterior e inferior.", false, "La base mira principalmente posterior, superior y derecha."],
  ["tf-20", "Anatomía topográfica", "La orientación oblicua del corazón explica que el ventrículo derecho sea más anterior.", true, "La rotación y posición del órgano ubican el ventrículo derecho contra la pared anterior."]
].map(([id, topic, statement, correctAnswer, explanation]) => ({ id, topic, statement, correctAnswer, explanation }));

const matchingExercises = [
  {
    id: "match-01",
    topic: "Configuración externa",
    title: "Surcos y referencias externas",
    explanation: "Los surcos cardíacos son referencias topográficas que traducen divisiones internas entre cavidades y rutas vasculares.",
    pairs: [
      ["Surco coronario", "Separa aurículas de ventrículos"],
      ["Surco interventricular anterior", "Marca el límite anterior entre ventrículos"],
      ["Surco interventricular posterior", "Referencia inferior-posterior entre ventrículos"],
      ["Vértice cardíaco", "Extremo formado por el ventrículo izquierdo"],
      ["Borde derecho", "Formado principalmente por la aurícula derecha"]
    ]
  },
  {
    id: "match-02",
    topic: "Válvulas",
    title: "Válvulas y flujos",
    explanation: "Cada válvula está definida por la cámara de origen, destino y morfología funcional.",
    pairs: [
      ["Tricúspide", "Aurícula derecha hacia ventrículo derecho"],
      ["Mitral", "Aurícula izquierda hacia ventrículo izquierdo"],
      ["Pulmonar", "Ventrículo derecho hacia tronco pulmonar"],
      ["Aórtica", "Ventrículo izquierdo hacia aorta"],
      ["Cuerdas tendinosas", "Fijan valvas auriculoventriculares"]
    ]
  },
  {
    id: "match-03",
    topic: "Relaciones cardíacas",
    title: "Caras cardíacas y relaciones",
    explanation: "Las caras cardíacas explican la relación del corazón con pared torácica, pulmones, diafragma y mediastino.",
    pairs: [
      ["Cara esternocostal", "Se orienta hacia esternón y costillas"],
      ["Cara diafragmática", "Descansa sobre el diafragma"],
      ["Base cardíaca", "Relación posterior, formada por aurícula izquierda"],
      ["Cara pulmonar izquierda", "Predominantemente ventricular izquierda"],
      ["Mediastino medio", "Compartimento del pericardio y corazón"]
    ]
  },
  {
    id: "match-04",
    topic: "Tabiques",
    title: "Tabiques y cavidades",
    explanation: "La arquitectura septal organiza la separación de circuitos y tiene relevancia en defectos congénitos.",
    pairs: [
      ["Tabique interauricular", "Contiene la fosa oval"],
      ["Tabique interventricular muscular", "Porción más extensa del tabique ventricular"],
      ["Tabique interventricular membranoso", "Zona frecuente de comunicaciones"],
      ["Aurícula derecha", "Recibe venas cavas y seno coronario"],
      ["Aurícula izquierda", "Recibe venas pulmonares"]
    ]
  },
  {
    id: "match-05",
    topic: "Anatomía topográfica",
    title: "Aplicación clínica y topográfica",
    explanation: "La exploración clínica utiliza proyecciones anatómicas para interpretar focos, ejes y relaciones funcionales.",
    pairs: [
      ["Foco mitral", "Quinto espacio intercostal izquierdo"],
      ["Foco aórtico", "Segundo espacio intercostal derecho"],
      ["Foco pulmonar", "Segundo espacio intercostal izquierdo"],
      ["Eje cardíaco", "Oblicuo hacia abajo, delante e izquierda"],
      ["Insuficiencia mitral", "Regurgitación hacia aurícula izquierda"]
    ]
  }
].map(exercise => ({
  ...exercise,
  options: exercise.pairs.map(([, answer], index) => ({ id: `${exercise.id}-opt-${index}`, text: answer })),
  pairs: exercise.pairs.map(([prompt, answer], index) => ({
    id: `${exercise.id}-pair-${index}`,
    prompt,
    correctOptionId: `${exercise.id}-opt-${index}`
  }))
}));

const shortQuestions = [
  ["short-01", "Configuración externa", "Explique por qué el ventrículo derecho domina la cara esternocostal del corazón.", "Por la orientación oblicua del corazón, el ventrículo derecho queda situado anteriormente contra el esternón y las costillas, formando la mayor parte de la superficie esternocostal."],
  ["short-02", "Relaciones cardíacas", "Describa la base cardíaca y sus principales relaciones.", "La base es posterior, formada sobre todo por la aurícula izquierda; recibe las venas pulmonares y se relaciona con estructuras del mediastino posterior, como esófago y aorta descendente."],
  ["short-03", "Válvulas", "Compare la válvula mitral con la tricúspide desde el punto de vista anatómico.", "La mitral es la válvula AV izquierda, bicúspide y sometida a presiones sistémicas; la tricúspide es AV derecha, de tres valvas y relacionada con el circuito pulmonar."],
  ["short-04", "Tabiques", "Explique la importancia clínica de la porción membranosa del tabique interventricular.", "Es una región pequeña y fibrosa, cercana al esqueleto cardíaco, donde son relativamente frecuentes las comunicaciones interventriculares congénitas."],
  ["short-05", "Anatomía topográfica", "Describa el eje anatómico del corazón y su relevancia para localizar el vértice.", "El eje va de posterior-superior-derecho a anterior-inferior-izquierdo; por ello el vértice se proyecta hacia el quinto espacio intercostal izquierdo."],
  ["short-06", "Válvulas", "Explique la función de músculos papilares y cuerdas tendinosas.", "Forman el aparato subvalvular AV, tensan las valvas durante la sístole y evitan su prolapso hacia las aurículas."],
  ["short-07", "Relaciones cardíacas", "Relacionar cara diafragmática, ventrículos y diafragma.", "La cara diafragmática es inferior, formada por ambos ventrículos con predominio izquierdo, y descansa sobre el centro tendinoso del diafragma."],
  ["short-08", "Configuración externa", "Defina el surco coronario y su valor topográfico.", "Es el surco auriculoventricular que separa externamente aurículas de ventrículos y aloja vasos coronarios."],
  ["short-09", "Relaciones cardíacas", "Explique por qué la aurícula izquierda se considera una cavidad posterior.", "Por su ubicación en la base cardíaca, detrás de los ventrículos, recibiendo las venas pulmonares y en relación con el esófago."],
  ["short-10", "Válvulas", "Describa las diferencias entre válvulas semilunares y auriculoventriculares.", "Las semilunares regulan salidas ventriculares y no poseen cuerdas; las AV comunican aurículas con ventrículos y poseen aparato subvalvular."],
  ["short-11", "Tabiques", "Explique la diferencia entre tabique interauricular e interventricular.", "El interauricular separa aurículas y contiene la fosa oval; el interventricular separa ventrículos y tiene porciones muscular y membranosa."],
  ["short-12", "Anatomía topográfica", "Justifique la localización del foco mitral.", "El foco mitral se proyecta sobre el área apical, en quinto espacio intercostal izquierdo, donde se transmite mejor el sonido de la válvula mitral."],
  ["short-13", "Configuración externa", "Describa el borde derecho del corazón.", "Está constituido principalmente por la aurícula derecha, extendiéndose entre la vena cava superior e inferior."],
  ["short-14", "Relaciones cardíacas", "Explique la relación del corazón con el mediastino.", "El corazón está dentro del pericardio en el mediastino medio, entre cavidades pleurales, posterior al esternón y superior al diafragma."],
  ["short-15", "Válvulas", "Explique cómo una insuficiencia mitral altera la dirección del flujo.", "Durante la sístole ventricular, la falta de coaptación permite regurgitación desde ventrículo izquierdo a aurícula izquierda."],
  ["short-16", "Configuración externa", "Describa la importancia del surco interventricular anterior.", "Marca la separación superficial de los ventrículos y contiene la arteria interventricular anterior con venas acompañantes."],
  ["short-17", "Tabiques", "Explique qué representa la fosa oval.", "Es el remanente del foramen oval fetal en el tabique interauricular, visible en la aurícula derecha."],
  ["short-18", "Relaciones cardíacas", "Describa la cara pulmonar izquierda.", "Es una superficie lateral orientada hacia el pulmón izquierdo, formada principalmente por el ventrículo izquierdo."],
  ["short-19", "Anatomía topográfica", "Explique por qué el corazón no debe estudiarse como un órgano vertical.", "Su eje es oblicuo y rotado, de modo que las cavidades no se disponen en un plano simple; esto modifica caras, bordes y proyecciones clínicas."],
  ["short-20", "Válvulas", "Integre aparato valvular y anatomía funcional ventricular.", "La contracción ventricular aumenta presión; el aparato valvular AV mantiene cierre competente, mientras las semilunares se abren para permitir eyección."]
].map(([id, topic, question, expectedAnswer]) => ({ id, topic, question, expectedAnswer }));

const fillQuestions = [
  ["fill-01", "Anatomía topográfica", "El corazón ocupa principalmente el mediastino ____.", "medio", ["mediastino medio"]],
  ["fill-02", "Válvulas", "La válvula ____ posee tres valvas.", "tricúspide", ["tricuspide"]],
  ["fill-03", "Configuración externa", "El vértice cardíaco corresponde al ventrículo ____.", "izquierdo", []],
  ["fill-04", "Tabiques", "El tabique interventricular es convexo hacia la cavidad ventricular ____.", "derecha", []],
  ["fill-05", "Válvulas", "Las arterias coronarias nacen de los senos de ____.", "valsalva", ["aorta", "senos aorticos", "senos aórticos"]],
  ["fill-06", "Relaciones cardíacas", "La cara diafragmática descansa sobre el ____.", "diafragma", []],
  ["fill-07", "Configuración externa", "El surco ____ separa aurículas de ventrículos.", "coronario", ["auriculoventricular"]],
  ["fill-08", "Relaciones cardíacas", "La aurícula izquierda forma gran parte de la ____ cardíaca.", "base", []],
  ["fill-09", "Válvulas", "Las cuerdas tendinosas se insertan en músculos ____.", "papilares", []],
  ["fill-10", "Tabiques", "La fosa oval se ubica en el tabique ____.", "interauricular", ["interatrial"]]
].map(([id, topic, prompt, answer, acceptedAnswers]) => ({ id, topic, prompt, answer, acceptedAnswers }));

const brainMultipleChoiceQuestions = [
  {
    id: "brain-mc-01",
    topic: "Corte sagital mediano",
    question: "En un corte sagital mediano del encéfalo, ¿cuál estructura constituye la principal comisura interhemisférica?",
    options: ["Fórnix", "Cuerpo calloso", "Comisura posterior", "Septum pellucidum", "Tálamo"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el fórnix pertenece al sistema límbico y no es la gran comisura entre hemisferios.",
      "Correcta: el cuerpo calloso es la mayor comisura interhemisférica y conecta áreas corticales homólogas.",
      "Incorrecta: la comisura posterior es pequeña y se relaciona con reflejos pupilares y región mesencefálica.",
      "Incorrecta: el septum pellucidum es una lámina medial entre cuerpo calloso y fórnix.",
      "Incorrecta: el tálamo es un relevo diencefálico, no una comisura cortical."
    ]
  },
  {
    id: "brain-mc-02",
    topic: "Sistema ventricular",
    question: "El acueducto cerebral observado en el plano sagital comunica anatómicamente:",
    options: ["Ventrículo lateral y tercer ventrículo", "Tercer ventrículo y cuarto ventrículo", "Cuarto ventrículo y canal central cervical", "Cisterna magna y ventrículo lateral", "Asta temporal y asta occipital"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: esa comunicación corresponde a los forámenes interventriculares.",
      "Correcta: el acueducto cerebral atraviesa el mesencéfalo y conecta el tercer con el cuarto ventrículo.",
      "Incorrecta: el cuarto ventrículo puede continuar hacia el canal central, pero no mediante el acueducto.",
      "Incorrecta: la cisterna magna pertenece al espacio subaracnoideo.",
      "Incorrecta: esas astas son porciones del ventrículo lateral."
    ]
  },
  {
    id: "brain-mc-03",
    topic: "Diencéfalo",
    question: "¿Cuál relación topográfica define mejor al tercer ventrículo en el corte sagital mediano?",
    options: ["Se ubica dentro del cerebelo", "Se encuentra entre estructuras diencefálicas", "Está posterior al cuarto ventrículo", "Ocupa el interior del puente", "Se localiza lateral al cuerpo calloso"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el cerebelo se relaciona con el cuarto ventrículo, no contiene el tercero.",
      "Correcta: el tercer ventrículo es una cavidad impar del diencéfalo, entre tálamos e hipotálamo.",
      "Incorrecta: el tercer ventrículo es superior y anterior al cuarto ventrículo.",
      "Incorrecta: el puente se relaciona con la pared anterior del cuarto ventrículo.",
      "Incorrecta: el cuerpo calloso está superior; el tercer ventrículo es medial e inferior."
    ]
  },
  {
    id: "brain-mc-04",
    topic: "Relaciones anatómicas",
    question: "La hipófisis se localiza en la silla turca y se relaciona superiormente de forma relevante con:",
    options: ["Vermis cerebeloso", "Quiasma óptico e hipotálamo", "Bulbo raquídeo", "Surco calcarino", "Cuerpo calloso"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el vermis está en la línea media del cerebelo, posterior al tronco encefálico.",
      "Correcta: la hipófisis se ubica inferior al hipotálamo y cerca del quiasma óptico.",
      "Incorrecta: el bulbo está caudal al puente y lejos de la silla turca.",
      "Incorrecta: el surco calcarino es occipital y cortical.",
      "Incorrecta: el cuerpo calloso es superior y telencefálico."
    ]
  },
  {
    id: "brain-mc-05",
    topic: "Cerebelo",
    question: "En la línea media del cerebelo, visible en el corte sagital, la estructura que une funcionalmente ambos hemisferios cerebelosos es:",
    options: ["Vermis", "Tálamo", "Fórnix", "Mesencéfalo", "Quiasma óptico"],
    correctIndex: 0,
    explanations: [
      "Correcta: el vermis es la porción media del cerebelo y participa en coordinación axial y postural.",
      "Incorrecta: el tálamo pertenece al diencéfalo.",
      "Incorrecta: el fórnix es una vía límbica telencefálica.",
      "Incorrecta: el mesencéfalo forma parte del tronco encefálico.",
      "Incorrecta: el quiasma óptico pertenece a la vía visual basal."
    ]
  },
  {
    id: "brain-mc-06",
    topic: "Corte sagital mediano",
    question: "¿Qué porción del cuerpo calloso corresponde a su extremo posterior engrosado?",
    options: ["Rodilla", "Rostro", "Tronco", "Esplenio", "Comisura anterior"],
    correctIndex: 3,
    explanations: [
      "Incorrecta: la rodilla es la curvatura anterior del cuerpo calloso.",
      "Incorrecta: el rostro es la prolongación inferoanterior.",
      "Incorrecta: el tronco es la porción central.",
      "Correcta: el esplenio es el extremo posterior engrosado del cuerpo calloso.",
      "Incorrecta: la comisura anterior es otra comisura, independiente del cuerpo calloso."
    ]
  },
  {
    id: "brain-mc-07",
    topic: "Neuroanatomía funcional",
    question: "El fórnix se interpreta anatómicamente como una vía relacionada principalmente con:",
    options: ["Sistema piramidal motor", "Circuitos límbicos y memoria", "Audición primaria", "Vía somatosensitiva espinotalámica", "Control directo de músculos extraoculares"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el sistema piramidal desciende por cápsula interna, tronco y médula.",
      "Correcta: el fórnix conecta formación hipocampal con cuerpos mamilares y otras regiones límbicas.",
      "Incorrecta: la audición primaria se relaciona con corteza temporal y vías auditivas.",
      "Incorrecta: la vía espinotalámica asciende por tronco y tálamo.",
      "Incorrecta: el control ocular depende de núcleos del tronco y vías supranucleares."
    ]
  },
  {
    id: "brain-mc-08",
    topic: "Diencéfalo",
    question: "El tálamo, visto en relación con el tercer ventrículo, se reconoce principalmente como:",
    options: ["Centro de relevo sensitivo y motor hacia la corteza", "Glándula endocrina alojada en la silla turca", "Porción caudal del tronco encefálico", "Comisura interhemisférica mayor", "Corteza visual primaria"],
    correctIndex: 0,
    explanations: [
      "Correcta: el tálamo es un relevo diencefálico esencial para múltiples vías hacia la corteza.",
      "Incorrecta: esa descripción corresponde a la hipófisis.",
      "Incorrecta: la porción caudal del tronco corresponde al bulbo.",
      "Incorrecta: la comisura mayor es el cuerpo calloso.",
      "Incorrecta: la corteza visual primaria se localiza alrededor del surco calcarino."
    ]
  },
  {
    id: "brain-mc-09",
    topic: "Diencéfalo",
    question: "El hipotálamo forma parte del piso y paredes inferiores del tercer ventrículo y se asocia de manera predominante con:",
    options: ["Coordinación fina de los miembros", "Regulación neuroendocrina y autónoma", "Decusación piramidal exclusiva", "Procesamiento auditivo cortical", "Producción mecánica de líquido cefalorraquídeo"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: esa función se relaciona principalmente con el cerebelo.",
      "Correcta: el hipotálamo integra respuestas autonómicas, endocrinas, térmicas, alimentarias y homeostáticas.",
      "Incorrecta: la decusación piramidal pertenece al bulbo caudal.",
      "Incorrecta: el procesamiento auditivo cortical es temporal.",
      "Incorrecta: el LCR se produce principalmente en plexos coroideos."
    ]
  },
  {
    id: "brain-mc-10",
    topic: "Tronco encefálico",
    question: "El mesencéfalo se ubica topográficamente:",
    options: ["Entre diencéfalo y puente", "Entre puente y bulbo únicamente", "Posterior al cerebelo", "Inferior a la médula espinal", "Dentro del ventrículo lateral"],
    correctIndex: 0,
    explanations: [
      "Correcta: el mesencéfalo conecta el diencéfalo con el puente y contiene el acueducto cerebral.",
      "Incorrecta: esa relación corresponde al puente respecto del bulbo.",
      "Incorrecta: el cerebelo está posterior al tronco, no anterior al mesencéfalo.",
      "Incorrecta: la médula espinal continúa caudalmente con el bulbo.",
      "Incorrecta: el ventrículo lateral pertenece al telencéfalo."
    ]
  },
  {
    id: "brain-mc-11",
    topic: "Sistema ventricular",
    question: "El cuarto ventrículo se localiza entre:",
    options: ["Cuerpo calloso y fórnix", "Tálamos derecho e izquierdo", "Puente/bulbo anteriormente y cerebelo posteriormente", "Quiasma óptico e hipófisis", "Lóbulo frontal y lóbulo parietal"],
    correctIndex: 2,
    explanations: [
      "Incorrecta: esa relación se acerca a los ventrículos laterales y septum pellucidum.",
      "Incorrecta: entre los tálamos se ubica el tercer ventrículo.",
      "Correcta: el cuarto ventrículo se abre detrás del puente y bulbo y delante del cerebelo.",
      "Incorrecta: esa es una relación selar/supraselar.",
      "Incorrecta: no describe una cavidad ventricular."
    ]
  },
  {
    id: "brain-mc-12",
    topic: "Relaciones anatómicas",
    question: "El septum pellucidum se identifica en la línea media como una lámina situada principalmente entre:",
    options: ["Cuerpo calloso y fórnix", "Tálamo y puente", "Hipófisis y quiasma óptico", "Vermis y cuarto ventrículo", "Bulbo y médula espinal"],
    correctIndex: 0,
    explanations: [
      "Correcta: el septum pellucidum separa regiones de los ventrículos laterales entre cuerpo calloso y fórnix.",
      "Incorrecta: tálamo y puente pertenecen a niveles distintos.",
      "Incorrecta: esa relación corresponde a la región selar.",
      "Incorrecta: el vermis se relaciona con el techo del cuarto ventrículo, no con el septum.",
      "Incorrecta: esa continuidad es caudal y del tronco."
    ]
  },
  {
    id: "brain-mc-13",
    topic: "Relaciones anatómicas",
    question: "El surco calcarino se asocia anatómicamente con:",
    options: ["Corteza visual primaria", "Área motora primaria", "Centro respiratorio bulbar", "Vía olfatoria basal", "Núcleo rojo mesencefálico"],
    correctIndex: 0,
    explanations: [
      "Correcta: alrededor del surco calcarino se localiza la corteza visual primaria del lóbulo occipital.",
      "Incorrecta: el área motora primaria se sitúa en el giro precentral.",
      "Incorrecta: centros respiratorios se ubican en tronco encefálico.",
      "Incorrecta: la vía olfatoria es basal y telencefálica.",
      "Incorrecta: el núcleo rojo está en el mesencéfalo."
    ]
  },
  {
    id: "brain-mc-14",
    topic: "Corte sagital mediano",
    question: "El surco parietooccipital visible en la cara medial delimita principalmente:",
    options: ["Lóbulo temporal y lóbulo frontal", "Lóbulo parietal y lóbulo occipital", "Cerebelo y bulbo", "Tálamo e hipotálamo", "Puente y mesencéfalo"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: esa relación corresponde a otras referencias laterales.",
      "Correcta: el surco parietooccipital es una referencia medial entre los lóbulos parietal y occipital.",
      "Incorrecta: cerebelo y bulbo se separan por relaciones del cuarto ventrículo y cisternas.",
      "Incorrecta: tálamo e hipotálamo son regiones diencefálicas.",
      "Incorrecta: puente y mesencéfalo pertenecen al tronco encefálico."
    ]
  },
  {
    id: "brain-mc-15",
    topic: "Diencéfalo",
    question: "La glándula pineal o epífisis se relaciona con:",
    options: ["Techo posterior del tercer ventrículo", "Piso del cuarto ventrículo", "Silla turca", "Asta temporal del ventrículo lateral", "Decusación de las pirámides"],
    correctIndex: 0,
    explanations: [
      "Correcta: la pineal pertenece al epitálamo y se ubica en la región posterior del techo del tercer ventrículo.",
      "Incorrecta: el piso del cuarto ventrículo se relaciona con el romboencéfalo.",
      "Incorrecta: la silla turca aloja la hipófisis.",
      "Incorrecta: el asta temporal pertenece al ventrículo lateral.",
      "Incorrecta: la decusación piramidal es bulbar."
    ]
  },
  {
    id: "brain-mc-16",
    topic: "Tronco encefálico",
    question: "El puente se reconoce en el corte sagital como una prominencia del tronco encefálico situada:",
    options: ["Entre mesencéfalo y bulbo", "Entre tálamo y cuerpo calloso", "Posterior al vermis", "Dentro de la silla turca", "Superior al cuerpo calloso"],
    correctIndex: 0,
    explanations: [
      "Correcta: el puente se interpone entre el mesencéfalo y el bulbo y forma la pared anterior del cuarto ventrículo.",
      "Incorrecta: esa región es supratentorial y diencefálica/telencefálica.",
      "Incorrecta: el vermis está posterior al tronco.",
      "Incorrecta: la silla turca aloja la hipófisis.",
      "Incorrecta: el cuerpo calloso está superior y telencefálico."
    ]
  },
  {
    id: "brain-mc-17",
    topic: "Tronco encefálico",
    question: "El bulbo raquídeo se continúa caudalmente con:",
    options: ["Tálamo", "Médula espinal", "Cuerpo calloso", "Hipófisis", "Ventrículo lateral"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el tálamo es diencefálico y superior al tronco.",
      "Correcta: el bulbo constituye la transición caudal del encéfalo hacia la médula espinal.",
      "Incorrecta: el cuerpo calloso es telencefálico.",
      "Incorrecta: la hipófisis es endocrina y selar.",
      "Incorrecta: el ventrículo lateral pertenece al sistema ventricular telencefálico."
    ]
  },
  {
    id: "brain-mc-18",
    topic: "Relaciones anatómicas",
    question: "Una lesión expansiva hipofisaria puede comprometer tempranamente el quiasma óptico por su relación:",
    options: ["Posterior e inferior a la hipófisis", "Superior y anterior a la hipófisis", "Dentro del cuarto ventrículo", "En el vermis cerebeloso", "Caudal al bulbo raquídeo"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: invierte la relación anatómica principal.",
      "Correcta: el quiasma óptico se sitúa superior y anterior a la hipófisis, por eso puede comprimirse.",
      "Incorrecta: no pertenece al cuarto ventrículo.",
      "Incorrecta: el vermis es cerebeloso y posterior.",
      "Incorrecta: el bulbo está caudal y distante de la silla turca."
    ]
  },
  {
    id: "brain-mc-19",
    topic: "Sistema ventricular",
    question: "Una obstrucción del acueducto cerebral produciría dilatación predominante de:",
    options: ["Cuarto ventrículo aislado", "Ventrículos laterales y tercer ventrículo", "Canal central medular exclusivamente", "Cisterna magna sin cambios ventriculares", "Seno sagital superior"],
    correctIndex: 1,
    explanations: [
      "Incorrecta: el cuarto ventrículo queda distal a la obstrucción.",
      "Correcta: al bloquearse el acueducto se dilatan las cavidades proximales: ventrículos laterales y tercero.",
      "Incorrecta: el canal central no es la cavidad proximal principal.",
      "Incorrecta: el problema primario es intraventricular, no cisternal aislado.",
      "Incorrecta: el seno sagital superior pertenece al drenaje venoso dural."
    ]
  },
  {
    id: "brain-mc-20",
    topic: "Corte sagital mediano",
    question: "¿Qué conjunto de estructuras es característico de una lectura anatómica del corte sagital mediano del encéfalo?",
    options: ["Cuerpo calloso, fórnix, tercer ventrículo, tronco encefálico y vermis", "Ínsula, putamen, cápsula externa y claustro", "Núcleo caudado, globo pálido y tálamo lateral", "Asta temporal, hipocampo y amígdala lateral", "Corteza auditiva, opérculo frontal y surco lateral"],
    correctIndex: 0,
    explanations: [
      "Correcta: esas estructuras son referencias mediales claves para estudiar el plano sagital.",
      "Incorrecta: corresponde a estructuras profundas laterales, no al plano mediano.",
      "Incorrecta: incluye núcleos basales y relaciones laterales.",
      "Incorrecta: describe estructuras temporales mediales/laterales, no el corte mediano clásico.",
      "Incorrecta: se refiere a la superficie lateral y región silviana."
    ]
  }
];

const brainTrueFalseQuestions = [
  ["brain-tf-01", "Corte sagital mediano", "El cuerpo calloso constituye la principal comisura interhemisférica.", true, "Es la gran vía comisural que conecta áreas corticales de ambos hemisferios."],
  ["brain-tf-02", "Sistema ventricular", "El acueducto cerebral comunica los ventrículos laterales con el tercer ventrículo.", false, "Los ventrículos laterales comunican con el tercero por los forámenes interventriculares; el acueducto comunica tercero y cuarto."],
  ["brain-tf-03", "Sistema ventricular", "El cuarto ventrículo se ubica entre el tronco encefálico y el cerebelo.", true, "Su pared anterior se relaciona con puente y bulbo, y su techo con estructuras cerebelosas."],
  ["brain-tf-04", "Diencéfalo", "El tálamo pertenece al telencéfalo.", false, "El tálamo es una estructura del diencéfalo."],
  ["brain-tf-05", "Relaciones anatómicas", "La hipófisis se aloja en la silla turca.", true, "La fosa hipofisaria de la silla turca contiene la glándula hipófisis."],
  ["brain-tf-06", "Relaciones anatómicas", "El quiasma óptico está por debajo de la hipófisis.", false, "Se localiza superior y anterior respecto a la hipófisis."],
  ["brain-tf-07", "Cerebelo", "El vermis es la porción media del cerebelo.", true, "El vermis ocupa la línea media cerebelosa y conecta ambos hemisferios cerebelosos."],
  ["brain-tf-08", "Relaciones anatómicas", "El surco calcarino se relaciona con la corteza visual primaria.", true, "La corteza visual primaria se organiza alrededor del surco calcarino."],
  ["brain-tf-09", "Neuroanatomía funcional", "El fórnix es una vía motora principal del sistema piramidal.", false, "El fórnix pertenece a circuitos límbicos vinculados con memoria."],
  ["brain-tf-10", "Diencéfalo", "El hipotálamo participa en funciones neuroendocrinas y autonómicas.", true, "Integra homeostasis, eje hipotálamo-hipofisario y control autonómico."],
  ["brain-tf-11", "Diencéfalo", "La glándula pineal se ubica anterior al quiasma óptico.", false, "La pineal es posterior, en la región epitálamica del techo del tercer ventrículo."],
  ["brain-tf-12", "Relaciones anatómicas", "El septum pellucidum se sitúa entre el cuerpo calloso y el fórnix.", true, "Esa lámina contribuye a la separación medial de los ventrículos laterales."],
  ["brain-tf-13", "Tronco encefálico", "El puente se sitúa entre el mesencéfalo y el bulbo raquídeo.", true, "Es el segmento medio del tronco encefálico."],
  ["brain-tf-14", "Corte sagital mediano", "El cuerpo calloso se localiza inferior al tercer ventrículo.", false, "El cuerpo calloso es superior; el tercer ventrículo se encuentra inferior y medial en el diencéfalo."],
  ["brain-tf-15", "Tronco encefálico", "El acueducto cerebral atraviesa el mesencéfalo.", true, "Es una cavidad estrecha dentro del mesencéfalo."],
  ["brain-tf-16", "Sistema ventricular", "El tercer ventrículo es una cavidad impar y medial.", true, "Pertenece al sistema ventricular diencefálico y ocupa la línea media."],
  ["brain-tf-17", "Cerebelo", "El cerebelo se ubica anterior al puente.", false, "El cerebelo se sitúa posterior al puente y al cuarto ventrículo."],
  ["brain-tf-18", "Tronco encefálico", "El bulbo raquídeo continúa caudalmente con la médula espinal.", true, "Es la transición anatómica entre encéfalo y médula."],
  ["brain-tf-19", "Corte sagital mediano", "El surco parietooccipital es un reparo importante de la cara medial del hemisferio cerebral.", true, "Delimita regiones parietales y occipitales en la superficie medial."],
  ["brain-tf-20", "Diencéfalo", "El hipotálamo forma parte del piso y paredes inferiores del tercer ventrículo.", true, "Su relación ventricular explica su posición central en el eje neuroendocrino."]
].map(([id, topic, statement, correctAnswer, explanation]) => ({ id, topic, statement, correctAnswer, explanation }));

const brainMatchingExercises = [
  {
    id: "brain-match-01",
    topic: "Sistema ventricular",
    title: "Sistema ventricular y comunicaciones",
    explanation: "El sistema ventricular se comprende como una secuencia de cavidades comunicantes que conducen líquido cefalorraquídeo.",
    pairs: [
      ["Ventrículo lateral", "Cavidad telencefálica par"],
      ["Foramen interventricular", "Comunica ventrículo lateral con tercer ventrículo"],
      ["Tercer ventrículo", "Cavidad impar del diencéfalo"],
      ["Acueducto cerebral", "Comunica tercer y cuarto ventrículo"],
      ["Cuarto ventrículo", "Cavidad entre tronco encefálico y cerebelo"]
    ]
  },
  {
    id: "brain-match-02",
    topic: "Diencéfalo",
    title: "Estructuras diencefálicas",
    explanation: "El diencéfalo integra relevos sensitivos, control neuroendocrino y estructuras epitalámicas.",
    pairs: [
      ["Tálamo", "Relevo principal hacia la corteza"],
      ["Hipotálamo", "Regulación autonómica y endocrina"],
      ["Epífisis", "Glándula pineal del epitálamo"],
      ["Cuerpos mamilares", "Referencia límbica hipotalámica"],
      ["Quiasma óptico", "Decusación parcial de fibras visuales"]
    ]
  },
  {
    id: "brain-match-03",
    topic: "Tronco encefálico",
    title: "Tronco encefálico en plano sagital",
    explanation: "El tronco encefálico organiza continuidad anatómica entre encéfalo, cerebelo y médula espinal.",
    pairs: [
      ["Mesencéfalo", "Contiene el acueducto cerebral"],
      ["Puente", "Prominencia entre mesencéfalo y bulbo"],
      ["Bulbo raquídeo", "Continuación caudal hacia la médula espinal"],
      ["Pedúnculos cerebrales", "Relieves anteriores mesencefálicos"],
      ["Piso del cuarto ventrículo", "Relación dorsal de puente y bulbo"]
    ]
  },
  {
    id: "brain-match-04",
    topic: "Cerebelo",
    title: "Cerebelo y relaciones ventriculares",
    explanation: "El cerebelo se interpreta por su organización media, hemisférica y por su relación con el cuarto ventrículo.",
    pairs: [
      ["Vermis", "Porción media del cerebelo"],
      ["Hemisferios cerebelosos", "Porciones laterales del cerebelo"],
      ["Árbol de la vida", "Sustancia blanca cerebelosa ramificada"],
      ["Techo del cuarto ventrículo", "Relación cerebelosa posterior"],
      ["Coordinación postural", "Función asociada a regiones medianas cerebelosas"]
    ]
  },
  {
    id: "brain-match-05",
    topic: "Corte sagital mediano",
    title: "Reparos del corte sagital",
    explanation: "El corte sagital mediano permite integrar estructuras comisurales, límbicas, ventriculares y corticales mediales.",
    pairs: [
      ["Cuerpo calloso", "Principal comisura interhemisférica"],
      ["Fórnix", "Vía límbica relacionada con memoria"],
      ["Septum pellucidum", "Lámina entre cuerpo calloso y fórnix"],
      ["Surco calcarino", "Reparo de corteza visual primaria"],
      ["Surco parietooccipital", "Límite medial entre parietal y occipital"]
    ]
  }
].map(exercise => ({
  ...exercise,
  options: exercise.pairs.map(([, answer], index) => ({ id: `${exercise.id}-opt-${index}`, text: answer })),
  pairs: exercise.pairs.map(([prompt, answer], index) => ({
    id: `${exercise.id}-pair-${index}`,
    prompt,
    correctOptionId: `${exercise.id}-opt-${index}`
  }))
}));

const brainShortQuestions = [
  ["brain-short-01", "Corte sagital mediano", "Explique la importancia del corte sagital mediano para el estudio de la neuroanatomía topográfica.", "El corte sagital mediano expone estructuras impares o medias como cuerpo calloso, fórnix, tercer ventrículo, tronco encefálico, vermis y relaciones diencefálicas, permitiendo integrar cavidades, comisuras y ejes funcionales."],
  ["brain-short-02", "Sistema ventricular", "Describa la secuencia anatómica del flujo ventricular desde los ventrículos laterales hasta el cuarto ventrículo.", "El LCR pasa desde los ventrículos laterales por los forámenes interventriculares al tercer ventrículo, continúa por el acueducto cerebral en el mesencéfalo y llega al cuarto ventrículo."],
  ["brain-short-03", "Diencéfalo", "Compare tálamo e hipotálamo desde el punto de vista topográfico y funcional.", "El tálamo es un gran relevo diencefálico superior y lateral al tercer ventrículo; el hipotálamo es inferior, forma parte del piso ventricular y regula funciones autonómicas y endocrinas."],
  ["brain-short-04", "Relaciones anatómicas", "Explique la relación entre hipófisis, hipotálamo y quiasma óptico.", "La hipófisis se aloja en la silla turca, se conecta al hipotálamo por el infundíbulo y se relaciona superior/anteriormente con el quiasma óptico, lo que explica síntomas visuales en lesiones selares."],
  ["brain-short-05", "Tronco encefálico", "Describa la posición del mesencéfalo y su relación con el acueducto cerebral.", "El mesencéfalo se ubica entre diencéfalo y puente; el acueducto cerebral lo atraviesa y comunica el tercer con el cuarto ventrículo."],
  ["brain-short-06", "Cerebelo", "Explique la relevancia del vermis en el corte sagital.", "El vermis es la porción media del cerebelo, visible en el plano sagital, vinculada a coordinación axial, postura y equilibrio, y relacionada con el techo del cuarto ventrículo."],
  ["brain-short-07", "Neuroanatomía funcional", "Describa la función anatómica general del fórnix.", "El fórnix es una vía de sustancia blanca del sistema límbico que conecta la formación hipocampal con cuerpos mamilares y regiones septales, participando en circuitos de memoria."],
  ["brain-short-08", "Corte sagital mediano", "Explique las porciones principales del cuerpo calloso y su valor topográfico.", "El cuerpo calloso incluye rostro, rodilla, tronco y esplenio; su identificación orienta la lectura del telencéfalo medial y la relación con septum pellucidum y fórnix."],
  ["brain-short-09", "Sistema ventricular", "Explique por qué una obstrucción del acueducto cerebral produce hidrocefalia supratentorial.", "Al obstruirse el acueducto, se bloquea el drenaje desde el tercer al cuarto ventrículo, dilatándose las cavidades proximales: ventrículos laterales y tercer ventrículo."],
  ["brain-short-10", "Relaciones anatómicas", "Describa el septum pellucidum y sus relaciones.", "El septum pellucidum es una lámina medial fina situada entre cuerpo calloso y fórnix, relacionada con la separación de los ventrículos laterales."],
  ["brain-short-11", "Relaciones anatómicas", "Explique la relevancia del surco calcarino.", "El surco calcarino, en la cara medial occipital, es referencia topográfica de la corteza visual primaria, por lo que integra anatomía superficial y función visual."],
  ["brain-short-12", "Corte sagital mediano", "Defina la importancia del surco parietooccipital en la cara medial.", "El surco parietooccipital delimita regiones parietales y occipitales en la superficie medial, ayudando a orientar la lectura lobar del corte sagital."],
  ["brain-short-13", "Tronco encefálico", "Compare puente y bulbo en una vista sagital.", "El puente es una prominencia intermedia entre mesencéfalo y bulbo; el bulbo es caudal, continúa con la médula espinal y contiene centros vitales y vías largas."],
  ["brain-short-14", "Diencéfalo", "Explique la posición de la glándula pineal.", "La pineal pertenece al epitálamo y se ubica en la región posterior del techo del tercer ventrículo, cerca de la comisura posterior."],
  ["brain-short-15", "Neuroanatomía funcional", "Integre cerebelo, tronco encefálico y cuarto ventrículo.", "El cuarto ventrículo se interpone entre puente/bulbo y cerebelo; esta relación explica la continuidad entre vías del tronco, coordinación cerebelosa y circulación del LCR."],
  ["brain-short-16", "Relaciones anatómicas", "Explique por qué el quiasma óptico es vulnerable en tumores hipofisarios.", "Por su posición superior y anterior a la hipófisis, una expansión selar puede comprimir el quiasma y alterar fibras visuales cruzadas."],
  ["brain-short-17", "Sistema ventricular", "Describa el tercer ventrículo y sus límites generales.", "Es una cavidad impar medial del diencéfalo, relacionada lateralmente con tálamos, inferiormente con hipotálamo y posteriormente con acueducto cerebral."],
  ["brain-short-18", "Cerebelo", "Explique el significado anatómico del árbol de la vida.", "El árbol de la vida es la disposición ramificada de la sustancia blanca cerebelosa, visible en cortes sagitales y rodeada por corteza cerebelosa."],
  ["brain-short-19", "Corte sagital mediano", "Mencione estructuras que permiten reconocer que un corte es mediano y no lateral.", "La presencia de cuerpo calloso completo, fórnix medio, tercer ventrículo, vermis, tronco en línea media y relaciones hipotalámicas sugiere un corte sagital mediano."],
  ["brain-short-20", "Neuroanatomía funcional", "Explique cómo se relaciona la anatomía topográfica con la interpretación clínica neurológica.", "La topografía permite vincular estructuras con funciones; por ejemplo, lesiones del acueducto producen hidrocefalia, lesiones cerebelosas causan ataxia y compresión quiasmática altera campos visuales."]
].map(([id, topic, question, expectedAnswer]) => ({ id, topic, question, expectedAnswer }));

const brainFillQuestions = [
  ["brain-fill-01", "Corte sagital mediano", "El cuerpo ____ constituye la principal comisura interhemisférica.", "calloso", ["cuerpo calloso"]],
  ["brain-fill-02", "Sistema ventricular", "El acueducto cerebral comunica el tercer ventrículo con el ____ ventrículo.", "cuarto", ["4", "iv"]],
  ["brain-fill-03", "Cerebelo", "El vermis pertenece al ____.", "cerebelo", []],
  ["brain-fill-04", "Relaciones anatómicas", "La hipófisis se localiza en la silla ____.", "turca", ["silla turca"]],
  ["brain-fill-05", "Relaciones anatómicas", "El surco ____ se relaciona con la corteza visual primaria.", "calcarino", ["calcarina"]],
  ["brain-fill-06", "Diencéfalo", "El ____ participa en el control neuroendocrino y autonómico.", "hipotálamo", ["hipotalamo"]],
  ["brain-fill-07", "Tronco encefálico", "El acueducto cerebral atraviesa el ____.", "mesencéfalo", ["mesencefalo"]],
  ["brain-fill-08", "Neuroanatomía funcional", "El ____ es una vía límbica relacionada con memoria.", "fórnix", ["fornix"]],
  ["brain-fill-09", "Diencéfalo", "El ____ actúa como relevo sensitivo principal hacia la corteza.", "tálamo", ["talamo"]],
  ["brain-fill-10", "Relaciones anatómicas", "El septum ____ se ubica entre el cuerpo calloso y el fórnix.", "pellucidum", ["pelucido", "pellúcido"]]
].map(([id, topic, prompt, answer, acceptedAnswers]) => ({ id, topic, prompt, answer, acceptedAnswers }));

const femaleMultipleChoiceQuestions = [
  ["female-mc-01", "Relaciones pélvicas", "En un corte sagital mediano de la pelvis femenina, ¿entre qué órganos se sitúa topográficamente el útero?", ["Entre el pubis y la vejiga urinaria", "Entre la vejiga urinaria y el recto", "Entre el recto y el sacro", "Entre la uretra y el conducto anal", "Entre el ovario y la trompa uterina"], 1],
  ["female-mc-02", "Relaciones pélvicas", "¿Qué receso peritoneal se localiza entre la vejiga urinaria y el útero?", ["Fondo de saco rectouterino", "Receso paracólico", "Fondo de saco vesicouterino", "Receso hepatorrenal", "Bolsa omental"], 2],
  ["female-mc-03", "Relaciones pélvicas", "El fondo de saco rectouterino, también llamado fondo de saco de Douglas, se ubica principalmente entre:", ["Vejiga y pubis", "Uretra y vagina", "Útero/vagina posterior y recto", "Sacro y cóccix", "Ovario y pared abdominal"], 2],
  ["female-mc-04", "Órganos reproductores", "¿Cuál estructura corresponde a la porción inferior estrecha del útero que se proyecta hacia la vagina?", ["Fondo uterino", "Cuerpo uterino", "Cuello uterino o cérvix", "Trompa uterina", "Ovario"], 2],
  ["female-mc-05", "Sistema urinario asociado", "En la pelvis femenina, la uretra se localiza típicamente:", ["Anterior al canal vaginal", "Posterior al recto", "Superior al fondo uterino", "Dentro de la cavidad uterina", "Posterior al sacro"], 0],
  ["female-mc-06", "Anatomía topográfica", "¿Qué estructura ósea constituye una referencia posterior importante en el corte sagital de la pelvis femenina?", ["Pubis", "Sacro", "Isquion anterior", "Clavícula", "Esternón"], 1],
  ["female-mc-07", "Órganos reproductores", "El fondo uterino corresponde a:", ["La porción superior redondeada del útero", "El canal entre cuello uterino y vagina", "El extremo inferior del conducto anal", "El ligamento que une ovario y útero", "La pared posterior de la vejiga"], 0],
  ["female-mc-08", "Órganos reproductores", "El cuerpo uterino se define topográficamente como:", ["La porción principal del útero entre fondo y cuello", "La cavidad del recto", "La parte distal de la uretra", "El segmento externo del periné", "El borde posterior del sacro"], 0],
  ["female-mc-09", "Relaciones pélvicas", "La posición habitual de anteversión/anteflexión uterina orienta el cuerpo del útero hacia:", ["El sacro y el recto", "La vejiga urinaria", "El conducto anal", "La pared posterior del abdomen", "El cóccix"], 1],
  ["female-mc-10", "Relaciones pélvicas", "El canal vaginal se relaciona topográficamente con:", ["Uretra anterior y recto posterior", "Recto anterior y vejiga posterior", "Sacro anterior y pubis posterior", "Ovario medial y uretra posterior", "Vejiga superior y tálamo inferior"], 0],
  ["female-mc-11", "Sistema digestivo asociado", "El recto, en relación con el aparato reproductor femenino, se encuentra principalmente:", ["Anterior al útero", "Posterior al útero y a la vagina", "Dentro del cuello uterino", "Superior a la vejiga urinaria", "Lateral al pubis"], 1],
  ["female-mc-12", "Periné", "El periné tiene importancia anatómica porque:", ["Forma el techo de la cavidad torácica", "Participa en el soporte inferior de las vísceras pélvicas", "Constituye la principal comisura cerebral", "Es una cavidad del útero", "Sustituye al ligamento ancho"], 1],
  ["female-mc-13", "Órganos reproductores", "La trompa uterina se relaciona principalmente con:", ["La vejiga urinaria y la uretra", "El ovario y el útero", "El recto y el conducto anal", "El sacro y el cóccix", "El pubis y la sínfisis"], 1],
  ["female-mc-14", "Órganos reproductores", "El canal cervical comunica directamente:", ["La cavidad uterina con la vagina", "La vejiga con la uretra", "El recto con el ano", "El ovario con el saco de Douglas", "El sacro con el pubis"], 0],
  ["female-mc-15", "Anatomía topográfica", "¿Qué estructura ósea es una referencia anterior en el corte sagital pélvico femenino?", ["Sacro", "Cóccix", "Pubis", "Vértebra torácica", "Escápula"], 2],
  ["female-mc-16", "Sistema urinario asociado", "La vejiga urinaria se ubica en el compartimento pélvico:", ["Anterior al útero", "Posterior al recto", "Superior al sacro", "Dentro del conducto anal", "Lateral al encéfalo"], 0],
  ["female-mc-17", "Anatomía topográfica", "El valor académico del corte sagital femenino radica principalmente en que permite:", ["Ver únicamente huesos del cráneo", "Integrar relaciones entre órganos reproductores, urinarios y digestivos", "Evaluar solo músculos del brazo", "Sustituir la exploración anatómica tridimensional", "Mostrar exclusivamente vasos coronarios"], 1],
  ["female-mc-18", "Relaciones pélvicas", "El fórnix vaginal posterior se relaciona clínicamente con:", ["Fondo de saco rectouterino", "Fondo uterino", "Uretra femenina", "Sínfisis púbica", "Canal cervical anterior"], 0],
  ["female-mc-19", "Aplicación clínica", "La acumulación de líquido en el fondo de saco de Douglas se comprende mejor al reconocer su relación con:", ["El espacio posterior al útero y anterior al recto", "La cavidad torácica", "El ventrículo cerebral lateral", "La cara esternocostal del corazón", "El canal medular cervical"], 0],
  ["female-mc-20", "Aplicación clínica", "¿Qué enfoque integra mejor la anatomía del modelo en ginecología y obstetricia?", ["Memorizar nombres sin relaciones", "Relacionar útero, vagina, vejiga, recto, periné y referencias óseas", "Analizar solo la piel superficial", "Eliminar la orientación sagital", "Estudiar únicamente estructuras masculinas"], 1]
].map(([id, topic, question, options, correctIndex]) => ({
  id,
  topic,
  question,
  options,
  correctIndex,
  explanations: options.map((option, index) =>
    index === correctIndex
      ? `${option} es correcta porque describe la relación anatómica esperada en el corte sagital de la pelvis femenina.`
      : `${option} no corresponde a la relación topográfica principal evaluada en este modelo.`
  )
}));

const femaleTrueFalseQuestions = [
  ["female-tf-01", "Relaciones pélvicas", "El útero se sitúa entre la vejiga urinaria y el recto en el corte sagital femenino.", true],
  ["female-tf-02", "Sistema urinario asociado", "La vejiga urinaria se encuentra posterior al recto.", false],
  ["female-tf-03", "Relaciones pélvicas", "El fondo de saco rectouterino se localiza posterior al útero.", true],
  ["female-tf-04", "Órganos reproductores", "El cuello uterino corresponde a la cúpula superior del útero.", false],
  ["female-tf-05", "Sistema urinario asociado", "La uretra femenina se ubica anterior al canal vaginal.", true],
  ["female-tf-06", "Sistema digestivo asociado", "El recto se sitúa anterior a la vejiga urinaria.", false],
  ["female-tf-07", "Órganos reproductores", "El fondo uterino es la porción superior del útero.", true],
  ["female-tf-08", "Órganos reproductores", "El canal cervical comunica la cavidad uterina con la vagina.", true],
  ["female-tf-09", "Periné", "El periné no participa en el soporte anatómico del piso pélvico.", false],
  ["female-tf-10", "Anatomía topográfica", "El sacro constituye una referencia ósea posterior de la pelvis.", true],
  ["female-tf-11", "Órganos reproductores", "La trompa uterina se relaciona con el útero y el ovario.", true],
  ["female-tf-12", "Órganos reproductores", "El ovario se localiza dentro de la cavidad uterina.", false],
  ["female-tf-13", "Relaciones pélvicas", "El fondo de saco vesicouterino se ubica entre vejiga y útero.", true],
  ["female-tf-14", "Relaciones pélvicas", "La vagina se relaciona con uretra anteriormente y recto posteriormente.", true],
  ["female-tf-15", "Anatomía topográfica", "El pubis es una referencia posterior de la pelvis femenina.", false],
  ["female-tf-16", "Aplicación clínica", "El fondo de saco de Douglas tiene relevancia clínica por acumulación de líquido pélvico.", true],
  ["female-tf-17", "Relaciones pélvicas", "La anteflexión describe una relación angular entre cuerpo y cuello uterino.", true],
  ["female-tf-18", "Sistema digestivo asociado", "El conducto anal se ubica superior a la cavidad uterina.", false],
  ["female-tf-19", "Aplicación clínica", "El corte sagital ayuda a correlacionar anatomía pélvica con imagen ginecológica.", true],
  ["female-tf-20", "Órganos reproductores", "El cérvix forma parte del útero.", true]
].map(([id, topic, statement, answer]) => ({
  id,
  topic,
  statement,
  correctAnswer: answer,
  explanation: answer
    ? "La afirmación es verdadera según la disposición topográfica clásica de la pelvis femenina."
    : "La afirmación es falsa porque invierte o desplaza una relación anatómica fundamental del corte sagital femenino."
}));

const femaleMatchingExercises = [
  {
    id: "female-match-01",
    topic: "Relaciones pélvicas",
    prompt: "Relacione cada estructura con su posición topográfica principal.",
    left: ["Útero", "Vejiga urinaria", "Recto", "Pubis", "Sacro"],
    right: ["Órgano central entre vejiga y recto", "Relación anterior al útero", "Relación posterior al útero y vagina", "Referencia ósea anterior", "Referencia ósea posterior"],
    correct: [0, 1, 2, 3, 4],
    explanation: "La lectura sagital organiza la pelvis en relaciones anterior, media y posterior."
  },
  {
    id: "female-match-02",
    topic: "Órganos reproductores",
    prompt: "Relacione las partes uterinas con su descripción.",
    left: ["Fondo uterino", "Cuerpo uterino", "Cuello uterino", "Cavidad uterina", "Canal cervical"],
    right: ["Porción superior redondeada", "Porción principal entre fondo y cuello", "Segmento inferior proyectado hacia vagina", "Luz interna del útero", "Comunicación entre cavidad uterina y vagina"],
    correct: [0, 1, 2, 3, 4],
    explanation: "Las porciones uterinas permiten orientar el eje reproductor en el modelo."
  },
  {
    id: "female-match-03",
    topic: "Relaciones pélvicas",
    prompt: "Relacione los recesos y referencias peritoneales.",
    left: ["Fondo de saco vesicouterino", "Fondo de saco rectouterino", "Fórnix vaginal posterior", "Peritoneo pélvico", "Douglas"],
    right: ["Entre vejiga y útero", "Entre útero/vagina posterior y recto", "Relación próxima al receso rectouterino", "Forma recesos sobre vísceras pélvicas", "Nombre clínico del fondo de saco rectouterino"],
    correct: [0, 1, 2, 3, 4],
    explanation: "Los recesos peritoneales son claves para comprender anatomía clínica pélvica."
  },
  {
    id: "female-match-04",
    topic: "Conductos anatómicos",
    prompt: "Relacione cada conducto con su función o continuidad.",
    left: ["Vagina", "Uretra femenina", "Conducto anal", "Trompa uterina", "Canal cervical"],
    right: ["Canal reproductor inferior", "Conduce orina desde la vejiga", "Segmento terminal digestivo", "Relaciona útero con ovario", "Une cavidad uterina con vagina"],
    correct: [0, 1, 2, 3, 4],
    explanation: "Distinguir conductos evita confundir sistemas reproductor, urinario y digestivo."
  },
  {
    id: "female-match-05",
    topic: "Aplicación clínica",
    prompt: "Relacione cada concepto con su relevancia clínica.",
    left: ["Fondo de saco de Douglas", "Cérvix", "Vejiga distendida", "Cuerpo perineal", "Sacro"],
    right: ["Puede acumular líquido pélvico", "Accesible en exploración ginecológica", "Modifica relaciones anteriores", "Soporte del piso pélvico", "Referencia del eje pélvico posterior"],
    correct: [0, 1, 2, 3, 4],
    explanation: "La anatomía topográfica fundamenta la exploración, imagen y razonamiento gineco-obstétrico."
  }
].map(exercise => ({
  ...exercise,
  options: exercise.right.map((answer, index) => ({ id: `${exercise.id}-opt-${index}`, text: answer })),
  pairs: exercise.left.map((prompt, index) => ({
    id: `${exercise.id}-pair-${index}`,
    prompt,
    correctOptionId: `${exercise.id}-opt-${index}`
  }))
}));

const femaleShortQuestions = [
  ["female-short-01", "Anatomía topográfica", "Explique la importancia del corte sagital para estudiar la pelvis femenina.", "El corte sagital permite visualizar simultáneamente útero, vagina, vejiga, uretra, recto, conducto anal, pubis, sacro y periné, integrando relaciones espaciales difíciles de comprender en vistas planas aisladas."],
  ["female-short-02", "Relaciones pélvicas", "Describa la relación topográfica entre útero, vejiga urinaria y recto.", "La vejiga se sitúa anterior al útero, el útero ocupa una posición media y el recto se dispone posterior al aparato reproductor, relación clave para imagen, exploración y cirugía."],
  ["female-short-03", "Órganos reproductores", "Enumere y describa las porciones principales del útero visibles en el modelo.", "Se reconocen fondo uterino superior, cuerpo uterino como porción principal, cuello uterino o cérvix como segmento inferior, cavidad uterina y canal cervical."],
  ["female-short-04", "Órganos reproductores", "Explique la función topográfica del cérvix y del canal cervical.", "El cérvix constituye la transición inferior del útero hacia la vagina; el canal cervical comunica cavidad uterina y canal vaginal."],
  ["female-short-05", "Relaciones pélvicas", "Describa la posición de la vagina en relación con uretra y recto.", "La vagina se sitúa posterior a uretra y vejiga, y anterior al recto, formando un eje inferior reproductor que se continúa con el cuello uterino."],
  ["female-short-06", "Sistema urinario asociado", "Explique la relación anatómica de vejiga y uretra femenina en el corte sagital.", "La vejiga ocupa el compartimento anterior; la uretra es corta y desciende anterior al canal vaginal hasta el vestíbulo."],
  ["female-short-07", "Sistema digestivo asociado", "Describa la posición del recto y conducto anal.", "El recto se sitúa posterior a útero y vagina, continuándose inferiormente con el conducto anal en relación con el periné posterior."],
  ["female-short-08", "Relaciones pélvicas", "Explique la importancia del fondo de saco rectouterino.", "El fondo de saco rectouterino o de Douglas es el receso peritoneal más declive en bipedestación y se relaciona con acumulación de líquido pélvico."],
  ["female-short-09", "Relaciones pélvicas", "Diferencie fondo de saco vesicouterino y rectouterino.", "El vesicouterino se ubica entre vejiga y útero; el rectouterino se ubica entre útero/vagina posterior y recto."],
  ["female-short-10", "Periné", "Describa el valor anatómico del periné en la pelvis femenina.", "El periné constituye la región inferior de cierre y soporte del piso pélvico, relevante para continencia, parto y sostén visceral."],
  ["female-short-11", "Anatomía topográfica", "Explique la utilidad de pubis, sacro y cóccix como referencias.", "El pubis marca la referencia anterior, mientras sacro y cóccix orientan el límite posterior e inferior, ayudando a leer el eje pélvico."],
  ["female-short-12", "Órganos reproductores", "Integre ovario y trompa uterina dentro del estudio sagital.", "Aunque pueden verse lateralizados, ovario y trompa uterina completan el eje reproductor y se relacionan con el útero en la región anexial."],
  ["female-short-13", "Relaciones pélvicas", "Defina anteversión y anteflexión uterina en términos topográficos.", "Anteversión describe la inclinación del eje uterino respecto a la vagina; anteflexión, el ángulo entre cuerpo y cuello uterino hacia anterior."],
  ["female-short-14", "Anatomía topográfica", "Organice la pelvis femenina en compartimentos funcionales.", "Puede analizarse en compartimento anterior urinario, medio reproductor y posterior digestivo, todos visibles en el corte sagital."],
  ["female-short-15", "Aplicación clínica", "Explique una aplicación ginecológica del modelo.", "El modelo ayuda a comprender exploración cervical, relaciones uterinas, fondo de saco de Douglas y correlación con ecografía o resonancia pélvica."],
  ["female-short-16", "Aplicación clínica", "Explique la relevancia obstétrica de la anatomía sagital pélvica.", "El conocimiento de vagina, cérvix, útero, periné y eje óseo pélvico orienta el razonamiento del canal del parto y soporte perineal."],
  ["female-short-17", "Aplicación clínica", "Relacione el corte sagital con la interpretación de imagen.", "Permite comparar órganos pélvicos por planos y reconocer desplazamientos, distensión vesical, masas uterinas o colecciones pélvicas."],
  ["female-short-18", "Órganos reproductores", "Describa la continuidad cavidad uterina-canal cervical-vagina.", "La cavidad uterina se estrecha inferiormente hacia el canal cervical, que atraviesa el cérvix y se abre al canal vaginal."],
  ["female-short-19", "Relaciones pélvicas", "Explique por qué los recesos peritoneales son relevantes en anatomía aplicada.", "Los recesos son espacios potenciales donde puede acumularse líquido o extenderse patología, y orientan procedimientos diagnósticos."],
  ["female-short-20", "Aplicación clínica", "Integre los sistemas reproductor, urinario y digestivo en una explicación topográfica.", "El modelo muestra una relación tridimensional: vejiga y uretra anteriores, útero y vagina centrales, recto y conducto anal posteriores, con soporte inferior perineal y referencias óseas."],
].map(([id, topic, question, expectedAnswer]) => ({ id, topic, question, expectedAnswer }));

const femaleFillQuestions = [
  ["female-fill-01", "Relaciones pélvicas", "El útero se sitúa entre vejiga urinaria y ____.", "recto", []],
  ["female-fill-02", "Órganos reproductores", "El fondo ____ corresponde a la porción superior del útero.", "uterino", []],
  ["female-fill-03", "Órganos reproductores", "El cuello uterino también se denomina ____.", "cérvix", ["cervix"]],
  ["female-fill-04", "Órganos reproductores", "El canal cervical comunica cavidad uterina con ____.", "vagina", []],
  ["female-fill-05", "Sistema urinario asociado", "La vejiga urinaria se ubica ____ al útero.", "anterior", []],
  ["female-fill-06", "Relaciones pélvicas", "El fondo de saco rectouterino se conoce como fondo de saco de ____.", "Douglas", []],
  ["female-fill-07", "Sistema urinario asociado", "La uretra femenina se ubica anterior al canal ____.", "vaginal", []],
  ["female-fill-08", "Anatomía topográfica", "El sacro constituye una referencia ósea ____ de la pelvis.", "posterior", []],
  ["female-fill-09", "Órganos reproductores", "La trompa uterina se relaciona lateralmente con el ____.", "ovario", []],
  ["female-fill-10", "Periné", "El periné participa en el soporte del piso ____.", "pélvico", ["pelvico"]]
].map(([id, topic, prompt, answer, acceptedAnswers]) => ({ id, topic, prompt, answer, acceptedAnswers }));

function isSagittalBrainModel(model = {}) {
  const searchable = normalizeTheoreticalAnswer([
    model?.slug,
    model?.title,
    model?.name,
    model?.anatomical_system,
    model?.anatomical_region,
    model?.description
  ].filter(Boolean).join(" "));

  const hasSagittal = searchable.includes("corte sagital") || searchable.includes("sagital");
  const hasBrain = ["cranio", "craneo", "encefalo", "cerebro", "neuro", "cabeca", "cabeza"].some(term => searchable.includes(term));
  const isHeart = ["coracao", "corazon", "cardio", "heart"].some(term => searchable.includes(term));

  return hasSagittal && hasBrain && !isHeart;
}

function isFemaleReproductiveModel(model = {}) {
  const searchable = normalizeTheoreticalAnswer([
    model?.theoreticalQuizKey,
    model?.slug,
    model?.title,
    model?.name,
    model?.anatomical_system,
    model?.anatomical_region,
    model?.description,
    ...(Array.isArray(model?.tags) ? model.tags : []),
    ...(Array.isArray(model?.keywords) ? model.keywords : []),
    ...(Array.isArray(model?.structures) ? model.structures : [])
  ].filter(Boolean).join(" "));

  if (model?.theoreticalQuizKey === "female-reproductive-sagittal") return true;
  if (searchable.includes("female reproductive sagittal")) return true;
  if (searchable.includes("corte sagital sistema reprodutor")) return true;
  if (searchable.includes("corte sagital sistema reproductor")) return true;

  const hasFemaleReproductiveTerms = [
    "reprodutor feminino",
    "reproductor femenino",
    "reprodutor femenino", // Handle hybrid typo
    "reproductor feminino", // Handle hybrid typo
    "pelve feminina",
    "pelvis femenina",
    "utero",
    "uterino",
    "vagina",
    "cervix",
    "ginecologia",
    "feminino",
    "femenino"
  ].some(term => searchable.includes(term));

  const isBrain = ["cranio", "craneo", "encefalo", "cerebro", "neuro", "cabeca", "cabeza"].some(term => searchable.includes(term));
  const isHeart = ["coracao", "corazon", "cardio", "heart"].some(term => searchable.includes(term));

  return hasFemaleReproductiveTerms && !isBrain && !isHeart;
}

export function normalizeTheoreticalAnswer(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getTheoreticalQuizForModel(model = {}) {
  const isFemaleQuiz = isFemaleReproductiveModel(model);
  const isBrainQuiz = !isFemaleQuiz && isSagittalBrainModel(model);
  const content = isFemaleQuiz
    ? {
        fallbackId: "female-reproductive-sagittal",
        subtitle: "Sistema Reproductor Femenino - Corte Sagital",
        modelTitle: "Corte Sagital Sistema Reproductor Femenino - Modelo 3D",
        visualType: "pelvis",
        resultMessage: "Tu desempeño simula una evaluación universitaria real de Anatomía Topográfica del Sistema Reproductor Femenino.",
        radarTopics: FEMALE_REPRODUCTIVE_RADAR_TOPICS,
        multiple: femaleMultipleChoiceQuestions,
        truefalse: femaleTrueFalseQuestions,
        matching: femaleMatchingExercises,
        short: femaleShortQuestions,
        fill: femaleFillQuestions
      }
    : isBrainQuiz
    ? {
        fallbackId: "corte-sagital-encefalo",
        subtitle: "Corte Sagital del Cráneo / Encéfalo Humano",
        modelTitle: "Corte Sagital del Encéfalo Humano - Modelo 3D",
        visualType: "brain",
        resultMessage: "Tú desempeño simula una evaluación universitaria real de Neuroanatomía y Anatomía Topográfica.",
        radarTopics: BRAIN_RADAR_TOPICS,
        multiple: brainMultipleChoiceQuestions,
        truefalse: brainTrueFalseQuestions,
        matching: brainMatchingExercises,
        short: brainShortQuestions,
        fill: brainFillQuestions
      }
    : {
        fallbackId: "heart",
        subtitle: "Sistema Cardiovascular - Corazón",
        modelTitle: "Corazón Humano - Modelo Superficial 3D",
        visualType: "heart",
        resultMessage: "Tú desempeño simula una evaluación universitaria real de Anatomía Médica.",
        radarTopics: RADAR_TOPICS,
        multiple: multipleChoiceQuestions,
        truefalse: trueFalseQuestions,
        matching: matchingExercises,
        short: shortQuestions,
        fill: fillQuestions
      };

  return {
    id: `theoretical-${model?.slug || model?.id || content.fallbackId}`,
    modelId: model?.id || "",
    title: "Prueba de Anatomía Topográfica y Descriptiva",
    subtitle: content.subtitle,
    course: "Medicina - 2.º / 3.º año",
    modelTitle: content.modelTitle,
    visualType: content.visualType,
    resultMessage: content.resultMessage,
    timeLimitSeconds: THEORETICAL_QUIZ_TIME_LIMIT_SECONDS,
    radarTopics: content.radarTopics,
    sections: [
      { id: "multiple", title: "Sección I - Opción múltiple", expectedCount: 20, questions: content.multiple },
      { id: "truefalse", title: "Sección II - Verdadero / Falso", expectedCount: 20, questions: content.truefalse },
      { id: "matching", title: "Sección III - Relación de columnas", expectedCount: 5, questions: content.matching },
      { id: "short", title: "Sección IV - Preguntas de desarrollo / cortas", expectedCount: 20, questions: content.short },
      { id: "fill", title: "Sección V - Completa con la palabra que falta", expectedCount: 10, questions: content.fill }
    ]
  };
}

export function createTheoreticalQuizState(quiz) {
  return {
    quizId: quiz.id,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    answers: {},
    revealed: {},
    result: null
  };
}

function progressKey(model, user) {
  return `${user?.id || user?.email || "anonymous"}:${model?.id || "model"}`;
}

export function loadTheoreticalQuizProgress(model, user, quiz) {
  const store = readStorage(STORAGE_KEY, {});
  const saved = store[progressKey(model, user)];
  return saved?.quizId === quiz?.id ? saved : null;
}

export function saveTheoreticalQuizProgress(model, user, state) {
  const store = readStorage(STORAGE_KEY, {});
  writeStorage(STORAGE_KEY, {
    ...store,
    [progressKey(model, user)]: {
      ...state,
      updatedAt: new Date().toISOString()
    }
  });
}

export function clearTheoreticalQuizProgress(model, user) {
  const store = readStorage(STORAGE_KEY, {});
  const key = progressKey(model, user);
  delete store[key];
  writeStorage(STORAGE_KEY, store);
}

export function isFillCorrect(question, value) {
  const candidate = normalizeTheoreticalAnswer(value);
  const validAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalizeTheoreticalAnswer);
  return Boolean(candidate) && validAnswers.includes(candidate);
}

export function gradeTheoreticalQuiz(quiz, state) {
  const answers = state?.answers || {};
  const radarTopics = Array.isArray(quiz?.radarTopics) && quiz.radarTopics.length ? quiz.radarTopics : RADAR_TOPICS;
  const objectiveTotal =
    quiz.sections.find(section => section.id === "multiple").questions.length +
    quiz.sections.find(section => section.id === "truefalse").questions.length +
    quiz.sections.find(section => section.id === "matching").questions.reduce((total, exercise) => total + exercise.pairs.length, 0) +
    quiz.sections.find(section => section.id === "fill").questions.length;

  let score = 0;
  const sectionPerformance = [];
  const topicTotals = Object.fromEntries(radarTopics.map(topic => [topic, { topic, total: 0, score: 0 }]));

  function addTopic(topic, isCorrect) {
    const bucket = topicTotals[topic];
    if (!bucket) return;
    bucket.total += 1;
    if (isCorrect) bucket.score += 1;
  }

  quiz.sections.forEach(section => {
    if (section.id === "multiple") {
      let sectionScore = 0;
      section.questions.forEach(question => {
        const isCorrect = answers[question.id]?.selectedIndex === question.correctIndex;
        if (isCorrect) {
          score += 1;
          sectionScore += 1;
        }
        addTopic(question.topic, isCorrect);
      });
      sectionPerformance.push({
        id: section.id,
        title: section.title,
        score: sectionScore,
        total: section.questions.length,
        percentage: Math.round((sectionScore / section.questions.length) * 100)
      });
    }

    if (section.id === "truefalse") {
      let sectionScore = 0;
      section.questions.forEach(question => {
        const isCorrect = answers[question.id]?.value === question.correctAnswer;
        if (isCorrect) {
          score += 1;
          sectionScore += 1;
        }
        addTopic(question.topic, isCorrect);
      });
      sectionPerformance.push({
        id: section.id,
        title: section.title,
        score: sectionScore,
        total: section.questions.length,
        percentage: Math.round((sectionScore / section.questions.length) * 100)
      });
    }

    if (section.id === "matching") {
      let sectionScore = 0;
      const sectionTotal = section.questions.reduce((total, exercise) => total + exercise.pairs.length, 0);
      section.questions.forEach(exercise => {
        exercise.pairs.forEach(pair => {
          const isCorrect = answers[exercise.id]?.pairs?.[pair.id] === pair.correctOptionId;
          if (isCorrect) {
            score += 1;
            sectionScore += 1;
          }
          addTopic(exercise.topic, isCorrect);
        });
      });
      sectionPerformance.push({
        id: section.id,
        title: section.title,
        score: sectionScore,
        total: sectionTotal,
        percentage: sectionTotal ? Math.round((sectionScore / sectionTotal) * 100) : 0
      });
    }

    if (section.id === "fill") {
      let sectionScore = 0;
      section.questions.forEach(question => {
        const isCorrect = isFillCorrect(question, answers[question.id]?.value);
        if (isCorrect) {
          score += 1;
          sectionScore += 1;
        }
        addTopic(question.topic, isCorrect);
      });
      sectionPerformance.push({
        id: section.id,
        title: section.title,
        score: sectionScore,
        total: section.questions.length,
        percentage: Math.round((sectionScore / section.questions.length) * 100)
      });
    }

    if (section.id === "short") {
      const completion = sectionCompletion(section, answers, state?.revealed || {});
      sectionPerformance.push({
        id: section.id,
        title: section.title,
        score: completion.completed,
        total: completion.total,
        percentage: completion.total ? Math.round((completion.completed / completion.total) * 100) : 0,
        formative: true
      });
    }
  });

  const radar = radarTopics.map(topic => {
    const bucket = topicTotals[topic];
    return {
      ...bucket,
      percentage: bucket.total ? Math.round((bucket.score / bucket.total) * 100) : 0
    };
  });

  return {
    finishedAt: new Date().toISOString(),
    score,
    objectiveTotal,
    percentage: objectiveTotal ? Math.round((score / objectiveTotal) * 100) : 0,
    durationSeconds: state?.startedAt
      ? Math.max(0, Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1000))
      : null,
    sectionPerformance,
    radar
  };
}

export function sectionCompletion(section, answers = {}, revealed = {}) {
  if (section.id === "matching") {
    const total = section.questions.reduce((sum, exercise) => sum + exercise.pairs.length, 0);
    const completed = section.questions.reduce((sum, exercise) => sum + Object.values(answers[exercise.id]?.pairs || {}).filter(Boolean).length, 0);
    return { completed, total };
  }

  if (section.id === "short") {
    const completed = section.questions.filter(question => String(answers[question.id]?.text || "").trim() || revealed[question.id]).length;
    return { completed, total: section.questions.length };
  }

  const completed = section.questions.filter(question => {
    const answer = answers[question.id];
    if (section.id === "multiple") return Number.isInteger(answer?.selectedIndex);
    if (section.id === "truefalse") return typeof answer?.value === "boolean";
    if (section.id === "fill") return String(answer?.value || "").trim();
    return false;
  }).length;
  return { completed, total: section.questions.length };
}

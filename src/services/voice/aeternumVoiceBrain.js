/**
 * Aeternum Voice AI Brain — Master Humanized Cognitive & Clinical Engine
 * Comprehensive Multilingual Mentorship:
 * - Eduardo 🇧🇷: Sábio mentor sênior, conselheiro de vida, coach acadêmico e guia clínico (pt-BR)
 * - Antonia 🇪🇸: Mentora empática, expressiva, psicóloga educacional e guia anatómica (es-ES)
 * - Ariana 🇺🇸: Dynamic growth-minded executive coach, motivational mentor & clinical guide (en-US)
 * - Fabian 🇩🇪: Akademischer, methodischer Studienberater, präziser Mentor (de-DE)
 */

import { queryAnatomicalKnowledgeGraph } from "../ai/anatomicalKnowledgeGraphService.js";

// Session memory for contextual continuity across conversation turns
const sessionMemory = {
  lastTopic: null,
  lastCategory: null,
  lastLanguage: "pt"
};

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function containsAny(text, keywords) {
  const norm = normalize(text);
  return keywords.some((kw) => norm.includes(normalize(kw)));
}

export function generateVoiceTutorResponse(question, context = {}, language = "pt") {
  const rawQ = String(question || "").trim();
  const q = normalize(rawQ);
  const lang = String(language || "pt").slice(0, 2).toLowerCase();
  sessionMemory.lastLanguage = lang;

  // 1. Contextual Recall for "fale mais", "continue", "y qué más", "tell me more"
  const isContinuation = containsAny(q, [
    "fale mais", "mais sobre", "continue", "prossiga", "alem disso", "além disso",
    "hablemos mas", "hablemos más", "mas sobre", "más sobre", "continua", "sigue",
    "tell me more", "more about", "continue", "go on", "what else",
    "mehr daruber", "mehr darüber", "weiter", "erzahle mehr"
  ]);

  // Extract anatomical term from query
  let extractedTopic = null;
  const anatomyKeywords = [
    { key: "clavicula", names: ["clavicula", "clavicular", "acromion", "ombro", "hombro", "shoulder"] },
    { key: "femur", names: ["femur", "quadril", "cadera", "hip", "acetabulo", "joelho", "rodilla", "knee"] },
    { key: "coracao", names: ["coracao", "corazon", "heart", "herz", "cardiac", "cardiaco", "miocardio", "valva", "valvula"] },
    { key: "arteria", names: ["arteria", "aorta", "carotida", "coronaria", "vaso", "irrigacao", "irrigacion", "vascular", "blood supply"] },
    { key: "veia", names: ["veia", "vena", "vein", "cava", "jugular", "drenagem", "drenaje"] },
    { key: "ganglio", names: ["ganglio", "linfonodo", "linfatico", "linfa", "lymph", "lymph node", "baco", "bazo", "spleen"] },
    { key: "musculo", names: ["musculo", "muscle", "muskel", "deltoide", "peitoral", "biceps", "triceps", "manguito", "diafragma"] },
    { key: "cerebro", names: ["cerebro", "encefalo", "brain", "gehirn", "cortex", "tronco", "cerebelo", "nervio", "nervo", "nerve", "willis", "craniano", "craneal"] },
    { key: "pulmao", names: ["pulmao", "pulmon", "lung", "lunge", "bronquio", "alveolo", "pleura", "traqueia"] },
    { key: "figado", names: ["figado", "higado", "liver", "leber", "pancreas", "estomago", "vesicula", "biliar", "intestino", "viscera"] },
    { key: "rim", names: ["rim", "rinon", "kidney", "niere", "nefron", "ureter", "bexiga", "vejiga", "bladder"] },
    { key: "coluna", names: ["coluna", "columna", "spine", "wirbelsaule", "vertebra", "disco", "medula", "cervical", "lombar"] }
  ];

  for (const item of anatomyKeywords) {
    if (containsAny(q, item.names)) {
      extractedTopic = item.key;
      sessionMemory.lastTopic = item.key;
      break;
    }
  }

  if (isContinuation && !extractedTopic && sessionMemory.lastTopic) {
    extractedTopic = sessionMemory.lastTopic;
  }

  // =========================================================================
  // 🇪🇸 ESPAÑOL (Antonia — Mentora Empática, Psicóloga & Guía de Estudio)
  // =========================================================================
  if (lang === "es") {
    // A. Rutina, Planificación y Metodología de Estudio
    if (containsAny(q, ["rutina", "organizar", "tiempo", "horario", "planificar", "como estudio", "cronograma", "metodo", "bloques"])) {
      return "¡Te comprendo muy bien! La clave es estudiar en bloques de veinticinco minutos con pausas cortas para consolidar la memoria. ¿Prefieres que organicemos un plan semanal o que elijamos el tema de hoy?";
    }
    // B. Apoyo Emocional, Motivación, Ansiedad o Cansancio
    if (containsAny(q, ["cansado", "perdido", "dificil", "miedo", "estres", "ansiedad", "desmotivado", "abrumado", "no entiendo"])) {
      return "Respira hondo, es completamente normal sentirse así en medicina. Estoy aquí para acompañarte paso a paso sin prisas. ¿Te gustaría que hagamos una pausa o que veamos un ejemplo sencillo juntos?";
    }
    // C. Elección de Tema / Guía General
    if (containsAny(q, ["por donde empiezo", "que estudio", "sugerencia", "que vemos", "consejo", "que podemos hacer"])) {
      return "Te sugiero comenzar por las bases de osteología o el sistema cardiovascular, que son muy visuales y motivadores. ¿Te inclinas más por el miembro superior o por el corazón?";
    }
    // D. Clavícula / Hombro
    if (extractedTopic === "clavicula" || containsAny(q, ["clavicula", "hombro"])) {
      return "La clavícula es el único puente óseo que une el brazo con el tórax, protegiendo los grandes vasos subclavios. ¿Quieres que veamos sus ligamentos coracoclaviculares o los músculos que se insertan en ella?";
    }
    // E. Vascularización, Irrigación, Ganglios o Linfáticos
    if (extractedTopic === "ganglio" || extractedTopic === "arteria" || containsAny(q, ["ganglio", "linfatico", "irrigacion", "vascularizacion"])) {
      return "La irrigación nutre los tejidos bajo alta presión arterial, mientras los vasos y ganglios linfáticos filtran la linfa y defienden el organismo. ¿Deseas repasar las cadenas ganglionares axilares o las arterias principales?";
    }
    // F. Fémur / Miembro Inferior
    if (extractedTopic === "femur") {
      return "El fémur soporta todo el peso corporal transmitiéndolo a la tibia, irrigado por las arterias circunflejas femorales. ¿Revisamos la articulación de la cadera o los ligamentos de la rodilla?";
    }
    // G. Corazón / Cardiovascular
    if (extractedTopic === "coracao") {
      return "El corazón bombea sangre a todo el organismo y sus propias paredes se irrigan en diástole por las arterias coronarias. ¿Te gustaría profundizar en el ciclo cardíaco o en las ramas coronarias?";
    }
    // H. Encéfalo / Pares Craneales
    if (extractedTopic === "cerebro") {
      return "El encéfalo centraliza nuestras funciones y se nutre a través del polígono arterial de Willis. ¿Quieres explorar los doce pares craneales o la irrigación cerebral?";
    }
    // I. Saludos
    if (containsAny(q, ["hola", "buen dia", "buenas", "que tal", "como estas"]) && q.length < 30) {
      return "¡Hola! Te doy una cálida bienvenida. Soy Antonia, tu mentora y compañera de estudio. ¿Cómo te sientes hoy y en qué te puedo colaborar?";
    }

    return "Te entiendo perfectamente... Estoy aquí para ayudarte tanto con la teoría anatómica como para guiar tu rutina de estudio. ¿Qué tema o duda te gustaría que resolvamos ahora?";
  }

  // =========================================================================
  // 🇺🇸 ENGLISH (Ariana — Growth Mindset Coach, Academic & Clinical Guide)
  // =========================================================================
  if (lang === "en") {
    if (containsAny(q, ["routine", "organize", "schedule", "time management", "how to study", "plan"])) {
      return "I love that initiative! Structuring twenty-five minute focused study intervals will dramatically boost your retention. Would you like to map out a weekly plan or tackle today's topic?";
    }
    if (containsAny(q, ["tired", "lost", "overwhelmed", "stressed", "anxious", "hard", "motivation"])) {
      return "Take a deep breath, medical studies are a marathon and you are doing great. I am here to guide you step by step. Shall we take it slow and break down one simple concept together?";
    }
    if (extractedTopic === "clavicula" || containsAny(q, ["clavicle", "collarbone", "shoulder"])) {
      return "The clavicle acts as a mechanical strut transmitting upper limb kinetic forces directly to the axial skeleton. Would you like to review its ligament attachments or surrounding muscles?";
    }
    if (extractedTopic === "ganglio" || extractedTopic === "arteria" || containsAny(q, ["lymph", "lymph node", "blood supply", "vascular"])) {
      return "Arterial flow delivers oxygenated blood under high pressure, while lymph nodes filter immune cells across the body. Shall we explore the axillary lymph nodes or main arterial branches?";
    }
    if (extractedTopic === "coracao") {
      return "The heart functions as a synchronized four-chambered pump perfused during diastole by the coronary arteries. Would you like to explore conduction pathways or cardiac valves?";
    }
    if (containsAny(q, ["hello", "hi", "hey", "how are you"]) && q.length < 30) {
      return "Hello and welcome! I am Ariana, your mentor and study coach. How are you feeling today and what would you like to accomplish?";
    }

    return "I hear you loud and clear! I am here to support your clinical knowledge, study routine, and learning mindset. What would you like to focus on next?";
  }

  // =========================================================================
  // 🇩🇪 DEUTSCH (Fabian — Strukturierter Studienberater & Anatomischer Mentor)
  // =========================================================================
  if (lang === "de") {
    if (containsAny(q, ["routine", "zeit", "planen", "lernen", "struktur", "methode"])) {
      return "Das ist ein hervorragender Ansatz. Kurze Lerneinheiten von fünfundzwanzig Minuten fördern die langfristige Behaltensleistung. Wollen wir einen Lernplan erstellen oder das heutige Thema wählen?";
    }
    if (containsAny(q, ["mude", "müde", "uberfordert", "überfordert", "schwer", "stress", "angst"])) {
      return "Atme erst einmal tief durch, das Medizinstudium ist anspruchsvoll und du machst das gut. Ich begleite dich Schritt für Schritt. Wollen wir ein einfaches Beispiel gemeinsam durchgehen?";
    }
    if (extractedTopic === "clavicula") {
      return "Die Clavicula stabilisiert den Schultergürtel als einzige knöcherne Verbindung zum Rumpf und schützt die großen Subclavia-Gefäße. Möchtest du die Bandstrukturen oder die Muskelansätze vertiefen?";
    }
    if (extractedTopic === "coracao") {
      return "Das Herz arbeitet als muskuläre Pumpe, deren Myokard in der Diastole über die Koronararterien versorgt wird. Sollen wir die Herzkranzgefäße oder das Reizleitungssystem besprechen?";
    }
    if (containsAny(q, ["hallo", "guten tag", "hi", "wie geht"]) && q.length < 30) {
      return "Hallo und herzlich willkommen! Ich bin Fabian, dein Studienmentor und Anatomiebegleiter. Wie fühlst du dich heute und womit starten wir?";
    }

    return "Ich verstehe dich sehr gut. Ich unterstütze dich bei der Organisation deines Lernens ebenso wie bei anatomischen Fragestellungen. Womit wollen wir weitermachen?";
  }

  // =========================================================================
  // 🇧🇷 PORTUGUÊS (Eduardo — Mentor Sênior, Conselheiro de Vida & Coach Clínico)
  // =========================================================================
  // A. Rotina, Cronograma e Organização de Estudos
  if (containsAny(q, ["rotina", "organizar", "tempo", "cronograma", "como estudar", "planejar", "metodo", "pomodoro", "disciplina"])) {
    return "Veja bem, a melhor estratégia é estudar em blocos focados de vinte e cinco minutos, alternando teoria e visualização 3D. Quer que montemos um cronograma semanal ou prefere definir a meta de hoje?";
  }
  // B. Apoio Emocional, Ansiedade, Cansaço ou Dificuldade
  if (containsAny(q, ["cansado", "perdido", "dificil", "medo", "estresse", "ansiedade", "desmotivado", "sobrecarregado", "nao consigo"])) {
    return "Fique tranquilo, a jornada na medicina é intensa e esse sentimento faz parte do crescimento. Estou aqui para caminhar ao seu lado com calma. Que tal vermos um ponto simples e prático agora?";
  }
  // C. Escolha de Tema e Direcionamento
  if (containsAny(q, ["por onde comeco", "por onde começo", "o que estudar", "sugestao", "sugestão", "conselho", "o que fazer"])) {
    return "Recomendo iniciarmos pelo esqueleto apendicular ou pela vascularização cardíaca, que conectam muito bem a teoria com a prática clínica. O que desperta mais sua curiosidade hoje?";
  }
  // D. Clavícula / Ombro / Cíngulo Superior
  if (extractedTopic === "clavicula" || containsAny(q, ["clavicula", "ombro"])) {
    return "A clavícula funciona como uma haste de sustentação mecânica que projeta o ombro lateralmente e protege os vasos subclávios. Deseja analisar os ligamentos coracoclaviculares ou os músculos peitoral e deltoide?";
  }
  // E. Vascularização, Irrigação, Gânglios ou Linfáticos
  if (extractedTopic === "ganglio" || extractedTopic === "arteria" || containsAny(q, ["ganglio", "gânglio", "linfonodo", "linfatico", "linfático", "irrigacao", "irrigação", "vascularizacao", "vascularização"])) {
    return "A irrigação arterial conduz oxigênio sob alta pressão, enquanto a rede de gânglios linfáticos filtra impurezas e atua na defesa imunológica. Quer explorar as cadeias de linfonodos ou os troncos arteriais?";
  }
  // F. Fêmur / Quadril / Joelho
  if (extractedTopic === "femur") {
    return "O fêmur é a principal viga de carga do membro inferior, nutrido pelas artérias circunflexas femorais e apoiado no acetábulo. Gostaria de rever a articulação coxofemoral ou os ligamentos do joelho?";
  }
  // G. Coração / Cardiovascular
  if (extractedTopic === "coracao") {
    return "O coração bombeia o débito cardíaco para todo o corpo e se nutre em diástole pelas artérias coronárias direita e esquerda. Faz sentido para você revermos a irrigação coronariana ou o ciclo cardíaco?";
  }
  // H. Encéfalo / Neuroanatomia
  if (extractedTopic === "cerebro") {
    return "O encéfalo coordena todas as funções vitais e motoras, nutrido pelo polígono de Willis com anastomoses carótido-basilares. O que você gostaria de explorar: os doze pares cranianos ou as áreas do córtex?";
  }
  // I. Pulmão / Respiração
  if (extractedTopic === "pulmao") {
    return "Os pulmões realizam a hematose nos alvéolos com o auxílio do músculo diafragma, divididos em três lobos à direita e dois à esquerda. Deseja focar na árvore brônquica ou na mecânica ventilatória?";
  }
  // J. Fígado / Vísceras Abdominais
  if (extractedTopic === "figado") {
    return "Os órgãos abdominais recebem sangue do tronco celíaco e convergem seu fluxo venoso para a veia porta hepática. Deseja analisar a segmentação do fígado ou a topografia das vísceras?";
  }
  // K. Saudações
  if (containsAny(q, ["ola", "oi", "bom dia", "boa tarde", "tudo bem", "como vai"]) && q.length < 30) {
    return "Olá! Seja muito bem-vindo. Eu sou o Eduardo, seu mentor e companheiro de jornada nos estudos. Como você está se sentindo hoje e em que posso apoiá-lo?";
  }

  return "Entendo perfeitamente o seu ponto. Estou aqui tanto para apoiar na compreensão anatômica e clínica quanto para ajudar a organizar seus estudos. Por qual tema ou dúvida você gostaria de começar agora?";
}

export async function generateDynamicVoiceResponse(question, context = {}, language = "pt") {
  return generateVoiceTutorResponse(question, context, language);
}

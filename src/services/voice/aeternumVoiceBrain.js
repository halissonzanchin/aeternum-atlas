/**
 * Aeternum Voice AI Brain — Comprehensive Master Anatomical Engine
 * Enriched with Latarjet & Ruiz Liard (Tomos I e II), Terminologia Anatomica Internacional,
 * Clinical Correlations, Surgical Topography, and 3D Anatomical Registry.
 *
 * Multilingual Tutorship:
 * - Heitor 🇧🇷 (Português do Brasil)
 * - Antonia 🇪🇸 (Español)
 * - Ariana 🇺🇸 (English)
 * - Fabian 🇩🇪 (Deutsch)
 */

import { queryAnatomicalKnowledgeGraph } from "../ai/anatomicalKnowledgeGraphService";

// Helper for normalized keyword matching
function matchKeywords(text, keywords) {
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return keywords.some((kw) => {
    const normKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return norm.includes(normKw);
  });
}

export function generateVoiceTutorResponse(question, context = {}, language = "pt") {
  const q = String(question || "").trim();
  const lang = String(language || "pt").slice(0, 2).toLowerCase();
  const structure = context.structure || context.modelTitle || context.model?.title || "";

  // 0. Query Live Anatomical Graph for Deep Knowledge
  let graphKnowledge = null;
  try {
    graphKnowledge = queryAnatomicalKnowledgeGraph(q || structure);
  } catch {}

  // =========================================================================
  // 1. ESPAÑOL (Antonia 🇪🇸 — Base Latarjet & Ruiz Liard)
  // =========================================================================
  if (lang === "es") {
    // Clavícula / Hombro / Miembro Superior
    if (matchKeywords(q, ["clavicula", "clavicular", "acromion", "esternon", "escapula", "hombro", "brazo"])) {
      return "La clavícula es un hueso largo con doble curvatura en forma de 'S' itálica que une el manubrio esternal con el acromion escapular, actuando como puntal de suspensión del hombro. ¿Deseas detallar las inserciones del deltoides y pectoral mayor o los ligamentos coracoclaviculares?";
    }
    // Húmero / Codo / Antebrazo / Mano
    if (matchKeywords(q, ["humero", "radio", "cubito", "ulna", "codo", "muñeca", "carpo", "mano"])) {
      return "El húmero articula proximalmente con la cavidad glenoidea y distalmente con el radio y la ulna en la tróclea y el cóndilo humeral. ¿Quieres revisar el trayecto del nervio radial en el surco de torsión o la pronosupinación?";
    }
    // Fémur / Pelvis / Cadera / Rodilla
    if (matchKeywords(q, ["femur", "pelvis", "cadera", "acetabulo", "tibia", "perone", "fibula", "rodilla", "rotula", "patela", "pie", "tarso"])) {
      return "El fémur es la palanca ósea más potente del cuerpo, con su cabeza esferoidea encajada en el acetábulo pélvico e irrigada por el anillo arterial retinacular. ¿Quieres examinar los ligamentos cruzados de la rodilla o los meniscos?";
    }
    // Columna Vertebral / Médula / Cuello
    if (matchKeywords(q, ["columna", "vertebra", "cervical", "toracica", "lumbar", "sacro", "disco", "medula espinal"])) {
      return "La columna vertebral combina estabilidad estática y flexibilidad dinâmica a través de 33 vértebras y discos intervertebrales con curvaturas lordóticas y cifóticas. ¿Deseas revisar el agujero de conjunción o las raíces del plexo braquial?";
    }
    // Cráneo / Cara / Encéfalo
    if (matchKeywords(q, ["craneo", "cara", "mandibula", "maxilar", "cerebro", "encefalo", "corteza", "cerebelo", "tronco encefalico", "meninges", "willis"])) {
      return "El encéfalo está protegido por la bóveda craneal y tres meninges, alimentado por el polígono arterial de Willis que anastomosa los sistemas carotídeo y vertebrobasilar. ¿Deseas repasar la corteza motora o los doce pares craneales?";
    }
    // Corazón / Miocardio / Coronarias / Válvulas
    if (matchKeywords(q, ["corazon", "miocardio", "valvula", "auricula", "ventriculo", "coronaria", "pericardio", "aorta", "cava"])) {
      return "El corazón funciona como una bomba tetracameral sincronizada por el nódulo sinoauricular, recibiendo perfusión miocárdica diastólica de las arterias coronarias derecha e izquierda. ¿Quieres analizar el ciclo de apertura valvular o el sistema de conducción?";
    }
    // Pulmón / Vías Respiratorias
    if (matchKeywords(q, ["pulmon", "pleura", "alveolo", "traquea", "bronquio", "laringe", "diafragma", "respirat"])) {
      return "El árbol traqueobronquial distribuye el aire hasta los alvéolos para la hematosis, contando con tres lóbulos en el pulmón derecho y dos en el izquierdo. ¿Quieres revisar la mecánica diafragmática o la circulación pulmonar?";
    }
    // Digestivo / Abdomen / Hígado / Páncreas
    if (matchKeywords(q, ["estomago", "higado", "pancreas", "vesicula", "bazo", "intestino", "duodeno", "colon", "peritoneo", "biliar"])) {
      return "El sistema digestivo intraabdominal está envuelto por el peritoneo y vascularizado por el tronco celíaco y las arterias mesentéricas, con drenaje hepático por la vena porta. ¿Deseas ver la segmentación hepática de Couinaud o los conductos pancreáticos?";
    }
    // Riñón / Urogenital
    if (matchKeywords(q, ["riñon", "ureter", "vejiga", "uretra", "utero", "ovario", "prostata", "testiculo", "nefron"])) {
      return "El riñón filtra el plasma en los glomérulos de la corteza renal y concentra la orina en las pirámides medulares de Malpighi hacia la pelvis renal. ¿Quieres revisar la irrigación renal o la anatomía del piso pélvico?";
    }
    // Saludos / Ayuda
    if (matchKeywords(q, ["hola", "buen dia", "buenas", "que tal", "como estas"]) && q.length < 35) {
      return "¡Hola! Soy Antonia, tu mentora de anatomía. Puedo explicarte la morfología, relaciones topográficas, inervación y vascularización de cualquier estructura. ¿Qué región deseas estudiar hoy?";
    }
    if (matchKeywords(q, ["ayuda", "ayudar", "que podes", "como funciona", "que haces"]) && q.length < 40) {
      return "Puedo guiarte con precisión clínica y quirúrgica en cualquier estructura anatómica 3D, correlacionando órganos, vasos y nervios. ¿Por dónde empezamos?";
    }

    if (graphKnowledge?.primaryStructure) {
      const p = graphKnowledge.primaryStructure;
      return `En el análisis de ${p.name || p.regionName || structure}, perteneciente al sistema ${p.anatomicalSystem || "anatómico"}, es clave entender sus relaciones de vecindad y su irrigación funcional. ¿Deseas profundizar en este aspecto?`;
    }

    return `Entendido. En la estructura anatómica ${structure ? `de ${structure}` : "en estudio"}, es fundamental observar sus caras articulares, inserciones musculares y pedículos vasculonerviosos. ¿Deseas que entremos en detalle?`;
  }

  // =========================================================================
  // 2. ENGLISH (Ariana 🇺🇸 — High-Yield Medical Anatomy)
  // =========================================================================
  if (lang === "en") {
    if (matchKeywords(q, ["clavicle", "collarbone", "shoulder", "scapula", "acromion", "sternum"])) {
      return "The clavicle acts as a double-curved bony strut transmitting upper extremity kinetic forces directly to the axial skeleton via the sternoclavicular joint. Shall we review its muscular attachments or coracoclavicular ligaments?";
    }
    if (matchKeywords(q, ["femur", "hip", "acetabulum", "tibia", "fibula", "knee", "patella", "meniscus"])) {
      return "The femur is the human body's longest and strongest bone, articulating at the hip acetabulum and distal tibial plateau. Would you like to review the cruciate ligaments or retinacular blood supply to the femoral head?";
    }
    if (matchKeywords(q, ["heart", "cardiac", "ventricle", "atrium", "coronary", "myocardium", "aorta", "valve"])) {
      return "The human heart operates as a synchronized four-chambered pump perfused during diastole by the left and right coronary arteries. Would you like to explore cardiac electrical conduction or valvular hemodynamics?";
    }
    if (matchKeywords(q, ["brain", "cortex", "cerebellum", "brainstem", "cranial", "meninges", "willis", "nerve"])) {
      return "The central nervous system coordinates neural pathways supplied by the Circle of Willis, joining internal carotid and vertebrobasilar systems. Which cranial nerve or cerebral lobe shall we examine?";
    }
    if (matchKeywords(q, ["lung", "respiratory", "bronchial", "alveoli", "pleura", "diaphragm", "trachea"])) {
      return "The lungs facilitate gas exchange across alveolar-capillary membranes, featuring three right lobes and two left lobes. Shall we review pulmonary vascular architecture or diaphragmatic mechanics?";
    }
    if (matchKeywords(q, ["liver", "pancreas", "stomach", "intestine", "duodenum", "colon", "gallbladder", "kidney"])) {
      return "Abdominal viscera receive arterial inflow via the celiac trunk and mesenteric branches, with venous drainage organized through the hepatic portal system. Would you like to examine Couinaud liver segments or renal filtration?";
    }
    if (matchKeywords(q, ["hello", "hi", "hey", "how are you"]) && q.length < 30) {
      return "Hello! I am Ariana, your anatomy mentor. I can explain any organ, vessel, neural pathway, or clinical correlation. What structure would you like to review today?";
    }
    if (matchKeywords(q, ["help", "what can you do", "how can you help"]) && q.length < 40) {
      return "I can guide your 3D anatomical exploration, clarify surgical relations, and test your knowledge with high-yield concepts. Where shall we start?";
    }

    return `I understand your question regarding ${structure || "this anatomical structure"}. Spatial orientation, vascular supply, and clinical correlations are paramount. Would you like to explore this in detail?`;
  }

  // =========================================================================
  // 3. DEUTSCH (Fabian 🇩🇪 — Präzise Anatomie nach Latarjet & Sobotta)
  // =========================================================================
  if (lang === "de") {
    if (matchKeywords(q, ["clavicula", "schlusselbein", "schulter", "skapula", "sternum", "akromion"])) {
      return "Die Clavicula fungiert als s-förmig geschwungene knöcherne Strebe zwischen Sternum und Acromion und stabilisiert den Schultergürtel. Möchtest du die Bandverbindungen oder die Muskelursprünge vertiefen?";
    }
    if (matchKeywords(q, ["herz", "kardio", "ventrikel", "vorhof", "klappe", "koronar", "myokard", "aorta"])) {
      return "Das Herz arbeitet als viergliedrige Muskelpumpe, deren myokardiale Durchblutung diastolisch über die linke und rechte Koronararterie erfolgt. Möchtest du das Reizleitungssystem oder die Herzklappen analysieren?";
    }
    if (matchKeywords(q, ["gehirn", "hirn", "kranial", "nerv", "enzephalon", "hirnstamm", "meningen", "willis"])) {
      return "Das Gehirn wird arteriell über den Circulus arteriosus cerebri versorgt, der das Karotis- und Vertebralis-System verbindet. Welchen Hirnnerv oder Rindenbereich möchtest du wiederholen?";
    }
    if (matchKeywords(q, ["lunge", "bronchien", "alveolen", "pleura", "zwerchfell", "respiration"])) {
      return "Die Lungenflügel ermöglichen den Gasaustausch in den Alveolen, aufgeteilt in drei rechte und zwei linke Lappen. Sollen wir die Lungenstrombahn oder die Atemmechanik besprechen?";
    }
    if (matchKeywords(q, ["hallo", "guten tag", "hi", "wie geht"]) && q.length < 30) {
      return "Hallo! Ich bin Fabian, dein Anatomie-Mentor. Ich kann dich durch 3D-Strukturen führen, Innervationen und Gefäßstraßen erklären. Womit beginnen wir?";
    }

    return `Ich verstehe deine Frage zur ${structure || "Anatomie"}. Die räumliche Lage, Gefäßversorgung und klinische Relevanz sind hierbei zentral. Möchtest du diesen Bereich vertiefen?`;
  }

  // =========================================================================
  // 4. PORTUGUÊS (Heitor 🇧🇷 — Base Latarjet & Ruiz Liard, Tomos I e II)
  // =========================================================================
  // Clavícula / Ombro / Cíngulo Superior
  if (matchKeywords(q, ["clavicula", "clavicular", "acromio", "acromion", "esterno", "escapula", "ombro", "braco"])) {
    return "A clavícula é um osso longo com curvatura em 'S' itálico que conecta o manúbrio do esterno ao acrômio da escápula, transmitindo as forças mecânicas do membro superior para o esqueleto axial. Deseja revisar as inserções musculares do deltoide e peitoral ou os ligamentos coracoclaviculares?";
  }
  // Úmero / Cotovelo / Antebraço / Mão
  if (matchKeywords(q, ["umero", "radio", "ulna", "cubito", "cotovelo", "punho", "carpo", "mao", "quirodactilo"])) {
    return "O úmero articula-se proximalmente na cavidade glenoide da escápula e distalmente na tróclea e capítulo com o rádio e a ulna, abrigando o nervo radial no sulco de torção. Gostaria de rever a pronação e supinação ou os túneis do carpo?";
  }
  // Fêmur / Pelve / Quadril / Joelho / Membro Inferior
  if (matchKeywords(q, ["femur", "pelvis", "pelve", "acetabulo", "ilio", "isquio", "pubis", "tibia", "fibula", "joelho", "patela", "rotula", "menisco", "pe", "tarso"])) {
    return "O fêmur é o osso mais longo e resistente do corpo humano, com sua cabeça esferoide articulada no acetábulo e vascularizada pelo anel arterial retinacular circumflexo. Deseja analisar os ligamentos cruzados do joelho ou o trígono femoral?";
  }
  // Coluna Vertebral / Vértebras / Medula
  if (matchKeywords(q, ["coluna", "vertebra", "cervical", "toracica", "dorsal", "lumbar", "lombar", "sacro", "disco", "medula espinhal", "forame"])) {
    return "A coluna vertebral é composta por 33 vértebras sobrepostas com discos intervertebrais, formando curvaturas fisiológicas de lordose e cifose que protegem a medula espinhal. Gostaria de rever os forames intervertebrais ou o plexo braquial?";
  }
  // Crânio / Face / Encéfalo / Neuroanatomia
  if (matchKeywords(q, ["cranio", "face", "mandibula", "maxila", "cerebro", "encefalo", "cortex", "cerebelo", "tronco encefalico", "bulbo", "ponte", "meninges", "willis", "nervo"])) {
    return "O encéfalo é nutrido pelo polígono de Willis, que integra o sistema carotídeo interno com o sistema vértebro-basilar, protegido pelas meninges e pelo líquido cefalorraquidiano. Quer explorar os doze pares cranianos ou as áreas corticais de Brodmann?";
  }
  // Coração / Vasos / Sistema Cardiovascular
  if (matchKeywords(q, ["coracao", "miocardio", "valva", "valvula", "atrio", "ventriculo", "coronaria", "pericardio", "aorta", "cava", "endocardio"])) {
    return "O coração funciona como uma bomba muscular oca tetracameral que recebe perfusão miocárdica durante a diástole através das artérias coronárias direita e esquerda. Deseja rever o complexo valvar, a irrigação coronariana ou o sistema elétrico de condução?";
  }
  // Pulmão / Respiração / Mediastino
  if (matchKeywords(q, ["pulmao", "pleura", "alveolo", "traqueia", "bronquio", "laringe", "diafragma", "respirat", "mediastino"])) {
    return "O sistema respiratório conduz o ar pela árvore traqueobrônquica até a barreira alvéolo-capilar para a hematose, com três lobos à direita e dois à esquerda. Deseja revisar a mecânica do diafragma ou a vascularização pulmonar?";
  }
  // Abdome / Fígado / Pâncreas / Digestório
  if (matchKeywords(q, ["estomago", "figado", "pancreas", "vesicula", "baco", "intestino", "duodeno", "jejuno", "ileo", "colon", "peritonio", "biliar", "apendice"])) {
    return "Os órgãos abdominais recebem suprimento arterial do tronco celíaco e artérias mesentéricas, com drenagem venosa convergindo para o fígado pelo sistema porta hepático. Deseja analisar os segmentos hepáticos de Couinaud ou a topografia pancreática?";
  }
  // Rim / Sistema Urogenital
  if (matchKeywords(q, ["rim", "ureter", "bexiga", "uretra", "utero", "ovario", "prostata", "testiculo", "nefron", "renal"])) {
    return "Os rins realizam a ultrafiltração plasmática nos néfrons do córtex e drenam a urina pelas pirâmides de Malpighi para os cálices e pelve renal. Deseja revisar os pedículos renais ou a anatomia do assoalho pélvico?";
  }
  // Saludos / Ajuda
  if (matchKeywords(q, ["ola", "oi", "bom dia", "boa tarde", "tudo bem", "como vai"]) && q.length < 30) {
    return "Olá! Sou o Heitor, seu mentor de anatomia. Posso guiá-lo no estudo detalhado de qualquer órgão, músculo, osso, vaso ou inervação no modelo 3D. O que você gostaria de explorar hoje?";
  }
  if (matchKeywords(q, ["ajuda", "ajudar", "o que voce faz", "como funciona", "o que faz"]) && q.length < 40) {
    return "Posso guiá-lo com rigor anatômico e clínico pelo corpo humano em 3D, correlacionando morfologia, inervação e vascularização baseadas no Latarjet. Por onde começamos?";
  }

  if (graphKnowledge?.primaryStructure) {
    const p = graphKnowledge.primaryStructure;
    return `No estudo de ${p.name || p.regionName || structure}, do sistema ${p.anatomicalSystem || "anatômico"}, é fundamental analisar sua topografia regional, inervação e eixos vasculares. Deseja aprofundar nos pontos de fixação ou na vascularização?`;
  }

  return `Compreendi sua dúvida sobre ${structure ? `a estrutura ${structure}` : "esta estrutura anatômica"}. É essencial correlacionar os acidentes anatômicos, a inervação e os vasos tributários na prática médica. Deseja detalhar este ponto agora?`;
}

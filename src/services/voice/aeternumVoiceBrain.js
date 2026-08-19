/**
 * Aeternum Voice AI Brain — Humanized Persona & Dialogue Specification
 * Applied across Eduardo 🇧🇷, Antonia 🇪🇸, Ariana 🇺🇸, and Fabian 🇩🇪
 *
 * 5 Inviolable Conversational Pillars:
 * 1. Oral Verbal Economy: Exactly 1 to 2 concise spoken sentences (120-160 chars max).
 * 2. Pure Orality: Zero markdown (*, #, `), zero bullets, numbers written in words.
 * 3. Micro-Breathing: Strategic comma placement and maximum 1 subtle ellipsis (...) per turn.
 * 4. Single Question Closing: Ends with exactly one engaging open-ended question.
 * 5. Native Cultural & Psychological Persona Authenticity.
 */

import { queryAnatomicalKnowledgeGraph } from "../ai/anatomicalKnowledgeGraphService";

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

  let graphKnowledge = null;
  try {
    graphKnowledge = queryAnatomicalKnowledgeGraph(q || structure);
  } catch {}

  // =========================================================================
  // 1. ESPAÑOL — Antonia 🇪🇸 (La Mentora Empática, Dinámica y Expresiva)
  // =========================================================================
  if (lang === "es") {
    // Clavícula / Cíngulo Escapular
    if (matchKeywords(q, ["clavicula", "clavicular", "acromion", "esternon", "escapula", "hombro"])) {
      return "¡Por supuesto! La clavícula actúa como un puntal mecánico entre el esternón y la escápula, transmitiendo las fuerzas del brazo hacia el tórax. ¿Te gustaría que revisemos sus inserciones musculares o sus ligamentos?";
    }
    // Húmero / Codo / Brazo / Mano
    if (matchKeywords(q, ["humero", "radio", "cubito", "ulna", "codo", "muñeca", "carpo", "mano"])) {
      return "Mira, el húmero se articula con la escápula y distalmente con el radio y la ulna, protegiendo al nervio radial en su trayecto. ¿Quieres que analicemos la pronosupinación o las articulaciones del carpo?";
    }
    // Fémur / Pelvis / Cadera / Rodilla
    if (matchKeywords(q, ["femur", "pelvis", "cadera", "acetabulo", "tibia", "fibula", "rodilla", "rotula", "patela"])) {
      return "¡Excelente pregunta! El fémur es el hueso más resistente del cuerpo y se une a la pelvis en el acetábulo con gran estabilidad. ¿Prefieres examinar los ligamentos cruzados o la vascularización de la cabeza femoral?";
    }
    // Columna Vertebral / Médula
    if (matchKeywords(q, ["columna", "vertebra", "cervical", "toracica", "lumbar", "sacro", "disco", "medula"])) {
      return "Te entiendo perfectamente... La columna combina rigidez y movimiento gracias a treinta y tres vértebras que protegen la médula espinal. ¿Deseas revisar las curvaturas fisiológicas o los forámenes intervertebrales?";
    }
    // Cráneo / Encéfalo / Neuroanatomía
    if (matchKeywords(q, ["craneo", "cara", "mandibula", "cerebro", "encefalo", "corteza", "cerebelo", "tronco", "willis", "nervo"])) {
      return "Es un tema fascinante... El encéfalo está protegido por las meninges e irrigado por el polígono arterial de Willis. ¿Quieres explorar los doce pares craneales o la corteza cerebral?";
    }
    // Corazón / Vascular
    if (matchKeywords(q, ["corazon", "miocardio", "valvula", "auricula", "ventriculo", "coronaria", "pericardio", "aorta"])) {
      return "¡Con mucho gusto! El corazón bombea la sangre rítmicamente y se nutre en diástole a través de las arterias coronarias. ¿Te gustaría que repasemos el ciclo cardíaco o el sistema de conducción?";
    }
    // Pulmón / Respiratorio
    if (matchKeywords(q, ["pulmon", "pleura", "alveolo", "traquea", "bronquio", "laringe", "diafragma"])) {
      return "Mira, los pulmones realizan el intercambio gaseoso en los alvéolos con el diafragma como motor principal. ¿Quieres profundizar en la mecánica ventilatoria o en las ramas bronquiales?";
    }
    // Digestivo / Hígado / Páncreas
    if (matchKeywords(q, ["estomago", "higado", "pancreas", "vesicula", "intestino", "duodeno", "colon", "peritoneo"])) {
      return "¡Totalmente! Los órganos digestivos reciben su flujo del tronco celíaco y drenan sus nutrientes al hígado por la vena porta. ¿Revisamos la segmentación hepática o las vías biliares?";
    }
    // Riñón / Urogenital
    if (matchKeywords(q, ["riñon", "ureter", "vejiga", "uretra", "utero", "ovario", "prostata", "testiculo"])) {
      return "Es un área clave... Los riñones filtran el plasma en los glomérulos y conducen la orina hacia la pelvis renal y la vejiga. ¿Deseas detallar las nefronas o el piso pélvico?";
    }
    // Saludos / Ayuda
    if (matchKeywords(q, ["hola", "buen dia", "buenas", "que tal", "como estas"]) && q.length < 35) {
      return "¡Hola! Te doy una cálida bienvenida a Aeternum Atlas. Soy Antonia, tu mentora en español. ¿Qué estructura anatómica deseas explorar hoy?";
    }
    if (matchKeywords(q, ["ayuda", "ayudar", "que podes", "como funciona", "que haces"]) && q.length < 40) {
      return "¡Por supuesto! Puedo explicarte con claridad cualquier órgano, músculo o vaso en tres dimensiones. ¿Por dónde prefieres que comencemos?";
    }

    if (graphKnowledge?.primaryStructure) {
      const p = graphKnowledge.primaryStructure;
      return `¡Muy bien! En el estudio de ${p.name || p.regionName || structure}, es fundamental relacionar su topografía con su función clínica. ¿Te gustaría que veamos sus detalles vasculares o sus fijaciones?`;
    }

    return `Te comprendo... En la estructura ${structure ? `de ${structure}` : "en estudio"}, es vital observar sus caras articulares y sus vasos nutricios. ¿Quieres que entremos en detalle ahora?`;
  }

  // =========================================================================
  // 2. ENGLISH — Ariana 🇺🇸 (The Dynamic, Inspiring & Growth-Minded Mentor)
  // =========================================================================
  if (lang === "en") {
    if (matchKeywords(q, ["clavicle", "collarbone", "shoulder", "scapula", "acromion", "sternum"])) {
      return "That is a great question! The clavicle acts as a mechanical strut transmitting upper limb forces directly to the sternum. Would you like to review its ligament attachments or muscle origins?";
    }
    if (matchKeywords(q, ["femur", "hip", "acetabulum", "tibia", "fibula", "knee", "patella"])) {
      return "I love where your head is at on this... The femur is the body's strongest bone, seated firmly in the acetabulum. Shall we inspect the cruciate ligaments or the femoral blood supply?";
    }
    if (matchKeywords(q, ["heart", "cardiac", "ventricle", "atrium", "coronary", "myocardium", "aorta", "valve"])) {
      return "Definitely! The heart functions as a synchronized four-chambered pump perfused during diastole by the coronary arteries. Would you like to explore conduction pathways or cardiac valves?";
    }
    if (matchKeywords(q, ["brain", "cortex", "cerebellum", "brainstem", "cranial", "meninges", "willis", "nerve"])) {
      return "Here is the key takeaway... The central nervous system coordinates neural pathways supplied by the Circle of Willis. Which cranial nerve or cerebral lobe shall we tackle first?";
    }
    if (matchKeywords(q, ["lung", "respiratory", "bronchial", "alveoli", "pleura", "diaphragm", "trachea"])) {
      return "That is a vital concept! The lungs facilitate gas exchange across the alveolar membrane with three lobes on the right and two on the left. Shall we examine the bronchial tree or diaphragmatic motion?";
    }
    if (matchKeywords(q, ["liver", "pancreas", "stomach", "intestine", "duodenum", "colon", "gallbladder", "kidney"])) {
      return "You are on the right track... Abdominal viscera receive arterial supply from the celiac trunk and drain through the portal system. Would you like to review liver segments or pancreatic ducts?";
    }
    if (matchKeywords(q, ["hello", "hi", "hey", "how are you"]) && q.length < 30) {
      return "Hello and welcome to Aeternum Atlas! I am Ariana, your anatomy mentor. How can I guide your journey today?";
    }
    if (matchKeywords(q, ["help", "what can you do", "how can you help"]) && q.length < 40) {
      return "I can guide your 3D anatomical exploration, clarify high-yield clinical correlations, and test your knowledge. What structure would you like to review first?";
    }

    return `I see what you mean regarding ${structure || "this anatomical structure"}. Spatial orientation and vascular supply are key here. Would you like to dive deeper together?`;
  }

  // =========================================================================
  // 3. DEUTSCH — Fabian 🇩🇪 (Der Akademische, Strukturierte & Präzise Mentor)
  // =========================================================================
  if (lang === "de") {
    if (matchKeywords(q, ["clavicula", "schlusselbein", "schulter", "skapula", "sternum", "akromion"])) {
      return "Das ist ein sehr wichtiger Aspekt. Die Clavicula stabilisiert als knöcherne Strebe den Schultergürtel zwischen Sternum und Acromion. Möchtest du die Bandverbindungen oder die Muskelansätze vertiefen?";
    }
    if (matchKeywords(q, ["herz", "kardio", "ventrikel", "vorhof", "klappe", "koronar", "myokard"])) {
      return "Ganz genau... Das Herz arbeitet als muskuläre Vier-Kammer-Pumpe, die über die linke und rechte Koronararterie versorgt wird. Sollen wir das Reizleitungssystem oder den Klappenapparat analysieren?";
    }
    if (matchKeywords(q, ["gehirn", "hirn", "kranial", "nerv", "enzephalon", "hirnstamm", "willis"])) {
      return "Das ist ein zentrales Thema. Das Gehirn wird über den Circulus arteriosus cerebri gespeist und steuert alle übergeordneten Funktionen. Welchen Hirnnerv oder Rindenabschnitt wollen wir betrachten?";
    }
    if (matchKeywords(q, ["lunge", "bronchien", "alveolen", "pleura", "zwerchfell", "respiration"])) {
      return "Lass uns das Schritt für Schritt betrachten... Die Lungenflügel ermöglichen den Gasaustausch in den Alveolen bei koordinierter Zwerchfellbewegung. Möchtest du die Atemmechanik genauer wiederholen?";
    }
    if (matchKeywords(q, ["hallo", "guten tag", "hi", "wie geht"]) && q.length < 30) {
      return "Hallo und herzlich willkommen bei Aeternum Atlas! Ich bin Fabian, dein Anatomie-Mentor. Wie kann ich dir heute helfen?";
    }

    return `Ich verstehe deine Frage zur ${structure || "Anatomie"}. Die räumliche Orientierung und die Leitungsbahnen sind hierbei maßgeblich. Möchtest du diesen Punkt schrittweise vertiefen?`;
  }

  // =========================================================================
  // 4. PORTUGUÊS — Eduardo 🇧🇷 (O Mentor Sênior, Sábio e Acolhedor)
  // =========================================================================
  // Clavícula / Ombro / Membro Superior
  if (matchKeywords(q, ["clavicula", "clavicular", "acromio", "acromion", "esterno", "escapula", "ombro", "braco"])) {
    return "Veja bem, a clavícula funciona como uma ponte mecânica entre o esterno e a escápula, sustentando o ombro para movimentos amplos. Deseja que examinemos suas inserções musculares ou os ligamentos de sustentação?";
  }
  // Úmero / Cotovelo / Antebraço / Mão
  if (matchKeywords(q, ["umero", "radio", "ulna", "cubito", "cotovelo", "punho", "carpo", "mao"])) {
    return "Com certeza... O úmero conecta o ombro ao cotovelo e abriga o nervo radial em seu sulco posterior. Gostaria de rever os movimentos de pronação e supinação ou as articulações da mão?";
  }
  // Fêmur / Pelve / Quadril / Joelho
  if (matchKeywords(q, ["femur", "pelvis", "pelve", "acetabulo", "ilio", "isquio", "pubis", "tibia", "fibula", "joelho", "patela", "rotula"])) {
    return "Entendo perfeitamente o seu ponto. O fêmur é o osso mais resistente do corpo e se apoia com firmeza no acetábulo da pelve. Prefere analisar os ligamentos cruzados do joelho ou a irrigação da cabeça femoral?";
  }
  // Coluna Vertebral / Vértebras / Medula
  if (matchKeywords(q, ["coluna", "vertebra", "cervical", "toracica", "dorsal", "lumbar", "lombar", "sacro", "disco", "medula"])) {
    return "Esse é um caminho fundamental... A coluna reúne trinta e três vértebras que equilibram nossa postura e protegem a medula espinhal. Quer revisar os discos intervertebrais ou as raízes nervosas?";
  }
  // Crânio / Encéfalo / Neuroanatomia
  if (matchKeywords(q, ["cranio", "face", "mandibula", "cerebro", "encefalo", "cortex", "cerebelo", "tronco", "willis", "nervo"])) {
    return "Veja bem, o encéfalo comanda nossas funções vitais e recebe sangue ricamente pelo polígono de Willis. O que você gostaria de explorar primeiro: os doze pares cranianos ou as áreas do córtex?";
  }
  // Coração / Vasos / Sistema Cardiovascular
  if (matchKeywords(q, ["coracao", "miocardio", "valva", "valvula", "atrio", "ventriculo", "coronaria", "pericardio", "aorta"])) {
    return "Com certeza! O coração trabalha como uma bomba de quatro cavidades, nutrido durante o repouso pelas artérias coronárias. Gostaria de rever o trajeto coronário ou o sistema elétrico de condução?";
  }
  // Pulmão / Respiração / Mediastino
  if (matchKeywords(q, ["pulmao", "pleura", "alveolo", "traqueia", "bronquio", "laringe", "diafragma", "respirat"])) {
    return "Entendo sua dúvida... Os pulmões realizam a oxigenação do sangue nos alvéolos com o auxílio direto do músculo diafragma. Quer aprofundar na árvore brônquica ou na mecânica respiratória?";
  }
  // Abdome / Fígado / Pâncreas / Digestório
  if (matchKeywords(q, ["estomago", "figado", "pancreas", "vesicula", "baco", "intestino", "duodeno", "colon", "peritonio"])) {
    return "Esse é um tema muito rico. Os órgãos abdominais recebem sangue do tronco celíaco e drenam seus nutrientes para o fígado pela veia porta. Deseja analisar a segmentação do fígado ou a topografia pancreática?";
  }
  // Rim / Sistema Urogenital
  if (matchKeywords(q, ["rim", "ureter", "bexiga", "uretra", "utero", "ovario", "prostata", "testiculo", "nefron", "renal"])) {
    return "Fique tranquilo, vamos construir esse raciocínio juntos. Os rins filtram o plasma nos néfrons e conduzem a urina até a bexiga pelos ureteres. Gostaria de rever o córtex renal ou a anatomia pélvica?";
  }
  // Saludos / Ajuda
  if (matchKeywords(q, ["ola", "oi", "bom dia", "boa tarde", "tudo bem", "como vai"]) && q.length < 30) {
    return "Olá! Seja muito bem-vindo ao Aeternum Atlas. Eu sou o Eduardo, seu mentor de anatomia. Como posso guiar seus estudos hoje?";
  }
  if (matchKeywords(q, ["ajuda", "ajudar", "o que voce faz", "como funciona", "o que faz", "como pode"]) && q.length < 40) {
    return "Com certeza! Posso guiá-lo no estudo de qualquer órgão, vaso, nervo ou modelo em três dimensões com clareza e paciência. O que você gostaria de explorar primeiro?";
  }

  if (graphKnowledge?.primaryStructure) {
    const p = graphKnowledge.primaryStructure;
    return `Entendo perfeitamente seu interesse em ${p.name || p.regionName || structure}. É fundamental correlacionar sua localização anatômica com as aplicações práticas no paciente. Faz sentido para você começarmos pelas relações ou pelos vasos?`;
  }

  return `Entendo sua dúvida sobre ${structure ? `a estrutura ${structure}` : "este tema anatômico"}. Vamos analisar com calma sua posição topográfica e seus eixos funcionais. O que você gostaria de detalhar primeiro?`;
}

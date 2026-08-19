/**
 * Aeternum Voice AI Brain
 * Multilingual Anatomical Conversational Intelligence for Voice Mentors:
 * Eduardo / Heitor (pt-BR), Antonia (es), Ariana (en), Fabian (de)
 */

export function generateVoiceTutorResponse(question, context = {}, language = "pt") {
  const q = String(question || "").toLowerCase().trim();
  const lang = String(language || "pt").slice(0, 2).toLowerCase();
  const structure = context.structure || context.modelTitle || context.model?.title || "";

  // Helper matching without greedy collisions
  const hasWord = (...words) => words.some((w) => q.includes(w));

  // ==========================================
  // 1. ESPAÑOL (Antonia 🇪🇸)
  // ==========================================
  if (lang === "es") {
    // Clavícula / Huesos / Esqueleto
    if (hasWord("clavicula", "clavícula", "hombro", "escapula", "escápula")) {
      return "La clavícula actúa como un puntal mecánico que conecta el esternón con el acromion de la escápula, transmitiendo fuerzas del miembro superior hacia el esqueleto axial. ¿Quieres repasar sus caras o ligamentos articulares?";
    }
    if (hasWord("femur", "fémur", "tibia", "pelvis", "cadera", "hueso", "esqueleto")) {
      return "El fémur es el hueso más largo y resistente del cuerpo humano, articulando proximalmente en el acetábulo y distalmente en la meseta tibial. ¿Deseas analizar la articulación coxofemoral o la rodilla?";
    }
    // Corazón / Vascular
    if (hasWord("corazon", "corazón", "cardiac", "cardíac", "ventriculo", "ventrículo", "auricula", "aurícula", "valvula", "válvula")) {
      return "El corazón funciona como una bomba tetracameral que impulsa la sangre sistémica a través del ventrículo izquierdo y la pulmonar mediante el ventrículo derecho. ¿Quieres revisar las valvas cardíacas o las arterias coronarias?";
    }
    if (hasWord("arteria", "arterias", "aorta", "vena", "vaso", "sangre", "flujo")) {
      return "Las arterias transportan sangre bajo alta presión asistidas por túnicas elásticas y musculares, mientras las venas utilizan válvulas antirretorno. ¿Deseas examinar una rama vascular específica?";
    }
    // Encéfalo / Sistema Nervioso
    if (hasWord("cerebro", "encefalo", "encéfalo", "cranial", "craneo", "cráneo", "neurona", "nervio")) {
      return "El encéfalo centraliza las funciones motoras, sensitivas y superiores, organizado en hemisferios cerebrales, cerebelo y tronco encefálico, nutrido por el polígono de Willis. ¿Quieres explorar algún par craneal o lóbulo?";
    }
    // Pulmón / Respiratorio
    if (hasWord("pulmon", "pulmón", "respirat", "alveolo", "alvéolo", "traquea", "tráquea", "bronquio")) {
      return "Los pulmones realizan la hematosis mediante el intercambio gaseoso alvéolo-capilar, con tres lóbulos en el derecho y dos en el izquierdo. ¿Deseas detallar la mecánica ventilatoria o el árbol bronquial?";
    }
    // Saludos / Ayuda general
    if (hasWord("hola", "buen dia", "buenas", "que tal", "qué tal", "como estas", "cómo estás") && q.length < 35) {
      return "¡Hola! Soy Antonia, tu mentora de anatomía. Puedo explicarte cualquier órgano, músculo, vaso sanguíneo o vía fisiológica. ¿Qué estructura anatómica deseas explorar ahora?";
    }
    if (hasWord("ayuda", "ayudar", "que podes", "qué podés", "como funciona", "cómo funciona") && q.length < 40) {
      return "Puedo guiarte paso a paso en el análisis de cualquier estructura anatómica 3D, explicarte su fisiología y evaluar tus conocimientos. ¿Por dónde empezamos?";
    }

    return `Entendido. En la estructura anatómica ${structure ? `de ${structure}` : "en estudio"}, es fundamental observar sus relaciones de contigüidad, su inervación y su vascularización. ¿Deseas que entremos en detalles morfológicos?`;
  }

  // ==========================================
  // 2. ENGLISH (Ariana 🇺🇸)
  // ==========================================
  if (lang === "en") {
    if (hasWord("clavicle", "collarbone", "shoulder", "scapula")) {
      return "The clavicle serves as a rigid mechanical strut connecting the sternum to the acromion of the scapula, transmitting upper limb forces to the axial skeleton. Would you like to review its articular facets or ligaments?";
    }
    if (hasWord("femur", "bone", "skeleton", "hip", "knee", "pelvis")) {
      return "The femur is the longest and strongest human bone, articulating proximally at the acetabulum and distally with the tibial plateau. Would you like to analyze its blood supply or biomechanics?";
    }
    if (hasWord("heart", "cardiac", "ventricle", "atrium", "valve", "coronary")) {
      return "The human heart operates as a synchronized four-chambered pump, routing systemic output via the left ventricle and pulmonary flow through the right ventricle. Would you like to explore the cardiac cycle or coronary branches?";
    }
    if (hasWord("brain", "head", "cranial", "neuron", "nerve", "cortex")) {
      return "The brain coordinates sensorimotor and cognitive functions across the cerebral cortex, cerebellum, and brainstem, supplied by the Circle of Willis. Which lobe or cranial nerve would you like to review?";
    }
    if (hasWord("lung", "respiratory", "alveoli", "trachea", "bronchial")) {
      return "The lungs facilitate gas exchange across the alveolar-capillary membrane, organized into three lobes on the right and two on the left. Shall we review ventilation mechanics or pulmonary vasculature?";
    }
    if (hasWord("hello", "hi", "hey", "how are you") && q.length < 30) {
      return "Hello! I am Ariana, your anatomy mentor. I can explain any organ, vessel, nerve, or physiological pathway. What would you like to explore today?";
    }
    if (hasWord("help", "what can you do", "how can you help") && q.length < 40) {
      return "I can guide your 3D anatomical exploration, clarify clinical physiology, and test your knowledge with high-yield concepts. Where shall we begin?";
    }

    return `I understand your question regarding ${structure || "this anatomical structure"}. Spatial orientation, vascular supply, and clinical correlations are paramount here. Would you like to explore this in detail?`;
  }

  // ==========================================
  // 3. DEUTSCH (Fabian 🇩🇪)
  // ==========================================
  if (lang === "de") {
    if (hasWord("clavicula", "schlüsselbein", "schulter", "skapula")) {
      return "Die Clavicula fungiert als mechanische Knochenstütze zwischen dem Sternum und dem Acromion der Scapula und leitet Kräfte der oberen Extremität auf das Rumpfskelett ab. Möchtest du die Gelenke oder Bandstrukturen vertiefen?";
    }
    if (hasWord("herz", "kardio", "ventrikel", "vorhof", "klappe", "koronar")) {
      return "Das Herz arbeitet als viergliedrige Muskelpumpe mit dem linken Ventrikel für den Körperkreislauf und dem rechten Ventrikel für den Lungenkreislauf. Möchtest du die Erregungsleitung oder die Koronargefäße wiederholen?";
    }
    if (hasWord("gehirn", "hirn", "kranial", "nerv", "enzephalon")) {
      return "Das Gehirn gliedert sich in Großhirn, Kleinhirn und Hirnstamm und wird arteriell über den Circulus arteriosus cerebri versorgt. Welchen Bereich möchtest du genauer analysieren?";
    }
    if (hasWord("hallo", "guten tag", "hi", "wie geht") && q.length < 30) {
      return "Hallo! Ich bin Fabian, dein Anatomie-Mentor. Ich kann dich durch 3D-Strukturen führen und physiologische Abläufe erklären. Womit möchtest du heute beginnen?";
    }

    return `Ich verstehe deine Frage zur ${structure || "Anatomie"}. Die räumliche Lage und die Gefäßversorgung sind hierbei zentral. Möchtest du diesen Bereich vertiefen?`;
  }

  // ==========================================
  // 4. PORTUGUÊS (Eduardo / Heitor 🇧🇷)
  // ==========================================
  if (hasWord("clavicula", "clavícula", "ombro", "escápula", "escapula")) {
    return "A clavícula atua como uma haste óssea mecânica entre o manúbrio do esterno e o acrômio da escápula, transmitindo forças do membro superior para o esqueleto axial. Gostaria de rever as inserções musculares ou os ligamentos articulares?";
  }
  if (hasWord("fêmur", "femur", "tíbia", "tibia", "osso", "esqueleto", "quadril", "joelho")) {
    return "O fêmur é o osso mais longo e resistente do esqueleto humano, articulando-se proximalmente no acetábulo e distalmente no platô tibial. Quer aprofundar na vascularização da cabeça femoral ou na biomecânica?";
  }
  if (hasWord("coração", "coracao", "cardíac", "cardiac", "ventrículo", "ventriculo", "átrio", "atrio", "valva", "válvula", "coronária", "coronaria")) {
    return "O coração funciona como uma bomba oca de quatro cavidades que ejeta sangue oxigenado para a circulação sistêmica pelo ventrículo esquerdo e sangue venoso pelo ventrículo direito. Deseja rever o ciclo cardíaco ou a irrigação coronariana?";
  }
  if (hasWord("artéria", "arteria", "aorta", "veia", "vaso", "sangue", "circulação", "circulacao")) {
    return "As artérias conduzem o sangue sob alta pressão com espessas camadas elásticas e musculares, enquanto as veias utilizam valvas para o retorno venoso. Deseja analisar uma ramificação vascular específica?";
  }
  if (hasWord("cérebro", "cerebro", "encéfalo", "encefalo", "cranial", "crânio", "cranio", "nervo", "neurônio", "neuronio")) {
    return "O encéfalo coordena todas as funções superiores e motoras, dividido em telencéfalo, diencéfalo, cerebelo e tronco encefálico, nutrido pelo polígono de Willis. Gostaria de explorar um lobo específico ou os pares cranianos?";
  }
  if (hasWord("pulmão", "pulmao", "respirat", "alvéolo", "alveolo", "traqueia", "traquéia", "brônquio", "bronquio")) {
    return "Os pulmões realizam a hematose nas membranas alvéolo-capilares, divididos em três lobos no pulmão direito e dois no pulmão esquerdo. Gostaria de rever a árvore brônquica ou a mecânica respiratória?";
  }
  if (hasWord("olá", "ola", "oi", "bom dia", "boa tarde", "tudo bem") && q.length < 30) {
    return "Olá! Sou o Eduardo, seu mentor de anatomia. Posso guiá-lo no estudo de qualquer órgão, músculo, vaso ou via clínica. O que você gostaria de explorar hoje?";
  }
  if (hasWord("ajuda", "ajudar", "como você pode", "como pode", "o que você faz", "o que faz") && q.length < 40) {
    return "Posso guiá-lo passo a passo no estudo de qualquer estrutura anatômica em 3D, explicar a fisiologia e testar seus conhecimentos. Por onde você deseja começar?";
  }

  return `Compreendi sua pergunta sobre ${structure ? `o estudo de ${structure}` : "esta estrutura anatômica"}. É essencial correlacionar a topografia anatômica com suas aplicações clínicas e funcionais. Deseja detalhar este ponto agora?`;
}

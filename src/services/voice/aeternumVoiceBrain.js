/**
 * Aeternum Voice AI Brain
 * Multilingual Anatomical Conversational Intelligence for Voice Mentors:
 * Eduardo (pt-BR), Antonia (es), Ariana (en), Fabian (de)
 */

export function generateVoiceTutorResponse(question, context = {}, language = "pt") {
  const q = String(question || "").toLowerCase();
  const lang = String(language || "pt").slice(0, 2).toLowerCase();
  const structure = context.structure || context.modelTitle || context.model?.title || "";

  // 1. ESPAÑOL (Antonia 🇪🇸)
  if (lang === "es") {
    if (q.includes("ayuda") || q.includes("ayudar") || q.includes("hacer") || q.includes("hola") || q.includes("como podes") || q.includes("cómo podés")) {
      return "¡Hola! Puedo guiarte paso a paso en el análisis de cualquier estructura anatómica, explicarte su fisiología y evaluar tus conocimientos. ¿Qué parte deseas examinar hoy?";
    }
    if (q.includes("corazon") || q.includes("corazón") || q.includes("cardiac") || q.includes("cardíac") || structure.toLowerCase().includes("coraç") || structure.toLowerCase().includes("heart")) {
      return "El corazón humano funciona como una bomba muscular de cuatro cavidades: dos aurículas receptoras y dos ventrículos eyectores, irrigados por las arterias coronarias. ¿Deseas repasar el ciclo cardíaco o su vascularización?";
    }
    if (q.includes("cerebro") || q.includes("encefalo") || q.includes("encéfalo") || q.includes("cranial")) {
      return "El encéfalo coordina las funciones superiores y se divide en cerebro, cerebelo y tronco encefálico, con irrigación principal por el polígono de Willis. ¿Quieres profundizar en algún lóbulo en específico?";
    }
    if (q.includes("arteria") || q.includes("arterias") || q.includes("vaso") || q.includes("sangre")) {
      return "Las arterias transportan sangre oxigenada bajo alta presión desde el corazón hacia los tejidos periféricos mediante una túnica media elástica y muscular. ¿Quieres ver una rama arterial específica?";
    }
    return `Entiendo tu consulta sobre ${structure ? structure : "anatomía"}. Es fundamental comprender sus relaciones anatómicas y su función clínica principal. ¿Deseas que profundicemos en este punto?`;
  }

  // 2. ENGLISH (Ariana 🇺🇸)
  if (lang === "en") {
    if (q.includes("help") || q.includes("hello") || q.includes("hi") || q.includes("what can you do") || q.includes("how can you")) {
      return "Hello! I can guide your exploration of 3D anatomical structures, explain clinical physiology, and test your knowledge. What structure would you like to inspect today?";
    }
    if (q.includes("heart") || q.includes("cardiac") || q.includes("coronary")) {
      return "The human heart operates as a four-chambered muscular pump with high-pressure systemic output and low-pressure pulmonary transit. Would you like to review the cardiac cycle or coronary anatomy?";
    }
    if (q.includes("brain") || q.includes("head") || q.includes("cranial") || q.includes("neuron")) {
      return "The human brain integrates neural circuits across the cerebral cortex, cerebellum, and brainstem, primarily supplied by the Circle of Willis. Which region would you like to review?";
    }
    return `I received your question regarding ${structure || "human anatomy"}. Understanding the structural hierarchy and functional relevance is key. Would you like to dive deeper?`;
  }

  // 3. DEUTSCH (Fabian 🇩🇪)
  if (lang === "de") {
    if (q.includes("hilfe") || q.includes("helfen") || q.includes("hallo") || q.includes("was kannst")) {
      return "Hallo! Ich kann dich durch anatomische 3D-Strukturen führen, physiologische Zusammenhänge erklären und dein Wissen vertiefen. Welches Organ möchtest du heute analysieren?";
    }
    if (q.includes("herz") || q.includes("kardio") || q.includes("ventrikel")) {
      return "Das menschliche Herz arbeitet als muskuläre Vier-Kammer-Pumpe, bestehend aus zwei Vorhöfen und zwei Ventrikeln. Möchtest du die Koronargefäße oder den Erregungsablauf wiederholen?";
    }
    return `Ich verstehe deine Frage zur ${structure || "Anatomie"}. Die räumliche Orientierung und die Gefäßversorgung sind hierbei zentral. Möchtest du diesen Bereich genauer betrachten?`;
  }

  // 4. PORTUGUÊS (Eduardo 🇧🇷)
  if (q.includes("ajuda") || q.includes("ajudar") || q.includes("olá") || q.includes("ola") || q.includes("como você pode") || q.includes("como pode")) {
    return "Olá! Posso guiá-lo detalhadamente no estudo de qualquer estrutura anatômica em 3D, esclarecer a fisiologia e testar seus conhecimentos. O que você gostaria de explorar hoje?";
  }
  if (q.includes("coração") || q.includes("coracao") || q.includes("cardíac") || q.includes("cardiac") || q.includes("valva") || q.includes("ventrículo")) {
    return "O coração humano é uma bomba muscular oca com quatro cavidades: átrios direito e esquerdo, e ventrículos direito e esquerdo, nutrido pelas artérias coronárias. Gostaria de rever a circulação ou o sistema de condução?";
  }
  if (q.includes("cérebro") || q.includes("cerebro") || q.includes("encéfalo") || q.includes("encefalo") || q.includes("cranial")) {
    return "O encéfalo é o centro de controle do sistema nervoso, composto por telencéfalo, cerebelo e tronco encefálico, vascularizado pelo polígono de Willis. Quer aprofundar em algum hemisfério ou lobo?";
  }
  if (q.includes("artéria") || q.includes("arteria") || q.includes("veia") || q.includes("vaso")) {
    return "Os vasos arteriais conduzem o fluxo sob alta pressão com espessamento elástico e muscular, enquanto as veias utilizam valvas para o retorno venoso. Deseja visualizar uma ramificação específica no modelo?";
  }

  return `Compreendi sua dúvida sobre ${structure || "esta estrutura anatômica"}. É essencial correlacionar sua localização anatômica com as implicações funcionais na prática médica. Deseja aprofundar este ponto agora?`;
}

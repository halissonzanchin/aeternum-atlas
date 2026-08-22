/**
 * ============================================================================
 * CÉREBRO AETERNUM VITA — MOTOR NEURAL DE VOZ & MULTI-TUTORIA CONVERSACIONAL
 * ============================================================================
 * Exclusivo para os Tutores de Voz da Aeternum Vita:
 * - Eduardo 🇧🇷 (pt-BR)
 * - Antonia 🇪🇸 (es-ES)
 * - Ariana 🇺🇸 (en-US)
 * - Fabian 🇩🇪 (de-DE)
 * 
 * Totalmente isolado do Cérebro Atlas IA (teórico/pesquisa/Markdown).
 * Garante 100% de humanização, cadência falada, empatia e ausência de símbolos.
 */

import { VITA_KNOWLEDGE_NODES, VITA_MENTORSHIP_MODULES } from "./cerebroVitaKnowledgeVault.js";

class CerebroAeternumVitaEngine {
  constructor() {
    this.lastActiveTopic = null;
    this.tutorMemories = {
      eduardo: { activeTopic: null, turnsCount: 0 },
      antonia: { activeTopic: null, turnsCount: 0 },
      ariana: { activeTopic: null, turnsCount: 0 },
      fabian: { activeTopic: null, turnsCount: 0 }
    };
  }

  normalize(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  cleanSpokenCadence(text) {
    return String(text || "")
      .replace(/\[ACTION:[^\]]+\]/g, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/[*_#`~>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  containsAny(query, synonyms) {
    if (!Array.isArray(synonyms)) return false;
    return synonyms.some((syn) => {
      const normalizedSyn = this.normalize(syn);
      return query.includes(normalizedSyn);
    });
  }

  findKnowledgeNode(query) {
    const q = this.normalize(query);
    for (const key of Object.keys(VITA_KNOWLEDGE_NODES)) {
      const node = VITA_KNOWLEDGE_NODES[key];
      if (this.containsAny(q, node.synonyms)) {
        return node;
      }
    }
    return null;
  }

  findMentorshipNode(query) {
    const q = this.normalize(query);
    for (const key of Object.keys(VITA_MENTORSHIP_MODULES)) {
      const node = VITA_MENTORSHIP_MODULES[key];
      if (this.containsAny(q, node.synonyms)) {
        return node;
      }
    }
    return null;
  }

  getPersonaHooks(tutorKey = "eduardo") {
    switch (tutorKey) {
      case "antonia":
        return ["¡Por supuesto!", "Mira,", "Te entiendo perfectamente,", "¡Qué interessante!", "¡Totalmente!"];
      case "ariana":
        return ["Definitely!", "I hear you!", "That makes total sense,", "Great question!", "I love that point,"];
      case "fabian":
        return ["Ganz genau.", "Sehr gut.", "Ich verstehe vollkommen.", "Lass uns das Schritt für Schritt betrachten:"];
      case "eduardo":
      default:
        return ["Com certeza,", "Veja bem,", "Entendo perfeitamente,", "Excelente ponto,", "Fique tranquilo,"];
    }
  }

  getRandomHook(tutorKey = "eduardo") {
    const hooks = this.getPersonaHooks(tutorKey);
    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  generateHumanConversationResponse(query, lang = "pt", persona = "eduardo") {
    const q = this.normalize(query);
    const hook = this.getRandomHook(persona);

    if (lang === "es") {
      if (q.includes("gracias") || q.includes("muchas gracias") || q.includes("genial")) {
        return `${hook} ¡De nada! Me alegra mucho acompañarte en tu estudio. ¿Hay algún otro punto anatómico que quieras repasar ahora?`;
      }
      return `${hook} Estoy aquí para acompañarte en tu preparación médica. ¿Te gustaría explorar alguna estructura anatómica o prefieres que organicemos tu rutina de repaso?`;
    }

    if (lang === "en") {
      if (q.includes("thank") || q.includes("thanks") || q.includes("awesome") || q.includes("great")) {
        return `${hook} You are very welcome! I am thrilled to help you master this. Is there any specific anatomical landmark you want to tackle next?`;
      }
      return `${hook} I am right here with you. Would you like to dive into a specific anatomical structure, or shall we organize your study goals for today?`;
    }

    if (lang === "de") {
      if (q.includes("danke") || q.includes("vielen dank") || q.includes("super")) {
        return `${hook} Sehr gerne! Es freut mich, dich zu begleiten. Gibt es eine weitere anatomische Struktur, die du heute besprechen möchtest?`;
      }
      return `${hook} Ich begleite dich gerne bei deinem Anatomiestudium. Möchtest du eine bestimmte Struktur ansehen oder deine Lernroutine planen?`;
    }

    if (q.includes("obrigado") || q.includes("obrigada") || q.includes("valeu") || q.includes("show")) {
      return `${hook} fico muito feliz em caminhar ao seu lado nos seus estudos de medicina. Deseja revisar mais alguma estrutura anatômica agora?`;
    }
    return `${hook} estou aqui para guiar seus passos. Deseja explorar uma estrutura anatômica específica ou quer que organizemos sua rotina de estudos?`;
  }

  /**
   * Consulta principal do Cérebro Aeternum Vita
   * Retorna SEMPRE uma string falada natural, calorosa e fluida seguindo a Fórmula de 3 Etapas:
   * 1. Gancho de Escuta Ativa (2-4 palavras)
   * 2. Núcleo Conceitual Oral (1-2 frases curtas)
   * 3. Ponte de Engajamento (1 pergunta aberta)
   */
  consultar({ query, language = "pt", persona = null, context = {} }) {
    const rawQ = String(query || "").trim();
    if (!rawQ) {
      return this.generateHumanConversationResponse("", language, persona);
    }

    const q = this.normalize(rawQ);
    const lang = String(language || "pt").slice(0, 2).toLowerCase();
    const tutorKey = String(persona || (lang === "es" ? "antonia" : lang === "en" ? "ariana" : lang === "de" ? "fabian" : "eduardo")).toLowerCase();

    // 1. Verificar Mentoria, Apoio Emocional, Rotina e Saudações
    const mentorship = this.findMentorshipNode(q);
    if (mentorship) {
      if (this.tutorMemories[tutorKey]) {
        this.tutorMemories[tutorKey].activeTopic = null;
        this.tutorMemories[tutorKey].turnsCount += 1;
      }
      const resp = mentorship.responses?.[lang] || mentorship.responses?.pt;
      if (resp) return this.cleanSpokenCadence(resp);
    }

    // 2. Verificar Tópico Anatômico Primário
    let activeTopic = this.tutorMemories[tutorKey]?.activeTopic;
    let activeNode = activeTopic ? this.findKnowledgeNode(activeTopic) : null;
    const directNode = this.findKnowledgeNode(q);

    if (directNode) {
      activeNode = directNode;
      if (this.tutorMemories[tutorKey]) {
        this.tutorMemories[tutorKey].activeTopic = directNode.id;
        this.tutorMemories[tutorKey].turnsCount += 1;
      }
    }

    // 3. Verificar Subtópicos no Nó Ativo (Músculos, Ligamentos, Vasos)
    if (activeNode && Array.isArray(activeNode.subTopics)) {
      for (const sub of activeNode.subTopics) {
        if (this.containsAny(q, sub.synonyms)) {
          const subResp = sub.spokenAnswers?.[lang] || sub.spokenAnswers?.pt;
          if (subResp) return this.cleanSpokenCadence(subResp);
        }
      }
    }

    // 4. Resposta do Nó Anatômico Ativo
    if (activeNode && activeNode.spokenAnswers) {
      const resp = activeNode.spokenAnswers[lang] || activeNode.spokenAnswers.pt;
      if (resp) return this.cleanSpokenCadence(resp);
    }

    // 5. Se o usuário mencionou uma estrutura anatômica que não está no banco estático
    if (rawQ.length > 2 && !q.includes("como") && !q.includes("ola") && !q.includes("hola")) {
      const words = rawQ.split(/\s+/);
      const possibleTopic = words.slice(0, 3).join(" ");
      const cap = possibleTopic.charAt(0).toUpperCase() + possibleTopic.slice(1);
      const hook = this.getRandomHook(tutorKey);

      if (lang === "es") {
        return `${hook} ${cap} es una estructura anatómica fundamental. ¿Qué aspecto específico deseas repasar ahora: sus relaciones topográficas, irrigación o inserciones?`;
      }
      if (lang === "en") {
        return `${hook} ${cap} is a key anatomical structure. Which specific aspect would you like to review: its anatomical landmarks, blood supply, or attachments?`;
      }
      if (lang === "de") {
        return `${hook} ${cap} ist eine wichtige anatomische Struktur. Welchen Bereich möchtest du besprechen: topografische Grenzen, Gefäße oder Muskeln?`;
      }
      return `${hook} ${cap} é uma estrutura anatômica fundamental. Qual aspecto específico você gostaria de revisar agora: limites topográficos, irrigação ou inserções musculares?`;
    }

    // 6. Resposta Conversacional Padrão Acolhedora
    return this.cleanSpokenCadence(this.generateHumanConversationResponse(q, lang, tutorKey));
  }

  obterEstatisticas() {
    return {
      tutor: "Aeternum Vita Voice Multi-Tutor Engine",
      nodes: Object.keys(VITA_KNOWLEDGE_NODES).length,
      mentorshipModules: Object.keys(VITA_MENTORSHIP_MODULES).length,
      status: "operacional_isolado"
    };
  }
}

export const cerebroAeternumVita = new CerebroAeternumVitaEngine();

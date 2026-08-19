/**
 * Cérebro Aeternum — Motor Central de Inteligência & Consciência Médica
 * Alimenta tanto os Tutores de Voz (Aeternum Vita) quanto o Atlas AI (Pesquisa & Estudo Textual)
 */

import {
  CEREBRO_CATEGORIES,
  CEREBRO_KNOWLEDGE_NODES,
  CEREBRO_MENTORSHIP_NODES
} from "./cerebroKnowledgeVault.js";

class CerebroAeternumEngine {
  constructor() {
    this.customKnowledgeVault = new Map();
    this.conversationHistory = [];
    this.lastActiveTopic = null;
  }

  normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  containsAny(text, keywords = []) {
    const norm = this.normalize(text);
    return keywords.some((kw) => norm.includes(this.normalize(kw)));
  }

  /**
   * Alimenta o Cérebro Aeternum com novos conhecimentos continuamente
   * (Pode ser chamado dinamicamente com novos capítulos, artigos e flashcards)
   */
  alimentarCerebro({
    id,
    category = CEREBRO_CATEGORIES.OSTEOLOGY,
    title,
    synonyms = [],
    coreConcept,
    vascularSupply,
    innervationAndMuscles,
    clinicalPearls,
    voiceSummary
  }) {
    if (!id) return false;
    const node = {
      id,
      category,
      title: typeof title === "string" ? { pt: title, es: title, en: title, de: title } : title,
      synonyms: [...synonyms, id],
      coreConcept: typeof coreConcept === "string" ? { pt: coreConcept, es: coreConcept, en: coreConcept, de: coreConcept } : coreConcept,
      vascularSupply: typeof vascularSupply === "string" ? { pt: vascularSupply, es: vascularSupply, en: vascularSupply, de: vascularSupply } : vascularSupply,
      innervationAndMuscles: typeof innervationAndMuscles === "string" ? { pt: innervationAndMuscles, es: innervationAndMuscles, en: innervationAndMuscles, de: innervationAndMuscles } : innervationAndMuscles,
      clinicalPearls: typeof clinicalPearls === "string" ? { pt: clinicalPearls, es: clinicalPearls, en: clinicalPearls, de: clinicalPearls } : clinicalPearls,
      voiceSummary: typeof voiceSummary === "string" ? { pt: voiceSummary, es: voiceSummary, en: voiceSummary, de: voiceSummary } : voiceSummary
    };
    this.customKnowledgeVault.set(id, node);
    return true;
  }

  /**
   * Identifica o nó de conhecimento correspondente à pergunta do usuário
   */
  findKnowledgeNode(query) {
    const q = this.normalize(query);

    // 1. Check custom ingested vault first
    for (const [_, node] of this.customKnowledgeVault) {
      if (this.containsAny(q, node.synonyms)) {
        return node;
      }
    }

    // 2. Check standard knowledge nodes
    for (const key in CEREBRO_KNOWLEDGE_NODES) {
      const node = CEREBRO_KNOWLEDGE_NODES[key];
      if (this.containsAny(q, node.synonyms)) {
        return node;
      }
    }

    return null;
  }

  /**
   * Identifica nós de mentoria emocional, psicológica ou coaching de rotina
   */
  findMentorshipNode(query) {
    const q = this.normalize(query);
    for (const key in CEREBRO_MENTORSHIP_NODES) {
      const node = CEREBRO_MENTORSHIP_NODES[key];
      if (this.containsAny(q, node.synonyms)) {
        return node;
      }
    }
    return null;
  }

  /**
   * Consulta o Cérebro Aeternum
   * @param {Object} params
   * @param {string} params.query - Pergunta ou desabafo do aluno
   * @param {'voice' | 'research'} params.mode - Modo de saída (voz concisa ou pesquisa aprofundada)
   * @param {string} params.language - pt, es, en, de
   * @param {Object} params.context - Dados da tela atual e modelo 3D
   */
  consultar({ query, mode = "voice", language = "pt", context = {} }) {
    const rawQ = String(query || "").trim();
    const q = this.normalize(rawQ);
    const lang = String(language || "pt").slice(0, 2).toLowerCase();

    // Check for continuation requests ("fale mais", "continue", "y qué más")
    const isContinuation = this.containsAny(q, [
      "fale mais", "mais sobre", "continue", "prossiga", "alem disso", "além disso",
      "hablemos mas", "hablemos más", "mas sobre", "más sobre", "continua", "sigue",
      "tell me more", "more about", "continue", "go on", "what else",
      "mehr daruber", "mehr darüber", "weiter", "erzahle mehr"
    ]);

    let node = this.findKnowledgeNode(q);
    if (isContinuation && !node && this.lastActiveTopic) {
      node = this.findKnowledgeNode(this.lastActiveTopic);
    }

    if (node) {
      this.lastActiveTopic = node.id;
    }

    const mentorship = this.findMentorshipNode(q);

    // =========================================================================
    // MODO 1: RESPOSTA PARA PESQUISA PROFUNDA (Atlas AI Textual / Pesquisa)
    // =========================================================================
    if (mode === "research") {
      if (node) {
        const title = node.title?.[lang] || node.title?.pt || node.id;
        const concept = node.coreConcept?.[lang] || node.coreConcept?.pt || "";
        const vascular = node.vascularSupply?.[lang] || node.vascularSupply?.pt || "";
        const innervation = node.innervationAndMuscles?.[lang] || node.innervationAndMuscles?.pt || "";
        const pearls = node.clinicalPearls?.[lang] || node.clinicalPearls?.pt || "";

        return {
          title,
          category: node.category,
          markdown: `### 🔬 ${title}

**Conceito Anatômico Fundamental:**
${concept}

${vascular ? `**🩸 Irrigação & Vascularização:**\n${vascular}\n` : ""}
${innervation ? `**⚡ Inervação & Relações Musculares:**\n${innervation}\n` : ""}
${pearls ? `**🩺 Correlações Clínicas & Cirúrgicas (Latarjet):**\n${pearls}\n` : ""}

---
💡 *Dica de Estudo Aeternum:* Utilize a visualização 3D e teste seus conhecimentos com o simulado anatômico desta estrutura.`,
          node
        };
      }
    }

    // =========================================================================
    // MODO 2: RESPOSTA PARA OS TUTORES DE VOZ (Aeternum Vita — Oral & Humanizado)
    // =========================================================================

    // 1. Se for acolhimento emocional ou coaching de estudos:
    if (mentorship) {
      const resp = mentorship.responses?.[lang] || mentorship.responses?.pt;
      if (resp) return resp;
    }

    // 2. Se for conhecimento anatômico/clínico estruturado:
    if (node && node.voiceSummary) {
      const resp = node.voiceSummary?.[lang] || node.voiceSummary?.pt;
      if (resp) return resp;
    }

    // 3. Respostas adaptativas por idioma quando for pergunta aberta:
    if (lang === "es") {
      if (this.containsAny(q, ["hola", "buen dia", "buenas", "como estas"]) && q.length < 25) {
        return "¡Hola! Te doy una cálida bienvenida. Soy Antonia, tu mentora y compañera de estudio. ¿Cómo te sientes hoy y en qué te puedo colaborar?";
      }
      return "Te entiendo perfectamente... Estoy aquí para ayudarte tanto con la teoría anatómica como para guiar tu rutina de estudio. ¿Qué tema o duda te gustaría que resolvamos ahora?";
    }

    if (lang === "en") {
      if (this.containsAny(q, ["hello", "hi", "hey", "how are you"]) && q.length < 25) {
        return "Hello and welcome! I am Ariana, your mentor and study coach. How are you feeling today and what would you like to accomplish?";
      }
      return "I hear you loud and clear! I am here to support your clinical knowledge, study routine, and learning mindset. What would you like to focus on next?";
    }

    if (lang === "de") {
      if (this.containsAny(q, ["hallo", "guten tag", "hi", "wie geht"]) && q.length < 25) {
        return "Hallo und herzlich willkommen! Ich bin Fabian, dein Studienmentor und Anatomiebegleiter. Wie fühlst du dich heute und womit starten wir?";
      }
      return "Ich verstehe dich sehr gut. Ich unterstütze dich bei der Organisation deines Lernens ebenso wie bei anatomischen Fragestellungen. Womit wollen wir weitermachen?";
    }

    // Português (Eduardo)
    if (this.containsAny(q, ["ola", "oi", "bom dia", "boa tarde", "tudo bem", "como vai"]) && q.length < 25) {
      return "Olá! Seja muito bem-vindo. Eu sou o Eduardo, seu mentor e companheiro de jornada nos estudos. Como você está se sentindo hoje e em que posso apoiá-lo?";
    }

    return "Entendo perfeitamente o seu ponto. Estou aqui tanto para apoiar na compreensão anatômica e clínica quanto para ajudar a organizar seus estudos. Por qual tema ou dúvida você gostaria de começar agora?";
  }

  /**
   * Retorna estatísticas de conhecimento do Cérebro Aeternum
   */
  obterEstatisticas() {
    const totalPadrao = Object.keys(CEREBRO_KNOWLEDGE_NODES).length;
    const totalMentor = Object.keys(CEREBRO_MENTORSHIP_NODES).length;
    const totalCustom = this.customKnowledgeVault.size;
    return {
      totalNodes: totalPadrao + totalMentor + totalCustom,
      totalPadrao,
      totalMentor,
      totalCustom,
      status: "ativo_operacional"
    };
  }
}

export const cerebroAeternum = new CerebroAeternumEngine();

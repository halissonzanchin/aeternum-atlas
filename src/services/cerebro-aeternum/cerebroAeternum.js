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
    voiceSummary,
    subTopics = []
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
      voiceSummary: typeof voiceSummary === "string" ? { pt: voiceSummary, es: voiceSummary, en: voiceSummary, de: voiceSummary } : voiceSummary,
      subTopics
    };
    this.customKnowledgeVault.set(id, node);
    return true;
  }

  /**
   * Identifica o nó de conhecimento correspondente à pergunta do usuário
   */
  findKnowledgeNode(query) {
    const q = this.normalize(query);

    for (const [_, node] of this.customKnowledgeVault) {
      if (this.containsAny(q, node.synonyms)) {
        return node;
      }
    }

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
   */
  consultar({ query, mode = "voice", language = "pt", context = {} }) {
    const rawQ = String(query || "").trim();
    const q = this.normalize(rawQ);
    const lang = String(language || "pt").slice(0, 2).toLowerCase();

    // 1. Mentoria, Coaching e Psicologia têm prioridade sobre tópicos anatômicos anteriores
    const mentorship = this.findMentorshipNode(q);
    if (mentorship) {
      this.lastActiveTopic = null; // reset active topic when student asks for coaching
      const resp = mentorship.responses?.[lang] || mentorship.responses?.pt;
      if (resp) return resp;
    }

    // 2. Se o usuário mencionou uma nova estrutura anatômica primária
    let activeNode = this.lastActiveTopic ? this.findKnowledgeNode(this.lastActiveTopic) : null;
    const directNode = this.findKnowledgeNode(q);
    if (directNode) {
      activeNode = directNode;
      this.lastActiveTopic = directNode.id;
    }

    // 3. Se temos um nó ativo, procurar nos seus sub-tópicos (músculos, ligamentos, vascularização)
    if (activeNode && Array.isArray(activeNode.subTopics)) {
      for (const sub of activeNode.subTopics) {
        if (this.containsAny(q, sub.synonyms)) {
          const subResp = sub.responses?.[lang] || sub.responses?.pt;
          if (subResp) return subResp;
        }
      }
    }

    // =========================================================================
    // MODO 1: PESQUISA TEXTUAL PROFUNDA (Atlas AI)
    // =========================================================================
    if (mode === "research" && activeNode) {
      const title = activeNode.title?.[lang] || activeNode.title?.pt || activeNode.id;
      const concept = activeNode.coreConcept?.[lang] || activeNode.coreConcept?.pt || "";
      const vascular = activeNode.vascularSupply?.[lang] || activeNode.vascularSupply?.pt || "";
      const innervation = activeNode.innervationAndMuscles?.[lang] || activeNode.innervationAndMuscles?.pt || "";
      const pearls = activeNode.clinicalPearls?.[lang] || activeNode.clinicalPearls?.pt || "";

      return {
        title,
        category: activeNode.category,
        markdown: `### 🔬 ${title}

**Conceito Anatômico Fundamental:**
${concept}

${vascular ? `**🩸 Irrigação & Vascularização:**\n${vascular}\n` : ""}
${innervation ? `**⚡ Inervação & Relações Musculares:**\n${innervation}\n` : ""}
${pearls ? `**🩺 Correlações Clínicas & Cirúrgicas (Latarjet):**\n${pearls}\n` : ""}

---
💡 *Dica de Estudo Aeternum:* Utilize a visualização 3D e teste seus conhecimentos com o simulado anatômico desta estrutura.`,
        node: activeNode
      };
    }

    // =========================================================================
    // MODO 2: TUTORES DE VOZ (Aeternum Vita — Oral & Humanizado)
    // =========================================================================

    // Resumo vocal do nó anatômico
    if (activeNode && activeNode.voiceSummary) {
      const resp = activeNode.voiceSummary?.[lang] || activeNode.voiceSummary?.pt;
      if (resp) return resp;
    }

    // Respostas abertas por idioma
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

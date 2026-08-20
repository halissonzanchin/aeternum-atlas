/**
 * Cérebro Aeternum — Motor Central de Inteligência & Consciência Médica
 * Alimenta tanto os Tutores de Voz (Aeternum Vita) quanto o Atlas AI (Pesquisa & Estudo Textual)
 * 100% Humanizado, Proativo, Empático e Adaptativo.
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
    this.interactionCount = 0;
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
   * Resposta Proativa, Humanizada e Empática para Conversas Gerais
   */
  generateHumanConversationResponse(q, lang) {
    this.interactionCount++;

    // 1. Saudações e Cumprimentos
    if (this.containsAny(q, ["hola", "buen dia", "buenas", "ola", "oi", "bom dia", "boa tarde", "hello", "hi", "hey", "hallo", "guten tag"])) {
      if (lang === "es") {
        return "¡Hola! Qué alegría saludarte hoy. Soy Antonia, tu compañera y mentora aquí en el atlas. ¿Cómo va tu día de estudio y qué podemos explorar juntos?";
      }
      if (lang === "en") {
        return "Hello! It is fantastic to connect with you today. I am Ariana, your mentor and study coach. How is your day going and what shall we dive into?";
      }
      if (lang === "de") {
        return "Hallo! Schön, dich zu hören. Ich bin Fabian, dein Studienmentor. Wie läuft dein Tag und welches Thema gehen wir heute gemeinsam an?";
      }
      return "Olá! Que satisfação falar com você hoje. Eu sou o Eduardo, seu mentor e conselheiro de estudos. Como está seu dia e em que posso te apoiar agora?";
    }

    // 2. Perguntas sobre como o tutor está ou sentimentos mútuos
    if (this.containsAny(q, ["como estas", "como te sientes", "como vai", "tudo bem", "como voce esta", "how are you", "wie geht"])) {
      if (lang === "es") {
        return "¡Estoy con toda la energía y lista para acompañarte! Me encanta cuando nos tomamos este momento para aprender juntos. ¿Cómo te sientes tú hoy con tus metas de estudio?";
      }
      if (lang === "en") {
        return "I am feeling energized and ready to guide your learning journey! How are you feeling today and how is your study flow going?";
      }
      if (lang === "de") {
        return "Mir geht es ausgezeichnet, vielen Dank! Ich freue mich darauf, dich heute zu begleiten. Wie fühlst du dich und womit möchten wir starten?";
      }
      return "Estou ótimo e muito motivado para caminharmos juntos nos seus estudos! Como você está se sentindo hoje com a sua rotina?";
    }

    // 3. Agradecimentos e Elogios
    if (this.containsAny(q, ["gracias", "muchas gracias", "obrigado", "obrigada", "valeu", "excelente", "genial", "thank you", "thanks", "danke"])) {
      if (lang === "es") {
        return "¡Es todo un gusto ayudarte! Estoy aquí precisamente para que sientas ese respaldo en cada paso. ¿Qué otra duda o tema te gustaría que repasemos?";
      }
      if (lang === "en") {
        return "You are very welcome! That is exactly what I am here for. What other concept or question would you like to tackle together?";
      }
      if (lang === "de") {
        return "Sehr gerne! Genau dafür bin ich da. Welchen weiteren Aspekt oder welche Frage möchtest du als Nächstes besprechen?";
      }
      return "O prazer é todo meu! Fico muito feliz em poder te apoiar nesse processo. Qual o próximo ponto ou dúvida que você gostaria de ver?";
    }

    // 4. Desabafo sobre Medicina, Cansaço ou Desafio Geral
    if (this.containsAny(q, ["dificil", "pesado", "cansador", "cansado", "agobiado", "estres", "ansiedad", "medicina", "hospital", "prova", "examen"])) {
      if (lang === "es") {
        return "Te entiendo de corazón... El camino médico exige muchísimo de nosotros y es totalmente válido sentirse así. ¿Prefieres que hagamos una pausa suave o que revisemos un caso clínico inspirador?";
      }
      if (lang === "en") {
        return "I truly understand how demanding medical studies can be, and it is completely normal to feel this pressure. Would you like to take a light breath or look at an inspiring clinical case?";
      }
      if (lang === "de") {
        return "Ich verstehe dich gut, das Medizinstudium verlangt enorme Ausdauer. Wollen wir eine kurze Pause machen oder uns einem motivierenden klinischen Fall widmen?";
      }
      return "Eu compreendo perfeitamente de coração... A jornada na medicina é intensa e esse cansaço faz parte do processo. Que tal darmos uma respirada com calma ou vermos algo mais leve agora?";
    }

    // 5. Resposta Geral Adaptativa & Proativa
    if (lang === "es") {
      return "Te escucho con total atención. Además de la anatomía, me importa mucho cómo te sientes y cómo organizas tus días. Cuéntame, ¿qué tienes en mente o qué necesitas resolver ahora mismo?";
    }
    if (lang === "en") {
      return "I am listening closely! Beyond anatomy, I care about your study flow and well-being. Tell me, what is on your mind or what would you like to achieve right now?";
    }
    if (lang === "de") {
      return "Ich höre dir aufmerksam zu. Neben der reinen Anatomie liegt mir dein Studienerfolg am Herzen. Was beschäftigt dich gerade oder wobei kann ich dich unterstützen?";
    }
    return "Estou te ouvindo com total atenção. Além da anatomia, me importo muito com seu bem-estar e seu ritmo de estudos. Me conte, o que você tem em mente ou precisa resolver agora?";
  }

  /**
   * Gerador Inteligente de Mapa Mental Anatômico
   * Cria esboços perfeitamente hierárquicos, ricos e estruturados para o tema solicitado
   */
  gerarMapaMentalAnatomico(topic, lang = "pt") {
    const cleanTopic = String(topic || "Estrutura Anatômica").trim();
    const node = this.findKnowledgeNode(cleanTopic);

    if (node) {
      const title = node.title?.[lang] || node.title?.pt || cleanTopic;
      const sub = node.subTopics || [];
      const lines = [title];

      // 1. Morfologia e Fundamento Estrutural
      lines.push(" Morfologia & Fundamento Estrutural");
      lines.push(`  Conceito: ${node.coreConcept?.[lang] || node.coreConcept?.pt || "Organização Anatômica"}`);
      lines.push("  Posição Anatômica e Relações Topográficas");
      lines.push("  Acidentes Anatômicos & Vistas Descritivas");

      // 2. Subtópicos específicos (Músculos, Ligamentos, Válvulas, etc.)
      if (sub.length > 0) {
        lines.push(" Inserções, Ligamentos & Dinâmica Funcional");
        sub.forEach((s) => {
          const subTitle = s.id ? s.id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Estrutura";
          lines.push(`  ${subTitle}`);
          lines.push(`   ${s.responses?.[lang]?.slice(0, 75) || s.responses?.pt?.slice(0, 75) || "Detalhe Anátomo-Funcional"}`);
        });
      }

      // 3. Irrigação & Vascularização
      if (node.vascularSupply) {
        lines.push(" Vascularização & Drenagem Linfática");
        lines.push(`  ${node.vascularSupply?.[lang]?.slice(0, 80) || node.vascularSupply?.pt?.slice(0, 80)}`);
        lines.push("  Drenagem Venosa e Vias de Retorno");
      }

      // 4. Inervação
      if (node.innervationAndMuscles) {
        lines.push(" Inervação & Controle Neural");
        lines.push(`  ${node.innervationAndMuscles?.[lang]?.slice(0, 80) || node.innervationAndMuscles?.pt?.slice(0, 80)}`);
      }

      // 5. Correlações Clínicas & Cirúrgicas (Latarjet)
      if (node.clinicalPearls) {
        lines.push(" Correlações Clínicas & Cirúrgicas (Latarjet)");
        lines.push(`  ${node.clinicalPearls?.[lang]?.slice(0, 85) || node.clinicalPearls?.pt?.slice(0, 85)}`);
        lines.push("  Pontos de Fragilidade e Aplicações Cirúrgicas");
      }

      return lines.join("\n");
    }

    // Gerador universal para qualquer termo anatômico livre digitado pelo usuário
    const capitalized = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);
    return `${capitalized}
 Morfologia & Fundamento Estrutural
  Posição Anatômica e Limites Topográficos
  Divisões e Porções Principais
  Relações Espaciais com Estruturas Vizinhas
 Relações Musculares & Dinâmica
  Inserções Musculares e Fáscias de Revestimento
  Ação Biomecânica e Amplitude de Movimento
  Ligamentos de Reforço e Cápsula Articular
 Irrigação, Drenagem & Linfáticos
  Ramos Arteriais Principais
  Plexos Venosos e Vias de Retorno
  Cadeias Linfáticas Regionais
 Inervação & Vias Condutoras
  Ramos Nervosos Sensitivos e Motores
  Controle Autônomo e Reflexos Locais
 Correlações Clínicas & Cirúrgicas (Latarjet)
  Pontos de Fragilidade e Lesões Típicas
  Sinais Semiológicos e Exames de Imagem
  Considerações Anatômicas para Procedimentos`;
  }

  /**
   * Resposta Vocal 100% Humanizada, Fluida e Empática para Tutores de Voz (Aeternum Vita)
   * Sem símbolos, sem Markdown, sem títulos de seção, com cadência natural falada
   */
  gerarRespostaVocalHumanizada(node, directTopic, q, lang = "pt") {
    if (node) {
      if (node.voiceSummary) {
        const resp = node.voiceSummary[lang] || node.voiceSummary.pt;
        if (resp) return resp;
      }

      const title = node.title?.[lang] || node.title?.pt || node.id;
      const concept = node.coreConcept?.[lang] || node.coreConcept?.pt || "";

      if (lang === "es") {
        return `${title}: ${concept} ¿Te gustaría que profundicemos en su vascularización o en sus relaciones musculares y clínicas?`;
      }
      if (lang === "en") {
        return `${title}: ${concept} Would you like us to explore its vascular supply or its clinical and muscular relations?`;
      }
      if (lang === "de") {
        return `${title}: ${concept} Möchtest du die Gefäßversorgung oder die klinischen Beziehungen vertiefen?`;
      }
      return `${title}: ${concept} Deseja que aprofundemos na irrigação vascular ou nas relações musculares e clínicas?`;
    }

    // Se for uma estrutura genérica mencionada pelo usuário
    if (directTopic && directTopic.length > 2) {
      const cap = directTopic.charAt(0).toUpperCase() + directTopic.slice(1);
      if (lang === "es") {
        return `Excelente tema. ${cap} es una estructura anatómica fundamental. ¿Qué aspecto específico deseas repasar ahora: sus límites topográficos, irrigación o inserciones?`;
      }
      if (lang === "en") {
        return `Great topic. ${cap} is a key anatomical structure. Which specific aspect would you like to review: its landmarks, blood supply, or muscular attachments?`;
      }
      if (lang === "de") {
        return `Sehr gutes Thema. ${cap} ist eine wichtige anatomische Struktur. Welchen Bereich möchtest du besprechen: topografische Grenzen, Gefäße oder Muskeln?`;
      }
      return `Excelente tema. ${cap} é uma estrutura anatômica fundamental. Qual aspecto específico você gostaria de revisar agora: limites topográficos, irrigação ou inserções musculares?`;
    }

    return this.generateHumanConversationResponse(q, lang);
  }

  /**
   * Consulta o Cérebro Aeternum
   */
  consultar({ query, mode = "voice", language = "pt", context = {} }) {
    const rawQ = String(query || "").trim();
    const q = this.normalize(rawQ);
    const lang = String(language || "pt").slice(0, 2).toLowerCase();

    // 0. Se for geração de Mapa Mental:
    const isMindMap = context.source === "mind-map" || q.includes("mapa mental") || rawQ.includes("TEMA:");
    if (isMindMap) {
      let targetTopic = context.sectionTitle || "";
      if (!targetTopic) {
        const match = rawQ.match(/TEMA:\s*(.+)/i);
        if (match && match[1]) {
          targetTopic = match[1].trim();
        } else {
          targetTopic = rawQ.replace(/Crie um mapa mental.*?TEMA:\s*/is, "").trim();
        }
      }
      if (!targetTopic || targetTopic.length < 2) targetTopic = "Estrutura Anatômica";

      const node = this.findKnowledgeNode(targetTopic);
      if (node) {
        this.lastActiveTopic = node.id;
      }
      return this.gerarMapaMentalAnatomico(targetTopic, lang);
    }

    // 1. Se for uma pergunta de mentoria, coaching ou rotina:
    const mentorship = this.findMentorshipNode(q);
    if (mentorship) {
      this.lastActiveTopic = null;
      const resp = mentorship.responses?.[lang] || mentorship.responses?.pt;
      if (resp) return resp;
    }

    // 2. Se o usuário mencionou uma nova estrutura primária:
    let activeNode = this.lastActiveTopic ? this.findKnowledgeNode(this.lastActiveTopic) : null;
    const directNode = this.findKnowledgeNode(q);
    if (directNode) {
      activeNode = directNode;
      this.lastActiveTopic = directNode.id;
    }

    // =========================================================================
    // MODO 2: TUTORES DE VOZ (Aeternum Vita) — 100% HUMANIZADO E CONVERSACIONAL
    // =========================================================================
    if (mode === "voice") {
      // Se temos um nó ativo, verificar se o usuário perguntou sobre sub-tópico (músculos, ligamentos, vasos):
      if (activeNode && Array.isArray(activeNode.subTopics)) {
        for (const sub of activeNode.subTopics) {
          if (this.containsAny(q, sub.synonyms)) {
            const subResp = sub.responses?.[lang] || sub.responses?.pt;
            if (subResp) return subResp;
          }
        }
      }

      if (activeNode) {
        return this.gerarRespostaVocalHumanizada(activeNode, null, q, lang);
      }

      if (directNode) {
        return this.gerarRespostaVocalHumanizada(directNode, null, q, lang);
      }

      return this.generateHumanConversationResponse(q, lang);
    }

    // =========================================================================
    // MODO 1: PESQUISA TEXTUAL ACADÊMICA (Atlas AI)
    // =========================================================================
    if (activeNode) {
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

    return this.generateHumanConversationResponse(q, lang);
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

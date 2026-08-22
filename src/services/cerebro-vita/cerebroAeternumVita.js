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

import { VITA_KNOWLEDGE_NODES, VITA_MENTORSHIP_MODULES, VITA_ORAL_QUIZZES } from "./cerebroVitaKnowledgeVault.js";

class CerebroAeternumVitaEngine {
  constructor() {
    this.lastActiveTopic = null;
    this.tutorMemories = {
      eduardo: { activeTopic: null, turnsCount: 0 },
      antonia: { activeTopic: null, turnsCount: 0 },
      ariana: { activeTopic: null, turnsCount: 0 },
      fabian: { activeTopic: null, turnsCount: 0 }
    };
    this.activeQuizSessions = {
      eduardo: null,
      antonia: null,
      ariana: null,
      fabian: null
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

  getStudentMemory(userId = "default") {
    if (typeof window === "undefined" || !window.localStorage) {
      return { recentTopics: [], mastered: [], reinforcement: [], lastSeen: Date.now() };
    }
    try {
      const raw = window.localStorage.getItem(`aeternum_voice_mem:${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { recentTopics: [], mastered: [], reinforcement: [], lastSeen: Date.now() };
  }

  saveStudentMemory(userId = "default", patch = {}) {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const current = this.getStudentMemory(userId);
      const updated = {
        ...current,
        ...patch,
        recentTopics: Array.from(new Set([...(patch.recentTopics || []), ...(current.recentTopics || [])])).slice(0, 5),
        mastered: Array.from(new Set([...(patch.mastered || []), ...(current.mastered || [])])).slice(0, 10),
        reinforcement: Array.from(new Set([...(patch.reinforcement || []), ...(current.reinforcement || [])])).slice(0, 10),
        lastSeen: Date.now()
      };
      window.localStorage.setItem(`aeternum_voice_mem:${userId}`, JSON.stringify(updated));
    } catch {}
  }

  generatePersonalizedGreeting({ userId = "default", language = "pt", persona = "eduardo", userName = "" }) {
    const mem = this.getStudentMemory(userId);
    const lang = String(language || "pt").slice(0, 2).toLowerCase();
    const tutorKey = String(persona || "eduardo").toLowerCase();
    const nameStr = userName ? `${userName}, ` : "";
    const lastTopic = mem.recentTopics?.[0];

    // Se o aluno estudou nos últimos 7 dias e tem um tópico recente registrado
    if (lastTopic && mem.lastSeen && Date.now() - mem.lastSeen < 7 * 24 * 60 * 60 * 1000) {
      const topicCap = lastTopic.charAt(0).toUpperCase() + lastTopic.slice(1);
      if (lang === "es") {
        return `¡Hola ${nameStr}qué alegría tenerte de vuelta! La última vez estuvimos explorando ${topicCap}. ¿Quieres que continuemos desde ahí o prefieres hacer una sabatina oral de repaso?`;
      }
      if (lang === "en") {
        return `Hello ${nameStr}it is wonderful to have you back! Last time we tackled ${topicCap}. Would you like to build on that or shall we run a quick oral quiz today?`;
      }
      if (lang === "de") {
        return `Hallo ${nameStr}schön, dich wiederzusehen! Zuletzt haben wir uns mit ${topicCap} beschäftigt. Wollen wir daran anknüpfen oder eine kurze mündliche Prüfung machen?`;
      }
      return `Olá ${nameStr}que bom te ver de novo! Na nossa última conversa estávamos estudando ${topicCap}. Deseja continuar de onde paramos ou quer fazer uma sabatina oral de três perguntas?`;
    }

    // Saudação calorosa padrão
    if (lang === "es") {
      return `¡Hola ${nameStr}te doy una cálida bienvenida a Aeternum Vita! Soy Antonia, tu mentora en español. ¿Qué estructura anatómica deseas explorar o repasar hoy?`;
    }
    if (lang === "en") {
      return `Hello ${nameStr}welcome to Aeternum Vita! I am Ariana, your dynamic anatomy mentor. How can I guide your journey today?`;
    }
    if (lang === "de") {
      return `Hallo ${nameStr}herzlich willkommen bei Aeternum Vita! Ich bin Fabian, dein Anatomie-Mentor. Womit starten wir heute?`;
    }
    return `Olá ${nameStr}seja muito bem-vindo ao Aeternum Atlas! Eu sou o Eduardo, seu mentor de anatomia. Como posso guiar seus estudos hoje?`;
  }

  findOralQuizTopic(query) {
    const q = this.normalize(query);
    for (const key of Object.keys(VITA_ORAL_QUIZZES)) {
      const quiz = VITA_ORAL_QUIZZES[key];
      if (this.containsAny(q, quiz.synonyms)) {
        return quiz;
      }
    }
    return VITA_ORAL_QUIZZES.clavicula; // padrão
  }

  isQuizActivationTrigger(query) {
    const q = this.normalize(query);
    const triggers = [
      "sabatina", "simulado oral", "fazer simulado", "faca uma sabatina", "faça uma sabatina",
      "sabatina oral", "teste meu conhecimento", "me teste", "me faca perguntas", "me faça perguntas",
      "examen oral", "hazme un examen", "preguntame", "evaluame", "evalúame",
      "oral exam", "quiz me", "test me", "oral quiz", "ask me questions",
      "abfragen", "pruefe mich", "muendliche pruefung", "mündliche prüfung"
    ];
    return triggers.some((t) => q.includes(this.normalize(t)));
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
        return ["¡Por supuesto!", "Mira,", "Te entiendo perfectamente,", "¡Qué interesante!", "¡Totalmente!"];
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

  getTimeGreeting(lang = "pt") {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      if (lang === "es") return "¡Que tengas un excelente día de estudio!";
      if (lang === "en") return "Have a wonderful day of studying!";
      if (lang === "de") return "Hab einen erfolgreichen Lerntag!";
      return "Tenha um excelente dia de estudos!";
    }
    if (hour >= 12 && hour < 18) {
      if (lang === "es") return "¡Que tengas una linda tarde y buen descanso!";
      if (lang === "en") return "Have a great afternoon and enjoy your rest!";
      if (lang === "de") return "Hab einen schönen Nachmittag und erhol dich gut!";
      return "Tenha uma ótima tarde e bom descanso!";
    }
    if (lang === "es") return "¡Descansa mucho y que tengas muy buenas noches!";
    if (lang === "en") return "Get plenty of rest and have a wonderful night!";
    if (lang === "de") return "Ruh dich gut aus und hab eine gute Nacht!";
    return "Descanse bastante e tenha uma excelente noite de sono!";
  }

  isFarewell(q) {
    const farewellWords = [
      "vamos parar", "parar por aqui", "por hoje", "tchau", "ate mais", "até mais",
      "boa noite", "bom descanso", "vou descansar", "vou dormir", "encerrar",
      "obrigado pelo dialogo", "obrigado pela conversa", "obrigado pelo tempo",
      "adios", "hasta luego", "hasta pronto", "buenas noches", "descansar", "terminar",
      "bye", "goodbye", "good night", "stop here", "see you", "tschüss", "gute nacht", "bis bald"
    ];
    return farewellWords.some((w) => q.includes(w));
  }

  generateHumanConversationResponse(query, lang = "pt", persona = "eduardo") {
    const q = this.normalize(query);
    const hook = this.getRandomHook(persona);
    const timeGreeting = this.getTimeGreeting(lang);

    // 1. Encerramento / Despedida com inteligência temporal e humana
    if (this.isFarewell(q)) {
      if (lang === "es") {
        return `¡Entendido! Fue un verdadero placer acompañarte en tu estudio hoy. ${timeGreeting} ¡Hasta la próxima, aquí estaré para ti!`;
      }
      if (lang === "en") {
        return `Sounds great! You did a fantastic job today. ${timeGreeting} Whenever you are ready to resume, I will be right here!`;
      }
      if (lang === "de") {
        return `Alles klar! Es war mir eine Freude, dich heute zu begleiten. ${timeGreeting} Bis zum nächsten Mal!`;
      }
      return `Combinado! Foi um prazer imenso estudar com você hoje. ${timeGreeting} Sempre que quiser retomar, estarei aqui por você!`;
    }

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
   * Orquestra:
   * 1. Sabatina Médica Oral Interativa (OSCE / VIVA Voce)
   * 2. Reconhecimento Afetivo & Apoio Emocional
   * 3. Diálogos Anatômicos Especializados com Memória de Longo Prazo
   */
  consultar({ query, language = "pt", persona = null, context = {} }) {
    const rawQ = String(query || "").trim();
    const lang = String(language || "pt").slice(0, 2).toLowerCase();
    const tutorKey = String(persona || (lang === "es" ? "antonia" : lang === "en" ? "ariana" : lang === "de" ? "fabian" : "eduardo")).toLowerCase();
    const userId = context.userId || "default";

    if (!rawQ) {
      return this.generateHumanConversationResponse("", lang, tutorKey);
    }

    const q = this.normalize(rawQ);

    // ========================================================================
    // A. FLUXO DE SABATINA ORAL INTERATIVA (OSCE / VIVA VOCE)
    // ========================================================================
    const currentQuiz = this.activeQuizSessions[tutorKey];

    // 1. Se o aluno já está em uma sessão de sabatina oral ativa
    if (currentQuiz && currentQuiz.active) {
      const qObj = currentQuiz.quiz.questions[currentQuiz.questionIndex];
      const isCorrect = qObj.expectedKeywords.some((kw) => q.includes(this.normalize(kw)));

      let feedbackText = "";
      if (isCorrect) {
        currentQuiz.score += 1;
        feedbackText = qObj.correctFeedback[lang] || qObj.correctFeedback.pt;
        this.saveStudentMemory(userId, { mastered: [currentQuiz.quiz.id] });
      } else {
        feedbackText = qObj.constructiveHint[lang] || qObj.constructiveHint.pt;
        this.saveStudentMemory(userId, { reinforcement: [currentQuiz.quiz.id] });
      }

      currentQuiz.questionIndex += 1;

      // Se ainda há perguntas na rodada de sabatina
      if (currentQuiz.questionIndex < currentQuiz.quiz.questions.length) {
        const nextQ = currentQuiz.quiz.questions[currentQuiz.questionIndex];
        const nextQText = nextQ.question[lang] || nextQ.question.pt;
        return this.cleanSpokenCadence(`${feedbackText} ${nextQText}`);
      }

      // Conclusão da Sabatina Oral
      const finalScore = currentQuiz.score;
      const total = currentQuiz.quiz.questions.length;
      this.activeQuizSessions[tutorKey] = null; // encerra sessão

      if (lang === "es") {
        return this.cleanSpokenCadence(
          `${feedbackText} ¡Completamos la sabatina oral con éxito! Obtuviste ${finalScore} de ${total} aciertos. ¡Gran trabajo! ¿Deseas hacer otra sabatina o explorar otro tema?`
        );
      }
      if (lang === "en") {
        return this.cleanSpokenCadence(
          `${feedbackText} That concludes our oral examination! You scored ${finalScore} out of ${total}. Brilliant effort! Would you like to tackle another quiz or review something else?`
        );
      }
      if (lang === "de") {
        return this.cleanSpokenCadence(
          `${feedbackText} Damit haben wir die mündliche Prüfung abgeschlossen! Du hast ${finalScore} von ${total} Punkten erreicht. Großartige Leistung! Möchtest du weitermachen?`
        );
      }
      return this.cleanSpokenCadence(
        `${feedbackText} Concluímos a nossa sabatina oral com sucesso! Você obteve ${finalScore} de ${total} acertos. Excelente dedicação! Gostaria de fazer outra sabatina ou prefere explorar outro tema agora?`
      );
    }

    // 2. Se o aluno está solicitando o início de uma nova sabatina oral
    if (this.isQuizActivationTrigger(q)) {
      const quiz = this.findOralQuizTopic(q);
      this.activeQuizSessions[tutorKey] = {
        active: true,
        quiz,
        questionIndex: 0,
        score: 0
      };
      this.saveStudentMemory(userId, { recentTopics: [quiz.id] });

      const firstQ = quiz.questions[0].question[lang] || quiz.questions[0].question.pt;
      const hook = this.getRandomHook(tutorKey);

      if (lang === "es") {
        return this.cleanSpokenCadence(`${hook} Vamos a realizar una sabatina oral de tres preguntas sobre ${quiz.topicName}. ${firstQ}`);
      }
      if (lang === "en") {
        return this.cleanSpokenCadence(`${hook} Let's conduct a three-question oral quiz on ${quiz.topicName}. ${firstQ}`);
      }
      if (lang === "de") {
        return this.cleanSpokenCadence(`${hook} Lass uns eine dreiteilige mündliche Prüfung zu ${quiz.topicName} machen. ${firstQ}`);
      }
      return this.cleanSpokenCadence(`${hook} vamos fazer uma sabatina oral de três perguntas práticas sobre ${quiz.topicName}. ${firstQ}`);
    }

    // ========================================================================
    // B. DIÁLOGOS DE MENTORIA, DESPEDIDAS, AFETO E APOIO EMOCIONAL
    // ========================================================================
    const mentorship = this.findMentorshipNode(q);
    if (mentorship) {
      if (this.tutorMemories[tutorKey]) {
        this.tutorMemories[tutorKey].activeTopic = null;
        this.tutorMemories[tutorKey].turnsCount += 1;
      }
      // Se for módulo de despedida, adiciona o cumprimento de horário
      if (mentorship.id === "despedida_encerramento") {
        return this.cleanSpokenCadence(this.generateHumanConversationResponse(q, lang, tutorKey));
      }
      const resp = mentorship.responses?.[lang] || mentorship.responses?.pt;
      if (resp) return this.cleanSpokenCadence(resp);
    }

    // Se o usuário está se despedindo ou encerrando o diálogo
    if (this.isFarewell(q)) {
      if (this.tutorMemories[tutorKey]) {
        this.tutorMemories[tutorKey].activeTopic = null;
      }
      return this.cleanSpokenCadence(this.generateHumanConversationResponse(q, lang, tutorKey));
    }

    // ========================================================================
    // C. CONSULTAS ANATÔMICAS ESPECIALIZADAS COM MEMÓRIA
    // ========================================================================
    let activeTopic = this.tutorMemories[tutorKey]?.activeTopic;
    let activeNode = activeTopic ? this.findKnowledgeNode(activeTopic) : null;
    const directNode = this.findKnowledgeNode(q);

    if (directNode) {
      activeNode = directNode;
      if (this.tutorMemories[tutorKey]) {
        this.tutorMemories[tutorKey].activeTopic = directNode.id;
        this.tutorMemories[tutorKey].turnsCount += 1;
      }
      this.saveStudentMemory(userId, { recentTopics: [directNode.id] });

      const resp = directNode.spokenAnswers?.[lang] || directNode.spokenAnswers?.pt;
      if (resp) return this.cleanSpokenCadence(resp);
    }

    // Subtópicos no Nó Ativo (Músculos, Ligamentos, Vasos)
    if (activeNode && Array.isArray(activeNode.subTopics)) {
      for (const sub of activeNode.subTopics) {
        if (this.containsAny(q, sub.synonyms)) {
          const subResp = sub.spokenAnswers?.[lang] || sub.spokenAnswers?.pt;
          if (subResp) return this.cleanSpokenCadence(subResp);
        }
      }
    }

    // Se a consulta não menciona diretamente nem o nó nem um subtópico, limpa o nó ativo
    if (this.tutorMemories[tutorKey]) {
      this.tutorMemories[tutorKey].activeTopic = null;
    }

    // 4. Resposta Conversacional Padrão Acolhedora e Humanizada
    return this.cleanSpokenCadence(this.generateHumanConversationResponse(q, lang, tutorKey));
  }

  obterEstatisticas() {
    return {
      tutor: "Aeternum Vita Voice Multi-Tutor Engine",
      nodes: Object.keys(VITA_KNOWLEDGE_NODES).length,
      mentorshipModules: Object.keys(VITA_MENTORSHIP_MODULES).length,
      oralQuizzes: Object.keys(VITA_ORAL_QUIZZES).length,
      status: "operacional_isolado"
    };
  }
}

export const cerebroAeternumVita = new CerebroAeternumVitaEngine();

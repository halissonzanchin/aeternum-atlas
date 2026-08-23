export const SOCRATIC_LEVELS = Object.freeze({
  S0_DIRECT: 'S0_DIRECT',
  S1_HOOK: 'S1_HOOK',
  S2_GUIDED: 'S2_GUIDED',
  S3_DEEP_SOCRATIC: 'S3_DEEP',
  S4_EXAMINER: 'S4_EXAMINER'
});

export const CONVERSATIONAL_INTENTS = Object.freeze({
  EXPLANATION: 'EXPLANATION',
  REVIEW: 'REVIEW',
  SOCRATIC_QUERY: 'SOCRATIC_QUERY',
  ORAL_QUIZ: 'ORAL_QUIZ',
  VENT_EMOTIONAL: 'VENT_EMOTIONAL',
  FAREWELL: 'FAREWELL',
  CASUAL_CHAT: 'CASUAL_CHAT',
  STUDY_ROUTINE: 'STUDY_ROUTINE',
  PRACTICE_3D: 'PRACTICE_3D'
});

export class AeternumBehaviorOrchestrator {
  constructor() {
    this.sessionStates = new Map();
  }

  normalize(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getTimeContext() {
    const hour = new Date().getHours();
    let period = 'noite';
    let greetingPhrase = 'Descanse bastante e tenha uma excelente noite de sono!';

    if (hour >= 5 && hour < 12) {
      period = 'manha';
      greetingPhrase = 'Tenha um excelente dia de estudos!';
    } else if (hour >= 12 && hour < 18) {
      period = 'tarde';
      greetingPhrase = 'Tenha uma ótima tarde e bom descanso!';
    }

    return { hour, period, greetingPhrase };
  }

  detectIntent(normalizedQuery) {
    const q = normalizedQuery;

    if (/vamos parar|parar por aqui|por hoje e so|tchau|ate mais|boa noite|bom descanso|vou descansar|vou dormir|encerrar|obrigado pelo dialogo|adios|hasta luego|bye|goodbye|good night/i.test(q)) {
      return CONVERSATIONAL_INTENTS.FAREWELL;
    }

    if (/sabatina|simulado oral|fazer simulado|faca uma sabatina|teste meu conhecimento|me teste|examen oral|hazme un examen|oral quiz|quiz me|test me/i.test(q)) {
      return CONVERSATIONAL_INTENTS.ORAL_QUIZ;
    }

    if (/estou cansado|estou cansada|nao aguento|muita materia|nervoso|medo da prova|vou reprovar|desesperado|agobiado|exhausted|overwhelmed/i.test(q)) {
      return CONVERSATIONAL_INTENTS.VENT_EMOTIONAL;
    }

    if (/organizar rotina|como estudar|cronograma|planejamento|plan de estudio|study routine/i.test(q)) {
      return CONVERSATIONAL_INTENTS.STUDY_ROUTINE;
    }

    if (/\b(fala comigo|fala eduardo|fala antonia|oi|ola|tudo bem|como vai|quem e voce|hola|buen dia|hello|hi)\b/i.test(q)) {
      return CONVERSATIONAL_INTENTS.CASUAL_CHAT;
    }

    if (/mostrar no 3d|onde fica|gira o modelo|rotaciona|zoom|mostrame|show me 3d/i.test(q)) {
      return CONVERSATIONAL_INTENTS.PRACTICE_3D;
    }

    if (/explica|o que e|qual e|como funciona|anatomia de|que es/i.test(q)) {
      return CONVERSATIONAL_INTENTS.EXPLANATION;
    }

    return CONVERSATIONAL_INTENTS.SOCRATIC_QUERY;
  }

  detectSocraticIntensity(normalizedQuery, intent, urgency = false) {
    const q = normalizedQuery;

    if (urgency || /so me diz a resposta|sem enrolacao|direto ao ponto|estou com pressa|solo dime la respuesta|just tell me/i.test(q)) {
      return SOCRATIC_LEVELS.S0_DIRECT;
    }

    if (/nao me de a resposta|quero tentar descobrir|me ajuda a pensar|no me des la respuesta|let me guess/i.test(q)) {
      return SOCRATIC_LEVELS.S3_DEEP_SOCRATIC;
    }

    if (intent === CONVERSATIONAL_INTENTS.ORAL_QUIZ) {
      return SOCRATIC_LEVELS.S4_EXAMINER;
    }

    if (intent === CONVERSATIONAL_INTENTS.EXPLANATION) {
      return SOCRATIC_LEVELS.S1_HOOK;
    }

    return SOCRATIC_LEVELS.S2_GUIDED;
  }

  evaluateState({ userId = 'default', query = '', context = {}, brainType = 'vita' }) {
    const normQ = this.normalize(query);
    const timeCtx = this.getTimeContext();
    const intent = this.detectIntent(normQ);
    const socraticLevel = this.detectSocraticIntensity(normQ, intent, Boolean(context.urgency));

    const currentState = this.sessionStates.get(userId) || {
      studentId: userId,
      brainType,
      intent: CONVERSATIONAL_INTENTS.CASUAL_CHAT,
      socraticLevel: SOCRATIC_LEVELS.S2_GUIDED,
      currentTopic: null,
      turnsCount: 0,
      fatigueScore: 0.1,
      frustrationScore: 0.0,
      confidenceLevel: 0.7,
      historyTopics: [],
      lastInteractionTime: Date.now()
    };

    let fatigueScore = currentState.fatigueScore;
    if (timeCtx.period === 'noite' && timeCtx.hour >= 23) {
      fatigueScore = Math.min(1.0, fatigueScore + 0.3);
    }
    if (intent === CONVERSATIONAL_INTENTS.VENT_EMOTIONAL) {
      fatigueScore = Math.min(1.0, fatigueScore + 0.25);
    }

    const updatedState = {
      ...currentState,
      brainType,
      intent,
      socraticLevel,
      fatigueScore,
      timeContext: timeCtx,
      turnsCount: currentState.turnsCount + 1,
      lastInteractionTime: Date.now()
    };

    this.sessionStates.set(userId, updatedState);
    return updatedState;
  }

  buildBehaviorDirective(state, persona = 'eduardo') {
    const isVitaVoice = state.brainType === 'vita';
    let directive = '[ESTADO COMPORTAMENTAL: Intencao=' + state.intent + ', NivelSocratico=' + state.socraticLevel + ', Periodo=' + (state.timeContext?.period || 'dia') + ']\n';

    if (isVitaVoice) {
      directive += 'DIRETRIZES DE VOZ VITA:\n';
      directive += '- Fale em 1 a 2 frases concisas faladas (maximo 140 caracteres).\n';
      directive += '- NUNCA use Markdown (*, #, ), listas ou emojis.\n';
      directive += '- Use numeros por extenso e virgulas para pausas respiratorias.\n';

      if (state.intent === CONVERSATIONAL_INTENTS.FAREWELL) {
        directive += '- O aluno esta se despedindo. Agradeca calorosamente, deseje \"' + (state.timeContext?.greetingPhrase || 'bom descanso') + '\" e finalize o dialogo com carinho.\n';
      } else if (state.socraticLevel === SOCRATIC_LEVELS.S0_DIRECT) {
        directive += '- Entregue a resposta direta e precisa sem rodeios.\n';
      } else if (state.socraticLevel === SOCRATIC_LEVELS.S2_GUIDED) {
        directive += '- Apresente o conceito central e termine com exatamente UMA pergunta reflexiva aberta para guiar o raciocinio.\n';
      }
    } else {
      directive += 'DIRETRIZES DO TUTOR ATLAS IA (PLATAFORMA):\n';
      directive += '- Estruture em Markdown rico com titulos claros, citacoes anatomicas Latarjet e correlacoes clinicas.\n';
      directive += '- Inclua tabelas ou esquemas hierarquicos quando util para o estudo.\n';
    }

    return directive;
  }
}

export const aeternumBehaviorOrchestrator = new AeternumBehaviorOrchestrator();

export type VitaIntent =
  | "greeting"
  | "farewell"
  | "confusion"
  | "review"
  | "application"
  | "mastery_signal"
  | "self_correction"
  | "socratic_request"
  | "direct_mode"
  | "topic_return"
  | "direct_question"
  | "continuation";

export type VitaStrategy =
  | "diagnostic"
  | "direct"
  | "reframe"
  | "scaffold"
  | "retrieval"
  | "transfer"
  | "practice"
  | "socratic"
  | "recall"
  | "continue";

export type VitaTimeBand = "morning" | "afternoon" | "night" | "late_night";

export interface VitaPersistedState {
  currentTopic: string | null;
  previousTopics: string[];
  masteryEvidence: number;
}

export interface VitaSessionSnapshot extends VitaPersistedState {
  turnCount: number;
  intent: VitaIntent;
  strategy: VitaStrategy;
  confusionStreak: number;
  socraticLevel: 0 | 2 | 3;
  timeBand: VitaTimeBand;
  shouldAskQuestion: boolean;
  praiseAllowed: boolean;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9?\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectIntent(text: string): VitaIntent {
  const normalized = normalize(text);
  if (/\b(tchau|ate logo|encerrar|adeus|goodbye|bye|adios|tschuss)\b/.test(normalized)) return "farewell";
  if (/\b(onde (a gente|nos) parou|volta(r)? (para|ao)|retomar o anterior|where did we stop|donde nos quedamos|wo waren wir)\b/.test(normalized)) return "topic_return";
  if (/\b(nao me de a resposta|me faca pensar|modo socratico|don t give me the answer|hazme pensar|lass mich nachdenken)\b/.test(normalized)) return "socratic_request";
  if (/\b(so responda|responde so|estou com pressa|just answer|solo responde|nur antworten)\b/.test(normalized)) return "direct_mode";
  if (/\b(quis dizer|me corrigi|corrigindo|i meant|quise decir|ich meinte)\b/.test(normalized)) return "self_correction";
  if (/\b(nao entendi|nao ficou claro|estou confus|me perdi|no entiendo|i don t understand|ich verstehe nicht)\b/.test(normalized)) return "confusion";
  if (/\b(revisar|revisao|recapitular|relembrar|review|repasar|wiederholen)\b/.test(normalized)) return "review";
  if (/\b(clinico|clinica|caso|paciente|lesao|aplicacao|clinical|patient|injury|aplicacion|verletzung)\b/.test(normalized)) return "application";
  if (/\b(agora entendi|ficou claro|consegui entender|i understand now|ahora entiendo|jetzt verstehe ich)\b/.test(normalized)) return "mastery_signal";
  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hola|buenos dias|hallo|guten tag)\b/.test(normalized)) return "greeting";
  if (text.includes("?") || /^(o que|qual|como|por que|onde|what|which|how|why|que|como|donde|was|wie|warum|wo)\b/.test(normalized)) return "direct_question";
  return "continuation";
}

function cleanTopicCandidate(value: string) {
  const candidate = normalize(value)
    .replace(/\b(por favor|para mim|please|por favor|bitte)\b.*$/, "")
    .replace(/\?+$/, "")
    .trim();
  const words = candidate.split(" ").filter(Boolean).slice(0, 8);
  const topic = words.join(" ");
  if (!topic || /^(ele|ela|isso|isto|aquilo|dele|dela|it|this|that|eso|esto|das|der|die)$/.test(topic)) return null;
  return topic;
}

function detectTopic(text: string) {
  const normalized = normalize(text);
  const patterns = [
    /(?:quero|vamos)\s+(?:estudar|revisar|ver|para)\s+(?:o|a|os|as)?\s*(.+)$/,
    /(?:explique|explica|fale|explain|tell me about|explica|habla de|erklare)\s+(?:o|a|os|as)?\s*(.+)$/,
    /(?:sobre|about|uber)\s+(?:o|a|os|as)?\s*(.+)$/,
    /(?:funcao|partes|relacoes|irrigacao|inervacao)\s+(?:do|da|de|dos|das)\s+(.+)$/,
    /(?:o que e|what is|que es|was ist)\s+(?:o|a|um|uma)?\s*(.+)$/,
    /(?:entendi|understand|entiendo|verstehe)\s+(?:o|a|os|as)?\s*(.+)$/,
    /(?:clinica|clinical|caso).*(?:no|na|do|da|of)\s+(.+)$/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const candidate = match?.[1] ? cleanTopicCandidate(match[1]) : null;
    if (candidate) return candidate;
  }
  return null;
}

function timeBand(now: Date): VitaTimeBand {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "night";
  return "late_night";
}

function chooseStrategy(intent: VitaIntent, confusionStreak: number): VitaStrategy {
  if (intent === "farewell") return "continue";
  if (intent === "topic_return") return "recall";
  if (intent === "direct_mode" || intent === "direct_question") return "direct";
  if (intent === "socratic_request") return "socratic";
  if (confusionStreak >= 2) return "scaffold";
  if (intent === "confusion") return "reframe";
  if (intent === "review") return "retrieval";
  if (intent === "application") return "transfer";
  if (intent === "mastery_signal" || intent === "self_correction") return "practice";
  if (intent === "greeting") return "diagnostic";
  return "continue";
}

function shouldAsk(intent: VitaIntent, strategy: VitaStrategy, turnCount: number) {
  if (intent === "farewell" || strategy === "direct") return false;
  if (["diagnostic", "reframe", "scaffold", "retrieval", "practice", "socratic", "recall"].includes(strategy)) return true;
  return turnCount % 3 === 0;
}

export class VitaSessionStateMachine {
  #turnCount = 0;
  #currentTopic: string | null = null;
  #previousTopics: string[] = [];
  #confusionStreak = 0;
  #masteryEvidence = 0;

  constructor(initial?: Partial<VitaPersistedState> | null) {
    if (initial) this.restore(initial);
  }

  restore(initial: Partial<VitaPersistedState>) {
    this.#currentTopic = typeof initial.currentTopic === "string" ? initial.currentTopic.slice(0, 160) : null;
    this.#previousTopics = Array.isArray(initial.previousTopics)
      ? initial.previousTopics.filter((topic): topic is string => typeof topic === "string").slice(0, 5)
      : [];
    this.#masteryEvidence = Math.max(0, Math.min(100, Number(initial.masteryEvidence) || 0));
  }

  serialize(): VitaPersistedState {
    return {
      currentTopic: this.#currentTopic,
      previousTopics: [...this.#previousTopics],
      masteryEvidence: this.#masteryEvidence
    };
  }

  observe(userText: string, now = new Date()): VitaSessionSnapshot {
    this.#turnCount += 1;
    const intent = detectIntent(userText);
    let detectedTopic = detectTopic(userText);

    if (intent === "topic_return" && this.#previousTopics.length) {
      detectedTopic = this.#previousTopics[0] || null;
    }

    if (detectedTopic && detectedTopic !== this.#currentTopic) {
      if (this.#currentTopic) {
        this.#previousTopics = [this.#currentTopic, ...this.#previousTopics.filter((topic) => topic !== this.#currentTopic)].slice(0, 5);
      }
      this.#currentTopic = detectedTopic;
      this.#confusionStreak = 0;
    }

    if (intent === "confusion") {
      this.#confusionStreak += 1;
    } else if (intent === "mastery_signal" || intent === "self_correction") {
      this.#confusionStreak = 0;
      this.#masteryEvidence += 1;
    } else if (intent !== "continuation") {
      this.#confusionStreak = Math.max(0, this.#confusionStreak - 1);
    }

    const strategy = chooseStrategy(intent, this.#confusionStreak);
    return {
      turnCount: this.#turnCount,
      intent,
      strategy,
      currentTopic: this.#currentTopic,
      previousTopics: [...this.#previousTopics],
      confusionStreak: this.#confusionStreak,
      masteryEvidence: this.#masteryEvidence,
      socraticLevel: strategy === "direct" ? 0 : strategy === "socratic" ? 3 : 2,
      timeBand: timeBand(now),
      shouldAskQuestion: shouldAsk(intent, strategy, this.#turnCount),
      praiseAllowed: intent === "mastery_signal" || intent === "self_correction"
    };
  }
}

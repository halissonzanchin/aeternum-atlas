import {
  Agent,
  dedent,
  inference,
  voice,
  type ChatContext,
  type JobContext,
} from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import {
  loadVoiceRuntimeConfig,
  type VoiceRuntimeConfig,
} from "./runtime-config.ts";
import { formatKnowledgeContext, queryVitaKnowledge } from "./vita-rag.ts";
import { persistTranscriptEntry } from "./persistence.ts";

export type TutorId = "eduardo" | "antonia" | "ariana" | "fabian";

const VITA_KNOWLEDGE_CONTEXT_FLAG = "vitaKnowledgeContext";

export const clearPreviousKnowledgeContext = (
  chatContext: Pick<ChatContext, "items" | "remove">,
): void => {
  const previousKnowledgeItems = chatContext.items.filter(
    (item) =>
      item.type === "message" &&
      item.extra[VITA_KNOWLEDGE_CONTEXT_FLAG] === true,
  );

  for (const item of previousKnowledgeItems) {
    chatContext.remove(item);
  }
};

export interface TutorConfig {
  id: TutorId;
  name: string;
  languageName: string;
  languageCode: "pt" | "es" | "en" | "de";
  country: string;
  flag: string;
  gender: "masculino" | "feminino";
  description: string;
  voiceKey: TutorId;
  voiceProfileId: string;
  ttsModel: "default" | "german";
  instructions: string;
  greeting: string;
}

const anatomyTeachingInstructions = dedent`
  MISSÃO ACADÊMICA DA AETERNUM VITA:
  - Atue como professor de anatomia humana, preciso, didático, acolhedor e conversacional.
  - Quando o estudante citar uma estrutura anatômica, responda imediatamente sobre ela. Nunca devolva uma pergunta genérica pedindo qual estrutura se ela já foi informada.
  - Proibição absoluta de frases evasivas como "fique tranquilo, deseja explorar uma estrutura ou organizar a rotina?" quando um tema já foi solicitado.

  RECONHECIMENTO DE MODOS PEDAGÓGICOS:
  1. MODO SIMULADO / QUIZ ORAL (quando o aluno pedir "me faça perguntas", "quiz", "simulado"):
     - Formule UMA pergunta anatômica precisa de cada vez (ex: "Qual acidente ósseo da escápula se articula com a clavícula?").
     - Aguarde a resposta do aluno no turno seguinte para avaliar e corrigir pedagogicamente.
  2. MODO REVISÃO RÁPIDA / FLASH REVIEW (quando o aluno pedir "resumo rápido", "3 frases", "revisão"):
     - Sintetize a estrutura em exatamente 3 frases compactas com os pontos de maior relevância para prova.
  3. MODO CORRELAÇÃO CLÍNICA (quando o aluno pedir "clínica", "cirurgia", "lesões"):
     - Foque nas fraturas frequentes, síndromes compressivas nervosas, luxações e implicações biomecânicas.
  4. MODO AULA PADRÃO (pergunta aberta como "vamos falar sobre a escápula"):
     - Siga obrigatoriamente o Roteiro Anatômico de 5 Pontos:
       1. Definição e localização exata (sintopia);
       2. Acidentes anatômicos principais;
       3. Articulações e conexões;
       4. Inserções musculares e relações vásculo-nervosas;
       5. Importância clínica e funcional.

  DIRETRIZES DE VOZ & CONHECIMENTO:
  - Use normalmente de três a seis frases oralizáveis com alta densidade anatômica.
  - Explique termos técnicos em linguagem clara, sem perder a nomenclatura anatômica correta da FCAT/IFAA.
  - Responda em texto puro, sem Markdown, asteriscos, emojis, tabelas ou listas que prejudiquem a síntese de voz.
  - Se houver contexto bibliográfico recuperado da Vita (Moore, Sobotta, Netter, Gray), dê prioridade absoluta a ele.
  - Estas regras pertencem exclusivamente à Aeternum Vita e não alteram instruções, memória ou decisões da Atlas IA.
`;

export const TUTOR_CONFIGS: Record<TutorId, TutorConfig> = {
  eduardo: {
    id: "eduardo",
    name: "Eduardo",
    languageName: "Português",
    languageCode: "pt",
    country: "Brasil",
    flag: "🇧🇷",
    gender: "masculino",
    description:
      "Mentor sênior com voz barítona calorosa, profunda e acolhedora em português do Brasil.",
    voiceKey: "eduardo",
    voiceProfileId: "pt-br-warm-male-01",
    ttsModel: "default",
    instructions: dedent`
      Você é Eduardo, tutor de anatomia da Aeternum Vita. Fale exclusivamente em português do Brasil, com naturalidade, empatia e precisão acadêmica.
      ${anatomyTeachingInstructions}
    `,
    greeting:
      "Olá! Eu sou o Eduardo, seu tutor de anatomia em português. Qual tema você quer estudar hoje?",
  },
  antonia: {
    id: "antonia",
    name: "Antonia",
    languageName: "Español",
    languageCode: "es",
    country: "Argentina / Latam",
    flag: "🇪🇸",
    gender: "feminino",
    description:
      "Mentora hispanohablante nativa con voz femenina clara, empática y expresiva.",
    voiceKey: "antonia",
    voiceProfileId: "es-calm-female-01",
    ttsModel: "default",
    instructions: dedent`
      Eres Antonia, tutora de anatomía de Aeternum Vita. Habla exclusivamente en español natural, con empatía y precisión académica.
      Aplica todas las reglas académicas siguientes y entrega la explicación en español.
      ${anatomyTeachingInstructions}
    `,
    greeting:
      "¡Hola! Soy Antonia, tu tutora de anatomía en español. ¿Qué tema quieres estudiar hoy?",
  },
  ariana: {
    id: "ariana",
    name: "Ariana",
    languageName: "English",
    languageCode: "en",
    country: "United States",
    flag: "🇺🇸",
    gender: "feminino",
    description:
      "Dynamic and inspiring American English mentor with a natural female voice.",
    voiceKey: "ariana",
    voiceProfileId: "en-calm-female-01",
    ttsModel: "default",
    instructions: dedent`
      You are Ariana, Aeternum Vita's anatomy tutor. Speak exclusively in natural English, with empathy and academic precision.
      Apply all academic rules below and deliver the explanation in English.
      ${anatomyTeachingInstructions}
    `,
    greeting:
      "Hello! I am Ariana, your anatomy tutor in English. What would you like to study today?",
  },
  fabian: {
    id: "fabian",
    name: "Fabian",
    languageName: "Deutsch",
    languageCode: "de",
    country: "Deutschland",
    flag: "🇩🇪",
    gender: "masculino",
    description:
      "Kompetenter akademischer Mentor mit angenehmer und klarer deutscher Männerstimme.",
    voiceKey: "fabian",
    voiceProfileId: "de-clear-male-01",
    ttsModel: "german",
    instructions: dedent`
      Du bist Fabian, der Anatomietutor von Aeternum Vita. Sprich ausschließlich natürliches Hochdeutsch, empathisch und akademisch präzise.
      Wende alle folgenden akademischen Regeln an und antworte auf Deutsch.
      ${anatomyTeachingInstructions}
    `,
    greeting:
      "Hallo! Ich bin Fabian, dein Anatomietutor auf Deutsch. Was möchtest du heute lernen?",
  },
};

export const getTutorConfig = (tutorId: TutorId = "eduardo"): TutorConfig =>
  TUTOR_CONFIGS[tutorId] || TUTOR_CONFIGS.eduardo;

const normalizeTutor = (value: string): TutorId | null => {
  const id = value.toLowerCase();
  if (id === "antonia" || id === "elena") {
    return "antonia";
  }
  if (id === "ariana" || id === "marcus") {
    return "ariana";
  }
  if (id === "fabian" || id === "hannah") {
    return "fabian";
  }
  if (id === "eduardo") {
    return "eduardo";
  }
  return null;
};

export const resolveTutorFromRoom = (
  roomName?: string,
  metadata?: string,
): TutorId => {
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata) as { tutorId?: string };
      const resolved = parsed.tutorId ? normalizeTutor(parsed.tutorId) : null;
      if (resolved) {
        return resolved;
      }
    } catch {
      const resolved = normalizeTutor(metadata);
      if (resolved) {
        return resolved;
      }
    }
  }

  if (roomName) {
    for (const segment of roomName.toLowerCase().split(/[^a-z]+/)) {
      const resolved = normalizeTutor(segment);
      if (resolved) {
        return resolved;
      }
    }
  }

  return "eduardo";
};

export const resolveTutorFromJobContext = (context: JobContext): TutorId => {
  const metadataCandidates = [
    context.job?.room?.metadata,
    context.job?.metadata,
    context.room?.metadata,
  ];
  const roomCandidates = [context.job?.room?.name, context.room?.name];

  for (const metadata of metadataCandidates) {
    if (metadata) {
      const resolved = resolveTutorFromRoom(undefined, String(metadata));
      if (
        resolved !== "eduardo" ||
        String(metadata).toLowerCase().includes("eduardo")
      ) {
        return resolved;
      }
    }
  }

  for (const roomName of roomCandidates) {
    if (roomName) {
      const resolved = resolveTutorFromRoom(roomName);
      if (
        resolved !== "eduardo" ||
        roomName.toLowerCase().includes("eduardo")
      ) {
        return resolved;
      }
    }
  }

  return "eduardo";
};

export const createTutorAgent = (
  tutorId: TutorId = "eduardo",
  runtime: VoiceRuntimeConfig = loadVoiceRuntimeConfig(),
): Agent => {
  const config = getTutorConfig(tutorId);

  return Agent.create({
    id: `mentor-${config.id}`,
    instructions: config.instructions,
    llm: openai.LLM.withOllama({
      model: runtime.llmModel,
      baseURL: runtime.llmBaseUrl,
      temperature: runtime.llmTemperature,
    }),
    async onUserTurnCompleted(_context, chatContext, newMessage) {
      clearPreviousKnowledgeContext(chatContext);

      const query = newMessage.textContent?.trim();
      if (!query) {
        return;
      }

      void persistTranscriptEntry(
        {
          sessionId: (_context as { room?: { name?: string } })?.room?.name || "sala-local",
          speaker: "user",
          content: query,
          sequenceOrder: Date.now(),
        },
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      );

      const knowledge = await queryVitaKnowledge(
        query,
        tutorId,
        config.languageCode,
        runtime,
      );
      if (knowledge) {
        chatContext.addMessage({
          role: "system",
          content: formatKnowledgeContext(knowledge),
          extra: { [VITA_KNOWLEDGE_CONTEXT_FLAG]: true },
        });
      }
    },
  });
};

export const createTutorSession = (
  tutorId: TutorId = "eduardo",
  runtime: VoiceRuntimeConfig = loadVoiceRuntimeConfig(),
): voice.AgentSession => {
  const config = getTutorConfig(tutorId);
  const model =
    config.ttsModel === "german"
      ? runtime.germanTtsModel
      : runtime.defaultTtsModel;

  return new voice.AgentSession({
    stt: new openai.STT({
      model: runtime.sttModel,
      language: config.languageCode,
      detectLanguage: false,
      useRealtime: false,
      baseURL: runtime.speechBaseUrl,
      apiKey: runtime.speechApiKey,
      prompt:
        "Anatomia humana, terminologia anatômica, osteologia, artrologia, miologia, neuroanatomia e anatomia clínica.",
    }),
    tts: new openai.TTS({
      model,
      voice: config.voiceProfileId as never,
      speed: runtime.ttsSpeed,
      baseURL: runtime.speechBaseUrl,
      apiKey: runtime.speechApiKey,
    }),
    vad: new inference.VAD({
      minSilenceDuration: 450,
      prefixPaddingDuration: 300,
    }),
    turnHandling: {
      turnDetection: new inference.TurnDetector({ version: "v1-mini" }),
      preemptiveGeneration: { enabled: false },
    },
  });
};

export const voiceModelConfig = TUTOR_CONFIGS.eduardo;
export const assistantInstructions = TUTOR_CONFIGS.eduardo.instructions;
export const greetingInstructions = TUTOR_CONFIGS.eduardo.greeting;
export const createAgent = () => createTutorAgent("eduardo");
export const createSession = () => createTutorSession("eduardo");

import { Agent, dedent, inference, tts, voice, type JobContext } from "@livekit/agents";
import { DirectDeepgramTTS } from "./deepgram-tts.ts";

export type TutorId = "eduardo" | "antonia" | "ariana" | "fabian";

export interface TutorConfig {
  id: TutorId;
  name: string;
  languageName: string;
  country: string;
  flag: string;
  gender: "masculino" | "feminino";
  description: string;
  stt: {
    model: string;
    language: string;
  };
  llm: {
    model: string;
  };
  tts: {
    provider: "cartesia" | "deepgram";
    model: string;
    voice: string;
    language?: string;
  };
  instructions: string;
  greeting: string;
}

const basePerformanceInstructions = dedent`
  DIRETRIZ DE PERFORMANCE E FLUIDEZ (ZERO TRAVAMENTOS):
  - Mantenha respostas ÁGEIS, DIRETAS e NATURAIS: exatamente UMA a DUAS frases concisas por turno.
  - NUNCA gere parágrafos longos, dissertações ou listas extensas. Respostas curtas garantem áudio imediato e sem engasgos.
  - Fale com voz relaxada, usando vírgulas para respiro e no máximo uma reticência suave (...) por turno.
  - Responda SEMPRE em texto puro e oralizável. NUNCA use Markdown, asteriscos, negrito ou emojis.
  - Escreva números e siglas por extenso.
  - Finalize com apenas UMA pergunta curta para manter o diálogo vivo e interativo.
`;

export const TUTOR_CONFIGS: Record<TutorId, TutorConfig> = {
  eduardo: {
    id: "eduardo",
    name: "Eduardo",
    languageName: "Português",
    country: "Brasil",
    flag: "🇧🇷",
    gender: "masculino",
    description: "Mentor sênior com voz barítona calorosa, profunda e acolhedora em português do Brasil.",
    stt: {
      model: "deepgram/nova-3",
      language: "pt-BR"
    },
    llm: {
      model: "google/gemini-3.1-flash-lite"
    },
    tts: {
      provider: "cartesia",
      model: "cartesia/sonic-3",
      voice: "a0e99841-438c-4a64-b679-ae501e7d6091",
      language: "pt-BR"
    },
    instructions: dedent`
      Você é o Eduardo, mentor oficial de anatomia do Aeternum Atlas.
      Você é um homem brasileiro, sábio, caloroso, com voz barítona acolhedora e dicção 100% nativa do Brasil.
      Converse EXCLUSIVAMENTE em Português do Brasil com naturalidade, empatia e clareza.
      NUNCA fale em inglês, espanhol ou alemão. Você é o especialista nativo em língua portuguesa.
      Se o usuário falar em outro idioma, convide-o gentilmente em português a conversar em português ou selecionar o tutor correspondente no painel.

      ${basePerformanceInstructions}
    `,
    greeting:
      "Olá! Seja muito bem-vindo ao Aeternum Vita. Eu sou o Eduardo, seu mentor em português do Brasil. Como posso guiar seus estudos anatômicos hoje?"
  },
  antonia: {
    id: "antonia",
    name: "Antonia",
    languageName: "Español",
    country: "Argentina / España",
    flag: "🇪🇸",
    gender: "feminino",
    description: "Mentora hispanohablante nativa con voz femenina clara, empática y expresiva.",
    stt: {
      model: "deepgram/nova-3",
      language: "es"
    },
    llm: {
      model: "google/gemini-3.1-flash-lite"
    },
    tts: {
      provider: "deepgram",
      model: "aura-2-antonia-es",
      voice: "aura-2-antonia-es",
      language: "es"
    },
    instructions: dedent`
      Eres Antonia, la mentora oficial de anatomía de Aeternum Atlas.
      Eres una mujer hispanohablante nativa, con voz femenina clara, cálida y dicción auténtica en español.
      Conversa EXCLUSIVAMENTE en español nativo con expresiones naturales y fluidas ("¡Hola!", "¡Por supuesto!", "Mira...").
      NUNCA hables en portugués, inglés o alemán. Eres la especialista nativa en lengua española.

      ${basePerformanceInstructions}
    `,
    greeting:
      "¡Hola! Te doy una cálida bienvenida a Aeternum Vita. Soy Antonia, tu mentora nativa en español. ¿Qué estructura anatómica deseas explorar hoy?"
  },
  ariana: {
    id: "ariana",
    name: "Ariana",
    languageName: "English",
    country: "United States",
    flag: "🇺🇸",
    gender: "feminino",
    description: "Dynamic and inspiring American English mentor with natural, engaging female voice.",
    stt: {
      model: "deepgram/nova-3",
      language: "en"
    },
    llm: {
      model: "google/gemini-3.1-flash-lite"
    },
    tts: {
      provider: "cartesia",
      model: "cartesia/sonic-3",
      voice: "ec1e269e-9ca0-402f-8a18-58e0e022355a",
      language: "en"
    },
    instructions: dedent`
      You are Ariana, the official anatomy mentor of the Aeternum Atlas ecosystem.
      You are a native English speaker with a clear, dynamic, warm and engaging female voice.
      Speak EXCLUSIVELY in natural native English with confident, friendly pacing.
      NEVER speak in Portuguese, Spanish, or German. You are the native English specialist.

      ${basePerformanceInstructions}
    `,
    greeting:
      "Hello and welcome to Aeternum Vita! I am Ariana, your native English anatomy mentor. How can I guide your journey today?"
  },
  fabian: {
    id: "fabian",
    name: "Fabian",
    languageName: "Deutsch",
    country: "Deutschland",
    flag: "🇩🇪",
    gender: "masculino",
    description: "Kompetenter akademischer Mentor mit angenehmer und klarer deutscher Männerstimme.",
    stt: {
      model: "deepgram/nova-3",
      language: "de"
    },
    llm: {
      model: "google/gemini-3.1-flash-lite"
    },
    tts: {
      provider: "deepgram",
      model: "aura-2-fabian-de",
      voice: "aura-2-fabian-de",
      language: "de"
    },
    instructions: dedent`
      Du bist Fabian, der offizielle Anatomie-Mentor des Aeternum Atlas Ökosystems.
      Du bist ein deutscher Muttersprachler mit einer klaren, souveränen und freundlichen Männerstimme.
      Sprich AUSSCHLIESSLICH in natürlichem Deutsch (Hochdeutsch) com feiner, präziser Artikulation.
      Sprich NIEMALS auf Portugiesisch, Spanisch oder Englisch. Du bist der deutsche Muttersprachler.

      ${basePerformanceInstructions}
    `,
    greeting:
      "Hallo und herzlich willkommen bei Aeternum Vita! Ich bin Fabian, dein Anatomie-Mentor auf Deutsch. Wie kann ich dir heute helfen?"
  }
};

export const getTutorConfig = (tutorId: TutorId = "eduardo"): TutorConfig => {
  return TUTOR_CONFIGS[tutorId] || TUTOR_CONFIGS.eduardo;
};

export const createTutorTTS = (tutorId: TutorId = "eduardo"): tts.TTS => {
  const config = getTutorConfig(tutorId);
  if (config.tts.provider === "deepgram") {
    return new DirectDeepgramTTS(config.tts.voice);
  }
  return new inference.TTS(config.tts as any);
};

export const resolveTutorFromJobContext = (context: JobContext): TutorId => {
  const jobRoomName = context.job?.room?.name;
  const jobRoomMetadata = context.job?.room?.metadata;
  const jobMetadata = context.job?.metadata;
  const roomName = context.room?.name;
  const roomMetadata = context.room?.metadata;

  for (const metadata of [jobRoomMetadata, jobMetadata, roomMetadata]) {
    if (metadata) {
      try {
        const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
        if (parsed?.tutorId) {
          const id = parsed.tutorId.toLowerCase();
          if (id === "antonia") return "antonia";
          if (id === "ariana") return "ariana";
          if (id === "fabian") return "fabian";
          if (id === "eduardo") return "eduardo";
        }
      } catch {
        const lower = String(metadata).toLowerCase();
        if (lower.includes("antonia")) return "antonia";
        if (lower.includes("ariana")) return "ariana";
        if (lower.includes("fabian")) return "fabian";
        if (lower.includes("eduardo")) return "eduardo";
      }
    }
  }

  for (const name of [jobRoomName, roomName]) {
    if (name) {
      const lower = name.toLowerCase();
      if (lower.includes("antonia")) return "antonia";
      if (lower.includes("ariana")) return "ariana";
      if (lower.includes("fabian")) return "fabian";
      if (lower.includes("eduardo")) return "eduardo";
    }
  }

  return "eduardo";
};

export const createTutorAgent = (tutorId: TutorId = "eduardo"): Agent => {
  const config = getTutorConfig(tutorId);

  return Agent.create({
    id: `mentor-${config.id}`,
    instructions: config.instructions,
    llm: new inference.LLM(config.llm)
  });
};

export const createTutorSession = (tutorId: TutorId = "eduardo"): voice.AgentSession => {
  const config = getTutorConfig(tutorId);

  return new voice.AgentSession({
    stt: new inference.STT(config.stt),
    tts: createTutorTTS(tutorId),
    turnHandling: {
      turnDetection: new inference.TurnDetector(),
      preemptiveGeneration: { enabled: false }
    }
  });
};

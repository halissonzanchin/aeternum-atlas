import {
  ChatContext,
  initializeLogger,
  type JobContext,
} from "@livekit/agents";
import { beforeAll, describe, expect, it } from "vitest";
import {
  TUTOR_CONFIGS,
  clearPreviousKnowledgeContext,
  createTutorAgent,
  createTutorSession,
  getTutorConfig,
  resolveTutorFromJobContext,
  resolveTutorFromRoom,
} from "./agent.ts";
import { loadVoiceRuntimeConfig } from "./runtime-config.ts";

const runtime = loadVoiceRuntimeConfig({
  VITA_AI_BACKEND: "legacy_direct",
  LOCAL_LLM_BASE_URL: "http://ollama:11434/v1",
  LOCAL_LLM_MODEL: "qwen3:4b",
  LOCAL_SPEECH_BASE_URL: "http://speech:8000/v1",
  LOCAL_SPEECH_API_KEY: "test-local-key",
  LOCAL_STT_MODEL: "Systran/faster-whisper-small",
});

describe("Aeternum Vita Multi-Tutor System", () => {
  beforeAll(() => initializeLogger({ pretty: false, level: "silent" }));

  it("mantém quatro tutores locais com idiomas e vozes independentes", () => {
    expect(TUTOR_CONFIGS.eduardo.languageCode).toBe("pt");
    expect(runtime.tutorVoices.eduardo).toBe("pm_alex");
    expect(TUTOR_CONFIGS.eduardo.gender).toBe("masculino");

    expect(TUTOR_CONFIGS.antonia.languageCode).toBe("es");
    expect(runtime.tutorVoices.antonia).toBe("ef_dora");
    expect(TUTOR_CONFIGS.antonia.gender).toBe("feminino");

    expect(TUTOR_CONFIGS.ariana.languageCode).toBe("en");
    expect(runtime.tutorVoices.ariana).toBe("af_heart");
    expect(TUTOR_CONFIGS.ariana.gender).toBe("feminino");

    expect(TUTOR_CONFIGS.fabian.languageCode).toBe("de");
    expect(runtime.tutorVoices.fabian).toBe("thorsten");
    expect(TUTOR_CONFIGS.fabian.ttsModel).toBe("german");
  });

  it("substitui o prompt genérico por uma regra de resposta anatômica substantiva", () => {
    const instructions = TUTOR_CONFIGS.eduardo.instructions;
    expect(instructions).toContain("responda imediatamente sobre ela");
    expect(instructions).toContain("três a seis frases");
    expect(instructions).toContain("escápula");
    expect(instructions).not.toContain("exatamente UMA a DUAS frases");
  });

  it("resolve o tutor a partir do JobContext", () => {
    const mockAntoniaContext = {
      job: {
        room: {
          name: "aeternum-sala-antonia-12345",
          metadata: JSON.stringify({ tutorId: "antonia" }),
        },
        metadata: JSON.stringify({ tutorId: "antonia" }),
      },
      room: {
        name: "aeternum-sala-antonia-12345",
        metadata: JSON.stringify({ tutorId: "antonia" }),
      },
    } as unknown as JobContext;

    expect(resolveTutorFromJobContext(mockAntoniaContext)).toBe("antonia");
    expect(
      resolveTutorFromJobContext({
        job: { room: { name: "aeternum-sala-ariana-999" } },
        room: {},
      } as unknown as JobContext),
    ).toBe("ariana");
    expect(
      resolveTutorFromJobContext({
        job: { room: { name: "aeternum-sala-fabian-777" } },
        room: {},
      } as unknown as JobContext),
    ).toBe("fabian");
  });

  it("resolve aliases legados sem mudar a identidade dos quatro tutores", () => {
    expect(resolveTutorFromRoom("aeternum-sala-antonia-1234")).toBe("antonia");
    expect(resolveTutorFromRoom("aeternum-sala-marcus-5678")).toBe("ariana");
    expect(resolveTutorFromRoom("aeternum-sala-hannah-9999")).toBe("fabian");
    expect(
      resolveTutorFromRoom(undefined, JSON.stringify({ tutorId: "elena" })),
    ).toBe("antonia");
    expect(resolveTutorFromRoom("qualquer-sala", undefined)).toBe("eduardo");
  });

  it("instancia agente e sessão sem provedores de inferência pagos", () => {
    for (const tutorId of ["eduardo", "antonia", "ariana", "fabian"] as const) {
      const config = getTutorConfig(tutorId);
      const agent = createTutorAgent(tutorId, runtime);
      const session = createTutorSession(tutorId, runtime);

      expect(config.id).toBe(tutorId);
      expect(agent.id).toBe(`mentor-${tutorId}`);
      expect(agent.llm?.provider).toBe("ollama:11434");
      expect(session).toBeDefined();
    }
  });

  it("remove somente o contexto RAG transitório antes do turno seguinte", () => {
    const chatContext = ChatContext.empty();
    const studentMessage = chatContext.addMessage({
      role: "user",
      content: "Explique a escápula",
    });
    chatContext.addMessage({
      role: "system",
      content: "Contexto bibliográfico anterior",
      extra: { vitaKnowledgeContext: true },
    });

    clearPreviousKnowledgeContext(chatContext);

    expect(chatContext.items).toEqual([studentMessage]);
  });
});

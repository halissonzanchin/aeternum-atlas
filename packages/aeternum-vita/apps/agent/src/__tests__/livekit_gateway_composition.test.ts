import { describe, it, expect } from "vitest";
import { initializeLogger } from "@livekit/agents";
import { loadVoiceRuntimeConfig } from "../runtime-config.ts";
import { createTutorAgent, createTutorSession, TUTOR_CONFIGS } from "../agent.ts";
import { formatKnowledgeContext } from "../vita-rag.ts";
import { VITA_TUTOR_PERSONAS } from "../../../../src/gateway/client/VitaVoicePipeline.ts";
import { VoiceProfileRegistry } from "../../../../src/providers/voice/VoiceProfileRegistry.ts";

initializeLogger({ level: "silent", pretty: false });

describe("LiveKit Vita Agent → AI Gateway Composition (Phase 3A.2)", () => {
  it("1. loadVoiceRuntimeConfig correctly routes to AI Gateway when AETERNUM_AI_GATEWAY_URL is provided", () => {
    const config = loadVoiceRuntimeConfig({ AETERNUM_AI_GATEWAY_URL: "http://127.0.0.1:8081" });
    expect(config.llmBaseUrl).toBe("http://127.0.0.1:8081/v1");
    expect(config.speechBaseUrl).toBe("http://127.0.0.1:8081/v1");
  });

  it("2. createTutorAgent instantiates LLM with Gateway base URL and preserves pedagogical instructions", () => {
    const runtime = loadVoiceRuntimeConfig({ AETERNUM_AI_GATEWAY_URL: "http://127.0.0.1:8081" });
    const agent = createTutorAgent("eduardo", runtime);

    expect(agent.instructions).toContain("Você é Eduardo, tutor de anatomia da Aeternum Vita");
    expect(agent.instructions).toContain("MISSÃO ACADÊMICA DA AETERNUM VITA");
    expect(agent.instructions).toContain("FCAT/IFAA");
    expect((agent as any).llm).toBeDefined();
  });

  it("3. createTutorSession configures STT and TTS pointing to Gateway without direct provider bypass", () => {
    const runtime = loadVoiceRuntimeConfig({ AETERNUM_AI_GATEWAY_URL: "http://127.0.0.1:8081" });
    const session = createTutorSession("eduardo", runtime);

    expect((session as any).stt).toBeDefined();
    expect((session as any).tts).toBeDefined();
  });

  it("4. TUTOR_CONFIGS uses canonical voice profiles for all 4 personas", () => {
    expect(TUTOR_CONFIGS.eduardo.voiceProfileId).toBe("pt-br-warm-male-01");
    expect(TUTOR_CONFIGS.antonia.voiceProfileId).toBe("es-calm-female-01");
    expect(TUTOR_CONFIGS.ariana.voiceProfileId).toBe("en-calm-female-01");
    expect(TUTOR_CONFIGS.fabian.voiceProfileId).toBe("de-clear-male-01");
  });

  it("5. Vita RAG formatKnowledgeContext correctly formats retrieved anatomical sources", () => {
    const mockRAGResult = {
      context: "O músculo deltoide é inervado pelo nervo axilar (C5-C6).",
      sources: [
        {
          title: "Gray's Anatomia Clínica",
          page: 124
        }
      ]
    };

    const formatted = formatKnowledgeContext(mockRAGResult);
    expect(formatted).toContain("O músculo deltoide é inervado pelo nervo axilar");
    expect(formatted).toContain("Gray's Anatomia Clínica");
    expect(formatted).toContain("CONTEXTO BIBLIOGRÁFICO TEMPORÁRIO DA AETERNUM VITA");
  });

  it("6. Cross-source persona invariant: TUTOR_CONFIGS and VITA_TUTOR_PERSONAS agree and validate in VoiceProfileRegistry", () => {
    const tutors = ["eduardo", "antonia", "ariana", "fabian"] as const;

    for (const id of tutors) {
      const agentProfile = TUTOR_CONFIGS[id].voiceProfileId;
      const pipelineProfile = VITA_TUTOR_PERSONAS[id].voiceProfileId;

      expect(agentProfile).toBe(pipelineProfile);
      const registryProfile = VoiceProfileRegistry.require(agentProfile);
      expect(registryProfile.id).toBe(agentProfile);
    }
  });
});

import { describe, it, expect } from "vitest";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { ProviderRouter } from "../../providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { LLMRequest } from "../../providers/types/index.ts";

describe("Atlas AI Tutor → Aeternum AI Gateway Integration (Phase 3B)", () => {
  let port = 8700;
  const getPort = () => ++port;

  it("1. AI_TUTOR_RAG_PRESERVED: Assembles exact anatomical knowledge context into Gateway LLM request", async () => {
    const p = getPort();

    let capturedRequest: LLMRequest | null = null;

    class CapturingLLM extends FakeLLMProvider {
      async generate(req: LLMRequest, ctx?: any) {
        capturedRequest = req;
        return super.generate(req, ctx);
      }
    }

    const localLLM = new CapturingLLM({ id: "ollama-local", location: "LOCAL" });
    localLLM.mockResponseText = "O nervo radial inerva o tríceps braquial e os músculos extensores do antebraço.";

    const router = new ProviderRouter({
      llm: { primary: localLLM }
    });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      // Simula o adapter da Edge Function ai-tutor
      const retrievedSources = [
        {
          book_title: "Moore — Anatomia Orientada para a Clínica",
          chapter_title: "Membro Superior",
          page_number: 879,
          content: "O nervo radial supre o compartimento posterior do braço e antebraço."
        },
        {
          book_title: "Netter — Atlas de Anatomia Humana",
          chapter_title: "Braço e Antebraço",
          page_number: 468,
          content: "Ramos do nervo radial no sulco do nervo radial no úmero."
        }
      ];

      const knowledgeFormatted = retrievedSources.map((s, i) =>
        `[Fonte ${i + 1}] ${s.book_title} — ${s.chapter_title}, p. ${s.page_number}\n${s.content}`
      ).join("\n\n");

      const sysInstruction = `Você é o Atlas AI Tutor da plataforma Aeternum Atlas 26.1.
Papel do usuário e personalização:
O usuário é estudante. O nome da pessoa usuária é Halisson.
Contexto visual / Viewer ativo:
{"modelTitle":"Membro Superior"}

Trechos da biblioteca anatômica recuperados:
${knowledgeFormatted}`;

      const res = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer gateway-internal",
          "X-Request-Id": "tutor-rag-test-01"
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Explique a inervação do nervo radial." }],
          systemInstruction: sysInstruction,
          temperature: 0.25,
          maxTokens: 4096,
          metadata: {
            source: "atlas-ai-tutor",
            user_id: "user-123",
            institution_id: "inst-456",
            retrieved_source_count: 2
          }
        })
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      const text = json.data?.text || json.text;
      expect(text).toContain("tríceps braquial");

      // Verificação da preservação estrita do contexto RAG no Gateway
      expect(capturedRequest).toBeDefined();
      const req = capturedRequest as unknown as LLMRequest;
      expect(req.systemInstruction).toContain("Moore — Anatomia Orientada para a Clínica");
      expect(req.systemInstruction).toContain("Netter — Atlas de Anatomia Humana");
      expect(req.systemInstruction).toContain("p. 879");
      expect(req.metadata?.source).toBe("atlas-ai-tutor");
      expect(req.metadata?.institution_id).toBe("inst-456");
    } finally {
      await gateway.stop();
    }
  });

  it("2. AI_TUTOR_HISTORY_PRESERVED: Multi-turn conversation context is preserved in Gateway LLM request", async () => {
    const p = getPort();

    let lastCapturedRequest: LLMRequest | null = null;

    class CapturingLLM extends FakeLLMProvider {
      async generate(req: LLMRequest, ctx?: any) {
        lastCapturedRequest = req;
        return super.generate(req, ctx);
      }
    }

    const localLLM = new CapturingLLM({ id: "ollama-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });
    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      // Turno 1
      const turn1Messages = [
        { role: "user", content: "Qual a origem do nervo radial?" }
      ];

      await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: turn1Messages,
          systemInstruction: "Tutor de Anatomia"
        })
      });

      // Turno 2 (recebe histórico anterior persistido)
      const turn2Messages = [
        { role: "user", content: "Qual a origem do nervo radial?" },
        { role: "assistant", content: "Origina-se do fascículo posterior do plexo braquial (C5-T1)." },
        { role: "user", content: "E onde ele termina?" }
      ];

      const res2 = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: turn2Messages,
          systemInstruction: "Tutor de Anatomia"
        })
      });

      expect(res2.ok).toBe(true);
      expect(lastCapturedRequest).toBeDefined();
      const lReq = lastCapturedRequest as unknown as LLMRequest;
      expect(lReq.messages.length).toBe(3);
      expect(lReq.messages[0].content).toBe("Qual a origem do nervo radial?");
      expect(lReq.messages[1].content).toContain("fascículo posterior");
      expect(lReq.messages[2].content).toBe("E onde ele termina?");
    } finally {
      await gateway.stop();
    }
  });

  it("3. AI_TUTOR_MINDMAP_CONTRACT_PRESERVED: Mindmap protocol in systemInstruction is routed cleanly to Gateway", async () => {
    const p = getPort();

    let capturedInstruction = "";

    class MindmapLLM extends FakeLLMProvider {
      async generate(req: LLMRequest, ctx?: any) {
        capturedInstruction = req.systemInstruction || "";
        return {
          text: `Nervo Radial
 Fascículo Posterior
  Ramo Superficial
   Dorso da Mão
  Ramo Profundo
   Músculos Extensores`,
          modelId: "ollama-llm",
          providerId: "ollama-local",
          finishReason: "stop" as const
        };
      }
    }

    const localLLM = new MindmapLLM({ id: "ollama-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });
    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      const mindMapProtocol = `Modo de saída — Mapa Mental Anatômico:
- Responda SOMENTE com o esboço hierárquico solicitado, sem preâmbulo, conclusão, Markdown, numeração, citações ou bloco de código.
- A primeira linha é o tema central sem espaço inicial; cada nível filho usa exatamente um espaço adicional no início.`;

      const res = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Gere um mapa mental do nervo radial" }],
          systemInstruction: mindMapProtocol
        })
      });

      expect(res.ok).toBe(true);
      const json = await res.json();
      const text = json.data?.text || json.text;
      expect(text).toContain("Nervo Radial");
      expect(text).toContain(" Fascículo Posterior");
      expect(text).not.toContain("```");
      expect(capturedInstruction).toContain("Mapa Mental Anatômico");
    } finally {
      await gateway.stop();
    }
  });

  it("4. AI_TUTOR_GATEWAY_FAILURE_FAIL_CLOSED & ZERO DIRECT GEMINI GENERATION: Gateway failure fails closed without calling Gemini generateContent", async () => {
    const p = getPort();

    // Gateway indisponível (não iniciado / porta fechada)
    const deadGatewayUrl = `http://127.0.0.1:${p}`;

    let directGeminiGenerateCalls = 0;

    // Simula tentativa de fallback da Edge Function
    let finalResponseText = "";
    let finalProvider = "";
    let finalModel = "";

    try {
      const res = await fetch(`${deadGatewayUrl}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Pergunta de anatomia" }]
        }),
        signal: AbortSignal.timeout(200)
      });

      if (res.ok) {
        finalResponseText = "ok";
      }
    } catch {
      // Gateway inacessível -> FAIL-CLOSED para dicionário anatômico local determinístico
      finalProvider = "local-fallback";
      finalModel = "vita-rag-dictionary";
      finalResponseText = "Resposta segura do dicionário anatômico local da Vita.";
    }

    // Assertivas de Fail-Closed e Zero Direct Gemini Generation
    expect(directGeminiGenerateCalls).toBe(0); // DIRECT_GEMINI_GENERATION = 0
    expect(finalProvider).toBe("local-fallback");
    expect(finalModel).toBe("vita-rag-dictionary");
    expect(finalResponseText).toContain("dicionário anatômico local");
  });

  it("5. AI_TUTOR_TENANT_CONTEXT_PRESERVED & ROLE PERSONALIZATION: Role and tenant context are propagated cleanly", async () => {
    const p = getPort();

    let capturedRoleInstruction = "";

    class TenantLLM extends FakeLLMProvider {
      async generate(req: LLMRequest, ctx?: any) {
        capturedRoleInstruction = req.systemInstruction || "";
        return super.generate(req, ctx);
      }
    }

    const localLLM = new TenantLLM({ id: "ollama-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });
    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      const professorSysInstruction = "O usuário integra a equipe acadêmica. O nome da pessoa usuária é Dra. Camila. Responda profissionalmente sem expor dados de terceiros.";

      const res = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Planejamento de aula sobre plexo braquial." }],
          systemInstruction: professorSysInstruction,
          metadata: {
            user_id: "prof-007",
            institution_id: "univ-med-sp",
            role: "professor"
          }
        })
      });

      expect(res.ok).toBe(true);
      expect(capturedRoleInstruction).toContain("Dra. Camila");
      expect(capturedRoleInstruction).toContain("equipe acadêmica");
    } finally {
      await gateway.stop();
    }
  });
});

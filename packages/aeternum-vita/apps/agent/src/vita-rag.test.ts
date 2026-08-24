import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadVoiceRuntimeConfig } from "./runtime-config.ts";
import { clearKnowledgeCache, formatKnowledgeContext, queryVitaKnowledge } from "./vita-rag.ts";

describe("RAG Híbrido da Aeternum Vita", () => {
  beforeEach(() => {
    clearKnowledgeCache();
  });

  it("não faz consulta HTTP quando o endpoint remoto não está configurado e termo não anatômico", async () => {
    const fetchMock = vi.fn();
    const result = await queryVitaKnowledge(
      "tema desconhecido 12345",
      "eduardo",
      "pt",
      loadVoiceRuntimeConfig({}),
      fetchMock,
    );
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retorna base anatômica local quando RAG_URL não está configurada", async () => {
    const fetchMock = vi.fn();
    const result = await queryVitaKnowledge(
      "escápula",
      "eduardo",
      "pt",
      loadVoiceRuntimeConfig({}),
      fetchMock,
    );
    expect(result).not.toBeNull();
    expect(result?.context).toContain("escápula");
    expect(result?.sources.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prioriza endpoint HTTP quando VITA_RAG_URL está configurada", async () => {
    const runtime = loadVoiceRuntimeConfig({
      VITA_RAG_URL: "https://vita.example.test/search",
      VITA_RAG_API_KEY: "test-rag-key",
    });
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            context:
              "A escápula é um osso plano do cíngulo do membro superior recuperado via API remota.",
            sources: [{ title: "Anatomia Clínica", page: 72 }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );

    const result = await queryVitaKnowledge(
      "escápula",
      "eduardo",
      "pt",
      runtime,
      fetchMock,
    );
    expect(result?.sources[0]).toEqual({ title: "Anatomia Clínica", page: 72 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://vita.example.test/search",
      expect.objectContaining({ method: "POST" }),
    );
    expect(formatKnowledgeContext(result!)).toContain("página 72");
  });
});

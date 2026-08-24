import { RAGProvider } from "../contracts/RAGProvider.ts";
import { RAGRequest, RAGResponse, ProviderMetadata, HealthResult } from "../types/index.ts";

export class FakeRAGProvider implements RAGProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-rag",
    name: "Fake Anatomical RAG Provider",
    type: "RAG",
    location: "LOCAL",
    version: "1.0.0"
  };

  public shouldFail = false;

  async health(): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.shouldFail ? "UNAVAILABLE" : "HEALTHY",
      latencyMs: 15,
      timestamp: new Date().toISOString()
    };
  }

  async retrieve(request: RAGRequest): Promise<RAGResponse> {
    if (this.shouldFail) {
      throw new Error("Fake RAG retrieve failure");
    }
    return {
      chunks: [
        {
          sourceId: "chunk-101",
          sourceTitle: "Moore — Anatomia Orientada para a Clínica",
          pageNumber: 672,
          chapterTitle: "Membro Superior: Clavícula",
          content: "A clavícula atua como suporte rígido conectando o membro superior ao esqueleto axial.",
          score: 0.95,
          retrievalMethod: "hybrid"
        }
      ],
      totalFound: 1,
      providerId: this.metadata.id,
      retrievalMethod: "hybrid",
      latencyMs: 25
    };
  }
}

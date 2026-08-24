import { RAGProvider } from "../contracts/RAGProvider.ts";
import {
  RAGRequest,
  RAGResponse,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderCancelledError,
  ProviderUnavailableError
} from "../types/index.ts";

export class FakeRAGProvider implements RAGProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-rag",
    name: "Fake RAG Provider",
    type: "RAG",
    location: "LOCAL",
    version: "1.0.0"
  };

  public failureMode?: "unavailable";

  async health(_context?: ProviderExecutionContext): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.failureMode === "unavailable" ? "UNAVAILABLE" : "HEALTHY",
      latencyMs: 15,
      timestamp: new Date().toISOString()
    };
  }

  async retrieve(request: RAGRequest, context?: ProviderExecutionContext): Promise<RAGResponse> {
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Busca no RAG cancelada.", this.metadata.id);
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("Banco de RAG indisponível.", this.metadata.id);
    }

    return {
      chunks: [
        {
          sourceId: "chunk-101",
          sourceTitle: "Tratado de Anatomia Canônica",
          pageNumber: 672,
          chapterTitle: "Osteologia",
          content: "A clavícula atua como suporte rígido conectando o membro superior ao esqueleto axial.",
          score: 0.95, // Normalizado [0.0 - 1.0]
          rawScore: 18.75, // Score bruto do motor
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

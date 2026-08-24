import { MemoryProvider } from "../contracts/MemoryProvider.ts";
import {
  StudentContext,
  InteractionRecord,
  MasteryUpdate,
  LearningProfile,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderCancelledError,
  ProviderUnavailableError
} from "../types/index.ts";

export class FakeMemoryProvider implements MemoryProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-memory",
    name: "Fake Memory Provider",
    type: "MEMORY",
    location: "LOCAL",
    version: "1.0.0"
  };

  public failureMode?: "unavailable";
  private memoryStore = new Map<string, InteractionRecord[]>();

  async health(_context?: ProviderExecutionContext): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.failureMode === "unavailable" ? "UNAVAILABLE" : "HEALTHY",
      latencyMs: 5,
      timestamp: new Date().toISOString()
    };
  }

  async getStudentContext(studentId: string, context?: ProviderExecutionContext): Promise<StudentContext> {
    if (context?.signal?.aborted) throw new ProviderCancelledError("Cancelado.", this.metadata.id);
    if (this.failureMode === "unavailable") throw new ProviderUnavailableError("Memória indisponível.", this.metadata.id);

    return {
      studentId,
      profile: {
        studentId,
        preferredLanguage: "pt-BR",
        experienceLevel: "intermediate",
        strongTopics: ["osteologia"],
        weakTopics: ["plexo braquial"]
      },
      recentInteractions: this.memoryStore.get(studentId) || []
    };
  }

  async saveInteraction(record: InteractionRecord, context?: ProviderExecutionContext): Promise<void> {
    if (context?.signal?.aborted) throw new ProviderCancelledError("Cancelado.", this.metadata.id);
    if (this.failureMode === "unavailable") throw new ProviderUnavailableError("Memória indisponível.", this.metadata.id);

    const records = this.memoryStore.get(record.studentId) || [];
    records.push(record);
    this.memoryStore.set(record.studentId, records);
  }

  async updateMastery(_update: MasteryUpdate, context?: ProviderExecutionContext): Promise<void> {
    if (context?.signal?.aborted) throw new ProviderCancelledError("Cancelado.", this.metadata.id);
    if (this.failureMode === "unavailable") throw new ProviderUnavailableError("Memória indisponível.", this.metadata.id);
  }

  async getLearningProfile(studentId: string, context?: ProviderExecutionContext): Promise<LearningProfile> {
    if (context?.signal?.aborted) throw new ProviderCancelledError("Cancelado.", this.metadata.id);
    if (this.failureMode === "unavailable") throw new ProviderUnavailableError("Memória indisponível.", this.metadata.id);

    return {
      studentId,
      preferredLanguage: "pt-BR",
      experienceLevel: "intermediate",
      strongTopics: ["osteologia"],
      weakTopics: ["plexo braquial"]
    };
  }
}

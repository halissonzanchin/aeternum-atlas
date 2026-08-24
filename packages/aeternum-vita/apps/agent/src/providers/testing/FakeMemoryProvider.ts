import { MemoryProvider } from "../contracts/MemoryProvider.ts";
import { StudentContext, InteractionRecord, MasteryUpdate, LearningProfile, ProviderMetadata, HealthResult } from "../types/index.ts";

export class FakeMemoryProvider implements MemoryProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-memory",
    name: "Fake Student Memory Provider",
    type: "MEMORY",
    location: "LOCAL",
    version: "1.0.0"
  };

  public shouldFail = false;
  private memoryStore = new Map<string, InteractionRecord[]>();

  async health(): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.shouldFail ? "UNAVAILABLE" : "HEALTHY",
      latencyMs: 5,
      timestamp: new Date().toISOString()
    };
  }

  async getStudentContext(studentId: string): Promise<StudentContext> {
    if (this.shouldFail) throw new Error("Fake Memory context failure");
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

  async saveInteraction(record: InteractionRecord): Promise<void> {
    if (this.shouldFail) throw new Error("Fake Memory save failure");
    const records = this.memoryStore.get(record.studentId) || [];
    records.push(record);
    this.memoryStore.set(record.studentId, records);
  }

  async updateMastery(_update: MasteryUpdate): Promise<void> {
    if (this.shouldFail) throw new Error("Fake Memory update failure");
  }

  async getLearningProfile(studentId: string): Promise<LearningProfile> {
    if (this.shouldFail) throw new Error("Fake Memory profile failure");
    return {
      studentId,
      preferredLanguage: "pt-BR",
      experienceLevel: "intermediate",
      strongTopics: ["osteologia"],
      weakTopics: ["plexo braquial"]
    };
  }
}

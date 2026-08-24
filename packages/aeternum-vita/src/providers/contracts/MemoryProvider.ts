import { BaseProvider } from "./BaseProvider.ts";
import { StudentContext, InteractionRecord, MasteryUpdate, LearningProfile, ProviderExecutionContext } from "../types/index.ts";

export interface MemoryProvider extends BaseProvider {
  getStudentContext(studentId: string, context?: ProviderExecutionContext): Promise<StudentContext>;
  saveInteraction(record: InteractionRecord, context?: ProviderExecutionContext): Promise<void>;
  updateMastery(update: MasteryUpdate, context?: ProviderExecutionContext): Promise<void>;
  getLearningProfile(studentId: string, context?: ProviderExecutionContext): Promise<LearningProfile>;
}

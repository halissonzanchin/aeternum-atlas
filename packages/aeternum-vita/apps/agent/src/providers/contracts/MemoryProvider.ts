import { BaseProvider } from "./BaseProvider.ts";
import { StudentContext, InteractionRecord, MasteryUpdate, LearningProfile } from "../types/index.ts";

export interface MemoryProvider extends BaseProvider {
  getStudentContext(studentId: string): Promise<StudentContext>;
  saveInteraction(record: InteractionRecord): Promise<void>;
  updateMastery(update: MasteryUpdate): Promise<void>;
  getLearningProfile(studentId: string): Promise<LearningProfile>;
}

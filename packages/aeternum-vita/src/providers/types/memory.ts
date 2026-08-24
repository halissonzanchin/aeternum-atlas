export interface LearningProfile {
  studentId: string;
  preferredLanguage: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  strongTopics: string[];
  weakTopics: string[];
  lastSessionAt?: string;
}

export interface InteractionRecord {
  studentId: string;
  topic: string;
  userPromptSummary: string;
  aiResponseSummary: string;
  mode: "lecture" | "quiz" | "flashcard" | "clinical";
  score?: number;
  timestamp: string;
}

export interface MasteryUpdate {
  studentId: string;
  topic: string;
  newMasteryLevel: number;
  reason: string;
}

export interface StudentContext {
  studentId: string;
  profile: LearningProfile;
  recentInteractions: InteractionRecord[];
  activeTopic?: string;
}

export type ProviderLocation = "LOCAL" | "CLOUD" | "HYBRID";

export type ProviderType = "LLM" | "STT" | "TTS" | "RAG" | "MEMORY" | "HEALTH";

export interface ProviderMetadata {
  id: string;
  name: string;
  type: ProviderType;
  location: ProviderLocation;
  version?: string;
  description?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LatencyMetrics {
  totalDurationMs: number;
  timeToFirstTokenMs?: number;
  timeToFirstByteMs?: number;
}

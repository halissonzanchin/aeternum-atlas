import { TokenUsage, LatencyMetrics } from "./common.ts";

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
  name?: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

export type LLMFinishReason = "stop" | "length" | "content_filter" | "unknown";

export interface LLMResponse {
  text: string;
  providerId: string;
  modelId: string;
  finishReason: LLMFinishReason;
  usage?: TokenUsage;
  latency?: LatencyMetrics;
  metadata?: Record<string, unknown>;
}

export interface LLMStreamChunk {
  deltaText: string;
  isComplete: boolean;
  finishReason?: LLMFinishReason;
  usage?: TokenUsage;
}

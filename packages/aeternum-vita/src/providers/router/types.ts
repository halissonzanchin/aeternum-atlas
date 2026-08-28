import { ProviderLocation, ProviderExecutionContext } from "../types/common.ts";
import { LLMProvider } from "../contracts/LLMProvider.ts";
import { STTProvider } from "../contracts/STTProvider.ts";
import { TTSProvider } from "../contracts/TTSProvider.ts";
import { ProviderHealthMonitor } from "../contracts/ProviderHealthMonitor.ts";
import { VoiceProfileRegistry } from "../voice/VoiceProfileRegistry.ts";

export type RouterCapability =
  | "LLM_GENERATE"
  | "LLM_STREAM"
  | "STT_TRANSCRIBE"
  | "STT_STREAM"
  | "TTS_SYNTHESIZE"
  | "TTS_STREAM";

export interface SafeProviderErrorInfo {
  name: string;
  code: string;
  message: string;
}

export interface RouteAttempt {
  attemptNumber: number;
  providerId: string;
  providerLocation: ProviderLocation;
  latencyMs: number;
  canonicalResult: "SUCCESS" | "FAILED" | "CANCELLED";
  error?: SafeProviderErrorInfo;
}

export interface RouteMetadata {
  capabilityRequested: RouterCapability;
  primaryProvider: string;
  selectedProvider: string;
  finalProvider?: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
  attempts: RouteAttempt[];
  finalCanonicalError?: string;
}

export interface RouterExecutionResult<T> {
  data: T;
  metadata: RouteMetadata;
}

export interface ProviderRouterConfig {
  llm?: {
    primary: LLMProvider;
    fallback?: LLMProvider;
  };
  stt?: {
    primary: STTProvider;
    fallback?: STTProvider;
  };
  tts?: {
    primary: TTSProvider;
    fallback?: TTSProvider;
  };
  healthMonitor?: ProviderHealthMonitor;
  voiceRegistry?: VoiceProfileRegistry;
  onRouteComplete?: (metadata: RouteMetadata) => void;
}

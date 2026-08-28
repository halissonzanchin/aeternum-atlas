import { ProviderRouter, RouteMetadata } from "../providers/router/index.ts";

export type GatewayAuthMode = "INTERNAL_DEV" | "SUPABASE_JWT" | "DISABLED";

export interface GatewayLogger {
  info(event: string, meta?: Record<string, unknown>): void;
  warn(event: string, meta?: Record<string, unknown>): void;
  error(event: string, meta?: Record<string, unknown>): void;
}

export interface GatewayConfig {
  port?: number;
  host?: string;
  authMode?: GatewayAuthMode;
  router: ProviderRouter;
  version?: string;
  mode?: string;
  requestTimeoutMs?: number;
  maxJsonBodyBytes?: number;
  maxAudioBodyBytes?: number;
  logger?: GatewayLogger;
}

export interface GatewayHealthResponse {
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  gateway_version: string;
  mode: string;
  auth_mode: GatewayAuthMode;
  timestamp: string;
  providers: {
    llm_local: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
    llm_cloud: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
    stt_local: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
    stt_cloud: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
    tts_local: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
    tts_cloud: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  };
}

export interface GatewaySuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    requestId: string;
    capability: string;
    finalProvider?: string;
    fallbackUsed: boolean;
    fallbackReason?: string;
    attemptCount: number;
    latencyMs?: number;
  };
}

export interface GatewayErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  metadata?: {
    requestId?: string;
    capability?: string;
    finalProvider?: string;
    fallbackUsed?: boolean;
    fallbackReason?: string;
    attemptCount?: number;
    finalCanonicalError?: string;
  };
}

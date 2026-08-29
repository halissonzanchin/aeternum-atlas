import http from "node:http";
import { ProviderRouter, RouteMetadata } from "../providers/router/index.ts";
import { BaseProvider } from "../providers/contracts/BaseProvider.ts";
import { HealthResult } from "../providers/types/health.ts";

export type GatewayAuthMode = "INTERNAL_DEV" | "SUPABASE_JWT" | "DISABLED";

export interface GatewayLogger {
  info(event: string, meta?: Record<string, unknown>): void;
  warn(event: string, meta?: Record<string, unknown>): void;
  error(event: string, meta?: Record<string, unknown>): void;
}

export interface GatewayJwtValidator {
  validateToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }>;
}

export interface ProviderHealthEntry {
  provider: BaseProvider;
  enabled: boolean;
}

export interface GatewayProviderHealthRegistry {
  llm_local?: ProviderHealthEntry;
  llm_cloud?: ProviderHealthEntry;
  stt_local?: ProviderHealthEntry;
  stt_cloud?: ProviderHealthEntry;
  tts_local?: ProviderHealthEntry;
  tts_cloud?: ProviderHealthEntry;
}

export interface GatewayConfig {
  port?: number;
  host?: string;
  authMode?: GatewayAuthMode;
  authToken?: string;
  jwtValidator?: GatewayJwtValidator;
  router: ProviderRouter;
  healthRegistry?: GatewayProviderHealthRegistry;
  version?: string;
  mode?: string;
  providerTimeoutMs?: number;
  gatewayRequestTimeoutMs?: number;
  maxJsonBodyBytes?: number;
  maxAudioBodyBytes?: number;
  logger?: GatewayLogger;
}

export interface ProviderHealthStatus {
  enabled: boolean;
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  latencyMs?: number;
}

export interface GatewayHealthResponse {
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  gateway_version: string;
  mode: string;
  auth_mode: GatewayAuthMode;
  timestamp: string;
  providers: {
    llm_local: ProviderHealthStatus;
    llm_cloud: ProviderHealthStatus;
    stt_local: ProviderHealthStatus;
    stt_cloud: ProviderHealthStatus;
    tts_local: ProviderHealthStatus;
    tts_cloud: ProviderHealthStatus;
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
  requestId?: string;
  error: {
    code: string;
    message: string;
    httpStatus?: number;
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

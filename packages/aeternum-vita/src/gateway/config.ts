import { GatewayConfig, GatewayAuthMode } from "./types.ts";

export interface GatewayEnvConfig {
  mode: string;
  cloudFallbackEnabled: boolean;
  localLLMEnabled: boolean;
  localSTTEnabled: boolean;
  localTTSEnabled: boolean;
  cloudLLMEnabled: boolean;
  cloudSTTEnabled: boolean;
  cloudTTSEnabled: boolean;
  port: number;
  host: string;
  authMode: GatewayAuthMode;
  providerTimeoutMs: number;
  gatewayRequestTimeoutMs: number;
}

export function parseStrictBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === "") return defaultValue;
  const lower = value.trim().toLowerCase();
  if (lower === "true" || lower === "1") return true;
  if (lower === "false" || lower === "0") return false;
  throw new Error(`Valor booleano inválido para configuração de ambiente: '${value}'. Use 'true' ou 'false'.`);
}

export function loadGatewayEnvConfig(): GatewayEnvConfig {
  const mode = process.env.AETERNUM_AI_MODE || "local_first";
  const cloudFallbackEnabled = parseStrictBoolean(process.env.CLOUD_FALLBACK_ENABLED, true);

  const localLLMEnabled = parseStrictBoolean(process.env.LOCAL_LLM_ENABLED, true);
  const localSTTEnabled = parseStrictBoolean(process.env.LOCAL_STT_ENABLED, true);
  const localTTSEnabled = parseStrictBoolean(process.env.LOCAL_TTS_ENABLED, true);

  const cloudLLMEnabled = cloudFallbackEnabled && parseStrictBoolean(process.env.CLOUD_LLM_ENABLED, true);
  const cloudSTTEnabled = cloudFallbackEnabled && parseStrictBoolean(process.env.CLOUD_STT_ENABLED, true);
  const cloudTTSEnabled = cloudFallbackEnabled && parseStrictBoolean(process.env.CLOUD_TTS_ENABLED, true);

  const port = Number(process.env.AETERNUM_AI_GATEWAY_PORT) || 8081;
  const host = process.env.AETERNUM_AI_GATEWAY_HOST || "127.0.0.1";
  const authMode = (process.env.AETERNUM_AI_GATEWAY_AUTH_MODE as GatewayAuthMode) || "INTERNAL_DEV";

  const providerTimeoutMs = Number(process.env.PROVIDER_TIMEOUT_MS) || 30000;
  const gatewayRequestTimeoutMs = Number(process.env.GATEWAY_REQUEST_TIMEOUT_MS) || 35000;

  return {
    mode,
    cloudFallbackEnabled,
    localLLMEnabled,
    localSTTEnabled,
    localTTSEnabled,
    cloudLLMEnabled,
    cloudSTTEnabled,
    cloudTTSEnabled,
    port,
    host,
    authMode,
    providerTimeoutMs,
    gatewayRequestTimeoutMs
  };
}

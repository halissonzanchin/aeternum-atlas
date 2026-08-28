export abstract class AeternumProviderError extends Error {
  public abstract readonly code: string;
  public readonly providerId: string;
  public readonly timestamp: string;

  constructor(message: string, providerId: string) {
    super(message);
    this.name = this.constructor.name;
    this.providerId = providerId;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ProviderUnavailableError extends AeternumProviderError {
  public readonly code = "PROVIDER_UNAVAILABLE";
}

export class ProviderTimeoutError extends AeternumProviderError {
  public readonly code = "PROVIDER_TIMEOUT";
}

export class ProviderCancelledError extends AeternumProviderError {
  public readonly code = "PROVIDER_CANCELLED";
}

export class ProviderAuthenticationError extends AeternumProviderError {
  public readonly code = "PROVIDER_AUTH_ERROR";
}

export class ProviderRateLimitError extends AeternumProviderError {
  public readonly code = "PROVIDER_RATE_LIMIT";
  public readonly retryAfterSeconds?: number;

  constructor(message: string, providerId: string, retryAfterSeconds?: number) {
    super(message, providerId);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ProviderInvalidResponseError extends AeternumProviderError {
  public readonly code = "PROVIDER_INVALID_RESPONSE";
}

export class CapabilityMismatchError extends AeternumProviderError {
  public readonly code = "CAPABILITY_MISMATCH";
}

export interface ProviderAttemptSummary {
  attemptNumber: number;
  providerId: string;
  providerLocation: string;
  latencyMs: number;
  canonicalResult: "SUCCESS" | "FAILED" | "CANCELLED";
  error?: {
    name: string;
    code: string;
    message: string;
  };
}

export class AllProvidersFailedError extends AeternumProviderError {
  public readonly code = "ALL_PROVIDERS_FAILED";
  public readonly capability: string;
  public readonly attempts: ProviderAttemptSummary[];
  public readonly lastError?: Error;

  constructor(
    message: string,
    capability: string,
    attempts: ProviderAttemptSummary[],
    lastError?: Error
  ) {
    super(message, attempts.at(-1)?.providerId || "unknown");
    this.capability = capability;
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

/**
 * Determina de forma canônica e determinística se um erro de execução de provider
 * é transiente/recuperável autorizando fallback para a nuvem.
 *
 * Invariante de Segurança: Cancelamento de usuário (ProviderCancelledError / AbortSignal)
 * e Falhas de Autenticação/Configuração NUNCA são recuperáveis.
 */
export function isRecoverableProviderError(error: unknown): boolean {
  if (!error) return false;

  // 1. Cancelamento do usuário (Barge-in): NUNCA deve sofrer fallback
  if (error instanceof ProviderCancelledError) {
    return false;
  }
  if (typeof error === "object" && (error as any).code === "PROVIDER_CANCELLED") {
    return false;
  }
  if (typeof error === "object" && (error as any).name === "AbortError") {
    return false;
  }

  // 2. Falhas de Autenticação / Chave de API: Não são transientes, requerem ação do usuário
  if (error instanceof ProviderAuthenticationError) {
    return false;
  }
  if (typeof error === "object" && (error as any).code === "PROVIDER_AUTH_ERROR") {
    return false;
  }

  // 3. Mismatch de Capacidade / All Providers Failed: Erros terminais
  if (error instanceof CapabilityMismatchError || error instanceof AllProvidersFailedError) {
    return false;
  }
  if (
    typeof error === "object" &&
    ((error as any).code === "CAPABILITY_MISMATCH" || (error as any).code === "ALL_PROVIDERS_FAILED")
  ) {
    return false;
  }

  // 4. Erros canônicos recuperáveis do sistema
  if (
    error instanceof ProviderUnavailableError ||
    error instanceof ProviderTimeoutError ||
    error instanceof ProviderRateLimitError ||
    error instanceof ProviderInvalidResponseError
  ) {
    return true;
  }

  const code = (error as any)?.code;
  if (
    code === "PROVIDER_UNAVAILABLE" ||
    code === "PROVIDER_TIMEOUT" ||
    code === "PROVIDER_RATE_LIMIT" ||
    code === "PROVIDER_INVALID_RESPONSE"
  ) {
    return true;
  }

  // 5. Erros genéricos de rede (fetch failed, ECONNREFUSED, ETIMEDOUT, etc)
  const message = (error as any)?.message || String(error);
  if (
    message.includes("fetch failed") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("UND_ERR_CONNECT_TIMEOUT")
  ) {
    return true;
  }

  return false;
}

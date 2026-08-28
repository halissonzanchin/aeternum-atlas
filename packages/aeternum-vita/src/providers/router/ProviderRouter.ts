import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  STTRequest,
  STTResponse,
  STTStreamChunk,
  TTSRequest,
  TTSResponse,
  TTSStreamChunk,
  ProviderExecutionContext,
  ProviderCancelledError,
  CapabilityMismatchError,
  AllProvidersFailedError,
  isRecoverableProviderError
} from "../types/index.ts";
import { BaseProvider } from "../contracts/BaseProvider.ts";
import { LLMProvider } from "../contracts/LLMProvider.ts";
import { STTProvider } from "../contracts/STTProvider.ts";
import { TTSProvider } from "../contracts/TTSProvider.ts";
import {
  ProviderRouterConfig,
  RouteMetadata,
  RouterCapability,
  RouterExecutionResult,
  SafeProviderErrorInfo
} from "./types.ts";
import { VoiceProfileRegistry, DEFAULT_VOICE_REGISTRY } from "../voice/VoiceProfileRegistry.ts";

const CANONICAL_ERROR_MESSAGES: Record<string, string> = {
  PROVIDER_TIMEOUT: "provider_timeout",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  PROVIDER_RATE_LIMIT: "provider_rate_limit",
  PROVIDER_INVALID_RESPONSE: "provider_invalid_response",
  PROVIDER_AUTH_ERROR: "provider_authentication_failed",
  PROVIDER_CANCELLED: "provider_cancelled",
  CAPABILITY_MISMATCH: "capability_mismatch",
  ALL_PROVIDERS_FAILED: "all_providers_failed"
};

/**
 * Sanitiza e normaliza erros de providers em metadados estritamente canônicos.
 * Invariante de Segurança: NUNCA inclui err.message bruto nos metadados da rota.
 */
export function toSafeProviderError(error: unknown): SafeProviderErrorInfo {
  if (!error || typeof error !== "object") {
    return {
      name: "Error",
      code: "PROVIDER_ERROR",
      message: "provider_error"
    };
  }

  const errObj = error as any;
  const name = typeof errObj.name === "string" ? errObj.name : "AeternumProviderError";
  const code =
    typeof errObj.code === "string"
      ? errObj.code
      : errObj.name === "AbortError"
      ? "PROVIDER_CANCELLED"
      : "PROVIDER_ERROR";

  const message = CANONICAL_ERROR_MESSAGES[code] || "provider_error";

  return { name, code, message };
}

export function toSafeFallbackReason(error: unknown): string {
  const safe = toSafeProviderError(error);
  return safe.code;
}

/**
 * Aeternum Provider Router
 *
 * Camada de orquestração puramente determinística para seleção inteligente de
 * providers com arquitetura LOCAL FIRST e CLOUD FALLBACK.
 *
 * Invariantes Críticos de Arquitetura:
 * 1. LOCAL FIRST: Se o provider local responder com sucesso, nenhum provider de nuvem é consultado.
 * 2. BARGE-IN / CANCELAMENTO: Se o usuário cancelar a execução (ProviderCancelledError ou AbortSignal),
 *    o roteamento é abortado imediatamente com ZERO chamadas de fallback à nuvem.
 * 3. FALHA APÓS PRIMEIRO CHUNK DE STREAM: Se um stream falhar após já ter emitido dados ao cliente,
 *    nunca sofre fallback (pois geraria chunks duplicados/corrompidos).
 *    Classificado como FAILED com o erro canônico correspondente (não CANCELLED).
 * 4. VERDADE DE CAPACIDADES: Deepgram/cloud não suporta streaming em tempo real nesta versão;
 *    nenhum streaming é simulado se o fallback não suportar.
 * 5. PERSONA != MODEL != VOICE: Perfis canônicos de voz são resolvidos exclusivamente via VoiceProfileRegistry.
 * 6. OBSERVABILIDADE PURA: Apenas metadados sanitarizados de rota são registrados (sem prompts, texto gerado,
 *    áudio ou credenciais).
 */
export class ProviderRouter {
  private readonly config: ProviderRouterConfig;
  private readonly voiceRegistry: VoiceProfileRegistry;

  constructor(config: ProviderRouterConfig) {
    this.config = config;
    this.voiceRegistry = config.voiceRegistry || DEFAULT_VOICE_REGISTRY;
  }

  // ==========================================
  // LLM ORCHESTRATION
  // ==========================================

  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    const result = await this.generateWithMetadata(request, context);
    return result.data;
  }

  async generateWithMetadata(
    request: LLMRequest,
    context?: ProviderExecutionContext
  ): Promise<RouterExecutionResult<LLMResponse>> {
    if (!this.config.llm?.primary) {
      throw new CapabilityMismatchError(
        "Nenhum LLMProvider primário configurado no ProviderRouter.",
        "router"
      );
    }

    return this.executeUnaryWithFallback<LLMResponse>(
      "LLM_GENERATE",
      this.config.llm.primary,
      this.config.llm.fallback,
      (provider: LLMProvider) => provider.generate(request, context),
      context
    );
  }

  async *stream(
    request: LLMRequest,
    context?: ProviderExecutionContext
  ): AsyncIterable<LLMStreamChunk> {
    if (!this.config.llm?.primary) {
      throw new CapabilityMismatchError(
        "Nenhum LLMProvider primário configurado no ProviderRouter.",
        "router"
      );
    }

    const primary = this.config.llm.primary;
    const fallback = this.config.llm.fallback;
    const capability: RouterCapability = "LLM_STREAM";

    const metadata: RouteMetadata = {
      capabilityRequested: capability,
      primaryProvider: primary.metadata.id,
      selectedProvider: primary.metadata.id,
      fallbackUsed: false,
      attempts: []
    };

    let primaryYielded = false;
    const t0 = performance.now();

    try {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Operação cancelada antes de iniciar.", primary.metadata.id);
      }

      for await (const chunk of primary.stream(request, context)) {
        primaryYielded = true;
        yield chunk;
      }

      const latencyMs = Math.round(performance.now() - t0);
      metadata.finalProvider = primary.metadata.id;
      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "SUCCESS"
      });
      this.config.onRouteComplete?.(metadata);
      return;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      const isCancelled =
        err instanceof ProviderCancelledError ||
        err?.code === "PROVIDER_CANCELLED" ||
        context?.signal?.aborted ||
        err?.name === "AbortError";

      if (isCancelled) {
        // A. ACTUAL USER CANCELLATION
        metadata.finalCanonicalError = "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 1,
          providerId: primary.metadata.id,
          providerLocation: primary.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: toSafeProviderError(err)
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      // Se não foi cancelamento:
      const safeErr = toSafeProviderError(err);
      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: safeErr
      });

      if (primaryYielded) {
        // B. PROVIDER FAILURE AFTER FIRST CHUNK:
        // Não sofrer fallback para não corromper o stream com dados repetidos.
        metadata.finalCanonicalError = safeErr.code;
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      if (!isRecoverableProviderError(err) || !fallback) {
        metadata.finalCanonicalError = fallback ? safeErr.code : "ALL_PROVIDERS_FAILED";
        this.config.onRouteComplete?.(metadata);
        if (!fallback) {
          throw new AllProvidersFailedError("Todos os provedores falharam para stream LLM.", capability, metadata.attempts, err);
        }
        throw err;
      }

      metadata.fallbackUsed = true;
      metadata.fallbackReason = toSafeFallbackReason(err);
      metadata.selectedProvider = fallback.metadata.id;
    }

    // Attempt Fallback
    const t1 = performance.now();
    try {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Operação cancelada antes do fallback.", fallback.metadata.id);
      }

      for await (const chunk of fallback.stream(request, context)) {
        yield chunk;
      }

      const latencyMs = Math.round(performance.now() - t1);
      metadata.finalProvider = fallback.metadata.id;
      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "SUCCESS"
      });
      this.config.onRouteComplete?.(metadata);
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t1);
      const isCancelled =
        err instanceof ProviderCancelledError ||
        err?.code === "PROVIDER_CANCELLED" ||
        context?.signal?.aborted ||
        err?.name === "AbortError";

      if (isCancelled) {
        metadata.finalCanonicalError = "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 2,
          providerId: fallback.metadata.id,
          providerLocation: fallback.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: toSafeProviderError(err)
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      const safeErr = toSafeProviderError(err);
      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: safeErr
      });
      metadata.finalCanonicalError = "ALL_PROVIDERS_FAILED";
      this.config.onRouteComplete?.(metadata);
      throw new AllProvidersFailedError("Todos os provedores falharam para stream LLM.", capability, metadata.attempts, err);
    }
  }

  // ==========================================
  // STT ORCHESTRATION
  // ==========================================

  async transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse> {
    const result = await this.transcribeWithMetadata(request, context);
    return result.data;
  }

  async transcribeWithMetadata(
    request: STTRequest,
    context?: ProviderExecutionContext
  ): Promise<RouterExecutionResult<STTResponse>> {
    if (!this.config.stt?.primary) {
      throw new CapabilityMismatchError(
        "Nenhum STTProvider primário configurado no ProviderRouter.",
        "router"
      );
    }

    return this.executeUnaryWithFallback<STTResponse>(
      "STT_TRANSCRIBE",
      this.config.stt.primary,
      this.config.stt.fallback,
      (provider: STTProvider) => provider.transcribe(request, context),
      context
    );
  }

  async *streamTranscription(
    audioStream: AsyncIterable<Uint8Array>,
    options: Omit<STTRequest, "audioBuffer">,
    context?: ProviderExecutionContext
  ): AsyncIterable<STTStreamChunk> {
    if (!this.config.stt?.primary) {
      throw new CapabilityMismatchError(
        "Nenhum STTProvider primário configurado no ProviderRouter.",
        "router"
      );
    }

    const primary = this.config.stt.primary;
    const fallback = this.config.stt.fallback;
    const capability: RouterCapability = "STT_STREAM";

    const metadata: RouteMetadata = {
      capabilityRequested: capability,
      primaryProvider: primary.metadata.id,
      selectedProvider: primary.metadata.id,
      fallbackUsed: false,
      attempts: []
    };

    let primaryYielded = false;
    const t0 = performance.now();

    try {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Transcrição cancelada antes de iniciar.", primary.metadata.id);
      }

      for await (const chunk of primary.streamTranscription(audioStream, options, context)) {
        primaryYielded = true;
        yield chunk;
      }

      const latencyMs = Math.round(performance.now() - t0);
      metadata.finalProvider = primary.metadata.id;
      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "SUCCESS"
      });
      this.config.onRouteComplete?.(metadata);
      return;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      const isCancelled =
        err instanceof ProviderCancelledError ||
        err?.code === "PROVIDER_CANCELLED" ||
        context?.signal?.aborted ||
        err?.name === "AbortError";

      if (isCancelled) {
        metadata.finalCanonicalError = "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 1,
          providerId: primary.metadata.id,
          providerLocation: primary.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: toSafeProviderError(err)
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      const safeErr = toSafeProviderError(err);
      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: safeErr
      });

      if (primaryYielded) {
        metadata.finalCanonicalError = safeErr.code;
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      if (!isRecoverableProviderError(err) || !fallback) {
        metadata.finalCanonicalError = fallback ? safeErr.code : "ALL_PROVIDERS_FAILED";
        this.config.onRouteComplete?.(metadata);
        if (!fallback) {
          throw new AllProvidersFailedError("Todos os provedores falharam para stream STT.", capability, metadata.attempts, err);
        }
        throw err;
      }

      metadata.fallbackUsed = true;
      metadata.fallbackReason = toSafeFallbackReason(err);
      metadata.selectedProvider = fallback.metadata.id;

      // Validar se o fallback suporta streaming real
      if (typeof (fallback as any).streamTranscription !== "function" || fallback.metadata.id === "deepgram-stt-cloud") {
        const mismatchErr = new CapabilityMismatchError(
          `O provider fallback [${fallback.metadata.id}] não suporta streaming de áudio em tempo real nesta versão.`,
          fallback.metadata.id
        );
        metadata.finalCanonicalError = "CAPABILITY_MISMATCH";
        metadata.attempts.push({
          attemptNumber: 2,
          providerId: fallback.metadata.id,
          providerLocation: fallback.metadata.location,
          latencyMs: 0,
          canonicalResult: "FAILED",
          error: toSafeProviderError(mismatchErr)
        });
        this.config.onRouteComplete?.(metadata);
        throw mismatchErr;
      }
    }
  }

  // ==========================================
  // TTS ORCHESTRATION
  // ==========================================

  async synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse> {
    const result = await this.synthesizeWithMetadata(request, context);
    return result.data;
  }

  async synthesizeWithMetadata(
    request: TTSRequest,
    context?: ProviderExecutionContext
  ): Promise<RouterExecutionResult<TTSResponse>> {
    if (!this.config.tts?.primary) {
      throw new CapabilityMismatchError(
        "Nenhum TTSProvider primário configurado no ProviderRouter.",
        "router"
      );
    }

    return this.executeUnaryWithFallback<TTSResponse>(
      "TTS_SYNTHESIZE",
      this.config.tts.primary,
      this.config.tts.fallback,
      (provider: TTSProvider) => provider.synthesize(request, context),
      context
    );
  }

  async *streamSynthesis(
    request: TTSRequest,
    context?: ProviderExecutionContext
  ): AsyncIterable<TTSStreamChunk> {
    if (!this.config.tts?.primary) {
      throw new CapabilityMismatchError(
        "Nenhum TTSProvider primário configurado no ProviderRouter.",
        "router"
      );
    }

    const primary = this.config.tts.primary;
    const fallback = this.config.tts.fallback;
    const capability: RouterCapability = "TTS_STREAM";

    const metadata: RouteMetadata = {
      capabilityRequested: capability,
      primaryProvider: primary.metadata.id,
      selectedProvider: primary.metadata.id,
      fallbackUsed: false,
      attempts: []
    };

    let primaryYielded = false;
    const t0 = performance.now();

    try {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Síntese de voz cancelada antes de iniciar.", primary.metadata.id);
      }

      for await (const chunk of primary.streamSynthesis(request, context)) {
        primaryYielded = true;
        yield chunk;
      }

      const latencyMs = Math.round(performance.now() - t0);
      metadata.finalProvider = primary.metadata.id;
      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "SUCCESS"
      });
      this.config.onRouteComplete?.(metadata);
      return;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      const isCancelled =
        err instanceof ProviderCancelledError ||
        err?.code === "PROVIDER_CANCELLED" ||
        context?.signal?.aborted ||
        err?.name === "AbortError";

      if (isCancelled) {
        metadata.finalCanonicalError = "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 1,
          providerId: primary.metadata.id,
          providerLocation: primary.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: toSafeProviderError(err)
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      const safeErr = toSafeProviderError(err);
      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: safeErr
      });

      if (primaryYielded) {
        metadata.finalCanonicalError = safeErr.code;
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      if (!isRecoverableProviderError(err) || !fallback) {
        metadata.finalCanonicalError = fallback ? safeErr.code : "ALL_PROVIDERS_FAILED";
        this.config.onRouteComplete?.(metadata);
        if (!fallback) {
          throw new AllProvidersFailedError("Todos os provedores falharam para stream TTS.", capability, metadata.attempts, err);
        }
        throw err;
      }

      metadata.fallbackUsed = true;
      metadata.fallbackReason = toSafeFallbackReason(err);
      metadata.selectedProvider = fallback.metadata.id;
    }

    // Fallback Stream
    const t1 = performance.now();
    try {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Síntese de voz cancelada antes do fallback.", fallback.metadata.id);
      }

      for await (const chunk of fallback.streamSynthesis(request, context)) {
        yield chunk;
      }

      const latencyMs = Math.round(performance.now() - t1);
      metadata.finalProvider = fallback.metadata.id;
      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "SUCCESS"
      });
      this.config.onRouteComplete?.(metadata);
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t1);
      const isCancelled =
        err instanceof ProviderCancelledError ||
        err?.code === "PROVIDER_CANCELLED" ||
        context?.signal?.aborted ||
        err?.name === "AbortError";

      if (isCancelled) {
        metadata.finalCanonicalError = "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 2,
          providerId: fallback.metadata.id,
          providerLocation: fallback.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: toSafeProviderError(err)
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      const safeErr = toSafeProviderError(err);
      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: safeErr
      });
      metadata.finalCanonicalError = "ALL_PROVIDERS_FAILED";
      this.config.onRouteComplete?.(metadata);
      throw new AllProvidersFailedError("Todos os provedores falharam para stream TTS.", capability, metadata.attempts, err);
    }
  }

  // ==========================================
  // UNARY TEMPLATE ORCHESTRATION
  // ==========================================

  private async executeUnaryWithFallback<TResponse>(
    capability: RouterCapability,
    primary: BaseProvider,
    fallback: BaseProvider | undefined,
    executeFn: (provider: any) => Promise<TResponse>,
    context?: ProviderExecutionContext
  ): Promise<RouterExecutionResult<TResponse>> {
    const metadata: RouteMetadata = {
      capabilityRequested: capability,
      primaryProvider: primary.metadata.id,
      selectedProvider: primary.metadata.id,
      fallbackUsed: false,
      attempts: []
    };

    // Attempt 1: Primary (LOCAL FIRST)
    const t0 = performance.now();
    try {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Operação cancelada antes da execução.", primary.metadata.id);
      }

      const response = await executeFn(primary);
      const latencyMs = Math.round(performance.now() - t0);

      metadata.finalProvider = primary.metadata.id;
      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "SUCCESS"
      });

      this.config.onRouteComplete?.(metadata);
      return { data: response, metadata };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      const isCancelled =
        err instanceof ProviderCancelledError ||
        err?.code === "PROVIDER_CANCELLED" ||
        context?.signal?.aborted ||
        err?.name === "AbortError";

      // Invariante de Segurança: Cancelamento do usuário (Barge-in) NUNCA sofre fallback
      if (isCancelled) {
        metadata.finalCanonicalError = "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 1,
          providerId: primary.metadata.id,
          providerLocation: primary.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: toSafeProviderError(err)
        });

        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      const safeErr = toSafeProviderError(err);
      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: safeErr
      });

      // Se o erro não for recuperável ou se não houver fallback configurado
      if (!isRecoverableProviderError(err) || !fallback) {
        metadata.finalCanonicalError = fallback ? safeErr.code : "ALL_PROVIDERS_FAILED";
        this.config.onRouteComplete?.(metadata);
        if (!fallback) {
          throw new AllProvidersFailedError(
            `Todos os provedores falharam para a capacidade ${capability}.`,
            capability,
            metadata.attempts,
            err
          );
        }
        throw err;
      }

      metadata.fallbackUsed = true;
      metadata.fallbackReason = toSafeFallbackReason(err);
      metadata.selectedProvider = fallback.metadata.id;
    }

    // Attempt 2: Fallback (CLOUD)
    const t1 = performance.now();
    try {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Operação cancelada antes do fallback.", fallback.metadata.id);
      }

      const response = await executeFn(fallback);
      const latencyMs = Math.round(performance.now() - t1);

      metadata.finalProvider = fallback.metadata.id;
      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "SUCCESS"
      });

      this.config.onRouteComplete?.(metadata);
      return { data: response, metadata };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t1);
      const isCancelled =
        err instanceof ProviderCancelledError ||
        err?.code === "PROVIDER_CANCELLED" ||
        context?.signal?.aborted ||
        err?.name === "AbortError";

      if (isCancelled) {
        metadata.finalCanonicalError = "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 2,
          providerId: fallback.metadata.id,
          providerLocation: fallback.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: toSafeProviderError(err)
        });

        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      const safeErr = toSafeProviderError(err);
      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: safeErr
      });

      metadata.finalCanonicalError = "ALL_PROVIDERS_FAILED";
      this.config.onRouteComplete?.(metadata);

      throw new AllProvidersFailedError(
        `Todos os provedores configurados falharam para a capacidade ${capability}.`,
        capability,
        metadata.attempts,
        err
      );
    }
  }
}

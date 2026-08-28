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
import { ProviderRouterConfig, RouteMetadata, RouterCapability, RouterExecutionResult } from "./types.ts";
import { VoiceProfileRegistry, DEFAULT_VOICE_REGISTRY } from "../voice/VoiceProfileRegistry.ts";

/**
 * Aeternum Provider Router
 *
 * Camada de orquestração puramente determinística para seleção inteligente de
 * providers com arquitetura LOCAL FIRST e CLOUD FALLBACK.
 *
 * Invariantes Críticos de Arquitetura:
 * 1. LOCAL FIRST: Se o provider local estiver saudável e responder, nenhum provider de nuvem é consultado.
 * 2. BARGE-IN / CANCELAMENTO: Se o usuário cancelar a execução (ProviderCancelledError ou AbortSignal),
 *    o roteamento é abortado imediatamente com ZERO chamadas de fallback à nuvem.
 * 3. VERDADE DE CAPACIDADES: Deepgram/cloud não suporta streaming em tempo real nesta versão;
 *    nenhum streaming é simulado se o fallback não suportar.
 * 4. PERSONA != MODEL != VOICE: Perfis canônicos de voz são resolvidos exclusivamente via VoiceProfileRegistry.
 * 5. OBSERVABILIDADE PURA: Apenas metadados sanitarizados de rota são registrados (sem prompts, texto gerado,
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

      // Invariante: Se cancelado ou se já começou a emitir chunks para o usuário, nunca faça fallback
      if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED" || context?.signal?.aborted || primaryYielded) {
        metadata.finalCanonicalError = err?.code || "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 1,
          providerId: primary.metadata.id,
          providerLocation: primary.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: { name: err?.name || "Error", code: err?.code || "PROVIDER_CANCELLED", message: err?.message || String(err) }
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: { name: err?.name || "Error", code: err?.code || "PROVIDER_ERROR", message: err?.message || String(err) }
      });

      if (!isRecoverableProviderError(err) || !fallback) {
        metadata.finalCanonicalError = fallback ? (err?.code || "PROVIDER_ERROR") : "ALL_PROVIDERS_FAILED";
        this.config.onRouteComplete?.(metadata);
        if (!fallback) {
          throw new AllProvidersFailedError("Todos os provedores falharam para stream LLM.", capability, metadata.attempts, err);
        }
        throw err;
      }

      metadata.fallbackUsed = true;
      metadata.fallbackReason = err?.message || err?.code;
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
      if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED" || context?.signal?.aborted) {
        metadata.finalCanonicalError = err?.code || "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 2,
          providerId: fallback.metadata.id,
          providerLocation: fallback.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: { name: err?.name || "Error", code: err?.code || "PROVIDER_CANCELLED", message: err?.message || String(err) }
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: { name: err?.name || "Error", code: err?.code || "PROVIDER_ERROR", message: err?.message || String(err) }
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

      if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED" || context?.signal?.aborted || primaryYielded) {
        metadata.finalCanonicalError = err?.code || "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 1,
          providerId: primary.metadata.id,
          providerLocation: primary.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: { name: err?.name || "Error", code: err?.code || "PROVIDER_CANCELLED", message: err?.message || String(err) }
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: { name: err?.name || "Error", code: err?.code || "PROVIDER_ERROR", message: err?.message || String(err) }
      });

      if (!isRecoverableProviderError(err) || !fallback) {
        metadata.finalCanonicalError = fallback ? (err?.code || "PROVIDER_ERROR") : "ALL_PROVIDERS_FAILED";
        this.config.onRouteComplete?.(metadata);
        if (!fallback) {
          throw new AllProvidersFailedError("Todos os provedores falharam para stream STT.", capability, metadata.attempts, err);
        }
        throw err;
      }

      // Regra de Ouro: Deepgram fallback é batch-only nesta versão. Se streaming em tempo real for exigido,
      // rejeitar com CapabilityMismatchError em vez de fingir streaming silenciosamente.
      metadata.fallbackUsed = true;
      metadata.fallbackReason = err?.message || err?.code;
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
          error: { name: "CapabilityMismatchError", code: "CAPABILITY_MISMATCH", message: mismatchErr.message }
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
      (provider: TTSProvider) => {
        return provider.synthesize(request, context);
      },
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

      if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED" || context?.signal?.aborted || primaryYielded) {
        metadata.finalCanonicalError = err?.code || "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 1,
          providerId: primary.metadata.id,
          providerLocation: primary.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: { name: err?.name || "Error", code: err?.code || "PROVIDER_CANCELLED", message: err?.message || String(err) }
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: { name: err?.name || "Error", code: err?.code || "PROVIDER_ERROR", message: err?.message || String(err) }
      });

      if (!isRecoverableProviderError(err) || !fallback) {
        metadata.finalCanonicalError = fallback ? (err?.code || "PROVIDER_ERROR") : "ALL_PROVIDERS_FAILED";
        this.config.onRouteComplete?.(metadata);
        if (!fallback) {
          throw new AllProvidersFailedError("Todos os provedores falharam para stream TTS.", capability, metadata.attempts, err);
        }
        throw err;
      }

      metadata.fallbackUsed = true;
      metadata.fallbackReason = err?.message || err?.code;
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
      if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED" || context?.signal?.aborted) {
        metadata.finalCanonicalError = err?.code || "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 2,
          providerId: fallback.metadata.id,
          providerLocation: fallback.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: { name: err?.name || "Error", code: err?.code || "PROVIDER_CANCELLED", message: err?.message || String(err) }
        });
        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: { name: err?.name || "Error", code: err?.code || "PROVIDER_ERROR", message: err?.message || String(err) }
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

      // Invariante de Segurança: Cancelamento do usuário (Barge-in) NUNCA sofre fallback
      if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED" || context?.signal?.aborted) {
        metadata.finalCanonicalError = err?.code || "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 1,
          providerId: primary.metadata.id,
          providerLocation: primary.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: { name: err?.name || "Error", code: err?.code || "PROVIDER_CANCELLED", message: err?.message || String(err) }
        });

        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      metadata.attempts.push({
        attemptNumber: 1,
        providerId: primary.metadata.id,
        providerLocation: primary.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: { name: err?.name || "Error", code: err?.code || "PROVIDER_ERROR", message: err?.message || String(err) }
      });

      // Se o erro não for recuperável ou se não houver fallback configurado
      if (!isRecoverableProviderError(err) || !fallback) {
        metadata.finalCanonicalError = fallback ? (err?.code || "PROVIDER_ERROR") : "ALL_PROVIDERS_FAILED";
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
      metadata.fallbackReason = err?.message || err?.code;
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

      if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED" || context?.signal?.aborted) {
        metadata.finalCanonicalError = err?.code || "PROVIDER_CANCELLED";
        metadata.attempts.push({
          attemptNumber: 2,
          providerId: fallback.metadata.id,
          providerLocation: fallback.metadata.location,
          latencyMs,
          canonicalResult: "CANCELLED",
          error: { name: err?.name || "Error", code: err?.code || "PROVIDER_CANCELLED", message: err?.message || String(err) }
        });

        this.config.onRouteComplete?.(metadata);
        throw err;
      }

      metadata.attempts.push({
        attemptNumber: 2,
        providerId: fallback.metadata.id,
        providerLocation: fallback.metadata.location,
        latencyMs,
        canonicalResult: "FAILED",
        error: { name: err?.name || "Error", code: err?.code || "PROVIDER_ERROR", message: err?.message || String(err) }
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

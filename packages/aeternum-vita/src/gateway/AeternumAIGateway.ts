import http from "node:http";
import crypto from "node:crypto";
import {
  GatewayConfig,
  GatewayHealthResponse,
  GatewayReadinessResponse,
  GatewaySuccessResponse,
  GatewayErrorResponse,
  ProviderHealthEntry,
  ProviderHealthStatus
} from "./types.ts";
import { VoiceProfileRegistry } from "../providers/voice/VoiceProfileRegistry.ts";
import {
  LLMRequest,
  STTRequest,
  TTSRequest,
  ProviderExecutionContext,
  ProviderCancelledError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderAuthenticationError,
  AllProvidersFailedError,
  CapabilityMismatchError,
  AeternumProviderError
} from "../providers/types/index.ts";

export class AeternumAIGateway {
  private readonly config: Required<GatewayConfig>;
  private server: http.Server | null = null;
  private isRunning = false;
  private isShuttingDown = false;
  private activeRequests = 0;
  private openSockets = new Set<import("node:net").Socket>();

  constructor(config: GatewayConfig) {
    const host = config.host || "127.0.0.1";
    const authMode = config.authMode || "INTERNAL_DEV";
    const providerTimeoutMs = config.providerTimeoutMs || 25000;
    const gatewayRequestTimeoutMs = config.gatewayRequestTimeoutMs || 30000;
    const maxConcurrentRequests = config.maxConcurrentRequests || 50;
    const shutdownTimeoutMs = config.shutdownTimeoutMs || 5000;

    const isLoopback = host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "::ffff:127.0.0.1";
    if (!isLoopback && authMode !== "SUPABASE_JWT" && authMode !== "SERVICE_TOKEN") {
      throw new Error("Binding público proibido sem autenticação segura (SUPABASE_JWT ou SERVICE_TOKEN).");
    }

    if (authMode === "SERVICE_TOKEN") {
      const primary = (config.authToken || process.env.AETERNUM_AI_GATEWAY_TOKEN || process.env.PRIMARY_SERVICE_TOKEN || "").trim();
      if (!primary) {
        throw new Error("Modo SERVICE_TOKEN requer configuração de authToken seguro não-vazio (PRIMARY_SERVICE_TOKEN obrigatório).");
      }
    }

    if (providerTimeoutMs <= 0 || gatewayRequestTimeoutMs <= 0) {
      throw new Error("Valores de timeout devem ser estritamente positivos.");
    }

    if (providerTimeoutMs >= gatewayRequestTimeoutMs) {
      throw new Error("Invariante de timeout violado: providerTimeoutMs deve ser estritamente menor que gatewayRequestTimeoutMs.");
    }

    if (maxConcurrentRequests <= 0) {
      throw new Error("maxConcurrentRequests deve ser maior que zero.");
    }

    this.config = {
      port: config.port || Number(process.env.AETERNUM_AI_GATEWAY_PORT) || 8081,
      host,
      router: config.router,
      version: config.version || "1.0.0",
      mode: config.mode || "local_first",
      authMode,
      authToken: (config.authToken || process.env.AETERNUM_AI_GATEWAY_TOKEN || process.env.PRIMARY_SERVICE_TOKEN || "").trim(),
      secondaryAuthToken: (config.secondaryAuthToken || process.env.SECONDARY_SERVICE_TOKEN || "").trim(),
      gatewayRequestTimeoutMs,
      providerTimeoutMs,
      maxConcurrentRequests,
      shutdownTimeoutMs,
      maxJsonBodyBytes: config.maxJsonBodyBytes || 1024 * 1024,
      maxAudioBodyBytes: config.maxAudioBodyBytes || 15 * 1024 * 1024,
      logger: config.logger || {
        info: (evt, meta) => console.log(JSON.stringify({ level: "INFO", event: evt, timestamp: new Date().toISOString(), ...meta })),
        warn: (evt, meta) => console.warn(JSON.stringify({ level: "WARN", event: evt, timestamp: new Date().toISOString(), ...meta })),
        error: (evt, meta) => console.error(JSON.stringify({ level: "ERROR", event: evt, timestamp: new Date().toISOString(), ...meta }))
      },
      healthRegistry: config.healthRegistry || {},
      jwtValidator: config.jwtValidator
    } as any;
  }

  public get port(): number {
    return this.config.port;
  }

  public get running(): boolean {
    return this.isRunning;
  }

  // ==========================================
  // SERVER LIFECYCLE
  // ==========================================

  async start(): Promise<void> {
    if (this.isRunning) return;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));

      this.server.on("error", (err) => {
        this.config.logger.error("GATEWAY_START_ERROR", { error: err.message });
        reject(err);
      });

      this.server.on("connection", (socket) => {
        this.openSockets.add(socket);
        socket.on("close", () => {
          this.openSockets.delete(socket);
        });
      });

      this.server.listen(this.config.port, this.config.host, () => {
        this.isRunning = true;
        this.config.logger.info("GATEWAY_STARTED", {
          port: this.config.port,
          host: this.config.host,
          mode: this.config.mode
        });
        resolve();
      });
    });
  }

  async stop(graceTimeoutMs?: number): Promise<void> {
    if (!this.isRunning || !this.server) return;

    this.isShuttingDown = true;
    const deadlineMs = graceTimeoutMs ?? this.config.shutdownTimeoutMs ?? 5000;
    const serverRef = this.server;

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      const finish = (err?: Error | null) => {
        if (resolved) return;
        resolved = true;
        this.isRunning = false;
        this.isShuttingDown = false;
        if (err) {
          this.config.logger.error("GATEWAY_STOP_ERROR", { error: err.message });
          reject(err);
        } else {
          this.config.logger.info("GATEWAY_STOPPED");
          resolve();
        }
      };

      if (typeof serverRef.closeIdleConnections === "function") {
        serverRef.closeIdleConnections();
      }

      serverRef.close((err) => {
        if (err && (err as any).code !== "ERR_SERVER_NOT_RUNNING") {
          finish(err);
        } else {
          finish(null);
        }
      });

      const deadlineTimer = setTimeout(() => {
        if (typeof serverRef.closeAllConnections === "function") {
          serverRef.closeAllConnections();
        }
        for (const socket of this.openSockets) {
          socket.destroy();
        }
        this.openSockets.clear();
        finish(null);
      }, deadlineMs);

      const pollInterval = setInterval(() => {
        if (this.activeRequests === 0) {
          clearInterval(pollInterval);
          clearTimeout(deadlineTimer);
          if (typeof serverRef.closeIdleConnections === "function") {
            serverRef.closeIdleConnections();
          }
          finish(null);
        }
      }, 25);
    });
  }

  // ==========================================
  // REQUEST DISPATCHER & LIFECYCLE
  // ==========================================

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const start = performance.now();
    const rawRequestId = req.headers["x-request-id"];
    const requestId = (typeof rawRequestId === "string" && rawRequestId.trim())
      ? rawRequestId.trim()
      : `req-${crypto.randomUUID()}`;

    res.setHeader("X-Request-Id", requestId);

    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    const path = url.pathname;
    const method = req.method?.toUpperCase();

    // 1. Liveness check público do Gateway
    if (method === "GET" && path === "/health") {
      await this.handleHealth(req, res, requestId);
      return;
    }

    // 2. Readiness check público do Gateway
    if (method === "GET" && path === "/ready") {
      await this.handleReady(req, res, requestId);
      return;
    }

    // 3. Verificação de Estado de Encerramento (Graceful Shutdown)
    if (this.isShuttingDown) {
      this.sendError(res, 503, "SERVICE_UNAVAILABLE", requestId, "gateway_shutting_down", "Gateway em processo de encerramento gracioso.");
      return;
    }

    // 4. Concorrência / Backpressure Bounded Guard
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      this.sendError(res, 429, "RATE_LIMITED", requestId, "concurrency_limit_exceeded", "Gateway com capacidade máxima atingida. Tente novamente em instantes.");
      return;
    }

    this.activeRequests++;

    // 5. Verificação de Autenticação
    if (!await this.authenticateRequest(req, res, requestId)) {
      this.activeRequests--;
      return;
    }

    // 3. Setup de Cancelamento & Deadline do Gateway
    const abortController = new AbortController();
    let isClientAborted = false;
    let isGatewayTimeout = false;

    req.on("aborted", () => {
      isClientAborted = true;
      abortController.abort("CLIENT_ABORT");
    });
    res.on("close", () => {
      if (!res.writableEnded && !res.writableFinished) {
        isClientAborted = true;
        abortController.abort("CLIENT_ABORT");
      }
    });

    let deadlineTimer: NodeJS.Timeout | undefined;
    const deadlinePromise = new Promise<never>((_, reject) => {
      deadlineTimer = setTimeout(() => {
        isGatewayTimeout = true;
        abortController.abort("GATEWAY_DEADLINE_EXCEEDED");
        const err = new Error("GATEWAY_TIMEOUT");
        (err as any).code = "GATEWAY_TIMEOUT";
        reject(err);
      }, this.config.gatewayRequestTimeoutMs);
    });

    const routeExecution = async () => {
      if (method === "POST" && path === "/v1/llm/generate") {
        await this.handleLLMGenerate(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/llm/stream") {
        await this.handleLLMStream(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/chat/completions") {
        await this.handleOpenAIChatCompletions(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/stt/transcribe") {
        await this.handleSTTTranscribe(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/audio/transcriptions") {
        await this.handleOpenAIAudioTranscriptions(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/tts/synthesize") {
        await this.handleTTSSynthesize(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/audio/speech") {
        await this.handleOpenAIAudioSpeech(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/tts/stream") {
        await this.handleTTSStream(req, res, requestId, abortController);
      } else {
        this.sendError(res, 404, "BAD_REQUEST", requestId, "NOT_FOUND", "Endpoint não encontrado.");
      }
    };

    try {
      await Promise.race([routeExecution(), deadlinePromise]);
    } catch (err: any) {
      if (isGatewayTimeout || err?.code === "GATEWAY_TIMEOUT") {
        this.sendError(res, 504, "GATEWAY_TIMEOUT", requestId, "gateway_timeout");
      } else if (isClientAborted || err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED") {
        this.sendError(res, 499, "PROVIDER_CANCELLED", requestId, "request_cancelled");
      } else {
        this.handleGenericError(res, err, requestId);
      }
    } finally {
      this.activeRequests--;
      if (deadlineTimer) clearTimeout(deadlineTimer);
      const durationMs = Math.round(performance.now() - start);
      this.config.logger.info("GATEWAY_REQUEST_COMPLETED", {
        requestId,
        route: path,
        method,
        durationMs,
        statusCode: res.statusCode
      });
    }
  }

  // ==========================================
  // HANDLERS
  // ==========================================

  private async checkProviderHealth(entry?: ProviderHealthEntry): Promise<ProviderHealthStatus> {
    if (!entry || !entry.enabled) {
      return { enabled: false, status: "UNAVAILABLE" };
    }

    const healthContext: ProviderExecutionContext = {
      requestId: `health-${crypto.randomUUID()}`,
      timeoutMs: 1500
    };

    try {
      const h = await entry.provider.health(healthContext);
      return {
        enabled: true,
        status: h.status,
        latencyMs: h.latencyMs
      };
    } catch {
      return {
        enabled: true,
        status: "UNAVAILABLE"
      };
    }
  }

  private async handleHealth(req: http.IncomingMessage, res: http.ServerResponse, requestId: string): Promise<void> {
    const isAlive = this.isRunning && !this.isShuttingDown;
    const body = {
      status: isAlive ? "HEALTHY" : "UNAVAILABLE",
      gateway_version: this.config.version,
      mode: this.config.mode,
      auth_mode: this.config.authMode,
      timestamp: new Date().toISOString()
    };

    res.statusCode = isAlive ? 200 : 503;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Request-Id", requestId);
    res.end(JSON.stringify(body));
  }

  private async handleReady(req: http.IncomingMessage, res: http.ServerResponse, requestId: string): Promise<void> {
    const reg = this.config.healthRegistry;

    const [llm_local, llm_cloud, stt_local, stt_cloud, tts_local, tts_cloud] = await Promise.all([
      this.checkProviderHealth(reg.llm_local),
      this.checkProviderHealth(reg.llm_cloud),
      this.checkProviderHealth(reg.stt_local),
      this.checkProviderHealth(reg.stt_cloud),
      this.checkProviderHealth(reg.tts_local),
      this.checkProviderHealth(reg.tts_cloud)
    ]);

    const isCapabilityServiceable = (local: ProviderHealthStatus, cloud: ProviderHealthStatus) => {
      if (!local.enabled && !cloud.enabled) return true;
      const localOk = local.enabled && (local.status === "HEALTHY" || local.status === "DEGRADED");
      const cloudOk = cloud.enabled && (cloud.status === "HEALTHY" || cloud.status === "DEGRADED");
      return localOk || cloudOk;
    };

    const toSanitizedState = (p: ProviderHealthStatus): "healthy" | "degraded" | "unavailable" | "disabled" => {
      if (!p.enabled) return "disabled";
      if (p.status === "HEALTHY") return "healthy";
      if (p.status === "DEGRADED") return "degraded";
      return "unavailable";
    };

    const llmOk = isCapabilityServiceable(llm_local, llm_cloud);
    const sttOk = isCapabilityServiceable(stt_local, stt_cloud);
    const ttsOk = isCapabilityServiceable(tts_local, tts_cloud);

    const anyCloudEnabled = Boolean(llm_cloud.enabled || stt_cloud.enabled || tts_cloud.enabled);
    const anyCloudHealthyOrDegraded = Boolean(
      (llm_cloud.enabled && (llm_cloud.status === "HEALTHY" || llm_cloud.status === "DEGRADED")) ||
      (stt_cloud.enabled && (stt_cloud.status === "HEALTHY" || stt_cloud.status === "DEGRADED")) ||
      (tts_cloud.enabled && (tts_cloud.status === "HEALTHY" || tts_cloud.status === "DEGRADED"))
    );

    let cloudFallbackState: "configured" | "unavailable" | "disabled" = "disabled";
    if (anyCloudEnabled) {
      cloudFallbackState = anyCloudHealthyOrDegraded ? "configured" : "unavailable";
    }

    let readinessStatus: "READY" | "DEGRADED" | "NOT_READY" = "READY";

    if (!llmOk || !sttOk || !ttsOk) {
      readinessStatus = "NOT_READY";
    } else {
      const anyLocalDegradedOrDown = Boolean(
        (llm_local.enabled && llm_local.status !== "HEALTHY") ||
        (stt_local.enabled && stt_local.status !== "HEALTHY") ||
        (tts_local.enabled && tts_local.status !== "HEALTHY")
      );

      if (anyLocalDegradedOrDown) {
        readinessStatus = anyCloudHealthyOrDegraded ? "DEGRADED" : "NOT_READY";
      }
    }

    const body: GatewayReadinessResponse = {
      status: readinessStatus,
      gateway: this.isRunning && !this.isShuttingDown ? "ready" : "not_ready",
      router: this.config.router ? "ready" : "not_ready",
      providers: {
        local_llm: toSanitizedState(llm_local),
        local_stt: toSanitizedState(stt_local),
        local_tts: toSanitizedState(tts_local),
        cloud_fallback: cloudFallbackState
      },
      timestamp: new Date().toISOString()
    };

    res.statusCode = readinessStatus === "NOT_READY" ? 503 : 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Request-Id", requestId);
    res.end(JSON.stringify(body));
  }
  private async handleLLMGenerate(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    abortController: AbortController
  ): Promise<void> {
    const body = await this.readJsonBody<LLMRequest>(req, res, requestId, this.config.maxJsonBodyBytes);
    if (res.writableEnded) return;

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "Campo 'messages' obrigatório.");
      return;
    }

    const result = await this.config.router.generateWithMetadata(body, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.providerTimeoutMs
    });

    const response: GatewaySuccessResponse<any> = {
      success: true,
      data: result.data,
      metadata: {
        requestId,
        capability: result.metadata.capabilityRequested,
        primaryProvider: result.metadata.primaryProvider,
        finalProvider: result.metadata.finalProvider,
        fallbackUsed: result.metadata.fallbackUsed,
        fallbackReason: result.metadata.fallbackReason,
        attemptCount: result.metadata.attempts.length,
        latencyMs: result.metadata.attempts.reduce((acc, a) => acc + a.latencyMs, 0)
      }
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
  }

  private async handleLLMStream(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    abortController: AbortController
  ): Promise<void> {
    const body = await this.readJsonBody<LLMRequest>(req, res, requestId, this.config.maxJsonBodyBytes);
    if (res.writableEnded) return;

    if (!body || !Array.isArray(body.messages)) {
      this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "Campo 'messages' obrigatório.");
      return;
    }

    let streamHeadersSent = false;

    try {
      for await (const chunk of this.config.router.stream(body, {
        requestId,
        signal: abortController.signal,
        timeoutMs: this.config.providerTimeoutMs
      })) {
        if (!streamHeadersSent) {
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("X-Request-Id", requestId);
          res.statusCode = 200;
          streamHeadersSent = true;
        }
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      if (!streamHeadersSent) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.statusCode = 200;
        streamHeadersSent = true;
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      if (!streamHeadersSent) {
        this.handleGenericError(res, err, requestId);
      } else {
        const safeCode = this.toSafeGatewayErrorCode(err);
        const errorFrame = {
          success: false,
          error: {
            code: safeCode,
            message: "Serviço de IA temporariamente indisponível."
          },
          requestId
        };
        res.write(`event: error\ndata: ${JSON.stringify(errorFrame)}\n\n`);
        res.end();
      }
    }
  }

  private async handleOpenAIChatCompletions(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    abortController: AbortController
  ): Promise<void> {
    const body = await this.readJsonBody<any>(req, res, requestId, this.config.maxJsonBodyBytes);
    if (res.writableEnded) return;

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "Campo 'messages' obrigatório.");
      return;
    }

    const normalizedMessages = body.messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : m.role,
      content: typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
        ? m.content.map((c: any) => typeof c === "string" ? c : c.text || c.content || "").join("")
        : String(m.content || "")
    }));

    const llmReq: LLMRequest = {
      messages: normalizedMessages,
      systemInstruction: body.systemInstruction,
      temperature: body.temperature,
      maxTokens: body.maxTokens || body.max_tokens,
      topP: body.topP || body.top_p,
      stopSequences: body.stopSequences || body.stop,
      metadata: body.metadata
    };

    if (body.stream === true) {
      let streamHeadersSent = false;
      try {
        for await (const chunk of this.config.router.stream(llmReq, {
          requestId,
          signal: abortController.signal,
          timeoutMs: this.config.providerTimeoutMs
        })) {
          if (!streamHeadersSent) {
            res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Request-Id", requestId);
            res.statusCode = 200;
            streamHeadersSent = true;
          }

          const sseChunk = {
            id: requestId,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: body.model || "aeternum-llm",
            choices: [
              {
                index: 0,
                delta: chunk.deltaText ? { content: chunk.deltaText } : {},
                finish_reason: chunk.finishReason || null
              }
            ]
          };
          res.write(`data: ${JSON.stringify(sseChunk)}\n\n`);
        }

        if (!streamHeadersSent) {
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.statusCode = 200;
          streamHeadersSent = true;
        }
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (err: any) {
        if (!streamHeadersSent) {
          this.handleGenericError(res, err, requestId);
        } else {
          const safeCode = this.toSafeGatewayErrorCode(err);
          const errorFrame = {
            error: {
              message: "Serviço de IA temporariamente indisponível.",
              type: "server_error",
              code: safeCode
            }
          };
          res.write(`data: ${JSON.stringify(errorFrame)}\n\n`);
          res.destroy(new Error("Stream terminated due to provider failure"));
        }
      }
      return;
    }

    const result = await this.config.router.generateWithMetadata(llmReq, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.providerTimeoutMs
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        id: requestId,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: result.data.modelId || body.model || "aeternum-llm",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: result.data.text },
            finish_reason: result.data.finishReason || "stop"
          }
        ],
        usage: result.data.usage
      })
    );
  }

  // ==========================================
  // STT: NATIVE & OPENAI MULTIPART
  // ==========================================

  private async handleSTTTranscribe(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    abortController: AbortController
  ): Promise<void> {
    const body = await this.readJsonBody<{
      audioBase64?: string;
      language?: string;
      audioFormat?: string;
      sampleRate?: number;
      medicalContextHints?: string[];
    }>(req, res, requestId, this.config.maxAudioBodyBytes);
    if (res.writableEnded) return;

    if (!body || !body.audioBase64) {
      this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "Campo 'audioBase64' obrigatório.");
      return;
    }

    const audioBuffer = new Uint8Array(Buffer.from(body.audioBase64, "base64"));
    const sttReq: STTRequest = {
      audioBuffer,
      language: body.language || "pt",
      audioFormat: (body.audioFormat as any) || "wav",
      sampleRate: body.sampleRate || 16000,
      medicalContextHints: body.medicalContextHints
    };

    const result = await this.config.router.transcribeWithMetadata(sttReq, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.providerTimeoutMs
    });

    const response: GatewaySuccessResponse<any> = {
      success: true,
      data: result.data,
      metadata: {
        requestId,
        capability: result.metadata.capabilityRequested,
        finalProvider: result.metadata.finalProvider,
        fallbackUsed: result.metadata.fallbackUsed,
        fallbackReason: result.metadata.fallbackReason,
        attemptCount: result.metadata.attempts.length,
        latencyMs: result.metadata.attempts.reduce((acc, a) => acc + a.latencyMs, 0)
      }
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
  }

  private async handleOpenAIAudioTranscriptions(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    abortController: AbortController
  ): Promise<void> {
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
      if (!boundaryMatch) {
        this.sendError(res, 400, "BAD_REQUEST", requestId, "bad_request", "Cabeçalho multipart sem boundary.");
        return;
      }
      const boundary = boundaryMatch[1].trim().replace(/^["']|["']$/g, "");

      const rawBuffer = await this.readRawBody(req, res, requestId, this.config.maxAudioBodyBytes);
      if (res.writableEnded || !rawBuffer) return;

      const parsed = this.parseMultipart(rawBuffer, boundary);
      if (!parsed.file || parsed.file.length === 0) {
        this.sendError(res, 400, "BAD_REQUEST", requestId, "bad_request", "Campo 'file' de áudio ausente no multipart.");
        return;
      }

      let audioFormat: "wav" | "pcm" | "mp3" | "ogg" = "wav";
      if (parsed.filename?.endsWith(".pcm") || parsed.contentType?.includes("pcm")) {
        audioFormat = "pcm";
      } else if (parsed.filename?.endsWith(".mp3") || parsed.contentType?.includes("mp3")) {
        audioFormat = "mp3";
      }

      const sttReq: STTRequest = {
        audioBuffer: parsed.file,
        language: parsed.fields.language || "pt",
        audioFormat,
        sampleRate: 16000,
        medicalContextHints: parsed.fields.prompt ? [parsed.fields.prompt] : undefined
      };

      const result = await this.config.router.transcribeWithMetadata(sttReq, {
        requestId,
        signal: abortController.signal,
        timeoutMs: this.config.providerTimeoutMs
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ text: result.data.text }));
      return;
    }

    // JSON fallback
    const body = await this.readJsonBody<any>(req, res, requestId, this.config.maxAudioBodyBytes);
    if (res.writableEnded) return;

    const b64 = body?.audioBase64 || body?.file;
    if (!b64) {
      this.sendError(res, 400, "BAD_REQUEST", requestId, "bad_request", "Campo 'file' ou 'audioBase64' obrigatório.");
      return;
    }

    const audioBuffer = new Uint8Array(Buffer.from(b64, "base64"));
    const sttReq: STTRequest = {
      audioBuffer,
      language: body.language || "pt",
      audioFormat: (body.audioFormat as any) || "wav",
      sampleRate: body.sampleRate || 16000,
      medicalContextHints: body.prompt ? [body.prompt] : undefined
    };

    const result = await this.config.router.transcribeWithMetadata(sttReq, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.providerTimeoutMs
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ text: result.data.text }));
  }

  // ==========================================
  // TTS: NATIVE & OPENAI AUDIO SPEECH
  // ==========================================

  private async handleTTSSynthesize(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    abortController: AbortController
  ): Promise<void> {
    const body = await this.readJsonBody<TTSRequest>(req, res, requestId, this.config.maxJsonBodyBytes);
    if (res.writableEnded) return;

    if (!body || !body.text) {
      this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "Campo 'text' obrigatório.");
      return;
    }

    const voiceProfileId = body.voiceProfileId || "pt-br-warm-male-01";
    const profile = VoiceProfileRegistry.get(voiceProfileId);
    const language = body.language || profile?.language || "pt";

    const ttsReq: TTSRequest = {
      text: body.text,
      voiceProfileId,
      language,
      speed: body.speed,
      sampleRate: body.sampleRate || 24000,
      audioFormat: body.audioFormat || "pcm"
    };

    const result = await this.config.router.synthesizeWithMetadata(ttsReq, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.providerTimeoutMs
    });

    const response: GatewaySuccessResponse<any> = {
      success: true,
      data: {
        audioBase64: Buffer.from(result.data.audioBuffer).toString("base64"),
        audioFormat: result.data.audioFormat,
        sampleRate: result.data.sampleRate,
        providerId: result.data.providerId,
        modelId: result.data.modelId,
        latency: result.data.latency
      },
      metadata: {
        requestId,
        capability: result.metadata.capabilityRequested,
        finalProvider: result.metadata.finalProvider,
        fallbackUsed: result.metadata.fallbackUsed,
        fallbackReason: result.metadata.fallbackReason,
        attemptCount: result.metadata.attempts.length,
        latencyMs: result.metadata.attempts.reduce((acc, a) => acc + a.latencyMs, 0)
      }
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
  }

  private async handleOpenAIAudioSpeech(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    abortController: AbortController
  ): Promise<void> {
    const body = await this.readJsonBody<any>(req, res, requestId, this.config.maxJsonBodyBytes);
    if (res.writableEnded) return;

    const text = body?.input || body?.text;
    if (!text) {
      this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "Campo 'input' obrigatório.");
      return;
    }

    const voiceProfileId = body.voice || body.voiceProfileId || "pt-br-warm-male-01";
    const profile = VoiceProfileRegistry.get(voiceProfileId);
    const language = profile?.language || "pt";
    const audioFormat = body.response_format === "pcm" ? "pcm" : "wav";

    const ttsReq: TTSRequest = {
      text,
      voiceProfileId,
      language,
      speed: body.speed,
      sampleRate: audioFormat === "pcm" ? 24000 : 24000,
      audioFormat
    };

    const result = await this.config.router.synthesizeWithMetadata(ttsReq, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.providerTimeoutMs
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", audioFormat === "wav" ? "audio/wav" : "audio/pcm");
    res.end(Buffer.from(result.data.audioBuffer));
  }

  private async handleTTSStream(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    abortController: AbortController
  ): Promise<void> {
    const body = await this.readJsonBody<TTSRequest>(req, res, requestId, this.config.maxJsonBodyBytes);
    if (res.writableEnded) return;

    if (!body || !body.text) {
      this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "Campo 'text' obrigatório.");
      return;
    }

    const voiceProfileId = body.voiceProfileId || "pt-br-warm-male-01";
    const profile = VoiceProfileRegistry.get(voiceProfileId);
    const language = body.language || profile?.language || "pt";

    const ttsReq: TTSRequest = {
      text: body.text,
      voiceProfileId,
      language,
      speed: body.speed,
      sampleRate: body.sampleRate || 24000,
      audioFormat: body.audioFormat || "pcm"
    };

    let streamHeadersSent = false;

    try {
      for await (const chunk of this.config.router.streamSynthesis(ttsReq, {
        requestId,
        signal: abortController.signal,
        timeoutMs: this.config.providerTimeoutMs
      })) {
        if (!streamHeadersSent) {
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("X-Request-Id", requestId);
          res.statusCode = 200;
          streamHeadersSent = true;
        }

        const payload = {
          audioBase64: Buffer.from(chunk.audioChunk).toString("base64"),
          isFinal: chunk.isFinal
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }

      if (!streamHeadersSent) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.statusCode = 200;
        streamHeadersSent = true;
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      if (!streamHeadersSent) {
        this.handleGenericError(res, err, requestId);
      } else {
        const safeCode = this.toSafeGatewayErrorCode(err);
        const errorFrame = {
          success: false,
          error: {
            code: safeCode,
            message: "Serviço de síntese vocal temporariamente indisponível."
          },
          requestId
        };
        res.write(`event: error\ndata: ${JSON.stringify(errorFrame)}\n\n`);
        res.end();
      }
    }
  }

  // ==========================================
  // HELPERS & MULTIPART
  // ==========================================

  private parseMultipart(buffer: Buffer, boundary: string): {
    fields: Record<string, string>;
    file: Uint8Array | null;
    filename: string | null;
    contentType: string | null;
  } {
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const result: {
      fields: Record<string, string>;
      file: Uint8Array | null;
      filename: string | null;
      contentType: string | null;
    } = {
      fields: {},
      file: null,
      filename: null,
      contentType: null
    };

    let startIndex = buffer.indexOf(boundaryBuffer);
    while (startIndex !== -1) {
      const nextIndex = buffer.indexOf(boundaryBuffer, startIndex + boundaryBuffer.length);
      if (nextIndex === -1) break;

      const partBuffer = buffer.subarray(startIndex + boundaryBuffer.length, nextIndex);
      startIndex = nextIndex;

      const headerSep = Buffer.from("\r\n\r\n");
      let sepIndex = partBuffer.indexOf(headerSep);
      let sepLen = 4;
      if (sepIndex === -1) {
        const altSep = Buffer.from("\n\n");
        sepIndex = partBuffer.indexOf(altSep);
        sepLen = 2;
      }
      if (sepIndex === -1) continue;

      const headerStr = partBuffer.subarray(0, sepIndex).toString("utf-8");
      let body = partBuffer.subarray(sepIndex + sepLen);

      if (body.length >= 2 && body[body.length - 2] === 13 && body[body.length - 1] === 10) {
        body = body.subarray(0, body.length - 2);
      } else if (body.length >= 1 && body[body.length - 1] === 10) {
        body = body.subarray(0, body.length - 1);
      }

      const dispMatch = headerStr.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
      if (dispMatch) {
        const fieldName = dispMatch[1];
        const filename = dispMatch[2];

        if (filename || fieldName === "file") {
          result.file = new Uint8Array(body);
          result.filename = filename || "audio.wav";
          const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
          result.contentType = ctMatch ? ctMatch[1].trim() : "audio/wav";
        } else {
          result.fields[fieldName] = body.toString("utf-8").trim();
        }
      }
    }

    return result;
  }

  private async readRawBody(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    maxBytes: number
  ): Promise<Buffer | null> {
    return new Promise((resolve) => {
      let totalBytes = 0;
      const chunks: Buffer[] = [];

      req.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          this.sendError(res, 413, "PAYLOAD_TOO_LARGE", requestId, "payload_too_large", "Corpo da requisição excede o limite permitido.");
          req.destroy();
          resolve(null);
          return;
        }
        chunks.push(chunk);
      });

      req.on("end", () => {
        if (res.writableEnded) return;
        resolve(Buffer.concat(chunks));
      });
    });
  }

  private async authenticateRequest(req: http.IncomingMessage, res: http.ServerResponse, requestId: string): Promise<boolean> {
    if (this.config.authMode === "INTERNAL_DEV" || this.config.authMode === "DISABLED") {
      return true;
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      this.sendError(res, 401, "UNAUTHORIZED", requestId, "unauthorized", "Token de autenticação obrigatório.");
      return false;
    }

    const token = authHeader.substring(7).trim();

    if (this.config.authMode === "SERVICE_TOKEN") {
      const primaryToken = (this.config.authToken || "").trim();
      const secondaryToken = (this.config.secondaryAuthToken || "").trim();

      if (!primaryToken && !secondaryToken) {
        this.sendError(res, 401, "UNAUTHORIZED", requestId, "unauthorized", "Service token não configurado no Gateway (fail-closed).");
        return false;
      }

      const tokenBuf = Buffer.from(token, "utf-8");

      let isValid = false;
      if (primaryToken) {
        const primaryBuf = Buffer.from(primaryToken, "utf-8");
        if (tokenBuf.length === primaryBuf.length && crypto.timingSafeEqual(tokenBuf, primaryBuf)) {
          isValid = true;
        }
      }

      if (!isValid && secondaryToken) {
        const secondaryBuf = Buffer.from(secondaryToken, "utf-8");
        if (tokenBuf.length === secondaryBuf.length && crypto.timingSafeEqual(tokenBuf, secondaryBuf)) {
          isValid = true;
        }
      }

      if (!isValid) {
        this.sendError(res, 401, "UNAUTHORIZED", requestId, "unauthorized", "Token de serviço inválido.");
        return false;
      }
      return true;
    }

    if (this.config.authMode === "SUPABASE_JWT") {
      const validator = (this.config as any).jwtValidator;
      if (!validator || typeof validator.validateToken !== "function") {
        this.sendError(res, 401, "UNAUTHORIZED", requestId, "unauthorized", "Validador JWT não configurado no Gateway (fail-closed).");
        return false;
      }
      const result = await validator.validateToken(token);
      if (!result || !result.valid) {
        this.sendError(res, 401, "UNAUTHORIZED", requestId, "unauthorized", "Token JWT inválido ou expirado.");
        return false;
      }
      return true;
    }

    this.sendError(res, 401, "UNAUTHORIZED", requestId, "unauthorized", "Modo de autenticação inválido ou desconhecido.");
    return false;
  }

  private async readJsonBody<T = any>(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    maxBytes: number
  ): Promise<T | null> {
    return new Promise((resolve) => {
      let totalBytes = 0;
      const chunks: Buffer[] = [];

      req.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          this.sendError(res, 413, "PAYLOAD_TOO_LARGE", requestId, "payload_too_large", "Corpo da requisição excede o limite permitido.");
          req.destroy();
          resolve(null);
          return;
        }
        chunks.push(chunk);
      });

      req.on("end", () => {
        if (res.writableEnded) return;
        if (chunks.length === 0) {
          resolve({} as T);
          return;
        }
        try {
          const raw = Buffer.concat(chunks).toString("utf-8");
          const parsed = JSON.parse(raw);
          resolve(parsed as T);
        } catch {
          this.sendError(res, 400, "BAD_REQUEST", requestId, "bad_request", "Corpo JSON inválido.");
          resolve(null);
        }
      });
    });
  }

  private toSafeGatewayErrorCode(err: any): string {
    if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED") {
      return "request_cancelled";
    }
    if (err instanceof ProviderTimeoutError || err?.code === "PROVIDER_TIMEOUT") {
      return "provider_timeout";
    }
    if (err instanceof ProviderUnavailableError || err?.code === "PROVIDER_UNAVAILABLE") {
      return "provider_unavailable";
    }
    if (err instanceof AllProvidersFailedError || err?.code === "ALL_PROVIDERS_FAILED") {
      return "all_providers_failed";
    }
    if (err instanceof ProviderAuthenticationError || err?.code === "PROVIDER_AUTH_ERROR") {
      return "provider_authentication_failed";
    }
    if (err instanceof CapabilityMismatchError || err?.code === "CAPABILITY_MISMATCH") {
      return "capability_mismatch";
    }
    return "provider_error";
  }

  private handleGenericError(res: http.ServerResponse, err: any, requestId: string): void {
    if (res.headersSent || res.writableEnded) return;

    if (err instanceof ProviderCancelledError || err?.code === "PROVIDER_CANCELLED") {
      this.sendError(res, 499, "PROVIDER_CANCELLED", requestId, "request_cancelled");
      return;
    }
    if (err instanceof ProviderTimeoutError || err?.code === "PROVIDER_TIMEOUT") {
      this.sendError(res, 504, "PROVIDER_TIMEOUT", requestId, "provider_timeout");
      return;
    }
    if (err instanceof ProviderUnavailableError || err?.code === "PROVIDER_UNAVAILABLE") {
      this.sendError(res, 503, "PROVIDER_UNAVAILABLE", requestId, "provider_unavailable");
      return;
    }
    if (err instanceof AllProvidersFailedError || err?.code === "ALL_PROVIDERS_FAILED") {
      this.sendError(res, 503, "ALL_PROVIDERS_FAILED", requestId, "all_providers_failed");
      return;
    }
    if (err instanceof ProviderAuthenticationError || err?.code === "PROVIDER_AUTH_ERROR") {
      this.sendError(res, 502, "PROVIDER_AUTH_ERROR", requestId, "provider_authentication_failed");
      return;
    }
    if (err instanceof CapabilityMismatchError || err?.code === "CAPABILITY_MISMATCH") {
      this.sendError(res, 400, "CAPABILITY_MISMATCH", requestId, "capability_mismatch");
      return;
    }
    if (err instanceof AeternumProviderError) {
      this.sendError(res, 500, "PROVIDER_ERROR", requestId, "provider_error");
      return;
    }

    this.sendError(res, 500, "INTERNAL_ERROR", requestId, "internal_error", "Erro interno no gateway.");
  }

  private sendError(
    res: http.ServerResponse,
    httpStatus: number,
    code: string,
    requestId: string,
    safeErrorCode?: string,
    message?: string
  ): void {
    if (res.headersSent || res.writableEnded) return;

    const errorBody: GatewayErrorResponse = {
      success: false,
      requestId,
      error: {
        code: safeErrorCode || code.toLowerCase(),
        message: message || "Erro de processamento no Aeternum AI Gateway.",
        httpStatus
      }
    };

    res.statusCode = httpStatus;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Request-Id", requestId);
    res.end(JSON.stringify(errorBody));
  }
}

import http from "node:http";
import crypto from "node:crypto";
import {
  GatewayConfig,
  GatewayHealthResponse,
  GatewaySuccessResponse,
  GatewayErrorResponse
} from "./types.ts";
import { SafeGatewayLogger } from "./middleware/logging.ts";
import { validateGatewayAuth } from "./middleware/auth.ts";
import {
  ProviderCancelledError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderAuthenticationError,
  CapabilityMismatchError,
  AllProvidersFailedError
} from "../providers/types/index.ts";
import { LLMRequest, STTRequest, TTSRequest } from "../providers/types/index.ts";

const SAFE_CANONICAL_ERROR_CODES: Record<string, { code: string; message: string; httpStatus: number }> = {
  PROVIDER_CANCELLED: { code: "request_cancelled", message: "Operação cancelada pelo usuário.", httpStatus: 499 },
  PROVIDER_TIMEOUT: { code: "provider_timeout", message: "Tempo limite da operação excedido.", httpStatus: 504 },
  PROVIDER_UNAVAILABLE: { code: "provider_unavailable", message: "Serviço de IA temporariamente indisponível.", httpStatus: 503 },
  PROVIDER_AUTH_ERROR: { code: "provider_authentication_failed", message: "Falha de autenticação do provedor.", httpStatus: 502 },
  PROVIDER_INVALID_RESPONSE: { code: "provider_invalid_response", message: "Resposta inesperada do provedor de IA.", httpStatus: 502 },
  CAPABILITY_MISMATCH: { code: "capability_mismatch", message: "Capacidade solicitada não suportada pelos provedores.", httpStatus: 400 },
  ALL_PROVIDERS_FAILED: { code: "all_providers_failed", message: "Todos os provedores configurados falharam.", httpStatus: 503 },
  BAD_REQUEST: { code: "bad_request", message: "Corpo da requisição inválido ou malformado.", httpStatus: 400 },
  PAYLOAD_TOO_LARGE: { code: "payload_too_large", message: "Tamanho da requisição excede o limite máximo permitido.", httpStatus: 413 },
  UNAUTHORIZED: { code: "unauthorized", message: "Acesso não autorizado.", httpStatus: 401 }
};

export class AeternumAIGateway {
  private server?: http.Server;
  private readonly config: Required<GatewayConfig>;

  constructor(config: GatewayConfig) {
    this.config = {
      port: config.port || Number(process.env.AETERNUM_AI_GATEWAY_PORT) || 8081,
      host: config.host || "127.0.0.1",
      authMode: config.authMode || "INTERNAL_DEV",
      router: config.router,
      version: config.version || "1.0.0",
      mode: config.mode || "local_first",
      requestTimeoutMs: config.requestTimeoutMs || 35000,
      maxJsonBodyBytes: config.maxJsonBodyBytes || 1024 * 1024, // 1MB
      maxAudioBodyBytes: config.maxAudioBodyBytes || 10 * 1024 * 1024, // 10MB
      logger: config.logger || new SafeGatewayLogger()
    };
  }

  async start(): Promise<void> {
    if (this.server) return;

    this.server = http.createServer(async (req, res) => {
      await this.handleRequest(req, res);
    });

    return new Promise<void>((resolve, reject) => {
      this.server?.listen(this.config.port, this.config.host, () => {
        this.config.logger.info("GATEWAY_STARTED", {
          port: this.config.port,
          host: this.config.host,
          mode: this.config.mode,
          authMode: this.config.authMode
        });
        resolve();
      });
      this.server?.on("error", (err) => reject(err));
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    return new Promise<void>((resolve, reject) => {
      this.server?.close((err) => {
        if (err) reject(err);
        else {
          this.server = undefined;
          resolve();
        }
      });
    });
  }

  getServer(): http.Server | undefined {
    return this.server;
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const start = performance.now();
    const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
    const url = new URL(req.url || "/", `http://${this.config.host}:${this.config.port}`);
    const path = url.pathname;
    const method = req.method?.toUpperCase() || "GET";

    res.setHeader("X-Request-Id", requestId);
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    // 1. Health endpoint (Público/Liveness metadata)
    if (method === "GET" && path === "/health") {
      this.handleHealth(res);
      return;
    }

    // 2. Validação de Autenticação
    const authResult = validateGatewayAuth(req, this.config.authMode);
    if (!authResult.authenticated) {
      this.sendError(res, 401, "UNAUTHORIZED", requestId, "UNAUTHORIZED", authResult.error);
      return;
    }

    // 3. Configurar AbortController para cancelamento em tempo real (Barge-In)
    const abortController = new AbortController();
    req.on("aborted", () => {
      abortController.abort();
    });
    res.on("close", () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    try {
      if (method === "POST" && path === "/v1/llm/generate") {
        await this.handleLLMGenerate(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/llm/stream") {
        await this.handleLLMStream(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/stt/transcribe") {
        await this.handleSTTTranscribe(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/tts/synthesize") {
        await this.handleTTSSynthesize(req, res, requestId, abortController);
      } else if (method === "POST" && path === "/v1/tts/stream") {
        await this.handleTTSStream(req, res, requestId, abortController);
      } else {
        this.sendError(res, 404, "BAD_REQUEST", requestId, "NOT_FOUND", "Endpoint não encontrado.");
      }
    } catch (err: any) {
      this.handleGenericError(res, err, requestId);
    } finally {
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

  private handleHealth(res: http.ServerResponse): void {
    const health: GatewayHealthResponse = {
      status: "HEALTHY",
      gateway_version: this.config.version,
      mode: this.config.mode,
      auth_mode: this.config.authMode,
      timestamp: new Date().toISOString(),
      providers: {
        llm_local: "HEALTHY",
        llm_cloud: "HEALTHY",
        stt_local: "HEALTHY",
        stt_cloud: "HEALTHY",
        tts_local: "HEALTHY",
        tts_cloud: "HEALTHY"
      }
    };
    res.statusCode = 200;
    res.end(JSON.stringify(health));
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
      timeoutMs: this.config.requestTimeoutMs
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

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.statusCode = 200;

    for await (const chunk of this.config.router.stream(body, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.requestTimeoutMs
    })) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  }

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
      timeoutMs: this.config.requestTimeoutMs
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
    res.end(JSON.stringify(response));
  }

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

    const result = await this.config.router.synthesizeWithMetadata(body, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.requestTimeoutMs
    });

    const audioBase64 = Buffer.from(result.data.audioBuffer).toString("base64");
    const response: GatewaySuccessResponse<any> = {
      success: true,
      data: {
        ...result.data,
        audioBuffer: undefined,
        audioBase64
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
    res.end(JSON.stringify(response));
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

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.statusCode = 200;

    for await (const chunk of this.config.router.streamSynthesis(body, {
      requestId,
      signal: abortController.signal,
      timeoutMs: this.config.requestTimeoutMs
    })) {
      const audioBase64 = Buffer.from(chunk.audioChunk).toString("base64");
      res.write(`data: ${JSON.stringify({ audioBase64, isFinal: chunk.isFinal })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  }

  // ==========================================
  // BODY PARSING & ERROR HANDLING
  // ==========================================

  private async readJsonBody<T>(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requestId: string,
    maxBytes: number
  ): Promise<T | null> {
    return new Promise<T | null>((resolve) => {
      let totalBytes = 0;
      const chunks: Buffer[] = [];
      let exceeded = false;

      req.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes && !exceeded) {
          exceeded = true;
          this.sendError(res, 413, "PAYLOAD_TOO_LARGE", requestId, "PAYLOAD_TOO_LARGE");
          req.resume(); // drena o stream sem quebrar o socket
          resolve(null);
          return;
        }
        if (!exceeded) {
          chunks.push(chunk);
        }
      });

      req.on("end", () => {
        if (exceeded || res.writableEnded) {
          resolve(null);
          return;
        }
        if (chunks.length === 0) {
          resolve(null);
          return;
        }
        try {
          const raw = Buffer.concat(chunks).toString("utf8");
          const parsed = JSON.parse(raw);
          resolve(parsed as T);
        } catch {
          this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "JSON malformado.");
          resolve(null);
        }
      });

      req.on("error", () => {
        if (!res.writableEnded) {
          this.sendError(res, 400, "BAD_REQUEST", requestId, "BAD_REQUEST", "Erro de stream na requisição.");
        }
        resolve(null);
      });
    });
  }

  private handleGenericError(res: http.ServerResponse, err: any, requestId: string): void {
    if (res.writableEnded) return;

    const code = err?.code || "PROVIDER_UNAVAILABLE";
    const mapped = SAFE_CANONICAL_ERROR_CODES[code] || {
      code: "provider_error",
      message: "Ocorreu um erro durante o processamento da requisição.",
      httpStatus: 500
    };

    const errorResp: GatewayErrorResponse = {
      success: false,
      error: {
        code: mapped.code,
        message: mapped.message
      },
      metadata: {
        requestId,
        finalCanonicalError: code
      }
    };

    res.statusCode = mapped.httpStatus;
    res.end(JSON.stringify(errorResp));
  }

  private sendError(
    res: http.ServerResponse,
    httpStatus: number,
    canonicalCode: string,
    requestId: string,
    errorCode: string,
    customMessage?: string
  ): void {
    if (res.writableEnded) return;

    const mapped = SAFE_CANONICAL_ERROR_CODES[canonicalCode] || {
      code: errorCode.toLowerCase(),
      message: customMessage || "Erro na requisição."
    };

    const errorResp: GatewayErrorResponse = {
      success: false,
      error: {
        code: mapped.code,
        message: customMessage || mapped.message
      },
      metadata: {
        requestId,
        finalCanonicalError: canonicalCode
      }
    };

    res.statusCode = httpStatus;
    res.end(JSON.stringify(errorResp));
  }
}

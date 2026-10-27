import fs from "node:fs";
import path from "node:path";
import { LLMProvider } from "../../contracts/LLMProvider.ts";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderCancelledError,
  ProviderAuthenticationError,
  ProviderInvalidResponseError
} from "../../types/index.ts";

export interface AtlasDaemonProviderConfig {
  daemonBaseUrl?: string; // default: "http://127.0.0.1:14555"
  targetModel?: string; // default: "qwen3.5:4b"
  authToken?: string;
  tokenPath?: string;
  defaultTimeoutMs?: number; // default: 60000
}

interface CreateTaskResponse {
  task_id: string;
  session_id: string;
  status: string;
  created_at: number;
}

interface StreamEventPayload {
  seq: number;
  task_id: string;
  chunk_type: string; // "thinking_chunk" | "token_chunk" | "completed" | "cancelled" | "failed"
  content: string;
  done: boolean;
}

interface DaemonHealthResponse {
  status: string;
  version: string;
  daemon: string;
  ollama_online: boolean;
  journal_mode: string;
  uptime_secs: number;
}

export class StreamingReasoningFilter {
  private inThinkBlock = false;
  private pendingBuffer = "";
  private hasPassedThinkingHeaders = false;

  public processChunk(raw: string): string[] {
    const toEmit: string[] = [];
    this.pendingBuffer += raw;

    while (this.pendingBuffer.length > 0) {
      if (this.inThinkBlock) {
        const closeIdx = this.pendingBuffer.indexOf("</think>");
        if (closeIdx !== -1) {
          this.pendingBuffer = this.pendingBuffer.slice(closeIdx + 8);
          this.inThinkBlock = false;
        } else {
          const match = this.pendingBuffer.match(/<\/?t?h?i?n?k?>?$/i);
          if (match && match.index !== undefined) {
            this.pendingBuffer = this.pendingBuffer.slice(match.index);
          } else {
            this.pendingBuffer = "";
          }
          break;
        }
      } else {
        const openIdx = this.pendingBuffer.indexOf("<think>");
        if (openIdx !== -1) {
          const preText = this.pendingBuffer.slice(0, openIdx);
          if (preText) {
            const sanitized = this.filterLeadingHeaders(preText);
            if (sanitized) toEmit.push(sanitized);
          }
          this.pendingBuffer = this.pendingBuffer.slice(openIdx + 7);
          this.inThinkBlock = true;
        } else {
          const match = this.pendingBuffer.match(/<\/?t?h?i?n?k?>?$/i);
          if (match && match.index !== undefined) {
            const emitText = this.pendingBuffer.slice(0, match.index);
            if (emitText) {
              const sanitized = this.filterLeadingHeaders(emitText);
              if (sanitized) toEmit.push(sanitized);
            }
            this.pendingBuffer = this.pendingBuffer.slice(match.index);
            break;
          } else {
            const sanitized = this.filterLeadingHeaders(this.pendingBuffer);
            if (sanitized) toEmit.push(sanitized);
            this.pendingBuffer = "";
          }
        }
      }
    }

    return toEmit;
  }

  private filterLeadingHeaders(text: string): string {
    if (this.hasPassedThinkingHeaders) {
      return text;
    }
    let cleaned = text;
    const headerRegex = /^\s*(?:thinking\s+process|thoughts?|planning|draft|análise\s+preliminar)\s*:\s*/i;
    if (headerRegex.test(cleaned)) {
      cleaned = cleaned.replace(headerRegex, "");
      const doubleNewline = cleaned.indexOf("\n\n");
      if (doubleNewline !== -1) {
        cleaned = cleaned.slice(doubleNewline + 2).trimStart();
      }
    }
    if (cleaned.length > 0) {
      this.hasPassedThinkingHeaders = true;
    }
    return cleaned;
  }

  public flush(): string[] {
    const toEmit: string[] = [];
    if (!this.inThinkBlock && this.pendingBuffer.length > 0) {
      const cleaned = this.pendingBuffer.replace(/<\/?think>/gi, "");
      if (cleaned) {
        const sanitized = this.filterLeadingHeaders(cleaned);
        if (sanitized) toEmit.push(sanitized);
      }
    }
    this.pendingBuffer = "";
    return toEmit;
  }
}

export class AtlasDaemonLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata;
  private readonly daemonBaseUrl: string;
  private readonly targetModel: string;
  private readonly defaultTimeoutMs: number;
  private explicitToken?: string;
  private explicitTokenPath?: string;

  constructor(config: AtlasDaemonProviderConfig = {}) {
    this.daemonBaseUrl = (config.daemonBaseUrl || "http://127.0.0.1:14555").replace(/\/$/, "");
    this.targetModel = config.targetModel || "qwen3.5:4b";
    this.defaultTimeoutMs = config.defaultTimeoutMs || 60_000;
    this.explicitToken = config.authToken;
    this.explicitTokenPath = config.tokenPath;

    this.metadata = {
      id: "atlas-daemon-rust-local",
      name: "Atlas Core Daemon Rust Provider",
      type: "LLM",
      location: "LOCAL",
      version: "0.1.0",
      description: "Atlas Core Daemon (Rust) with SQLite WAL persistence, VRAM concurrency queue and cognitive memory integration on HP Victus"
    };
  }

  /**
   * Resolve o token de autenticação local de forma segura e sem logging de segredos.
   * Ordem de busca:
   * 1. Token explícito fornecido na configuração
   * 2. Caminho explícito do token
   * 3. %LOCALAPPDATA%\AtlasCode\auth_token
   * 4. %USERPROFILE%\.atlas_code\auth_token
   */
  public resolveAuthToken(): string {
    if (this.explicitToken !== undefined) {
      return this.explicitToken.trim();
    }

    const candidatePaths: string[] = [];
    if (this.explicitTokenPath) {
      candidatePaths.push(this.explicitTokenPath);
    }

    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      candidatePaths.push(path.join(localAppData, "AtlasGatewayRuntime", "AtlasCode", "auth_token"));
      candidatePaths.push(path.join(localAppData, "AtlasCode", "auth_token"));
    }

    const userProfile = process.env.USERPROFILE || process.env.HOME;
    if (userProfile) {
      candidatePaths.push(path.join(userProfile, ".atlas_code", "auth_token"));
    }

    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, "utf8").trim();
          if (content.length >= 32) {
            return content;
          }
        }
      } catch {
        // Ignora erros de leitura de arquivo sem quebrar a execução
      }
    }

    return "";
  }

  /**
   * Constrói os cabeçalhos HTTP obrigatórios para comunicação com o atlas-daemon.
   * Invariante de Segurança: Inclui estritamente o header Host para satisfazer
   * a validação de segurança anti-DNS rebinding implementada em `security.rs`.
   */
  private getHeaders(token: string): Record<string, string> {
    const url = new URL(this.daemonBaseUrl);
    const hostHeader = url.port ? `${url.hostname}:${url.port}` : url.hostname;

    const headers: Record<string, string> = {
      "Host": hostHeader,
      "Content-Type": "application/json"
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Concatena as mensagens do request em um prompt coerente formatado para o daemon.
   */
  private buildPrompt(request: LLMRequest): string {
    const parts: string[] = [];
    const cleanDiscipline = "DIRETRIZ DE SAÍDA: Responda de forma direta, clara, polida e estritamente anatômica no idioma solicitado. Não emita raciocínio preliminar, não emita rascunhos, não utilize tags de pensamento (<think>) e forneça exclusivamente a resposta final para o estudante.";

    if (request.systemInstruction?.trim()) {
      parts.push(`=== DIRETRIZES DO SISTEMA ===\n${request.systemInstruction.trim()}\n${cleanDiscipline}`);
    } else {
      parts.push(`=== DIRETRIZES DO SISTEMA ===\n${cleanDiscipline}`);
    }

    const messages = request.messages || [];
    if (messages.length > 0) {
      const historyParts: string[] = [];
      for (const m of messages) {
        const roleLabel = m.role === "assistant" ? "Assistente" : m.role === "system" ? "Sistema" : "Usuário";
        const content = String(m.content || "").trim();
        if (content) {
          historyParts.push(`[${roleLabel}]\n${content}`);
        }
      }
      if (historyParts.length > 0) {
        parts.push(historyParts.join("\n\n"));
      }
    }

    return parts.join("\n\n").trim();
  }

  /**
   * Diagnóstico efetivo de prontidão do atlas-daemon e do Ollama subjacente.
   */
  async health(context?: ProviderExecutionContext): Promise<HealthResult> {
    const start = performance.now();
    const token = this.resolveAuthToken();
    const url = `${this.daemonBaseUrl}/v1/health`;

    try {
      const signal = context?.signal || AbortSignal.timeout(4000);
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(token),
        signal
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        return {
          providerId: this.metadata.id,
          status: "UNAVAILABLE",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: {
            http_status: res.status,
            daemon_reachable: false
          }
        };
      }

      const data = (await res.json()) as DaemonHealthResponse;

      if (!data.ollama_online) {
        return {
          providerId: this.metadata.id,
          status: "DEGRADED",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: {
            daemon_status: data.status,
            daemon_name: data.daemon,
            ollama_online: false,
            journal_mode: data.journal_mode,
            uptime_secs: data.uptime_secs
          }
        };
      }

      return {
        providerId: this.metadata.id,
        status: "HEALTHY",
        latencyMs,
        timestamp: new Date().toISOString(),
        details: {
          daemon_status: data.status,
          daemon_name: data.daemon,
          ollama_online: true,
          journal_mode: data.journal_mode,
          uptime_secs: data.uptime_secs,
          configured_model: this.targetModel
        }
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        providerId: this.metadata.id,
        status: "UNAVAILABLE",
        latencyMs,
        timestamp: new Date().toISOString(),
        details: {
          daemon_reachable: false,
          error_name: err?.name || "FetchError"
        }
      };
    }
  }

  /**
   * Executa a inferência síncrona gerando o texto completo através do protocolo de tarefas do daemon.
   */
  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    const start = performance.now();
    let accumulatedText = "";

    for await (const chunk of this.stream(request, context)) {
      if (chunk.deltaText) {
        accumulatedText += chunk.deltaText;
      }
    }

    const latencyMs = Math.round(performance.now() - start);

    if (!accumulatedText.trim()) {
      throw new ProviderInvalidResponseError(
        "O modelo local retornou resposta vazia ou sem tokens válidos.",
        this.metadata.id
      );
    }

    return {
      text: accumulatedText,
      providerId: this.metadata.id,
      modelId: this.targetModel,
      finishReason: "stop",
      latency: {
        totalMs: latencyMs
      },
      metadata: request.metadata
    };
  }

  /**
   * Dispara uma tarefa de inferência (`POST /v1/tasks`) e consome os eventos
   * via streaming SSE (`GET /v1/tasks/{id}/stream`), suportando cancelamento cooperativo (`POST /v1/tasks/{id}/cancel`).
   */
  async *stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk> {
    const token = this.resolveAuthToken();
    if (!token) {
      throw new ProviderAuthenticationError(
        "Token de autenticação do atlas-daemon não encontrado em disco nem configurado.",
        this.metadata.id
      );
    }

    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Inferência cancelada antes de iniciar.", this.metadata.id);
    }

    const prompt = this.buildPrompt(request);
    if (!prompt) {
      throw new ProviderInvalidResponseError("Prompt de inferência vazio gerado.", this.metadata.id);
    }

    const timeoutMs = this.defaultTimeoutMs;
    const requestedTokens = request.maxTokens || 1024;
    // Modelos de raciocínio (ex.: qwen3.5:4b) consomem tokens em `thinking_chunk`
    // antes de emitir `token_chunk`. Garantimos entre 1536 e 2048 tokens:
    // - Mínimo de 1536 garante que o raciocínio (300-800 tokens) nunca estoure o orçamento antes da resposta.
    // - Teto de 2048 garante que a inferência termine em ~35-42s na RTX 4050 (50 tps), com folga segura para o timeout de 60s do daemon.
    const effectiveTokenBudget = Math.min(Math.max(requestedTokens, 1536), 2048);
    const taskPayload = {
      title: "Tutor IA Inferência Local",
      prompt,
      model: this.targetModel,
      token_budget: effectiveTokenBudget,
      timeout_ms: timeoutMs,
      temperature: request.temperature,
      top_p: request.topP
    };

    // 1. POST /v1/tasks — Criar tarefa no daemon
    const createUrl = `${this.daemonBaseUrl}/v1/tasks`;
    let createRes: Response;
    try {
      createRes = await fetch(createUrl, {
        method: "POST",
        headers: this.getHeaders(token),
        body: JSON.stringify(taskPayload),
        signal: context?.signal
      });
    } catch (err: any) {
      if (err?.name === "AbortError" || context?.signal?.aborted) {
        throw new ProviderCancelledError("Criação de tarefa cancelada.", this.metadata.id);
      }
      throw new ProviderUnavailableError(
        `Falha na comunicação ao criar tarefa no atlas-daemon: ${err?.message || err}`,
        this.metadata.id
      );
    }

    if (!createRes.ok) {
      if (createRes.status === 401) {
        throw new ProviderAuthenticationError(
          "Autenticação recusada pelo atlas-daemon (token inválido).",
          this.metadata.id
        );
      }
      if (createRes.status === 403) {
        throw new ProviderAuthenticationError(
          "Acesso recusado pelo atlas-daemon (validação de Host ou Origin falhou).",
          this.metadata.id
        );
      }
      throw new ProviderUnavailableError(
        `atlas-daemon retornou status HTTP ${createRes.status} na criação da tarefa.`,
        this.metadata.id
      );
    }

    const createdData = (await createRes.json()) as CreateTaskResponse;
    const taskId = createdData.task_id;
    if (!taskId) {
      throw new ProviderInvalidResponseError(
        "atlas-daemon não retornou task_id válido.",
        this.metadata.id
      );
    }

    // Função auxiliar para disparar cancelamento seguro no daemon se abortado
    const sendCancelSignal = async () => {
      try {
        const cancelUrl = `${this.daemonBaseUrl}/v1/tasks/${taskId}/cancel`;
        await fetch(cancelUrl, {
          method: "POST",
          headers: this.getHeaders(token),
          signal: AbortSignal.timeout(3000)
        });
      } catch {
        // Ignora erro no disparo do cancelamento secundário
      }
    };

    // 2. GET /v1/tasks/{id}/stream — Consumir fluxo SSE de eventos
    const streamUrl = `${this.daemonBaseUrl}/v1/tasks/${taskId}/stream`;
    let streamRes: Response;
    try {
      streamRes = await fetch(streamUrl, {
        method: "GET",
        headers: {
          ...this.getHeaders(token),
          "Accept": "text/event-stream"
        },
        signal: context?.signal
      });
    } catch (err: any) {
      await sendCancelSignal();
      if (err?.name === "AbortError" || context?.signal?.aborted) {
        throw new ProviderCancelledError("Stream de inferência cancelado.", this.metadata.id);
      }
      throw new ProviderUnavailableError(
        `Falha ao conectar no stream SSE do atlas-daemon: ${err?.message || err}`,
        this.metadata.id
      );
    }

    if (!streamRes.ok || !streamRes.body) {
      await sendCancelSignal();
      throw new ProviderUnavailableError(
        `atlas-daemon retornou HTTP ${streamRes.status} sem stream body para tarefa ${taskId}.`,
        this.metadata.id
      );
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let hasEmittedTokenChunk = false;
    let accumulatedThinking = "";
    const reasoningFilter = new StreamingReasoningFilter();

    try {
      while (true) {
        if (context?.signal?.aborted) {
          await sendCancelSignal();
          throw new ProviderCancelledError("Inferência cancelada pelo chamador.", this.metadata.id);
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("data: ")) {
            const jsonText = trimmed.slice(6).trim();
            let eventPayload: StreamEventPayload;
            try {
              eventPayload = JSON.parse(jsonText);
            } catch {
              continue;
            }

            if (eventPayload.chunk_type === "token_chunk" && eventPayload.content) {
              const cleanDeltas = reasoningFilter.processChunk(eventPayload.content);
              for (const delta of cleanDeltas) {
                if (delta) {
                  hasEmittedTokenChunk = true;
                  yield {
                    deltaText: delta,
                    isComplete: false
                  };
                }
              }
            } else if (eventPayload.chunk_type === "thinking_chunk" && eventPayload.content) {
              // REGRA ABSOLUTA DE SEGURANÇA: thinking_chunk JAMAIS deve ser emitido ao usuário ou retornado como resposta final.
              accumulatedThinking += eventPayload.content;
            } else if (eventPayload.chunk_type === "cancelled") {
              throw new ProviderCancelledError(
                "Tarefa cancelada internamente no atlas-daemon.",
                this.metadata.id
              );
            } else if (eventPayload.chunk_type === "failed") {
              throw new ProviderUnavailableError(
                `Falha na execução da tarefa no daemon: ${eventPayload.content || "Erro desconhecido"}`,
                this.metadata.id
              );
            } else if (eventPayload.chunk_type === "completed" || eventPayload.done) {
              const flushed = reasoningFilter.flush();
              for (const delta of flushed) {
                if (delta) {
                  hasEmittedTokenChunk = true;
                  yield {
                    deltaText: delta,
                    isComplete: false
                  };
                }
              }

              if (!hasEmittedTokenChunk) {
                throw new ProviderInvalidResponseError(
                  "O modelo local encerrou sem emitir resposta válida (apenas raciocínio interno ou saída vazia).",
                  this.metadata.id
                );
              }
              yield {
                deltaText: "",
                isComplete: true,
                finishReason: "stop"
              };
              return;
            }
          }
        }
      }
    } catch (err: any) {
      await sendCancelSignal();
      if (err instanceof ProviderCancelledError) {
        throw err;
      }
      if (err?.name === "AbortError" || context?.signal?.aborted) {
        throw new ProviderCancelledError("Inferência cancelada pelo chamador.", this.metadata.id);
      }
      throw err;
    } finally {
      reader.releaseLock();
    }

    const flushedEnd = reasoningFilter.flush();
    for (const delta of flushedEnd) {
      if (delta) {
        hasEmittedTokenChunk = true;
        yield {
          deltaText: delta,
          isComplete: false
        };
      }
    }

    if (!hasEmittedTokenChunk) {
      throw new ProviderInvalidResponseError(
        "O modelo local encerrou o fluxo sem emitir tokens de resposta válidos.",
        this.metadata.id
      );
    }

    yield {
      deltaText: "",
      isComplete: true,
      finishReason: "stop"
    };
  }
}

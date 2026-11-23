import { LLMProvider } from "../../contracts/LLMProvider.ts";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError
} from "../../types/index.ts";
import { executeProviderJson, executeProviderFetchSession } from "../utils/fetchWithTimeout.ts";
import { buildProviderUrl } from "../utils/url.ts";
import { StreamingReasoningFilter } from "../atlas-daemon/AtlasDaemonLLMProvider.ts";

export type OllamaReasoningPolicy = "auto" | "none" | "default";

export interface OllamaProviderConfig {
  baseUrl?: string;
  modelId?: string;
  defaultTemperature?: number;
  apiKey?: string;
  reasoningPolicy?: OllamaReasoningPolicy;
}

export function resolveOllamaReasoningParams(
  request: LLMRequest,
  policy: OllamaReasoningPolicy = "auto"
): { reasoning_effort?: string; think?: boolean } {
  const meta = (request.metadata || {}) as Record<string, unknown>;

  if (typeof meta.reasoningEffort === "string") {
    if (meta.reasoningEffort === "none") {
      return { reasoning_effort: "none", think: false };
    }
    if (meta.reasoningEffort === "default") {
      return {};
    }
    return { reasoning_effort: meta.reasoningEffort };
  }

  if (typeof meta.think === "boolean") {
    return meta.think ? {} : { reasoning_effort: "none", think: false };
  }

  if (policy === "none") {
    return { reasoning_effort: "none", think: false };
  }
  if (policy === "default") {
    return {};
  }

  const task = String(meta.task || "").toLowerCase();
  const source = String(meta.source || "").toLowerCase();
  const sys = String(request.systemInstruction || "");

  // P0.20-G.5: Calibração de raciocínio rápido para flashcards e explicações estruturadas.
  // Em explain_flashcard, a verificação anatômica e clínica crítica é conduzida
  // diretamente pelo prompt de sistema estruturado e pelo acervo canônico RAG,
  // permitindo think: false para alcançar TTFT < 1.5s e latência de ~35s com zero vazamento.
  if (
    task === "explain_flashcard" ||
    source === "flashcard-explanation" ||
    task === "generate_flashcards" ||
    task === "generate_mind_map" ||
    (source === "flashcards" && task !== "explain_flashcard") ||
    source === "mind-map" ||
    sys.includes("Modo de saída — Flashcards Anatômicos") ||
    sys.includes("Modo de saída — Mapa Mental Anatômico")
  ) {
    return { reasoning_effort: "none", think: false };
  }

  return {};
}

export function resolveOllamaOptions(
  request: LLMRequest
): { num_ctx: number; num_predict: number } {
  const meta = (request.metadata || {}) as Record<string, unknown>;
  const task = String(meta.task || "").toLowerCase();
  const source = String(meta.source || "").toLowerCase();
  const sys = String(request.systemInstruction || "");

  const isDeepExplanation =
    task === "explain_flashcard" ||
    source === "flashcard-explanation" ||
    sys.includes("Explicação Didática e Rigor Anatômico de Flashcard");

  const explicitCtx = typeof meta.num_ctx === "number" ? meta.num_ctx : null;
  // P0.20-G.5: Calibração de contexto para 4096 (prefill estável ~130ms, deixa 1.3GB de VRAM livre na RTX 4050)
  const num_ctx = explicitCtx || (isDeepExplanation ? 4096 : 4096);
  // P0.20-G.5: Budget de geração calibrado para 3500 tokens (evita raciocínio infinito e garante completude da resposta)
  const num_predict = request.maxTokens || (isDeepExplanation ? 3500 : 2048);

  return { num_ctx, num_predict };
}

export class OllamaLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata;
  private readonly baseUrl: string;
  private readonly modelId: string;
  private readonly defaultTemperature: number;
  private readonly apiKey?: string;
  private readonly reasoningPolicy: OllamaReasoningPolicy;

  constructor(config: OllamaProviderConfig = {}) {
    this.baseUrl = config.baseUrl || "http://127.0.0.1:11434";
    this.modelId = config.modelId || process.env.ATLAS_TARGET_MODEL || process.env.AETERNUM_LOCAL_MODEL || "qwen3.5:4b";
    this.defaultTemperature = config.defaultTemperature ?? 0.7;
    this.apiKey = config.apiKey;
    this.reasoningPolicy = config.reasoningPolicy || (process.env.ATLAS_OLLAMA_REASONING_POLICY as OllamaReasoningPolicy) || "auto";

    this.metadata = {
      id: "ollama-local",
      name: "Ollama Local LLM Provider",
      type: "LLM",
      location: "LOCAL",
      version: "1.0.0",
      description: "Local inference engine running on HP Victus via Ollama OpenAI-compatible API"
    };
  }

  async health(context?: ProviderExecutionContext): Promise<HealthResult> {
    const start = performance.now();
    const url = buildProviderUrl(this.baseUrl, "/api/tags");
    try {
      const data = await executeProviderJson<{ models?: Array<{ name?: string }> }>(
        url,
        { method: "GET" },
        this.metadata.id,
        context
      );
      const latencyMs = Math.round(performance.now() - start);

      const models: string[] = Array.isArray(data?.models)
        ? data.models.map((m) => m.name || "")
        : [];

      const modelFound = models.some(
        (m) => m === this.modelId || m.startsWith(`${this.modelId}:`) || m.startsWith(this.modelId)
      );

      if (!modelFound) {
        return {
          providerId: this.metadata.id,
          status: "DEGRADED",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: {
            configured_model: this.modelId,
            model_available: false,
            available_models_count: models.length
          }
        };
      }

      return {
        providerId: this.metadata.id,
        status: "HEALTHY",
        latencyMs,
        timestamp: new Date().toISOString(),
        details: {
          configured_model: this.modelId,
          model_available: true,
          available_models_count: models.length
        }
      };
    } catch {
      return {
        providerId: this.metadata.id,
        status: "UNAVAILABLE",
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
        details: {
          error: "Ollama service unreachable",
          target_url: url
        }
      };
    }
  }

  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    const start = performance.now();
    const url = buildProviderUrl(this.baseUrl, "/api/chat");

    const task = String(request.metadata?.task || "").toLowerCase();
    const source = String(request.metadata?.source || "").toLowerCase();
    const isExplanation =
      task === "explain_flashcard" ||
      source === "flashcard-explanation" ||
      Boolean(request.systemInstruction && request.systemInstruction.includes("Explicação Didática e Rigor Anatômico de Flashcard"));

    const messages = [];
    if (request.systemInstruction) {
      let sys = request.systemInstruction;
      if (isExplanation && !sys.includes("DIRETRIZ DE RACIOCÍNIO CALIBRADO")) {
        sys += "\n\nDIRETRIZ DE RACIOCÍNIO CALIBRADO (P0.20-G.5):\nConcentre seu raciocínio preliminar estritamente na verificação anatômica e clínica crítica das afirmações do cartão (validando contagens, trajetos, sintopia e inervação). Inicie a resposta visível em Markdown estruturado com concisão acadêmica e profundidade didática, sem reflexões metacognitivas redundantes.";
      }
      messages.push({ role: "system", content: sys });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const options = resolveOllamaOptions(request);
    const reasoningParams = resolveOllamaReasoningParams(request, this.reasoningPolicy);
    const ollamaOptions: Record<string, unknown> = {
      temperature: isExplanation ? (request.temperature ?? 0.1) : (request.temperature ?? this.defaultTemperature),
      top_p: request.topP ?? 0.9,
      presence_penalty: 0,
      frequency_penalty: 0,
      stop: request.stopSequences,
      num_ctx: options.num_ctx,
      num_predict: options.num_predict
    };

    const payload = {
      model: this.modelId,
      messages,
      options: ollamaOptions,
      keep_alive: "24h",
      ...reasoningParams,
      stream: false
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const data = await executeProviderJson<any>(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    if (!data || !data.message) {
      throw new ProviderInvalidResponseError("Formato de resposta inesperado do Ollama.", this.metadata.id);
    }

    const rawContent = (data.message.content || "").trim();
    const sanitizedContent = rawContent
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<think>[\s\S]*$/gi, "")
      .replace(/<\/think>/gi, "")
      .trim();

    if (!sanitizedContent) {
      throw new ProviderInvalidResponseError(
        "Resposta final vazia: modelo gerou apenas reflexão preliminar sem emitir a resposta visível.",
        this.metadata.id
      );
    }

    const rawReason = String(data.done_reason || (data.done ? "stop" : "unknown")).toLowerCase();
    let finishReason: "stop" | "length" | "content_filter" | "unknown" = "stop";
    if (rawReason === "length") finishReason = "length";
    else if (rawReason === "content_filter") finishReason = "content_filter";
    else if (rawReason === "stop") finishReason = "stop";
    else finishReason = "unknown";

    const totalDurationMs = Math.round(performance.now() - start);

    return {
      text: sanitizedContent,
      providerId: this.metadata.id,
      modelId: data?.model || this.modelId,
      finishReason,
      usage: {
        promptTokens: Number(data?.prompt_eval_count || 0),
        completionTokens: Number(data?.eval_count || 0),
        totalTokens: Number(data?.prompt_eval_count || 0) + Number(data?.eval_count || 0)
      },
      latency: {
        totalDurationMs
      },
      metadata: {
        ...request.metadata,
        truncated: finishReason === "length"
      }
    };
  }

  async *stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk> {
    const url = buildProviderUrl(this.baseUrl, "/api/chat");

    const task = String(request.metadata?.task || "").toLowerCase();
    const source = String(request.metadata?.source || "").toLowerCase();
    const isExplanation =
      task === "explain_flashcard" ||
      source === "flashcard-explanation" ||
      Boolean(request.systemInstruction && request.systemInstruction.includes("Explicação Didática e Rigor Anatômico de Flashcard"));

    const messages = [];
    if (request.systemInstruction) {
      let sys = request.systemInstruction;
      if (isExplanation && !sys.includes("DIRETRIZ DE RACIOCÍNIO CALIBRADO")) {
        sys += "\n\nDIRETRIZ DE RACIOCÍNIO CALIBRADO (P0.20-G.5):\nConcentre seu raciocínio preliminar estritamente na verificação anatômica e clínica crítica das afirmações do cartão (validando contagens, trajetos, sintopia e inervação). Inicie a resposta visível em Markdown estruturado com concisão acadêmica e profundidade didática, sem reflexões metacognitivas redundantes.";
      }
      messages.push({ role: "system", content: sys });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const options = resolveOllamaOptions(request);
    const reasoningParams = resolveOllamaReasoningParams(request, this.reasoningPolicy);
    const ollamaOptions: Record<string, unknown> = {
      temperature: isExplanation ? (request.temperature ?? 0.1) : (request.temperature ?? this.defaultTemperature),
      top_p: request.topP ?? 0.9,
      presence_penalty: 0,
      frequency_penalty: 0,
      stop: request.stopSequences,
      num_ctx: options.num_ctx,
      num_predict: options.num_predict
    };

    const payload = {
      model: this.modelId,
      messages,
      options: ollamaOptions,
      keep_alive: "24h",
      ...reasoningParams,
      stream: true
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const session = await executeProviderFetchSession(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    const res = session.response;
    if (!res.body) {
      session.cleanup();
      throw new ProviderInvalidResponseError("Stream body vazio recebido do Ollama.", this.metadata.id);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const reasoningFilter = new StreamingReasoningFilter();
    let buffer = "";

    try {
      while (true) {
        session.checkAborted();

        let readResult: { done: boolean; value?: Uint8Array } = { done: false };
        try {
          readResult = await reader.read();
        } catch (err) {
          session.handleStreamReadError(err);
        }

        if (readResult.done) break;

        buffer += decoder.decode(readResult.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let parsed: any;
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            continue;
          }

          if (parsed.done) {
            const flushed = reasoningFilter.flush();
            for (const clean of flushed) {
              if (clean) yield { deltaText: clean, isComplete: false };
            }
            const rawReason = String(parsed.done_reason || "stop").toLowerCase();
            let finishReason: "stop" | "length" | "content_filter" | "unknown" = "stop";
            if (rawReason === "length") finishReason = "length";
            else if (rawReason === "content_filter") finishReason = "content_filter";
            yield { deltaText: "", isComplete: true, finishReason };
            return;
          }

          const delta = parsed.message?.content || "";
          if (delta) {
            const cleanDeltas = reasoningFilter.processChunk(delta);
            for (const clean of cleanDeltas) {
              if (clean) {
                yield { deltaText: clean, isComplete: false };
              }
            }
          }
        }
      }

      const flushed = reasoningFilter.flush();
      for (const clean of flushed) {
        if (clean) yield { deltaText: clean, isComplete: false };
      }
      yield { deltaText: "", isComplete: true, finishReason: "stop" };
    } finally {
      session.cleanup();
      reader.releaseLock();
    }
  }
}

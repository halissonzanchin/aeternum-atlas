import { describe, it, expect, beforeEach, afterEach } from "vitest";
import http from "node:http";
import { AtlasDaemonLLMProvider } from "../local/atlas-daemon/AtlasDaemonLLMProvider.ts";
import {
  ProviderAuthenticationError,
  ProviderCancelledError,
  ProviderUnavailableError,
  ProviderInvalidResponseError
} from "../types/index.ts";

describe("AtlasDaemonLLMProvider — Protocol & Invariant Suite", () => {
  let mockServer: http.Server;
  let mockPort = 14555;
  let requestLog: Array<{ method: string; path: string; headers: http.IncomingHttpHeaders; body?: any }> = [];
  let nextTaskStatus = 200;
  let nextStreamChunks: string[] = [];
  let nextHealthStatus = 200;
  let nextHealthPayload: any = {
    status: "healthy",
    version: "0.1.0",
    daemon: "atlas-daemon",
    ollama_online: true,
    journal_mode: "wal",
    uptime_secs: 120
  };

  beforeEach(async () => {
    requestLog = [];
    nextTaskStatus = 200;
    nextStreamChunks = [];
    nextHealthStatus = 200;
    nextHealthPayload = {
      status: "healthy",
      version: "0.1.0",
      daemon: "atlas-daemon",
      ollama_online: true,
      journal_mode: "wal",
      uptime_secs: 120
    };

    mockPort = 14500 + Math.floor(Math.random() * 500);

    mockServer = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${mockPort}`);
      let rawBody = "";

      req.on("data", (c) => (rawBody += c));
      req.on("end", () => {
        let parsedBody: any;
        try {
          parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
        } catch {
          parsedBody = rawBody;
        }

        requestLog.push({
          method: req.method || "GET",
          path: url.pathname,
          headers: req.headers,
          body: parsedBody
        });

        // 1. Health check
        if (req.method === "GET" && url.pathname === "/v1/health") {
          res.statusCode = nextHealthStatus;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(nextHealthPayload));
          return;
        }

        // 2. Create task: POST /v1/tasks
        if (req.method === "POST" && url.pathname === "/v1/tasks") {
          res.statusCode = nextTaskStatus;
          res.setHeader("Content-Type", "application/json");
          if (nextTaskStatus === 200) {
            res.end(JSON.stringify({
              task_id: "task_mock_abc123",
              session_id: "sess_001",
              status: "running",
              created_at: Date.now()
            }));
          } else {
            res.end(JSON.stringify({ error: "Task creation failed" }));
          }
          return;
        }

        // 3. Stream task: GET /v1/tasks/:id/stream
        if (req.method === "GET" && url.pathname.includes("/stream")) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache");

          for (const chunk of nextStreamChunks) {
            res.write(chunk);
          }
          res.end();
          return;
        }

        // 4. Cancel task: POST /v1/tasks/:id/cancel
        if (req.method === "POST" && url.pathname.includes("/cancel")) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, cancelled: true }));
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
      });
    });

    await new Promise<void>((resolve) => mockServer.listen(mockPort, "127.0.0.1", () => resolve()));
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  });

  it("1. Invariante de Segurança: Inclui estritamente header Host e token no protocolo do daemon", async () => {
    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "secret_atlas_token_32_chars_long_12345"
    });

    await provider.health();

    expect(requestLog.length).toBe(1);
    expect(requestLog[0].path).toBe("/v1/health");
    expect(requestLog[0].headers["host"]).toBe(`127.0.0.1:${mockPort}`);
    expect(requestLog[0].headers["authorization"]).toBe("Bearer secret_atlas_token_32_chars_long_12345");
  });

  it("2. Health Check: HEALTHY quando daemon e Ollama estão operacionais", async () => {
    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "valid_token_32_chars_abcdef12345678"
    });

    const health = await provider.health();
    expect(health.status).toBe("HEALTHY");
    expect(health.providerId).toBe("atlas-daemon-rust-local");
    expect(health.details.ollama_online).toBe(true);
  });

  it("3. Health Check: DEGRADED quando daemon responde mas Ollama está offline", async () => {
    nextHealthPayload.ollama_online = false;

    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "valid_token_32_chars_abcdef12345678"
    });

    const health = await provider.health();
    expect(health.status).toBe("DEGRADED");
    expect(health.details.ollama_online).toBe(false);
  });

  it("4. Health Check: UNAVAILABLE quando daemon não responde (porta fechada ou HTTP 500)", async () => {
    nextHealthStatus = 503;

    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "valid_token_32_chars_abcdef12345678"
    });

    const health = await provider.health();
    expect(health.status).toBe("UNAVAILABLE");
  });

  it("5. Comprova que utiliza POST /v1/tasks e consome SSE via GET /v1/tasks/:id/stream (NUNCA chama Ollama diretamente)", async () => {
    nextStreamChunks = [
      `data: ${JSON.stringify({ seq: 1, task_id: "task_mock_abc123", chunk_type: "token_chunk", content: "O coração humano ", done: false })}\n\n`,
      `data: ${JSON.stringify({ seq: 2, task_id: "task_mock_abc123", chunk_type: "token_chunk", content: "possui quatro câmaras.", done: false })}\n\n`,
      `data: ${JSON.stringify({ seq: 3, task_id: "task_mock_abc123", chunk_type: "completed", content: "", done: true })}\n\n`
    ];

    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "valid_token_32_chars_abcdef12345678",
      targetModel: "qwen3.5:4b"
    });

    const response = await provider.generate({
      messages: [{ role: "user", content: "Quantas câmaras tem o coração?" }]
    });

    expect(response.text).toBe("O coração humano possui quatro câmaras.");
    expect(response.providerId).toBe("atlas-daemon-rust-local");
    expect(response.modelId).toBe("qwen3.5:4b");

    // Prova de conformidade arquitetural: chamou /v1/tasks e depois /v1/tasks/:id/stream
    expect(requestLog.length).toBe(2);
    expect(requestLog[0].method).toBe("POST");
    expect(requestLog[0].path).toBe("/v1/tasks");
    expect(requestLog[0].body.model).toBe("qwen3.5:4b");

    expect(requestLog[1].method).toBe("GET");
    expect(requestLog[1].path).toBe("/v1/tasks/task_mock_abc123/stream");

    // Prova estrita: NENHUMA rota do Ollama (/api/generate, /api/chat) foi acessada
    const ollamaDirectCalls = requestLog.filter(
      (r) => r.path.startsWith("/api/generate") || r.path.startsWith("/api/chat")
    );
    expect(ollamaDirectCalls.length).toBe(0);
  });

  it("6. Rejeição de autenticação: lança ProviderAuthenticationError quando token ausente ou inválido", async () => {
    const providerWithoutToken = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "" // token vazio
    });

    await expect(
      providerWithoutToken.generate({
        messages: [{ role: "user", content: "Olá" }]
      })
    ).rejects.toThrow(ProviderAuthenticationError);
  });

  it("7. Cancelamento / Barge-in: dispara POST /v1/tasks/:id/cancel quando abortado", async () => {
    const abortController = new AbortController();

    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "valid_token_32_chars_abcdef12345678"
    });

    // Mock stream lento que aborta
    mockServer.removeAllListeners("request");
    mockServer.on("request", (req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${mockPort}`);
      let rawBody = "";
      req.on("data", (c) => (rawBody += c));
      req.on("end", () => {
        requestLog.push({ method: req.method || "GET", path: url.pathname, headers: req.headers });

        if (req.method === "POST" && url.pathname === "/v1/tasks") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ task_id: "task_to_cancel_999", session_id: "s", status: "running" }));
          return;
        }

        if (req.method === "GET" && url.pathname.includes("/stream")) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/event-stream");
          res.write(`data: ${JSON.stringify({ chunk_type: "token_chunk", content: "Primeira palavra " })}\n\n`);
          // Aborta logo após o primeiro chunk
          setTimeout(() => {
            abortController.abort();
          }, 20);
          return;
        }

        if (req.method === "POST" && url.pathname.includes("/cancel")) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true }));
          return;
        }
      });
    });

    await expect(async () => {
      for await (const chunk of provider.stream(
        { messages: [{ role: "user", content: "Explique o ciclo cardíaco" }] },
        { signal: abortController.signal }
      )) {
        // Consome primeiro chunk
      }
    }).rejects.toThrow(ProviderCancelledError);

    // Aguarda o disparo assíncrono do cancelamento secundário
    await new Promise((r) => setTimeout(r, 60));

    const cancelCalls = requestLog.filter((r) => r.path.includes("/cancel"));
    expect(cancelCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("8. Invariante Anti-Vazamento: thinking_chunk sem resposta dispara ProviderInvalidResponseError", async () => {
    nextStreamChunks = [
      `data: ${JSON.stringify({ seq: 1, task_id: "task_mock_abc123", chunk_type: "thinking_chunk", content: "Let me think about this anatomy question...", done: false })}\n\n`,
      `data: ${JSON.stringify({ seq: 2, task_id: "task_mock_abc123", chunk_type: "thinking_chunk", content: " Planning internal steps.", done: false })}\n\n`,
      `data: ${JSON.stringify({ seq: 3, task_id: "task_mock_abc123", chunk_type: "completed", content: "", done: true })}\n\n`
    ];

    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "valid_token_32_chars_abcdef12345678"
    });

    await expect(
      provider.generate({
        messages: [{ role: "user", content: "Pergunta sem resposta válida" }]
      })
    ).rejects.toThrow(ProviderInvalidResponseError);
  });

  it("9. Invariante Anti-Vazamento: thinking_chunk é suprimido e apenas token_chunk chega ao usuário", async () => {
    nextStreamChunks = [
      `data: ${JSON.stringify({ seq: 1, task_id: "task_mock_abc123", chunk_type: "thinking_chunk", content: "Thinking process: I should talk about the deltoid insertion.", done: false })}\n\n`,
      `data: ${JSON.stringify({ seq: 2, task_id: "task_mock_abc123", chunk_type: "token_chunk", content: "O músculo deltoide se insere na tuberosidade deltoidea do úmero.", done: false })}\n\n`,
      `data: ${JSON.stringify({ seq: 3, task_id: "task_mock_abc123", chunk_type: "completed", content: "", done: true })}\n\n`
    ];

    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "valid_token_32_chars_abcdef12345678"
    });

    const res = await provider.generate({
      messages: [{ role: "user", content: "Onde se insere o deltoide?" }]
    });

    expect(res.text).toBe("O músculo deltoide se insere na tuberosidade deltoidea do úmero.");
    expect(res.text.includes("Thinking process")).toBe(false);
  });

  it("10. Invariante Anti-Vazamento: tags <think> residuais em token_chunk são expurgadas", async () => {
    nextStreamChunks = [
      `data: ${JSON.stringify({ seq: 1, task_id: "task_mock_abc123", chunk_type: "token_chunk", content: "<think>Rascunho interno</think>Resposta formal anatômica.", done: false })}\n\n`,
      `data: ${JSON.stringify({ seq: 2, task_id: "task_mock_abc123", chunk_type: "completed", content: "", done: true })}\n\n`
    ];

    const provider = new AtlasDaemonLLMProvider({
      daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
      authToken: "valid_token_32_chars_abcdef12345678"
    });

    const res = await provider.generate({
      messages: [{ role: "user", content: "Pergunta de teste" }]
    });

    expect(res.text).toBe("Resposta formal anatômica.");
    expect(res.text.includes("<think>")).toBe(false);
  });
});

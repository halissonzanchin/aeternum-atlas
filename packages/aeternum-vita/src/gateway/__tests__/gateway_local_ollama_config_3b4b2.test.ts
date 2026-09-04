import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadGatewayEnvConfig } from "../config.ts";
import { OllamaLLMProvider } from "../../providers/local/ollama/OllamaLLMProvider.ts";

describe("PHASE 3B.4B.2 — Local Ollama Config & Minimal Environment Invariants", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.LOCAL_LLM_BASE_URL;
    delete process.env.LOCAL_LLM_MODEL_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("1. Resolves default local LLM base URL to http://127.0.0.1:11434", () => {
    const config = loadGatewayEnvConfig();
    expect(config.localLLMBaseUrl).toBe("http://127.0.0.1:11434");
  });

  it("2. Resolves default local LLM model ID to qwen2.5:3b", () => {
    const config = loadGatewayEnvConfig();
    expect(config.localLLMModelId).toBe("qwen2.5:3b");
  });

  it("3. Accepts environment override for LOCAL_LLM_BASE_URL", () => {
    process.env.LOCAL_LLM_BASE_URL = "http://host.docker.internal:11434";
    const config = loadGatewayEnvConfig();
    expect(config.localLLMBaseUrl).toBe("http://host.docker.internal:11434");
  });

  it("4. Accepts environment override for LOCAL_LLM_MODEL_ID", () => {
    process.env.LOCAL_LLM_MODEL_ID = "qwen2.5:7b";
    const config = loadGatewayEnvConfig();
    expect(config.localLLMModelId).toBe("qwen2.5:7b");
  });

  it("5. Instantiates OllamaLLMProvider with configured baseUrl and modelId", () => {
    process.env.LOCAL_LLM_BASE_URL = "http://host.docker.internal:11434";
    process.env.LOCAL_LLM_MODEL_ID = "qwen2.5:3b";
    const config = loadGatewayEnvConfig();

    const provider = new OllamaLLMProvider({
      baseUrl: config.localLLMBaseUrl,
      modelId: config.localLLMModelId
    });

    expect(provider.metadata.id).toBe("ollama-local");
    expect(provider.metadata.type).toBe("LLM");
    expect(provider.metadata.location).toBe("LOCAL");
  });
});

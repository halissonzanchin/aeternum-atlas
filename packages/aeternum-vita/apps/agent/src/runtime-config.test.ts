import { describe, expect, it } from "vitest";
import { loadVoiceRuntimeConfig } from "./runtime-config.ts";

describe("configuração local de voz", () => {
  it("usa modo gateway por padrão", () => {
    const config = loadVoiceRuntimeConfig({});
    expect(config.backendMode).toBe("gateway");
    expect(config.llmBaseUrl).toBe("http://127.0.0.1:8081/v1");
    expect(config.speechBaseUrl).toBe("http://127.0.0.1:8081/v1");
    expect(config.llmModel).toBe("qwen2.5:3b");
  });

  it("usa serviços auto-hospedados diretos em modo legacy_direct", () => {
    const config = loadVoiceRuntimeConfig({ VITA_AI_BACKEND: "legacy_direct" });
    expect(config.backendMode).toBe("legacy_direct");
    expect(config.llmBaseUrl).toBe("http://localhost:11434/v1");
    expect(config.speechBaseUrl).toBe("http://localhost:8000/v1");
    expect(config.llmModel).toBe("qwen2.5:3b");
  });

  it("rejeita endpoint não HTTP em modo legacy_direct", () => {
    expect(() =>
      loadVoiceRuntimeConfig({
        VITA_AI_BACKEND: "legacy_direct",
        LOCAL_LLM_BASE_URL: "file:///model",
      }),
    ).toThrow("LOCAL_LLM_BASE_URL deve usar HTTP ou HTTPS");
  });
});

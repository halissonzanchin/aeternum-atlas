import { describe, expect, it } from "vitest";
import { loadVoiceRuntimeConfig } from "./runtime-config.ts";

describe("configuração local de voz", () => {
  it("usa serviços auto-hospedados por padrão", () => {
    const config = loadVoiceRuntimeConfig({});
    expect(config.llmBaseUrl).toBe("http://localhost:11434/v1");
    expect(config.speechBaseUrl).toBe("http://localhost:8000/v1");
    expect(config.llmModel).toBe("qwen2.5:3b");
  });

  it("rejeita endpoint não HTTP", () => {
    expect(() =>
      loadVoiceRuntimeConfig({ LOCAL_LLM_BASE_URL: "file:///model" }),
    ).toThrow("LOCAL_LLM_BASE_URL deve usar HTTP ou HTTPS");
  });
});

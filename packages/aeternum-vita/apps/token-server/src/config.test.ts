import { describe, expect, it } from "vitest";
import { ConfigurationError, loadConfig } from "./config.ts";

describe("token server config", () => {
  it("carrega a configuração com valores válidos", () => {
    const config = loadConfig({
      LIVEKIT_URL: "ws://livekit:7880",
      LIVEKIT_PUBLIC_URL: "wss://voice.example.test",
      LIVEKIT_API_KEY: "test-key",
      LIVEKIT_API_SECRET: "test-secret",
      LIVEKIT_AGENT_NAME: "aeternum-vita-voice",
      TOKEN_SERVER_PORT: "3001",
      WEB_ORIGIN: "http://localhost:5173",
    });

    expect(config).toEqual({
      livekitUrl: "ws://livekit:7880",
      livekitPublicUrl: "wss://voice.example.test",
      livekitApiKey: "test-key",
      livekitApiSecret: "test-secret",
      agentName: "aeternum-vita-voice",
      port: 3001,
      webOrigin: "http://localhost:5173",
    });
  });

  it("falha ao omitir credenciais obrigatórias", () => {
    expect(() => loadConfig({})).toThrow(ConfigurationError);
  });
});

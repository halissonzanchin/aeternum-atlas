import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import type { TokenServerConfig } from "./config.ts";

const testConfig: TokenServerConfig = {
  livekitUrl: "ws://livekit:7880",
  livekitPublicUrl: "wss://voice.example.test",
  livekitApiKey: "devkey",
  livekitApiSecret: "secretsecretsecretsecretsecretsecret32",
  agentName: "aeternum-vita-voice",
  port: 3001,
  webOrigin: "http://localhost:5173",
};

describe("token server app", () => {
  it("responde ao healthcheck", async () => {
    const app = createApp(testConfig);
    const response = await request(app).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "aeternum-vita-voice-token-server",
    });
  });

  it("retorna a lista de tutores suportados", async () => {
    const app = createApp(testConfig);
    const response = await request(app).get("/api/config");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("supportedTutors");
    expect(response.body.supportedTutors).toContain("eduardo");
    expect(response.body.supportedTutors).toContain("antonia");
    expect(response.body.supportedTutors).toContain("ariana");
    expect(response.body.supportedTutors).toContain("fabian");
  });

  it("gera token válido para requisição padrão", async () => {
    const app = createApp(testConfig);
    const response = await request(app)
      .post("/api/token")
      .send({
        room_config: {
          agents: [{ agent_name: "aeternum-vita-voice" }],
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "server_url",
      "wss://voice.example.test",
    );
    expect(response.body).toHaveProperty("participant_token");
    expect(response.body).toHaveProperty("tutor_id", "eduardo");
  });

  it("gera token específico para Antonia, Ariana ou Fabian", async () => {
    const app = createApp(testConfig);
    const responseAntonia = await request(app)
      .post("/api/token?tutor=antonia")
      .send({});

    expect(responseAntonia.status).toBe(201);
    expect(responseAntonia.body).toHaveProperty("tutor_id", "antonia");

    const responseAriana = await request(app)
      .post("/api/token")
      .send({ tutor_id: "ariana" });

    expect(responseAriana.status).toBe(201);
    expect(responseAriana.body).toHaveProperty("tutor_id", "ariana");

    const responseFabian = await request(app)
      .post("/api/token")
      .send({ tutor_id: "fabian" });

    expect(responseFabian.status).toBe(201);
    expect(responseFabian.body).toHaveProperty("tutor_id", "fabian");
  });
});

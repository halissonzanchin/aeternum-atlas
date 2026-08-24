import cors from "cors";
import express from "express";
import type { ErrorRequestHandler } from "express";
import type { TokenServerConfig } from "./config.ts";
import {
  SUPPORTED_TUTORS,
  createConnectionDetails,
  createTokenRequestSchema,
  type TutorId,
} from "./token.ts";

export const createApp = (config: TokenServerConfig) => {
  const app = express();
  const tokenRequestSchema = createTokenRequestSchema();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: config.webOrigin,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    }),
  );
  app.use(express.json({ limit: "16kb" }));

  app.get("/healthz", (_request, response) => {
    response.json({
      status: "ok",
      service: "aeternum-vita-voice-token-server",
    });
  });

  app.get("/api/config", (_request, response) => {
    response.json({
      agentName: config.agentName,
      supportedTutors: SUPPORTED_TUTORS,
    });
  });

  app.post("/api/token", async (request, response) => {
    const body = tokenRequestSchema.safeParse(request.body);

    if (!body.success) {
      response.status(400).json({
        error: "Requisição inválida.",
        details: body.error.flatten().fieldErrors,
      });
      return;
    }

    const queryTutor =
      typeof request.query.tutor === "string" ? request.query.tutor : undefined;
    const bodyTutor = body.data.tutor_id;
    const agentNameFromConfig = body.data.room_config?.agents?.[0]?.agent_name;

    let resolvedTutor: TutorId = "eduardo";

    if (
      queryTutor &&
      (SUPPORTED_TUTORS as readonly string[]).includes(queryTutor)
    ) {
      resolvedTutor = queryTutor as TutorId;
    } else if (
      bodyTutor &&
      (SUPPORTED_TUTORS as readonly string[]).includes(bodyTutor)
    ) {
      resolvedTutor = bodyTutor as TutorId;
    } else if (agentNameFromConfig) {
      const lower = agentNameFromConfig.toLowerCase();
      if (lower.includes("elena")) {
        resolvedTutor = "elena";
      } else if (lower.includes("marcus")) {
        resolvedTutor = "marcus";
      } else if (lower.includes("hannah")) {
        resolvedTutor = "hannah";
      } else {
        resolvedTutor = "eduardo";
      }
    }

    try {
      const connectionDetails = await createConnectionDetails(
        config,
        resolvedTutor,
      );
      response.status(201).json(connectionDetails);
    } catch (error) {
      console.error("Falha ao gerar token do LiveKit.", error);
      response
        .status(500)
        .json({
          error: "Não foi possível iniciar a conversa no Aeternum Vita.",
        });
    }
  });

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    if (
      error instanceof SyntaxError &&
      "status" in error &&
      error.status === 400
    ) {
      response
        .status(400)
        .json({ error: "O corpo da requisição não contém JSON válido." });
      return;
    }

    if (typeof error === "object" && error !== null && "type" in error) {
      if (error.type === "entity.too.large") {
        response
          .status(413)
          .json({ error: "A requisição excede o limite permitido." });
        return;
      }
    }

    console.error(
      "Erro inesperado no servidor de tokens Aeternum Vita.",
      error,
    );
    response.status(500).json({ error: "Erro interno do servidor." });
  };

  app.use(errorHandler);

  return app;
};

import http from "node:http";
import crypto from "node:crypto";
import { GatewayAuthMode } from "../types.ts";

export interface AuthValidationResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

export function validateGatewayAuth(
  req: http.IncomingMessage,
  mode: GatewayAuthMode = "INTERNAL_DEV"
): AuthValidationResult {
  // 1. Em modo INTERNAL_DEV: restrito a chamadas de loopback / dev local
  if (mode === "INTERNAL_DEV") {
    const remoteAddress = req.socket.remoteAddress || "";
    const isLoopback =
      remoteAddress === "127.0.0.1" ||
      remoteAddress === "::1" ||
      remoteAddress === "::ffff:127.0.0.1" ||
      remoteAddress === "localhost";

    if (!isLoopback) {
      return {
        authenticated: false,
        error: "Acesso externo negado em modo INTERNAL_DEV."
      };
    }
    return { authenticated: true, userId: "internal_dev_user" };
  }

  // 2. Em modo BEARER_TOKEN: autenticação estrita via Bearer token (Cloud Staging / Production)
  if (mode === "BEARER_TOKEN") {
    const expectedToken = (
      process.env.AETERNUM_AI_GATEWAY_TOKEN ||
      process.env.GATEWAY_AUTH_TOKEN ||
      ""
    ).trim();

    if (!expectedToken) {
      return {
        authenticated: false,
        error: "Token de autenticação do gateway não configurado no servidor."
      };
    }

    const authHeader = req.headers["authorization"] || "";
    if (!authHeader.startsWith("Bearer ")) {
      return {
        authenticated: false,
        error: "Token Bearer não fornecido no cabeçalho Authorization."
      };
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return { authenticated: false, error: "Token Bearer vazio." };
    }

    const tokenBuf = Buffer.from(token, "utf8");
    const expectedBuf = Buffer.from(expectedToken, "utf8");

    if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      return { authenticated: false, error: "Token de autenticação inválido." };
    }

    return { authenticated: true, userId: "gateway_bearer_user" };
  }

  // 3. Em modo SUPABASE_JWT (Preparado para migrações futuras)
  if (mode === "SUPABASE_JWT") {
    const authHeader = req.headers["authorization"] || "";
    if (!authHeader.startsWith("Bearer ")) {
      return {
        authenticated: false,
        error: "Token JWT não fornecido no cabeçalho Authorization."
      };
    }
    const token = authHeader.slice(7).trim();
    if (token.length === 0) {
      return { authenticated: false, error: "Token JWT vazio." };
    }
    return { authenticated: true, userId: "jwt_authenticated_user" };
  }

  // 4. Em modo DISABLED: estritamente bloqueado em ambientes de produção e homologação
  if (mode === "DISABLED") {
    const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
    if (nodeEnv === "production" || nodeEnv === "staging") {
      return {
        authenticated: false,
        error: "Modo de autenticação DISABLED proibido em ambientes de produção e homologação."
      };
    }
    return { authenticated: true };
  }

  return { authenticated: false, error: "Modo de autenticação inválido." };
}


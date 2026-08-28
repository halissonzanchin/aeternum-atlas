import http from "node:http";
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

  // 2. Em modo SUPABASE_JWT (Preparado para migrações futuras)
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

  if (mode === "DISABLED") {
    return { authenticated: true };
  }

  return { authenticated: false, error: "Modo de autenticação inválido." };
}

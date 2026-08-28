import http from "node:http";
import { GatewayAuthMode, GatewayJwtValidator } from "../types.ts";

export interface AuthValidationResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

export function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "127.0.0.1" ||
    h === "localhost" ||
    h === "::1" ||
    h === "::ffff:127.0.0.1" ||
    h.startsWith("127.")
  );
}

export async function validateGatewayAuth(
  req: http.IncomingMessage,
  mode: GatewayAuthMode = "INTERNAL_DEV",
  jwtValidator?: GatewayJwtValidator
): Promise<AuthValidationResult> {
  const remoteAddress = req.socket.remoteAddress || "";
  const isLoopback = isLoopbackHost(remoteAddress);

  // 1. Em modo INTERNAL_DEV: restrito estritamente a loopback
  if (mode === "INTERNAL_DEV") {
    if (!isLoopback) {
      return {
        authenticated: false,
        error: "Acesso externo negado em modo INTERNAL_DEV."
      };
    }
    return { authenticated: true, userId: "internal_dev_user" };
  }

  // 2. Em modo SUPABASE_JWT (Fail-Closed por padrão sem validador real)
  if (mode === "SUPABASE_JWT") {
    if (!jwtValidator) {
      return {
        authenticated: false,
        error: "Validador JWT não configurado no Gateway (fail-closed)."
      };
    }

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

    const validation = await jwtValidator.validateToken(token);
    if (!validation.valid) {
      return { authenticated: false, error: validation.error || "Token JWT inválido ou expirado." };
    }

    return { authenticated: true, userId: validation.userId || "jwt_user" };
  }

  // 3. Em modo DISABLED: obrigatório ser loopback
  if (mode === "DISABLED") {
    if (!isLoopback) {
      return {
        authenticated: false,
        error: "Modo de autenticação DISABLED é proibido em conexões não-loopback."
      };
    }
    return { authenticated: true };
  }

  return { authenticated: false, error: "Modo de autenticação desconhecido." };
}

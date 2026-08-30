import http from "node:http";
import crypto from "node:crypto";
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
  jwtValidator?: GatewayJwtValidator,
  serviceToken?: string,
  secondaryServiceToken?: string
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

  // 2. Em modo SERVICE_TOKEN: requer Bearer token com validação em tempo constante (Dual-Token Support)
  if (mode === "SERVICE_TOKEN") {
    const primary = (serviceToken || "").trim();
    const secondary = (secondaryServiceToken || "").trim();

    if (!primary && !secondary) {
      return {
        authenticated: false,
        error: "Service token não configurado no Gateway (fail-closed)."
      };
    }

    const authHeader = req.headers["authorization"] || "";
    if (!authHeader.startsWith("Bearer ")) {
      return {
        authenticated: false,
        error: "Token de serviço não fornecido no cabeçalho Authorization."
      };
    }

    const token = authHeader.slice(7).trim();
    if (token.length === 0) {
      return { authenticated: false, error: "Token de serviço vazio." };
    }

    const tokenBuf = Buffer.from(token, "utf-8");

    let isValid = false;
    if (primary) {
      const primaryBuf = Buffer.from(primary, "utf-8");
      if (tokenBuf.length === primaryBuf.length && crypto.timingSafeEqual(tokenBuf, primaryBuf)) {
        isValid = true;
      }
    }

    if (!isValid && secondary) {
      const secondaryBuf = Buffer.from(secondary, "utf-8");
      if (tokenBuf.length === secondaryBuf.length && crypto.timingSafeEqual(tokenBuf, secondaryBuf)) {
        isValid = true;
      }
    }

    if (!isValid) {
      return { authenticated: false, error: "Token de serviço inválido." };
    }

    return { authenticated: true, userId: "service_account" };
  }

  // 3. Em modo SUPABASE_JWT (Fail-Closed por padrão sem validador real)
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

  // 4. Em modo DISABLED: obrigatório ser loopback
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

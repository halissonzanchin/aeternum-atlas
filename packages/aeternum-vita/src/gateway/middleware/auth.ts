import http from "node:http";
import crypto from "node:crypto";
import type { GatewayAuthMode } from "../types.ts";

export interface AuthValidationResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * Comparação em tempo constante (constant-time) para prevenir timing attacks.
 * Funciona de forma segura mesmo se as strings possuírem tamanhos diferentes,
 * calculando o HMAC/digest antes da comparação final.
 */
export function safeConstantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (!a || !b) return false;

  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    // Evita vazamento de tamanho via timing calculando hash de tamanho fixo
    const hA = crypto.createHash("sha256").update(bufA).digest();
    const hB = crypto.createHash("sha256").update(bufB).digest();
    crypto.timingSafeEqual(hA, hB);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

function extractBearerToken(req: http.IncomingMessage): string | null {
  const authHeader = req.headers["authorization"] || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

const REVOKED_DEVELOPMENT_TOKENS = new Set<string>([
  "atlas_connectivity_p0_secret_token_12345"
]);

export function isRevokedDevelopmentToken(token: string): boolean {
  for (const revoked of REVOKED_DEVELOPMENT_TOKENS) {
    if (safeConstantTimeCompare(token, revoked)) {
      return true;
    }
  }
  return false;
}

export function isSyntheticOrPlaceholderAccessCredential(value: string): boolean {
  const v = (value || "").trim();
  if (!v) return true;
  if (
    v.startsWith("cf_svc_") ||
    v.startsWith("cf_sec_") ||
    v.startsWith("__PENDING") ||
    v.startsWith("<") ||
    v.toLowerCase().includes("placeholder")
  ) {
    return true;
  }
  return false;
}

export function isTunnelUuidInsteadOfClientId(value: string): boolean {
  const v = (value || "").trim();
  if (!v) return false;
  // Um UUID puro (36 chars hifenizados sem sufixo .access) é um Tunnel ID/Connector ID, não um Service Token Client ID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    return true;
  }
  const configuredTunnelId = (process.env.CLOUDFLARE_TUNNEL_ID || "").trim();
  if (configuredTunnelId && safeConstantTimeCompare(v, configuredTunnelId)) {
    return true;
  }
  return false;
}

export function checkPemCertificateValidity(pemBlock: string, nowMs: number = Date.now()): { valid: boolean; reason?: string } {
  const trimmed = pemBlock.trim();
  if (!trimmed.includes("-----BEGIN CERTIFICATE-----")) {
    // Chave pública crua (PUBLIC KEY / RSA PUBLIC KEY) não possui envelope X.509 de datas
    return { valid: true };
  }
  try {
    const cert = new crypto.X509Certificate(trimmed);
    const validFromMs = Date.parse(cert.validFrom);
    const validToMs = Date.parse(cert.validTo);
    if (Number.isFinite(validFromMs) && nowMs + 60_000 < validFromMs) {
      return { valid: false, reason: "Certificado X.509 RS256 ainda não entrou em vigor (validFrom no futuro)." };
    }
    if (Number.isFinite(validToMs) && nowMs >= validToMs) {
      return { valid: false, reason: "Certificado público RS256 do Cloudflare Access expirado (fail-closed)." };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Certificado X.509 RS256 malformado (fail-closed)." };
  }
}

export interface VerifyAccessJwtOptions {
  expectedIssuer?: string;
  expectedAud?: string;
  expectedClientId?: string;
}

export function verifyCloudflareAccessJwtAssertion(
  jwtToken: string,
  publicKeyPem: string,
  expectedAud?: string,
  expectedClientId?: string,
  expectedIssuer?: string
): { valid: boolean; subject?: string; error?: string } {
  if (!jwtToken || typeof jwtToken !== "string" || !jwtToken.trim()) {
    return { valid: false, error: "Cf-Access-Jwt-Assertion ausente (fail-closed)." };
  }
  if (!publicKeyPem || typeof publicKeyPem !== "string" || !publicKeyPem.trim()) {
    return { valid: false, error: "Chave pública RS256 (CF_ACCESS_JWT_PUBLIC_KEY) ausente ou indisponível (fail-closed)." };
  }
  if (!expectedAud || typeof expectedAud !== "string" || !expectedAud.trim()) {
    return { valid: false, error: "Audience Tag (CF_ACCESS_AUD) obrigatória não configurada no servidor (fail-closed)." };
  }
  if (!expectedIssuer || typeof expectedIssuer !== "string" || !expectedIssuer.trim()) {
    return { valid: false, error: "Issuer (CF_ACCESS_ISSUER / CF_ACCESS_TEAM_DOMAIN) obrigatório não configurado no servidor (fail-closed)." };
  }

  if (expectedClientId && isTunnelUuidInsteadOfClientId(expectedClientId)) {
    return {
      valid: false,
      error: "CF_ACCESS_CLIENT_ID inválido: contém um UUID de túnel em vez de um Service Token Client ID (*.access) (fail-closed)."
    };
  }

  const normalizedExpectedIssuer = expectedIssuer.trim().replace(/\/$/, "");
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(normalizedExpectedIssuer)) {
    return { valid: false, error: "Formato de CF_ACCESS_ISSUER inválido (esperado https://<team>.cloudflareaccess.com)." };
  }

  const parts = jwtToken.trim().split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return { valid: false, error: "Cf-Access-Jwt-Assertion malformado (esperado 3 segmentos não-vazios)." };
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (!header || typeof header !== "object" || header.alg !== "RS256") {
      return { valid: false, error: `Algoritmo JWT Access inválido ou não permitido: ${String(header?.alg)}` };
    }
    if (header.typ && String(header.typ).toUpperCase() !== "JWT") {
      return { valid: false, error: `Tipo de cabeçalho JWT inválido: ${String(header.typ)}` };
    }

    const normalizedPem = publicKeyPem.replace(/\\n/g, "\n").trim();
    const pemBlocks = normalizedPem.match(
      /-----BEGIN (?:PUBLIC KEY|RSA PUBLIC KEY|CERTIFICATE)-----[\s\S]*?-----END (?:PUBLIC KEY|RSA PUBLIC KEY|CERTIFICATE)-----/g
    ) || [normalizedPem];

    const signedData = Buffer.from(`${parts[0]}.${parts[1]}`, "utf8");
    const signatureBuf = Buffer.from(parts[2], "base64url");

    let signatureValid = false;
    let expiredCertReason: string | undefined;
    for (const block of pemBlocks) {
      const certCheck = checkPemCertificateValidity(block);
      if (!certCheck.valid) {
        expiredCertReason = certCheck.reason;
        continue;
      }
      try {
        if (crypto.verify("RSA-SHA256", signedData, block.trim(), signatureBuf)) {
          signatureValid = true;
          break;
        }
      } catch {
        // Tenta o próximo certificado/chave pública caso exista rotação ativa de chaves (kid)
      }
    }

    if (!signatureValid) {
      return {
        valid: false,
        error: expiredCertReason || "Assinatura criptográfica RS256 do Cf-Access-Jwt-Assertion inválida (fail-closed)."
      };
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload || typeof payload !== "object") {
      return { valid: false, error: "Payload do Cf-Access-Jwt-Assertion inválido (fail-closed)." };
    }

    const nowSec = Math.floor(Date.now() / 1000);

    // 1. Expiração (exp) OBRIGATÓRIA (Fail-Closed)
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return { valid: false, error: "Claim 'exp' obrigatória ausente no Cf-Access-Jwt-Assertion (fail-closed)." };
    }
    if (nowSec >= payload.exp) {
      return { valid: false, error: "Cf-Access-Jwt-Assertion expirado (fail-closed)." };
    }

    // 2. Validação temporal de iat (OBRIGATÓRIA) e nbf
    if (typeof payload.iat !== "number" || !Number.isFinite(payload.iat) || payload.iat <= 0) {
      return { valid: false, error: "Claim 'iat' obrigatória ausente ou inválida no Cf-Access-Jwt-Assertion (fail-closed)." };
    }
    if (payload.iat > nowSec + 30) {
      return { valid: false, error: "Claim 'iat' no futuro inválida no Cf-Access-Jwt-Assertion (fail-closed)." };
    }
    if (payload.iat >= payload.exp) {
      return { valid: false, error: "Claim 'iat' maior ou igual a 'exp' no Cf-Access-Jwt-Assertion (fail-closed)." };
    }
    if (payload.nbf !== undefined) {
      if (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf) || nowSec + 30 < payload.nbf) {
        return { valid: false, error: "Cf-Access-Jwt-Assertion ainda não válido (nbf fail-closed)." };
      }
    }

    // 3. Issuer (iss) OBRIGATÓRIO (Fail-Closed)
    if (typeof payload.iss !== "string" || !payload.iss.trim()) {
      return { valid: false, error: "Claim 'iss' obrigatória ausente no Cf-Access-Jwt-Assertion (fail-closed)." };
    }
    const normalizedTokenIss = payload.iss.trim().replace(/\/$/, "");
    if (!safeConstantTimeCompare(normalizedTokenIss, normalizedExpectedIssuer)) {
      return { valid: false, error: "Claim 'iss' do Cf-Access-Jwt-Assertion não corresponde ao domínio Cloudflare Access autorizado (fail-closed)." };
    }

    // 4. Audience (aud) OBRIGATÓRIO (Fail-Closed)
    if (!payload.aud) {
      return { valid: false, error: "Claim 'aud' obrigatória ausente no Cf-Access-Jwt-Assertion (fail-closed)." };
    }
    const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const audMatch = audList.some(
      (a: unknown) => typeof a === "string" && a.trim().length > 0 && safeConstantTimeCompare(a.trim(), expectedAud.trim())
    );
    if (!audMatch) {
      return { valid: false, error: "Claim 'aud' do Cf-Access-Jwt-Assertion não corresponde à aplicação Access autorizada (fail-closed)." };
    }

    // 5. Vinculação estrita ao Service Token Client ID (common_name) quando configurado
    if (expectedClientId) {
      if (typeof payload.common_name !== "string" || !payload.common_name.trim()) {
        return { valid: false, error: "Claim 'common_name' ausente no Cf-Access-Jwt-Assertion para Service Auth (fail-closed)." };
      }
      if (!safeConstantTimeCompare(payload.common_name.trim(), expectedClientId.trim())) {
        return { valid: false, error: "Claim 'common_name' do Cf-Access-Jwt-Assertion não corresponde ao Service Token autorizado (fail-closed)." };
      }
    }

    const subject = String(payload.common_name || payload.sub || "cf_access_jwt").slice(0, 16);
    return { valid: true, subject };
  } catch {
    return { valid: false, error: "Falha estrutural ou criptográfica na verificação do Cf-Access-Jwt-Assertion (fail-closed)." };
  }
}

function resolveExpectedCloudflareIssuer(): string {
  const explicitIssuer = (process.env.CF_ACCESS_ISSUER || "").trim();
  if (explicitIssuer) return explicitIssuer.replace(/\/$/, "");
  const teamDomain = (process.env.CF_ACCESS_TEAM_DOMAIN || "").trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  if (!teamDomain) return "";
  return teamDomain.endsWith(".cloudflareaccess.com")
    ? `https://${teamDomain}`
    : `https://${teamDomain}.cloudflareaccess.com`;
}

function validateCloudflareAccessLayer(req: http.IncomingMessage): { valid: boolean; userId?: string; error?: string } {
  const expectedClientId = (process.env.CF_ACCESS_CLIENT_ID || "").trim();
  const expectedClientSecret = (process.env.CF_ACCESS_CLIENT_SECRET || "").trim();
  const publicKeyPem = (process.env.CF_ACCESS_JWT_PUBLIC_KEY || "").trim();
  const expectedAud = (process.env.CF_ACCESS_AUD || "").trim();
  const expectedIssuer = resolveExpectedCloudflareIssuer();
  const requireJwt = (process.env.CF_ACCESS_REQUIRE_JWT || "").trim().toLowerCase() === "true";

  // Rejeita imediatamente credenciais sintéticas locais ou placeholders pendentes (Fail-Closed)
  const rawTeam = (process.env.CF_ACCESS_TEAM_DOMAIN || "").trim();
  const rawIss = (process.env.CF_ACCESS_ISSUER || "").trim();
  if (
    (expectedAud && isSyntheticOrPlaceholderAccessCredential(expectedAud)) ||
    (rawTeam && isSyntheticOrPlaceholderAccessCredential(rawTeam)) ||
    (rawIss && isSyntheticOrPlaceholderAccessCredential(rawIss))
  ) {
    return {
      valid: false,
      error: "Configuração do Cloudflare Access (Team Domain / AUD) pendente no cofre local (fail-closed)."
    };
  }
  if (expectedClientId && isSyntheticOrPlaceholderAccessCredential(expectedClientId)) {
    return {
      valid: false,
      error: "CF_ACCESS_CLIENT_ID contém valor sintético local ou pendente. Exige Service Token real emitido pela Cloudflare (fail-closed)."
    };
  }
  if (expectedClientId && isTunnelUuidInsteadOfClientId(expectedClientId)) {
    return {
      valid: false,
      error: "CF_ACCESS_CLIENT_ID inválido: contém um UUID de túnel em vez de um Service Token Client ID (*.access) (fail-closed)."
    };
  }
  if (expectedClientSecret && isSyntheticOrPlaceholderAccessCredential(expectedClientSecret)) {
    return {
      valid: false,
      error: "CF_ACCESS_CLIENT_SECRET contém valor sintético local ou pendente. Exige Service Token real emitido pela Cloudflare (fail-closed)."
    };
  }

  const jwtAssertion = String(req.headers["cf-access-jwt-assertion"] || "").trim();
  const reqClientId = String(req.headers["cf-access-client-id"] || "").trim();
  const reqClientSecret = String(req.headers["cf-access-client-secret"] || "").trim();

  // Caso 1: Validação criptográfica estrita RS256 do JWT Access (Protect with Access / JWKS PEM)
  // Se AUD/Issuer/PublicKey estiverem configurados (e não houver Client Secret local no servidor), exige JWT obrigatoriamente
  const isJwtVerificationConfigured = Boolean(
    publicKeyPem || requireJwt || jwtAssertion || ((expectedAud || expectedIssuer) && !expectedClientSecret)
  );
  if (isJwtVerificationConfigured) {
    const jwtResult = verifyCloudflareAccessJwtAssertion(
      jwtAssertion,
      publicKeyPem,
      expectedAud,
      expectedClientId || undefined,
      expectedIssuer
    );
    if (!jwtResult.valid) {
      return { valid: false, error: jwtResult.error };
    }
    if (reqClientId && expectedClientId && !safeConstantTimeCompare(reqClientId, expectedClientId)) {
      return { valid: false, error: "CF-Access-Client-Id inválido." };
    }
    if (reqClientSecret && expectedClientSecret && !safeConstantTimeCompare(reqClientSecret, expectedClientSecret)) {
      return { valid: false, error: "CF-Access-Client-Secret inválido." };
    }
    return { valid: true, userId: `cf_jwt_${jwtResult.subject}` };
  }

  // Caso 2: Validação direta do Service Token emitido pela Cloudflare (CF-Access-Client-Id / CF-Access-Client-Secret)
  if (!expectedClientId || !expectedClientSecret) {
    return {
      valid: false,
      error: "Credenciais de serviço do Cloudflare Access não configuradas no servidor (fail-closed)."
    };
  }

  if (!reqClientId || !reqClientSecret) {
    return {
      valid: false,
      error: "Cabeçalhos do Cloudflare Access Service Token (CF-Access-Client-Id / CF-Access-Client-Secret) ausentes (fail-closed)."
    };
  }

  const idValid = safeConstantTimeCompare(reqClientId, expectedClientId);
  const secretValid = safeConstantTimeCompare(reqClientSecret, expectedClientSecret);

  if (!idValid || !secretValid) {
    return {
      valid: false,
      error: "Credenciais de serviço do Cloudflare Access inválidas (fail-closed)."
    };
  }

  return { valid: true, userId: `cf_service_${reqClientId.slice(0, 8)}` };
}

export function validateGatewayAuth(
  req: http.IncomingMessage,
  mode: GatewayAuthMode = "INTERNAL_DEV"
): AuthValidationResult {
  const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
  const hasCloudflareHeaders = Boolean(
    req.headers["cf-ray"] ||
    req.headers["cf-connecting-ip"] ||
    req.headers["cf-access-client-id"] ||
    req.headers["cf-access-jwt-assertion"]
  );

  // 1. Em modo INTERNAL_DEV: restrito a chamadas de loopback / dev local
  if (mode === "INTERNAL_DEV") {
    if (nodeEnv === "production" || nodeEnv === "staging") {
      return {
        authenticated: false,
        error: "Modo de autenticação INTERNAL_DEV é estritamente proibido em ambientes de produção e homologação."
      };
    }

    if (hasCloudflareHeaders) {
      return {
        authenticated: false,
        error: "Acesso externo via Cloudflare Tunnel detectado: modo INTERNAL_DEV não é permitido para tráfego público/túnel."
      };
    }

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

  // 2. Em modo BEARER_TOKEN: autenticação estrita via Bearer token
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

    if (isRevokedDevelopmentToken(expectedToken)) {
      return {
        authenticated: false,
        error: "Token de desenvolvimento legado revogado e proibido no servidor."
      };
    }

    const token = extractBearerToken(req);
    if (!token) {
      return {
        authenticated: false,
        error: "Token Bearer não fornecido no cabeçalho Authorization."
      };
    }

    if (isRevokedDevelopmentToken(token)) {
      return {
        authenticated: false,
        error: "Token de desenvolvimento legado revogado e proibido."
      };
    }

    if (!safeConstantTimeCompare(token, expectedToken)) {
      return { authenticated: false, error: "Token de autenticação inválido." };
    }

    return { authenticated: true, userId: "gateway_bearer_user" };
  }

  // 3. Em modo CLOUDFLARE_ACCESS: validação de Service Token ou JWT Assertion do Cloudflare Access
  if (mode === "CLOUDFLARE_ACCESS") {
    const cfCheck = validateCloudflareAccessLayer(req);
    if (!cfCheck.valid) {
      return { authenticated: false, error: cfCheck.error };
    }
    return { authenticated: true, userId: cfCheck.userId };
  }

  // 4. Em modo HYBRID_AUTH: defesa em profundidade exigindo AMBOS (Cloudflare Access E Bearer Token independente)
  if (mode === "HYBRID_AUTH") {
    const expectedBearerToken = (
      process.env.AETERNUM_AI_GATEWAY_TOKEN ||
      process.env.GATEWAY_AUTH_TOKEN ||
      ""
    ).trim();

    const hasCfConfig = Boolean(
      process.env.CF_ACCESS_JWT_PUBLIC_KEY ||
      (process.env.CF_ACCESS_AUD && (process.env.CF_ACCESS_ISSUER || process.env.CF_ACCESS_TEAM_DOMAIN)) ||
      (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET)
    );

    if (!hasCfConfig || !expectedBearerToken) {
      return {
        authenticated: false,
        error: "Configuração incompleta para HYBRID_AUTH: CF_ACCESS e GATEWAY_TOKEN são obrigatórios no servidor."
      };
    }

    if (isRevokedDevelopmentToken(expectedBearerToken)) {
      return {
        authenticated: false,
        error: "Token de desenvolvimento legado revogado e proibido em modo HYBRID_AUTH."
      };
    }

    const token = extractBearerToken(req);
    if (!token) {
      return {
        authenticated: false,
        error: "Cabeçalho Authorization Bearer ausente em modo HYBRID_AUTH."
      };
    }

    if (isRevokedDevelopmentToken(token)) {
      return {
        authenticated: false,
        error: "Token de desenvolvimento legado revogado e proibido."
      };
    }

    const cfCheck = validateCloudflareAccessLayer(req);
    const bearerValid = safeConstantTimeCompare(token, expectedBearerToken);

    if (!cfCheck.valid || !bearerValid) {
      return {
        authenticated: false,
        error: cfCheck.valid
          ? "Falha na validação de autenticação híbrida (Bearer Token inválido)."
          : `Falha na validação de autenticação híbrida (${cfCheck.error || "Cloudflare Access inválido"}).`
      };
    }

    return { authenticated: true, userId: `hybrid_${cfCheck.userId}` };
  }

  // 5. Em modo SUPABASE_JWT: verificação criptográfica obrigatória
  if (mode === "SUPABASE_JWT") {
    const jwtSecret = (process.env.SUPABASE_JWT_SECRET || "").trim();
    if (!jwtSecret) {
      return {
        authenticated: false,
        error: "Modo SUPABASE_JWT exige chave criptográfica configurada no servidor para validação de assinatura."
      };
    }

    const token = extractBearerToken(req);
    if (!token) {
      return {
        authenticated: false,
        error: "Token JWT não fornecido no cabeçalho Authorization."
      };
    }

    // Validação de formato básico de 3 partes do JWT (header.payload.signature)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        authenticated: false,
        error: "Token JWT com formato malformado (deve conter 3 segmentos)."
      };
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", jwtSecret)
        .update(`${parts[0]}.${parts[1]}`)
        .digest("base64url");

      if (!safeConstantTimeCompare(parts[2], expectedSignature)) {
        return { authenticated: false, error: "Assinatura do JWT inválida." };
      }

      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return { authenticated: false, error: "Token JWT expirado." };
      }

      return { authenticated: true, userId: payload.sub || "jwt_user" };
    } catch {
      return { authenticated: false, error: "Falha ao decodificar token JWT." };
    }
  }

  // 6. Em modo DISABLED: estritamente bloqueado em ambientes de produção, homologação ou túnel
  if (mode === "DISABLED") {
    if (nodeEnv === "production" || nodeEnv === "staging" || hasCloudflareHeaders) {
      return {
        authenticated: false,
        error: "Modo de autenticação DISABLED proibido em ambientes de produção, homologação ou através de túnel público."
      };
    }
    return { authenticated: true };
  }

  return { authenticated: false, error: "Modo de autenticação inválido." };
}


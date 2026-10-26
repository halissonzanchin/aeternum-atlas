import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import http from "node:http";
import { validateGatewayAuth, verifyCloudflareAccessJwtAssertion } from "../../packages/aeternum-vita/src/gateway/middleware/auth.ts";

const vaultPath = path.join(os.homedir(), ".cloudflared", ".gateway.env");
const certCachePath = path.join(os.homedir(), ".cloudflared", ".cf_access_public_certs.pem");

const vault = {};
for (const line of fs.readFileSync(vaultPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx > 0) {
    vault[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
}

console.log("=================================================================");
console.log("  FASE 3E: AUDITORIA DE PRONTIDAO DE AUTENTICACAO (ZERO LEAK)    ");
console.log("=================================================================");

// 1. Verificar os 4 campos Cloudflare + Bearer + Ausencia de Client Secret
const c1_token = Boolean(vault.CLOUDFLARE_TUNNEL_TOKEN && /^eyJ[A-Za-z0-9_\-\.=]{40,}$/.test(vault.CLOUDFLARE_TUNNEL_TOKEN));
const c1_aud = Boolean(vault.CF_ACCESS_AUD && /^[a-fA-F0-9]{32,128}$/.test(vault.CF_ACCESS_AUD));
const c1_team = Boolean(vault.CF_ACCESS_TEAM_DOMAIN && /^(https:\/\/)?[a-z0-9-]+\.cloudflareaccess\.com\/?$/i.test(vault.CF_ACCESS_TEAM_DOMAIN));
const c1_cid = Boolean(vault.CF_ACCESS_CLIENT_ID && vault.CF_ACCESS_CLIENT_ID.endsWith(".access"));
const c1_bearer = Boolean(vault.AETERNUM_AI_GATEWAY_TOKEN && vault.AETERNUM_AI_GATEWAY_TOKEN.length >= 32);
const c1_noSecret = !("CF_ACCESS_CLIENT_SECRET" in vault);
const check1Pass = c1_token && c1_aud && c1_team && c1_cid && c1_bearer && c1_noSecret;

console.log(`[Item 1] 4 Campos Cloudflare + Ausencia Secret : [${check1Pass ? "PASS" : "FAIL"}]`);
console.log(`         - CLOUDFLARE_TUNNEL_TOKEN : ${c1_token ? "PASS" : "FAIL"} (len=${vault.CLOUDFLARE_TUNNEL_TOKEN?.length || 0})`);
console.log(`         - CF_ACCESS_AUD           : ${c1_aud ? "PASS" : "FAIL"} (len=${vault.CF_ACCESS_AUD?.length || 0})`);
console.log(`         - CF_ACCESS_TEAM_DOMAIN   : ${c1_team ? "PASS" : "FAIL"} (len=${vault.CF_ACCESS_TEAM_DOMAIN?.length || 0}, startsWithHttps=${vault.CF_ACCESS_TEAM_DOMAIN?.startsWith("https://")})`);
console.log(`         - CF_ACCESS_CLIENT_ID     : ${c1_cid ? "PASS" : "FAIL"} (len=${vault.CF_ACCESS_CLIENT_ID?.length || 0}, suffix=.access)`);
console.log(`         - CF_ACCESS_CLIENT_SECRET : ${c1_noSecret ? "PASS (Ausente no notebook)" : "FAIL"}`);

// 2. Confirmar que auth.ts interpreta corretamente Team Domain com https://, AUD e Client ID + Certificados RS256 reais
const cachedPem = fs.existsSync(certCachePath) ? fs.readFileSync(certCachePath, "utf8").trim() : "";
const pemBlocks = cachedPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];

// Configurar process.env exatamente como no cofre para testar validateGatewayAuth(req, "HYBRID_AUTH")
process.env.CF_ACCESS_TEAM_DOMAIN = vault.CF_ACCESS_TEAM_DOMAIN; // Inclui https://
delete process.env.CF_ACCESS_ISSUER; // Forca resolveExpectedCloudflareIssuer() a usar CF_ACCESS_TEAM_DOMAIN com https://
process.env.CF_ACCESS_AUD = vault.CF_ACCESS_AUD;
process.env.CF_ACCESS_CLIENT_ID = vault.CF_ACCESS_CLIENT_ID;
process.env.CF_ACCESS_REQUIRE_JWT = "true";
process.env.AETERNUM_AI_GATEWAY_TOKEN = vault.AETERNUM_AI_GATEWAY_TOKEN;

const { publicKey: testPubPem, privateKey: testPrivPem } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" }
});

// Combina os 2 certificados reais da Cloudflare com 1 chave de teste em memoria para provar o ciclo criptografico completo com os valores reais de Team Domain, AUD e Client ID
process.env.CF_ACCESS_JWT_PUBLIC_KEY = `${cachedPem}\n${testPubPem}`;

const signJwt = (payload, privKey = testPrivPem) => {
  const h = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const s = crypto.sign("RSA-SHA256", Buffer.from(`${h}.${p}`), privKey).toString("base64url");
  return `${h}.${p}.${s}`;
};

const normalizedTeamIssuer = vault.CF_ACCESS_TEAM_DOMAIN.replace(/\/$/, "");
const nowSec = Math.floor(Date.now() / 1000);

const validClaimsJwt = signJwt({
  aud: [vault.CF_ACCESS_AUD],
  iss: normalizedTeamIssuer,
  common_name: vault.CF_ACCESS_CLIENT_ID,
  exp: nowSec + 3600,
  iat: nowSec - 5,
  nbf: nowSec - 5,
  sub: "",
  type: "app"
});

const makeMockReq = (headers) => ({
  headers,
  socket: { remoteAddress: "127.0.0.1" }
});

const authValid = validateGatewayAuth(
  makeMockReq({
    "cf-access-jwt-assertion": validClaimsJwt,
    "authorization": `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN}`
  }),
  "HYBRID_AUTH"
);

const check2Pass = pemBlocks.length === 2 && authValid.authenticated === true;
console.log(`[Item 2] Interpretacao https:// Team Domain + AUD + Client ID : [${check2Pass ? "PASS" : "FAIL"}] (Certs RS256 Cloudflare=${pemBlocks.length}, AuthResult=${authValid.authenticated})`);

// 3. Validar RS256 signature, issuer, audience, expiracao e common_name (Rejeicao Fail-Closed de cada violacao)
const { privateKey: wrongPrivPem } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" }
});

const badSigJwt = signJwt({ aud: [vault.CF_ACCESS_AUD], iss: normalizedTeamIssuer, common_name: vault.CF_ACCESS_CLIENT_ID, exp: nowSec + 3600, iat: nowSec - 5 }, wrongPrivPem);
const badIssJwt = signJwt({ aud: [vault.CF_ACCESS_AUD], iss: "https://wrong-team.cloudflareaccess.com", common_name: vault.CF_ACCESS_CLIENT_ID, exp: nowSec + 3600, iat: nowSec - 5 });
const badAudJwt = signJwt({ aud: ["0000000000000000000000000000000000000000000000000000000000000000"], iss: normalizedTeamIssuer, common_name: vault.CF_ACCESS_CLIENT_ID, exp: nowSec + 3600, iat: nowSec - 5 });
const expiredJwt = signJwt({ aud: [vault.CF_ACCESS_AUD], iss: normalizedTeamIssuer, common_name: vault.CF_ACCESS_CLIENT_ID, exp: nowSec - 10, iat: nowSec - 60 });
const noExpJwt = signJwt({ aud: [vault.CF_ACCESS_AUD], iss: normalizedTeamIssuer, common_name: vault.CF_ACCESS_CLIENT_ID, iat: nowSec - 5 });
const noIatJwt = signJwt({ aud: [vault.CF_ACCESS_AUD], iss: normalizedTeamIssuer, common_name: vault.CF_ACCESS_CLIENT_ID, exp: nowSec + 3600 });
const badCnJwt = signJwt({ aud: [vault.CF_ACCESS_AUD], iss: normalizedTeamIssuer, common_name: "wrong-client-id.access", exp: nowSec + 3600, iat: nowSec - 5 });

const rBadSig = verifyCloudflareAccessJwtAssertion(badSigJwt, cachedPem, vault.CF_ACCESS_AUD, vault.CF_ACCESS_CLIENT_ID, normalizedTeamIssuer);
const rBadIss = verifyCloudflareAccessJwtAssertion(badIssJwt, process.env.CF_ACCESS_JWT_PUBLIC_KEY, vault.CF_ACCESS_AUD, vault.CF_ACCESS_CLIENT_ID, normalizedTeamIssuer);
const rBadAud = verifyCloudflareAccessJwtAssertion(badAudJwt, process.env.CF_ACCESS_JWT_PUBLIC_KEY, vault.CF_ACCESS_AUD, vault.CF_ACCESS_CLIENT_ID, normalizedTeamIssuer);
const rExpired = verifyCloudflareAccessJwtAssertion(expiredJwt, process.env.CF_ACCESS_JWT_PUBLIC_KEY, vault.CF_ACCESS_AUD, vault.CF_ACCESS_CLIENT_ID, normalizedTeamIssuer);
const rNoExp = verifyCloudflareAccessJwtAssertion(noExpJwt, process.env.CF_ACCESS_JWT_PUBLIC_KEY, vault.CF_ACCESS_AUD, vault.CF_ACCESS_CLIENT_ID, normalizedTeamIssuer);
const rNoIat = verifyCloudflareAccessJwtAssertion(noIatJwt, process.env.CF_ACCESS_JWT_PUBLIC_KEY, vault.CF_ACCESS_AUD, vault.CF_ACCESS_CLIENT_ID, normalizedTeamIssuer);
const rBadCn = verifyCloudflareAccessJwtAssertion(badCnJwt, process.env.CF_ACCESS_JWT_PUBLIC_KEY, vault.CF_ACCESS_AUD, vault.CF_ACCESS_CLIENT_ID, normalizedTeamIssuer);
const rTunnelUuid = verifyCloudflareAccessJwtAssertion(validClaimsJwt, process.env.CF_ACCESS_JWT_PUBLIC_KEY, vault.CF_ACCESS_AUD, "b1fd6c11-0405-4cae-9f86-a986a99bc0b3", normalizedTeamIssuer);

const check3Pass = !rBadSig.valid && !rBadIss.valid && !rBadAud.valid && !rExpired.valid && !rNoExp.valid && !rNoIat.valid && !rBadCn.valid && !rTunnelUuid.valid;
console.log(`[Item 3] Validacao RS256, iss, aud, exp, iat, common_name e Tunnel UUID (Fail-Closed): [${check3Pass ? "PASS" : "FAIL"}]`);
console.log(`         - Assinatura RS256 invalida contra Certs Reais CF -> Bloqueado (${rBadSig.error})`);
console.log(`         - Claim 'iss' divergente                          -> Bloqueado (${rBadIss.error})`);
console.log(`         - Claim 'aud' divergente                          -> Bloqueado (${rBadAud.error})`);
console.log(`         - Claim 'exp' expirada ou ausente                 -> Bloqueado (${rExpired.error})`);
console.log(`         - Claim 'iat' ausente ou no futuro                -> Bloqueado (${rNoIat.error})`);
console.log(`         - Claim 'common_name' divergente do Client ID     -> Bloqueado (${rBadCn.error})`);
console.log(`         - Tunnel UUID no lugar de Client ID               -> Bloqueado (${rTunnelUuid.error})`);

// 4 & 5. Testar o processo ATIVO do Gateway em http://127.0.0.1:8081 para comprovar carregamento das variaveis e Fail-Closed independente
const resNoHeaders = await fetch("http://127.0.0.1:8081/v1/llm/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] })
});

const resOnlyBearer = await fetch("http://127.0.0.1:8081/v1/llm/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN}`
  },
  body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] })
});
const bodyOnlyBearer = await resOnlyBearer.json();

const resForgedJwt = await fetch("http://127.0.0.1:8081/v1/llm/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Cf-Access-Jwt-Assertion": badSigJwt,
    "Authorization": `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN}`
  },
  body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] })
});
const bodyForgedJwt = await resForgedJwt.json();

const resBadBearer = await fetch("http://127.0.0.1:8081/v1/llm/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Cf-Access-Jwt-Assertion": badSigJwt,
    "Authorization": "Bearer invalid-independent-bearer-token"
  },
  body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] })
});

const check4Pass =
  resNoHeaders.status === 401 &&
  resOnlyBearer.status === 401 &&
  resForgedJwt.status === 401 &&
  resBadBearer.status === 401;

// Se o processo ativo do Gateway respondeu "Assinatura criptográfica RS256 do Cf-Access-Jwt-Assertion inválida",
// significa que ele ja carregou CF_ACCESS_JWT_PUBLIC_KEY, CF_ACCESS_AUD e CF_ACCESS_ISSUER do novo .gateway.env!
const check5Pass =
  check4Pass &&
  String(bodyForgedJwt?.error?.message || "").includes("Assinatura criptográfica RS256 do Cf-Access-Jwt-Assertion inválida");

console.log(`[Item 4] Bearer Independente & HYBRID_AUTH Fail-Closed (Porta 8081): [${check4Pass ? "PASS" : "FAIL"}]`);
console.log(`         - Sem credenciais -> HTTP ${resNoHeaders.status}`);
console.log(`         - Apenas Bearer valido (sem JWT Access) -> HTTP ${resOnlyBearer.status} (${bodyOnlyBearer?.error?.message})`);
console.log(`         - Bearer invalido -> HTTP ${resBadBearer.status}`);
console.log(`[Item 5] Processo Ativo do Gateway (8081) c/ Variaveis e Certs Reais: [${check5Pass ? "PASS" : "FAIL"}]`);
console.log(`         - Resposta do Gateway ativo ao JWT nao assinado pela CF: "${bodyForgedJwt?.error?.message}"`);
console.log("=================================================================");

if (!check1Pass || !check2Pass || !check3Pass || !check4Pass || !check5Pass) {
  process.exit(1);
}

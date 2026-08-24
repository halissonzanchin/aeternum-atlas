import { RoomAgentDispatch, RoomConfiguration, TrackSource } from "npm:@livekit/protocol@1.50.4";
import { AccessToken } from "npm:livekit-server-sdk@2.17.0";
import { createClient } from "npm:@supabase/supabase-js@2.105.4";

const ALLOWED_TUTORS = new Set(["eduardo", "antonia", "ariana", "fabian"]);
const MAX_REQUEST_BYTES = 2_048;

function allowedOrigins(): string[] {
  const configured = (Deno.env.get("AETERNUM_ALLOWED_ORIGINS") || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([
    ...configured,
    "https://aeternumatlas.com",
    "https://www.aeternumatlas.com",
    "https://aeternum-atlas.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
  ])];
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (allowedOrigins().includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === "https:") {
      return url.hostname === "aeternumatlas.com"
        || url.hostname.endsWith(".aeternumatlas.com")
        || url.hostname === "aeternum-atlas.vercel.app";
    }
    if (url.protocol === "http:") {
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    }
    return false;
  } catch {
    return false;
  }
}

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isAllowedOrigin(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
}

function jsonResponse(req: Request, body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" }
  });
}

function requiredAnyEnv(names: string[]): string {
  for (const name of names) {
    const val = Deno.env.get(name)?.trim();
    if (val) return val;
  }
  throw new Error(`Configuração obrigatória ausente no servidor (nenhuma das variáveis encontrada: ${names.join(", ")})`);
}

function requiredEnv(name: string): string {
  return requiredAnyEnv([name]);
}

async function resolveSecret(name: string, adminClient: any, aliases: string[] = []): Promise<string> {
  const allNames = [name, ...aliases];
  for (const n of allNames) {
    const envVal = Deno.env.get(n)?.trim();
    if (envVal) return envVal;
  }

  for (const n of allNames) {
    try {
      const { data, error } = await adminClient.rpc("get_system_secret", { p_name: n });
      if (!error && data && String(data).trim()) {
        return String(data).trim();
      }
    } catch {}
  }

  throw new Error(`Configuração obrigatória ausente no servidor (nenhuma das chaves encontrada: ${allNames.join(", ")})`);
}

function bearerToken(req: Request): string {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function shortHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .slice(0, 10)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (origin && !isAllowedOrigin(origin)) {
    return jsonResponse(req, { error: "Origem não autorizada.", code: "ORIGIN_DENIED" }, 403);
  }

  if (req.method === "OPTIONS") {
    if (origin && !isAllowedOrigin(origin)) {
      return jsonResponse(req, { error: "Origem não autorizada.", code: "ORIGIN_DENIED" }, 403);
    }
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Método não permitido.", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse(req, { error: "Requisição excede o limite permitido.", code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  // ==========================================
  // FAIL-CLOSED AUTHENTICATION GATE (P0)
  // ==========================================
  const accessToken = bearerToken(req);
  if (!accessToken) {
    return jsonResponse(req, {
      error: "Autenticação obrigatória. Usuários anônimos não possuem acesso à tutoria de voz.",
      code: "AUTH_REQUIRED"
    }, 401);
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const supabaseAnonKey = requiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredAnyEnv(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"]);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
    if (authError || !authData?.user?.id) {
      return jsonResponse(req, { error: "Sessão de usuário inválida ou expirada.", code: "AUTH_INVALID" }, 401);
    }
    const userId = authData.user.id;

    // ==========================================
    // FAIL-CLOSED PROFILE VALIDATION
    // ==========================================
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .select("id, status, name, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[voice-token] Erro de infraestrutura ao validar perfil:", profileError.message);
      return jsonResponse(req, {
        error: "Falha de validação de perfil de usuário.",
        code: "PROFILE_CHECK_UNAVAILABLE"
      }, 503);
    }

    if (!profile || !["active", "ativo"].includes(String(profile.status).toLowerCase())) {
      return jsonResponse(req, {
        error: "Perfil não autorizado para sessões de voz.",
        code: "VOICE_PROFILE_DENIED"
      }, 403);
    }

    // ==========================================
    // FAIL-CLOSED RATE LIMITING
    // ==========================================
    const { data: rateRows, error: rateError } = await userClient.rpc("consume_voice_rate_limit");
    if (rateError) {
      console.error("[voice-token] Rate limiter indisponível:", rateError.message);
      return jsonResponse(req, {
        error: "Controle de uso temporariamente indisponível.",
        code: "RATE_LIMIT_UNAVAILABLE"
      }, 503);
    }

    const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
    if (!rate || rate.allowed === false) {
      return jsonResponse(req, {
        error: "Muitas tentativas de iniciar voz. Aguarde e tente novamente.",
        code: "VOICE_RATE_LIMITED",
        retry_after_seconds: rate?.retry_after_seconds || 30
      }, 429);
    }

    const body = await req.json().catch(() => ({}));
    const tutorId = String(body?.tutor_id || "eduardo").toLowerCase();
    if (!ALLOWED_TUTORS.has(tutorId)) {
      return jsonResponse(req, { error: "Tutor de voz inválido.", code: "INVALID_TUTOR" }, 400);
    }

    // ==========================================
    // FAIL-CLOSED LIVEKIT CREDENTIAL RESOLUTION
    // ==========================================
    const livekitUrl = await resolveSecret("LIVEKIT_PUBLIC_URL", adminClient, ["LIVEKIT_URL"]);
    const livekitApiKey = await resolveSecret("LIVEKIT_API_KEY", adminClient);
    const livekitApiSecret = await resolveSecret("LIVEKIT_API_SECRET", adminClient);
    const agentName = Deno.env.get("LIVEKIT_AGENT_NAME") || "aeternum-vita-voice";

    const idempotencyKey = (req.headers.get("idempotency-key") || crypto.randomUUID()).trim();
    const requestHash = await shortHash(`${userId}:${idempotencyKey}`);
    const roomName = `vita-${tutorId}-${requestHash}`;
    const participantIdentity = `student-${userId.slice(0, 8)}-${requestHash}`;
    const participantName = profile.name || authData.user.email?.split("@")[0] || "Estudante Aeternum";

    // Token restrito (10 min TTL, microfone somente)
    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: "10m",
      metadata: JSON.stringify({ tutorId, userId })
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE],
      canSubscribe: true,
      canPublishData: false
    });

    token.roomConfig = new RoomConfiguration({
      agents: [new RoomAgentDispatch({
        agentName,
        metadata: JSON.stringify({ tutorId, userId })
      })]
    });

    return jsonResponse(req, {
      server_url: livekitUrl,
      participant_token: await token.toJwt(),
      room_name: roomName,
      tutor_id: tutorId,
      status: "connected"
    }, 201);
  } catch (error) {
    console.error("[voice-token] Falha de emissão:", error instanceof Error ? error.message : error);
    return jsonResponse(req, {
      error: "Serviço de voz temporariamente indisponível.",
      code: "VOICE_TOKEN_FAILED"
    }, 503);
  }
});

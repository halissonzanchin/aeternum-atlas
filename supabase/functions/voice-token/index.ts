import { RoomAgentDispatch, RoomConfiguration, TrackSource } from "npm:@livekit/protocol@1.50.4";
import { AccessToken } from "npm:livekit-server-sdk@2.17.0";
import { createClient } from "npm:@supabase/supabase-js@2.105.4";

const ALLOWED_TUTORS = new Set(["eduardo", "antonia", "ariana", "fabian"]);
const MAX_REQUEST_BYTES = 2_048;

function allowedOrigins() {
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
    "http://127.0.0.1:5174"
  ])];
}

function isAllowedOrigin(origin: string) {
  if (allowedOrigins().includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === "https:") {
      return url.hostname === "aeternumatlas.com"
        || url.hostname.endsWith(".aeternumatlas.com")
        || url.hostname === "aeternum-atlas.vercel.app";
    }
    return url.protocol === "http:"
      && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "",
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

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Configuração obrigatória ausente: ${name}`);
  return value;
}

function bearerToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function isValidIdempotencyKey(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function shortHash(value: string) {
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
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Método não permitido.", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse(req, { error: "Requisição excede o limite permitido.", code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  const accessToken = bearerToken(req);
  if (!accessToken) {
    return jsonResponse(req, { error: "Autenticação obrigatória.", code: "AUTH_REQUIRED" }, 401);
  }

  const idempotencyKey = (req.headers.get("idempotency-key") || "").trim();
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return jsonResponse(req, { error: "Idempotency-Key inválido.", code: "INVALID_IDEMPOTENCY_KEY" }, 400);
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const supabaseAnonKey = requiredEnv("SUPABASE_ANON_KEY");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return jsonResponse(req, { error: "Sessão inválida ou expirada.", code: "AUTH_INVALID" }, 401);
    }

    const { data: profile, error: profileError } = await userClient
      .from("users")
      .select("status")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError || !profile || !["active", "ativo"].includes(String(profile.status).toLowerCase())) {
      return jsonResponse(req, { error: "Perfil não autorizado para sessões de voz.", code: "VOICE_PROFILE_DENIED" }, 403);
    }

    const { data: rateRows, error: rateError } = await userClient.rpc("consume_voice_rate_limit");
    const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
    if (rateError || !rate) {
      console.error("voice-token rate limit unavailable", rateError?.message || "empty result");
      return jsonResponse(req, { error: "Controle de uso temporariamente indisponível.", code: "RATE_LIMIT_UNAVAILABLE" }, 503);
    }
    if (!rate.allowed) {
      return jsonResponse(req, {
        error: "Muitas tentativas de iniciar voz. Aguarde e tente novamente.",
        code: "VOICE_RATE_LIMITED",
        retry_after_seconds: rate.retry_after_seconds
      }, 429);
    }

    const body = await req.json().catch(() => ({}));
    const tutorId = String(body?.tutor_id || "eduardo").toLowerCase();
    if (!ALLOWED_TUTORS.has(tutorId)) {
      return jsonResponse(req, { error: "Tutor de voz inválido.", code: "INVALID_TUTOR" }, 400);
    }

    const livekitUrl = requiredEnv("LIVEKIT_URL");
    const livekitApiKey = requiredEnv("LIVEKIT_API_KEY");
    const livekitApiSecret = requiredEnv("LIVEKIT_API_SECRET");
    const agentName = requiredEnv("LIVEKIT_AGENT_NAME");
    const requestHash = await shortHash(`${authData.user.id}:${idempotencyKey}`);
    const roomName = `vita-${tutorId}-${requestHash}`;
    const participantIdentity = `student-${authData.user.id.slice(0, 8)}-${requestHash}`;

    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantIdentity,
      name: "Estudante Aeternum",
      ttl: "10m",
      metadata: JSON.stringify({ tutorId })
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
        metadata: JSON.stringify({ tutorId, userId: authData.user.id })
      })]
    });

    return jsonResponse(req, {
      server_url: livekitUrl,
      participant_token: await token.toJwt(),
      room_name: roomName,
      tutor_id: tutorId
    }, 201);
  } catch (error) {
    console.error("voice-token configuration or issuance failure", error instanceof Error ? error.message : error);
    return jsonResponse(req, {
      error: "Serviço de voz temporariamente indisponível.",
      code: "VOICE_TOKEN_FAILED"
    }, 503);
  }
});

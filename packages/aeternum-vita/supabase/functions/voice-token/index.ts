import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.13.3";
import {
  RoomConfiguration,
  TrackSource,
} from "https://esm.sh/@livekit/protocol@1.45.0";

const jsonHeaders = (request: Request) => {
  const allowedOrigin =
    Deno.env.get("VOICE_ALLOWED_ORIGIN") || "https://www.aeternumatlas.com";
  const requestOrigin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin":
      requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, idempotency-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
};

const normalizeTutorId = (
  value: unknown,
): "eduardo" | "antonia" | "ariana" | "fabian" => {
  if (typeof value !== "string") {
    return "eduardo";
  }
  const id = value.toLowerCase();
  if (id === "antonia" || id === "elena") {
    return "antonia";
  }
  if (id === "ariana" || id === "marcus") {
    return "ariana";
  }
  if (id === "fabian" || id === "hannah") {
    return "fabian";
  }
  return "eduardo";
};

serve(async (request: Request) => {
  const headers = jsonHeaders(request);
  const reply = (body: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(body), { status, headers });

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  const agentName = Deno.env.get("LIVEKIT_AGENT_NAME") || "aeternum-vita-voice";
  if (request.method === "GET") {
    return reply({ agentName }, 200);
  }
  if (request.method !== "POST") {
    return reply({ error: "Método não permitido." }, 405);
  }

  try {
    const livekitUrl =
      Deno.env.get("LIVEKIT_PUBLIC_URL") || Deno.env.get("LIVEKIT_URL");
    const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY");
    const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseSecretKey =
      Deno.env.get("SUPABASE_SECRET_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      "";
    const allowGuests = Deno.env.get("VOICE_ALLOW_GUESTS") === "true";

    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return reply(
        { error: "Configuração do LiveKit incompleta no servidor." },
        500,
      );
    }

    if ((!supabaseUrl || !supabaseSecretKey) && !allowGuests) {
      return reply(
        { error: "Validação de identidade indisponível no servidor." },
        500,
      );
    }

    let requestBody: Record<string, unknown> = {};
    try {
      requestBody = (await request.json()) as Record<string, unknown>;
    } catch {
      requestBody = {};
    }

    const roomConfig = requestBody.room_config as
      { agents?: Array<{ agent_name?: string }> } | undefined;
    const requestedAgent = roomConfig?.agents?.[0]?.agent_name;
    if (requestedAgent && requestedAgent !== agentName) {
      return reply({ error: "Agente solicitado não é permitido." }, 400);
    }

    const tutorId = normalizeTutorId(requestBody.tutor_id);
    const authHeader = request.headers.get("Authorization");
    let userId: string | null = null;
    let participantName = "Estudante Aeternum";

    if (authHeader && supabaseUrl && supabaseSecretKey) {
      const supabase = createClient(supabaseUrl, supabaseSecretKey);
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return reply({ error: "Sessão de usuário inválida ou expirada." }, 401);
      }
      userId = user.id;
      participantName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Estudante Aeternum";
    } else if (!allowGuests) {
      return reply({ error: "Autenticação obrigatória." }, 401);
    }

    const idempotencyKey =
      request.headers.get("idempotency-key") || crypto.randomUUID();
    const roomName = `aeternum-sala-${tutorId}-${crypto.randomUUID().slice(0, 12)}`;
    const participantIdentity = userId
      ? `user-${userId}`
      : `guest-${crypto.randomUUID().slice(0, 8)}`;

    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: "10m",
      metadata: JSON.stringify({ tutorId }),
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE],
      canSubscribe: true,
      canPublishData: false,
    });
    token.roomConfig = RoomConfiguration.fromJson(
      { agents: [{ agent_name: agentName }] },
      { ignoreUnknownFields: true },
    );

    const jwtToken = await token.toJwt();
    let sessionId = crypto.randomUUID();

    if (supabaseUrl && supabaseSecretKey) {
      const supabase = createClient(supabaseUrl, supabaseSecretKey);
      const { data, error } = await supabase
        .from("voice_sessions")
        .insert({
          user_id: userId,
          room_name: roomName,
          participant_identity: participantIdentity,
          agent_name: agentName,
          idempotency_key: idempotencyKey,
          status: "active",
          metadata: { tutorId },
        })
        .select("id")
        .single();

      if (error) {
        console.error("Falha ao persistir a sessão de voz.", error);
        return reply(
          { error: "Não foi possível registrar a sessão de voz." },
          500,
        );
      }
      sessionId = data.id;
    }

    return reply(
      {
        server_url: livekitUrl,
        participant_token: jwtToken,
        room_name: roomName,
        session_id: sessionId,
        tutor_id: tutorId,
      },
      201,
    );
  } catch (error) {
    console.error("Erro na emissão do token LiveKit:", error);
    return reply({ error: "Falha interna ao gerar credenciais de voz." }, 500);
  }
});

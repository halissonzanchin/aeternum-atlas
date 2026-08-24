import { RoomConfiguration, TrackSource } from "@livekit/protocol";
import { AccessToken } from "livekit-server-sdk";
import { randomUUID } from "node:crypto";

type TutorId = "eduardo" | "antonia" | "ariana" | "fabian";

export const normalizeTutorId = (id?: string): TutorId => {
  if (!id) {
    return "eduardo";
  }
  const lower = id.toLowerCase();
  if (lower === "antonia" || lower === "elena") {
    return "antonia";
  }
  if (lower === "ariana" || lower === "marcus") {
    return "ariana";
  }
  if (lower === "fabian" || lower === "hannah") {
    return "fabian";
  }
  return "eduardo";
};

const responseHeaders = (request: Request) => {
  const allowedOrigin =
    process.env.VOICE_ALLOWED_ORIGIN || "https://www.aeternumatlas.com";
  const requestOrigin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin":
      requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Idempotency-Key",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
};

const proxyToAuthenticatedEdgeFunction = async (
  request: Request,
  endpoint: string,
) => {
  const url = new URL(request.url);
  const body = request.method === "POST" ? await request.text() : "";
  let payload: Record<string, unknown> = {};

  if (body) {
    try {
      payload = JSON.parse(body) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }
  if (!payload.tutor_id && url.searchParams.get("tutor")) {
    payload.tutor_id = url.searchParams.get("tutor");
  }

  const authorization = request.headers.get("Authorization");
  const idempotencyKey = request.headers.get("Idempotency-Key");
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...(process.env.SUPABASE_ANON_KEY
        ? { apikey: process.env.SUPABASE_ANON_KEY }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: responseHeaders(request),
  });
};

export default async (request: Request) => {
  const headers = responseHeaders(request);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const authenticatedEndpoint = process.env.VITA_TOKEN_ENDPOINT?.trim();
  if (authenticatedEndpoint) {
    return proxyToAuthenticatedEdgeFunction(request, authenticatedEndpoint);
  }

  if (process.env.VOICE_ALLOW_GUESTS !== "true") {
    return new Response(
      JSON.stringify({
        error: "Emissão pública desativada. Configure VITA_TOKEN_ENDPOINT.",
      }),
      { status: 503, headers },
    );
  }

  const livekitUrl = process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_URL;
  const livekitApiKey = process.env.LIVEKIT_API_KEY;
  const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
  const agentName = process.env.LIVEKIT_AGENT_NAME || "aeternum-vita-voice";

  if (!livekitApiKey || !livekitApiSecret || !livekitUrl) {
    return new Response(
      JSON.stringify({ error: "Configuração LiveKit incompleta." }),
      {
        status: 500,
        headers,
      },
    );
  }

  try {
    const url = new URL(request.url);
    let requestedTutor = url.searchParams.get("tutor") || undefined;

    if (!requestedTutor && request.method === "POST") {
      try {
        const body = (await request.json()) as { tutor_id?: string };
        requestedTutor = body.tutor_id;
      } catch {
        requestedTutor = undefined;
      }
    }

    const tutorId = normalizeTutorId(requestedTutor);
    const roomName = `aeternum-sala-${tutorId}-${randomUUID()}`;
    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: `estudante-${tutorId}-${randomUUID()}`,
      name: "Estudante Aeternum",
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

    return new Response(
      JSON.stringify({
        server_url: livekitUrl,
        participant_token: await token.toJwt(),
        tutor_id: tutorId,
      }),
      { status: 201, headers },
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Falha ao gerar token de acesso.", details }),
      {
        status: 500,
        headers,
      },
    );
  }
};

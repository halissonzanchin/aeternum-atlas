// Supabase Edge Function: voice-token
// Localização: supabase/functions/voice-token/index.ts
// Descrição: Emissão de token JWT LiveKit para Aeternum Atlas Multi-Tutor Voice AI

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.13.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const agentName = Deno.env.get("LIVEKIT_AGENT_NAME") || "aeternum-vita-voice";
    return new Response(JSON.stringify({ agentName }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const livekitUrl = Deno.env.get("LIVEKIT_URL") || "wss://aeternum-atlas-0c2hve13.livekit.cloud";
    const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY") || "APIFZFEnuspBHzf";
    const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET") || "FuRXef8oZh7WfpY7qJ5YRe5sZzcEn6z1MqRHimKOrI1D";
    const defaultAgentName = Deno.env.get("LIVEKIT_AGENT_NAME") || "aeternum-vita-voice";

    const body = await req.json().catch(() => ({}));
    const tutorId = String(body.tutor_id || body.tutor || "eduardo").toLowerCase();

    const roomName = `aeternum-sala-${tutorId}-${crypto.randomUUID()}`;
    const participantIdentity = `estudante-${tutorId}-${crypto.randomUUID()}`;

    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantIdentity,
      name: "Estudante Aeternum",
      ttl: "15m",
      metadata: JSON.stringify({ tutorId })
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const jwt = await token.toJwt();

    return new Response(
      JSON.stringify({
        server_url: livekitUrl,
        participant_token: jwt,
        room_name: roomName,
        tutor_id: tutorId,
        agent_name: defaultAgentName
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Erro ao emitir token de voz LiveKit." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

import type { Context } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  const agentName = process.env.LIVEKIT_AGENT_NAME || "aeternum-vita-voice";
  const supportedTutors = ["eduardo", "antonia", "ariana", "fabian"];
  const allowedOrigin =
    process.env.VOICE_ALLOWED_ORIGIN || "https://www.aeternumatlas.com";
  const requestOrigin = req.headers.get("Origin");

  return new Response(
    JSON.stringify({
      agentName,
      supportedTutors,
      livekitConfigured: Boolean(
        process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET,
      ),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin":
          requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        Vary: "Origin",
      },
    },
  );
};

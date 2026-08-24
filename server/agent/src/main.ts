import { ServerOptions, cli, defineAgent } from "@livekit/agents";
import { audioEnhancement } from "@livekit/plugins-ai-coustics";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import {
  createTutorAgent,
  createTutorSession,
  getTutorConfig,
  resolveTutorFromJobContext,
  resolveUserIdFromJobContext
} from "./agent.ts";

dotenv.config({ quiet: true });

export default defineAgent({
  entry: async (context) => {
    const tutorId = resolveTutorFromJobContext(context);
    const userId = resolveUserIdFromJobContext(context);
    const config = getTutorConfig(tutorId);

    const session = createTutorSession(tutorId);

    const inputOptions = process.env.AICOOUSTICS_API_KEY
      ? { noiseCancellation: audioEnhancement({ model: "quailVfS" }) }
      : undefined;

    // Connect the job participant before opening provider streams. This avoids
    // STT/TTS WebSocket races observed during Cloud worker cold starts.
    await context.connect();

    await session.start({
      agent: createTutorAgent(tutorId, userId),
      room: context.room,
      record: false,
      inputOptions
    });

    session.generateReply({ instructions: config.greeting });
  }
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: process.env.LIVEKIT_AGENT_NAME?.trim() || "aeternum-vita-voice"
  })
);

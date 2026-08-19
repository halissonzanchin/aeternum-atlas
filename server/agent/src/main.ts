import { ServerOptions, cli, defineAgent } from "@livekit/agents";
import { audioEnhancement } from "@livekit/plugins-ai-coustics";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import {
  createTutorAgent,
  createTutorSession,
  getTutorConfig,
  resolveTutorFromJobContext
} from "./agent.ts";

dotenv.config({ quiet: true });

export default defineAgent({
  entry: async (context) => {
    const tutorId = resolveTutorFromJobContext(context);
    const config = getTutorConfig(tutorId);

    const session = createTutorSession(tutorId);

    const inputOptions = process.env.AICOOUSTICS_API_KEY
      ? { noiseCancellation: audioEnhancement({ model: "quailVfS" }) }
      : undefined;

    await session.start({
      agent: createTutorAgent(tutorId),
      room: context.room,
      record: false,
      inputOptions
    });

    await context.connect();
    session.generateReply({ instructions: config.greeting });
  }
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: process.env.LIVEKIT_AGENT_NAME?.trim() || "aeternum-vita-voice"
  })
);

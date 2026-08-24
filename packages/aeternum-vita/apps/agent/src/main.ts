import { ServerOptions, cli, defineAgent } from "@livekit/agents";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import {
  createTutorAgent,
  createTutorSession,
  getTutorConfig,
  resolveTutorFromJobContext,
} from "./agent.ts";
import { loadVoiceRuntimeConfig } from "./runtime-config.ts";

const rootEnvironmentPath = fileURLToPath(
  new URL("../../../.env.local", import.meta.url),
);

dotenv.config({ path: rootEnvironmentPath, quiet: true });

export default defineAgent({
  entry: async (context) => {
    const tutorId = resolveTutorFromJobContext(context);
    const config = getTutorConfig(tutorId);
    const runtime = loadVoiceRuntimeConfig();

    const session = createTutorSession(tutorId, runtime);

    await session.start({
      agent: createTutorAgent(tutorId, runtime),
      room: context.room,
      record: false,
    });

    await context.connect();
    session.generateReply({ instructions: config.greeting });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: process.env.LIVEKIT_AGENT_NAME?.trim() || "aeternum-vita-voice",
  }),
);

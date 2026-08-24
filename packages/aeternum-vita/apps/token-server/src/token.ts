import { RoomConfiguration, TrackSource } from "@livekit/protocol";
import { randomUUID } from "node:crypto";
import { AccessToken } from "livekit-server-sdk";
import { z } from "zod";
import type { TokenServerConfig } from "./config.ts";

export const SUPPORTED_TUTORS = [
  "eduardo",
  "antonia",
  "ariana",
  "fabian",
  "elena",
  "marcus",
  "hannah",
] as const;

export type TutorId = (typeof SUPPORTED_TUTORS)[number];

export const normalizeTutorId = (
  id?: string,
): "eduardo" | "antonia" | "ariana" | "fabian" => {
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

export const createTokenRequestSchema = () => {
  return z
    .object({
      tutor_id: z.enum(SUPPORTED_TUTORS).optional(),
      room_config: z
        .object({
          agents: z
            .array(
              z
                .object({
                  agent_name: z.string().min(1),
                })
                .passthrough(),
            )
            .optional(),
        })
        .optional(),
    })
    .passthrough();
};

export type TokenResponse = {
  server_url: string;
  participant_token: string;
  tutor_id: string;
};

export const createConnectionDetails = async (
  config: TokenServerConfig,
  tutorId: string = "eduardo",
): Promise<TokenResponse> => {
  const normalizedTutor = normalizeTutorId(tutorId);
  const roomName = `aeternum-sala-${normalizedTutor}-${randomUUID()}`;
  const participantIdentity = `estudante-${normalizedTutor}-${randomUUID()}`;

  const token = new AccessToken(config.livekitApiKey, config.livekitApiSecret, {
    identity: participantIdentity,
    name: "Estudante Aeternum",
    ttl: "10m",
    metadata: JSON.stringify({ tutorId: normalizedTutor }),
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
    { agents: [{ agent_name: config.agentName }] },
    { ignoreUnknownFields: true },
  );

  return {
    server_url: config.livekitPublicUrl,
    participant_token: await token.toJwt(),
    tutor_id: normalizedTutor,
  };
};

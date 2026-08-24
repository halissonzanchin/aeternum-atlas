import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const rootEnvironmentPath = fileURLToPath(
  new URL("../../../.env.local", import.meta.url),
);

dotenv.config({ path: rootEnvironmentPath, quiet: true });

const createOriginSchema = (allowedProtocols: readonly string[]) => {
  return z
    .string()
    .trim()
    .transform((value, context) => {
      let url: URL;

      try {
        url = new URL(value);
      } catch {
        context.addIssue({
          code: "custom",
          message: "deve ser uma URL válida",
        });
        return z.NEVER;
      }

      const containsOnlyOrigin =
        url.pathname === "/" &&
        !url.search &&
        !url.hash &&
        !url.username &&
        !url.password;

      if (
        !allowedProtocols.includes(url.protocol) ||
        !url.hostname ||
        !containsOnlyOrigin
      ) {
        context.addIssue({
          code: "custom",
          message: `deve conter apenas protocolo ${allowedProtocols.join(" ou ")}, host e porta`,
        });
        return z.NEVER;
      }

      return url.origin;
    });
};

const liveKitUrlSchema = createOriginSchema(["ws:", "wss:"]);
const webOriginSchema = createOriginSchema(["http:", "https:"]);

const environmentSchema = z.object({
  LIVEKIT_URL: liveKitUrlSchema,
  LIVEKIT_PUBLIC_URL: liveKitUrlSchema.optional(),
  LIVEKIT_API_KEY: z.string().trim().min(1, "é obrigatória"),
  LIVEKIT_API_SECRET: z.string().trim().min(1, "é obrigatória"),
  LIVEKIT_AGENT_NAME: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .default("aeternum-vita-voice"),
  TOKEN_SERVER_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  WEB_ORIGIN: webOriginSchema.default("http://localhost:5173"),
});

export type TokenServerConfig = {
  livekitUrl: string;
  livekitPublicUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  agentName: string;
  port: number;
  webOrigin: string;
};

export class ConfigurationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Configuração inválida: ${issues.join("; ")}`);
    this.name = "ConfigurationError";
    this.issues = issues;
  }
}

export const loadConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): TokenServerConfig => {
  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    throw new ConfigurationError(
      result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    );
  }

  return {
    livekitUrl: result.data.LIVEKIT_URL,
    livekitPublicUrl: result.data.LIVEKIT_PUBLIC_URL || result.data.LIVEKIT_URL,
    livekitApiKey: result.data.LIVEKIT_API_KEY,
    livekitApiSecret: result.data.LIVEKIT_API_SECRET,
    agentName: result.data.LIVEKIT_AGENT_NAME,
    port: result.data.TOKEN_SERVER_PORT,
    webOrigin: result.data.WEB_ORIGIN,
  };
};

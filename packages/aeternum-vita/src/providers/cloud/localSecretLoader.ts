import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ALLOWED_LOCAL_CLOUD_SECRETS = new Set<string>([
  "GEMINI_API_KEY",
  "DEEPGRAM_API_KEY",
  "CARTESIA_API_KEY"
]);

export interface LoadLocalCloudEnvOptions {
  envFiles?: string[];
  targetEnv?: Record<string, string | undefined>;
}

export function parseAndApplyLocalCloudEnv(
  fileContent: string,
  targetEnv: Record<string, string | undefined> = process.env
): void {
  for (const line of fileContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");

      // 1. ALLOWLIST ENFORCEMENT: Apenas chaves autorizadas explicitamente
      if (!ALLOWED_LOCAL_CLOUD_SECRETS.has(key)) {
        continue;
      }

      // 2. PRECEDENCE ENFORCEMENT: Nunca sobrescrever chave já definida no processo/sessão
      if (!targetEnv[key] && val.length > 0) {
        targetEnv[key] = val;
      }
    }
  }
}

export function loadLocalCloudEnv(options: LoadLocalCloudEnvOptions = {}): void {
  const targetEnv = options.targetEnv ?? process.env;
  
  let baseDir = process.cwd();
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      baseDir = path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // fallback to process.cwd()
  }

  const envFiles = options.envFiles ?? [
    path.resolve(baseDir, "..", "..", "..", ".env.cloud.local"),
    path.resolve(baseDir, "..", "..", "..", ".env.local"),
    path.resolve(baseDir, "..", "..", "..", ".env")
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, "utf8");
      parseAndApplyLocalCloudEnv(content, targetEnv);
    }
  }
}

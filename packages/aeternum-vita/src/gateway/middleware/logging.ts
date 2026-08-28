import { GatewayLogger } from "../types.ts";

export class SafeGatewayLogger implements GatewayLogger {
  private sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> {
    if (!meta) return {};
    const sanitized: Record<string, unknown> = {};

    const BLOCKED_KEYS = new Set([
      "prompt",
      "messages",
      "text",
      "deltatext",
      "audio",
      "audiobuffer",
      "audiobase64",
      "transcript",
      "authorization",
      "apikey",
      "api_key",
      "jwt",
      "token",
      "secret",
      "cookie"
    ]);

    for (const [key, value] of Object.entries(meta)) {
      const lower = key.toLowerCase();
      if (BLOCKED_KEYS.has(lower) || lower.includes("secret") || lower.includes("key") || lower.includes("jwt") || lower.includes("token") || lower.includes("auth")) {
        continue;
      }
      if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeMeta(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  info(event: string, meta?: Record<string, unknown>): void {
    const clean = this.sanitizeMeta(meta);
    console.log(JSON.stringify({ level: "INFO", event, timestamp: new Date().toISOString(), ...clean }));
  }

  warn(event: string, meta?: Record<string, unknown>): void {
    const clean = this.sanitizeMeta(meta);
    console.warn(JSON.stringify({ level: "WARN", event, timestamp: new Date().toISOString(), ...clean }));
  }

  error(event: string, meta?: Record<string, unknown>): void {
    const clean = this.sanitizeMeta(meta);
    console.error(JSON.stringify({ level: "ERROR", event, timestamp: new Date().toISOString(), ...clean }));
  }
}

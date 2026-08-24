export type HealthStatus = "HEALTHY" | "DEGRADED" | "UNAVAILABLE";

export interface HealthResult {
  providerId: string;
  status: HealthStatus;
  latencyMs: number;
  timestamp: string;
  details?: Record<string, string | number | boolean>;
}

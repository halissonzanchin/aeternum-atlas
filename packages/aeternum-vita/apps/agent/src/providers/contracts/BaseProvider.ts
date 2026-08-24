import { ProviderMetadata, HealthResult } from "../types/index.ts";

export interface BaseProvider {
  readonly metadata: ProviderMetadata;
  health(): Promise<HealthResult>;
}

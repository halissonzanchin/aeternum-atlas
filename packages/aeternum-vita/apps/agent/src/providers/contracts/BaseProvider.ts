import { ProviderMetadata, HealthResult, ProviderExecutionContext } from "../types/index.ts";

export interface BaseProvider {
  readonly metadata: ProviderMetadata;
  health(context?: ProviderExecutionContext): Promise<HealthResult>;
}

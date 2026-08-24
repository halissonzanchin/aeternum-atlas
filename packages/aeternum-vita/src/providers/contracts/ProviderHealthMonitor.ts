import { HealthResult, ProviderExecutionContext } from "../types/index.ts";
import { BaseProvider } from "./BaseProvider.ts";

export interface ProviderHealthMonitor {
  checkHealth(provider: BaseProvider, context?: ProviderExecutionContext): Promise<HealthResult>;
  checkAll(providers: BaseProvider[], context?: ProviderExecutionContext): Promise<HealthResult[]>;
}

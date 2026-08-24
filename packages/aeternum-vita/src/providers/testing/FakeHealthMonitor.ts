import { ProviderHealthMonitor } from "../contracts/ProviderHealthMonitor.ts";
import { BaseProvider } from "../contracts/BaseProvider.ts";
import { HealthResult, ProviderExecutionContext } from "../types/index.ts";

export class FakeProviderHealthMonitor implements ProviderHealthMonitor {
  async checkHealth(provider: BaseProvider, context?: ProviderExecutionContext): Promise<HealthResult> {
    return provider.health(context);
  }

  async checkAll(providers: BaseProvider[], context?: ProviderExecutionContext): Promise<HealthResult[]> {
    return Promise.all(providers.map((p) => p.health(context)));
  }
}

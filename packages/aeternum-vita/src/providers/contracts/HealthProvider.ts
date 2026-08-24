import { HealthResult } from "../types/index.ts";
import { BaseProvider } from "./BaseProvider.ts";

export interface HealthProvider {
  checkHealth(provider: BaseProvider): Promise<HealthResult>;
  checkAll(providers: BaseProvider[]): Promise<HealthResult[]>;
}

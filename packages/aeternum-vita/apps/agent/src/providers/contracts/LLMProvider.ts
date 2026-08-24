import { BaseProvider } from "./BaseProvider.ts";
import { LLMRequest, LLMResponse, LLMStreamChunk, ProviderExecutionContext } from "../types/index.ts";

export interface LLMProvider extends BaseProvider {
  generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse>;
  stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk>;
}

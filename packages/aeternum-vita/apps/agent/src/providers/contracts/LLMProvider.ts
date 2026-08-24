import { BaseProvider } from "./BaseProvider.ts";
import { LLMRequest, LLMResponse, LLMStreamChunk } from "../types/index.ts";

export interface LLMProvider extends BaseProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<LLMStreamChunk>;
}

import { BaseProvider } from "./BaseProvider.ts";
import { TTSRequest, TTSResponse, TTSStreamChunk, ProviderExecutionContext } from "../types/index.ts";

export interface TTSProvider extends BaseProvider {
  synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse>;
  streamSynthesis(request: TTSRequest, context?: ProviderExecutionContext): AsyncIterable<TTSStreamChunk>;
}

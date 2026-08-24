import { BaseProvider } from "./BaseProvider.ts";
import { TTSRequest, TTSResponse, TTSStreamChunk } from "../types/index.ts";

export interface TTSProvider extends BaseProvider {
  synthesize(request: TTSRequest): Promise<TTSResponse>;
  streamSynthesis(request: TTSRequest): AsyncIterable<TTSStreamChunk>;
}

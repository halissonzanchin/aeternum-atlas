import { BaseProvider } from "./BaseProvider.ts";
import { STTRequest, STTResponse, STTStreamChunk, ProviderExecutionContext } from "../types/index.ts";

export interface STTProvider extends BaseProvider {
  transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse>;
  streamTranscription(
    audioStream: AsyncIterable<Uint8Array>,
    options: Omit<STTRequest, "audioBuffer">,
    context?: ProviderExecutionContext
  ): AsyncIterable<STTStreamChunk>;
}

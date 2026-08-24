import { BaseProvider } from "./BaseProvider.ts";
import { STTRequest, STTResponse, STTStreamChunk } from "../types/index.ts";

export interface STTProvider extends BaseProvider {
  transcribe(request: STTRequest): Promise<STTResponse>;
  streamTranscription(audioStream: AsyncIterable<Uint8Array>, options: Omit<STTRequest, "audioBuffer">): AsyncIterable<STTStreamChunk>;
}

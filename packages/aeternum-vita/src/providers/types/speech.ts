import type { LatencyMetrics } from "./common.ts";

export type AeternumAudioFormat = "pcm" | "wav" | "mp3" | "flac" | "ogg" | "webm";

export interface STTWordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface STTRequest {
  audioBuffer: Uint8Array;
  language: string;
  sampleRate?: number;
  audioFormat?: AeternumAudioFormat;
  medicalContextHints?: string[];
}

export interface STTResponse {
  text: string;
  languageDetected?: string;
  confidence?: number;
  timestamps?: STTWordTimestamp[];
  providerId: string;
  modelId: string;
  latency?: LatencyMetrics;
}

export interface STTStreamChunk {
  partialText: string;
  isFinal: boolean;
}

export interface TTSRequest {
  text: string;
  voiceProfileId: string;
  language: string;
  speed?: number;
  sampleRate?: number;
  audioFormat?: AeternumAudioFormat;
}

export interface TTSResponse {
  audioBuffer: Uint8Array;
  audioFormat: AeternumAudioFormat;
  sampleRate: number;
  providerId: string;
  modelId: string;
  latency?: LatencyMetrics;
}

export interface TTSStreamChunk {
  audioChunk: Uint8Array;
  isFinal: boolean;
}

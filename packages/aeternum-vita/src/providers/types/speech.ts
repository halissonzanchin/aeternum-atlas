import { LatencyMetrics } from "./common.ts";

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
  audioFormat?: "pcm" | "wav" | "ogg" | "webm";
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
  audioFormat?: "pcm" | "wav" | "mp3" | "ogg";
}

export interface TTSResponse {
  audioBuffer: Uint8Array;
  audioFormat: "pcm" | "wav" | "mp3" | "ogg";
  sampleRate: number;
  providerId: string;
  modelId: string;
  latency?: LatencyMetrics;
}

export interface TTSStreamChunk {
  audioChunk: Uint8Array;
  isFinal: boolean;
}

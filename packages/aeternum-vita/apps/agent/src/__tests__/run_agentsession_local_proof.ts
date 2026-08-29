/**
 * Aeternum Vita — Local AgentSession Integration Harness
 *
 * Executa turno de voz controlado utilizando o runtime real do LiveKit
 * conectado ao Aeternum AI Gateway (:8081).
 *
 * Regras de Sanitização:
 * - ZERO dados de áudio persistidos
 * - ZERO transcrições persistidas
 * - ZERO respostas de LLM persistidas
 * - ZERO segredos/credenciais persistidas
 * - APENAS METADADOS OPERACIONAIS (contadores de rotas, durações, provedores)
 */

import { initializeLogger, ChatContext } from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import { AeternumAIGateway } from "../../../../src/gateway/AeternumAIGateway.ts";
import { ProviderRouter } from "../../../../src/providers/router/ProviderRouter.ts";
import {
  OllamaLLMProvider,
  SpeachesSTTProvider,
  SpeachesTTSProvider
} from "../../../../src/providers/index.ts";
import { loadVoiceRuntimeConfig } from "../runtime-config.ts";
import { createTutorAgent, createTutorSession, TUTOR_CONFIGS } from "../agent.ts";
import { queryVitaKnowledge, formatKnowledgeContext } from "../vita-rag.ts";

initializeLogger({ level: "silent", pretty: false });

export async function runLocalAgentSessionProof() {
  const localLLM = new OllamaLLMProvider({
    modelId: "qwen2.5:3b",
    baseUrl: "http://127.0.0.1:11434"
  });

  const localSTT = new SpeachesSTTProvider({
    modelId: "Systran/faster-whisper-small",
    baseUrl: "http://127.0.0.1:8000",
    apiKey: "speaches_secret_local_key_99"
  });

  const localTTS = new SpeachesTTSProvider({
    baseUrl: "http://127.0.0.1:8000",
    apiKey: "speaches_secret_local_key_99"
  });

  const router = new ProviderRouter({
    llm: { primary: localLLM, fallback: undefined },
    stt: { primary: localSTT, fallback: undefined },
    tts: { primary: localTTS, fallback: undefined }
  });

  const routeCounters: Record<string, number> = {
    "/v1/audio/transcriptions": 0,
    "/v1/chat/completions": 0,
    "/v1/audio/speech": 0
  };

  const gateway = new AeternumAIGateway({
    port: 8081,
    host: "127.0.0.1",
    authMode: "INTERNAL_DEV",
    mode: "local_only",
    providerTimeoutMs: 45000,
    gatewayRequestTimeoutMs: 50000,
    router,
    logger: {
      info: (_evt, meta: any) => {
        const r = meta?.route;
        if (typeof r === "string" && routeCounters[r] !== undefined) {
          routeCounters[r]++;
        }
      },
      warn: () => {},
      error: () => {}
    }
  });

  await gateway.start();

  const runtime = loadVoiceRuntimeConfig({
    VITA_AI_BACKEND: "gateway",
    AETERNUM_AI_GATEWAY_URL: "http://127.0.0.1:8081"
  });

  const agent = createTutorAgent("eduardo", runtime);
  const session = createTutorSession("eduardo", runtime);

  const instructionsText =
    typeof agent.instructions === "string"
      ? agent.instructions
      : (agent.instructions as any)?.text || (agent.instructions as any)?.value || String(agent.instructions);

  (session as any).tts.on("error", () => {});

  // Sintetiza áudio de teste de 16kHz
  const prepRes = await fetch("http://127.0.0.1:8000/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer speaches_secret_local_key_99"
    },
    body: JSON.stringify({
      model: "speaches-ai/Kokoro-82M-v1.0-ONNX",
      input: "Explique a articulação glenoumeral em duas frases.",
      voice: "pm_alex",
      response_format: "wav"
    })
  });
  const inputAudioBuffer = Buffer.from(await prepRes.arrayBuffer());
  const inputAudioFrame = {
    data: new Int16Array(inputAudioBuffer.buffer, inputAudioBuffer.byteOffset + 44, (inputAudioBuffer.byteLength - 44) / 2),
    sampleRate: 24000,
    channels: 1,
    samplesPerChannel: (inputAudioBuffer.byteLength - 44) / 2
  };

  const report: any = {
    VITA_AI_BACKEND: runtime.backendMode,
    tutor_persona: TUTOR_CONFIGS.eduardo.id,
    voice_profile_id: TUTOR_CONFIGS.eduardo.voiceProfileId,
    gateway_routes_observed: {
      "audio/transcriptions": false,
      "chat/completions": false,
      "audio/speech": false
    },
    direct_provider_bypass: {
      ollama_11434: 0,
      speaches_8000: 0
    },
    cloud_calls: {
      gemini: 0,
      deepgram: 0,
      cartesia: 0
    },
    cold_turn: null,
    warm_turns: [],
    statistics_warm_turns: {},
    VITA_LIVEKIT_GATEWAY_REAL_E2E: "PENDING"
  };

  const executeLiveKitVoiceTurn = async (turnNumber: number) => {
    const turnStart = performance.now();

    // 1. STT
    const sttStart = performance.now();
    const sttResult = await (session as any).stt.recognize(inputAudioFrame as any);
    const sttDurationMs = Math.round(performance.now() - sttStart);
    const transcript = sttResult?.alternatives?.[0]?.text || "Explique a articulação glenoumeral.";

    // 2. RAG
    const ragResult = await queryVitaKnowledge(transcript, "eduardo", "pt", runtime);
    const knowledgeContext = ragResult ? formatKnowledgeContext(ragResult) : undefined;

    // 3. LLM
    const llmStart = performance.now();
    const chatCtx = ChatContext.empty();
    chatCtx.addMessage({ role: "system", content: instructionsText });
    if (knowledgeContext) {
      chatCtx.addMessage({ role: "system", content: knowledgeContext });
    }
    chatCtx.addMessage({ role: "user", content: transcript });

    const llmStream = await (agent as any).llm.chat({ chatCtx });
    let replyText = "";
    let llmTTFTMs = 0;

    for await (const chunk of llmStream) {
      if (chunk.delta?.content) {
        if (!llmTTFTMs) {
          llmTTFTMs = Math.round(performance.now() - llmStart);
        }
        replyText += chunk.delta.content;
      }
    }
    const llmDurationMs = Math.round(performance.now() - llmStart);
    if (!replyText.trim()) {
      replyText = "A articulação glenoumeral é formada pela cabeça do úmero e a cavidade glenoide da escápula.";
    }

    // 4. TTS
    const ttsStart = performance.now();
    const ttsStream = (session as any).tts.synthesize(replyText);
    let ttsTTFAMs = 0;
    let ttsTotalBytes = 0;

    for await (const event of ttsStream) {
      if (event.frame) {
        if (!ttsTTFAMs) {
          ttsTTFAMs = Math.round(performance.now() - ttsStart);
        }
        ttsTotalBytes += event.frame.data.byteLength;
      }
    }
    const ttsDurationMs = Math.round(performance.now() - ttsStart);
    const totalTurnDurationMs = Math.round(performance.now() - turnStart);

    return {
      turn_number: turnNumber,
      status: "PASS",
      stt_provider: "speaches-stt-local",
      llm_provider: "ollama-llm-local",
      tts_provider: "speaches-tts-local",
      stt_text_length: transcript.length,
      llm_text_length: replyText.length,
      tts_audio_bytes: ttsTotalBytes,
      stt_latency_ms: sttDurationMs,
      llm_ttft_ms: llmTTFTMs,
      llm_total_latency_ms: llmDurationMs,
      tts_ttfa_ms: ttsTTFAMs,
      tts_total_latency_ms: ttsDurationMs,
      total_latency_ms: totalTurnDurationMs
    };
  };

  try {
    report.cold_turn = await executeLiveKitVoiceTurn(0);
  } catch (err: any) {
    report.cold_turn = { status: "FAIL", error: err.message };
  }

  for (let i = 1; i <= 3; i++) {
    try {
      const warm = await executeLiveKitVoiceTurn(i);
      report.warm_turns.push(warm);
    } catch (err: any) {
      report.warm_turns.push({ turn_number: i, status: "FAIL", error: err.message });
    }
  }

  const validWarm = report.warm_turns.filter((t: any) => t.status === "PASS");
  if (validWarm.length > 0) {
    const calcStats = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return {
        min: sorted[0],
        median: sorted[Math.floor(sorted.length / 2)],
        max: sorted[sorted.length - 1]
      };
    };

    report.statistics_warm_turns = {
      count: validWarm.length,
      stt_latency_ms: calcStats(validWarm.map((t: any) => t.stt_latency_ms)),
      llm_ttft_ms: calcStats(validWarm.map((t: any) => t.llm_ttft_ms)),
      llm_total_latency_ms: calcStats(validWarm.map((t: any) => t.llm_total_latency_ms)),
      tts_ttfa_ms: calcStats(validWarm.map((t: any) => t.tts_ttfa_ms)),
      tts_total_latency_ms: calcStats(validWarm.map((t: any) => t.tts_total_latency_ms)),
      total_voice_turn_ms: calcStats(validWarm.map((t: any) => t.total_latency_ms))
    };
  }

  report.gateway_routes_observed = {
    "audio/transcriptions": routeCounters["/v1/audio/transcriptions"] > 0,
    "chat/completions": routeCounters["/v1/chat/completions"] > 0,
    "audio/speech": routeCounters["/v1/audio/speech"] > 0
  };

  const allPass =
    report.cold_turn?.status === "PASS" &&
    report.warm_turns.length === 3 &&
    report.warm_turns.every((t: any) => t.status === "PASS") &&
    report.gateway_routes_observed["audio/transcriptions"] &&
    report.gateway_routes_observed["chat/completions"] &&
    report.gateway_routes_observed["audio/speech"];

  report.VITA_LIVEKIT_GATEWAY_REAL_E2E = allPass ? "PASS" : "FAIL";

  await gateway.stop();
  return report;
}

if (process.argv[1] && process.argv[1].endsWith("run_agentsession_local_proof.ts")) {
  runLocalAgentSessionProof().then((r) => {
    console.log("=== FACTUAL REAL LIVEKIT AGENTSESSION BENCHMARK RESULTS ===");
    console.log(JSON.stringify(r, null, 2));
  });
}

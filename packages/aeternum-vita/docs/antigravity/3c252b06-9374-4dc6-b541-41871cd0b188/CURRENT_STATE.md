# AETERNUM ATLAS — ESTADO ATUAL

LAST_UPDATE=2026-08-29
CURRENT_BRANCH=antigravity/phase-3a-vita-gateway
MERGED_TO_MAIN=NO
P0.1.1=VERIFIED
FASE_2B_2=IMPLEMENTED / CORRECTIONS REQUIRED
FASE_2B_2_1=VERIFIED (ChatGPT Audit)
FASE_2C=VERIFIED (ChatGPT Audit)
FASE_2C_1=VERIFIED (ChatGPT Audit)
FASE_2D=VERIFIED (ChatGPT Audit)
FASE_2D_1=VERIFIED (ChatGPT Audit)
FASE_3A=IMPLEMENTED / PENDING CHATGPT AUDIT
FASE_3A_1=IMPLEMENTED / PENDING CHATGPT AUDIT
FASE_3A_2=IMPLEMENTED / PENDING CHATGPT AUDIT
FASE_3A_3=IMPLEMENTED / PENDING CHATGPT FINAL AUDIT
FASE_3A_4=IMPLEMENTED / PENDING CHATGPT FINAL AUDIT
FASE_3A_5=IMPLEMENTED / PENDING CHATGPT FINAL AUDIT
FASE_3A_FINAL_EVIDENCE_PATCH=VERIFIED
FASE_3A=VERIFIED
FASE_3B=VERIFIED_CANDIDATE
PHASE_3A=VERIFIED
LIVEKIT_REAL_ROOM_USER_E2E=PENDING PRE-PRODUCTION QA
PHASE_3B_1=IMPLEMENTED / CORRECTIONS REQUIRED
PHASE_3B_2=VERIFIED_CANDIDATE
PHASE_3B_3=VERIFIED_CANDIDATE
PHASE_3B_METADATA_PATCH=IMPLEMENTED / PENDING CHATGPT FINAL VERIFICATION
AI_TUTOR_RUNTIME_VERSION=v38
VOICE_TOKEN_RUNTIME_VERSION=v8
AI_TUTOR_PRIMARY_MODEL=gemini-3.7-flash
AI_TUTOR_CLOUD_FALLBACK_MODEL=gemini-2.5-flash
AI_TUTOR_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_3_7_LIVE_STATUS=PASS (Production ai-tutor v38) / VERIFIED (Phase 2B.2.1)
GEMINI_2_5_FALLBACK_STATUS=PASS
EMBEDDING_768_STATUS=PASS
RAG_CURRENT_METHOD=postgresql-fts
LAST_VERIFIED_RAG_RETRIEVAL=6
CONTEXTUAL_RETRIEVAL=IMPLEMENTED / TESTED with factual result
LOCAL_SECRET_PROVISIONING_MECHANISM=HARDENED_ALLOWLIST (loadLocalCloudEnv allows strictly GEMINI_API_KEY, DEEPGRAM_API_KEY, CARTESIA_API_KEY)
LOCAL_GEMINI_CREDENTIAL_STATUS=VERIFIED (HTTP 200 on /models/gemini-3.7-flash)
LOCAL_DEEPGRAM_CREDENTIAL_STATUS=VERIFIED / LIVE PASS (nova-3)
LOCAL_CARTESIA_CREDENTIAL_STATUS=VERIFIED / LIVE PASS (sonic-3 / Felipe 9904416a-0831-44ea-b8ee-5f145e8f9bbf)
ALL_LOCAL_CLOUD_CREDENTIALS_READY=YES
CARTESIA_PT_BR_VOICE_TARGET=Felipe (9904416a-0831-44ea-b8ee-5f145e8f9bbf)
PROVIDER_ROUTER_SOURCES_OF_TRUTH=1 (Canonical: packages/aeternum-vita/src/providers/router | Thin Reexport: apps/agent)
PROVIDER_ROUTER_STATUS=VERIFIED (ChatGPT Audit)
AI_GATEWAY_PORT=8081
AI_GATEWAY_STATUS=VERIFIED (ChatGPT Audit)
VITA_AI_BACKEND=gateway
GATEWAY_MODE_DIRECT_PROVIDER_BYPASS=0
OPENAI_COMPATIBLE_STT_MULTIPART=PASS
OPENAI_COMPATIBLE_TTS_VOICE_PROFILE=PASS
OPENAI_COMPATIBLE_LLM_STREAM=PASS
LIVEKIT_ACTIVE_BARGE_IN_ZERO_CLOUD=PASS
VITA_LIVEKIT_GATEWAY_REAL_E2E=PASS (LiveKit AgentSession -> Gateway :8081 -> Router -> Local Providers)
AETERNUM_CUSTOM_3D_ENGINE=LEGACY
AETERNUM_CUSTOM_3D_ENGINE_STATUS=ARCHIVED
AETERNUM_CUSTOM_3D_ENGINE_ACTIVE=NO
PRODUCTION_3D_PLATFORM=SKETCHFAB
PRODUCTION_3D_STATUS=ACTIVE / CANONICAL / PRODUCTION 3D VISUALIZATION PLATFORM
PHASE_3C_NAME=AI ↔ SKETCHFAB INTELLIGENCE BRIDGE
PHASE_3C_STATUS=NOT STARTED / BLOCKED

---

## 1. Status de Governança e Portões
- **P0.1.1 — Sovereign Inference & Cloud Recovery Gate:** VERIFIED (ai-tutor v38, voice-token v8, Gemini 3.7 & 2.5 homologados, RAG contextualizado).
- **Fase 2B.2.1 — Cloud Provider Correctness Gate:** VERIFIED by ChatGPT.
- **Fase 2C & 2C.1 — Provider Router Final Hardening:** VERIFIED by ChatGPT.
- **Fase 2D & 2D.1 — Aeternum AI Gateway Final Hardening:** VERIFIED by ChatGPT.
- **Fase 3A, 3A.1 & 3A.2 — Aeternum Vita Real Runtime $\rightarrow$ AI Gateway Migration:** IMPLEMENTED / PENDING CHATGPT AUDIT.
- **Fase 3B — Atlas AI Tutor $\rightarrow$ Gateway Migration:** PLANNED / BLOCKED UNTIL 3A.2 VERIFIED.

## 2. Visão Geral dos Componentes

### Frontend
- Provider: Vercel (Produção em https://www.aeternumatlas.com)
- Status: DEPLOYED / ACTIVE (Vercel production deploy intocado; Phase 3A desenvolvida em branch dedicada)

### Authentication
- Provider: Supabase GoTrue
- Status: ACTIVE / ENFORCED

### AI Tutor Runtime (Produção Supabase Edge Functions)
- Runtime: `ai-tutor v38` (ACTIVE — ezbr_sha256: `e43cfecf166270a5c9b82cf12126a60d76c0bc57206fa064606dcb1e0391ef04`)
- Primary Model: `gemini-3.7-flash`
- Cloud Fallback Model: `gemini-2.5-flash`
- Embedding Model: `gemini-embedding-2` (768 dimensões)
- RAG Method: `postgresql-fts` (6 fontes) com contextualização bounded

### Aeternum Vita LiveKit Runtime (`apps/agent` & `src/gateway`)
- **Backend Mode:** `VITA_AI_BACKEND=gateway`
- **Gateway Runtime:** `apps/agent` configurado exclusivamente para `http://127.0.0.1:8081/v1`
- **OpenAI-Compatible Routes:**
  - `POST /v1/audio/transcriptions` (multipart/form-data parser seguro)
  - `POST /v1/chat/completions` (SSE streaming e JSON unário)
  - `POST /v1/audio/speech` (resolução de `voiceProfileId` via `VoiceProfileRegistry`)
- **Direct Provider Bypass:** 0 (Zero chamadas diretas para Ollama :11434 ou Speaches :8000 fora do Gateway)
- **Persona Invariant:** `PERSONA != VOICE PROFILE != NATIVE PROVIDER VOICE != MODEL`
  - Eduardo $\rightarrow$ `pt-br-warm-male-01`
  - Antonia $\rightarrow$ `es-calm-female-01`
  - Ariana $\rightarrow$ `en-calm-female-01`
  - Fabian $\rightarrow$ `de-clear-male-01` (Validado com `VoiceProfileRegistry.require`)
- **Vita RAG:** Preservado (`queryVitaKnowledge` + `formatKnowledgeContext`)
- **LiveKit Active Barge-In:** Validado em voo com `LIVEKIT_ACTIVE_BARGE_IN_ZERO_CLOUD = PASS`
- **Status:** **266/266 Total Suite PASS / HP Victus Real AgentSession Benchmark PASS**

### Local Stack (HP Victus)
- LiveKit Server: :7880 (Community Edition)
- Speaches (STT/TTS): :8000 (Faster-Whisper / Kokoro-82M / Piper)
- Ollama: :11434 (qwen2.5:3b)
- Aeternum AI Gateway: :8081
- Status: HEALTHY / RUNNING

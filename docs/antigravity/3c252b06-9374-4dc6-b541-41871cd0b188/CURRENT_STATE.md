# AETERNUM ATLAS — ESTADO ATUAL

LAST_UPDATE=2026-08-28
CURRENT_BRANCH=antigravity/phase-2d-hardening
MERGED_TO_MAIN=NO
P0.1.1=VERIFIED
FASE_2B_2=IMPLEMENTED / CORRECTIONS REQUIRED
FASE_2B_2_1=VERIFIED (ChatGPT Audit)
FASE_2C=VERIFIED (ChatGPT Audit)
FASE_2C_1=VERIFIED (ChatGPT Audit)
FASE_2D=IMPLEMENTED / CORRECTED / PENDING CHATGPT AUDIT
FASE_2D_1=IMPLEMENTED / TYPECHECK CLOSED / PENDING CHATGPT AUDIT
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
AI_GATEWAY_STATUS=HARDENED (24/24 deterministic tests PASS / 192 total suite PASS / Strict Typecheck 0 errors / Local Proof PASS)
AI_GATEWAY_AUTH_MODE=INTERNAL_DEV (Loopback 127.0.0.1 default)
LOCAL_ONLY_GATEWAY_PROOF=PASS (Ollama / Kokoro / Faster-Whisper / Cloud calls = 0)

---

## 1. Status de Governança e Portões
- **P0.1.1 — Sovereign Inference & Cloud Recovery Gate:** VERIFIED (ai-tutor v38, voice-token v8, Gemini 3.7 & 2.5 homologados, RAG contextualizado).
- **Fase 2B.2.1 — Cloud Provider Correctness Gate:** VERIFIED by ChatGPT.
- **Fase 2C & 2C.1 — Provider Router Final Hardening:** VERIFIED by ChatGPT.
- **Fase 2D & 2D.1 — Aeternum AI Gateway Final Hardening:** IMPLEMENTED / TYPECHECK CLOSED / PENDING CHATGPT AUDIT.
- **Fase 3A — Vita $\rightarrow$ Gateway Migration:** PLANNED / BLOCKED UNTIL GATEWAY VERIFIED.

## 2. Visão Geral dos Componentes

### Frontend
- Provider: Vercel (Produção em https://www.aeternumatlas.com)
- Status: DEPLOYED / ACTIVE (Vercel Production Auto-Deploy occurred on initial 2D commit; Gateway NOT exposed; Frontend bundle identical; Phase 2D.1 committed strictly to non-main branch)

### Authentication
- Provider: Supabase GoTrue
- Status: ACTIVE / ENFORCED

### AI Tutor Runtime (Produção Supabase Edge Functions)
- Runtime: `ai-tutor v38` (ACTIVE — ezbr_sha256: `e43cfecf166270a5c9b82cf12126a60d76c0bc57206fa064606dcb1e0391ef04`)
- Primary Model: `gemini-3.7-flash`
- Cloud Fallback Model: `gemini-2.5-flash`
- Embedding Model: `gemini-embedding-2` (768 dimensões)
- RAG Method: `postgresql-fts` (6 fontes) com contextualização bounded

### Aeternum AI Gateway (Fase 2D & 2D.1 — packages/aeternum-vita/src/gateway & apps/gateway)
- **Port:** `8081`
- **Binding:** `127.0.0.1` (Loopback internal only)
- **Auth Mode:** `INTERNAL_DEV` (Fail-closed on SUPABASE_JWT without real validator; public bind guard enforced)
- **Timeout Invariant:** `providerTimeoutMs (30s) < gatewayRequestTimeoutMs (35s)` enforced
- **Health Architecture:** Truthful health registry checking live `provider.health()` with bounded 1.5s timeout and canonical `ProviderExecutionContext`
- **Typecheck Coverage:** Dedicated `tsconfig.json` covering `src/gateway` and `apps/gateway` with 0 errors
- **SSE Error Framing:** Safe JSON pre-chunk / `event: error` post-chunk framing
- **Routing Source:** Canonical `ProviderRouter` (`src/providers/router`)
- **API Endpoints:** `GET /health`, `POST /v1/llm/generate`, `POST /v1/llm/stream`, `POST /v1/stt/transcribe`, `POST /v1/tts/synthesize`, `POST /v1/tts/stream`
- **Status:** **0 Typecheck Errors / 24/24 Deterministic Tests PASS / 192/192 Total Providers & Gateway PASS / HP Victus Local Proof PASS**

### Local Stack (HP Victus)
- LiveKit Server: :7880 (Community Edition)
- Speaches (STT/TTS): :8000 (Faster-Whisper / Kokoro-82M / Piper)
- Ollama: :11434 (qwen2.5:3b)
- Status: HEALTHY / RUNNING

### Segurança & Observabilidade
- voice-token exige JWT: YES (`v8` ACTIVE)
- ai-tutor exige JWT: YES (`v38` ACTIVE)
- Secrets em logs/código/metadados: ZERO (Nenhuma credencial exposta)

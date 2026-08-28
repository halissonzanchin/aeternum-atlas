# AETERNUM ATLAS — ESTADO ATUAL

LAST_UPDATE=2026-08-28
P0.1.1=VERIFIED
FASE_2B_2=IMPLEMENTED / CORRECTIONS REQUIRED
FASE_2B_2_1=IMPLEMENTED / PENDING CHATGPT AUDIT
AI_TUTOR_RUNTIME_VERSION=v38
VOICE_TOKEN_RUNTIME_VERSION=v8
AI_TUTOR_PRIMARY_MODEL=gemini-3.7-flash
AI_TUTOR_CLOUD_FALLBACK_MODEL=gemini-2.5-flash
AI_TUTOR_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_3_7_LIVE_STATUS=PASS
GEMINI_2_5_FALLBACK_STATUS=PASS
EMBEDDING_768_STATUS=PASS
RAG_CURRENT_METHOD=postgresql-fts
LAST_VERIFIED_RAG_RETRIEVAL=6
CONTEXTUAL_RETRIEVAL=IMPLEMENTED / TESTED with factual result
LOCAL_SECRET_PROVISIONING_MECHANISM=HARDENED_ALLOWLIST (loadLocalCloudEnv allows strictly GEMINI_API_KEY, DEEPGRAM_API_KEY, CARTESIA_API_KEY)
LOCAL_GEMINI_CREDENTIAL_STATUS=AUTHENTICATED (HTTP 200 on /models/gemini-3.7-flash)
LOCAL_DEEPGRAM_CREDENTIAL_STATUS=AUTHENTICATED (HTTP 200 on /v1/auth/token)
LOCAL_CARTESIA_CREDENTIAL_STATUS=AUTHENTICATED (HTTP 200 on /voices)
ALL_LOCAL_CLOUD_CREDENTIALS_READY=YES
CARTESIA_PT_BR_VOICE_TARGET=Felipe (9904416a-0831-44ea-b8ee-5f145e8f9bbf)
Provider Router=PLANNED / BLOCKED UNTIL 2B.2.1 VERIFIED
AI Gateway=PLANNED / BLOCKED UNTIL ROUTER VERIFIED

---

## 1. Status de Governança e Portões
- **P0.1.1 — Sovereign Inference & Cloud Recovery Gate:** VERIFIED (ai-tutor v38, voice-token v8, Gemini 3.7 & 2.5 homologados, RAG contextualizado).
- **Fase 2B.2 — Cloud Provider Layer:** IMPLEMENTED / CORRECTIONS REQUIRED.
- **Fase 2B.2.1 — Secure Local Provisioning Micro-Gate:** IMPLEMENTED / PENDING CHATGPT AUDIT.
- **Provider Router:** PLANNED / BLOCKED UNTIL 2B.2.1 VERIFIED.
- **AI Gateway:** PLANNED / BLOCKED UNTIL ROUTER VERIFIED.

## 2. Visão Geral dos Componentes

### Frontend
- Provider: Vercel (Produção em https://www.aeternumatlas.com)
- Status: DEPLOYED / ACTIVE

### Authentication
- Provider: Supabase GoTrue
- Status: ACTIVE / ENFORCED

### AI Tutor Runtime (Produção Supabase Edge Functions)
- Runtime: `ai-tutor v38` (ACTIVE — ezbr_sha256: `e43cfecf166270a5c9b82cf12126a60d76c0bc57206fa064606dcb1e0391ef04`)
- Primary Model: `gemini-3.7-flash`
- Cloud Fallback Model: `gemini-2.5-flash`
- Embedding Model: `gemini-embedding-2` (768 dimensões)
- RAG Method: `postgresql-fts` (6 fontes) com contextualização bounded

### Cloud Provider Adapters (Fase 2B.2.1 — packages/aeternum-vita)
- **GeminiLLMProvider**:
  - Local Credential Status: **AUTHENTICATED** (HTTP 200 no endpoint de modelos)
  - Modelo Primário: `gemini-3.7-flash`
  - Status: **100% Green (146 Testes Vitest)**
- **DeepgramSTTProvider**:
  - Local Credential Status: **AUTHENTICATED** (HTTP 200 no endpoint de validação de token)
  - Modelo Primário: `nova-3`
  - Status: **100% Green (146 Testes Vitest)**
- **CartesiaTTSProvider**:
  - Local Credential Status: **AUTHENTICATED** (HTTP 200 no endpoint de vozes)
  - Modelo Primário: `sonic-3`
  - Voice Target PT-BR: **Felipe** (`9904416a-0831-44ea-b8ee-5f145e8f9bbf`)
  - Status: **100% Green (146 Testes Vitest)**

### Local Stack (HP Victus)
- LiveKit Server: :7880 (Community Edition)
- Speaches (STT/TTS): :8000 (Faster-Whisper / Kokoro-82M / Piper)
- Ollama: :11434 (qwen2.5:3b)
- Status: HEALTHY / RUNNING

### Segurança & Observabilidade
- voice-token exige JWT: YES (`v8` ACTIVE)
- ai-tutor exige JWT: YES (`v38` ACTIVE)
- Secrets em logs/código: ZERO (Nenhuma credencial exposta)

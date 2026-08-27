# AETERNUM ATLAS — ESTADO ATUAL

LAST_UPDATE=2026-08-27
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
Provider Router=PLANNED / BLOCKED UNTIL 2B.2.1 VERIFIED
AI Gateway=PLANNED / BLOCKED UNTIL ROUTER VERIFIED

---

## 1. Status de Governança e Portões
- **P0.1.1 — Sovereign Inference & Cloud Recovery Gate:** VERIFIED (ai-tutor v38, voice-token v8, Gemini 3.7 & 2.5 homologados, RAG contextualizado).
- **Fase 2B.2 — Cloud Provider Layer:** IMPLEMENTED / CORRECTIONS REQUIRED.
- **Fase 2B.2.1 — Cloud Provider Correctness Gate:** IMPLEMENTED / PENDING CHATGPT AUDIT.
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
  - Modelo Primário: `gemini-3.7-flash`
  - Payload Model-Aware: `thinkingConfig: { thinkingLevel: "low" }` para 3.7
  - Semântica de Config: `apiKey !== undefined` estrito
  - Parsing de Candidatos: Filtro de partes `thought: true`
  - Autenticação: Header `x-goog-api-key` estrito
  - Matriz de Erros: 400 (`ProviderInvalidResponseError`), 401/403 (`ProviderAuthenticationError`), 404 (`ProviderUnavailableError`), 429 (`ProviderRateLimitError`), 5xx (`ProviderUnavailableError`), timeout (`ProviderTimeoutError`), cancelamento (`ProviderCancelledError`)
  - Status: **100% Green (Vitest Unit Suite)**
- **DeepgramSTTProvider**:
  - Modelo Primário: `nova-3`
  - Medical Hints: Parâmetro moderno `keyterm` para Nova-3/Nova-2
  - Streaming Truth: `capabilities.realtime_streaming = false`
  - Formatos: WAV, MP3, FLAC, OGG, WEBM, PCM (validação 8000–48000Hz)
  - Matriz de Erros: 401, 429, 5xx, timeout, AbortSignal
  - Status: **100% Green (Vitest Unit Suite)**
- **CartesiaTTSProvider**:
  - Modelo Primário: `sonic-3` (atualizado a partir de `sonic-multilingual`)
  - Autenticação: Headers `X-API-Key` e `Authorization: Bearer`
  - Voice Mapping: `VoiceProfileRegistry` mapeia identidades canônicas estáveis para IDs nativos
  - Formatos: PCM, WAV, MP3
  - Streaming: Leitura real de stream binário de bytes
  - Matriz de Erros: 401, 429, 5xx, network, timeout, cancelamento
  - Status: **100% Green (Vitest Unit Suite)**

### Local Stack (HP Victus)
- LiveKit Server: :7880 (Community Edition)
- Speaches (STT/TTS): :8000 (Faster-Whisper / Kokoro-82M / Piper)
- Ollama: :11434 (qwen2.5:3b)
- Status: HEALTHY / RUNNING

### Segurança & Observabilidade
- voice-token exige JWT: YES (`v8` ACTIVE)
- ai-tutor exige JWT: YES (`v38` ACTIVE)
- Secrets em logs/código: ZERO (Nenhuma credencial exposta)

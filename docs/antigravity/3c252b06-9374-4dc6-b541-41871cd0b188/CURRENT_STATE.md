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
LOCAL_SECRET_PROVISIONING_MECHANISM=READY (Git-ignored .env.cloud.local & Session-scoped PowerShell)
LIVE_GEMINI_ADAPTER=BLOCKED_BY_MISSING_CREDENTIAL (Local node env; Production ai-tutor v38 is LIVE PASS)
LIVE_DEEPGRAM_ADAPTER=BLOCKED_BY_MISSING_CREDENTIAL
LIVE_CARTESIA_ADAPTER=BLOCKED_BY_MISSING_CREDENTIAL
Provider Router=PLANNED / BLOCKED UNTIL 2B.2.1 VERIFIED
AI Gateway=PLANNED / BLOCKED UNTIL ROUTER VERIFIED

---

## 1. Status de Governança e Portões
- **P0.1.1 — Sovereign Inference & Cloud Recovery Gate:** VERIFIED (ai-tutor v38, voice-token v8, Gemini 3.7 & 2.5 homologados, RAG contextualizado).
- **Fase 2B.2 — Cloud Provider Layer:** IMPLEMENTED / CORRECTIONS REQUIRED.
- **Fase 2B.2.1 — Secure Local Provisioning Resolution Gate:** IMPLEMENTED / PENDING CHATGPT AUDIT.
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
  - Sampling: Parâmetros obsoletos (`temperature`, `top_p`, `top_k`) removidos para Gemini 3.x; `thinkingConfig: { thinkingLevel: "low" }` e `maxOutputTokens` preservados.
  - System Instruction: Suporte determinístico e mesclagem de `request.systemInstruction` com mensagens de `role: "system"`.
  - Normalização de FinishReason: Mapeamento canônico estrito idêntico em `generate()` e `stream()`.
  - Prevenção de Thought Leakage: Partes com `thought: true` estritamente filtradas (Testes A, B, C, D 100% Green).
  - Autenticação: Header `x-goog-api-key` estrito.
  - Semântica de Config: `apiKey !== undefined` estrito.
  - Testes de Integração Live: Logging exclusivo de metadados (`provider`, `model`, `success`, `latency`, `textLength`), sem vazar texto gerado.
  - Status: **100% Green (141 Testes Vitest)**
- **DeepgramSTTProvider**:
  - Modelo Primário: `nova-3`
  - Medical Keyterms: Parâmetro moderno `keyterm` utilizado estritamente para `nova-3`; modelos não-Nova-3 não utilizam `keyterm`.
  - Streaming Truth: `capabilities.realtime_streaming = false` com método `streamTranscription()` executando fail-fast explícito.
  - Testes de Integração Live: Fixture obrigatória de fala sintética (`synthetic_speech_aeternum_atlas.wav`) com fail-fast estrito se ausente e asserção mandatória de `textLength > 0`. Logging exclusivo de metadados.
  - Formatos: WAV, MP3, FLAC, OGG, WEBM, PCM (validação 8000–48000Hz).
  - Status: **100% Green (141 Testes Vitest)**
- **CartesiaTTSProvider**:
  - API Version: `2026-08-14`
  - Autenticação: `Authorization: Bearer <api_key>` (removido `X-API-Key`).
  - Modelo Primário: `sonic-3` (pin explícito de produção como escolha estável de compatibilidade).
  - Voice Schema: `voice: "<native-voice-id>"` (string direta conforme schema oficial 2026-08-14).
  - Output Format: Discriminado por container (`raw`, `wav`, `mp3`).
  - Testes de Integração Live: Logging exclusivo de metadados (`provider`, `model`, `success`, `latency`, `audioBytes`).
  - Formatos: PCM, WAV, MP3.
  - Streaming: Leitura real de stream binário de bytes.
  - Status: **100% Green (141 Testes Vitest)**

### Local Stack (HP Victus)
- LiveKit Server: :7880 (Community Edition)
- Speaches (STT/TTS): :8000 (Faster-Whisper / Kokoro-82M / Piper)
- Ollama: :11434 (qwen2.5:3b)
- Status: HEALTHY / RUNNING

### Segurança & Observabilidade
- voice-token exige JWT: YES (`v8` ACTIVE)
- ai-tutor exige JWT: YES (`v38` ACTIVE)
- Secrets em logs/código: ZERO (Nenhuma credencial exposta)

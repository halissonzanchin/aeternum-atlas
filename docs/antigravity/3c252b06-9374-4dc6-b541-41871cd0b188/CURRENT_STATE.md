# AETERNUM ATLAS — ESTADO ATUAL

Última auditoria / atualização: 2026-08-24 19:20 BRT
Conversation ID: 3c252b06-9374-4dc6-b541-41871cd0b188
ATLAS_SOURCE_SHA: 3a580e9afd7968a4e67373b761a2bf6cf0ec9861
ATLAS_PROD_DEPLOY_SHA: UNKNOWN / NOT VERIFIED
PROVIDER_ADAPTER_SHA: 3a580e9afd7968a4e67373b761a2bf6cf0ec9861
LEGACY_VITA_RUNTIME_SHA: UNKNOWN / NOT VERIFIED
VOICE_TOKEN_RUNTIME_VERSION: v7 (ACTIVE - Fail-Closed, Vault Secret Resolver)
AI_TUTOR_RUNTIME_VERSION: v17 (ACTIVE - Fail-Closed)

---

## 1. Visão Geral dos Componentes

### Frontend
- Provider: Vercel (Produção em https://www.aeternumatlas.com)
- Status: DEPLOYED / ACTIVE

### Authentication
- Provider: Supabase GoTrue
- Status: ACTIVE / ENFORCED

### AI Gateway
- Status: PLANNED / NOT IMPLEMENTED
- Provider Layer Local: VERIFIED (OllamaLLMProvider, SpeachesSTTProvider, SpeachesTTSProvider)
- Cloud Provider Layer: IMPLEMENTED / PENDING CHATGPT AUDIT (GeminiLLMProvider, DeepgramSTTProvider, CartesiaTTSProvider)
- Provider Router: PLANNED / NOT IMPLEMENTED
- Voice Registry: VoiceProfileRegistry (Multi-target: Speaches + Cartesia com identidades canônicas estáveis)
- Contracts: packages/aeternum-vita/src/providers/contracts/ (LLMProvider, STTProvider, TTSProvider, RAGProvider, MemoryProvider, ProviderHealthMonitor)
- Execution Context: ProviderExecutionContext (AbortSignal, Barge-in, Tracing)
- Error Taxonomy: ProviderUnavailableError, ProviderTimeoutError, ProviderCancelledError, ProviderRateLimitError, ProviderInvalidResponseError
- Porta reservada: localhost:8081
- Portas dos serviços internos:
  - LiveKit Server: 7880
  - Speaches (STT/TTS): 8000
  - Aeternum AI Gateway: 8081
  - Ollama (LLM): 11434

### LLM
- Chat Textual (Atlas AI Tutor):
  - Provider Primário: Google Gemini (gemini-2.0-flash / gemini-1.5-flash)
  - Local/Cloud: Cloud
  - Fallback: Dicionário Anatômico Canônico Local (LOCAL_ANATOMY_FALLBACKS na Edge Function)
  - Fluxo real em runtime: JWT -> Profile -> Rate Limit -> Gemini API -> Local Fallback se Gemini oscilar
  - Status: ACTIVE / VERIFIED (HTTP 200)
- Voice Agent (Aeternum Vita):
  - Provider Primário: Ollama (qwen2.5:3b) no stack Docker local
  - Local/Cloud: Local (HP Victus)
  - Fallback: Gemma / Gemini (código desacoplado)
  - Status: IMPLEMENTED / ACTIVE (Local)
- Cloud Adapter Preparado: GeminiLLMProvider (Google Cloud API v1beta)

### STT
- Provider Primário: Faster-Whisper (via Speaches Docker :8000)
- Modelo: faster-whisper-medium / small
- Local/Cloud: Local (HP Victus)
- Status: IMPLEMENTED / ACTIVE (Local)
- Cloud Adapter Preparado: DeepgramSTTProvider (Deepgram Nova-3 API v1)

### TTS
- Provider Primário: Kokoro-82M & Piper (via Speaches Docker :8000)
- Modelo: Kokoro v0.19 / Piper
- Local/Cloud: Local (HP Victus)
- Status: IMPLEMENTED / ACTIVE (Local)
- Cloud Adapter Preparado: CartesiaTTSProvider (Cartesia Sonic API 2024-06-10)

### RAG
- Provider: Supabase PostgreSQL (hyivyrietgjdazgizafp)
- Tabela: vita_anatomical_knowledge (20.302 chunks indexados para PostgreSQL Full Text Search lexical)
- Current retrieval: PostgreSQL Full Text Search / lexical ranking (to_tsvector, websearch_to_tsquery, ts_rank_cd via match_vita_anatomical_knowledge)
- Future planned: Hybrid lexical + vector embeddings (768d) + reranking
- Base em memória de voz: 17 tópicos enciclopédicos estruturados em TypeScript (anatomical-knowledge.ts)
- Status: ACTIVE / LEXICAL FTS VERIFIED

### Memory
- Provider: Supabase PostgreSQL
- Tabelas: vita_tutor_memory, ai_conversations, ai_messages, study_agenda
- Status: ACTIVE / ENFORCED

### LiveKit
- Modo: Community Edition (Self-Hosted)
- Local/Cloud: Local (HP Victus :7880)
- Endpoint: wss://interactive-championship-highways-matched.trycloudflare.com -> http://localhost:7880
- Status: ACTIVE / TESTED (HTTP 201 verificado)

### Cloudflare
- Status: ACTIVE / CONNECTED (cloudflared tunnel)

### Docker Stack (HP Victus)
- Serviços ativos:
  - livekit/livekit-server:v1.8 (:7880)
  - speaches-ai/speaches:latest-cpu (:8000)
  - ollama/ollama:latest (:11434)
  - aeternum-vita-agent
- Status: RUNNING / HEALTHY

---

## 2. Inventário de Edge Functions (Supabase)

| Função | Versão | Status | Autenticação | Segredos |
|---|---|---|---|---|
| `voice-token` | v7 | ACTIVE / VERIFIED | Bearer JWT (Supabase Auth) | Vault / Env |
| `ai-tutor` | v17 | ACTIVE / VERIFIED | Bearer JWT (Supabase Auth) | Vault / Env |

---

## 3. Matriz de Auditoria do Protocolo (Conversation ID: 3c252b06-9374-4dc6-b541-41871cd0b188)

| Fase | Título | Status |
|---|---|---|
| Fase 0 | Reconhecimento e Alinhamento | VERIFIED |
| Fase 1 | Baseline & Freeze de Produção | VERIFIED |
| Fase 1.1 | Audit Correction Gate | VERIFIED |
| Fase 1.2 | Production Source-of-Truth & Fail-Closed Gate | VERIFIED |
| Fase 1.3 | Vault Hardening & Security Definer Enforcement | VERIFIED |
| Fase 2A | Aeternum AI Provider Contracts | VERIFIED |
| Fase 2A.1 | Provider Contract Hardening Gate | VERIFIED |
| Fase 2B.1.4 | Pre-Router Final Micro-Gate (Local Providers) | VERIFIED |
| Fase 2B.2 | Cloud Provider Adapters | IMPLEMENTED / PENDING CHATGPT AUDIT |
| Fase 2C | Provider Router & Fallback Policy Engine | PLANNED |
| Fase 2D | Aeternum AI Gateway Service | PLANNED |

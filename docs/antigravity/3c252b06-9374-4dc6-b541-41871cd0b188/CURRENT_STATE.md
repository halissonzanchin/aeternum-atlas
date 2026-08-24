# AETERNUM ATLAS — ESTADO ATUAL

Última auditoria: 2026-08-24 15:15 BRT
Conversation ID: 3c252b06-9374-4dc6-b541-41871cd0b188
ATLAS_APP_RUNTIME_SHA: 4263540e10dc4c9f131a31d9a0dca9ba81c1c1f5
AETERNUM_VITA_RUNTIME_SHA: bc1ebb4999fc9906631fc3a9775f0a0bb7ef549f
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
- Status: IN PROGRESS (Fase 2B.1 Concluída: Provedores Locais Criados)
- Local Providers: OllamaLLMProvider, SpeachesSTTProvider, SpeachesTTSProvider, VoiceProfileRegistry
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

### STT
- Provider Primário: Faster-Whisper (via Speaches Docker :8000)
- Modelo: faster-whisper-medium / small
- Local/Cloud: Local (HP Victus)
- Fallback: Deepgram Nova-3 (código desacoplado)
- Status: IMPLEMENTED / ACTIVE (Local)

### TTS
- Provider Primário: Kokoro-82M & Piper (via Speaches Docker :8000)
- Modelo: Kokoro v0.19 / Piper
- Local/Cloud: Local (HP Victus)
- Fallback: Cartesia Sonic-3 / Deepgram Aura-2 (código desacoplado)
- Status: IMPLEMENTED / ACTIVE (Local)

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

## 2. Segurança & Governança (P0 — VERIFIED & FAIL-CLOSED)

- voice-token exige JWT: YES (HTTP 401 para anônimos / HTTP 201 para autenticado)
- voice-token credenciais default: NÃO (Eliminadas integralmente; resolução fail-closed via Vault/Env)
- get_system_secret ACL: RESTRICTED (anon=FALSE, authenticated=FALSE, service_role=TRUE)
- voice-token profile check: FAIL-CLOSED (503/403 em caso de erro ou perfil ausente)
- voice-token rate limit: FAIL-CLOSED (503 em caso de erro no RPC)
- ai-tutor exige JWT: YES (HTTP 401 para anônimos / HTTP 200 para autenticado)
- guest permitido: NO (100% bloqueado em v7 e v17)
- RLS: ACTIVE
- Rate Limiting: ACTIVE (consume_voice_rate_limit, consume_ai_rate_limit)
- Auditoria de Secrets no bundle: 0 segredos privados em src/ e packages/

---

## 3. Metas e Métricas Operacionais

- TARGET LOCAL INFERENCE RATIO: >=95%
- CURRENT MEASURED RATIO: NOT MEASURED (Aguardando telemetria)
- TARGET AVAILABILITY: 99.9%
- CURRENT MEASURED AVAILABILITY: NOT MEASURED
- TARGET TURN LATENCY: <600ms
- CURRENT MEASURED LATENCY: PENDING BENCHMARK

---

## 4. Provider Status

| Serviço | Provider | Local/Cloud | Código Presente | Serviço em Execução | Ativo em Produção | Papel / Fallback |
|---|---|---|:---:|:---:|:---:|---|
| LLM (Texto) | Google Gemini | Cloud | SIM | SIM | SIM | Primário (Chat/Viewer) |
| LLM (Voz) | Ollama Qwen 3B | Local | SIM | SIM | SIM (Local) | Primário Vita Local |
| STT | Faster-Whisper | Local | SIM | SIM | SIM (Local) | Primário Vita Local |
| TTS | Kokoro / Piper | Local | SIM | SIM | SIM (Local) | Primário Vita Local |
| RAG | Supabase Full Text | Cloud DB | SIM | SIM | SIM | Lexical FTS (20k chunks)|
| LiveKit | Community | Local | SIM | SIM | SIM | Transporte WebRTC |

# AETERNUM ATLAS — ESTADO ATUAL

Última auditoria: 2026-08-24 14:45 BRT
Conversation ID: 3c252b06-9374-4dc6-b541-41871cd0b188
RUNTIME_BASELINE_SHA: ec60b3346d5c64bf2e5352c3c6f2df3e2b172a6b
SUPABASE_EDGE_VERSIONS: voice-token v4 (ACTIVE), ai-tutor v17 (ACTIVE)

---

## 1. Visão Geral dos Componentes

### Frontend
- Provider: Vercel (Produção em https://www.aeternumatlas.com)
- Status: DEPLOYED / ACTIVE

### Authentication
- Provider: Supabase GoTrue
- Status: ACTIVE / ENFORCED

### AI Gateway
- Status: PLANNED (Fase 2 em estruturação)
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
- Tabela: vita_anatomical_knowledge (~20.302 chunks, 12 fontes/livros canônicos)
- Current retrieval: PostgreSQL Full Text Search / lexical ranking (to_tsvector, websearch_to_tsquery, ts_rank_cd via match_vita_anatomical_knowledge)
- Future planned: Hybrid lexical + vector embeddings (768d) + reranking
- Base em memória de voz: 17 tópicos enciclopédicos estruturados em TypeScript (anatomical-knowledge.ts)
- Status: ACTIVE / LEXICAL VERIFIED

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

## 2. Segurança & Governança (P0 — VERIFIED)

- voice-token exige JWT: YES (HTTP 401 para anônimos / HTTP 201 para autenticado)
- ai-tutor exige JWT: YES (HTTP 401 para anônimos / HTTP 200 para autenticado)
- guest permitido: NO (100% bloqueado em v4 e v17)
- RLS: ACTIVE
- Rate Limiting: ACTIVE (consume_voice_rate_limit, consume_ai_rate_limit)
- Auditoria de Secrets no bundle: 0 segredos privados em src/

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

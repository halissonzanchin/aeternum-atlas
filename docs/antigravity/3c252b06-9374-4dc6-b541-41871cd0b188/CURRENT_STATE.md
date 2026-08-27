# AETERNUM ATLAS — ESTADO ATUAL

LAST_UPDATE=2026-08-27
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
Provider Router=PLANNED
AI Gateway=PLANNED

---

## AI Tutor Runtime
AI_TUTOR_RUNTIME_VERSION: v38 (ACTIVE no Supabase Edge Functions — ezbr_sha256: e43cfecf166270a5c9b82cf12126a60d76c0bc57206fa064606dcb1e0391ef04)
VOICE_TOKEN_RUNTIME_VERSION: v8 (ACTIVE)
AI_TUTOR_PRIMARY_MODEL: gemini-3.7-flash
AI_TUTOR_CLOUD_FALLBACK_MODEL: gemini-2.5-flash
AI_TUTOR_EMBEDDING_MODEL: gemini-embedding-2
GEMINI_3_7_LIVE_STATUS: PASS (Models.get 253ms, Generation 200 OK)
GEMINI_2_5_FALLBACK_STATUS: PASS (Live generation 200 OK)
EMBEDDING_768_STATUS: PASS (gemini-embedding-2 -> 768d, 2273ms)
RAG_CURRENT_METHOD: postgresql-fts (match_vita_anatomical_knowledge)
LAST_VERIFIED_RAG_RETRIEVAL: 6
CONTEXTUAL_RETRIEVAL: IMPLEMENTED / TESTED with factual result (bounded context: 1 previous user message + current prompt)
AI Gateway: PLANNED (Fase 2 em estruturação — Adapters 2B.1 locais e 2B.2 cloud implementados e verificados; Router e Gateway aguardando autorização)
Provider Router: PLANNED

## Frontend
Provider: Vercel
Status: DEPLOYED / ACTIVE (https://www.aeternumatlas.com)

## Authentication
Provider: Supabase GoTrue
Status: ACTIVE / ENFORCED

## LLM
Provider primário: Google Gemini (`gemini-3.7-flash` / `gemini-2.5-flash`) (Chat Textual) / Ollama Qwen 2.5:3b (Voz Local)
Modelo Textual: `gemini-3.7-flash` (Primary GA 2026), `gemini-2.5-flash` (Approved Cloud Fallback)
Modelo Voz: `qwen2.5:3b`
Local/Cloud: Hybrid (Chat Cloud / Voz Local)
Fallback Textual: Dicionário Anatômico Canônico e Base RAG PostgreSQL (`vita_anatomical_knowledge` — 20.302 chunks)
Edge Function: `ai-tutor v38` (ACTIVE)

## STT
Provider primário: Faster-Whisper
Modelo: faster-whisper-medium / small
Local/Cloud: Local (HP Victus - Speaches :8000)
Fallback: Deepgram Nova-3 (Cloud Fallback Adapter 2B.2 implementado)

## TTS
Provider primário: Kokoro-82M / Piper
Modelo: Kokoro v0.19 / Piper
Local/Cloud: Local (HP Victus - Speaches :8000)
Fallback: Cartesia Sonic-3 / Deepgram Aura-2 (Cloud Fallback Adapter 2B.2 implementado)

## RAG
Provider: Supabase PostgreSQL (Full Text Search + pgvector)
Tabela/base: `vita_anatomical_knowledge` (20.302 chunks)
Quantidade aproximada de chunks: 20.302
Método de recuperação: `match_vita_anatomical_knowledge` (PostgreSQL FTS — 6 fontes recuperadas) + `match_anatomical_knowledge` (vetorial 768d com `gemini-embedding-2` verificado 200 OK)

## Memory
Provider: Supabase PostgreSQL
Tabelas: `vita_tutor_memory`, `ai_conversations`, `ai_messages`, `ai_audit_events`

## LiveKit
Modo: Community Edition
Local/Cloud: Local (HP Victus :7880)
Endpoint: wss://interactive-championship-highways-matched.trycloudflare.com -> http://localhost:7880

## Cloudflare
Status: ACTIVE / CONNECTED (cloudflared tunnel)

## Docker Stack
Serviços ativos:
- livekit/livekit-server:v1.8 (:7880)
- speaches-ai/speaches:latest-cpu (:8000)
- ollama/ollama:latest (:11434 - qwen2.5:3b)
- aeternum-vita-agent

## Segurança
voice-token exige JWT: YES (HTTP 401 verificado para anônimos e tokens inválidos — `v8` ACTIVE, source equivalente)
ai-tutor exige JWT: YES (HTTP 401 verificado para anônimos e tokens inválidos — `v38` ACTIVE)
guest permitido: NO (Eliminado integralmente)
CORS fail-closed: YES (HTTP 403 para origens não autorizadas)
Request Size Guard: YES (HTTP 413 para payloads > 64KB)
RLS: ACTIVE
rate limiting: ACTIVE (`consume_voice_rate_limit`, `consume_ai_rate_limit`)

## Observabilidade
Health checks: ACTIVE (:7880, :8000, :11434)
Metrics: ACTIVE (`ai_audit_events` no Supabase com `primary_model`, `actual_model`, `actual_provider`, `model_fallback_used`, `provider_fallback_used`, `fallback_used`, `latency_ms`, `attempts`, `retrievalMethod`, `retrieval_contextualized`, `retrievedSourceCount`, `embedding_model`, `credential_source`, `credential_present`)
Headers de observabilidade: `X-Aeternum-AI-Source`, `X-Aeternum-AI-Model`, `X-Aeternum-AI-Fallback`
Logs: ACTIVE (Transcripts de sessão e logs do Docker Compose)

## Status Geral

- Production: READY / DEPLOYED
- Local AI: RUNNING / HEALTHY
- Cloud fallback: CONFIGURED / AUDITED
- Sovereign inference: EM CONSOLIDAÇÃO (Fases 0, 1, 2A, 2B.1 e 2B.2 concluídas; P0.1.1 Closure Gate VERIFIED em produção com live generation Gemini 3.7 & 2.5, contextual resilience e igualdade criptográfica de código comprovada)

---

## Provider Status

| Serviço | Provider | Local/Cloud | Ativo | Fallback |
|---|---|---|---|---|
| LLM (Texto) | Google Gemini (3.7 Flash / 2.5 Flash) | Cloud | YES (LIVE 200 OK) | Base Anatômica RAG Local Contextualizada |
| LLM (Voz) | Ollama Qwen 3B | Local | YES | Gemma / Gemini Cloud |
| STT | Faster-Whisper | Local | YES | Deepgram Nova-3 |
| TTS | Kokoro / Piper | Local | YES | Cartesia Sonic-3 |
| RAG | Supabase PostgreSQL | Cloud DB | YES (20.302 chunks) | Local 17 Sistemas / FTS Contextualizado |
| LiveKit | Community | Local | YES | - |

# AETERNUM ATLAS — ESTADO ATUAL

Última atualização: 2026-08-24 14:20 BRT
Commit: 8ae88ec

## Frontend
Provider: Vercel
Status: DEPLOYED / ACTIVE (https://www.aeternumatlas.com)

## Authentication
Provider: Supabase GoTrue
Status: ACTIVE / ENFORCED

## AI Gateway
Status: PLANNED (Fase 2 em estruturação)
Endpoint interno: localhost:8000 (Planejado)

## LLM
Provider primário: Google Gemini (Chat) / Ollama Qwen 2.5:3b (Voz Local)
Modelo: gemini-2.0-flash / qwen2.5:3b
Local/Cloud: Hybrid (Chat Cloud / Voz Local)
Fallback: Dicionário Anatômico Canônico Local (Edge Function) / Gemma (Cloud)

## STT
Provider primário: Faster-Whisper
Modelo: faster-whisper-medium / small
Local/Cloud: Local (HP Victus - Speaches :8000)
Fallback: Deepgram Nova-3 (Cloud Fallback)

## TTS
Provider primário: Kokoro-82M / Piper
Modelo: Kokoro v0.19 / Piper
Local/Cloud: Local (HP Victus - Speaches :8000)
Fallback: Cartesia Sonic-3 / Deepgram Aura-2 (Cloud Fallback)

## RAG
Provider: Supabase pgvector
Tabela/base: vita_anatomical_knowledge
Quantidade aproximada de chunks: 20.302
Método de recuperação: match_vita_anatomical_knowledge (embeddings 768d) + Base Local 17 Sistemas

## Memory
Provider: Supabase PostgreSQL
Tabela: vita_tutor_memory, ai_conversations, ai_messages

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
voice-token exige JWT: YES (HTTP 401 verificado para anônimos)
ai-tutor exige JWT: YES (HTTP 401 verificado para anônimos)
guest permitido: NO (Eliminado integralmente nas v3 e v17)
RLS: ACTIVE
rate limiting: ACTIVE (consume_voice_rate_limit, consume_ai_rate_limit)

## Observabilidade
Health checks: ACTIVE (:7880, :8000, :11434)
Metrics: ACTIVE (ai_audit_events no Supabase)
Logs: ACTIVE (Transcripts de sessão e logs do Docker Compose)

## Status Geral

- Production: READY / DEPLOYED
- Local AI: RUNNING / HEALTHY
- Cloud fallback: CONFIGURED
- Sovereign inference: EM CONSOLIDAÇÃO (Fases 0 e 1 concluídas)

---

## Provider Status

| Serviço | Provider | Local/Cloud | Ativo | Fallback |
|---|---|---|---|---|
| LLM (Texto) | Google Gemini | Cloud | YES | Base Anatômica Local |
| LLM (Voz) | Ollama Qwen 3B | Local | YES | Gemma / Gemini Cloud |
| STT | Faster-Whisper | Local | YES | Deepgram Nova-3 |
| TTS | Kokoro / Piper | Local | YES | Cartesia / Deepgram |
| RAG | Supabase | Cloud DB | YES | Local 17 Sistemas |
| LiveKit | Community | Local | YES | - |

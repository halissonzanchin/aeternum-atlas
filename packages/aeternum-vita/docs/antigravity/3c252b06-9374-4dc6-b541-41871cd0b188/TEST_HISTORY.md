# HISTÓRICO DE TESTES & BENCHMARKS — AETERNUM SOVEREIGN AI

---

## Teste 001 — Matriz de Validação de Segurança P0 (Borda & Auth)

Data: 2026-08-24 14:05 BRT  
Commit: 8ae88ec  
Ambiente: Supabase Edge Functions (`hyivyrietgjdazgizafp`)

### Cenário
Testar a resposta dos endpoints `voice-token` e `ai-tutor` contra requisições sem autenticação e com tokens JWT forjados/expirados.

### Resultados Obtidos:
1. `POST /functions/v1/voice-token` (Sem JWT) -> **HTTP 401 Unauthorized** (`AUTH_REQUIRED`) ✅
2. `POST /functions/v1/ai-tutor` (Sem JWT) -> **HTTP 401 Unauthorized** (`AUTH_REQUIRED`) ✅
3. `POST /functions/v1/voice-token` (JWT Forjado) -> **HTTP 401 Unauthorized** (`AUTH_INVALID`) ✅
4. `POST /functions/v1/ai-tutor` (JWT Forjado) -> **HTTP 401 Unauthorized** (`AUTH_INVALID`) ✅

### Resultado
PASS (100% de Bloqueio de Anônimos)

---

## Teste 002 — Matriz de Verificação Anatômica de 17 Sistemas em 4 Idiomas

Data: 2026-08-24 13:20 BRT  
Commit: 7737d82  
Ambiente: `apps/agent` (Aeternum Vita)

### Cenário
Simular perguntas de estudantes para os 4 tutores (`eduardo` 🇧🇷, `antonia` 🇪🇸, `ariana` 🇺🇸, `fabian` 🇩🇪) cobrindo membros superiores, membros inferiores, neuroanatomia, tórax e abdome.

### Métricas:
- Testes unitários executados: 44
- Testes aprovados: 44 (100%)
- Duração da suíte: 1.65s

### Resultado
PASS

---

## Teste 003 — Suíte Completa do Monorepo Aeternum Vita

Data: 2026-08-24 13:21 BRT  
Commit: 7737d82  
Ambiente: Vitest Monorepo (`apps/agent`, `apps/token-server`, `apps/web`)

### Métricas:
- Arquivos de teste: 11
- Total de testes: 64
- Aprovados: 64 (100%)
- Falhas: 0

### Resultado
PASS

---

## Cronologia Completa P0.1 / P0.1.1 (ai-tutor v23 a v38)

- **v23 — Regressão Inicial**: Diagnóstico de simplificação inadvertida e baseline comprometido.
- **v25 — Restauração do Rich Baseline**: Restauração integral do baseline com RAG PostgreSQL FTS, histórico conversacional, CORS fail-closed e 64KB guard.
- **v26 — Migração de Embedding**: Atualização do modelo vetorial para `gemini-embedding-2` (768 dimensões) alinhado ao pgvector.
- **v27 — Diagnóstico de Chave Comprometida**: Identificação de HTTP 403 com erro canônico `API_KEY_REPORTED_LEAKED`.
- **v28 — Mapeamento de Razão Canônica**: Implementação da taxonomia de erros do provedor (`PERMISSION_DENIED`, `QUOTA_EXCEEDED`, etc.).
- **v29 — Observabilidade e Isolamento de Credencial**: Eliminação de leitura direta do Vault; uso estrito de variáveis de ambiente no Supabase Edge Runtime.
- **Rotação de Credencial**: Configuração manual da nova `GEMINI_API_KEY` no Supabase Secrets sem exposição de texto.
- **v30-v35 — Isolamento de Conectividade e Inferência**: Criação de probes de rede e geração para isolar latência TLS/DNS da inferência com thinking do Gemini 3.7.
- **v36 — Sucesso da Geração Cloud Gemini**: Primeiro registro live comprovado de `actual_provider: "google-gemini"` (`gemini-2.5-flash`, 2458ms).
- **v37 — Política Estrita de Fallback e Semântica Dividida**: Definição do modelo primário `gemini-3.7-flash` e fallback único `gemini-2.5-flash` apenas em erros recuperáveis (429, 500, 502, 503, 504, timeout, unavailable).
- **v38 — Resiliência de Contexto e Fechamento (P0.1.1 Closure)**:
  - Recuperação contextual limitada (1 mensagem anterior do usuário + prompt atual) para RAG e fallback determinístico local.
  - Restauração do probe dedicado puro `models.get` (253ms, HTTP 200).
  - Prova de igualdade criptográfica: `Git index SHA256 == Production index SHA256` (`bdb12df8752e2a1588d714998facc01721c61b251b3a7e795455bfcac94a40b2`).
  - Teste determinístico de fallback contextualizado: PASS (nervo radial reconhecido sem resposta genérica).
  - Execução live multi-turn: Turn 1 com RAG (6 fontes) e Turn 2 com Gemini 3.7 Flash direto em 5262ms mantendo coerência semântica.

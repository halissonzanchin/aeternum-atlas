# HISTÓRICO DE TESTES & BENCHMARKS — AETERNUM SOVEREIGN AI

---

## Teste 005 — Suíte de Testes de Contratos de Providers (Fase 2A)

Data: 2026-08-24 15:30 BRT  
Ambiente: `packages/aeternum-vita/apps/agent` (Vitest)

### Cenários Executados:
1. LLMProvider: geração de resposta com tipagem e metadados canônicos -> **PASS** ✅
2. LLMProvider: streaming assíncrono de chunks -> **PASS** ✅
3. LLMProvider: reporte de status de saúde canônico (HEALTHY/UNAVAILABLE) -> **PASS** ✅
4. STTProvider: transcrição de áudio com metadados e confiança -> **PASS** ✅
5. STTProvider: streaming de transcrição parcial e final -> **PASS** ✅
6. TTSProvider: síntese de voz com formato de áudio especificado -> **PASS** ✅
7. TTSProvider: streaming de áudio sintetizado -> **PASS** ✅
8. RAGProvider: retorno estruturado com método de recuperação e citação obrigatória -> **PASS** ✅
9. MemoryProvider: isolamento do contexto do estudante sem contaminação enciclopédica -> **PASS** ✅
10. Canonical Errors: instanciação de erros com código canônico e providerId -> **PASS** ✅

### Métricas Globais do Monorepo:
- `apps/agent`: 54 testes aprovados (7 arquivos)
- `apps/token-server`: 6 testes aprovados (2 arquivos)
- `apps/web`: 14 testes aprovados (3 arquivos)
- **Total: 74/74 testes aprovados (100% Green)**

### Resultado
PASS

---

## Teste 004 — Hardening de Privilégios do Vault (Fase 1.3)

Data: 2026-08-24 15:19 BRT  
Ambiente: Supabase PostgreSQL & Edge Functions (`hyivyrietgjdazgizafp`)

### Verificação de Privilégios no Banco (has_function_privilege):
- `anon` EXECUTE: **FALSE** ✅
- `authenticated` EXECUTE: **FALSE** ✅
- `service_role` EXECUTE: **TRUE** ✅
- `postgres` EXECUTE: **TRUE** ✅

### Cenários de Invocação de API:
1. `POST /rest/v1/rpc/get_system_secret` (Anon) -> **HTTP 401 (42501 permission denied)** ✅
2. `POST /rest/v1/rpc/get_system_secret` (Authenticated Student) -> **HTTP 403 (42501 permission denied)** ✅
3. `POST /functions/v1/voice-token` (JWT Válido via service_role) -> **HTTP 201 Created** ✅
4. `POST /functions/v1/voice-token` (Sem JWT) -> **HTTP 401 Unauthorized** ✅
5. `POST /functions/v1/ai-tutor` (JWT Válido) -> **HTTP 200 OK** ✅

### Resultado
PASS (100% Blindado contra Acesso Externo a Segredos)

---



## Teste 001 — Matriz de Validação de Segurança P0 (Bloqueio Negativo de Anônimos)

Data: 2026-08-24 14:05 BRT  
SUPABASE_EDGE_VERSIONS: voice-token v3, ai-tutor v17  
Ambiente: Supabase Edge Functions (hyivyrietgjdazgizafp)

### Resultados Obtidos:
1. POST /functions/v1/voice-token (Sem JWT) -> HTTP 401 Unauthorized (AUTH_REQUIRED) ✅
2. POST /functions/v1/ai-tutor (Sem JWT) -> HTTP 401 Unauthorized (AUTH_REQUIRED) ✅
3. POST /functions/v1/voice-token (JWT Forjado) -> HTTP 401 Unauthorized (AUTH_INVALID) ✅
4. POST /functions/v1/ai-tutor (JWT Forjado) -> HTTP 401 Unauthorized (AUTH_INVALID) ✅

### Resultado
PASS (100% de Bloqueio de Anônimos)

---

## Teste 002 — Validação Positiva P0 com Usuário Autenticado Real

Data: 2026-08-24 14:40 BRT  
SUPABASE_EDGE_VERSIONS: voice-token v4, ai-tutor v17  
Ambiente: Supabase Edge Functions (hyivyrietgjdazgizafp)

### Resultados Obtidos:
1. POST /functions/v1/voice-token (Com JWT Válido) -> HTTP 201 Created ✅
2. POST /functions/v1/ai-tutor (Com JWT Válido) -> HTTP 200 OK ✅

### Resultado
PASS

---

## Teste 003 — Matriz Completa Fail-Closed de Borda (Fase 1.2)

Data: 2026-08-24 15:13 BRT  
SUPABASE_EDGE_VERSIONS: voice-token v7 (Fail-Closed), ai-tutor v17  
Ambiente: Supabase Edge Functions (hyivyrietgjdazgizafp)

### Cenários Executados:
1. POST /voice-token (Sem JWT) -> HTTP 401 Unauthorized (AUTH_REQUIRED) ✅
2. POST /voice-token (JWT Forjado) -> HTTP 401 Unauthorized (AUTH_INVALID) ✅
3. POST /voice-token (Origem Proibida: https://malicious-attacker-site.com) -> HTTP 403 Forbidden (ORIGIN_DENIED) ✅
4. POST /voice-token (JWT Válido de Aluno Ativo) -> HTTP 201 Created ✅
5. POST /ai-tutor (Sem JWT) -> HTTP 401 Unauthorized (AUTH_REQUIRED) ✅
6. POST /ai-tutor (JWT Válido de Aluno Ativo) -> HTTP 200 OK (SSE Stream) ✅

### Resultado
PASS (100% Fail-Closed e Zero Credenciais Default)

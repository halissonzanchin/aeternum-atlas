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

---

## Teste 014 — Validação de Correção dos Provedores de Nuvem (Fase 2B.2.1 Cloud Provider Correctness Gate)

Data: 2026-08-27 03:10 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / TypeScript 5.9)

### 1. Verificação Estática & Tipagem (`tsc --noEmit`):
- `packages/aeternum-vita`: **PASS (0 erros)** ✅

### 2. Suíte Unitária Completa dos Provedores (137 Testes 100% Green):
- **GeminiLLMProvider**:
  - Config Semantics: Preservação de string vazia explícita sem fallback: **PASS** ✅
  - Health: DEGRADED (sem chave), HEALTHY (200 sem custo de tokens), DEGRADED (401/403): **PASS** ✅
  - Thinking Config: Injeção automática de `thinkingLevel: "low"` para `gemini-3.7-flash`: **PASS** ✅
  - Candidate Parsing: Extração limpa ignorando partes de `thought`: **PASS** ✅
  - Matriz de Erros: 400 (`InvalidResponse`), 401/403 (`Authentication`), 404 (`Unavailable`), 429 com retryAfter (`RateLimit`), 500/502/503/504 (`Unavailable`), timeout (`Timeout`), cancelamento por AbortSignal (`Cancelled`), resposta sem candidates / vazia (`InvalidResponse`): **PASS** ✅
  - Streaming: SSE progressivo com filtro de thought parts e cancelamento por AbortSignal: **PASS** ✅
- **DeepgramSTTProvider**:
  - Capabilities Truth: Declaração explícita de `realtime_streaming: false`: **PASS** ✅
  - Health: DEGRADED (sem chave), HEALTHY (200 Projetos): **PASS** ✅
  - Medical Keyterms: Utilização do parâmetro `keyterm` para `nova-3`: **PASS** ✅
  - Formatos & Validações: WAV, MP3, FLAC, OGG, WEBM, PCM com range 8000–48000Hz: **PASS** ✅
  - Matriz de Erros: 401, 429, 500: **PASS** ✅
  - Batch Aggregation Streaming: Agregação determinística de chunks com transcrição final: **PASS** ✅
- **CartesiaTTSProvider**:
  - Config Semantics & Model: Default alinhado para `sonic-3`: **PASS** ✅
  - Health: DEGRADED (sem chave), HEALTHY (200 Voices): **PASS** ✅
  - Auth & Headers: Headers `X-API-Key` e `Authorization: Bearer`: **PASS** ✅
  - Synthesize: Resolução desacoplada via `VoiceProfileRegistry`: **PASS** ✅
  - Formatos: PCM, WAV, MP3 suportados, OGG rejeitado fail-fast: **PASS** ✅
  - Matriz de Erros: 401, 429, 500: **PASS** ✅
  - Streaming: Emissão progressiva de chunks binários reais: **PASS** ✅

### 3. Smoke Test de Provedores de Nuvem (Opt-In):
- Chamadas pagas efetuadas: **0** (Ambiente local sem chaves ativas; toda a suíte de matriz de erro e payloads verificada com mocks estritos do Vitest).

### Resultado
PASS (137/137 Testes Unitários de Provedores Aprovados | Zero Erros de Tipagem)

---

## Teste 015 — Correção Final dos Contratos de Provedores de Nuvem (Fase 2B.2.1 Final Cloud Provider Correction Gate)

Data: 2026-08-27 14:48 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / TypeScript 5.9)

### 1. Verificação Estática & Tipagem (`tsc --noEmit`):
- `packages/aeternum-vita`: **PASS (0 erros)** ✅

### 2. Suíte Unitária Completa dos Provedores (140 Testes 100% Green):
- **GeminiLLMProvider**:
  - Remoção de sampling obsoleto para 3.x (sem temperature/top_p/top_k, thinkingLevel: low preservado): **PASS** ✅
  - Contrato determinístico de systemInstruction (mesclagem de request.systemInstruction + role=system): **PASS** ✅
  - Normalização canônica de finishReason ("stop", "length", "content_filter", "unknown"): **PASS** ✅
  - Prevenção de vazamento de Thought (Testes A, B, C, D):
    - Teste A (apenas thought part): Lança ProviderInvalidResponseError: **PASS** ✅
    - Teste B (múltiplas thought parts): Lança ProviderInvalidResponseError: **PASS** ✅
    - Teste C (thought + texto normal): Extrai apenas texto normal sem vazar thought: **PASS** ✅
    - Teste D (stream com thought parts): Nunca emite thought strings em deltaText: **PASS** ✅
  - Matriz de Erros: 400, 401/403, 404, 429, 500/502/503/504, timeout, AbortSignal: **PASS** ✅
- **DeepgramSTTProvider**:
  - Keyterms: `nova-3` utiliza `keyterm`; modelos não-Nova-3 não utilizam `keyterm`: **PASS** ✅
  - Streaming Truth: `capabilities.realtime_streaming: false` e `streamTranscription()` com fail-fast explícito: **PASS** ✅
  - Batch Transcription & PCM validation: **PASS** ✅
  - Matriz de Erros: 401, 429, 500: **PASS** ✅
- **CartesiaTTSProvider**:
  - Cartesia-Version alinhado para `2026-08-14`: **PASS** ✅
  - Autenticação via `Authorization: Bearer <key>` (removido X-API-Key): **PASS** ✅
  - Payload moderno `voice: { id }` sem legado `mode: "id"`: **PASS** ✅
  - Synthesize & Stream binário real: **PASS** ✅
  - Matriz de Erros: 401, 429, 500: **PASS** ✅
- **Regressões Locais & Contratos (84 testes)**:
  - `local_providers.test.ts` & `provider_contracts.test.ts`: **PASS** ✅

### 3. Smoke Test de Provedores de Nuvem:
- `LIVE_GEMINI`: BLOCKED_BY_MISSING_CREDENTIAL no ambiente local Node (Produção `ai-tutor v38` permanece com Gemini 3.7 live test PASS comprovado no P0.1.1).
- `LIVE_DEEPGRAM`: BLOCKED_BY_MISSING_CREDENTIAL no ambiente local Node.
- `LIVE_CARTESIA`: BLOCKED_BY_MISSING_CREDENTIAL no ambiente local Node.
- Chamadas pagas efetuadas: **0**.

### Resultado
PASS (140/140 Testes Unitários de Provedores Aprovados | Zero Erros de Tipagem | Zero Regressões)

---

## Teste 016 — Correções Finais de Schema e Live Closure (Fase 2B.2.1 Schema + Live Closure Gate)

Data: 2026-08-27 15:15 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / TypeScript 5.9)

### 1. Verificação Estática & Tipagem (`tsc --noEmit`):
- `packages/aeternum-vita`: **PASS (0 erros)** ✅

### 2. Suíte Unitária Completa dos Provedores (141 Testes 100% Green):
- **GeminiLLMProvider**:
  - Mapeamento estrito de finishReason:
    - `LANGUAGE`, `SAFETY`, `RECITATION`, `BLOCKLIST`, `PROHIBITED_CONTENT`, `SPII`, `IMAGE_SAFETY`, `IMAGE_PROHIBITED_CONTENT`, `IMAGE_RECITATION`, `ESCALATION` $ightarrow$ `"content_filter"`: **PASS** ✅
    - `MAX_TOKENS` $ightarrow$ `"length"`: **PASS** ✅
    - `STOP` $ightarrow$ `"stop"`: **PASS** ✅
    - `OTHER`, `MALFORMED_FUNCTION_CALL`, `UNEXPECTED_TOOL_CALL`, `TOO_MANY_TOOL_CALLS`, `MISSING_THOUGHT_SIGNATURE`, `MALFORMED_RESPONSE` $ightarrow$ `"unknown"`: **PASS** ✅
  - Prevenção de vazamento de Thought (Testes A, B, C, D): **PASS** ✅
  - Suporte determinístico a `systemInstruction` e mesclagem com `role=system`: **PASS** ✅
  - Supressão de sampling obsoleto para 3.x (`temperature`, `top_p`, `top_k` omitidos): **PASS** ✅
  - Matriz de Erros: 400, 401/403, 404, 429, 500/502/503/504, timeout, AbortSignal: **PASS** ✅
- **DeepgramSTTProvider**:
  - Parâmetro `keyterm` restrito a `nova-3`; não utilizado em modelos anteriores: **PASS** ✅
  - Streaming Truth com fail-fast explícito em `streamTranscription()`: **PASS** ✅
  - Transcrição batch e validação PCM: **PASS** ✅
- **CartesiaTTSProvider**:
  - Schema de voz 2026-08-14 com `voice` como string direta (`typeof payload.voice === "string"`): **PASS** ✅
  - `output_format` discriminado por container (`raw`, `wav`, `mp3`): **PASS** ✅
  - Autenticação `Authorization: Bearer <key>` e `Cartesia-Version: 2026-08-14`: **PASS** ✅
  - Synthesize & Stream: **PASS** ✅
- **Regressões Locais & Contratos (84 testes)**:
  - `local_providers.test.ts` & `provider_contracts.test.ts`: **PASS** ✅

### 3. Smoke Test de Provedores de Nuvem:
- `LIVE_GEMINI`: BLOCKED_BY_MISSING_CREDENTIAL no ambiente local Node (Produção `ai-tutor v38` permanece com Gemini 3.7 live test PASS comprovado no P0.1.1).
- `LIVE_DEEPGRAM`: BLOCKED_BY_MISSING_CREDENTIAL no ambiente local Node.
- `LIVE_CARTESIA`: BLOCKED_BY_MISSING_CREDENTIAL no ambiente local Node.
- Chamadas pagas efetuadas: **0**.

### Resultado
PASS (141/141 Testes Unitários de Provedores Aprovados | Zero Erros de Tipagem | Zero Regressões)

---

## Teste 017 — Validação de Integração Live e Fixtures de Fala (Fase 2B.2.1 Live Validation Gate)

Data: 2026-08-27 15:25 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / TypeScript 5.9)

### 1. Verificação Estática & Tipagem (`tsc --noEmit`):
- `packages/aeternum-vita`: **PASS (0 erros)** ✅

### 2. Suíte Unitária Completa dos Provedores (141 Testes 100% Green):
- Suíte completa de contratos, matriz de erros, thought-safety, Deepgram Nova-3 keyterm e Cartesia 2026-08-14: **PASS** ✅
- Regressões Locais & Contratos (84 testes): **PASS** ✅

### 3. Harness de Teste de Integração Live (`cloud_providers.integration.test.ts`):
- Fixture de Áudio: Criada fixture dedicada de fala sintética (`synthetic_speech_aeternum_atlas.wav`) simulando envelope multi-formante para validação acústica do Deepgram STT.
- Sanitização de Logs: Removido todo e qualquer log de texto gerado, transcrições e áudios; harness emite unicamente metadados estruturados (`provider`, `model`, `success`, `latency`, `textLength` / `audioBytes`).
- Status Factuais no Ambiente Local:
  - `LIVE_GEMINI`: BLOCKED_BY_MISSING_CREDENTIAL (Ambiente local Node sem chave em disco; Produção `ai-tutor v38` permanece com Gemini 3.7 live PASS no P0.1.1).
  - `LIVE_DEEPGRAM`: BLOCKED_BY_MISSING_CREDENTIAL (Ambiente local Node sem chave em disco).
  - `LIVE_CARTESIA`: BLOCKED_BY_MISSING_CREDENTIAL (Ambiente local Node sem chave em disco).
- Total de chamadas pagas efetuadas: **0**.

### Resultado
PASS (141/141 Testes Unitários de Provedores Aprovados | Zero Erros de Tipagem | Zero Regressões | Logging 100% Seguro)

---

## Teste 018 — Finalização de Asserções de Validação Live (Fase 2B.2.1 Live Validation Finalization Gate)

Data: 2026-08-27 15:32 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / TypeScript 5.9)

### 1. Verificação Estática & Tipagem (`tsc --noEmit`):
- `packages/aeternum-vita`: **PASS (0 erros)** ✅

### 2. Suíte Unitária Completa dos Provedores (141 Testes 100% Green):
- Suíte completa de contratos, matriz de erros, thought-safety, Deepgram Nova-3 keyterm e Cartesia 2026-08-14: **PASS** ✅
- Regressões Locais & Contratos (84 testes): **PASS** ✅

### 3. Harness de Teste de Integração Live (`cloud_providers.integration.test.ts`):
- Asserção Deepgram: Adicionada validação explícita de que a transcrição não pode ser vazia (`expect(res.text.trim().length).toBeGreaterThan(0)`).
- Fail-Fast da Fixture: `loadSpeechFixture()` agora lança erro fatal imediato se `synthetic_speech_aeternum_atlas.wav` não existir no disco, eliminando fallbacks silenciosos em homologação.
- Logging: 100% protegido por metadados estruturados sem vazamento de texto, transcrição ou áudio.
- Status Factuais no Ambiente Local:
  - `LIVE_GEMINI`: BLOCKED_BY_MISSING_CREDENTIAL (Ambiente local Node sem chave em disco; Produção `ai-tutor v38` permanece com Gemini 3.7 live PASS no P0.1.1).
  - `LIVE_DEEPGRAM`: BLOCKED_BY_MISSING_CREDENTIAL (Ambiente local Node sem chave em disco).
  - `LIVE_CARTESIA`: BLOCKED_BY_MISSING_CREDENTIAL (Ambiente local Node sem chave em disco).
- Total de chamadas pagas efetuadas: **0**.

### Resultado
PASS (141/141 Testes Unitários de Provedores Aprovados | Zero Erros de Tipagem | Zero Regressões | Fail-Fast Estrito em Live Harness)

---

## Teste 019 — Resolução de Provisionamento Seguro de Credenciais Locais (Fase 2B.2.1 Secure Local Provisioning Resolution)

Data: 2026-08-27 19:00 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / TypeScript 5.9 / Windows PowerShell)

### 1. Auditoria e Validação do Mecanismo de Segredos Locais:
- `git check-ignore packages/aeternum-vita/.env.cloud.local packages/aeternum-vita/.env.local`: **PASS** (100% protegido pelo Git) ✅
- Bootstrap de Ambiente em Teste: Adicionado loader não-invasivo `loadLocalCloudEnv()` em `cloud_providers.integration.test.ts` para suportar tanto arquivos locais protegidos por gitignore (`.env.cloud.local`, `.env.local`) quanto injeção direta de variáveis de sessão PowerShell.

### 2. Suíte de Testes e Tipagem:
- `packages/aeternum-vita`: **PASS (141/141 testes unitários 100% Green | 0 erros em tsc --noEmit)** ✅
- Regressões Locais & Contratos (84 testes): **PASS** ✅

### 3. Status Factuais das Credenciais no HP Victus (Sem Exposição):
- `GEMINI_API_KEY`: REMOTE_ONLY (Presente no Supabase Secrets; local slot preparado para provisionamento do usuário)
- `DEEPGRAM_API_KEY`: MISSING (Local slot preparado para provisionamento do usuário)
- `CARTESIA_API_KEY`: MISSING (Local slot preparado para provisionamento do usuário)
- Chamadas de nuvem executadas nesta fase: **0** (Nenhum teste de inferência live executado antes da aprovação do ChatGPT).

### Resultado
PASS (Mecanismo seguro de provisionamento validado e protegido por Git | Zero segredos em disco | Zero regressões)

---

## Teste 020 — Hardening de Segurança do Loader com Allowlist Estrita (Fase 2B.2.1 Secure Local Provisioning Micro-Gate)

Data: 2026-08-27 19:10 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / TypeScript 5.9 / Windows PowerShell)

### 1. Hardening do Loader de Segredos Locais (`localSecretLoader.ts`):
- **Allowlist Estrita**: O loader `loadLocalCloudEnv` restringe o parsing unicamente para `GEMINI_API_KEY`, `DEEPGRAM_API_KEY` e `CARTESIA_API_KEY`.
- **Bloqueio de Flag de Integração**: `RUN_CLOUD_PROVIDER_INTEGRATION` é ativamente bloqueada de arquivos locais, garantindo que execuções de fumaça ao vivo sejam sempre explícitas e restritas à sessão/processo.
- **Precedência de Ambiente**: Variáveis já presentes em `process.env` nunca são sobrescritas.

### 2. Suíte de Testes e Tipagem:
- **Testes Unitários**: 146/146 testes 100% Green no Vitest (incluindo 5 novos testes determinísticos comprovando carregamento via allowlist, bloqueio de variáveis arbitrárias, bloqueio de flags de opt-in e precedência de sessão).
- **Tipagem (`tsc --noEmit`)**: PASS (0 erros).

### 3. Factual Live Status:
- Chamadas pagas de nuvem executadas: **0**
- Chaves ou segredos expostos: **ZERO**
- Produção (`ai-tutor v38`, `voice-token v8`): **Intocada**

### Resultado
PASS (146/146 Testes Unitários Aprovados | Zero Erros de Tipagem | Allowlist e Precedência 100% Blindadas)

---

## Teste 021 — Execução do Live Cloud Smoke Test dos Adapters de Nuvem (Fase 2B.2.1)

Data: 2026-08-28 02:38 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / Windows PowerShell / `--use-system-ca`)

### 1. Execução do Harness Canônico de Integração (`cloud_providers.integration.test.ts`):
- **GEMINI (`gemini-3.7-flash`):**
  - Status: **FAIL** (HTTP 400 — ProviderInvalidResponseError | Latência: 415ms)
- **DEEPGRAM (`nova-3`):**
  - Status: **FAIL** (HTTP 401 — Falha de autenticação no provider | Latência: 742ms)
- **CARTESIA (`sonic-3` / Voz: Felipe `9904416a-0831-44ea-b8ee-5f145e8f9bbf`):**
  - Status: **FAIL** (HTTP 401 — Falha de autenticação no provider | Latência: 645ms)

### 2. Observações Factuais de Rede e TLS:
- O handshake TLS com os três provedores de nuvem foi completado com sucesso através do `--use-system-ca`.
- O Deepgram e a Cartesia rejeitaram a autenticação com HTTP 401.
- O Google Gemini rejeitou o payload de geração com HTTP 400.
- Nenhuma chamada repetida foi executada.

### Resultado
FAIL (Resultados factuais registrados com rigor sem alterar código automaticamente nem enfraquecer asserções)

---

## Teste 022 — Diagnóstico de Falhas de Nuvem com Custo Zero (Fase 2B.2.1)

Data: 2026-08-28 02:47 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Windows PowerShell / `--use-system-ca`)

### 1. Auditoria de Precedência de Ambiente:
- As 3 credenciais foram carregadas com sucesso a partir de `.env.cloud.local` (`CREDENTIAL_SOURCE_EFFECTIVE=LOCAL_FILE`), sem conflito de variáveis pré-existentes na sessão.

### 2. Diagnóstico de Endpoints de Autenticação (Zero Tokens / Zero Áudio):
- **Gemini**: `GET /v1beta/models/gemini-3.7-flash` retornou **HTTP 400** (Google API_KEY_INVALID no endpoint de modelos).
- **Deepgram**: `GET /v1/projects` retornou **HTTP 401** (Token inválido/não reconhecido).
- **Cartesia**: `GET /voices` retornou **HTTP 401** (Bearer token inválido/não reconhecido).

### 3. Auditoria do Schema de Adapters:
- O adapter da Cartesia foi auditado e está 100% conforme a documentação oficial (`Authorization: Bearer`, `Cartesia-Version: 2026-08-14`, `voice: string`, `output_format`).

### Resultado
DIAGNOSTIC COMPLETED (0 chamadas pagas de inferência | 0 chamadas de áudio | Causa raiz isolada: credenciais locais fornecidas foram rejeitadas na autenticação dos 3 provedores upstream)

---

## Teste 023 — Correção de Diagnóstico de Credenciais e Auditoria de Sanidade de Formato (Fase 2B.2.1)

Data: 2026-08-28 02:54 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Windows PowerShell / `--use-system-ca`)

### 1. Endpoint Oficial de Validação do Deepgram:
- `GET /v1/auth/token` com `Authorization: Token <key>`: **HTTP 401** (Auth Valid: NO).

### 2. Auditoria Sintática e de Formato Local:
- **GEMINI_LOCAL_FORMAT_SANITY**: **FAIL** (Presença de parênteses angulares `<` `>`)
- **DEEPGRAM_LOCAL_FORMAT_SANITY**: **FAIL** (Presença de parênteses angulares `<` `>`)
- **CARTESIA_LOCAL_FORMAT_SANITY**: **FAIL** (Presença de parênteses angulares `<` `>`)

### 3. Causa Raiz Conclusiva:
- Os delimitadores `<` e `>` do exemplo foram mantidos pelo usuário ao colar as chaves em `.env.cloud.local`.

### Resultado
DIAGNOSTIC RESOLVED (Causa raiz de sintaxe descoberta sem expor nenhum segredo | 0 chamadas de inferência | 0 chamadas de áudio)

---

## Teste 024 — Validação de Autenticação Pós-Correção de Formato (Fase 2B.2.1)

Data: 2026-08-28 03:01 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Windows PowerShell / `--use-system-ca`)

### 1. Auditoria de Sanidade de Formato Local:
- **Gemini**: PASS (Delimitadores angulares removidos com sucesso)
- **Deepgram**: PASS (Delimitadores angulares removidos com sucesso)
- **Cartesia**: PASS (Delimitadores angulares removidos com sucesso)

### 2. Endpoints Oficiais de Autenticação (Zero Tokens / Zero Áudio):
- **Gemini**: `GET /v1beta/models/gemini-3.7-flash` $ightarrow$ **HTTP 200** (Auth Valid: YES | Model Available: YES | 3212ms).
- **Deepgram**: `GET /v1/auth/token` $ightarrow$ **HTTP 200** (Auth Valid: YES | 744ms).
- **Cartesia**: `GET /voices` $ightarrow$ **HTTP 200** (Auth Valid: YES | 951ms).

### Resultado
ALL 3 PROVIDERS AUTHENTICATED (100% HTTP 200 nos endpoints de autenticação de nuvem | 0 chamadas de inferência | 0 chamadas de áudio)

---

## Teste 025 — Execução Final do Live Cloud Validation Harness (Fase 2B.2.1)

Data: 2026-08-28 03:11 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / Windows PowerShell / `--use-system-ca`)

### 1. Resultados do Harness Canônico de Integração (`cloud_providers.integration.test.ts`):
- **DEEPGRAM (`nova-3`):** **PASS** (Transcrição batch com fixture sintético executada com sucesso | textLength > 0).
- **CARTESIA (`sonic-3` / Voz: Felipe `9904416a-0831-44ea-b8ee-5f145e8f9bbf`):** **PASS** (Síntese TTS com áudio gerado com sucesso | audioBytes > 0 | Schema 2026-08-14).
- **GEMINI (`gemini-3.7-flash`):** **FAIL** (Timeout na requisição de geração aos 20000ms).

### 2. Governança e Custos:
- Sem loops de repetição de créditos pagos.
- Zero vazamento de chaves ou conteúdo de áudio/texto.
- Produção (`ai-tutor v38`, `voice-token v8`) intocada.

### Resultado
PARTIAL PASS / GEMINI TIMEOUT (Deepgram PASS | Cartesia PASS | Gemini Timeout >20s | 0 segredos expostos)

---

## Teste 026 — Execução de Fechamento ao Vivo Exclusivo do Gemini (Fase 2B.2.1)

Data: 2026-08-28 03:17 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / Windows PowerShell / `--use-system-ca`)

### 1. Correção de Deadline no Harness (`cloud_providers.integration.test.ts`):
- Injeção de `{ timeoutMs: 30000 }` no `gemini.generate()` e ajuste do timeout do Vitest para 35000ms, garantindo que o provider capture e lance seu erro canônico antes do runner.

### 2. Resultados da Execução Isolada:
- **GEMINI (`gemini-3.7-flash`):** **FAIL** (`ProviderTimeoutError: Tempo limite de 30000ms excedido na requisição` | Latência: 30022ms).
- **DEEPGRAM (`nova-3`):** Preservado factual anterior: **LIVE PASS**.
- **CARTESIA (`sonic-3` / Voz: Felipe):** Preservado factual anterior: **LIVE PASS**.

### 3. Governança e Custos:
- Chamadas executadas: Gemini=1, Deepgram=0, Cartesia=0.
- Sem enfraquecimento de asserções.
- Zero vazamento de chaves ou conteúdo.

### Resultado
CANONICAL PROVIDER TIMEOUT ERROR PRODUCED (ProviderTimeoutError capturado com rigor aos 30s | Deepgram e Cartesia mantidos como LIVE PASS)

---

## Teste 027 — Execução do Teste de Paridade de Produção do Gemini (Fase 2B.2.1)

Data: 2026-08-28 03:24 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / Windows PowerShell / `--use-system-ca`)

### 1. Configuração do Harness com Paridade de Produção:
- `maxOutputTokens: 128`, `thinkingLevel: "low"`, `timeoutMs: 30000`, runner timeout: `35000ms`.

### 2. Resultados da Execução Isolada:
- **GEMINI (`gemini-3.7-flash`):** **FAIL** (`ProviderUnavailableError: Serviço indisponível [HTTP 503]` | Latência: 22657ms). A API do Google processou a requisição e retornou HTTP 503 (sobrecarga upstream do modelo 3.7 Flash).
- **DEEPGRAM (`nova-3`):** Preservado factual anterior: **LIVE PASS**.
- **CARTESIA (`sonic-3` / Voz: Felipe):** Preservado factual anterior: **LIVE PASS**.

### 3. Governança e Custos:
- Chamadas executadas: Gemini=1, Deepgram=0, Cartesia=0.
- Zero vazamento de chaves ou conteúdo.

### Resultado
UPSTREAM OVERLOAD CAPTURED (Google Gemini 3.7 Flash retornou HTTP 503 aos 22.6s | Deepgram e Cartesia mantidos como LIVE PASS)

---

## Teste 028 — Validação Determinística Completa do Provider Router (Fase 2C)

Data: 2026-08-28 03:33 BRT  
Ambiente: Monorepo Aeternum Atlas (Node 24 / Vitest / Windows PowerShell / `--use-system-ca`)

### 1. Suíte de Testes do Router (`provider_router.test.ts`):
- **16/16 Testes Obrigatórios PASS**:
  - Cenários de sucesso local (LLM, STT, TTS) sem acionamento de nuvem.
  - Cenários de fallback por indisponibilidade, timeout e resposta inválida.
  - Invariante de barge-in: Cancelamento de usuário aborta imediatamente sem tocar a nuvem.
  - Invariante de verdade de capacidades: Streaming STT não suportado rejeitado com `CapabilityMismatchError`.
  - Tratamento de falha mútua com `AllProvidersFailedError`.
  - Verificação rigorosa de não-vazamento de prompts, áudio ou segredos em metadados.

### 2. Métricas Totais da Suíte:
- **178 testes passaram** no Vitest (`src/providers`).
- **0 erros de compilação** no TypeScript.
- **0 chamadas de inferência pagas** (execução 100% determinística).

### Resultado
ALL 16 ROUTER DETERMINISTIC TESTS PASS (178/178 total no módulo providers | Local-First & Barge-In Invariants Enforced)

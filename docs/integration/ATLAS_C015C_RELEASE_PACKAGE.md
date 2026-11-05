# AETERNUM ATLAS / ATLAS CODE — RELEASE PACKAGE C-015C.1
## Unified Study Tools — Local AI Integration

- **Data de Emissão:** 2026-11-05
- **Branch do Gateway:** `feature/c015c-1-unified-study-tools`
- **Branch do Atlas Code:** `feature/c015c-1-unified-study-tools`
- **Status Operacional:** **HOMOLOGADO EM AMBIENTE ISOLADO — PONTO DE PARADA**
- **Ambiente de Testes:** Local Test Runner (Node.js v24.21.0 / Python 3.12 / Rust Toolchain)
- **Gateways Ativos:** Aeternum AI Gateway (PID 52296, Porta 8081), Atlas Daemon (PID 30120, Porta 14555), Ollama (PID 11356, Porta 11434)

---

### 1. Resumo Executivo

A Autorização Técnica C-015C.1 unifica as ferramentas de estudo acadêmico da Aeternum Atlas — **Mapa Mental Anatômico**, **Flashcards Anatômicos** e **Agenda de Estudos (Cronograma)** — integrando-as de forma direta, performática e isolada ao motor de inteligência artificial local Atlas Code (Qwen 3.5 4B acelerado por hardware RTX 4050).

Esta intervenção resolveu de forma definitiva as três causas raiz identificadas na auditoria diagnóstica C-015C:
1. **Incompatibilidade de Contrato (`mode: "live"` vs `mode: "online"`):** Os serviços legados de Mapa Mental e Flashcards exigiam estritamente `response.mode === "online"`, rejeitando a resposta válida `mode: "live"` retornada pelo Gateway da conectividade local.
2. **Poluição de Histórico e Conversas (`ai_messages`):** O gerador de Mapa Mental invocava o hook do chat do estudante (`sendMessage`), persistindo instruções técnicas e boilerplates de sistema no histórico visível do aluno.
3. **Falso Positivo de Intenção Clínica no Safe Engine:** A regex de segurança médica (`safeIntentResolver`) interceptava a regra negativa de formatação (*"Não inclua diagnóstico individual nem conduta terapêutica"*), classificando erroneamente solicitações didáticas como `CLINICAL_ANATOMY_QUERY`.

---

### 2. Componentes e Contratos Entregues

#### A. Contrato Unificado (`src/services/ai/studyToolContract.js`)
- Define as operações padrão:
  - `StudyToolOperation.TUTOR_ASK` (`"tutor.ask"`)
  - `StudyToolOperation.GENERATE_MIND_MAP` (`"study.generateMindMap"`)
  - `StudyToolOperation.GENERATE_FLASHCARDS` (`"study.generateFlashcards"`)
  - `StudyToolOperation.GENERATE_STUDY_PLAN` (`"study.generateStudyPlan"`)
- Define os estados determinísticos de resposta:
  - `StudyToolStatus.SUCCESS`
  - `StudyToolStatus.ERROR_AUTH`
  - `StudyToolStatus.ERROR_TRANSPORT`
  - `StudyToolStatus.ERROR_GATEWAY`
  - `StudyToolStatus.ERROR_CONTRACT`
  - `StudyToolStatus.ERROR_CLINICAL_REFUSAL`
  - `StudyToolStatus.ERROR_INSUFFICIENT_EVIDENCE`
- Helpers canônicos: `isStudyToolSuccess(res)`, `createStudyToolSuccess()`, `createStudyToolError()`, `normalizeStudyToolResponse()`.

#### B. Camada de Geração Isolada (`src/services/ai/unifiedStudyAIService.js`)
- Execução isolada sem poluição de contexto:
  - Realiza chamada HTTP autenticada via sessão do Supabase (`client.auth.getSession()`).
  - Envia payload com `conversationId: null` e contexto `{ source: "study-tool", operation }`.
  - Não despacha mensagens para o estado do `AtlasAITutorSessionContext` nem grava em `ai_messages`.
- Motor de Desambiguação de Nomenclatura Anatômica:
  - Mapeia termos históricos ou populares (ex: *"perone"* / *"perôneo"* -> *"Fíbula"*, *"omoplata"* -> *"Escápula"*, *"cúbito"* -> *"Ulna"*).
  - Retorna o contexto terminológico e opções anatômicas específicas.
- Geradores dedicados:
  - `generateMindMapAI({ topic, language })`
  - `generateFlashcardsAI({ topic, difficulty, count, language, existingQuestions })`
  - `generateStudyPlanAI({ topic, availableHours, daysCount, examDate, language, preferredTimes })`
  - `checkEngineHealth()`

#### C. Correção do Safe Engine (`safeIntentResolver.js` & `.ts`)
- Filtro prévio de diretivas negativas:
  - Remove expressões negativas como `/(?:nao|sem|evite|nunca|dispense|nem)\s+[^.\n;]*(?:diagnostico|conduta|terapia|tratamento|prescricao|receita)[^.\n;]*/gi` antes de avaliar os padrões clínicos.
  - Sincronizado nas três instâncias do Safe Engine:
    - `src/services/safe-engine/safeIntentResolver.js`
    - `supabase/functions/ai-tutor/safe-engine/core/safeIntentResolver.ts`
    - `supabase/functions/atlas-safe-engine/core/safeIntentResolver.ts`
  - Garante que perguntas clínicas reais (ex: *"Qual o diagnóstico e conduta para fratura de clavícula?"*) continuam bloqueadas com 100% de precisão.

#### D. Atualização do Mapa Mental Anatômico (`mindMapGenerationService.js` & `AnatomicalMindMapPage.jsx`)
- Aceita tanto `mode === "live"` quanto `mode === "online"`.
- Implementa `generateUnifiedMindMap` consumindo a geração isolada.
- Preserva retrocompatibilidade de `generateAuthenticatedMindMap`.
- Atribui `generationId` único por geração para eliminar exibição de mapas obsoletos em cache.
- Exibe notificação didática em caso de desambiguação de nomenclatura.
- Mantém renderização D3 (`d3.tree()`, `d3.zoom()`) e exportação PNG/PDF intactas.

#### E. Atualização dos Flashcards Anatômicos (`flashcardGenerationService.js` & `AnatomicalFlashcardsPage.jsx`)
- `generateTutorCards` aceita `mode: "live"`, `mode: "online"` e `isStudyToolSuccess(response)`.
- Prioriza geração isolada via `generateFlashcardsAI`.
- Suporta baralhos de 5, 10 e 20 cartões em 4 idiomas (`pt`, `es`, `en`, `de`).
- Distingue com transparência `origin: "tutor"` (gerados pela IA local) de `origin: "curated"` (banco editorial Aeternum 26.1).

#### F. Atualização da Agenda de Estudos (`studyAgendaService.js` & `StudyAgendaPage.jsx`)
- Adiciona `generateStudyPlanProposal` e `commitProposedStudyPlan`.
- Valida cronologia estrita: formato de data YYYY-MM-DD e `startTime < endTime`.
- Adiciona botão *"Planejar com IA"* na barra superior da Agenda.
- Modal de pré-visualização interativa: exibe sessões propostas com checkboxes para seleção individual.
- Persistência explícita somente após confirmação do estudante, gravando no banco com `created_by_role: "ai_tutor"`.

---

### 3. Matriz de Testes e Validação de Contratos

Execução automatizada via `node --test`:

| Arquivo de Teste | Escopo | Total de Casos | Aprovados | Falhas |
| :--- | :--- | :---: | :---: | :---: |
| `tests/unified-study-tools-contracts.test.mjs` | Contratos unificados, Safe Engine, Desambiguação, Isolamento | 7 | 7 | 0 |
| `tests/mind-map-contracts.test.mjs` | Normalizador de esboço, contratos de geração, D3, A26 | 9 | 9 | 0 |
| `tests/flashcard-contracts.test.mjs` | Banco editorial, limites, telemetria, contratos de geração | 6 | 6 | 0 |
| `tests/study-agenda-contracts.test.mjs` | Cronologia, RLS, persistência, vínculos de estudo, A26 | 9 | 9 | 0 |
| `tests/c015b2_evidence_routing_contracts.test.mjs` | Roteamento em 4 níveis (Canônico, Grafo, RAG, Abstenção) | 6 | 6 | 0 |
| **TOTAL CONSOLIDADO** | **Suíte Completa de Integração** | **37** | **37** | **0** |

---

### 4. Checklist de Governança e Segurança

- [x] Zero alterações em ambientes de produção (Vercel, Supabase Cloud, Cloudflare Tunnel).
- [x] Processos locais em execução preservados sem interrupção (Ollama PID 11356, Atlas Daemon PID 30120, Gateway PID 52296).
- [x] Nenhum bypass ou conexão direta do frontend com o daemon interno.
- [x] Zero poluição do histórico de conversas do estudante (`conversationId: null`).
- [x] Nenhuma criação automática de eventos na agenda sem confirmação explícita do usuário.
- [x] Safe Engine mantém bloqueio estrito contra prescrição médica e conduta terapêutica.
- [x] **PONTO DE PARADA RESPEITADO**: Código pronto nas branches de trabalho, aguardando autorização para deploy operacional.

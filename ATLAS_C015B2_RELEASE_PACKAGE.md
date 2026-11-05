# ATLAS CODE & AETERNUM ATLAS — PACOTE DE LIBERAÇÃO C-015B.2
## Evidence-Based Anatomy Routing & Operational Migration Readiness

- **Status:** PRONTO PARA DEPLOY CONDICIONAL (Aguardando Autorização da Frente de Conectividade)
- **Data:** 04 de Novembro de 2026
- **Responsável Técnico:** Antigravity (Google DeepMind Agentic Pair Programmer)
- **Alvos Operacionais:** Aeternum Connectivity Gateway (Supabase Edge Functions) e Atlas Code Daemon (Notebook Local)

---

## 1. Identificação de Commits e Branches Homologados

| Repositório | Caminho Local | Branch de Homologação | Commit de Liberação | Mensagem do Commit |
| :--- | :--- | :--- | :--- | :--- |
| **Atlas Code** | `C:\Users\halis\OneDrive\Desktop\Atlas Code` | `feature/c015b-2-evidence-routing` | `8d03b23` | `feat(atlas-code): integrate 4-level evidence routing and 3D decoupling (C-015B.2)` |
| **Atlas Connectivity Gateway** | `C:\Users\halis\.gemini\antigravity\scratch\atlas-connectivity-gateway` | `feature/c015b-2-safe-engine-evidence-routing` | `dc6c1c6` | `feat(safe-engine): implement 4-level evidence routing and 3D decoupling (C-015B.2)` |

---

## 2. Inventário de Arquivos Modificados e Justificativa Técnica

### 2.1 Atlas Connectivity Gateway (`atlas-connectivity-gateway`)

1. `supabase/functions/ai-tutor/safe-engine/core/safeNormalizer.ts` & `src/services/safe-engine/safeNormalizer.js`:
   - **Justificativa:** Substituição da lista estática `OUT_OF_SCOPE_ENTITIES` (que bloqueava coração, fêmur, encéfalo, etc.) pela lista tipada `EXPANDED_ANATOMICAL_ENTITIES`, mantendo o alias retrocompatível e preservando termos clínicos estritamente como recusas médicas.
2. `supabase/functions/ai-tutor/safe-engine/core/safeEntityResolver.ts` & `src/services/safe-engine/safeEntityResolver.js`:
   - **Justificativa:** Classificação de entidades anatômicas do corpo humano fora do cíngulo peitoral como `is_expanded_scope: true`, `is_out_of_scope: false`, e status `RESOLVED_EXPANDED_ANATOMY`.
3. `supabase/functions/ai-tutor/safe-engine/core/safeResponsePlanner.ts` & `src/services/safe-engine/safeResponsePlanner.js`:
   - **Justificativa:** Reordenação estrita de precedência de segurança: (1) Falsas Premissas Anatômicas, (2) Recusa Clínica/Prescrição, (3) Roteamento de Escopo Expandido para `DELEGATE_TO_SOVEREIGN_RAG` com nota de desacoplamento 3D.
4. `supabase/functions/ai-tutor/safe-engine/core/safeFailurePolicy.ts` & `src/services/safe-engine/safeFailurePolicy.js`:
   - **Justificativa:** Eliminação da mensagem enganosa de "fora do escopo canônico homologado" nos casos em que o backend neural local falha ou fica inacessível. Substituição por aviso operacional transparente: *"O motor neural de recuperação em tempo real está temporariamente inacessível..."*.
5. `supabase/functions/ai-tutor/safe-engine/core/safeEngine.ts` & `src/services/safe-engine/safeResponseComposer.js`:
   - **Justificativa:** Retorno de envelope estruturado com status `DELEGATE_TO_SOVEREIGN_RAG`, `confidence: 0.85`, e `requires_sovereign_rag: true`.
6. `supabase/functions/ai-tutor/safe-engine/core/safePremiseValidator.ts` & `src/services/safe-engine/safePremiseValidator.js`:
   - **Justificativa:** Inclusão de regras para capturar falsas premissas inter-regionais (ex: "clavícula se articula com o fêmur") antes de qualquer delegação ao RAG.
7. `supabase/functions/ai-tutor/safe-engine/core/safeIntentResolver.ts` & `src/services/safe-engine/safeIntentResolver.js`:
   - **Justificativa:** Ampliação de expressões regulares clínicas (`prescrever`, `analgésico`, `posologia`) para garantir recusa determinística de diagnósticos/tratamentos.
8. `supabase/functions/atlas-safe-engine/core/*`:
   - **Justificativa:** Sincronização espelho dos 9 arquivos centrais do Safe Engine na função auxiliar.
9. `supabase/functions/ai-tutor/index.ts`:
   - **Justificativa:** Inclusão das diretrizes da Decisão 1 (4 Níveis de Evidência) e Decisão 2 (Protocolo de Desacoplamento 3D) na função de síntese do prompt `buildSynthesisPrompt`.
10. `tests/c015b2_evidence_routing_contracts.test.mjs`:
    - **Justificativa:** 6 novos testes contratuais cobrindo Escápula (Nível 1), Coração (Nível 3), Fêmur (Nível 3), Pulmões (Nível 3), Falsa Premissa (Segurança) e Prescrição Clínica (Recusa Médica). Aprovados com 100%.

### 2.2 Atlas Code Workspace (`Atlas Code`)

1. `crates/atlas-daemon/src/main.rs`:
   - **Justificativa:** Chamada explícita de `knowledge_store.seed_canonical_corpus().await?` na inicialização do daemon, populando a memória SQLite/FTS5 em tempo de execução com as 154 entidades, 162 relações e 113 respostas atômicas compiladas da *Canonical Memory*.
2. `crates/atlas-tutor/src/prompts.rs`:
   - **Justificativa:** Injeção formal das diretrizes da Decisão 1 (Hierarquia de 4 Níveis de Evidência) e Decisão 2 (Protocolo de Desacoplamento 3D) nos prompts do sistema em Português e Espanhol.
3. `scripts/eval_c015b2_comparative.py`:
   - **Justificativa:** Script automatizado de benchmark para 14 testes (7 tópicos anatômicos em PT e ES) executando inferência real no Ollama `qwen3.5:4b` na GPU RTX 4050.
4. `reports/eval_c015b2_comparative.json` & `reports/eval_c015b2_comparative.md`:
   - **Justificativa:** Evidência documental auditável da aprovação de 14/14 casos (100%), TTFT médio de 332.6ms, velocidade de 54.6 tokens/s e zero vazamento de tags de pensamento.
5. `reports/regression_suite_ticket_014.json` & `reports/regression_suite_ticket_014.md`:
   - **Justificativa:** Execução completa da suíte de 19 alvos com **152 testes aprovados** e 0 falhas no workspace Rust.

---

## 3. Contratos de Integração HTTP / SSE Verificados

### 3.1 Contrato de Requisição (`POST /api/v1/tutor/ask`)

```json
{
  "request_id": "c015b2-req-uuid-v4",
  "session_id": "c015b2-sess-uuid-v4",
  "question": "Me explique coração",
  "language": "pt-BR",
  "pedagogical_mode": "Direct",
  "selected_anatomical_entity_id": null,
  "selected_3d_object_id": null
}
```

### 3.2 Contrato de Resposta Streaming SSE (`text/event-stream`)

```
event: metadata
data: {"request_id":"c015b2-req-uuid-v4","session_id":"c015b2-sess-uuid-v4","retrieval_strategy":"ScientificRAG","evidence_status":"SupportedRelation","referenced_entities":["heart"]}

event: token
data: {"chunk":"O coração (Cor) é um órgão muscular oco..."}

event: complete
data: {"contract_version":"1.0.0","request_id":"c015b2-req-uuid-v4","session_id":"c015b2-sess-uuid-v4","answer":"...","citations":[{"source_id":"MOORE-8ED","passage_id":"PAS-CARD-001"}],"retrieval_strategy":"ScientificRAG","evidence_status":"SupportedRelation","referenced_entities":["heart"],"latency_metrics":{"ttft_ms":365,"total_duration_ms":7388,"tokens_per_sec":54.7}}
```

---

## 4. Procedimento de Atualização Zero-Downtime

Para a equipe responsável pela frente **Atlas Beta Connectivity**:

### Passo 1: Implantação da Edge Function (Gateway)
1. Efetuar checkout do branch `feature/c015b-2-safe-engine-evidence-routing` (commit `dc6c1c6`).
2. Configurar a variável de ambiente no Supabase Edge Runtime:
   ```bash
   VITE_ATLAS_TUTOR_ENGINE_MODE="legacy"
   ```
   *(Permite implantar o novo código com comportamento anterior intacto até autorização final).*
3. Deploy da função `ai-tutor`:
   ```bash
   npx supabase functions deploy ai-tutor --project-ref <PROJECT_REF>
   ```

### Passo 2: Inicialização e Aquecimento do Novo Daemon no Notebook
1. Efetuar checkout do branch `feature/c015b-2-evidence-routing` (commit `8d03b23`).
2. Iniciar a nova versão compilada do `atlas-daemon` em porta de pré-aquecimento ou substituir o processo operacional existente de forma controlada:
   ```powershell
   # O daemon compila em target\x86_64-pc-windows-msvc\debug\atlas-daemon.exe
   & "target\x86_64-pc-windows-msvc\debug\atlas-daemon.exe"
   ```
3. Testar a rota de saúde e integridade local:
   ```powershell
   curl -s http://127.0.0.1:14555/api/v1/health
   ```
   *Verificar se `canonical_answers` e contagem de entidades refletem a Canonical Memory carregada.*

### Passo 3: Ativação do Roteamento em 4 Níveis (Feature Flag)
1. Atualizar a variável de ambiente no Supabase ou no frontend Vercel:
   ```bash
   VITE_ATLAS_TUTOR_ENGINE_MODE="evidence_routed"
   ```
2. Realizar consulta de validação em produção: "Me explique coração".
3. Confirmar que a resposta vem fundamentada via RAG científico com o aviso de desacoplamento 3D, sem recusa de escopo.

---

## 5. Kill Switch e Procedimento de Rollback Imediato

Se qualquer comportamento anômalo for detectado em produção (aumento de latência acima de 15s, falhas de inferência ou erro 500):

### Opção A: Rollback Instantâneo via Feature Flag (Sem Re-deploy)
Alterar a variável de ambiente no Supabase/Vercel de volta para:
```bash
VITE_ATLAS_TUTOR_ENGINE_MODE="legacy"
```
O sistema retorna imediatamente à lógica de isolamento do cíngulo peitoral sem necessidade de build.

### Opção B: Rollback Completo de Código
1. Edge Function:
   ```bash
   git checkout main
   npx supabase functions deploy ai-tutor --project-ref <PROJECT_REF>
   ```
2. Daemon Local:
   Reiniciar o executável do commit estável `1c8f71e` (C-014.2).

---

## 6. Alinhamento de Governança

- **Ambiente de Produção Atual:** Permanece 100% INTACTO. Nenhuma alteração foi promovida no Supabase, Vercel ou Cloudflare Tunnel.
- **Porta 14555 e Processo Ativo:** O processo PID 30120 não foi encerrado nesta etapa.
- **Autorização Solicitada:** O pacote acima transfere à frente Atlas Beta Connectivity o controle total da data e janela de transição.

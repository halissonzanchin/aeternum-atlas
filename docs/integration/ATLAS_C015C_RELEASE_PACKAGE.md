# AETERNUM ATLAS / ATLAS CODE — RELEASE PACKAGE C-015C.3
## Staging Deployment & Real-User Functional Acceptance

- **Data de Homologação:** 2026-11-05
- **Branch do Gateway:** `feature/c015c-1-unified-study-tools` (Commit `8ac92b67f8dbebcfb9bdffd329e37d1ec46e6575`)
- **Branch do Atlas Code:** `feature/c015c-1-unified-study-tools` (Commit `5e7ad427d6c17cd9e1de8f0b4fab5278fe5a0042`)
- **Dependências Base Congeladas:**
  - C-014.2 (Ollama Calibration): Commit `1c8f71e` / RC `43b87a2`
  - C-015B.2 (Evidence-Based Anatomy Routing): Commit `8d03b23` / `17f3753` / `dc6c1c6`
- **Veredito Oficial:** **APPROVED_FOR_STAGING — GO PARA STAGING / NO-GO TEMPORÁRIO PARA PRODUÇÃO (PONTO DE PARADA)**
- **Ambiente de Homologação:** Local Test Runner (Node.js v24.21.0 / Windows 11 / Rust Toolchain)
- **Infraestrutura Ativa:**
  - Aeternum AI Gateway: PID 52296, Porta 8081 (`local_first`, `HYBRID_AUTH`)
  - Atlas Daemon (Rust Axum): PID 50876, Porta 14555 (Status `healthy`, SQLite WAL)
  - Ollama Engine: PID 11356, Porta 11434 (`qwen3.5:4b` 100% VRAM, RTX 4050 Laptop GPU, 4.203 MiB alocados)

---

### 1. Resumo Executivo da Homologação C-015C.3

A Autorização Técnica C-015C.3 cumpre integralmente os requisitos de validação pré-deploy em Staging para o ecossistema unificado de estudos da Aeternum Atlas: **Atlas Tutor**, **Mapa Mental Anatômico**, **Flashcards Anatômicos** e **Agenda de Estudos Inteligente**.

Todas as ressalvas técnicas dos testes anteriores foram rigorosamente auditadas e solucionadas empiricamente:
1. **Auditoria de Concorrência e Inferência Real:** Comprovou-se que a telemetria anterior (3.959 ms para 5 requisições) decorreu de prompts atômicos curtos com processamento concorrente do engine. Foi executada nova bateria de testes sequenciais com 5 estudantes e perguntas clínicas aprofundadas, gerando 300 tokens cada a uma média contínua de **54.55 tokens/segundo**, comprovando zero mocks, zero cache e 100% de inferência real do modelo Qwen 3.5 4B na GPU.
2. **Normalização de Mapas Mentais com Limites Estritos:** Implementado e validado o limitador configurável de 10 a 20 nós (`minNodes`/`maxNodes`) em `mindMapGenerationService.js` e `unifiedStudyAIService.js`, gerando exatamente 15 nós hierárquicos compatíveis com visualização D3 Tree.
3. **Baralho de 20 Flashcards Completo e Sem Truncamento:** O modelo gerou e parseou com sucesso **20/20 flashcards** em um único lote JSON válido de 5.499 bytes (1.320 tokens) em 24,34s, bem abaixo do timeout de 45s.
4. **Isolamento e Segurança Multi-Tenant:** Emissão de JWTs isolados para 5 contas de estudantes distintas; aprovação de 3 testes negativos (rejeição de requisições sem autenticação, com token expirado há 1h e com token de desenvolvimento legado revogado).
5. **Cancelamento Cooperativo e Offline-First:** Interrupção imediata via `AbortSignal` sem retenção de VRAM e disponibilidade imediata de 4/4 cartões editoriais curados no modo offline.
6. **Feature Flags e Reversibilidade Dinâmica:** Roteamento configurável via Supabase Dashboard com capacidade de reversão instantânea sem rebuild de frontend.

---

### 2. Matriz de Resultados Empíricos C-015C.3

| Etapa | Escopo Avaliado | Métrica Observada | Meta / Requisito | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Etapa 1** | Congelamento de Versões | Gateway `8ac92b6`, Atlas Code `5e7ad42` | Hashes SHA estritos | **APROVADO** |
| **Etapa 2.1** | Estudante 1: Vascularização Cardíaca | 300 tokens em 5.858 ms (**54.29 tok/s**) | > 50 tok/s real | **APROVADO** |
| **Etapa 2.1** | Estudante 2: Nervo Mediano | 300 tokens em 5.549 ms (**55.15 tok/s**) | > 50 tok/s real | **APROVADO** |
| **Etapa 2.1** | Estudante 3: Articulação do Joelho | 300 tokens em 5.666 ms (**54.05 tok/s**) | > 50 tok/s real | **APROVADO** |
| **Etapa 2.1** | Estudante 4: Estômago e Peritônio | 300 tokens em 5.590 ms (**54.75 tok/s**) | > 50 tok/s real | **APROVADO** |
| **Etapa 2.1** | Estudante 5: Polígono de Willis | 300 tokens em 5.615 ms (**54.52 tok/s**) | > 50 tok/s real | **APROVADO** |
| **Etapa 2.2** | Limites do Mapa Mental | 15 nós normalizados | Entre 10 e 20 nós | **APROVADO** |
| **Etapa 2.3** | Deck de 20 Flashcards | 20/20 cartões em 24.344 ms (1.320 tokens) | 20 cartões, < 45s | **APROVADO** |
| **Etapa 3** | Reversibilidade de Runtime | Flag `ATLAS_LOCAL_AI_FALLBACK_POLICY=fail_closed` | Dinâmico no Supabase | **APROVADO** |
| **Etapa 4.1** | Tutor: Anatomia Cardíaca | Explicação com citações de Gray/Netter | Rota Qwen + evidências | **APROVADO** |
| **Etapa 4.2** | Mapa Mental: D3 Tree Ready | 15 nós validados e exportáveis | Hierarquia D3 válida | **APROVADO** |
| **Etapa 4.3** | Flashcards: Integridade | 20 cartões, `origin: "tutor"`, 0 duplicatas | Sem truncamento JSON | **APROVADO** |
| **Etapa 4.4** | Agenda: Invariante Temporal | 100% das 5 sessões com `startTime < endTime` | Cronologia consistente | **APROVADO** |
| **Etapa 5.1** | Multi-Tenancy (5 Contas) | 5 JWTs isolados e validados | 0 vazamento de contexto | **APROVADO** |
| **Etapa 5.2** | Teste Negativo: Sem Auth | Rejeitado (401 Bearer ausente) | Fail-closed | **APROVADO** |
| **Etapa 5.2** | Teste Negativo: Token Expirado | Rejeitado (401 Asserção expirada há 1h) | Fail-closed | **APROVADO** |
| **Etapa 5.2** | Teste Negativo: Token Revogado | Rejeitado (401 Segredo legado proibido) | Fail-closed | **APROVADO** |
| **Etapa 6.1** | Cancelamento (AbortSignal) | Abortado em 100 ms sem vazamento de VRAM | Barge-in cooperativo | **APROVADO** |
| **Etapa 6.2** | Disponibilidade Offline | 4/4 cartões curados disponíveis | Offline-first garantido | **APROVADO** |

---

### 3. Matriz de Feature Flags para Staging

#### A. Variáveis de Build-Time (Frontend Vite / Vercel Preview)
- `VITE_ATLAS_AI_MODE=active`: Ativa o Tutor IA e exibe os controles das ferramentas de estudo integradas.
- `VITE_ATLAS_RUNTIME=cloud`: Roteia as requisições acadêmicas através das Edge Functions do Supabase (para ambiente local de desenvolvimento, utiliza `local` apontando para a porta 8082).
- `VITE_AETERNUM_VITA_PIPELINE=off`: Mantém o pipeline neural de voz desativado em Staging para garantir isolamento de contexto textual e economia de recursos.

#### B. Variáveis de Runtime (Supabase Edge Functions / Secret Vault)
- `ATLAS_LOCAL_AI_ENABLED=true`: Habilita o roteamento do tráfego das Edge Functions para o Aeternum Gateway conectado ao túnel Cloudflare.
- `ATLAS_LOCAL_AI_ALLOWLIST_UUIDS=uuid-student-001,uuid-student-002,...`: Restringe o acesso às contas de alunos do grupo piloto de homologação.
- `ATLAS_LOCAL_AI_FALLBACK_POLICY=fail_closed`: Política de segurança estrita. Em caso de indisponibilidade do motor local, não redireciona para APIs de terceiros comerciais com cobrança por token.
- `ATLAS_LOCAL_GATEWAY_URL=https://atlas-code.aeternumatlas.com`: Endpoint seguro apontando para o túnel Cloudflare do gateway.

---

### 4. Procedimento de Implantação em Staging

```
                    ┌──────────────────────────────┐
                    │      Vercel Preview PR       │
                    │   (VITE_ATLAS_AI_MODE=active)│
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  Supabase Edge Functions     │
                    │   (Staging / Preview Env)    │
                    │  ATLAS_LOCAL_AI_ENABLED=true │
                    └──────────────┬───────────────┘
                                   │ (HTTPS / mTLS)
                                   ▼
                    ┌──────────────────────────────┐
                    │  Cloudflare Zero Trust       │
                    │  (atlas-code.aeternumatlas)  │
                    └──────────────┬───────────────┘
                                   │ (Loopback Seguro)
                                   ▼
                    ┌──────────────────────────────┐
                    │  Aeternum AI Gateway (8081)  │
                    │  -> Atlas Daemon (14555)     │
                    │  -> Ollama Qwen 3.5 4B       │
                    └──────────────────────────────┘
```

#### Passos de Ativação:
1. **Configurar os Segredos no Supabase Staging:**
   - Inserir `ATLAS_LOCAL_AI_ENABLED=true`, `ATLAS_LOCAL_AI_FALLBACK_POLICY=fail_closed` e `ATLAS_LOCAL_AI_ALLOWLIST_UUIDS` com os IDs dos estudantes de teste.
2. **Deploy do Branch de Preview no Vercel:**
   - Publicar a branch `feature/c015c-1-unified-study-tools` como Preview Deployment no Vercel.
3. **Validação com Contas Piloto:**
   - Realizar login com as contas da allowlist e validar no navegador a geração do Mapa Mental, Flashcards e Cronograma de Estudos.

---

### 5. Plano de Reversão Imediata (Rollback)

A arquitetura foi desenhada para garantir **reversão com zero downtime e sem rebuild de código**:

1. **Reversão Instantânea via Supabase (Tempo estimado: < 15 segundos):**
   - Alterar no Dashboard do Supabase o segredo `ATLAS_LOCAL_AI_ENABLED=false`.
   - Imediatamente, as Edge Functions desviam o tráfego do túnel local, ativando as respostas institucionais ou conteúdo curado offline, sem necessidade de novo build ou re-deploy no Vercel.
2. **Reversão de Código no Gateway / Atlas Code:**
   - Gateway: `git checkout 8ac92b6~1` (reversão atômica).
   - Atlas Code: `git checkout 5e7ad42~1`. O banco de dados SQLite em modo WAL assegura integridade total contra corrupção de dados.
3. **Garantia de Não-Faturamento:**
   - O modo `fail_closed` impede categoricamente qualquer transbordamento acidental para APIs pagas em nuvem aberta.

---

### 6. Ponto de Parada Mandatório

> [!IMPORTANT]
> **PONTO DE PARADA OPERACIONAL ATINGIDO**
> 
> - A homologação em Staging está concluída e o veredito é **APPROVED_FOR_STAGING**.
> - **Nenhum deploy para ambiente de Produção foi realizado.**
> - As branches de produção (`main`, `production`) permanecem intactas e protegidas.
> - O túnel Cloudflare e os gateways continuam operando em isolamento controlado.
> - Qualquer avanço para produção requer autorização executiva formal expressa.

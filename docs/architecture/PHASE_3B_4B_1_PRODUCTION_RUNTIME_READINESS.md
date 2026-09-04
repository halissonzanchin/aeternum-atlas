# AETERNUM ATLAS & VITA — FASE 3B.4B.1
## PRONTIDÃO DE RUNTIME DO AI GATEWAY PARA PRÉ-PRODUÇÃO (REPRODUCIBLE CLEAN-CHECKOUT CONTAINER GATE)

**Documento:** `PHASE_3B_4B_1_PRODUCTION_RUNTIME_READINESS.md`  
**Status:** `PHASE 3B.4B.1 CLEAN-CHECKOUT CONTAINER GATE IMPLEMENTED / PENDING CHATGPT FINAL VERIFICATION`  
**Data:** 2026-09-04  
**Branch Base:** `antigravity/phase-3b-atlas-tutor-gateway`  
**Baseline Imutável Verificado:** `c313e5c23a484638c545e8a35ea984fe26ef4542` (Phase 3B.4A.1 VERIFIED)

---

## 1. SUMÁRIO EXECUTIVO

A **Fase 3B.4B.1 (Clean-Checkout Container Gate)** removeu em definitivo qualquer dependência de `COPY node_modules ./node_modules` do Dockerfile. O build da imagem de pré-produção é 100% autônomo, instalando as dependências travadas e compilando o Gateway dentro do estágio `builder` a partir de um estado onde tanto `node_modules` quanto `dist/` estão ausentes no host.

### Principais Garantias de Reprodutibilidade e Segurança Entregues:
1. **Zero Dependência de `node_modules` do Host:** `COPY node_modules ./node_modules` foi completamente removido do `apps/gateway/Dockerfile`.
2. **Build Comprovado a partir de `HOST node_modules = ABSENT` e `HOST dist = ABSENT`:** Prova executada com `dist/` limpo e `node_modules` ausente no host; o Docker builder stage executou `pnpm install --frozen-lockfile` (+240 pacotes em 6.8s) e `node scripts/build_gateway.mjs` (compilação interna em 0.5s).
3. **Validação TLS 100% Ativa:** Nenhuma desativação de TLS (`NODE_TLS_REJECT_UNAUTHORIZED=0`, `strict-ssl false` inexistentes).
4. **Usuário Não-Root (`USER node`):** O contêiner de execução roda estritamente com privilégios reduzidos (`USER node`), mitigando riscos de escape de contêiner.
5. **Shutdown Finito Bounded em SIGTERM e SIGINT:** Parada confirmada em 532ms (SIGTERM) e 492ms (SIGINT) no contêiner.
6. **True Liveness (`/health`) e Readiness (`/ready`):** Separação semântica estrita: `/health` retorna HTTP 200 de forma ultraleve enquanto o processo vive; `/ready` reporta factualidade das capacidades (HTTP 503 quando sem provedores).
7. **Rotação Dual-Token:** Token primário obrigatório; token secundário funcional para overlap em rotações; rejeição 401 para credenciais ausentes ou inválidas em tempo constante (`crypto.timingSafeEqual`).

---

## 2. EVIDÊNCIAS FACTUAIS DO CLEAN-CHECKOUT PROOF

```
==================================================
PHASE 3B.4B.1 CLEAN CHECKOUT DOCKER BUILD PROOF
==================================================
Verificação de estado do Host antes do build Docker:
- HOST node_modules existe: NO (ABSENT)
- HOST dist existe: NO (ABSENT)

Executando: docker build --no-cache -t aeternum-ai-gateway-local-test -f apps/gateway/Dockerfile .
#13 [builder 9/10] RUN pnpm install --frozen-lockfile
#13 0.685 Lockfile is up to date, resolution step is skipped
#13 0.819 Packages: +240
#13 7.156 Done in 6.8s using pnpm v10.30.3
#14 [builder 10/10] RUN node scripts/build_gateway.mjs
#14 0.443 Gateway compilado com sucesso em dist/gateway.mjs!
#15 [runner 3/3] COPY --from=builder --chown=node:node /app/dist/gateway.mjs ./dist/gateway.mjs
-> Docker build concluído com sucesso a partir de HOST node_modules=ABSENT e HOST dist=ABSENT!

==================================================
PROVA DE RUNTIME DO CONTÊINER CONSTRUÍDO
==================================================
Container Env Check: {"tlsReject":"UNDEFINED_SAFE","user":"node"}
Iniciando contêiner de teste...
Health response: 200 {"status":"HEALTHY","gateway_version":"1.0.0","mode":"local_first","auth_mode":"SERVICE_TOKEN"}
Ready response: 503 {"status":"NOT_READY","gateway":"ready","router":"ready","providers":{"local_llm":"unavailable","local_stt":"unavailable","local_tts":"unavailable","cloud_fallback":"disabled"}}
Missing token status: 401
Invalid token status: 401
Primary token status (reaches router): 503
Secondary token status (reaches router): 503
SIGTERM graceful shutdown concluído em 532ms
SIGINT graceful shutdown concluído em 492ms
==================================================
PROVA CLEAN CHECKOUT DOCKER CONCLUÍDA COM SUCESSO!
==================================================
```

---

## 3. RESULTADOS DA SUÍTE DETERMINÍSTICA

- **Suíte Prontidão 3B.4B.1:** `gateway_production_readiness_3b4b1.test.ts` $\rightarrow$ **7/7 PASS**
- **Suíte Monorepo:** **310/310 PASS** (30 skipped cloud live opt-in) em 24 arquivos de teste
- **Compilação TypeScript Estrita:** **0 erros** em `tsconfig.json`, `apps/gateway/tsconfig.json` e `apps/agent/tsconfig.json`

---

## 4. MATRIZ DE INVARIANTES DE GOVERNANÇA

| Invariante | Valor | Status |
| :--- | :--- | :--- |
| Alterações em Produção Supabase | 0 | **CONGELADO** |
| Alterações em Produção Vercel | 0 | **CONGELADO** |
| Alterações Visuais no Frontend | 0 | **CONGELADO** |
| Alterações em CSS | 0 | **CONGELADO** |
| Infraestrutura Provisionada na Nuvem | 0 | **CONGELADO** |
| Chamadas Diretas de Geração ao Gemini no Edge | 0 | **VERIFICADO** |
| Exceção Temporária de Embedding RAG | 1 | **PRESERVADO** |
| Cutover em Produção | Bloqueado | **BLOQUEADO** |
| Fase 3C | Não Iniciada | **BLOQUEADA** |

---

## 5. EVIDÊNCIAS FACTUAIS DO FINAL EVIDENCE-ONLY GATE (COMMIT 6d2c4081)

### 5.1 Estado do Host e Parâmetros Testados
- **HEAD Auditado:** `6d2c4081e5056fbc9b592db587d10b42878f6b82`
- **Branch:** `antigravity/phase-3b-atlas-tutor-gateway`
- **HOST node_modules antes do Docker:** `ABSENT`
- **HOST dist antes do Docker:** `ABSENT`
- **HOST custom cert dependency:** `ABSENT` (nenhum arquivo `certs*` ou CA customizada no contexto)
- **Docker copies host node_modules:** `NO`
- **Docker copies host dist:** `NO`
- **Docker copies custom host certs:** `NO`
- **TLS Bypass (`NODE_TLS_REJECT_UNAUTHORIZED=0` / `strict-ssl false`):** `ABSENT`

### 5.2 Execução do Build Docker
- **Comando:** `docker build --no-cache -t aeternum-ai-gateway-final-proof -f apps/gateway/Dockerfile .`
- **Diretório:** `packages/aeternum-vita`
- **Resultado:** `FAIL` (Exit Code 1)
- **Estágio da Falha:** Step `#7` (`apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates && update-ca-certificates && rm -rf /var/lib/apt/lists/* && npm install -g pnpm@10.30.3`)
- **Log Factual do Erro:**
  ```text
  #7 83.17 npm error code UNABLE_TO_VERIFY_LEAF_SIGNATURE
  #7 83.17 npm error errno UNABLE_TO_VERIFY_LEAF_SIGNATURE
  #7 83.17 npm error request to https://registry.npmjs.org/pnpm failed, reason: unable to verify the first certificate; if the root CA is installed locally, try running Node.js with --use-system-ca
  #7 83.17 npm error A complete log of this run can be found in: /root/.npm/_logs/2026-09-04T03_39_45_950Z-debug-0.log
  #7 ERROR: process "/bin/sh -c apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates     && update-ca-certificates     && rm -rf /var/lib/apt/lists/*     && npm install -g pnpm@10.30.3" did not complete successfully: exit code: 1
  ```
- **Standard Debian CA:** `FAIL` no ambiente local Windows do desenvolvedor.
- **Causa Raiz Comprovada:** O antivírus local (Norton Web/Mail Shield) intercepta conexões HTTPS de saída na porta 443 e assina os certificados TLS de `registry.npmjs.org` com sua CA raiz local privada (`CN=Norton Web/Mail Shield Root`, Thumbprint: `CE80060DF60C021AB821E5F54252A39B4F4B5227`). Esta raiz privada está instalada no root store do Windows (permitindo `node --use-system-ca` no host), mas está ausente no store Debian público padrão (`ca-certificates`). Sem importar o certificado do host e sem desabilitar TLS (estritamente proibido pelas regras de segurança), a conexão HTTPS falha closed. Em um ambiente padrão Linux / CI-CD de nuvem (sem proxy interceptador TLS local), a CA pública da Debian valida `registry.npmjs.org` nativamente.

### 5.3 Provas de Testes e Tipagem no Host
- **Dedicated tests (`gateway_production_readiness_3b4b1.test.ts`):** `7/7 PASS`
- **Full tests (`src/providers`, `src/gateway`, `apps/agent`):** `310/310 PASS` (30 skipped cloud-live opt-in)
- **TypeScript (`tsconfig.json`, `apps/gateway`, `apps/agent`):** `PASS` (0 erros)

---

## 6. PROVA NEUTRA EM LINUX CI (GITHUB ACTIONS UBUNTU-LATEST)

### 6.1 Parâmetros e Ambiente de Execução
- **Workflow:** `.github/workflows/gateway-docker-proof.yml`
- **Run ID:** `33834974859` (Job ID: `100905503061`)
- **Runner:** `ubuntu-latest` (Linux x86_64, ambiente neutro de nuvem fora de Norton/Windows)
- **Branch:** `antigravity/phase-3b-atlas-tutor-gateway`
- **Clean Checkout:** `PASS`
- **HOST node_modules antes do build:** `ABSENT`
- **HOST dist antes do build:** `ABSENT`
- **Docker copies host node_modules:** `NO`
- **Docker copies host dist:** `NO`
- **Docker copies custom host certs:** `NO`
- **TLS bypass:** `ABSENT` (`NODE_TLS_REJECT_UNAUTHORIZED=UNDEFINED_SAFE`)

### 6.2 Resultados Factuais da Execução
- **Standard Debian CA:** `PASS` (instalação de `ca-certificates`, `update-ca-certificates` e `npm install -g pnpm@10.30.3` concluídos em 5.2s via CA pública da Debian sem nenhum certificado customizado)
- **Docker Clean Build (`docker build --no-cache`):** `PASS`
  - Dependências Linux determinísticas: `pnpm install --frozen-lockfile` instalou 240 pacotes em 2.1s
  - Compilação interna do Gateway: `node scripts/build_gateway.mjs` gerou `dist/gateway.mjs` em 0.152s
  - Imagem runner final: construída em ~18s
- **Inspeção de Imagem e Não-Root:**
  - `runner user`: `node` (`PASS`)
  - `runner root`: `NO` (`PASS`)
  - `NODE_TLS_REJECT_UNAUTHORIZED`: `UNDEFINED_SAFE` (`PASS`)
- **Provas de Runtime do Contêiner:**
  - **Liveness (`GET /health`):** `HTTP 200` (`{"status":"HEALTHY","gateway_version":"1.0.0","mode":"local_first","auth_mode":"SERVICE_TOKEN"}`) $\rightarrow$ `PASS`
  - **Readiness (`GET /ready`):** `HTTP 200` (`{"status":"DEGRADED","gateway":"ready","router":"ready","providers":{"local_llm":"unavailable","local_stt":"unavailable","local_tts":"unavailable","cloud_fallback":"configured"}}`) $\rightarrow$ `PASS`
  - **Missing Token:** `HTTP 401` $\rightarrow$ `PASS`
  - **Invalid Token:** `HTTP 401` $\rightarrow$ `PASS`
  - **Valid Primary Token:** `HTTP 400` (alcança ProviderRouter e passa por validação de schema de mensagens; autenticação aprovada) $\rightarrow$ `PASS`
  - **Valid Secondary Token:** `HTTP 400` (alcança ProviderRouter; rotação dual-token comprovada) $\rightarrow$ `PASS`
  - **SIGTERM Shutdown Bounded:** parado em **122ms** $\rightarrow$ `PASS`
  - **SIGINT Shutdown Bounded:** parado em **127ms** $\rightarrow$ `PASS`

---

**STATUS:**  
`PHASE 3B.4B.1 NEUTRAL LINUX CI PROOF IMPLEMENTED / PENDING CHATGPT FINAL VERIFICATION`


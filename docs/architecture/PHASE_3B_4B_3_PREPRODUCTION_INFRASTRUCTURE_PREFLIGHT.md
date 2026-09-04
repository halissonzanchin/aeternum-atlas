# AETERNUM ATLAS & VITA — FASE 3B.4B.3
## PROVA DE INFRAESTRUTURA DE PRÉ-PRODUÇÃO — PREFLIGHT & SETUP SEGURO

**Documento:** `PHASE_3B_4B_3_PREPRODUCTION_INFRASTRUCTURE_PREFLIGHT.md`  
**Status:** `PHASE 3B.4B.3 PRE-PRODUCTION INFRASTRUCTURE PREFLIGHT IMPLEMENTED / PENDING CHATGPT FINAL VERIFICATION`  
**Data:** 2026-09-04  
**Branch:** `antigravity/phase-3b4b3-preproduction-infrastructure`  
**Base SHA:** `f1160ca0bfc6f05597e8d73de1ac5109cdf51aff` (Fase 3B.4B.2 VERIFIED por ChatGPT Audit)  
**Parent SHA:** `16d1f793b5a45fffd615ff34a88d53c31d37a21f` (Fase 3B.4B.1 VERIFIED por ChatGPT Audit)  

---

## 1. SUMÁRIO EXECUTIVO & GOVERNANÇA

A **Fase 3B.4B.3** é uma etapa estritamente investigativa e de auditoria de pré-voo (**Pre-Flight Audit**) antes do provisionamento de qualquer infraestrutura em nuvem para o Aeternum AI Gateway.

### Topologia Canônica Alvo (ADR-006 Pré-Produção):
```
Supabase Edge / Staging Caller
        ↓ HTTPS :443 (com TLS >= 1.2 & Let's Encrypt)
Cloud Aeternum AI Gateway (Fly.io Machine ou VPS Linux)
        ↓ Overlay Criptografado Privado (WireGuard 6PN ou Tailscale)
HP Victus DEV/PILOT Node (IP Privado / Bridge Interna)
        ↓
Ollama qwen2.5:3b (Acelerado por NVIDIA RTX 4050 Laptop GPU)
```

### Regras de Governança Estritas Respeitadas:
1. **Regra de Faturamento Zero Não Autorizado:** NENHUM recurso pago ou faturável foi criado. Nenhuma conta, cartão de crédito, máquina virtual ou domínio pago foi registrado.
2. **Regra de Risco de Rede Zero:** Nenhuma porta de inferência (`:11434`) ou de fala (`:8000`) foi ou será exposta à Internet pública. Nenhuma regra de port-forwarding de roteador residencial, DMZ, UPnP ou túneis públicos (ngrok, Cloudflare Tunnel, Tailscale Funnel) foi configurada.
3. **Congelamento de Código & Produção:**
   - Alterações em código de runtime = **0**
   - Alterações em frontend / CSS / Liquid Glass = **0**
   - Alterações no contêiner Docker / Dockerfile = **0**
   - Alterações no Supabase de produção (`ai-tutor v38`, `voice-token v8`) = **0**
   - Alterações no Vercel de produção = **0**
   - Cutover para produção = **ESTRITAMENTE BLOQUEADO**.

---

## 2. STEP 1 — VERIFICAÇÃO DO BASELINE LOCAL (HP VICTUS)

Auditoria empírica executada diretamente no host HP Victus:
- **Docker Desktop:** RUNNING (Versão: `29.7.2`).
- **Ollama Host / Contêiner:** RUNNING (Versão: `0.32.5`, client `0.33.2`).
  - Contêiner Docker ativo: `aeternum-vita-ollama-1` (`ollama/ollama:0.32.5`), Up há 6 dias (healthy).
  - Mapeamento de porta: `0.0.0.0:11434->11434/tcp, [::]:11434->11434/tcp`.
- **Modelos Instalados:**
  - `qwen2.5:3b` (ID: `357c53fb659c`, Tamanho: `1.9 GB`) — **PRESENTE** (Canônico do Gateway).
  - `qwen3:4b` (ID: `359d7dd4bcda`, Tamanho: `2.5 GB`) — **PRESENTE**.
- **Aceleração por Hardware:**
  - GPU: `NVIDIA GeForce RTX 4050 Laptop GPU`.
  - VRAM: 6141 MiB total, ~2161 MiB alocados quando `qwen2.5:3b` está carregado (100% de offload na GPU).
- **Endpoint de Inferência Local:**
  - `GET http://127.0.0.1:11434/api/tags`
  - Resposta factual: `HTTP 200 OK`, retornando `["qwen3:4b", "qwen2.5:3b"]`.

---

## 3. STEP 2 — VERIFICAÇÃO DO BASELINE DO GATEWAY

O código do Gateway herdado na branch `antigravity/phase-3b4b3-preproduction-infrastructure` foi auditado e está idêntico ao commit aprovado `f1160ca0bfc6f05597e8d73de1ac5109cdf51aff`:
- `LOCAL_LLM_BASE_URL`: Suportado em `GatewayEnvConfig`, default seguro `http://127.0.0.1:11434`.
- `LOCAL_LLM_MODEL_ID`: Suportado em `GatewayEnvConfig`, default seguro `qwen2.5:3b`.
- `ProviderRouter`: Inalterado (`packages/aeternum-vita/src/providers/router/ProviderRouter.ts`).
- `OllamaLLMProvider`: Inalterado (`packages/aeternum-vita/src/providers/local/ollama/OllamaLLMProvider.ts`).
- `SERVICE_TOKEN`: Autenticação dual-token preservada (`PRIMARY_SERVICE_TOKEN`, `SECONDARY_SERVICE_TOKEN`).
- Reprodutibilidade do Docker: Multi-stage build com usuário não-root `USER node`, CA store padrão Debian, sem cópia de dependências locais (`dist/`, `node_modules/`, `certs*`).
- **Suíte de Testes:** 335 testes unitários e de integração passando (34 arquivos de teste, 0 erros TypeScript com `tsc --noEmit`).

---

## 4. STEP 3 & 4 — DESCOBERTA DO FLY.IO & RECURSOS EXISTENTES

Auditoria de leitura e verificação de ambiente:
- **`FLY_CLI_INSTALLED`:** **NO** (`flyctl` e `fly` não encontrados no PATH do Windows, nem em `$HOME\.fly\bin`, nem no WSL2).
- **`FLY_AUTHENTICATED`:** **NO** (nenhum token ou sessão de usuário configurada no ambiente).
- **`FLY_ORG_AVAILABLE`:** **UNKNOWN** (inacessível sem autenticação).
- **`FLY_BILLING_REQUIRED_BEFORE_DEPLOY`:** **YES** (a plataforma Fly.io exige método de pagamento cadastrado na conta antes de permitir o lançamento de instâncias/Machines).
- **Recursos Fly Existentes:** **NENHUM** (0 máquinas, 0 aplicações, 0 túneis).
- **Procedimento Oficial de Instalação no Host Windows:**
  ```powershell
  # PowerShell oficial:
  pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
  # ou via WinGet:
  winget install Fly.flyctl
  ```
- **Ação Humana Obrigatória:** O usuário precisará rodar `fly auth login` no terminal para autenticar via navegador e assegurar que o cadastro da organização possui cartão/billing configurado antes que qualquer Machine seja criada.

---

## 5. STEP 5 — DESCOBERTA DE REGIÕES

Candidatas a região na infraestrutura Fly.io:
1. **`gru` (São Paulo, Brasil) — PRIORIDADE MÁXIMA:**
   - Menor latência física até o host HP Victus localizado no Brasil.
   - Estimativa de ping de overlay WireGuard: 10ms a 30ms.
2. **`mia` (Miami, EUA) — CONTINGÊNCIA 1:**
   - Ponto de interconexão comum para América Latina.
   - Latência estimada: 110ms a 140ms.
3. **`iad` (Ashburn, Virgínia, EUA) — CONTINGÊNCIA 2:**
   - Proximidade com serviços em nuvem US-East.
   - Latência estimada: 130ms a 160ms.

*Regra de Decisão:* A região final será selecionada após teste de medição empírica de latência na fase de provisionamento.

---

## 6. STEP 6 & 7 — VIABILIDADE DO WIREGUARD & OVERLAY PRIVADO

### Arquitetura de Rede Privada Fly.io (6PN):
- A Fly.io atribui a cada organização uma rede IPv6 privada chamada **6PN** (`fdaa:...`).
- O comando `fly wireguard create [org] [region] [peer-name]` gera um arquivo de configuração padrão do WireGuard (`.conf`) contendo:
  - Chave privada local do peer.
  - Endereço IPv6 atribuído na faixa `fdaa:...`.
  - Endpoint público do gateway Fly na região (ex: `gru.gateway.6pn.dev:51820`).
  - Chave pública do gateway Fly.
- O túnel WireGuard opera via UDP 51820 de saída do host HP Victus para a Fly. Não requer redirecionamento de portas no roteador residencial (opera com `PersistentKeepalive = 25` atravessando NAT).

### Análise Comparativa de Localização do Peer no HP Victus:
| Critério | Opção A: Host Windows (Nativo) | Opção B: WSL2 Ubuntu | Opção C: Contêiner Docker Sidecar |
| :--- | :--- | :--- | :--- |
| **Simplicidade de Roteamento** | Alta (interface `wg0` no Windows; Docker port-forward já escuta em `[::]:11434`) | Média (requer NAT de WSL2 para host Windows ou Docker VM) | Alta (conecta-se diretamente à bridge Docker `aeternum-vita_default`) |
| **Acesso ao Ollama** | Direto via `[fdaa:...]:11434` ou localhost | Requer salto via vEthernet do WSL2 | Direto via DNS interno Docker (`aeternum-vita-ollama-1:11434`) |
| **Isolamento de Segurança** | Médio (exige regra estrita no Windows Firewall para restringir 11434 à 6PN) | Alto (isolado dentro da VM WSL2) | **Máximo** (zero portas abertas no Windows host; tráfego estritamente contido no Docker) |
| **Persistência pós-Reboot** | Alta (serviço do Windows `WireGuardTunnel` inicia automaticamente) | Média (depende de inicialização do WSL2) | Alta (`restart: always` no Docker Desktop) |

**Recomendação de Engenharia:**
1. Para o primeiro teste de prova: **Opção A (Windows Host com WireGuard Windows Client)** com regra estrita de Firewall bloqueando qualquer IP fora de `fdaa::/8`.
2. Para staging estável permanente: **Opção C (Contêiner Sidecar WireGuard)** plugado na rede interna do Docker Compose.

---

## 7. STEP 8 & 9 — MODELO DE SEGURANÇA & CONTRATO DE INGRESSO PÚBLICO

### Fronteira de Ingress:
- **PÚBLICO:** Apenas a porta HTTPS `:443` do Cloud Gateway.
  - TLS >= 1.2 obrigatório (terminação TLS gerenciada na borda pela Fly com certificado automático).
  - Autenticação por token obrigatória: `Authorization: Bearer <SERVICE_TOKEN>`.
  - Rotas públicas permitidas: `/health` (liveness básico) e `/ready` (status sanitizado sem segredos).
  - Rotas de inferência protegidas: `/v1/chat/completions`, `/v1/tutor/chat`, `/v1/audio/*`.
- **PRIVADO:**
  - Porta de inferência Ollama: `:11434` (acessível exclusivamente via overlay WireGuard/6PN).
  - Porta de voz Speaches: `:8000` (acessível exclusivamente via overlay WireGuard/6PN).
- **AÇÕES ESTRITAMENTE PROIBIDAS:**
  - Proibido port-forwarding no roteador residencial (portas 8081, 11434, 8000).
  - Proibido DMZ host ou ativação de UPnP.
  - Proibido uso de ngrok, Cloudflare Tunnel exposto para Ollama, ou Tailscale Funnel.
  - Proibida exposição de endpoints de inferência diretamente na WAN.

---

## 8. STEP 10 — INVENTÁRIO DE SEGREDOS

| Variável / Segredo | Finalidade | Status no Preflight |
| :--- | :--- | :--- |
| `PRIMARY_SERVICE_TOKEN` | Autenticação principal caller → Gateway | Obrigatório no Gateway Cloud (gerado com alta entropia) |
| `SECONDARY_SERVICE_TOKEN` | Token secundário para rotação sem downtime | Recomendado no Gateway Cloud |
| `LOCAL_LLM_BASE_URL` | Aponta para o IP IPv6 6PN do HP Victus | Formato: `http://[fdaa:...]:11434` |
| `LOCAL_LLM_MODEL_ID` | Identificador do modelo Ollama | `qwen2.5:3b` |
| `LOCAL_LLM_ENABLED` | Ativa inferência local primária | `true` |
| `CLOUD_FALLBACK_ENABLED` | Habilita failover em nuvem se Ollama falhar | `false` (na prova privada inicial); `true` (na prova de fallback) |
| `GEMINI_API_KEY` | Chave de fallback para o Gemini 3.7 Flash | Opcional (apenas quando `CLOUD_FALLBACK_ENABLED=true`) |
| `DEEPGRAM_API_KEY` | Chave de fallback STT Nova-3 | Opcional / Futuro |
| `CARTESIA_API_KEY` | Chave de fallback TTS Sonic | Opcional / Futuro |

*Garantia:* Nenhum segredo do Supabase de produção ou chaves de serviço reais estão ou serão commitados no repositório.

---

## 9. STEP 11 — DESCOBERTA DO SUPABASE (STAGING VS PRODUÇÃO)

Auditoria factual realizada via MCP Supabase (`list_projects`) e inspeção de código:
- **Projetos Existentes:**
  - ID: `hyivyrietgjdazgizafp`
  - Nome: `aeternum-atlas-saas`
  - Região: `us-west-2`
  - Status: `ACTIVE_HEALTHY`
- **`STAGING_SUPABASE_EXISTS`:** **NO**. Existe **apenas o projeto de produção**.
- **Regra de Isolamento de Produção:**
  - A Edge Function `ai-tutor v38` de produção **não deve ser modificada**.
  - A Edge Function `voice-token v8` de produção **não deve ser modificada**.
  - Migrações de banco e segredos de produção **não devem ser alterados**.
- **Solução Técnica para a Prova de Staging:**
  A validação da infraestrutura de pré-produção será realizada através de um **chamador cliente de teste sintético autenticado** (Node.js test harness / curl) simulando o contrato exato da Edge Function, eliminando qualquer risco de indisponibilidade ou regressão no ambiente produtivo.

---

## 10. STEP 12 — ESTADO DO VERCEL STAGING / PREVIEW

- **Configuração de Projeto:** O repositório está vinculado a um projeto Vercel (`.vercel/project.json` presente com Project ID e Org ID válidos).
- **Capacidade de Preview:** Cada branch ou PR pode gerar um preview deployment isolado (ex: `aeternum-atlas-git-branch.vercel.app`).
- **Limitação Atual:** As variáveis de ambiente do preview atualmente herdam o Supabase de produção (`hyivyrietgjdazgizafp`).
- **Diretriz:** Nenhuma alteração no Vercel de produção será disparada durante esta fase. O teste da infraestrutura do Gateway será desacoplado da interface web de produção.

---

## 11. STEP 13 — PLANO DE TESTES DE PRÉ-PRODUÇÃO (TESTES A A F)

Quando a infraestrutura de nuvem for autorizada e provisionada, os 6 testes obrigatórios serão executados na seguinte ordem:

1. **TESTE A — Caminho Limpo Primário (Private Local Inference):**
   - Chamador (Edge/Test Harness) envia POST HTTPS com `PRIMARY_SERVICE_TOKEN` para o Gateway na nuvem.
   - Gateway roteia via IPv6 6PN WireGuard para o HP Victus (`:11434`).
   - Ollama `qwen2.5:3b` processa na RTX 4050 e retorna tokens.
   - Gateway responde com `HTTP 200 OK`, `provider: "ollama-local"`, `fallbackUsed: false`.

2. **TESTE B — Fallback com Provedor Primário Indisponível:**
   - Simulação: Contêiner do Ollama pausado no HP Victus com `CLOUD_FALLBACK_ENABLED=true`.
   - Gateway detecta erro de conexão no endpoint local, aciona fallback para Gemini cloud.
   - Resposta `HTTP 200 OK`, `provider: "gemini"`, `fallbackUsed: true`.

3. **TESTE C — Gateway Indisponível (Fail-Closed na Borda):**
   - Simulação: Gateway offline ou rota inalcançável.
   - Chamador aborta por timeout delimitado e encerra com `HTTP 503 AI_GATEWAY_UNAVAILABLE`. Zero vazamento de dados.

4. **TESTE D — Rejeição de Autenticação (Zero Provider Calls):**
   - Requisição enviada com token inválido ou ausente.
   - Gateway rejeita imediatamente com `HTTP 401 UNAUTHORIZED`.
   - Verificação: Zero chamadas chegam ao Ollama ou aos provedores cloud.

5. **TESTE E — Desconexão do Overlay Privado (Auditoria de Exposição Zero):**
   - Varredura de portas externa via WAN contra o IP público do HP Victus nas portas 11434 e 8000.
   - Resultado esperado: Conexões recusadas/timeout (drop). Nenhuma porta de inferência acessível publicamente.

6. **TESTE F — Soft Timeout & Bounded Recovery:**
   - Simulação de latência artificial no Ollama excedendo `providerTimeoutMs`.
   - `AbortController` cancela a requisição pendente no Ollama e realiza fallback seguro dentro de `gatewayRequestTimeoutMs`.

---

## 12. STEP 14 — PLANO DE MEDIÇÃO DE LATÊNCIA

Para capturar com precisão a performance da arquitetura híbrida, as medições utilizarão marcas de tempo monotônicas (`performance.now()`) cobrindo 7 pontos de telemetria:
1. `t_edge_to_gw`: Latência do chamador até a terminação HTTPS do Gateway.
2. `t_gw_to_victus`: RTT de rede privada sobre o túnel WireGuard.
3. `t_victus_inference`: Tempo de processamento e geração de tokens no Ollama (GPU RTX 4050).
4. `t_gw_fallback`: Latência do provedor cloud em caso de failover.
5. `t_total_request`: Tempo de ponta a ponta percebido pelo chamador.
6. Detecção de falhas duras (connection refused, network unreachable).
7. Detecção de soft failures (timeout bounded).

*Meta amostral no teste real:* N = 50 requisições sequenciais e concorrentes para cálculo empírico de `p50`, `p95` e `p99`. (Nenhum valor fictício gerado no preflight).

---

## 13. STEP 15 — MATRIZ DE DECISÃO: OPÇÃO A VS OPÇÃO B

| Critério de Comparação | Opção A: Fly.io Machine + WireGuard | Opção B: VPS Linux Dedicado + Tailscale |
| :--- | :--- | :--- |
| **Disponibilidade Atual de Conta** | CLI não instalado localmente; requer login | Requer contratação de VPS (Hetzner, Lightsail, etc.) |
| **Requisito de Faturamento** | Cartão de crédito exigido para habilitar conta | Faturamento direto da VPS ($3.50 a $5/mês) |
| **Complexidade de Configuração** | **Média** (gerenciado por CLI/API nativa do Fly) | **Alta** (provisionar SO, Nginx/Caddy, Certbot, Docker, Tailscale) |
| **Rede Privada (Overlay)** | **Nativa (6PN WireGuard IPv6)** | Mesh Tailscale (WireGuard encapsulado com fallback DERP) |
| **Compatibilidade com Windows Host** | Alta (WireGuard for Windows oficial ou WSL2) | Alta (cliente oficial Tailscale para Windows) |
| **Compatibilidade Docker** | Nativa (Fly executa contêineres OCI diretamente) | Nativa (Docker instalado na VPS) |
| **Terminação TLS** | **Automática** na borda Fly (certificados Let's Encrypt geridos) | Manual (necessita configurar Caddy ou Nginx com Certbot) |
| **Gestão de Segredos** | **Nativa** (`fly secrets set`) injetados no runtime | Manual (arquivos `.env` protegidos na VPS) |
| **Latência até HP Victus (Brasil)** | **Baixa** (presença direta na região `gru` / São Paulo) | Depende da região escolhida (baixa em GRU, média em US) |
| **Persistência Operacional** | Auto-restart configurável ou `min_machines_running = 1` | Instância Linux 100% contínua 24/7 |
| **Observabilidade** | Logs nativos (`fly logs`), métricas Prometheus integradas | Systemd journal, Docker logs, Grafana manual |
| **Custo Estimado** | $0 a $3.50/mês (dentro da cota/crédito da plataforma) | $3.50 a $6.00/mês (VPS fixa) + Tailscale gratuito |
| **Recuperação de Falhas** | Fly reinicia contêineres caídos automaticamente | Systemd / Docker daemon supervisionam o contêiner |
| **Classificação de Prontidão** | **BLOQUEADO (Requer instalação de CLI e autorização de billing)** | **BLOQUEADO (Requer contratação de VPS e autorização de billing)** |

**Conclusão Arquitetural:**  
A **Opção A (Fly.io + WireGuard)** permanece como a escolha canônica recomendada pela facilidade de terminação TLS automatizada, presença direta na região `gru` (São Paulo) e ausência de necessidade de gerenciamento de patches de sistema operacional em uma VPS.

---

## 14. STEP 16 — CONDIÇÕES DE PARADA & RECOMENDAÇÃO FACTUAL

### Condições de Parada Atingidas:
- `FLY_CLI_INSTALLED`: NO
- `FLY_AUTHENTICATED`: NO
- `FLY_BILLING_REQUIRED_BEFORE_DEPLOY`: YES (requer autorização financeira explícita do usuário)
- `STAGING_SUPABASE_EXISTS`: NO (ambiente isolado de staging ausente; produção congelada)

### Ações Recomendadas para o Próximo Passo:
1. **Autorização do Usuário:** O usuário deve autorizar a instalação do `flyctl` e a criação de uma conta/organização na Fly.io.
2. **Execução Manual do Usuário:**
   - Instalar o Fly CLI: `winget install Fly.flyctl` (ou script PowerShell oficial).
   - Realizar o login: `fly auth login` no terminal do HP Victus.
   - Adicionar método de pagamento na dashboard da Fly.io (necessário para alocar a Machine na região `gru`).
3. **Provisionamento do Gateway Staging (após aprovação):**
   - Criação da app `aeternum-ai-gateway-staging` na região `gru`.
   - Configuração do túnel WireGuard `fly wireguard create` para o HP Victus.
   - Deploy da imagem reproduzível aprovada na Fase 3B.4B.1.

---

## 15. ESTADO DAS MODIFICAÇÕES

- **Alterações de Código em Produção:** 0
- **Alterações de Runtime do Gateway:** 0
- **Alterações em Frontend / Estilos:** 0
- **Recursos Externos de Nuvem Criados:** 0
- **Impacto em Produção:** ZERO

---

**STATUS:** `PHASE 3B.4B.3 PRE-PRODUCTION INFRASTRUCTURE PREFLIGHT IMPLEMENTED / PENDING CHATGPT FINAL VERIFICATION`

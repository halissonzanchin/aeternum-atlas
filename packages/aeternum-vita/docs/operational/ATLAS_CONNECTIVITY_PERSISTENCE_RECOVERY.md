# Aeternum Atlas — Protocolo Operacional de Conectividade, Persistência e Rollback P0 (Fases 3E → 3F)

## 1. Visão Geral e Topologia Arquitetural

Este documento estabelece o protocolo operacional definitivo de inicialização, persistência real fora da sessão interativa, isolamento da IA científica paralela, autenticação híbrida Fail-Closed, tolerância a falhas e rollback para a integração entre o **Aeternum Atlas** (Vercel/Supabase) e o **Atlas Code** (Rust/Ollama) no host **HP Victus**.

```
[Estudante Autenticado (pt / es)]
        │
        ▼ (HTTPS)
[Plataforma Web Oficial (Vercel: www.aeternumatlas.com)]
        │
        ▼ (HTTPS POST /functions/v1/ai-tutor + JWT Supabase)
[Supabase Edge Function: ai-tutor]
        │  ├── Autenticação do Aluno (JWT + Perfil Ativo + Rate Limit Institucional)
        │  ├── Safe Engine (Camadas 1-2): 0 chamadas LLM se resposta canônica determinística
        │  ├── Evidence Gate (Camada 4): Validação estrita de evidência soberana (Latarjet/Moore)
        │  ├── Roteamento Canário: ATLAS_LOCAL_AI_ENABLED + ATLAS_LOCAL_AI_ALLOWLIST_UUIDS
        │  └── Política de Indisponibilidade: ATLAS_LOCAL_AI_FALLBACK_POLICY=fail_closed (padrão: zero gasto pago silencioso)
        │
        ▼ (HTTPS + CF-Access-Client-Id + CF-Access-Client-Secret + Authorization: Bearer)
[Cloudflare Access Edge (Service Auth — Policy: Aeternum Atlas - Supabase Service Auth)]
        │  ├── Valida Service Token na borda Cloudflare
        │  └── Injeta e assina Cf-Access-Jwt-Assertion (RS256)
        │
        ▼ (Túnel Criptografado Outbound QUIC — 4 conexões HA: gru11, gru18, gru17)
[Cloudflare Tunnel (cloudflared.exe no HP Victus — UUID: b1fd6c11-0405-4cae-9f86-a986a99bc0b3)]
        │  └── Execução desacoplada via WMI + --token-file (Zero segredo em linha de comando)
        │
        ▼ (HTTP Loopback Estrito 127.0.0.1:8081)
[Aeternum AI Gateway (Node.js/TypeScript)]
        │  ├── HYBRID_AUTH Fail-Closed:
        │  │     1. Assinatura RS256 Cf-Access-Jwt-Assertion contra certs X.509 válidos (renovação 6h)
        │  │     2. Validação de iss, aud, exp, nbf, iat obrigatório e common_name === CF_ACCESS_CLIENT_ID
        │  │     3. Guard anti-confusão UUID do túnel vs. Service Token Client ID (*.access)
        │  │     4. Comparação em tempo constante (timingSafeEqual) de Authorization: Bearer
        │  ├── Concurrency Queue (maxConcurrent: 2, maxQueueSize: 5 — proteção VRAM RTX 4050 6GB)
        │  └── Cancelamento Cooperativo (AbortSignal propagado até o daemon Rust)
        │
        ▼ (HTTP Loopback Estrito 127.0.0.1:14555 + Header Host + Bearer Token Local)
[Atlas Daemon Isolado (atlas-daemon-gateway-runtime.exe)]
        │  ├── Binário Sombra Isolado (%LOCALAPPDATA%\AtlasCode\runtime-bin)
        │  ├── Diretório de Dados Isolado (%LOCALAPPDATA%\AtlasGatewayRuntime\AtlasCode)
        │  ├── SQLite WAL Persistence + Lock JSON (atlas_core.lock) sem colisão com sessão científica
        │  └── Host Header Rebinding Guard (127.0.0.1:14555)
        │
        ▼ (HTTP Loopback Estrito 127.0.0.1:11434)
[Ollama Engine (qwen3.5:4b)]
```

---

## 2. Invariantes Rígidas de Segurança (Hard Gates)

1. **Isolamento de Portas e Loopback Estrito:**
   - **Ollama (`127.0.0.1:11434`):** Exclusivamente em loopback. Nunca exposto à internet ou diretamente ao túnel.
   - **Atlas Daemon (`127.0.0.1:14555`):** Exclusivamente em loopback. Rejeita com HTTP 403 qualquer requisição sem cabeçalho `Host: 127.0.0.1:14555` ou `localhost:14555`.
   - **Aeternum AI Gateway (`127.0.0.1:8081`):** Único origin local autorizado a receber tráfego do `cloudflared`.
2. **Defesa em Profundidade na Autenticação (`HYBRID_AUTH` Fail-Closed):**
   - **Camada 1 (Cloudflare Access RS256):** Verifica assinatura criptográfica RS256 de `Cf-Access-Jwt-Assertion`, janelas de validade X.509 (`validFrom` / `validTo`) dos certificados públicos, `iss`, `aud`, `exp`, `nbf`, `iat` numérico obrigatório e `common_name === CF_ACCESS_CLIENT_ID`. Rejeita algoritmos `none` ou `HS256` e rejeita configuração acidental de UUID de túnel no lugar de Client ID (`*.access`).
   - **Camada 2 (Bearer Token Independente):** Valida `Authorization: Bearer <AETERNUM_AI_GATEWAY_TOKEN>` usando `crypto.timingSafeEqual` com hash SHA-256 quando comprimentos diferem.
   - **Invariante Anti-Bypass:** Modos `INTERNAL_DEV` e `DISABLED` são automaticamente bloqueados se qualquer header Cloudflare (`cf-ray`, `cf-connecting-ip`, `cf-access-jwt-assertion`, `cf-access-client-id`) estiver presente.
3. **Isolamento Total da Sessão Paralela da IA Científica:**
   - O supervisor copia `atlas-daemon.exe` para `%LOCALAPPDATA%\AtlasCode\runtime-bin\atlas-daemon-gateway-runtime.exe` e executa o processo com `LOCALAPPDATA=%LOCALAPPDATA%\AtlasGatewayRuntime` (sincronizando `auth_token` com ACL restrita).
   - Dessa forma, recompilações (`cargo build`/`cargo test`) e locks SQLite da frente científica em `C:\Users\halis\OneDrive\Desktop\Atlas Code` jamais derrubam ou bloqueiam o daemon de conectividade.
4. **Política de Custo Zero Surpresa (Sem Fallback Pago Silencioso):**
   - No Gateway local, provedores pagos de nuvem não são registrados como fallback automático salvo se `ATLAS_ALLOW_PAID_CLOUD_FALLBACK=true`.
   - Na Edge Function `ai-tutor`, a política padrão é `ATLAS_LOCAL_AI_FALLBACK_POLICY=fail_closed`: se a IA local estiver offline, lenta ou com fila cheia (`429 QUEUE_FULL`), a função retorna `HTTP 503` controlado (`LOCAL_AI_TEMPORARILY_UNAVAILABLE`) sem acionar silenciosamente modelos pagos de terceiros.

---

## 3. Persistência Real Fora da Sessão do Antigravity (Watchdog WMI + Logon)

### 3.1 Arquitetura de Supervisão (`scripts/connectivity/supervise_atlas_stack.ps1`)
- Todos os 4 processos (`ollama.exe`, `atlas-daemon-gateway-runtime.exe`, `node.exe` Gateway e `cloudflared.exe`) e o próprio processo Watchdog são instanciados via **WMI (`Win32_Process.Create`)**, tendo `WmiPrvSE.exe` como processo pai.
- Nenhum componente é filho de terminal interativo do VS Code, PowerShell ou sessão do Antigravity.
- **Deduplicação e Limpeza de Lock Órfão:**
  - O supervisor analisa o JSON `%LOCALAPPDATA%\AtlasGatewayRuntime\AtlasCode\data\atlas_core.lock` (`{"pid": <N>, "status": "active"}`) e remove o arquivo apenas se o PID não existir mais ou não pertencer ao `atlas-daemon`.
  - Caso múltiplos processos `cloudflared.exe` sejam detectados, o supervisor preserva o processo mais antigo saudável e encerra duplicatas.
- **Mecanismos de Inicialização Automática Registrados no Windows:**
  1. **Scheduled Task:** `AtlasConnectivityStackWatchdog` (Gatilho `AtLogOn` para o usuário `halis`, executando `supervise_atlas_stack.ps1 -Continuous -IntervalSeconds 20` protegido pelo mutex global `Global\AtlasConnectivityWatchdogMutex`).
  2. **Registry Run (`HKCU:\Software\Microsoft\Windows\CurrentVersion\Run`):**
     - `AtlasStackSupervisor`: dispara `supervise_atlas_stack.ps1 -Continuous -IntervalSeconds 20` em background oculto.
     - `AtlasCloudflaredTunnel`: garante redundância do conector `cloudflared` com `--token-file`.

### 3.2 Comandos Operacionais Rápidos
- **Auditar saúde das 4 camadas (e corrigir automaticamente qualquer falha):**
  ```powershell
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/connectivity/supervise_atlas_stack.ps1
  ```
- **Garantir que o Watchdog contínuo está ativo em background:**
  ```powershell
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/connectivity/supervise_atlas_stack.ps1 -EnsureWatchdog
  ```
- **Verificar status sem reiniciar processos:**
  ```powershell
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/connectivity/supervise_atlas_stack.ps1 -StatusOnly
  ```

---

## 4. Plano de Rollback (Reversão Rápida em Menos de 2 Minutos)

### 4.1 Rollback Nível 1 — Desativar IA Local no Supabase (Instantâneo, Zero Impacto na Vercel)
Se for necessário interromper imediatamente o uso da IA local no `ai-tutor`:
1. No painel do Supabase (`Edge Functions -> Secrets`) ou via CLI:
   - Alterar `ATLAS_LOCAL_AI_ENABLED=false` (ou esvaziar `ATLAS_LOCAL_AI_ALLOWLIST_UUIDS=""`).
   - Se desejar que os alunos voltem temporariamente a usar o provedor cloud configurado no Supabase, definir `ATLAS_LOCAL_AI_ENABLED=false`.
2. Efeito imediato: a requisição deixa de consultar `atlas-code.aeternumatlas.com` na próxima chamada, sem necessidade de redeploy da Vercel (`www.aeternumatlas.com`).

### 4.2 Rollback Nível 2 — Despublicar a Rota Pública na Cloudflare (Isolamento de Borda)
Se for necessário cortar o acesso externo mantendo os serviços locais ativos no HP Victus:
1. No painel **Cloudflare Zero Trust -> Networks -> Tunnels -> `atlas-victus-gateway` -> Public Hostname**:
   - Remover o hostname `atlas-code.aeternumatlas.com` (ou pausar o Service Token em **Access -> Service Auth**).
2. O DNS `aeternumatlas.com` e `www.aeternumatlas.com` na Vercel permanecem 100% inalterados.

### 4.3 Rollback Nível 3 — Pausar o Túnel e o Watchdog Local no HP Victus
Se for necessário encerrar o túnel e a supervisão automática localmente no notebook:
```powershell
# 1. Desativar Scheduled Task e entradas Run se desejar pausar persistência no boot
Disable-ScheduledTask -TaskName "AtlasConnectivityStackWatchdog" -ErrorAction SilentlyContinue

# 2. Encerrar Watchdog, cloudflared e Gateway local (preservando Ollama e IA científica)
Get-CimInstance Win32_Process | Where-Object {
  ($_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'supervise_atlas_stack\.ps1') -or
  ($_.Name -eq 'cloudflared.exe') -or
  ($_.Name -eq 'node.exe' -and $_.CommandLine -match 'apps[\\/]gateway[\\/]src[\\/]index\.ts') -or
  ($_.Name -eq 'atlas-daemon-gateway-runtime.exe')
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
```
> **Nota:** Este comando preserva intactos `ollama.exe` e qualquer processo `atlas-daemon.exe` pertencente à sessão paralela da IA científica.

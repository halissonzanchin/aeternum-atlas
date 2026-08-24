# ARCHITECTURE DECISION RECORDS (ADR) — AETERNUM ATLAS

---

## ADR-001 — Criação do Aeternum AI Gateway & Abstração de Providers

Data: 2026-08-24

### Contexto
A plataforma Aeternum Atlas estava acoplada a serviços de nuvem de terceiros (Gemini, Deepgram, Cartesia) e necessita migrar para uma infraestrutura própria e soberana no HP Victus, mantendo resiliência e independência de fornecedor.

### Problema
Chamadas diretas a SDKs e APIs de fornecedores específicos tornam a aplicação frágil a mudanças de preços, latência e dependência externa.

### Alternativas consideradas
1. Substituição pontual direta (hardcoded) de Gemini por Ollama e Deepgram por Whisper.
2. Criação de uma camada de abstração (Aeternum AI Gateway) com interfaces de provedor independentes.

### Decisão
Criar o **Aeternum AI Gateway** com interfaces universais (`LLMProvider`, `STTProvider`, `TTSProvider`, `RAGProvider`, `MemoryProvider`), roteamento dinâmico e circuit breaker.

### Motivo
Permite alternar entre processamento local no HP Victus e contingência em nuvem com zero alteração no frontend ou nos tutores pedagógicos.

### Consequências positivas
- Soberania tecnológica total.
- Facilidade para trocar modelos de IA conforme a evolução do estado da arte.
- Compatibilidade futura com servidores dedicados e clusters de GPU.

### Consequências negativas
- Necessidade de manter uma camada intermediária de orquestração e health checks.

### Impacto futuro
Permite escalar a plataforma da máquina local para servidores em nuvem sem refatorar o código da aplicação.

### Status
ACCEPTED

---

## ADR-002 — Arquitetura Local-First com Cloud Fallback

Data: 2026-08-24

### Contexto
A plataforma é utilizada por estudantes e equipes acadêmicas que exigem alta disponibilidade ininterrupta.

### Problema
Um servidor de IA puramente local está sujeito a desligamentos acidentais, falta de energia ou oscilações na internet residencial. Um servidor puramente em nuvem gera altos custos por minuto.

### Alternativas consideradas
1. 100% Cloud (Custo alto por minuto).
2. 100% Local Offline (Risco de indisponibilidade total se a máquina local desligar).
3. Local-First com Cloud Fallback (Processamento local prioritário + contingência em nuvem).

### Decisão
Adotar **Local-First com Cloud Fallback**. O tráfego prioritário (95%+) é processado no HP Victus a custo zero; em caso de falha de saúde local, o roteador aciona a nuvem automaticamente com telemetria.

### Motivo
Une custo zero no dia a dia com disponibilidade de 99.9% para a instituição de ensino.

### Consequências positivas
- Economia máxima de custos operacionais.
- Garantia de que o estudante nunca fica sem resposta.

### Consequências negativas
- Exige monitoramento contínuo de status e circuit breaker inteligente.

### Impacto futuro
Base estável para apresentações comerciais com faculdades de medicina.

### Status
ACCEPTED

---

## ADR-003 — Blindagem de Segurança P0: Proibição de Tokens Anônimos (Zero Guests)

Data: 2026-08-24

### Contexto
Auditoria técnica identificou que as funções `voice-token` e `ai-tutor` permitiam a geração de credenciais para usuários anônimos (`guest-xxxx`).

### Problema
Risco de abuso de infraestrutura, consumo não autorizado de GPU/APIs e falta de auditoria de identidade em ambientes acadêmicos.

### Alternativas consideradas
1. Manter modo guest para testes rápidos.
2. Exigir autenticação JWT estrita com verificação de perfil ativo em banco de dados.

### Decisão
Bloquear integralmente usuários anônimos. Exigir header `Authorization: Bearer <token>` com retorno obrigatório de `401 Unauthorized` (`AUTH_REQUIRED` / `AUTH_INVALID`) para requisições sem sessão válida.

### Motivo
Proteção integral do patrimônio computacional, segurança institucional e conformidade com LGPD/GDPR.

### Consequências positivas
- Fim de chamadas anônimas fantasmas.
- Controle de taxa por usuário (`consume_voice_rate_limit`).

### Consequências negativas
- Usuários não logados precisam realizar login antes de testar a voz.

### Impacto futuro
Plataforma pronta para auditorias de segurança de grandes universidades.

### Status
ACCEPTED

---

## ADR-004 — Adoção do LiveKit Community Self-Hosted no HP Victus

Data: 2026-08-24

### Contexto
O transporte de áudio WebRTC em tempo real exige baixa latência, cancelamento de eco e suporte a interrupção de fala (barge-in).

### Problema
O LiveKit Cloud cobra custos por minuto de tráfego de mídia que se tornam proibitivos em larga escala.

### Alternativas consideradas
1. LiveKit Cloud.
2. WebSockets puros com áudio bruto.
3. LiveKit Community Edition auto-hospedado em Docker.

### Decisão
Hospedar o **LiveKit Community Server** em container Docker local no HP Victus com exposição segura via Cloudflare Tunnel.

### Motivo
Mantém a qualidade industrial do protocolo LiveKit WebRTC com custo zero de infraestrutura de mídia.

### Consequências positivas
- Custo zero por minuto de áudio.
- Suporte nativo a STT/TTS em streaming e detecção de pausas.

### Impacto futuro
Pode ser transferido para servidores de nuvem dedicados via Docker Compose sem alteração de protocolo.

### Status
ACCEPTED

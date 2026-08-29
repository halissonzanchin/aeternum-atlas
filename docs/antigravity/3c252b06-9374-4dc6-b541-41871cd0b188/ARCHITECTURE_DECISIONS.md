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

---

## ADR-005 — Estratégia 3D Oficial: Plataforma Canônica Sketchfab & Arquivamento do Renderizador Próprio

Data: 2026-08-29

### Contexto
O visualizador 3D proprietário desenvolvido anteriormente para o navegador apresentou desempenho de carregamento e renderização inaceitável, especialmente em smartphones e tablets utilizados por estudantes em cenários reais de aprendizagem online.

### Decisão Arquitetural
1. **Renderizador Próprio Arquivado:**
   - `AETERNUM_CUSTOM_3D_ENGINE = LEGACY`
   - `AETERNUM_CUSTOM_3D_ENGINE_STATUS = ARCHIVED`
   - `AETERNUM_CUSTOM_3D_ENGINE_ACTIVE = NO`
   - Proibida a restauração ou reconstrução do renderizador proprietário salvo decisão explícita futura.
2. **Plataforma 3D Canônica de Produção:**
   - **SKETCHFAB** (`STATUS: ACTIVE / CANONICAL / PRODUCTION 3D VISUALIZATION PLATFORM`).
   - O Sketchfab é responsável pela hospedagem, renderização 3D, visualização web/mobile/tablet, câmera/navegação, nós da malha e anotações.
   - O Aeternum Atlas é responsável pelas camadas de inteligência pedagógica e orquestração de comandos semânticos sobre o visualizador.
3. **Nomenclatura da Futura Fase 3C:**
   - **FASE 3C: AI ↔ SKETCHFAB INTELLIGENCE BRIDGE**
4. **Arquitetura Conceitual da Fase 3C:**
   ```
   Aeternum Tutor / Vita
           |
           v
   Aeternum AI Gateway
           |
           v
   Anatomical Intent Resolver
           |
           v
   Anatomical Structure Registry
           |
           v
   Safe 3D Command Layer
           |
           v
   Sketchfab Integration Bridge
           |
           v
   Sketchfab Viewer API
           |
           v
   Sketchfab-hosted anatomical model
   ```
5. **Invariante Crítico de Segurança:**
   - A IA NUNCA gera JavaScript arbitrário para o Sketchfab.
   - A IA NUNCA inventa IDs de nós/malhas do Sketchfab.
   - A IA NUNCA executa comandos diretos não validados no visualizador.
   - A IA produz exclusivamente comandos semânticos validados (ex: `focusStructure("radial_nerve")`, NUNCA `show(184)`).
   - Somente o código determinístico do `AnatomicalStructureRegistry` traduz o `structureId` para o UID do modelo e nós/anotações específicos do Sketchfab.
6. **Contrato Inicial de Comandos Seguros (Allowlist):**
   - `focusStructure(structureId)`
   - `showStructure(structureId)`
   - `hideStructure(structureId)`
   - `isolateStructure(structureId)`
   - `showAnnotation(structureId)`
   - `gotoAnnotation(annotationId)`
   - `resetView()`
   - `listAvailableStructures()`
7. **Metadados Mínimos do Anatomical Structure Registry:**
   - `structureId`
   - `canonicalName`
   - `aliases`
   - `region`
   - `system`
   - `Sketchfab model UID`
   - `Sketchfab node IDs`
   - `Sketchfab annotation IDs`
   - `supported actions`
8. **Roadmap e Decomposição da Fase 3C:**
   - 3C.1 Anatomical Structure Registry
   - 3C.2 Safe Sketchfab Command Layer
   - 3C.3 Anatomical Intent Resolver
   - 3C.4 Voice/Text → Anatomy → Sketchfab
   - 3C.5 Guided Anatomical Experiences
   *(Fase 3C NÃO iniciada; bloqueada até a conclusão e auditoria das Fases 3A e 3B).*

### Status
ACCEPTED / ARCHITECTURE_DECISION_RECORDED

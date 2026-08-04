# Aeternum 26 — plano de implementação da atualização geral

Data: 2026-07-29  
Estado: **FASE 6 CONCLUÍDA — FASE 7 LIBERADA**

## Objetivo

Transformar a plataforma em um sistema visual único, moderno, premium e
confiável, inspirado nos princípios do Liquid Glass:

- material adaptativo, não decorativo;
- conteúdo sempre mais importante que o recipiente;
- profundidade reservada para hierarquia e foco;
- controles fluidos, legíveis e táteis;
- transições que explicam mudança de estado;
- degradação responsável para acessibilidade e hardware modesto.

O objetivo não é copiar assets ou APIs proprietárias da Apple. É aplicar à web
os princípios observáveis de material, luz, movimento, legibilidade e
continuidade de interface.

## Princípios não negociáveis

1. Nenhum menu pode apontar para rota inexistente.
2. Nenhum dado de demonstração pode parecer institucional real.
3. Blur é um recurso de hierarquia, não o fundo padrão de todos os cards.
4. Um componente deve pertencer a um único sistema material.
5. Todo alvo interativo deve possuir no mínimo 44 × 44 px.
6. O conteúdo deve permanecer legível sem blur, animação ou transparência.
7. O Tutor Atlas AI é uma entidade única e sincronizada em toda a plataforma.
8. Desktop, notebook, tablet e celular são gates, não ajustes posteriores.
9. Estados vazio, carregando, erro, offline e sem permissão fazem parte do design.
10. Nenhuma fase avança sem evidência reproduzível.

## Arquitetura material proposta

### Tokens semânticos

Criar um namespace único `--a26-*`:

- `--a26-color-*`: base, texto, teal, gold, warning e estados;
- `--a26-material-*`: clear, regular, substantial e opaque;
- `--a26-radius-*`: control, card, panel e floating;
- `--a26-shadow-*`: ambient, elevated e focus;
- `--a26-space-*`: escala de espaçamento;
- `--a26-motion-*`: response, spring, enter e exit;
- `--a26-type-*`: display, title, body, label e mono;
- `--a26-z-*`: conteúdo, navegação, overlay, tutor e modal.

### Quatro materiais

| Material | Uso | Blur real |
|---|---|---:|
| Clear | chip, controle sobre imagem e toolbar compacta | baixo e transitório |
| Regular | navegação, menus e painel flutuante | moderado |
| Substantial | modal, Tutor aberto e foco crítico | alto, uma camada |
| Opaque | cards persistentes, tabelas e conteúdo denso | zero |

### Primitivas oficiais

- `A26Surface`;
- `A26Button`;
- `A26IconButton`;
- `A26Toolbar`;
- `A26Sidebar`;
- `A26TabBar`;
- `A26Card`;
- `A26Metric`;
- `A26Field`;
- `A26SegmentedControl`;
- `A26Modal`;
- `A26Popover`;
- `A26EmptyState`;
- `A26LoadingState`;
- `A26ErrorState`;
- `A26DataDisclosure`;
- `A26TutorSurface`.

Nenhuma nova tela poderá criar blur, raio, sombra ou glow diretamente.

## Fases

## Fase 1 — contratos, verdade e governança

Estado: **CONCLUÍDA EM 2026-07-29**  
Evidência: `PHASE_1_CONTRACTS_TRUTH_GOVERNANCE_COMPLETION_REPORT.md`

Objetivo: remover inconsistências que inviabilizam uma atualização visual
confiável.

Entregas:

- implementar ou ocultar as cinco rotas de Coordenação ausentes;
- implementar ou ocultar as quatro rotas de Reitoria ausentes;
- substituir o fallback silencioso de Digital Twins por módulo real ou estado
  “planejado” explícito;
- conectar Coordenação e Reitoria a dados reais ou estados vazios honestos;
- corrigir o vínculo `institution_id` do catálogo 3D;
- contextualizar Configurações por papel;
- definir glossário editorial para português e nomes de produto;
- criar teste automatizado “item de menu → rota válida → título esperado”.

Gate de saída:

- zero item de menu terminando em NotFound;
- zero módulo silenciosamente redirecionado à Visão geral;
- zero métrica de demonstração sem rótulo;
- catálogo 3D sem erro de origem no console;
- matriz de papéis e permissões aprovada.

## Fase 2 — fundação visual Aeternum 26

Estado: **CONCLUÍDA EM 2026-07-29**  
Evidência: `PHASE_2_FOUNDATION_COMPLETION_REPORT.md`

Objetivo: criar o sistema material único antes de migrar páginas.

Entregas:

- tokens `--a26-*`;
- quatro materiais oficiais;
- primitivas oficiais;
- documentação de composição;
- playground visual com estados default, hover, focus, press, disabled,
  loading, erro e contraste elevado;
- adapters temporários para componentes legados;
- lint rule ou busca de CI proibindo novo `backdrop-filter` fora do sistema.

Gate de saída:

- todas as primitivas aprovadas em quatro viewports;
- contraste AA nos estados de texto e controle;
- 44 × 44 px em todos os controles;
- reduced motion/transparency funcional;
- nenhuma primitiva depende de `!important`.

## Fase 3 — shell, navegação e acesso — CONCLUÍDA

Objetivo: migrar primeiro a moldura compartilhada por todos os papéis.

Escopo:

- home header e footer;
- login e cadastro;
- sidebar;
- topbar e busca;
- navegação mobile;
- seletor de idioma;
- notificações, menus e modais;
- estados de autenticação e permissão.

Direção:

- navegação em material Regular;
- conteúdo persistente em Opaque;
- no máximo uma barra flutuante por eixo;
- morphing apenas quando comunica origem e destino;
- busca com expansão contextual;
- foco de teclado evidente sem glow excessivo.

Gate de saída:

- navegação completa por teclado;
- zero sobreposição e zero overflow nos quatro viewports;
- até 2 superfícies com blur real no shell;
- rotas e papel atual sempre identificáveis.

## Fase 4 — experiência Aluno e Professor

Objetivo: elevar as áreas de uso diário e eliminar módulos genéricos.

Aluno:

- preservar o dashboard real premium;
- redesenhar Vídeos, Cursos, Histórico e Favoritos;
- corrigir títulos duplicados;
- criar estados de continuidade e progresso;
- migrar Atlas, Agenda e Simulados;
- transformar filtros de 32–40 px em controles táteis oficiais.

Professor:

- criar estados vazios orientados à ação;
- migrar Turmas, Alunos, Guias, Aulas, Anotações e Relatórios;
- dar continuidade visual entre conteúdo docente e Atlas;
- contextualizar perfil e configurações.

Gate de saída:

- zero `SimpleModule` em rota principal;
- zero título duplicado;
- zero controle abaixo de 44 px;
- todos os estados vazios oferecem próximo passo;
- dados e permissões observados com contas reais.

Estado da implementação em 2026-07-29:

- rotas diárias do Aluno substituídas por experiência baseada em dados
  observados na conta;
- Vídeos, Cursos, Histórico, Favoritos e Progresso com estados próprios e
  origem declarada;
- Agenda e Simulados recertificados nos quatro viewports;
- rotas secundárias identificadas corretamente no shell;
- Turmas, Alunos, Guias, Aulas, Anotações, Relatórios e Perfil docente
  recertificados;
- estados vazios docentes com próximo passo funcional;
- modais de Turma e Guia migrados para o contrato A26;
- permissões cruzadas de Aluno e Professor confirmadas com sessões reais;
- contratos automatizados da Fase 4 publicados.

**Decisão: Fase 4 concluída. A Fase 5 está liberada.**

## Fase 5 — Coordenação e Reitoria

Objetivo: criar uma experiência de decisão institucional, não apenas um painel
de métricas.

Direção:

- visão geral resumida;
- disclosure progressivo para detalhes;
- alertas priorizados por impacto e urgência;
- drill-down preservando contexto;
- tabelas densas em material Opaque;
- filtros em toolbar Regular;
- comparação temporal clara;
- origem e atualização dos dados sempre visíveis.

Gate de saída:

- todas as rotas do menu entregues;
- zero dado fixo apresentado como real;
- estados sem dados e dados parciais certificados;
- coordenação e reitoria distinguíveis por tarefa e densidade.

Estado da implementação em 2026-07-29:

- seis rotas de Coordenação e cinco rotas de Reitoria migradas para a
  experiência institucional Aeternum 26;
- Coordenação orientada a decisões pedagógicas e Reitoria orientada a exceções
  executivas, capacidade e integridade;
- períodos de 7, 30 e 90 dias aplicados às métricas, séries, distribuição por
  sistema e ranking de modelos;
- origem, horário de atualização e cobertura das fontes sempre identificáveis;
- estados carregando, erro, acesso restrito, leitura parcial, vazio e observado
  implementados;
- alertas priorizados e drill-down com preservação de rota e foco;
- tabelas persistentes em material Opaque e filtros em toolbar Regular;
- permissões cruzadas bloqueadas com sessões reais;
- Coordenação e Reitoria certificadas nos quatro viewports;
- contratos automatizados e guia institucional publicados.

Evidência: `PHASE_5_INSTITUTIONAL_DECISION_COMPLETION_REPORT.md`

**Decisão: Fase 5 concluída. A Fase 6 está liberada.**

## Fase 6 — Administração e Superadministração

Objetivo: reduzir densidade e custo de composição sem perder poder operacional.

Entregas:

- separar resumo, operação e análise;
- migrar Alunos, Analytics, ROI, Heatmap, CMS 3D, Migração, Certificação,
  Faturamento, Relatórios e Configurações;
- resolver o contrato de Digital Twins;
- substituir pilhas de cards por disclosure, tabelas e painéis contextuais;
- aumentar filtros de 26 px para controles oficiais;
- distinguir claramente Admin de Superadmin por escopo e capacidade.

Gate de saída:

- até 6 superfícies com blur real por rota no desktop;
- até 4 em tablet/celular;
- zero blur aninhado;
- filtros e tabelas operáveis por teclado e toque;
- ações destrutivas com confirmação e estado de resultado.

Estado da implementação em 2026-07-29:

- 12 rotas operacionais da Administração institucional e 16 da
  Superadministração migradas para uma experiência Aeternum 26 compartilhada;
- Administração restrita ao tenant autenticado e Superadministração com escopo
  global e seletor explícito de instituição;
- Alunos, Analytics, ROI, Heatmap, CMS 3D, Migração, Certificação,
  Faturamento, Relatórios e Configurações migrados;
- Gêmeos digitais apresentado como planejado e não operacional;
- Migração e Certificação sem scores ou estados presumidos;
- tabelas densas opacas, disclosure de cobertura e drill-down contextual;
- filtros oficiais de 44 px e tabelas roláveis por teclado e toque;
- ações persistentes condicionadas à fonte Supabase e confirmação;
- orçamento de blur e responsividade certificados nos quatro viewports;
- contratos automatizados e guia administrativo publicados.

Evidência: `PHASE_6_ADMINISTRATION_COMPLETION_REPORT.md`

**Decisão: Fase 6 concluída. A Fase 7 está liberada.**

## Fase 7 — Viewer 3D e Tutor Atlas AI

Objetivo: tornar o Viewer e o Tutor a expressão máxima da identidade Aeternum.

Viewer:

- toolbar contextual e progressiva;
- painéis opacos/translúcidos sem competir com o modelo;
- controles adaptados à mão dominante no mobile;
- feedback inequívoco de carregar, erro, offline e permissão.

Tutor:

- um único renderer e histórico sincronizado;
- esfera compacta sem película residual;
- drag com limites seguros e persistência de posição;
- expansão da energia interna para o compositor do painel;
- resposta em material Substantial e compositor em Clear;
- estados repouso, escuta, processamento, resposta e offline;
- pausar canvas e animações quando invisível;
- fallback estático para movimento/transparência reduzidos.

Gate de saída:

- nenhuma perda de contexto entre setores;
- posição do Tutor recuperável e acessível por teclado;
- animação sustentada próxima de 60 fps no hardware-alvo;
- zero blur real aninhado no painel;
- modo offline honesto e histórico preservado.

## Fase 8 — otimização e certificação

Objetivo: provar qualidade antes do rollout completo.

Entregas:

- code splitting por domínio;
- Viewer e administração fora do bundle inicial;
- SVG anatômico otimizado e tardio;
- remoção de `/assets/noise.png` quebrado;
- consolidação e poda do CSS legado;
- remoção progressiva de `!important`;
- auditoria WCAG;
- medição em dispositivos físicos;
- testes visuais por rota/papel/viewports;
- rollout com feature flag por papel.

Gates finais:

| Indicador | Meta |
|---|---:|
| Rotas anunciadas e inexistentes | 0 |
| Alvos abaixo de 44 px | 0 |
| Overflow horizontal global | 0 |
| Blur real simultâneo desktop | ≤ 6 |
| Blur real simultâneo tablet/celular | ≤ 4 |
| Blur aninhado | 0 |
| LCP p75 | < 2,5 s |
| INP p75 | < 200 ms |
| CLS p75 | < 0,1 |
| Bundle JS inicial sem gzip | < 1,2 MB |
| CSS inicial sem gzip | < 300 KB |
| Asset inicial individual | < 1 MB |
| Erros de console no fluxo principal | 0 |

## Ordem de rollout

1. equipe interna e home pública atrás de flag;
2. aluno;
3. professor;
4. coordenação;
5. reitoria;
6. admin;
7. superadmin;
8. Viewer/Tutor como certificação final de assinatura.

Cada onda exige:

- comparação visual antes/depois;
- teste de dados reais;
- desktop, notebook, tablet e celular;
- teclado, leitor de tela e toque;
- orçamento de blur e bundle;
- plano de rollback.

## Estratégia de migração

- não reescrever toda a plataforma de uma vez;
- criar primitivas e migrar rotas completas, nunca fragmentos aleatórios;
- manter adaptadores somente durante uma janela de migração definida;
- marcar cada classe antiga como `legacy`, `adapter` ou `remove`;
- remover a folha antiga quando o último consumidor for migrado;
- impedir novas exceções em `globals.css`;
- manter um dashboard público de dívida visual por rota.

## Definition of Done de uma rota Aeternum 26

Uma rota só recebe o selo Aeternum 26 quando:

- possui título, propósito e próximo passo claros;
- usa apenas primitivas oficiais;
- não apresenta mock como dado real;
- suporta loading, vazio, erro, offline e permissão;
- não possui controle abaixo de 44 px;
- não possui overflow nos quatro viewports;
- respeita movimento, transparência e contraste reduzidos;
- cumpre o orçamento de blur;
- não gera erro ou warning próprio no console;
- possui teste de rota, teste visual e evidência em navegador real.

## Próxima decisão

O próximo trabalho autorizado é a **Fase 7 — Viewer 3D e Tutor Atlas AI**.
Viewer e Tutor devem preservar os contratos de verdade, material e
responsividade já certificados; nenhum refinamento visual pode reintroduzir
histórico fragmentado, estado offline enganoso ou blur aninhado.

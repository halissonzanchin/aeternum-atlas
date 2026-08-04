# Aeternum 26 — conclusão da Fase 1

Data: 2026-07-29  
Fase: **Contratos, Verdade e Governança**  
Estado: **CONCLUÍDA**

## Decisão

Os contratos de navegação, papéis, origem de dados e estados institucionais
estão consistentes o suficiente para iniciar a Fundação Visual Aeternum 26.
Nenhum gate desta fase depende de uma promessa visual ou de dados sintéticos:
as conclusões abaixo foram verificadas em código, testes automatizados e
navegador real.

## Entregas concluídas

1. Fonte única de navegação por papel criada.
2. Seis rotas da Coordenação implementadas e vinculadas a títulos próprios.
3. Cinco rotas da Reitoria implementadas e vinculadas a títulos próprios.
4. Coordenação e Reitoria conectadas ao serviço institucional, com estados
   explícitos de carregamento, vazio, restrição e contrato não conectado.
5. Gêmeos digitais deixou de cair silenciosamente na Visão geral e agora é um
   módulo “Planejado — não operacional”.
6. O papel `admin` deixou de ser elevado a `super_admin`; Administração e
   Superadministração possuem homes, menus e permissões distintas.
7. Mensagens de negação diferenciam Administração institucional de
   Superadministração global.
8. Métricas administrativas permanecem ocultas durante carregamento ou
   restrição.
9. Ausência de telemetria deixou de ser convertida em “online” ou “operação
   estável”; o painel agora apresenta “sem dados”.
10. Catálogo legado deixou de consultar colunas inexistentes de exclusão e
    identifica cada item como Supabase, override local ou referência local.
11. Fallback local do catálogo passou a ser visível e quantificado na tela.
12. Contexto institucional é resolvido pelo perfil; o default configurado é
    identificado como tal e as políticas RLS continuam sendo a autoridade.
13. Configurações contextualiza perfil, instituição e abas de acordo com o
    papel autenticado.
14. Glossário editorial e contrato de verdade publicados.
15. Testes automatizados cobrem menu, rota, seção, home, separação de
    privilégios e contrato do catálogo.

## Matriz de rotas certificadas

### Coordenação

| Rota | Título observado | Resultado |
|---|---|---|
| `/coordinator/dashboard` | Inteligência acadêmica | Aprovado |
| `/coordinator/professors` | Professores | Aprovado |
| `/coordinator/classes` | Turmas | Aprovado |
| `/coordinator/disciplines` | Disciplinas | Aprovado |
| `/coordinator/heatmaps` | Mapas de aprendizagem | Aprovado |
| `/coordinator/risk` | Alunos em atenção | Aprovado |

### Reitoria

| Rota | Título observado | Resultado |
|---|---|---|
| `/rector/dashboard` | Visão executiva | Aprovado |
| `/rector/indicators` | Indicadores institucionais | Aprovado |
| `/rector/engagement` | Engajamento acadêmico | Aprovado |
| `/rector/utilization` | Utilização da plataforma | Aprovado |
| `/rector/roi` | Retorno institucional | Aprovado |

Nenhuma das onze rotas terminou em NotFound ou em uma seção diferente da
anunciada.

## Evidência por conta

| Conta/papel | Evidência observada | Resultado |
|---|---|---|
| Aluno | `/models`, fonte local explicitamente identificada, sem erro crítico do catálogo | Aprovado |
| Professor | Configurações exibiu “Professor”, sem aba Compartilhar e sem rótulo Estudante | Aprovado |
| Coordenação | seis rotas, estados reais/vazios e origem Supabase identificada | Aprovado |
| Reitoria | cinco rotas, ROI não inferido e origem Supabase identificada | Aprovado |
| Administração | home institucional, papel “Administrador institucional” e bloqueio da área global | Aprovado |
| Superadministração | home global e Gêmeos digitais como módulo planejado próprio | Aprovado |

Credenciais não são reproduzidas nem armazenadas neste relatório.

## Evidência responsiva

| Fluxo novo ou alterado | Desktop | 768 × 1024 | 390 × 844 |
|---|---:|---:|---:|
| Coordenação | Aprovado | Aprovado | Aprovado |
| Reitoria | Aprovado | Aprovado | Aprovado |
| Administração / Configurações | Aprovado | Herdado da baseline | Aprovado |
| Catálogo 3D e aviso de origem | Aprovado | Herdado da baseline | Aprovado |
| Gêmeos digitais | Aprovado | Herdado da baseline | Sem mudança estrutural |

Nos viewports executados, `scrollWidth` não excedeu a largura do documento.
Menus compactos preservaram rolagem interna sem criar overflow global.

## Gates técnicos

- `npm run test:contracts`: **8/8 aprovados**
- `npm run lint`: **0 erros, 598 avisos de legado**
- `npm run typecheck`: **aprovado**
- `npm run build`: **aprovado**
- catálogo no navegador: **sem erro de `models_3d`, `institution_id`,
  `deleted_at` ou `archived_at`**
- refresh autenticado observado em Reitoria e Superadministração: **aprovado**

## Débitos transparentes, não bloqueadores

1. O catálogo institucional retornou zero registros para a conta do aluno;
   três referências locais foram exibidas com origem explícita.
2. Turmas e Disciplinas ainda não possuem contrato de dados conectado; ambas
   mostram esse estado em vez de inventar conteúdo.
3. O painel institucional de entrada permanece sinalizado como em construção.
4. Os 598 avisos de lint são legado e devem ser reduzidos incrementalmente.
5. Permanecem os débitos de bundle, `/assets/noise.png` e imports mistos já
   registrados na Fase 0.

Esses pontos não violam o gate de verdade porque nenhum deles se apresenta
como dado, integração ou funcionalidade concluída.

## Gate de saída

- zero item novo de menu terminando em NotFound: **cumprido**
- zero módulo silenciosamente redirecionado à Visão geral: **cumprido**
- zero métrica sintética sem rótulo: **cumprido no escopo auditado**
- catálogo 3D sem erro crítico de origem no console: **cumprido**
- matriz de papéis e permissões aprovada: **cumprido**

## Próxima fase autorizável

**Fase 2 — Fundação Visual Aeternum 26.**

A migração visual deve começar pelos tokens `--a26-*`, quatro materiais e
primitivas oficiais. Nenhuma tela deve receber uma nova camada isolada de
Liquid Glass antes da aprovação dessa fundação compartilhada.

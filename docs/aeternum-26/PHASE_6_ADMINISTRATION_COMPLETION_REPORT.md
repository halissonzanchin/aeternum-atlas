# Aeternum 26 — relatório de conclusão da Fase 6

Data: 2026-07-29  
Estado: **CONCLUÍDA**

## Resultado

A Administração institucional e a Superadministração deixaram de usar o painel
legado denso e passaram a compartilhar uma experiência Aeternum 26 orientada a
decisão. Os papéis continuam visualmente relacionados, mas têm escopo,
navegação e capacidades diferentes.

## Entregas concluídas

- nova experiência administrativa baseada nas primitivas Aeternum 26;
- separação entre resumo, operação, análise e proveniência;
- 12 rotas operacionais para Administração institucional;
- 16 rotas operacionais para Superadministração;
- home institucional restaurada em `/institution/dashboard`;
- home global preservada em `/super-admin`;
- canonicalização corrigida para nunca elevar Admin a Superadmin;
- toolbar com períodos, busca e seletor de tenant somente para Superadmin;
- tabelas densas `Opaque`, disclosure de cobertura e modais contextuais;
- estados loading, erro, restrito, parcial, vazio, demo e observado;
- Migração e Certificação sem scores ou estados presumidos;
- Gêmeos digitais como contrato planejado explícito;
- mutações de cadastro condicionadas à origem Supabase e confirmação;
- filtros e tabelas operáveis por teclado e toque;
- playground da Fundação removido da navegação operacional;
- contratos automatizados da Fase 6.

## Rotas entregues

### Administração institucional

- `/institution/dashboard`;
- `/admin/institution`;
- `/admin/institution-students`;
- `/admin/import-students`;
- `/admin/global-analytics`;
- `/admin/academic-analytics`;
- `/admin/roi`;
- `/admin/heatmap`;
- `/admin/models-3d`;
- `/admin/estimated-billing`;
- `/admin/reports`;
- `/admin/settings`.

### Superadministração

- `/super-admin`;
- `/super-admin/institution`;
- `/super-admin/students`;
- `/super-admin/import-students`;
- `/super-admin/analytics`;
- `/super-admin/academic-analytics`;
- `/super-admin/roi`;
- `/super-admin/heatmap`;
- `/super-admin/models-3d`;
- `/super-admin/atlas-migration`;
- `/super-admin/viewer-analytics`;
- `/super-admin/atlas-certification`;
- `/super-admin/digital-twins`;
- `/super-admin/billing`;
- `/super-admin/reports`;
- `/super-admin/settings`.

## Evidência com sessões reais

A conta de Administração institucional chegou a `/institution/dashboard`. As
12 rotas canônicas declararam `institution_admin`, preservaram o tenant e
exibiram exatamente um título principal. O acesso direto a `/super-admin` foi
bloqueado com a mensagem de área restrita.

A conta de Superadministração chegou a `/super-admin`. As 16 rotas operacionais
declararam `super_admin` e escopo global. Acesso a `/admin/dashboard` foi
canonicalizado para `/super-admin`, sem reduzir o papel.

A seleção do tenant `Aeternum Atlas Oficial` foi executada no seletor global e
a consulta voltou ao estado parcial do tenant selecionado. O escopo global foi
restaurado ao final.

## Evidência de dados

A leitura global observada retornou:

- 1 instituição;
- 1 perfil institucional;
- 2 modelos no catálogo;
- zero acessos e zero eventos na janela de 30 dias.

Esses zeros foram apresentados como ausência de linhas no período, e não como
inatividade global.

A fonte de disciplinas permaneceu indisponível. A experiência declarou
**leitura administrativa parcial**, mostrou `Disciplinas — Indisponível` na
cobertura e não inseriu dados substitutos.

A leitura institucional retornou zero alunos visíveis. Nenhuma ação de
aprovação ou rejeição foi executada em conta real. O contrato destrutivo foi
validado por código e teste automatizado sem alterar o banco.

## Certificação responsiva

| Papel | Desktop 1440 × 900 | Notebook 1366 × 768 | Tablet 768 × 1024 | Celular 390 × 844 |
|---|---:|---:|---:|---:|
| Administração institucional | Validado | Validado | Validado | Validado |
| Superadministração | Validado | Validado | Validado | Validado |

Rotas representativas:

- Admin: Centro operacional, Analytics, Alunos e Atlas CMS;
- Superadmin: Centro operacional, Faturamento, Gêmeos digitais e
  Certificação.

Nos cenários observados:

- zero overflow horizontal global;
- exatamente um `h1`;
- zero controle visível abaixo de `44 × 44 px`;
- zero sobreposição entre toolbar e aviso de fonte;
- 3 a 5 superfícies A26 com blur no desktop;
- 3 a 4 superfícies A26 com blur em tablet/celular;
- zero blur A26 aninhado.

O fluxo contextual confirmou:

- uma única superfície de diálogo;
- foco inicial em `Fechar`;
- scroll do documento bloqueado;
- rota preservada;
- foco devolvido ao botão `Ver contexto`;
- 6 blurs A26 com o modal aberto, dentro do orçamento desktop.

A tabela móvel do Atlas CMS confirmou foco próprio, largura interna de 760 px
em recipiente de 314 px e rolagem de 160 px com `ArrowRight`. O filtro textual
e a seleção de período também foram exercitados. A alteração para 7 dias
preservou rota e seção.

## Correções encontradas durante a certificação

- a toolbar tinha `top` relativo ao contêiner rolável e sobrepunha o aviso de
  fonte; o offset foi removido;
- o raio flutuante da toolbar empilhada recortava o rótulo do filtro no
  celular; a versão móvel recebeu raio de painel e padding seguro;
- botões contextuais de tabela consumiam blur desnecessário; passaram a
  `Ghost/Opaque`;
- o recipiente de tabela não recebia foco nem rolagem horizontal explícita por
  teclado; recebeu foco, estilo e comandos;
- o playground interno aparecia no menu operacional e excedia o orçamento de
  composição; foi retirado desse menu.

## Validação automatizada

- `npm run test:contracts`: 43 testes aprovados, zero falha;
- `npm run test:a26-glass`: aprovado, zero declaração direta nova de blur;
- `npm run typecheck`: aprovado;
- ESLint dos arquivos da Fase 6: aprovado sem saída;
- `npm run build`: aprovado, 996 módulos transformados;
- chunk principal: aproximadamente 2,39 MB sem gzip;
- CSS principal: aproximadamente 557,5 kB sem gzip.

O novo painel administrativo não importa mais as grandes experiências legadas
de dashboard, pipeline de certificação e bancada agregada. Em comparação com a
linha de base da Fase 5, o build caiu de aproximadamente 1.052 para 996 módulos
e de 2,55 MB para 2,39 MB no chunk principal.

## Gates de saída

| Gate | Resultado |
|---|---|
| Resumo, operação e análise separados | Aprovado |
| Todas as rotas operacionais entregues | Aprovado |
| Admin e Superadmin distintos por escopo e capacidade | Aprovado |
| Digital Twins resolvido como contrato explícito | Aprovado |
| Desktop com no máximo 6 blurs A26 | Aprovado |
| Tablet/celular com no máximo 4 blurs A26 | Aprovado |
| Zero blur A26 aninhado | Aprovado |
| Filtros e tabelas por teclado e toque | Aprovado |
| Ação destrutiva com confirmação e resultado | Aprovado |
| Quatro viewports sem overflow ou alvo subdimensionado | Aprovado |

## Débitos não bloqueantes

- restabelecer `academic_subjects` no backend;
- aumentar o volume real de alunos, logs e eventos para teste de densidade de
  produção;
- concluir code splitting e redução do bundle na Fase 8;
- remover, após a janela de migração, páginas legadas que já não são
  referenciadas pela experiência operacional.

Esses itens estão declarados, não geram dados falsos e não bloqueiam os gates
da Fase 6.

## Decisão

**Fase 6 concluída. A Fase 7 — Viewer 3D e Tutor Atlas AI está liberada.**

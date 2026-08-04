# Aeternum 26 — shell, navegação e acesso

Este documento define o contrato estrutural concluído na Fase 3. Ele vale para
Aluno, Professor, Coordenação, Reitoria, Administração institucional e
Superadministração.

## Uma única moldura autenticada

O `AppLayout` é a autoridade visual do shell autenticado:

- desktop: sidebar Regular e topbar Regular;
- tablet e celular: topbar Regular e tab bar Clear;
- conteúdo persistente: Opaque, sem blur estrutural;
- menu móvel: modal Substantial com foco contido;
- rota e papel: sempre expostos no topo e em atributos de auditoria;
- navegação administrativa local repetida: removida visualmente.

Nenhuma página interna deve criar uma segunda sidebar, topbar ou tab bar. Uma
área pode criar controles contextuais, mas eles pertencem ao conteúdo e não
substituem o shell.

## Orçamento óptico

O shell admite no máximo duas superfícies com blur real ao mesmo tempo:

1. desktop: sidebar + topbar;
2. compacto: topbar + tab bar;
3. modal aberto: o blur das barras é zerado e o modal se torna a única
   superfície óptica dominante.

Popovers, menu de idioma e resultados de busca são descendentes de uma barra.
O contrato de composição da Fundação desativa blur aninhado para impedir a
pilha de filtros.

## Busca contextual

- `/` abre e focaliza a busca fora de campos editáveis;
- o campo cresce a partir da barra, preservando sua origem espacial;
- resultados são limitados às rotas permitidas para o papel;
- `Escape` limpa a busca e devolve o foco ao campo;
- um resultado ativo declara `aria-selected`.

A busca é navegação de módulos. Busca anatômica profunda pertence às fases de
conteúdo e não deve ser simulada no shell.

## Idioma, menus e diálogo

- o seletor de idioma usa `menu` e `menuitem`;
- `ArrowUp`, `ArrowDown`, `Home`, `End` e `Escape` são suportados;
- `Escape` devolve foco ao gatilho;
- modais contêm `Tab`, fecham com `Escape`, restauram foco e bloqueiam o scroll
  do documento;
- notificações sem backend exibem estado vazio honesto;
- nenhuma contagem ou alerta fictício é mostrado.

## Acesso e autenticação

Login, cadastro, bootstrap da sessão, acesso restrito, erro global e rota não
encontrada usam primitivas Aeternum 26. A aparência não altera a autoridade:

- autenticação continua sendo resolvida pelo serviço de autenticação;
- redirecionamento usa a home canônica do papel;
- autorização continua sendo resolvida pelo contrato de permissões;
- a interface não promove papel nem cria acesso por inferência visual.

## Breakpoints certificados

| Categoria | Viewport |
|---|---:|
| Desktop | 1440 × 900 |
| Notebook | 1366 × 768 |
| Tablet | 768 × 1024 |
| Celular | 390 × 844 |

O conteúdo recebe área inferior reservada à tab bar em formatos compactos. A
sidebar some por completo abaixo de 1024 px; ela nunca é convertida em uma
segunda faixa horizontal.

## Regras de manutenção

- usar `shellNavigationForRole` para labels, ícones e estado ativo;
- não adicionar `backdrop-filter` fora da Fundação;
- manter todos os controles com pelo menos 44 × 44 px;
- não reintroduzir `.admin-section-tabs` como navegação global;
- novas rotas devem entrar primeiro no contrato canônico do papel;
- executar `npm run test:contracts` e `npm run test:a26-glass` antes de liberar.

# Aeternum 26 — guia de operações administrativas

Data: 2026-07-29  
Escopo: Administração institucional e Superadministração

## Intenção

A experiência administrativa separa síntese, operação e análise. A primeira
leitura mostra exceções e próximos passos; tabelas, cobertura e contexto são
abertos quando necessários. Densidade não pode significar pilhas de cards,
efeitos ópticos concorrentes ou métricas sem origem.

## Diferença entre papéis

### Administração institucional

Opera somente o tenant autenticado:

- instituição;
- alunos e importação;
- analytics operacionais e acadêmicos;
- retorno institucional e mapa anatômico de uso;
- catálogo 3D;
- faturamento, relatórios e configurações.

O acento visual é teal. A conta não recebe seletor global, Migração,
Certificação, análises globais do Viewer ou Gêmeos digitais.

### Superadministração

Opera o escopo global permitido:

- todas as operações institucionais autorizadas;
- seleção explícita de tenant;
- Migração e Certificação do catálogo;
- análises do visualizador;
- contrato de Gêmeos digitais.

O acento visual é gold. Selecionar uma instituição altera o escopo da consulta,
mas não altera o papel autenticado.

O playground da Fundação Aeternum 26 permanece um artefato interno de design e
não faz parte da navegação operacional.

## Contrato de verdade

Toda rota administrativa declara:

- papel efetivo;
- seção;
- origem;
- escopo global ou tenant;
- horário de atualização;
- cobertura das fontes;
- período aplicado, quando relevante.

Os estados são distintos:

- `observed`: linhas Supabase retornadas pela política;
- `partial`: uma ou mais fontes não responderam;
- `restricted`: tenant ou sessão não certificados;
- `demo`: demonstração explicitamente rotulada;
- `loading`, `error` e `unverified`.

Zero representa apenas zero linhas retornadas. Não significa ausência global.
Uma fonte indisponível nunca é substituída por fixture, score ou estimativa
silenciosa.

## Migração, Certificação e Gêmeos digitais

### Migração

O catálogo atual não fornece, por modelo, motor, asset, marcadores e telemetria
suficientes. A interface mostra `Motor não observado` e não calcula percentual
de migração.

### Certificação

Estado editorial não equivale a certificação anatômica. A interface mostra
`Não certificada` até existirem evidências persistidas de asset, marcadores,
conteúdo, quiz, acessibilidade e telemetria.

### Gêmeos digitais

O módulo é apresentado como `Planejado · não operacional`. Proveniência,
consentimento, privacidade, versionamento clínico e política institucional são
pré-condições explícitas.

## Ações persistentes

Aprovar ou rejeitar cadastro:

1. só aparece para registro pendente;
2. só é permitido quando a origem é `supabase`;
3. abre confirmação explícita;
4. identifica a conta afetada;
5. bloqueia repetição durante a mutação;
6. apresenta resultado e recarrega a fonte;
7. não executa em modo restrito ou demonstrativo.

Exportações contêm somente o que está observado na sessão atual e identificam
a fonte. Relatórios financeiros ou acadêmicos ausentes não são simulados.

## Materiais e densidade

- shell e toolbar: `Regular`;
- conteúdo, métricas e tabelas: `Opaque`;
- ações contextuais de tabela: `Ghost/Opaque`;
- modal: uma camada `Substantial`;
- tab bar móvel: `Clear`.

Orçamento:

- desktop: no máximo 6 superfícies A26 com blur real;
- tablet e celular: no máximo 4;
- zero blur A26 aninhado.

Superfícies `Opaque` com `blur(0px)` não contam como blur real.

## Teclado e toque

- filtros usam botões nativos com `aria-pressed`;
- campos possuem rótulos;
- ações visíveis têm no mínimo `44 × 44 px`;
- tabelas largas ficam em recipiente com `tabIndex="0"`;
- `ArrowLeft`, `ArrowRight`, `Home` e `End` controlam a rolagem horizontal;
- foco visível é preservado;
- modais bloqueiam scroll, prendem foco e o devolvem ao acionador.

## Responsividade

- desktop `1440 × 900`: navegação lateral, métricas e síntese em múltiplas
  colunas;
- notebook `1366 × 768`: mesma hierarquia com composição reduzida;
- tablet `768 × 1024`: navegação móvel e conteúdo em uma coluna;
- celular `390 × 844`: toolbar empilhada com raio de painel, tabelas internas
  roláveis e ações táteis.

Não pode existir overflow horizontal global ou sobreposição entre toolbar,
aviso de fonte, conteúdo e navegação.

## Checklist de manutenção

- [ ] rota pertence ao menu do papel correto;
- [ ] exatamente um título principal;
- [ ] origem e cobertura identificáveis;
- [ ] nenhum dado fixo se apresenta como real;
- [ ] filtro recalcula somente dados observados;
- [ ] tabela é rolável por teclado e toque;
- [ ] ação persistente exige fonte autorizada e confirmação;
- [ ] zero controle abaixo de 44 px;
- [ ] zero overflow global;
- [ ] blur dentro do orçamento e sem aninhamento;
- [ ] estados loading, vazio, erro, restrito e parcial cobertos;
- [ ] contrato automatizado atualizado.

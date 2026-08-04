# Aeternum 26 — guia da experiência institucional

Data: 2026-07-29  
Escopo: Coordenação e Reitoria

## Intenção

A experiência institucional deve reduzir o tempo entre observação e decisão.
Ela não é um mural de números. A primeira leitura apresenta exceções,
prioridades e contexto; detalhes aparecem apenas quando solicitados.

## Contrato de verdade

Cada tela institucional deve declarar:

- tenant e papel autenticados;
- origem dos dados;
- horário da última atualização;
- período aplicado;
- cobertura das fontes consultadas;
- diferença entre zero observado, fonte indisponível e acesso restrito.

Um valor zero significa apenas que a consulta permitida retornou zero linhas.
Não significa ausência global na instituição. Uma fonte indisponível nunca pode
ser substituída por número fixo, estimativa silenciosa ou dado de demonstração.

## Hierarquia de decisão

1. **Exceções:** alertas por impacto e urgência.
2. **Síntese:** consequência do que foi observado no período.
3. **Comparação:** janela atual contra o intervalo imediatamente anterior.
4. **Detalhe:** tabelas e drill-down acionados pelo usuário.
5. **Proveniência:** cobertura completa das fontes, disponível por disclosure.

## Diferença entre papéis

### Coordenação

Prioriza decisões pedagógicas:

- professores e turmas visíveis;
- estrutura de disciplinas;
- distribuição de estudo por sistema anatômico;
- alunos que acionam critérios de acompanhamento.

O destaque visual usa teal e uma densidade operacional intermediária.

### Reitoria

Prioriza decisões executivas:

- capacidade e ocupação contratual;
- engajamento institucional;
- utilização da plataforma;
- incidentes e integridade da leitura;
- base financeira observável.

O destaque visual usa gold e uma síntese mais compacta. Retorno acadêmico,
payback e economia não são inferidos sem contratos, custos e resultados
confirmados.

## Período e comparação

Os filtros oficiais são 7, 30 e 90 dias. A seleção deve recalcular:

- acessos;
- minutos de estudo;
- usuários com atividade;
- eventos;
- distribuição por sistema anatômico;
- ranking de modelos utilizados.

A comparação usa o intervalo imediatamente anterior de igual duração. Quando
não existe base anterior, a interface informa isso em vez de produzir uma
variação artificial.

## Materiais

- toolbar e filtros: `Regular`;
- métricas, tabelas e conteúdo persistente: `Opaque`;
- drill-down: `Substantial`, uma única camada;
- controles compactos contextuais: `Clear`.

Blur não é aplicado diretamente pelas páginas e não deve ser aninhado.

## Estados obrigatórios

Toda rota deve possuir estados para:

- carregando;
- erro;
- acesso restrito;
- fonte parcial;
- zero linhas;
- dados observados;
- detalhe selecionado.

Estados vazios devem explicar o alcance do zero e oferecer acesso à cobertura da
fonte. Erros não podem reutilizar dados antigos como se fossem atuais.

## Responsividade

- desktop `1440 × 900`: navegação lateral e leitura em múltiplas colunas;
- notebook `1366 × 768`: mesma hierarquia com densidade reduzida;
- tablet `768 × 1024`: navegação móvel e conteúdo em uma coluna;
- celular `390 × 844`: toolbar empilhada, tabelas roláveis apenas dentro do
  próprio recipiente e ações com pelo menos `44 × 44 px`.

O Tutor Atlas AI deve permanecer fora do fluxo decisório e não pode bloquear a
navegação móvel.

## Checklist para novas rotas

- [ ] título único e correspondente à rota;
- [ ] origem e atualização visíveis;
- [ ] filtro temporal altera os dados derivados;
- [ ] zero, indisponível e restrito são estados diferentes;
- [ ] tabela usa conteúdo observado, nunca fixture não rotulada;
- [ ] drill-down preserva contexto e foco;
- [ ] controle visível possui pelo menos `44 × 44 px`;
- [ ] sem overflow horizontal global;
- [ ] sem `backdrop-filter` direto;
- [ ] permissão do papel coberta por teste.

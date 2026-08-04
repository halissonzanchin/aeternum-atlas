# Aeternum 26 — guia da experiência diária

Data: 2026-07-29  
Escopo: Fase 4 — Aluno e Professor

## Princípio

A experiência diária deve responder a três perguntas sem exigir interpretação:

1. onde estou;
2. de onde vieram os dados;
3. qual é o próximo passo possível.

O Liquid Glass permanece no shell e nos overlays. Dados, listas, métricas e
conteúdo acadêmico persistente usam material Opaque para preservar contraste,
desempenho e hierarquia.

## Contrato do Aluno

`StudentLearningPage` é a composição comum para rotas secundárias, mas cada
rota declara título, finalidade, fonte, estado e próximo passo próprios.

| Área | Fonte apresentada | Estado sem dados |
|---|---|---|
| Histórico | logs observados na conta | explorar a biblioteca |
| Favoritos | favoritos da conta | explorar a biblioteca |
| Progresso e relatórios | progresso calculado da conta | iniciar estudo |
| Cursos | perfil autenticado | revisar perfil |
| Vídeos e aulas | catálogo institucional | conteúdo não publicado |
| Recomendações e revisão | atividade recente | explorar modelos |
| Ferramentas futuras | contrato de disponibilidade | alternativa funcional |

Regras:

- nunca fabricar aulas, vídeos, turmas ou percentuais;
- não chamar ausência de dados de erro;
- não apresentar recurso planejado como disponível;
- exatamente um `h1` por rota;
- filtros e ações com dimensão mínima de 44 × 44 px;
- rota secundária deve permanecer identificável no shell.

Agenda usa persistência da conta/dispositivo. Simulados usam catálogo
institucional declarado. Atlas preserva o shell e a identidade do papel.

## Contrato do Professor

Áreas entregues:

- Dashboard;
- Modelos 3D;
- Turmas;
- Alunos;
- Guias de estudo;
- Aulas;
- Anotações anatômicas;
- Relatórios acadêmicos;
- Perfil e acesso às configurações.

Todo estado vazio deve:

- explicar a ausência sem sugerir que existem dados ocultos;
- oferecer uma ação relacionada ao fluxo;
- preservar a origem institucional do conteúdo;
- evitar métricas demonstrativas.

Turmas e Guias usam operações reais do serviço acadêmico. Exportações refletem
somente as linhas carregadas. Modais usam `A26Modal`, com bloqueio de scroll,
foco contido e restauração do foco.

## Materiais

- Shell, topbar, sidebar e tab bar: Regular/Clear.
- Modal focal: Substantial.
- Cards, tabelas, métricas e timelines: Opaque.
- Botão primário: apenas para a ação principal do contexto.
- Blur real aninhado: proibido.

## Responsividade

Viewports de referência:

- 1440 × 900;
- 1366 × 768;
- 768 × 1024;
- 390 × 844.

Critérios:

- zero overflow horizontal;
- um título principal;
- controles visíveis de pelo menos 44 × 44 px;
- Tutor IA sem colidir com a navegação;
- tabela docente com rolagem interna;
- ações empilhadas no celular;
- conteúdo com espaço inferior para tab bar e Tutor IA.

## Governança

Mudanças futuras devem manter os testes da Fase 4 e declarar
`data-a26-source` nas superfícies que apresentam dados. Um novo módulo não pode
reintroduzir `SimpleModule`, dado fictício, ação sem destino ou título
duplicado.

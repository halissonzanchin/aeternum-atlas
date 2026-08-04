# Aeternum 26 — matriz de certificação visual por papel

Data da recertificação: 2026-07-29

Esta matriz diferencia acesso autenticado, inspeção visual e aprovação final.
Nenhuma senha, token ou identificador sensível é registrado.

| Papel | Home observada | Desktop | Notebook | Tablet | Celular | Identidade e rota | Estado do shell |
|---|---|---:|---:|---:|---:|---:|---|
| Visitante | `/` | Validado | Validado | Validado | Validado | N/A | Validado |
| Aluno | `/student/home` | Validado | Validado | Validado | Validado | Validado | Validado |
| Professor | `/professor/dashboard` | Validado | Validado | Validado | Validado | Validado | Validado |
| Coordenação | `/coordinator/dashboard` | Validado | Validado | Validado | Validado | Validado | Validado |
| Reitoria | `/rector/dashboard` | Validado | Validado | Validado | Validado | Validado | Validado |
| Administração institucional | `/institution/dashboard` | Validado | Validado | Validado | Validado | Validado | Validado |
| Superadministração | `/super-admin` | Validado | Validado | Validado | Validado | Validado | Validado |

## Viewports de referência

| Categoria | Viewport |
|---|---|
| Desktop | 1440 × 900 |
| Notebook | 1366 × 768 |
| Tablet | 768 × 1024 |
| Celular | 390 × 844 |

## Critérios aplicados

- Sem overflow horizontal global
- Navegação, conteúdo e CTA principal visíveis
- Alvos interativos visíveis de pelo menos 44 × 44 px
- Contraste, hierarquia e foco perceptíveis
- Tutor IA sem bloquear o fluxo principal
- Material Liquid Glass sem reduzir a legibilidade
- Rotas e dados correspondentes ao papel autenticado
- Estados vazios apresentados como estados vazios, sem números ou métricas fictícias

## Evidência observada

### Aluno

- Sessão real abriu o painel personalizado do estudante autenticado
- Hero premium restaurado com progresso e biblioteca reais
- Nenhum dado fictício do antigo modo de demonstração foi reativado
- Métricas permaneceram legíveis nos quatro viewports

### Professor

- Sessão real abriu o Painel do Professor
- Estado vazio do modelo mais utilizado aparece como `—`
- Texto explicativo deixou de ocupar o campo de uma métrica
- Nenhum overflow ou alvo subdimensionado nos quatro viewports

### Coordenação e Reitoria

- Sessões reais abriram, respectivamente, Inteligência Acadêmica e Dashboard Executivo
- A linguagem visual premium já existente foi preservada
- Nenhum overflow ou alvo subdimensionado nos quatro viewports

### Administração e Superadministração

- As duas sessões reais abriram seus painéis canônicos distintos
- A Administração institucional permaneceu em `/institution/dashboard`
- A Superadministração permaneceu em `/super-admin`
- A navegação horizontal redundante foi removida no desktop
- Tablet e celular usam uma única tab bar inferior e um menu completo modal
- O seletor de instituição recebeu área interativa de 44 px
- Caracteres corrompidos foram removidos das mensagens e rótulos observados

### Recertificação da Fase 3

- as seis contas reais chegaram à home canônica de seu papel;
- cada shell declarou exatamente uma rota ativa;
- sidebar e topbar foram substituídas pelo shell Aeternum 26 compartilhado;
- a navegação administrativa duplicada foi removida em todos os viewports;
- desktop e notebook ativaram exatamente dois blurs estruturais;
- tablet e celular ativaram exatamente dois blurs estruturais;
- com o menu móvel aberto, apenas o modal manteve blur real;
- o Tutor IA deixou de cobrir o item `Mais` da tab bar no celular.

### Recertificação da Fase 4 — Aluno e Professor

- Aluno: Início, Vídeos, Cursos, Histórico, Favoritos, Progresso, Agenda e
  Simulados foram observados em desktop, notebook, tablet e celular;
- todas as rotas observadas exibiram exatamente um título principal;
- nenhuma rota apresentou overflow horizontal ou erro global;
- controles visíveis ficaram em pelo menos 44 × 44 px;
- Tutor IA permaneceu separado da tab bar móvel;
- Histórico, Favoritos e Progresso usam somente registros observados na conta;
- conteúdo ainda não publicado aparece como estado vazio com próximo passo;
- Professor: Dashboard, Modelos, Turmas, Alunos, Guias, Aulas, Anotações,
  Relatórios e Perfil foram observados nos quatro viewports;
- todos os estados vazios docentes visíveis ofereceram ação contextual;
- Atlas docente foi verificado em desktop e celular, preservando rota, título e
  contexto do professor;
- modais docentes bloquearam o scroll, iniciaram o foco no controle Fechar,
  não criaram blur real aninhado e devolveram o foco ao acionador;
- uma sessão real de Aluno foi impedida de abrir `/teacher/classes`;
- uma sessão real de Professor foi impedida de abrir `/history`.

### Recertificação da Fase 5 — Coordenação e Reitoria

- Coordenação: Visão acadêmica, Professores, Turmas, Disciplinas, Mapas de
  aprendizagem e Alunos em atenção foram observados com sessão real;
- Reitoria: Visão executiva, Indicadores institucionais, Engajamento,
  Utilização e Retorno institucional foram observados com sessão real;
- todas as onze rotas exibiram exatamente um título principal e preservaram
  papel, rota e tenant;
- as duas experiências foram certificadas em desktop, notebook, tablet e
  celular sem overflow horizontal ou controle visível abaixo de 44 × 44 px;
- a fonte real foi apresentada como parcial porque `academic_subjects` não
  respondeu; nenhum dado substituto foi exibido;
- zeros observados foram diferenciados de ausência global e de fonte
  indisponível;
- filtros de 7, 30 e 90 dias governam também mapas e utilização;
- drill-down institucional bloqueou scroll, preservou rota e devolveu o foco;
- uma sessão de Coordenação foi impedida de abrir `/rector/dashboard`;
- uma sessão de Reitoria foi impedida de abrir `/coordinator/dashboard`.

### Recertificação da Fase 6 — Administração e Superadministração

- Administração institucional: 12 rotas operacionais observadas com sessão
  real e tenant preservado;
- Superadministração: 16 rotas operacionais observadas com sessão real e escopo
  global;
- todas as rotas exibiram exatamente um título principal, sem overflow global
  ou controle visível abaixo de 44 × 44 px;
- Administração foi impedida de abrir `/super-admin`;
- `/admin/dashboard` em sessão Superadmin foi canonicalizado para
  `/super-admin`;
- o seletor global aplicou o tenant `Aeternum Atlas Oficial` e depois restaurou
  o escopo global;
- leitura real: 1 instituição, 1 perfil institucional, 2 modelos, zero acessos
  e zero eventos na janela observada;
- `academic_subjects` permaneceu indisponível e foi apresentado como leitura
  parcial, sem substituição;
- Migração mostrou `Motor não observado`, Certificação mostrou
  `Não certificada` e Gêmeos digitais mostrou `Planejado · não operacional`;
- desktop permaneceu entre 3 e 5 blurs A26 por rota; tablet/celular entre 3 e
  4; zero blur A26 aninhado;
- o modal preservou rota, bloqueou scroll e devolveu o foco;
- a tabela móvel recebeu foco e respondeu a rolagem horizontal por teclado;
- a toolbar não sobrepôs o aviso de fonte e não recortou rótulos no celular.

## Política de evidência

- `Validado`: observado em navegador real
- `Parcial`: parte do fluxo foi observada, mas há gates pendentes
- `Não verificado`: não houve sessão legítima ou evidência suficiente
- `Quebrado`: falha reproduzida com evidência
- `Bloqueado por configuração`: depende de conta, integração ou serviço ausente

A certificação desta matriz cobre o shell, os estados de acesso, a experiência
diária de Aluno e Professor, a experiência decisória de Coordenação e Reitoria
e as operações de Administração e Superadministração. Viewer 3D e Tutor Atlas
AI pertencem à Fase 7.

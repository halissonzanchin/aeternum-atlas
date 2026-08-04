# Aeternum 26 — conclusão da Fase 4

Data: 2026-07-29  
Estado: **CONCLUÍDA**

## Escopo entregue

### Aluno

- `SimpleModule` removido integralmente das rotas privadas;
- Vídeos, Cursos, Histórico, Favoritos, Progresso e recursos complementares
  migrados para uma composição A26 específica;
- dados de histórico, favoritos e progresso derivados da conta;
- ausências e recursos planejados apresentados com linguagem honesta;
- origem dos dados declarada na interface;
- Agenda e Simulados recertificados;
- títulos secundários corrigidos no shell;
- cards, métricas, timeline, progresso e estados vazios responsivos.

### Professor

- Dashboard, Modelos, Turmas, Alunos, Guias, Aulas, Anotações, Relatórios e
  Perfil harmonizados com a fundação A26;
- estados vazios convertidos em decisões acionáveis;
- ações sem destino substituídas por navegação ou exportação funcional;
- exportações limitadas aos dados carregados;
- modais de Turma e Guia migrados para `A26Modal`;
- perfil conectado às Configurações e aos Modelos;
- continuidade com Atlas preservada.

## Evidência em navegador

Contas reais de Aluno e Professor foram autenticadas sem registrar
credenciais na documentação.

Aluno:

- 8 rotas × 4 viewports;
- zero overflow horizontal;
- zero erro global;
- exatamente um `h1` em cada rota carregada;
- zero controle efetivo abaixo de 44 px após a correção;
- Tutor IA sem sobreposição com a tab bar.

Professor:

- 9 rotas × 4 viewports;
- zero overflow horizontal;
- zero erro global;
- exatamente um `h1` em cada rota carregada;
- zero estado vazio visível sem próximo passo;
- zero controle efetivo abaixo de 44 px após a recertificação;
- Atlas docente validado em desktop e celular.

Permissões:

- Aluno recebeu `Acesso restrito` ao tentar abrir Turmas docentes;
- Professor recebeu `Acesso restrito` ao tentar abrir Histórico do aluno.

Modal docente:

- foco inicial no botão Fechar;
- scroll do documento bloqueado durante abertura;
- controles táteis;
- blurs descendentes neutralizados;
- foco devolvido ao acionador no fechamento.

## Contratos automatizados

O conjunto `a26-phase4-contracts.test.mjs` protege:

- ausência de `SimpleModule`;
- rotas principais do aluno;
- origem dos dados;
- Agenda e Simulados;
- estados vazios e operações docentes;
- dimensão tátil e responsividade;
- proibição de novos blurs diretos;
- separação de permissões;
- identificação das rotas secundárias.

## Gate de saída

- zero `SimpleModule` em rota principal: **aprovado**;
- zero título duplicado: **aprovado**;
- zero controle abaixo de 44 px: **aprovado**;
- estados vazios com próximo passo: **aprovado**;
- dados e permissões observados com contas reais: **aprovado**;
- contrato contra regressão publicado: **aprovado**.

## Passivos não bloqueantes

- avisos legados de lint permanecem fora do escopo funcional da fase;
- o bundle principal ainda exige trabalho futuro de divisão;
- conteúdo institucional não publicado continua vazio por decisão de verdade de
  produto, não por simulação visual.

**Decisão: Fase 4 concluída. A Fase 5 está liberada.**

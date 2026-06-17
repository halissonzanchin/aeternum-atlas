# PLATFORM INFORMATION ARCHITECTURE (Fase 6.1B.4)
**Arquitetura de Navegação e Menus da Aeternum Atlas**

A transição de um visualizador 3D para um Sistema de Gestão Anatômica Institucional exige uma arquitetura de navegação (Information Architecture) baseada em perfis e Controle de Acesso Baseado em Regras (RBAC). A plataforma adapta sua interface dinamicamente para entregar a cada ator exatamente aquilo que a sua Governança Institucional (Fase 6.1B.3) exige.

---

## 1. MENU SUPER ADMIN (Deuses)
A barra lateral é focada em gerenciar o império B2B.
* **Dashboard Global** (Métricas de adoção multi-tenant)
* **Instituições** (Lista de clientes: UPE, UNILA, etc.)
* **Biblioteca 3D** (Upload e gestão dos modelos GLB/GTLF)
* **Atlas AI** (Métricas de uso da API do ChatGPT/Anthropic)
* **Analytics Globais** (Logs do sistema)
* **Contratos** (Gestão do Asaas/Stripe)
* **Configurações** (Tokens, Segurança)

## 2. MENU INSTITUIÇÃO (Admin Local UPE)
A barra lateral é focada em recursos humanos e cadastro.
* **Dashboard Institucional** (Visão global do campus)
* **Cursos** (Ex: Medicina, Odontologia)
* **Coordenadores** (Cadastros)
* **Professores** (Cadastros)
* **Alunos** (Importação em massa/CSV)
* **Biblioteca** (Modelos habilitados para o tenant)
* **Relatórios** (Downloads gerenciais)

## 3. MENU REITOR (O Cofre)
A barra lateral é minimalista e focada em resultados numéricos puros.
* **Dashboard Executivo** (O grande painel de Adoção e ROI)
* **Indicadores Institucionais**
* **Engajamento** (Curvas de crescimento)
* **Utilização** (Top modelos 3D acessados)
* **ROI Acadêmico** (Custo vs Benefício laboratorial)

## 4. MENU COORDENADOR (O Cérebro)
A barra lateral é tática e focada na estrutura do curso.
* **Dashboard Acadêmico** (Raio-X de risco)
* **Disciplinas** (Currículo)
* **Turmas**
* **Professores** (Vincular à turma)
* **Heatmaps** (Esqueletos termográficos institucionais)
* **Alunos em Risco** (Filtro vermelho de evasão)

## 5. MENU PROFESSOR (O Braço Armado)
A barra lateral é focada na sala de aula.
* **Minhas Turmas** (Dashboard das turmas onde leciona)
* **Biblioteca** (Acesso aos modelos para projeção em data show)
* **Simulados** (Criação de provas virtuais)
* **Trilhas** (Criação de roteiros anatômicos)
* **Atividades**
* **Analytics da Turma** (Painel de notas e heatmap exclusivo)

## 6. MENU ALUNO (O Coração)
A barra lateral é focada em imersão e gamificação.
* **Meu Progresso** (Student Home: Horas estudadas, simulados pendentes)
* **Biblioteca 3D** (O visualizador principal)
* **Atlas AI** (O chat flutuante de tutoria)
* **Simulados** (Fazer prova)
* **Trilhas** (Seguir o roteiro do professor)
* **Histórico** (Boletim individual)

---

## 7. FLUXO DE NAVEGAÇÃO E ROTAS INTELIGENTES
* **O Início:** Todo usuário entra pela mesma página: `/login`.
* **A Bifurcação (Redirecionamento Automático):** Ao efetuar o login, a plataforma lê o `role` do JWT do Supabase e despacha o usuário para sua "Base de Operações":
  * Super Admin -> `/admin/dashboard`
  * Instituição -> `/tenant/dashboard`
  * Reitor -> `/rector/dashboard`
  * Coordenador -> `/coordinator/dashboard`
  * Professor -> `/professor/dashboard`
  * Aluno -> `/student/home` ou direto para `/models`
* **Segurança Visual (Ocultação):** Se um Professor tentar forçar a URL `/rector/dashboard`, o React Router disparará um alerta de segurança e o levará de volta ao seu painel. A barra lateral esconde 100% dos botões de níveis superiores e paralelos.

---

## 8. ESTRATÉGIA PARA A DEMO UPE (Novembro)
A reunião não terá tempo para navegar em tudo. Precisamos focar no impacto.
* **Obrigatório para Novembro (Real):** 
  1. A `Biblioteca 3D` perfeita e o `Atlas AI` interagindo minimamente para fechar o impacto visual do Aluno.
  2. O `Professor Dashboard` e os `Heatmaps` funcionais com dados simulados para a Coordenação.
  3. O `Reitor Dashboard` exibindo o ROI massivo.
* **Telas que Podem ser Simuladas (Visual Mock/Hardcoded):** 
  Criação de usuários, Importação de Alunos CSV, Pagamentos e Contratos (não interessam ao show). As abas menos importantes dos menus podem conter páginas estáticas apenas com imagens, se o tempo for crítico, pois o Reitor só quer ver a *Tela Inicial* do seu Dashboard operando em tempo real.

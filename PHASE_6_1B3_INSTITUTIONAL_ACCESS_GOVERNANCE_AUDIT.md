# INSTITUTIONAL ACCESS & GOVERNANCE AUDIT (Fase 6.1B.3)
**Matriz de Governança Oficial Aeternum Atlas**

Este documento codifica a hierarquia inviolável de acessos e permissões que rege o ecossistema da Aeternum Atlas, transformando-a de um mero visualizador 3D em um *Sistema de Gestão Anatômica Institucional (SGAI)*.

---

## 1. SUPER ADMIN (Aeternum Atlas)
*O Deus da Máquina. Visão Omnisciente.*
* **O que visualiza:** Todas as instituições, contratos globais, usuários de todos os tenants, logs de erro, e faturamento B2B via Asaas/Stripe.
* **O que cria:** Instituições, planos de assinatura, modelos 3D na biblioteca global, e instâncias do Atlas AI.
* **O que edita:** Preços, limites de usuários por tenant, e configurações globais do sistema.
* **O que exporta:** Relatórios de faturamento global e logs de adoção por tenant.
* **O que não acessa:** O Super Admin não é focado no nível de "sala de aula" (ex: notas de provas individuais de um aluno), embora tenha poder técnico para isso.
* **Dashboards:** Super Admin Dashboard (Receita, Churn, Adoção Multi-Tenant).
* **Componentes na Demo UPE:** Não aplicável diretamente na demo institucional, pois a UPE não saberá que existem outras instituições.

---

## 2. INSTITUIÇÃO (Admin Local)
*O Administrador Operacional do Campus.*
* **O que visualiza:** Apenas o próprio tenant (ex: Campus Presidente Franco).
* **O que cria:** Integrações SS0, contas de Reitores, Coordenadores e Professores.
* **O que edita:** Configurações White-Label (cores, logo da UPE), permissões de rede.
* **O que exporta:** Relatórios de acessos de rede e integrações LMS (Moodle/Blackboard).
* **O que não acessa:** Faturamento financeiro global, contratos da Aeternum com outras instituições.
* **Dashboards:** IT & Access Dashboard.
* **Componentes na Demo UPE:** Tela de login customizada com brasão da UPE.

---

## 3. REITOR
*Visão Estratégica & Decisão de Investimento.*
* **O que visualiza:** Totais de alunos e professores, engajamento macro, horas de plataforma, ROI acadêmico e crescimento mês a mês.
* **O que cria:** N/A (Perfil puramente consumista de inteligência).
* **O que edita:** Metas institucionais e alertas de adoção globais.
* **O que exporta:** Relatórios Executivos de Desempenho e ROI.
* **O que não acessa:** Dados financeiros do contrato (Billing), licenças contratadas, edição de aulas, modelos anatômicos específicos.
* **Dashboards:** Reitoria Executive Dashboard.
* **Componentes na Demo UPE:** O "Grande Painel" com milhares de horas estudadas pela medicina da UPE.

---

## 4. COORDENADOR
*Visão Acadêmica & Gestão Curricular.*
* **O que visualiza:** Professores do seu curso, todas as disciplinas, todas as turmas, alunos em risco de evasão, heatmaps de reprovação por anatomia.
* **O que cria:** Matriz curricular, novas disciplinas, relatórios de intervenção acadêmica.
* **O que edita:** Alocação de professores em turmas.
* **O que exporta:** Ranking de desempenho de turmas e Heatmaps de estruturas com defasagem no aprendizado.
* **O que não acessa:** Billing, faturamento, contratos, configurações de rede.
* **Dashboards:** Coordination Dashboard.
* **Componentes na Demo UPE:** Painel comparativo de Turma A vs Turma B e o Esqueleto Termográfico mostrando falha crônica na base do crânio.

---

## 5. PROFESSOR
*Visão Pedagógica & Ação Tática.*
* **O que visualiza:** Apenas as SUAS turmas e SEUS alunos. Heatmaps específicos da sua aula.
* **O que cria:** Conteúdos instrucionais, simulados customizados, atividades e trilhas no 3D Viewer.
* **O que edita:** Notas dos simulados que criou, parâmetros das trilhas.
* **O que exporta:** Pauta da sala, relatório de horas estudadas da SUA turma.
* **O que não acessa:** Outras turmas onde não leciona, dashboard financeiro, dashboard do reitor.
* **Dashboards:** Professor Dashboard.
* **Componentes na Demo UPE:** Alerta vermelho piscando com "3 alunos não acessam a plataforma há 15 dias" e a tela de criação de simulados.

---

## 6. ALUNO
*O Núcleo e o Combustível da Plataforma.*
* **O que visualiza:** Biblioteca 3D completa, Atlas AI (Tutor), seus próprios simulados pendentes e seu histórico de acertos/erros.
* **O que cria:** Dissecções personalizadas, anotações (pins) em ossos, chat com o Atlas AI.
* **O que edita:** O seu próprio perfil (avatar).
* **O que exporta:** Seu boletim analítico pessoal (Progresso de horas).
* **O que não acessa:** Notas de outros alunos, painéis de gestão, ferramentas de criação de prova.
* **Dashboards:** Student Home & 3D Viewer.
* **Componentes na Demo UPE:** Rotação do Crânio no 3D Viewer, interação com o Atlas AI e simulado de "Osteologia da Face".

---

## IMPACTO NA NARRATIVA UPE
A demonstração oficial mudará de foco: De *"veja que crânio 3D bonito"* para *"veja como o Aluno interage em casa, como o Professor microgerencia a turma, como o Coordenador prevê a falha no semestre e como o Reitor assegura que a faculdade lucrou com a tecnologia."*

# COORDINATOR DASHBOARD ARCHITECTURE (Fase 6.2D)
**Projeto de Inteligência Curricular e Gestão Acadêmica**

Enquanto o Reitor foca no custo, o Coordenador foca no *desempenho*. A arquitetura deste painel foi desenhada para atuar como o "Sistema Nervoso Central" do campus, permitindo diagnósticos cirúrgicos sobre onde a instituição está falhando pedagogicamente.

---

## 1. Academic Health Overview
**Objetivo:** Uma leitura instantânea dos sinais vitais acadêmicos do campus.

* **Turmas em Risco (Alerta Crítico):** Total de grupos acadêmicos cujo engajamento caiu nos últimos 7 dias.
* **Taxa Média de Aprovação Anatômica:** O Score Global institucional daquele mês (Ex: 76%).
* **Métricas Base (Cards):**
  * Alunos Ativos (Foco no engajamento semanal).
  * Professores Ativos (Corpo docente utilizando os módulos).
  * Disciplinas Ativas (Quais matérias têm uso digital constante).

## 2. Curriculum Heatmap (O Foco de Atenção)
**Objetivo:** Cruzar disciplinas vs estruturas anatômicas para revelar a raiz da reprovação.

* **Mapa Térmico Curricular (Heatmap Tabela/Matriz):** Eixo X: Turmas. Eixo Y: Módulos (Neuro, Osteo, Mio). As células vermelhas indicam reprovação e falta de estudo.
* **Módulos com Maior Taxa de Erro:** Ex: "Módulo Sistema Nervoso Central - 42% de precisão média".
* **Estruturas Anatômicas Críticas:** A anatomia real que eles não conseguem compreender (Ex: Artéria Cerebral Média).
* **Disciplinas Mais Difíceis:** Ranking decrescente baseado nas notas extraídas do banco de simulados.

## 3. Student Risk Center
**Objetivo:** Micro-gerenciamento de retenção estudantil e inteligência preditiva.

* **Filtro de Alunos com Baixo Desempenho:** (Acesso frequente + Nota baixa) = Dificuldade cognitiva.
* **Filtro de Alunos sem Acesso Recente:** (Sem acesso há 15 dias) = Desengajamento crônico / Provável Evasão.
* **Listagem "Alunos em Risco":** Uma tabela viva com botões rápidos (ação).
* **Alunos Recuperados:** Validação do sucesso pedagógico da ferramenta.

## 4. Faculty Performance
**Objetivo:** Identificar lacunas didáticas no corpo docente sem tom punitivo, mas focado em suporte.

* **Engajamento por Professor:** Tabela de utilização (Professor X recomendou 15 modelos 3D neste semestre).
* **Uso da Biblioteca por Turma:** Relatório de consumo passivo vs ativo.
* **Utilização de Simulados:** Qual professor está explorando o Atlas AI e criando questionários para sua turma.
* **Ranking Pedagógico:** Quais professores possuem as turmas com maiores notas de Anatomia.

## 5. Intervention Center
**Objetivo:** Tornar o sistema "Ativo" e não apenas reativo. Em vez do Coordenador procurar o problema, o dashboard grita por ajuda.

* **Alertas Automáticos:** "Atenção: A Turma de Medicina B2 não entra há 14 dias."
* **Recomendações de Ação:** Botão verde "Notificar Professor Responsável" via email/sistema.
* **Disciplinas e Professores Críticos:** Listagem curta de focos de atenção semanal (onde intervir na reunião de departamento).

---

## 6. CLASSIFICAÇÃO DE COMPONENTES VISUAIS

### 🔴 OBRIGATÓRIOS (Impacto Absoluto na Demo)
* **Heatmap Curricular (Matriz de Erros):** O divisor de águas tecnológico.
* **Alertas de Intervenção (Cards Piscantes):** Trazem a sensação de "IA Gestora".
* **Indicador Global de "Turmas em Risco".**

### 🟡 DESEJÁVEIS (Valor Acadêmico)
* Tabelas de Performance por Professor.
* Listagem estática de Top Estruturas Anatômicas Reprovadas.

### 🟢 OPCIONAIS (Preenchimento e Burolcracia)
* Tabelas contendo lista completa de disciplinas e cargas horárias exatas.
* Perfis individuais de alunos detalhados.

---

## 7. ESTRATÉGIA PARA A DEMO UPE

**1. O que o Coordenador precisa enxergar nos primeiros 30 segundos:**
Ele precisa entrar no dashboard e ver imediatamente uma mancha vermelha na tela (O Heatmap ou os Alertas) que diz: "A Turma X está prestes a reprovar em Neuroanatomia". Isso muda a postura dele na cadeira.

**2. Qual gráfico tem maior impacto:**
A *Matriz de Calor (Heatmap Curricular)*. É ali que a mágica preditiva acontece. Mostra onde as falhas educacionais sistêmicas estão se originando.

**3. Qual dado gera tomada de decisão imediata:**
Os *Alertas Automáticos de Alunos sem Acesso ou Baixo Desempenho*. Eles acionam um protocolo interno na coordenação (chamar o aluno para conversar, chamar o professor).

**4. Qual informação gera maior valor para Medicina:**
Quais estruturas anatômicas exatas estão causando reprovação maciça. Em vez de dizer "Turma ruim em Cabeça e Pescoço", dizer "70% da turma não entende os Forames da Base do Crânio". Precisão médica.

**5. Como encerrar a demonstração do Coordenador:**
Apresentando o "Intervention Center". Mostrar que a Aeternum Atlas não é um PDF animado, mas sim um "Assistente Coordenador" que automatiza diagnósticos que ele mesmo levaria 3 meses no final do semestre para compilar manualmente. A dor evitada vale ouro.

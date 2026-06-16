# ACADEMIC EXPORT SYSTEM AUDIT (Fase 4C.1A)
**Mapeamento de Exportação de Dados em Memória - Aeternum Atlas**

Esta auditoria mapeia todos os conjuntos de dados acadêmicos que já são cacheados e processados em memória (`JSON` no *Client-Side*) pelos *Dashboards* atuais. A extração destes dados para formatos universais (CSV/XLSX) exige **zero alterações estruturais no Supabase**, demandando apenas tratamento no *Frontend*.

---

## 1. O QUE PODE SER EXPORTADO HOJE (Em Memória)

### A. Relatório de Notas (Gradebook)
O relatório primário e indispensável para qualquer professor universitário.
* **Origem dos Dados:** Supabase (`anatomical_quiz_attempts`, `theoretical_quiz_attempts`, `users`).
* **Service Utilizado:** `teacherDashboardService.js` (Função `fetchTeacherDashboardData`).
* **Componente:** `TeacherPedagogicalDashboard.jsx`.
* **Formato Atual:** Array de objetos com as médias agregadas e tentativas recentes.
* **Colunas Exportáveis:** `Nome do Aluno`, `Email`, `Turma`, `Nome do Simulado`, `Tipo (Anatômico/Teórico)`, `Nota (Score)`, `Porcentagem`, `Tempo (Segundos)`, `Data de Conclusão`.

### B. Relatório de Alunos em Risco (Warning Report)
Permite ações de intervenção pedagógica preventiva.
* **Origem dos Dados:** Lógica de processamento de déficit do `TeacherDashboard`.
* **Service Utilizado:** `teacherDashboardService.js` (Bloco `calculateAtRiskStudents`).
* **Formato Atual:** Array de alunos com `risk_score` e `deficit_reasons`.
* **Colunas Exportáveis:** `Nome do Aluno`, `Email`, `Média Ponderada`, `Fator de Risco`, `Principais Deficiências`.

### C. Relatório de Heatmap Anatômico (Clinical Failures)
Auditoria sobre quais estruturas o corpo discente está com dificuldade de diagnosticar ou reconhecer.
* **Origem dos Dados:** Cruzamento profundo entre `anatomical_quiz_answers` e `models_3d`.
* **Service Utilizado:** `anatomicalHeatmapService.js` (Função `calculateHeatmapData`).
* **Componente:** `AnatomicalHeatmapPanel.jsx`.
* **Formato Atual:** Array classificado (`sorted`) por taxa de erro.
* **Colunas Exportáveis:** `Nome da Estrutura/Pino`, `Modelo 3D`, `Quantidade de Acertos`, `Quantidade de Erros`, `Total de Tentativas`, `Taxa de Falha (%)`.

### D. Relatório de ROI Institucional (Usage & Engagement)
A arma de renovação de contratos para o Diretor Financeiro.
* **Origem dos Dados:** `model_access_logs` (logs massivos) e `institutions`.
* **Service Utilizado:** `institutionRoiService.js` (Função `calculateInstitutionRoi`).
* **Componente:** `InstitutionRoiDashboard.jsx`.
* **Formato Atual:** Objeto com métricas globais consolidadas.
* **Colunas Exportáveis:** `Mês/Período`, `Turmas Ativas`, `Alunos Únicos Conectados`, `Total de Visualizações 3D`, `Total de Horas de Simulação`, `Estimativa de Cadáveres Economizados` (Métrica baseada em horas).

---

## 2. FORMATOS NECESSÁRIOS E APLICABILIDADE

* **CSV (Comma-Separated Values):** A prioridade absoluta. Sistemas como **Moodle, Blackboard e Canvas** aceitam tabelas CSV (ex: Matrícula e Nota) para importação imediata de graus. É rápido e gera zero travamentos no navegador.
* **XLSX (Excel):** Altamente recomendado para a "Secretaria" ou "Coordenação", permitindo uso imediato com filtros coloridos. Facilmente gerado no Frontend a partir do CSV ou JSON usando bibliotecas como `xlsx`.
* **PDF (Portable Document Format):** Necessário apenas em um futuro de Fase 5, para emissão de Relatórios Oficiais Assinados (Ex: "Ficha de Desempenho do Aluno" enviada por email). Neste momento, não tem viabilidade B2B para tabelas grandes.

---

## 3. RELATÓRIOS CRÍTICOS POR PERFIL

| Perfil Institucional | Relatório Crítico Exigido | Propósito Prático |
| :--- | :--- | :--- |
| **Professores** | Relatório de Notas (Gradebook) | Fechar a nota bimestral no sistema acadêmico oficial da Universidade sem digitar manualmente. |
| **Coordenadores** | Heatmap Anatômico e Ranking | Verificar se a metodologia de ensino está funcionando e cobrar professores caso a Turma B esteja falhando massivamente em "Músculos da Pelve". |
| **Reitoria / Comercial** | ROI e Horas Geradas | Provar aos mantenedores financeiros que a assinatura da Aeternum Atlas custa menos que o laboratório tradicional por hora/aluno. |

---

## 4. PRIORIZAÇÃO (ROADMAP 4C.1B)

* **[P1 - Obrigatório para Lançamento]** Botão de Exportação CSV para o **Relatório de Notas** no `Teacher Dashboard`. *Motivo: Evita o maior atrito com o usuário mais frequente.*
* **[P2 - Importante]** Exportação CSV do **Heatmap Anatômico**. *Motivo: Agrega valor acadêmico altíssimo às reuniões de coordenação pedagógica.*
* **[P3 - Desejável]** Exportação CSV/XLSX do **ROI Dashboard**. *Motivo: Reitores preferem gráficos visuais bonitos (Tirar um Print Screen da tela hoje já resolve), mas ter os números puros é um plus.*

---
**Documento validado sob auditoria estática. Dados já existem no estado da aplicação.**

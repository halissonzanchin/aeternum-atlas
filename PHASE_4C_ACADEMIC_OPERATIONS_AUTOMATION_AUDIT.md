# ACADEMIC OPERATIONS AUTOMATION AUDIT (Fase 4C)
**Auditoria e Plano de Automação Institucional - Aeternum Atlas**

Este relatório consolida a auditoria técnica e o plano de ação para automatizar o *backoffice* acadêmico (secretaria, professores e TI) da Aeternum Atlas. O objetivo é viabilizar operações massivas de Importação, Exportação e Estruturação Hierárquica para cenários B2B Enterprise.

---

## 1. DIAGNÓSTICO E PLANO DE IMPORTAÇÃO EM MASSA (CSV/XLSX)

### O Problema Atual:
Hoje, adicionar alunos depende de criação individual. Universidades operam listas com centenas de matrículas simultâneas por lote (Excel/CSV gerado pelo Moodle ou sistema de matrícula interno).

### Como o sistema comporta (Sem Migration):
A tabela `users` e `academic_class_students` têm a fundação necessária (`institution_id` e relação de pertencimento).

### Plano Técnico de Importação (Fase 4C.2):
1. **Frontend:** Criar componente de Drag & Drop no painel *Institution Admin* que aceite `.csv` e valide formato na hora (`Nome, Email, Matrícula`).
2. **Backend / Supabase Auth:** Aqui reside o maior risco técnico. Apenas clientes com chave secreta (`service_role`) podem criar usuários sem exigir login imediato.
   - **Solução Padrão:** O *Institution Admin* insere uma lista de emails via UI. A aplicação dispara convites (`supabase.auth.signInWithOtp` ou convite de email) e salva um *placeholder* do aluno na tabela `users` ou numa tabela temporária `pending_invites`.
   - **Solução Enterprise (Edge Function):** Fazer um *upload* do CSV e enviar para uma *Supabase Edge Function* que executa a `Admin API` para criar os alunos de forma instantânea e preencher a tabela de vínculo `academic_class_students`.

### Riscos Identificados:
* Duplicação de e-mails já existentes em outra instituição (conflito Multi-Tenant no Auth, que é global).
* Disparo excessivo de e-mails em lote, correndo o risco de acionar limites anti-spam do servidor de e-mail integrado ao Supabase.

---

## 2. DIAGNÓSTICO E PLANO DE EXPORTAÇÃO ACADÊMICA

### O Problema Atual:
O Professor visualiza o incrível Heatmap e as médias das provas, mas não consegue levar esse dado para a planilha de composição de nota sem redigitar tudo na mão.

### Plano Técnico de Exportação (Fase 4C.1):
1. **O que pode ser feito sem migration:** **TUDO.** 
2. Como toda a lógica de Analytics (como `teacherDashboardService.js` e `institutionRoiService.js`) já baixa e processa o JSON no navegador, a exportação é puramente *Client-Side*.
3. **Mecanismo:** Adicionar um botão "Exportar Relatório" que converte o JSON resultante do serviço em uma *string* CSV e chama `window.URL.createObjectURL(blob)` para download instantâneo.
4. **Tipos Mapeados:**
   - *Planilha de Notas:* (Aluno, Simulado, Nota, Status).
   - *Planilha de Engajamento/ROI:* (Turma, Tempo de Visualização, Qtd Acessos).

### Riscos Identificados:
* Nenhum risco no banco. Zero dependências.

---

## 3. ESTRUTURA ACADÊMICA HIERÁRQUICA (A Evolução do Banco)

### O Problema Atual:
Atualmente a plataforma salta da `institutions` direto para a `academic_classes`. Na vida real, o Reitor não gerencia 500 "turmas". Ele gerencia: **Campus → Cursos → Semestres → Disciplinas → Turmas**.

### Plano de Migração (Fase 4C.3 - Longo Prazo):
Será necessária a criação de uma hierarquia estrita:
1. `campuses` (id, institution_id, name)
2. `academic_courses` (id, campus_id, name)
3. `academic_semesters` (id, course_id, period)
4. `academic_disciplines` (id, semester_id, name)
5. `academic_classes` (A tabela atual precisará receber `discipline_id` para entrar na cadeia).

### Riscos Identificados:
* **Quebra de RLS e Queries Atuais:** Adicionar essa profundidade exigirá refatorar como o `institution_id` propaga pela árvore, já que todo o RLS foi pensado para pular direto de Instituição para Turma. Para contornar, o `institution_id` deve continuar como coluna secundária em *todas* essas tabelas.

---

## 4. RESUMO DE VIABILIDADE TÉCNICA

| Capacidade Operacional | Status Atual | Requer Migration? | Complexidade |
| :--- | :--- | :---: | :---: |
| Exportação CSV (Notas, ROI, Rankings) | Ausente | **NÃO** | Muito Baixa |
| Importação CSV de Alunos (Vinculação de Turma) | Ausente | Possivelmente (API) | Alta |
| Hierarquia de Cursos e Semestres | Ausente | **SIM** | Muito Alta |
| Mapeamento de Matrícula do Aluno (`registration_number`) | Ausente | **SIM** (Alterar `users`) | Baixa |

---

## 5. ROADMAP RECOMENDADO

### Fase 4C.1 — Exportação de Inteligência (Low Hanging Fruit)
* Implementação puramente no Frontend (sem mexer em RLS e DB).
* Botões de `Download CSV` nos Dashboards Pedagógicos e de ROI.
* **Impacto:** Gigantesco. Mata a principal objeção de venda (trabalho braçal do professor).

### Fase 4C.2 — Onboarding Institucional (Importador CSV)
* Criação de Interface de Upload para a Instituição.
* Adaptação para aceitar alunos, criar a senha via Supabase Auth e inseri-los automaticamente em `academic_class_students`.
* Possível adição do campo `registration_number` (Matrícula R.A.).

### Fase 4C.3 — Hierarquia Estrutural
* Criação DDL completa para `Campus`, `Courses`, `Semesters` e `Disciplines`. Refatoração da UI para suportar navegação profunda.

---
**Documento validado sob auditoria estática rigorosa. Nenhuma linha de código ou base de dados foi alterada.**

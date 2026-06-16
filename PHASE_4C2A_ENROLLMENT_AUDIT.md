# ENROLLMENT & ACADEMIC HIERARCHY AUDIT (Fase 4C.2A)
**Auditoria de Estruturação Acadêmica e Onboarding B2B - Aeternum Atlas**

Este documento detalha o mapeamento da arquitetura acadêmica atual do sistema e os impactos diretos na criação de um Importador Massivo de Alunos. 

---

## 1. MAPEAMENTO E ANÁLISE DA ESTRUTURA ATUAL

O banco de dados relacional hoje possui a seguinte profundidade acadêmica:
* `institutions`: Entidade global isolada (Inquilino principal do Multi-tenant).
* `academic_classes`: Turmas que pertencem diretamente à Instituição e um Professor.
* `users`: Cadastros globais que pertencem a uma Instituição.
* `academic_class_students`: Tabela de pivô vinculando o Aluno a uma Turma.
* `teacher_lesson_plans` / `teacher_study_guides`: Pertencem à Turma.

### Resposta: O que a estrutura atual suporta?
**APENAS TURMAS.** A Aeternum Atlas atual possui uma hierarquia "plana". Ela salta de `Universidade` para `Turma`. Não existe a figura sistêmica de `Campus`, `Curso`, `Disciplina` ou `Semestre`.

### Resposta: Uma universidade com 500 alunos e 5 cursos consegue operar hoje?
**Operacionalmente SIM, Gerencialmente NÃO.** 
O sistema suportaria a carga de acesso e os professores poderiam rodar os simulados criando turmas com nomes compostos (Ex: *"Medicina - Anatomia Geral - Semestre 1"*). No entanto, o Coordenador de Medicina jamais conseguirá puxar um relatório do "Curso de Medicina" como um todo. Todos os relatórios do sistema puxam dados ou do nível "Turma" ou da soma total da "Universidade". 

---

## 2. A IMPORTAÇÃO IDEAL B2B

Se formos atender uma instituição enterprise de forma profissional, a secretaria exigirá subir um único arquivo `matrículas_2026.csv` extraído do sistema legado deles, contendo:

* `Nome`
* `Email`
* `Matrícula (R.A.)`
* `Curso`
* `Disciplina`
* `Turma`
* `Semestre`

### O que precisa existir antes desse importador?
Para que o sistema engula e cruze as 7 colunas, a **Arquitetura Hierárquica Acadêmica completa (Tabelas DDL de cursos, disciplinas, etc)** deve estar criada no Supabase e perfeitamente amarrada. Além disso, a tabela `users` precisará receber o campo `registration_number` (Matrícula).

### O que pode ser importado imediatamente (Estado Atual)?
Podemos criar um importador "Básico" hoje que aceite: `Nome`, `Email`, `Nome da Turma`. O backend pode criar o *User* no Supabase Auth e matricular na turma.

### O que exigirá Migrations rigorosas?
1. `academic_courses` (Cursos)
2. `academic_disciplines` (Disciplinas)
3. `academic_semesters` (Semestres)
4. Alteração na tabela `users` para aceitar `registration_number`.
5. Modificação na tabela `academic_classes` para abandonar o vínculo raiz da `Institution` e herdar do `course_id` ou `discipline_id`.

---

## 3. SIMULAÇÃO DE ONBOARDING (Gargalo Fatal)

Cenário: Uma universidade B2B de Medicina entra hoje e quer subir 10 turmas e 500 alunos.

**Passo a passo atual:**
1. O admin da Aeternum cria a `Institution`.
2. O admin da Instituição logo entra e... **TRAVA.**
3. Como não há hierarquia, ele começa a criar 10 turmas manualmente no painel, repetindo nomes.
4. Para alocar os 500 alunos, como **NÃO TEMOS IMPORTADOR CSV**, ele precisará mandar o link de convite ou cadastrar manualmente 500 e-mails no sistema. Isso demora dias e exige suporte humano (*White-Glove*), minando a escalabilidade do software.

---

## 4. CONCLUSÃO DA AUDITORIA E RESPOSTAS ESTRATÉGICAS

**1. Podemos iniciar o importador agora?**
Podemos, mas seria o "Importador Plano" (Aluno direto na Turma). O grande perigo é o *retrabalho*.

**2. Precisamos de migrations antes?**
**SIM.** É altamente recomendado, caso vocês queiram abraçar o mercado de "Grandes Universidades". Se construirmos o importador agora, ele ficará cego para "Cursos e Disciplinas".

**3. Qual arquitetura acadêmica ideal para escalar para 10 universidades?**
O modelo hierárquico clássico em cascata:
`Institution` → `Campus` (Opcional) → `Course` → `Semester` → `Discipline` → `Academic_Class`.
Isso resolve para sempre o problema de organização institucional.

**4. Qual o risco de implementar o importador imediatamente?**
Se vocês importarem 5.000 alunos amanhã jogando todos no modelo "Plano" (sem curso), quando a DDL dos cursos for lançada na Fase 5, a Aeternum Atlas terá que migrar milhares de alunos em um banco de dados de produção. Os coordenadores terão que organizar essas 1.000 turmas órfãs arrastando-as manualmente para dentro dos novos cursos que criarem. O desgaste com o cliente será imenso.

**5. Qual a sequência recomendada?**
**A Sequência Segura (Enterprise Padrão):**
1. Projetar e rodar as Migrations do Supabase estabelecendo `Cursos` e `Disciplinas` (Fase 4D).
2. Adaptar o *Institution Admin Dashboard* para navegar nessa árvore.
3. Criar o Importador CSV Massivo para absorver essa hierarquia inteira em segundos.

**A Sequência Veloz (MVP Startup):**
1. Assumir que o produto lida apenas com "Turmas" temporariamente.
2. Construir o Importador CSV Básico (Apenas Nome, E-mail e Turma).
3. Adiar a dor da migração para quando houver clientes reclamando da desorganização visual.

*Status: Auditoria estática concluída com sucesso sem impacto em código ou banco de dados.*

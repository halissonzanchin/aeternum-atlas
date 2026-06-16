# ACADEMIC HIERARCHY FOUNDATION DESIGN (Fase 4D.0)
**Desenho de Banco de Dados para Operação Universitária em Larga Escala**

Este documento oficializa o desenho arquitetural do banco de dados (DDL) para suportar a complexidade de grandes ecossistemas universitários, garantindo uma transição fluida do modelo B2C (Alunos Soltos) para o B2B Enterprise (Cursos e Semestres).

---

## 1. NOVA ESTRUTURA DE TABELAS (O ALICERCE)

Foram desenhadas 4 novas tabelas, respeitando a linhagem do `institution_id` para garantir o isolamento *Multi-Tenant* (RLS).

| Tabela | Campos Principais | Finalidade |
| :--- | :--- | :--- |
| `academic_campuses` | `id`, `institution_id`, `name` | Permite que uma rede de faculdades divida os alunos por unidade física (Ex: Campus Sul, Campus Centro). |
| `academic_courses` | `id`, `institution_id`, `campus_id`, `name` | Agrupa os alunos pelo Curso fim (Ex: Medicina, Fisioterapia, Enfermagem). |
| `academic_terms` | `id`, `institution_id`, `name`, `start_date`, `end_date` | Controle temporal. Permite fechar turmas antigas e iniciar o "Semestre 2026.1". |
| `academic_subjects` | `id`, `institution_id`, `course_id`, `name` | As disciplinas que compõem a matriz curricular (Ex: Anatomia Topográfica I). |

---

## 2. COMPATIBILIDADE RETROATIVA (ZERO DOWN-TIME)

Para evitar que o sistema atual quebre, foi adotada a estratégia de **Migração de Extensão Suave**. A tabela existente `academic_classes` (Turmas) não sofreu alterações destrutivas. 

**Como foi feito:**
A tabela `academic_classes` recebeu as quatro novas chaves estrangeiras (`campus_id`, `course_id`, `term_id`, `subject_id`), porém **todas foram marcadas como Nullable** (Opcionais).

* **Impacto nos Dashboards atuais:** Zero. Os relatórios continuam consultando as turmas baseadas na instituição, como sempre fizeram.
* **Impacto no Importador B2B Futuro:** Total. O *Importador CSV* será capaz de preencher esses campos e classificar os novos alunos perfeitamente, enquanto turmas velhas criadas manualmente ficarão ali sem curso até que um coordenador decida associá-las.

---

## 3. ÍNDICES DE PERFORMANCE E ROW LEVEL SECURITY (RLS)

* **Índices de Relacionamento:** O script garante que todo relacionamento chave-estrangeira seja coberto por um `INDEX`. Isso garante que quando um Coordenador clicar no botão "Filtrar por Medicina", a query que varre os milhares de alunos não congele o banco.
* **Políticas RLS:** Todas as tabelas têm o RLS ativado e seguem o princípio máximo da plataforma: *Isolation by JWT*. O coordenador do "Hospital A" tem uma apólice de `SELECT` blindada por `institution_id = auth.jwt()->>'institution_id'`, tornando fisicamente impossível que ele acesse os cursos da "Faculdade B".

---

## 4. ESTRATÉGIA DE ROLLBACK E RISCOS

* **Risco da Migration:** Muito Baixo. É uma inserção DDL (Apenas `CREATE TABLE` e `ADD COLUMN IF NOT EXISTS`). Não existe comando `DROP`, `ALTER TYPE` ou `DELETE`.
* **Rollback:** Caso algum erro não mapeado aconteça no meio da execução do Supabase SQL, um script contendo quatro `DROP TABLE` nas tabelas recém criadas e o `ALTER TABLE DROP COLUMN` na `academic_classes` restaura o banco de volta ao que era em menos de 1 segundo. Nenhuma *row* (linha de dados de aluno) será afetada.

---

## 5. RESPOSTA DE ESCALABILIDADE

**Essa estrutura suporta 10 universidades, múltiplos cursos e milhares de alunos?**

**Absolutamente SIM.**
O padrão implementado segue a Normalização de Banco de Dados Acadêmicos usada em gigantes como *Banner* e *Workday*. Ele é feito para suportar relações de *N* para *N* na ponta (entre turmas e alunos), enquanto mantém a hierarquia rigorosa na raiz (Instituição). 

Com essa estrutura injetada na base (Fase 4D), a Aeternum Atlas estará com a fundação perfeita para receber o **Academic Import Engine** (Fase 4C.2) no Frontend. O Importador vai simplesmente mapear o *header* CSV `Curso` com a tabela `academic_courses` e criar tudo sozinho e organizado!

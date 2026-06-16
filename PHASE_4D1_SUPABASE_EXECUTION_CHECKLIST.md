# SUPABASE EXECUTION CHECKLIST (Fase 4D.1)
**Auditoria de Segurança Pré-Migração**

Este relatório estabelece os parâmetros de segurança e os checklists operacionais antes da execução da DDL (`phase_4d_academic_hierarchy.sql`) no banco de dados de produção do Supabase.

---

## 1. AUDITORIA DE COMPATIBILIDADE

**1. Existência das Tabelas Referenciadas:**
* `institutions`: **Confirmado**. Tabela raiz existe.
* `academic_classes`: **Confirmado**. Tabela de turmas existe.
* `users`: **Confirmado**. 

**2. Validação das Foreign Keys:**
As *Foreign Keys* da nova migração obedecem a uma ordem estrita de criação para não gerar erro de dependência:
1. `academic_campuses` vincula-se à `institutions` existente.
2. `academic_courses` vincula-se à `institutions` e `academic_campuses`.
3. `academic_terms` vincula-se à `institutions`.
4. `academic_subjects` vincula-se à `institutions` e `academic_courses`.
5. Alteração final: `academic_classes` vincula-se a todas as tabelas acima.

**3. Ausência de Comandos Destrutivos:**
* `CREATE TABLE IF NOT EXISTS`: ✅ Confirmado.
* `ADD COLUMN IF NOT EXISTS`: ✅ Confirmado.
* Ausência total de comandos `DROP`, `DELETE`, `TRUNCATE` ou `ALTER TYPE`: ✅ Confirmado. Nenhuma deleção de dados é possível através deste script.

---

## 2. COMPATIBILIDADE DE BACKEND (SERVIÇOS)

* **`teacherDashboardService`**: Continua plenamente funcional. As requisições filtram por `institution_id` e buscam `academic_classes` pelo nome e ID raiz, que não foi alterado. O *JOIN* novo incluído na Fase 4C.1D continuará rodando.
* **`academicClassService` / Dashboards Institucionais**: 100% seguros. Nenhuma coluna que os dashboards usam (como `name` ou `created_at` na tabela de turmas) foi modificada. As turmas antigas terão os novos campos marcados nativamente como `NULL`, sendo ignorados pelo frontend antigo.

---

## 3. PLANO DE EXECUÇÃO EXATO NO SUPABASE

A execução deverá ser feita integralmente copiando o conteúdo de `docs/migrations/phase_4d_academic_hierarchy.sql` para o **SQL Editor** do painel do Supabase.

### Possíveis Erros Previstos:
1. **Erro de FK (Foreign Key):** Baixa probabilidade, já que o script cuida de criar as tabelas raízes (Campi) antes das filhas (Cursos).
2. **Erro de RLS:** As políticas definidas (`campuses_inst_isolation`, etc.) podem conflitar caso já exista acidentalmente uma política com esse exato nome, mas por serem tabelas virgens, a probabilidade é nula.
3. **Conflito de Dados:** Nulo. Nenhuma *row* (linha) sofrerá `UPDATE`.

---

## 4. ESTRATÉGIA DE ROLLBACK (EMERGÊNCIA)

Se a inserção causar anomalias ou o banco entrar em *lock*, o plano de reversão instantânea (Rollback Script) que deverá ser executado é:

```sql
-- 1. Remover colunas inseridas na tabela atual (Evita quebra)
ALTER TABLE public.academic_classes 
  DROP COLUMN IF EXISTS campus_id,
  DROP COLUMN IF EXISTS course_id,
  DROP COLUMN IF EXISTS term_id,
  DROP COLUMN IF EXISTS subject_id;

-- 2. Derrubar as tabelas criadas em ordem inversa
DROP TABLE IF EXISTS public.academic_subjects CASCADE;
DROP TABLE IF EXISTS public.academic_terms CASCADE;
DROP TABLE IF EXISTS public.academic_courses CASCADE;
DROP TABLE IF EXISTS public.academic_campuses CASCADE;
```
*(Tempo estimado de recuperação: < 3 segundos)*.

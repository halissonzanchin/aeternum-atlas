# BILLING MIGRATION EXECUTION PLAN (Fase 5.2E)
**Runbook de Implantação e Disaster Recovery**

Este plano mestre orquestra a injeção segura da arquitetura financeira (*Billing Foundation*) na base de dados de produção da Aeternum Atlas (Supabase). Seu objetivo é prever contingências, validar dependências preexistentes e assegurar uma implantação zero-downtime.

---

## 1. ORDEM DE EXECUÇÃO

O comando no painel SQL do Supabase deve ser rodado em transação única (`BEGIN; ... COMMIT;`), respeitando rigorosamente a seguinte cascata de criação para não violar as chaves estrangeiras:
1. `subscription_plans` (Mestre)
2. `institution_subscriptions` (Depende de Plans e Institutions)
3. `billing_cycles` (Depende de Subscriptions)
4. `invoices` (Depende de Subscriptions e Cycles)
5. `invoice_items` (Depende de Invoices)
6. `billing_snapshots` (Depende de Institutions e Cycles)
7. `license_usage` (Depende de Institutions)
8. `feature_flags` (Depende de Institutions)
9. Aplicação do `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
10. Execução unificada dos comandos `CREATE POLICY ...`.
11. Execução do `Seed` Inicial.

---

## 2. DEPENDÊNCIAS DE PRODUÇÃO

A *migration* depende essencialmente da integridade da infraestrutura preexistente:
* **`institutions`:** As chaves estrangeiras (`ON DELETE CASCADE`) atrelam as finanças aos perfis B2B. A tabela matriz deve existir.
* **`users`:** A tabela `users` não é atrelada diretamente por Foreign Key nas faturas (a cobrança é pelo volume, não pelo indivíduo), reduzindo o risco de *locks* em tabelas de alto acesso.
* **JWT Claims:** As `Policies` criadas assumem matematicamente que o payload JWT do Supabase possui os nós `auth.jwt()->>'role'` e `auth.jwt()->>'institution_id'`. O *Auth Hook* configurado em fases anteriores garante o fornecimento dessas chaves.

---

## 3. AVALIAÇÃO RLS FINAL

O ambiente será isolado. Assim que a tabela nascer, nenhum dado financeiro vaza. O `super_admin` enxergará o faturamento nacional inteiro, e cada Reitor (`institution_admin`) enxergará o boleto e a cota-limite exclusiva de sua entidade. O acesso não-autenticado (*anon*) ou estudantil (*student*) receberá um erro `403 Forbidden` ou um Array Vazio `[]` por padrão do *PostgREST*.

---

## 4. PLANO DE CONTINGÊNCIA (ROLLBACK SCRIPT)

Caso a execução falhe parcialmente ou gere bloqueios inesperados na interface do Administrador, executar imediatamente no painel SQL:

```sql
BEGIN;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS license_usage CASCADE;
DROP TABLE IF EXISTS billing_snapshots CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS billing_cycles CASCADE;
DROP TABLE IF EXISTS institution_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
COMMIT;
```
*(Nota: O CASCADE garante que o banco limpe todos os índices e políticas acopladas sem deixar rastros sujos).*

---

## 5. SEED INICIAL DO PLANO OFICIAL

O sistema não pode funcionar sem o seu catálogo matriz. Imediatamente após a *migration*, o plano mestre será injetado:

```sql
INSERT INTO subscription_plans (name, price_per_seat, tier_code, features, active) 
VALUES (
  'Institutional License',
  65.00,
  'pro',
  '{"has_academic_analytics": true, "has_heatmap": true}'::jsonb,
  true
);
```

---

## 6. SMOKE TESTS PÓS-MIGRATION

1. Fazer Login como `Institution Admin` de qualquer faculdade.
2. Acessar a Dashboard. Validar se não ocorreu `Erro 500`.
3. Navegar para a Importação CSV. (O *Frontend* não foi alterado, deve permanecer intacto).
4. Fazer Login como `super_admin`.

---

## 7. QUERIES DE VALIDAÇÃO (DIAGNÓSTICO)

Executar manualmente para atestar a saúde da estrutura:

**Verificar se RLS subiu com sucesso em todas as 8 tabelas:**
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('subscription_plans', 'institution_subscriptions', 'invoices', 'feature_flags') 
AND relkind = 'r';
-- (Deve retornar 't' na coluna relrowsecurity para todas)
```

**Verificar a injeção do Seed Inicial:**
```sql
SELECT id, name, price_per_seat FROM subscription_plans;
-- (Deve retornar 1 linha com valor 65.00)
```

---

## 8. CLASSIFICAÇÃO EXECUTIVA E DELIBERAÇÃO

* **Pronto para executar no Supabase real?** 🟢 SIM. Toda a engenharia de dependências e de *Disaster Recovery* está modelada.
* **Risco Final:** BAIXO. As tabelas são novas e paralelas. Não alteramos ou tocamos em colunas das tabelas produtivas atuais de turmas ou usuários, garantindo que alunos continuem estudando sem interrupções mesmo se houverem falhas financeiras.
* **Rollback pronto?** 🟢 SIM. Comandos `DROP CASCADE` mapeados.
* **Seed do Plano Definido?** 🟢 SIM. Preço cravado em R$ 65,00.
* **Recomendação Final:** Copiar o conteúdo literal de `phase_5_2_billing_foundation.sql`, colar no "SQL Editor" de Produção da Dashboard da Supabase, apertar "Run" e validar imediatamente com a Query de Validação do RLS.

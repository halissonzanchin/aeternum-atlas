# BILLING MIGRATION SAFETY AUDIT (Fase 5.2C)
**Auditoria de Segurança do Motor Financeiro SQL**

Esta auditoria afere a robustez técnica, os vetores de vazamento de dados e o risco de corrupção do *schema* de produção relacionado à estrutura financeira proposta em `docs/migrations/phase_5_2_billing_foundation.sql`.

---

## 1. ANÁLISE DO CÓDIGO (SAFEGUARDS)

A sintaxe estrutural do código atende perfeitamente às diretrizes defensivas recomendadas para migrações contínuas em *Supabase*:
* ✅ **Uso Condicional:** O arquivo utiliza `CREATE TABLE IF NOT EXISTS` em todas as passagens.
* ✅ **Ausência de Comandos Destrutivos:** A migração **não** possui nenhum comando de `DROP TABLE`, `DELETE`, `TRUNCATE`, `ALTER TABLE DROP COLUMN` ou `UPDATE` global. A estrutura atual não toca nem apaga registros das tabelas preexistentes (`users`, `institutions`, `academic_classes`).
* ✅ **Foreign Keys (Cascata):** Todos os vínculos com a tabela `institutions` possuem a cláusula `ON DELETE CASCADE`. Se a universidade for deletada pelo `super_admin`, todo o histórico de cobrança e subscrições desaparece atomicamente, sem deixar registros órfãos pesando o banco.
* ✅ **Índices:** Um índice otimizado foi incluído (`idx_inst_subscriptions_status`) para garantir pesquisas hiper-rápidas no ciclo de conferência diária B2B.

---

## 2. COMPATIBILIDADE ESTRUTURAL E DE NEGÓCIOS

* **Institutions & Users:** O acoplamento utiliza os `UUIDs` corretos da tabela genérica de instituições. O uso se faz no nível de faculdade, isolando perfeitamente a cobrança do aluno (que é a base de mensuração).
* **Soft Block e True-Up:** Compatibilidade garantida. A segregação inteligente entre `institution_subscriptions.licensed_students_count` (Cota Limite) e `license_usage` (Fato Gerador Real Diário) constrói exatamente a ponte lógica necessária para gerar cobranças excedentes (`invoice_items`) em fim de mês sem barrar os alunos na recepção.
* **Gateways Híbridos (Stripe/Asaas):** Plena harmonia sistêmica. As colunas guardam os IDs externos simultaneamente, possibilitando por exemplo, a conversão de um cliente da América Latina pelo Stripe e outro Brasileiro pelo Asaas na mesma infraestrutura B2B unificada da Aeternum.

---

## 3. AVALIAÇÃO DE SEGURANÇA E RLS (ROW LEVEL SECURITY)

⚠️ **ALERTA CRÍTICO ENCONTRADO!**
O script arquitetado na Fase 5.2B focou primorosamente na *Modelagem de Tabelas* (Data Definition), **mas não contém a malha de segurança**.

**Riscos no Schema Atual:**
Se essa *migration* for inserida no Supabase crua da maneira que está, as 8 tabelas financeiras nascerão acessíveis e "Públicas" na API (*PostgREST*), resultando em vazamento imediato de valores de fatura caso qualquer aluno logado faça um *GET* simples.

**O que precisa ser implementado na Migration para aprovação final:**
1. Inserir `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` em todas as 8 tabelas.
2. Criar Política 1: `super_admin` possui `ALL`.
3. Criar Política 2: `institution_admin` possui apenas `SELECT` usando `auth.jwt() ->> institution_id`. Nunca devem poder fazer *UPDATE* nas faturas, isso mataria a auditabilidade e permitiria desvio de pagamentos.
4. Criar Política 3: O acesso do `student` e `teacher` é sumariamente nulo (Nenhuma política de *SELECT*).

---

## 4. AVALIAÇÃO DO `FEATURE_FLAGS`

A tabela isolada `feature_flags` serve hoje como um cofre confiável, fácil de ser alterado por suporte manual (Dashboard).
**No entanto, existem pesados riscos de escalabilidade:** Toda vez que um Reitor abrir o Heatmap no *Frontend*, a aplicação faria uma requisição `fetch` de RTT na nuvem para perguntar ao Supabase: "Essa faculdade pagou pelo Heatmap?".

* **Recomendação Definitiva de Escalabilidade:** Manter a tabela `feature_flags` como *Single Source of Truth* apenas para o Backend (Edge Functions).
Para o *Frontend*, a partir do momento em que a fatura é fechada e a assinatura habilitada, uma *Edge Function* deve injetar (escrever) essas *flags* na sessão estática `app_metadata` de todos os JWTs dos professores no Supabase Auth. Assim, o *React* decidirá se renderiza o *Heatmap* apenas lendo o *Token Local*, a um custo técnico de 0 milissegundos e 0 requisições extras ao banco.

---

## 5. CLASSIFICAÇÃO EXECUTIVA E DELIBERAÇÕES

* **Migration Segura?** 🔴 NÃO (Segura na modelagem, Insegura pela falta de blindagem RLS).
* **Risco Inicial:** ALTO (Falta de isolamento de API causaria quebra de sigilo financeiro).
* **Precisa Correção antes da Execução?** 🟢 SIM. Obrigatório adicionar `ENABLE ROW LEVEL SECURITY` e as Policies adequadas.
* **Pronta para execução manual no Supabase?** 🔴 NÃO.

**Recomendação Final do Alto-Comando:**
O banco de dados B2B não pode nascer sem armaduras. A ordem estratégica imediata (Fase 5.2D) deve ser autorizar a injeção do pacote de políticas `RLS Policies` no final do script `phase_5_2_billing_foundation.sql`, amarrando o isolamento *Tenant* estrito e trancando as faturas antes do *deploy* em produção.

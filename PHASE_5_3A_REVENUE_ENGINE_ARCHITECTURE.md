# REVENUE ENGINE ARCHITECTURE (Fase 5.3A)
**Auditoria de Arquitetura do Motor de Receita B2B**

Este documento projeta o núcleo lógico (*Revenue Engine*) responsável por orquestrar a cobrança automática da Aeternum Atlas. Ele define como o sistema traduzirá matrículas de alunos em faturas reais para reitorias, suportando a infraestrutura financeira previamente estabelecida.

---

## 1. O CÁLCULO DE ALUNOS FATURÁVEIS E A FONTE OFICIAL

* **Fonte Oficial da Contagem:** A tabela `users`, cruzada nativamente com o `institution_id` e filtrada onde a `role = 'student'`.
* **Mecânica de Dupla Contagem (Resolução):** Na Aeternum Atlas B2B, a unidade de cobrança é a "Cabeça (Aluno)". O coordenador pode matricular o aluno "João" em 5 disciplinas, 3 turmas diferentes e 2 campi. Como a contagem é feita rodando `SELECT COUNT(DISTINCT id) FROM users WHERE role='student' AND institution_id = X`, o João jamais será cobrado duas vezes.
* **Alunos Ativos vs Faturáveis:** O faturamento ignora se o aluno logou ou fez simulados. Se o e-mail dele existe na base associado à UPE, a universidade paga R$ 65,00 por ele. Alunos ativos, horas de estudo e acertos servem única e exclusivamente para a Dashboard de ROI do Reitor (para justificar a renovação anual de contrato).

---

## 2. A MATEMÁTICA DO TRUE-UP E SOFT BLOCK

1. **`contracted_licenses`:** Salvo na coluna `institution_subscriptions.licensed_students_count` (Ex: 700).
2. **`consumed_licenses`:** O `COUNT` exato de alunos na tabela `users` no dia do fechamento (Ex: 800).
3. **`excess_licenses`:** A fórmula de faturamento: `GREATEST(0, consumed_licenses - contracted_licenses)` (Ex: 100).

**O Soft Block:** Durante o mês letivo de Junho, a faculdade pode fazer o upload de 100 novos alunos pelo *CSV Importer*. O banco não emite alertas de bloqueio. Os alunos acessam imediatamente e começam a usar a anatomia 3D.
**O True-Up:** Na virada do ciclo de faturamento mensal, a inteligência lê o excesso acumulado (100 alunos) e adiciona os R$ 6.500,00 na próxima fatura.

---

## 3. GERAÇÃO AUTOMÁTICA DE FATURAS E SNAPSHOTS

A automação dependerá de um *CRON Job* (ex: via *pg_cron* ou Edge Function disparada por agendador do Supabase) configurado para rodar a cada 24 horas (`00:00 UTC`).

O robô executará o seguinte laço para cada Instituição Ativa:
1. Verifica se a data atual superou o `end_date` da tabela `billing_cycles` que está `status = 'open'`.
2. Se superou, ele:
   * Dispara a *Query* de contagem oficial na tabela `users`.
   * Insere um registro congelado na `billing_snapshots` (registrando quantas cabeças e quantas horas estudadas existiam neste exato mês para auditoria).
   * Insere um registro na `invoices` cobrando a assinatura básica mensal e calculando as datas de vencimento padrão (ex: +5 dias).
   * Insere 1 linha na `invoice_items` cobrando o valor base contratado.
   * Insere 1 linha extra na `invoice_items` cobrando `excess_licenses * 65.00` (se houver *True-Up*).
   * Atualiza o ciclo anterior para `closed` e gera um novo ciclo `open` para o próximo mês em `billing_cycles`.

---

## 4. ESCALABILIDADE (MÚLTIPLOS CAMPI, RENOVAÇÃO E EXPANSÃO)

* **Multi-Campus e Multi-Curso (UPE):** Irrelevante para o gateway de pagamento. Toda a teia complexa de departamentos acadêmicos reporta ao UUID matriz do `institution_id`. Logo, envia-se um boleto único massivo de R$ 52.000,00 para o Reitor da matriz (UPE).
* **Expansão de Licenças (Upsell):** Se o reitor solicitar formalmente um "Upgrade de Plano" de 700 para 1500 alunos fixos, o *Super Admin* apenas altera o `licensed_students_count` na tabela de subscrições. O banco passará a contar as excedentes a partir do teto de 1500 automaticamente.
* **Renovação Anual vs Mensal:** O contrato dita o modelo. Em contratos anuais, o `billing_cycle` fecha anualmente ou mensalmente a valor R$ 0,00 da base, e cobra mensalmente *somente* os *True-Ups* excedentes identificados.

---

## 5. CLASSIFICAÇÃO EXECUTIVA E DELIBERAÇÕES FINAIS

O projeto arquitetural do *Revenue Engine* demonstra ser logicamente à prova de fraudes e extremamente aderente à realidade do mercado SaaS Enterprise. 

* **Arquitetura pronta:** SIM.
* **Fonte oficial dos alunos:** Tabela `users` (`WHERE role='student' AND institution_id=X`).
* **Risco de dupla cobrança:** NÃO (garantido pelo agrupamento de chaves primárias `DISTINCT`).
* **Compatível com Soft Block:** SIM (Excedentes circulam livremente até a virada de mês).
* **Compatível com True-Up:** SIM (Apurado cirurgicamente como item adicional em fatura).
* **Pronta para Stripe:** SIM. O cronjob mapeará o *webhook* para criar o item de linha no Stripe.
* **Pronta para Asaas:** SIM. Mesma operação, gerando cobranças via Pix e Boleto simultâneos.

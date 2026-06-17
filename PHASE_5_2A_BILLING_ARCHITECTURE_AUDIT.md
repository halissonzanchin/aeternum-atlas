# BILLING ARCHITECTURE AUDIT (Fase 5.2A)
**Engenharia Financeira, Precificação e Arquitetura de Contratos B2B**

Este documento arquiteta a infraestrutura comercial e lógica para monetização da Aeternum Atlas, validando a sustentabilidade financeira da operação B2B e definindo as regras de negócio para a próxima etapa técnica (Fase 5.2B).

---

## 1. MODELO CONTRATUAL

* **Como modelar contratos mensais?** Via ciclo recorrente. O sistema fatura automaticamente o número total de licenças de alunos ativas no "Dia de Fechamento" multiplicado pela taxa aplicável.
* **Como modelar contratos anuais?** Cota pré-paga fixada por 12 meses. O faturamento é adiantado (com desconto no valor/aluno) e o controle sistêmico apenas valida se a universidade não ultrapassou a cota comprada (True-Up).
* **Como modelar renovação automática?** Baseada em *Webhooks* do gateway (ex: Stripe/Asaas). Ao detectar o evento `invoice.paid`, a data de vencimento na tabela `institution_subscriptions` será empurrada para `now() + 1 month`.
* **Como modelar reajustes futuros?** Planos e Preços não podem ser editados na mesma linha do banco. Novos preços geram uma nova entrada na tabela `subscription_plans`. Contratos vigentes ficam atrelados ao ID do plano velho (Garantia de Preço Antigo/Grandfathering), respeitando o reajuste apenas via renegociação da *Subscription*.

---

## 2. PLANOS COMERCIAIS E PRECIFICAÇÃO (R$ 65 Base)

**Estratégia Escolhida:** Desconto Progressivo por Volume. Preço único para gigantes gera forte fricção. O volume dilui o custo do servidor.

* **STARTER (Até 300 alunos): R$ 65/aluno**
  * Benefícios: Anatomia 3D, Simulados Base. Dashboards: Teacher Panel. Suporte: Ticket email (48h).
* **PROFESSIONAL (Até 1.000 alunos): R$ 55/aluno**
  * Benefícios: Tudo do Starter + Relatórios. Dashboards: Heatmaps + Academic Analytics. Suporte: Prioridade 24h. Onboarding: CSV com Edge Function Automático.
* **ENTERPRISE (+1.000 alunos): R$ 45/aluno**
  * Benefícios: Premium. Dashboards: Institution ROI. Suporte: Account Manager Dedicado. SLA garantido.

---

## 3. PROJEÇÃO FINANCEIRA B2B (MÉTRICAS SaaS)

Cálculo baseado no modelo progressivo (MRR = Receita Mensal / ARR = Receita Anual).

| Porte Universitário | Licenças (Alunos) | Preço/Mês | Receita Mensal (MRR) | Receita Anualizada (ARR) |
| :--- | :--- | :--- | :--- | :--- |
| **Clínica/Escola Técnica** | 100 alunos | R$ 65,00 | **R$ 6.500** | **R$ 78.000** |
| **Polo Universitário Pequeno**| 300 alunos | R$ 65,00 | **R$ 19.500** | **R$ 234.000** |
| **Faculdade Média** | 500 alunos | R$ 55,00 | **R$ 27.500** | **R$ 330.000** |
| **Centro Universitário Grande**| 1.000 alunos | R$ 55,00 | **R$ 55.000** | **R$ 660.000** |
| **Rede Universitária (Ex: PUC)**| 3.000 alunos | R$ 45,00 | **R$ 135.000** | **R$ 1.620.000** |

**Visão Global de Tração:**
* **1 Universidade Média (1k):** ~R$ 660 mil / ano
* **10 Universidades Médias:** ~R$ 6.6 Milhões / ano
* **50 Universidades Médias:** **~R$ 33 Milhões / ano**

---

## 4. ESTRUTURA DE BANCO DE DADOS (ARQUITETURA FUTURA)

As seguintes tabelas construirão o esqueleto financeiro do Supabase na Fase 5.2B:

1. `subscription_plans`: Catálogo de produtos (Starter, Pro, Enterprise) e preços da tabela.
2. `institution_subscriptions`: O coração B2B. Atesta qual faculdade assinou qual plano, validade, e o `status` (ativo, inadimplente, cancelado).
3. `billing_cycles`: Define a cadência (anual, mensal).
4. `billing_snapshots`: (Explicado na Etapa 6).
5. `invoices`: A fatura real gerada. (Data de emissão, data de pagamento, URL do PDF).
6. `payments`: Histórico real de transferências via PIX/Boleto.
7. `license_usage`: Medição diária via *CRON Job* de quantos alunos aquela universidade está utilizando vs o contratado.
8. `feature_flags`: Controle de quais funcionalidades da plataforma aquela universidade liberou (Ex: `has_roi_dashboard: boolean`).

---

## 5. CONTROLE DE LICENÇAS E LIMITE DE ALUNOS

**Cenário:** Instituição tem 100 licenças pagas. Tenta colocar o 101º.
**Melhor Prática SaaS Enterprise:** **Bloqueio Suave (Soft Block) com True-Up Billing.**
* Bloqueio Rígido na hora de matricular alunos fura a adoção em massa e gera tickets furiosos de Coordenadores irritados.
* A Aeternum Atlas deixará a importação passar (o aluno 101 entra e estuda). A plataforma dispara um e-mail silencioso ao setor financeiro da universidade avisando o estouro do *Threshold* e cobrando o "excedente" (True-up) acrescido na fatura do mês seguinte automaticamente.

---

## 6. BILLING SNAPSHOT (AUDITORIA E ROI)

A entidade `billing_snapshots` é uma fotografia tirada na meia-noite do fechamento de cada fatura. Ela preserva a prova irrefutável do serviço prestado:
* `licensed_students_count`: Quantos alunos estavam na base no dia D.
* `active_students_count`: Quantos efetivamente abriram a plataforma (Adoção real).
* `total_hours_studied`: Consumo.
* `invoice_amount`: Valor exato fechado.
**Finalidade:** Quando o Reitor contestar o valor anual da renovação, a Aeternum enviará um PDF contendo o "Relatório de 12 Snapshots", provando mês a mês as métricas de engajamento e a economia bruta, tornando o ROI impossível de refutar.

---

## 7. GATEWAY DE PAGAMENTO (COBRANÇA)

* **Asaas:** A melhor API para gestão de boletos institucionais e PIX no Brasil. O suporte B2B brasileiro corporativo não gosta de cadastrar "Cartão de Crédito com limite de R$ 50.000". Eles preferem Boleto Faturado ou NFe.
* **Stripe:** Imbatível na engenharia (Subscrições e Recorrência). Melhor solução para expansão LATAM e global.
**Veredito:** **Stripe** como motor global base de *Subscriptions* (Cartão e Invoice B2B automático), ativando **Asaas** no Brasil caso o fluxo exija Nota Fiscal de Serviço (NFS-e) obrigatória em massa.

---

## 8. POLÍTICA DE INADIMPLÊNCIA (CHURN E COBRANÇA)

Para blindar fluxo de caixa B2B:
* **7 Dias:** (Warning) Banner amarelo apenas na Dashboard do `super_admin` e `institution_admin`. Nenhuma interrupção para alunos ou professores.
* **30 Dias:** (Soft Lock) Banner vermelho "Fatura Atrasada". O administrador não consegue cadastrar novas planilhas/turmas, mas alunos existentes continuam assistindo para não quebrar a matriz da grade curricular federal do MEC no meio do semestre.
* **60 Dias:** (Hard Lock) Os visualizadores 3D e simulados de toda a faculdade são substituídos por uma tela de *"Restrição Financeira"*. A retenção de dados da faculdade no banco de dados se mantém ativa (Jamais apagaremos notas ou logs, apenas blindamos a UI).

---

## 9. ENTERPRISE READINESS (GARGALOS SISTÊMICOS)

A arquitetura suporta 1, 10 ou 100 universidades sem suar?
* **Sim.** A separação *Tenant* e o uso atômico de *Row Level Security* (RLS) garante fragmentação impecável.
* **Gargalos Futuros (Para vigiar na AWS):** O crescimento das tabelas de telemetria analítica (`academic_analytics` e logs granulares do Heatmap) consumirão Storage na nuvem gigantescamente à medida que 50.000 alunos multiplicarem a geração diária. Futuramente (2 a 3 anos), será necessário mover as métricas frias de Billing Snapshot para um "Data Warehouse" estático para economizar espaço PostgreSQL do Supabase.

---

## 10. CLASSIFICAÇÃO EXECUTIVA FINAL

* **Arquitetura financeira pronta (Teoricamente)?** 🟢 SIM. Completamente modelada para escalabilidade infinita em B2B Edu.
* **Melhor modelo comercial?** "Assinatura Progressiva por Aluno" (Diluição em volume).
* **Melhor Gateway?** **Stripe** para infraestrutura lógica.
* **Melhor Estratégia de Licenciamento?** *Soft-Block com True-Up* Mensal.
* **Principais Riscos?** Perder assinantes por rejeição de integração na emissão de nota fiscal brasileira sem Asaas/NFe automatizado no futuro.
* **Próxima Fase Técnica Recomendada?** Implementação Técnica da Fase 5.2B: Programar as migrações (SQL) do *Billing Schema* (Tabelas de *Subscriptions*, *Invoices* e *Planos*) e configurar a *RLS* protetora do Supabase.

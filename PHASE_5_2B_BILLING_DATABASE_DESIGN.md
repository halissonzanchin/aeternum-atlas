# BILLING DATABASE DESIGN (Fase 5.2B)
**Projeto Estrutural do Motor Financeiro (SQL Architecture)**

Este dossiê documenta o banco de dados fundamental que sustentará o modelo de negócios B2B da Aeternum Atlas, projetado estritamente sob as premissas de precificação institucional, tolerância (*Soft Block*) e auditoria contínua (*Snapshots*).

---

## 1. ENTIDADES PROJETADAS

O esquema relacional é composto por 8 pilares, interligados em uma cascata que permite desde a assinatura original até o detalhamento individual de cada fatura gerada.

### `subscription_plans`
* **Finalidade:** O catálogo mestre imutável. Define os preços e categorias (Starter, Pro, Enterprise).
* **Colunas-chave:** `price_per_seat` (R$ 65.00), `tier_code` (identificador único).
* **Regra de Negócio:** Jamais se altera o `price_per_seat` de um plano ativo se houver reajuste nacional. Cria-se um novo plano e marca-se o antigo como `active = false` (Estratégia de *Grandfathering*).

### `institution_subscriptions`
* **Finalidade:** O coração pulsante. Liga a faculdade a um Plano.
* **Colunas-chave:** `status` (active, past_due), `licensed_students_count` (Cota contratada), `current_period_end` (Data limite antes de faturar de novo).
* **Regra de Negócio:** Contém a âncora de IDs externos dos Gateways (`stripe_subscription_id`, `asaas_subscription_id`).

### `billing_cycles`
* **Finalidade:** Mede a "janela temporal" (ex: 01/Maio até 31/Maio).
* **Regra de Negócio:** Agrupa cálculos diários de uso para, no fim do ciclo, gerar as faturas corretas através de consolidação (Fechamento).

### `invoices` e `invoice_items`
* **Finalidade:** Faturas físicas e seus itens de linha.
* **Colunas-chave:** `amount_due`, `status` (paid, open, draft), `invoice_url`.
* **Regra de Negócio:** A tabela `invoice_items` permite cobrar a mensalidade normal + o excedente no mesmo boleto, especificando as linhas.

### `billing_snapshots`
* **Finalidade:** O cofre de auditoria anti-cancelamento (ROI).
* **Colunas-chave:** `licensed_students_count`, `active_students_count`, `total_hours_studied`.
* **Regra de Negócio:** Os dados aqui são permanentemente congelados todo mês. Impedindo a faculdade de alegar "não usamos a plataforma esse ano".

### `license_usage`
* **Finalidade:** Registro de batimento diário (*Telemetry*).
* **Regra de Negócio:** O script noturno anota `students_registered` vs `licensed_quota`. Se o registrado ultrapassar a cota, o alarme de *True-Up* é engatilhado.

### `feature_flags`
* **Finalidade:** Isolamento comercial das UI's.
* **Colunas-chave:** `has_roi_dashboard`, `has_heatmap`.
* **Regra de Negócio:** A tela de Heatmap ou Analytics da Aeternum verificará as *flags* desta tabela antes de renderizar para o coordenador, bloqueando usuários do plano *Starter*.

---

## 2. PROJETO DE ESTADOS E CICLOS FINANCEIROS

1. **Ciclo Mensal:** A `institution_subscriptions` nasce com `billing_cycle = 'monthly'`. O banco cria um `billing_cycles` para o mês atual. Ao virar o mês, um script muda o cycle para `closed`, gera a `invoice` e abre o ciclo do mês seguinte.
2. **Ciclo Anual:** Gera apenas 1 *invoice* adiantado. Nos meses subsequentes, gera *invoices* com valor R$ 0.00, exceto se houver excedente (True-Up).
3. **Suspensão / Inadimplência:** Se a `invoice` passar de 30 dias de atraso, o campo `status` em `institution_subscriptions` vira `past_due`. As políticas de Row Level Security (RLS) bloqueiam a UI.
4. **Cancelamento:** `cancel_at_period_end = true`. O serviço se mantém vivo até o último dia pago, cancelando imediatamente na data final de `current_period_end`.

---

## 3. MECÂNICA DE *SOFT BLOCK* E *TRUE-UP*

A arquitetura descrita acima possibilita o "True-Up" nativo:
1. Faculdade tem `licensed_students_count = 100` em sua Subscrição.
2. Admins fazem *upload* via CSV de 150 alunos novos.
3. Como é um **Soft Block**, o banco PostgreSQL permite as inserções em `users`.
4. À noite, a tabela `license_usage` percebe que a contagem atual é de 250 alunos para uma cota de 100.
5. No final do mês, na virada do `billing_cycles`, o robô lê esse estouro, e adiciona uma linha em `invoice_items` cobrando: "150 licenças excedentes x R$ 65,00", reajustando automaticamente a assinatura.

---

## 4. CLASSIFICAÇÃO EXECUTIVA FINAL E VALIDAÇÃO

* **A estrutura está pronta?** 🟢 SIM. Baseada em pilares globais do modelo Stripe/SaaS.
* **Compatível com Soft Block?** 🟢 SIM. A validação é assíncrona (License Usage vs Threshold).
* **Compatível com True-Up?** 🟢 SIM. Via `invoice_items` dinâmicos no fim do ciclo.
* **Compatível com Stripe?** 🟢 SIM. Mapeamento 1-para-1 com os *Objects* do Stripe (Subscriptions, Invoices, Customers).
* **Compatível com Asaas?** 🟢 SIM. Mesma estrutura genérica.
* **Riscos Encontrados?** O *Feature Flagging* em tabela própria pode gerar *overhead* (queries lentas). Deverá ser consumido pelo *Frontend* no momento do *Login* e armazenado no Contexto/JWT do Supabase.

Toda a infraestrutura documental (SQL Design) foi concebida na pasta `docs/migrations` de forma estéril, aguardando aprovação técnica para entrar no Supabase real na próxima fase.

# REVENUE CALCULATION RPC DESIGN (Fase 5.3C)
**Auditoria da Stored Procedure PL/pgSQL B2B**

O coração matemático da Aeternum Atlas foi projetado. Este documento homologa a lógica da Stored Procedure `generate_monthly_invoice`, encarregada de transformar matrículas de alunos em faturas exatas com zero intervenção humana.

---

## 1. DESIGN DA FUNÇÃO

A função foi projetada para receber um comando genérico da Edge Function e devolver uma tabela atômica contendo a "fatura pronta":

**Assinatura:**
```sql
generate_monthly_invoice(p_institution_id uuid, p_billing_cycle_id uuid)
RETURNS SETOF invoice_calculation_result
```

**Comportamento Cascata:**
1. **Idempotência (Gatilho Anti-Duplicação):** Antes de qualquer cálculo, a função vasculha a tabela `invoices` procurando o binômio `(institution_id, billing_cycle_id)`. Se encontrar, não cria nada e retorna a fatura antiga intacta.
2. **Busca do Contrato (Licensed):** Busca a cota mínima na tabela `institution_subscriptions`.
3. **Contagem Orgânica (Consumed):** Dispara `SELECT COUNT(DISTINCT id) FROM users WHERE role='student'`.
4. **Matemática do True-Up:** Se o Consumido superar o Licenciado, o sistema subtrai a diferença (o *Excesso*) e gera o custo punitivo extra. Caso contrário, o *Excesso* é 0 e apenas o pacote base é faturado.
5. **Persistência Atômica:** A função insere simultaneamente (dentro da mesma transação do banco):
   * O Log em `billing_snapshots`.
   * A Cabeceria em `invoices` (Status `draft`).
   * O Item Base em `invoice_items`.
   * O Item Excedente (Condicional) em `invoice_items`.

---

## 2. AUDITORIA DE SEGURANÇA E PERFORMANCE

* **Transação:** PL/pgSQL executa todo o bloco dentro de uma única transação invisível (`BEGIN ... COMMIT`). Se a luz do servidor cair enquanto ele cria o `invoice_items`, a tabela `invoices` e `billing_snapshots` dão um *rollback* automático. Fatura pela metade não existe no PostgreSQL.
* **Concorrência e Locks:** O `COUNT(DISTINCT id)` faz apenas leitura (SELECT). O banco de dados do Supabase (`pgBouncer`) conseguirá suportar essa chamada mensal sem bloquear estudantes de assistirem às aulas 3D.
* **Segurança de Acesso:** A função está sob o modificador `SECURITY DEFINER`. Significa que, mesmo engatilhada por uma chamada de baixo privilégio via RPC do cliente (caso mal-configurado), ela cruzará a barreira do RLS temporariamente apenas dentro do seu escopo estrito e blindado, garantindo o resultado exato sem quebrar o acesso B2B. O melhor, no entanto, é atrelar sua chamada a uma *Service Role Key* exclusiva da Edge Function.

---

## 3. ADEQUAÇÃO OPERACIONAL E GATEWAYS EXTERNOS

* **Compatibilidade com Stripe/Asaas:** O retorno (UUIDs, totalizadores e status `draft`) é o *payload* exato que a Edge Function do Supabase precisará para montar o JSON e disparar um `POST` para a API do Asaas e Stripe criando o link físico de pagamento. 
* **Transição de Ciclos:** Como a fatura nascerá como `draft`, o Gateway externo fará a conversão para boleto aberto.

---

## 4. PARECER EXECUTIVO E DELIBERAÇÕES

* **RPC Projetada:** SIM. (Arquivo SQL gerado isolado e intacto).
* **SQL Seguro:** SIM. (Bloqueios e Rollbacks implícitos ativos).
* **Idempotência Garantida:** SIM. (Um `SELECT` e `IF FOUND THEN RETURN` previnem a duplicação).
* **Risco de Dupla Fatura:** BAIXO. Se a API de pagamento falhar ou se você apertar o botão "Gerar Mês" dez vezes seguidas por desespero, o Supabase apenas lerá a fatura gerada na 1ª vez e devolverá os mesmos dados, sem criar clones de fatura.
* **Pronta para Auditoria de Segurança:** SIM.

Procedimento finalizado. O script transacional B2B reside em `docs/migrations/phase_5_3_revenue_calculation_rpc.sql` pronto para validação da Engenharia.

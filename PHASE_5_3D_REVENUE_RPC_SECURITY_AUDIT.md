# REVENUE RPC SECURITY AUDIT (Fase 5.3D)
**Auditoria de Transação e Segurança (PL/pgSQL)**

Este relatório descreve a varredura crítica de segurança efetuada no código `docs/migrations/phase_5_3_revenue_calculation_rpc.sql` visando proteger o sistema contra faturas fantasmas, dupla emissão e *race conditions* no cálculo B2B.

---

## 1. SEGURANÇA E ISOLAMENTO
* **SECURITY DEFINER:** Ativo. Permite que a função ultrapasse a blindagem RLS momentaneamente para fazer a matemática total sem comprometer a política do banco.
* **search_path explícito:** Ativo (`SET search_path = public`). Impede *Path Traversal* e injeção de esquemas maliciosos caso alguém com permissões baixas tente forçar a chamada da função.
* **Privilege Escalation:** Mitigado. Como a função não recebe SQL dinâmico nem utiliza `EXECUTE`, é impossível injetar comandos destrutivos pelos parâmetros UUID.

## 2. IDEMPOTÊNCIA E CONCORRÊNCIA (RACE CONDITIONS)
* **Prevenção Lógica:** A função utiliza uma trava de leitura (`SELECT ... LIMIT 1`) que aborta a criação caso a fatura já exista no banco.
* **O Perigo Oculto (Race Condition):** Se a Edge Function der defeito e disparar 2 comandos simultâneos (no mesmo exato milissegundo), ambas as chamadas passarão pela trava do `SELECT` antes do `INSERT` finalizar. 
* **Resolução Obrigatória (Lock no Banco):** Falta uma restrição `UNIQUE` nativa na tabela `invoices` (Amarrando `institution_id + billing_cycle_id`). Se a restrição for adicionada, a segunda execução tomará um Erro 500 do PostgreSQL ao tentar inserir, barrando definitivamente a dupla fatura.

## 3. INTEGRIDADE MATEMÁTICA E DO DADO
* **Fórmula do Excesso:** `GREATEST(0, v_consumed_students - v_licensed_students)` opera com precisão absoluta, não gerando valores negativos (evitando que devolvamos dinheiro para a faculdade se ela matricular menos que o pacote base).
* **Consistência:** A amarração e geração simultânea do Snapshot Congelado e dos Itens de Fatura em múltiplas tabelas assegura a rastreabilidade perfeita do que ocorreu em um mês X.

## 4. TRANSAÇÃO E ROLLBACK ATÔMICO
* Como toda Função do PL/pgSQL atua sobre a capa de `BEGIN ... COMMIT` transparente, a falha ao registrar o Item Excedente cancelará o Snapshot e a Fatura Base automaticamente. Nunca existirá faturamento mutilado.

## 5. COMPATIBILIDADE FUTURA (Gateways)
* A RPC devolve os dados exatos (ID da fatura draft, valor, instituição) em um record unificado, formatado com perfeição para se conectar a APIs como Stripe ou Asaas via JSON no futuro ciclo da Edge Function.
* O sistema exige a criação de uma `billing_audit_logs` no Supabase futuramente para guardar as respostas HTTP do Stripe.

---

## 6. DELIBERAÇÕES E RECOMENDAÇÕES

**Riscos Apurados:**
* **Dupla Cobrança:** BAIXO (A trava lógica previne cliques repetidos do humano, mas não previne disparos concorrentes simultâneos agressivos de máquina).
* **Perda de Faturamento:** NENHUM.
* **Geração Parcial:** NENHUM (Rollback Atômico funcional).

**Alterações OBRIGATÓRIAS (1):**
1. Antes de aplicar esta RPC em produção, é mandatória a adição de Constraints Únicas de nível de banco nas tabelas fundamentais. É preciso adicionar ao script (ou criar uma migration extra) o código: 
`ALTER TABLE invoices ADD CONSTRAINT unique_invoice_per_cycle UNIQUE (institution_id, billing_cycle_id);`
`ALTER TABLE billing_snapshots ADD CONSTRAINT unique_snapshot_per_cycle UNIQUE (institution_id, billing_cycle_id);`

**Alterações RECOMENDADAS (1):**
1. Na cláusula de verificação da trava de idempotência, deve-se usar um tratamento explícito para falhas de violação da constraint `unique_invoice_per_cycle`, ou seja, tratar internamente para que, se estourar o limite único, a função capture a exceção e devolva silenciosamente a fatura que ganhou a corrida.

---

## 7. PARECER TÉCNICO

* **RPC Segura?** SIM (Lógica sólida).
* **Pronta para execução?** NÃO TOTALMENTE. (A falta das travas `UNIQUE` nas tabelas requer alteração antes).
* **Risco de dupla cobrança?** BAIXO (mas teoricamente possível em requisições concorrentes paralelas).
* **Risco financeiro?** BAIXO.
* **Pode seguir para execução no Supabase?** SIM, desde que acompanhada do `ALTER TABLE` adicionando o índice ÚNICO apontado acima.

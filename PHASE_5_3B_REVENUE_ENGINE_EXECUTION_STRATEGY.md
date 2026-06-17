# REVENUE ENGINE EXECUTION STRATEGY (Fase 5.3B)
**Auditoria de Orquestração do Motor Financeiro**

Este dossiê detalha a avaliação das vias de execução automática do motor financeiro da Aeternum Atlas, definindo as fronteiras arquiteturais entre o Banco de Dados, o Servidor e o Agendador de Tempo, para garantir emissão de faturas massivas à prova de falhas na operação B2B.

---

## 1. ANÁLISE COMPARATIVA DE ARQUITETURA

### Opção 1: Supabase Edge Functions (Deno / TypeScript)
* **Ponto Forte:** Observabilidade, facilidade extrema em comunicar via HTTP com REST APIs de terceiros (Stripe e Asaas) lidando com JSON e Webhooks.
* **Fraqueza:** Sujeitas a timeouts ou instabilidades de rede e limitação de RAM em loops massivos.

### Opção 2: PostgreSQL Function / RPC (PL/pgSQL)
* **Ponto Forte:** Atomicidade implacável e hiper-velocidade. Conta 10.000 alunos e insere as faturas internamente em menos de 100ms. O rollback é nativo em caso de erro.
* **Fraqueza:** Fazer chamadas externas para o Stripe usando a extensão `pg_net` do PostgreSQL é doloroso, asqueroso de debugar e quebra as boas práticas de microsserviços.

### Opção 3: Supabase Scheduled Jobs (Cron / `pg_cron`)
* **Ponto Forte:** Automação passiva nativa no banco. Excelente gatilho (Trigger).
* **Fraqueza:** É "cego". Se o Cron falhar, ele não tenta de novo de forma inteligente. Não tem mecanismo de *Retry Backoff* nativo para falhas de rede.

**Decisão Mestre (O Design de Separação de Responsabilidades):**
A regra de cálculo matemático (contar cabeças e faturar no papel) deve habitar **exclusivamente no Banco de Dados** (RPC). A comunicação e a ordem devem habitar **exclusivamente na Edge Function**. O Cron apenas acorda a Edge Function.

---

## 2. ESTRATÉGIAS DIRETIVAS (RESPOSTAS OFICIAIS)

**1. Qual estratégia é recomendada para o MVP Financeiro?**
Edge Function acionada de maneira **manual** pelo Reitor (via clique na Dashboard "Gerar Fatura Mês") ou pelo *Super Admin* nos primeiros 60 dias. O automatismo puro é perigoso sem tracionar faturas reais primeiro.

**2. Qual estratégia é recomendada para Produção?**
A tríade híbrida: O Supabase Cron chama mensalmente uma Edge Function secreta (`billing-runner`). A Edge Function executa a conta B2B ativando uma RPC do Banco. Após atestar que o banco gerou os *Snapshots* perfeitamente, a Edge Function despacha essa conta pronta para a API do Stripe.

**3. Qual estratégia é recomendada para escala LATAM?**
Com o aumento insano de faculdades em 5 anos, o Cron nativo do Supabase deverá ser substituído por um *Job Scheduler* distribuído e externo (ex: **Inngest**, **Trigger.dev** ou **Upstash QStash**) para lidar com *Queue* (Filas) e reprocessamento assíncrono (Dormir e Acordar funções caso a API do Asaas demore a responder).

**4. Onde deve viver a regra de cálculo?**
No **BANCO DE DADOS** (Uma Stored Procedure / RPC). O *Frontend NUNCA* pode processar dinheiro. A Edge Function não deve buscar 10.000 alunos na memória do TypeScript para subtrair e contar. Ela simplesmente diz ao banco: *`supabase.rpc('generate_monthly_invoice', { institution: X })`*. O Banco faz a matemática do *True-Up*, grava a Fatura e cospe o JSON pronto para a Edge Function encaminhar ao gateway.

**5. Como evitar dupla emissão de fatura?**
Usando **Idempotency Keys**. 
* **No Banco:** Criar uma chave única complexa `UNIQUE(institution_id, billing_cycle_id)`. Se o banco tentar gerar o fechamento de Junho/2026 duas vezes, o SQL retorna erro fatal.
* **No Stripe/Asaas:** Enviar o `Idempotency-Key` no Header HTTP da requisição usando o ID único do ciclo (`billing_cycle_id`). Se a requisição cair no meio, e a Edge Function tentar enviar de novo, o Stripe detecta o Header repetido e não gera duas cobranças.

**6. Como reprocessar um mês com erro?**
A arquitetura baseada em *Soft Block* é misericordiosa. Se o dia 1 do mês der erro no faturamento, os alunos continuam usando. Um botão na Dashboard de *Super Admin* fará um *Force Run*: 
A RPC apaga a `invoice` que ficou presa em `status = draft`, recria os cálculos e reenvia para o Gateway de forma atômica.

**7. Como registrar logs financeiros?**
Toda requisição feita aos Gateways (Stripe/Asaas) deve ser injetada em uma tabela separada e pesada chamada `billing_audit_logs`. Esta tabela servirá como a "caixa preta" do SaaS (Gravando os retornos `200 OK` e `500 Erros` com JSON dos Webhooks nativos).

---

## 3. CONCLUSÃO EXECUTIVA

* **Melhor caminho técnico:** Arquitetura Híbrida. (Cron do Supabase → dispara Edge Function → que dispara Stored Procedure do SQL → responde à Edge Function → que aciona o Stripe de forma idempotente).
* **Risco Inicial:** ALTO (Requer tratamento fino de exceções HTTP na ponte Stripe-Supabase).
* **Complexidade:** MÉDIA-ALTA (Exige programação em PL/pgSQL).
* **Próxima Fase Recomendada (Fase 5.3C):** Construção formal da **RPC (Remote Procedure Call) Matemática** em SQL. Precisamos dar inteligência ao banco para fechar o caixa sozinho, gerando o documento e a fatura antes mesmo de acoplarmos qualquer automação ou Stripe externo.

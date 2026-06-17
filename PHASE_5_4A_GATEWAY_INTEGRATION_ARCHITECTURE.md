# GATEWAY INTEGRATION ARCHITECTURE (Fase 5.4A)
**Auditoria de Soluções de Pagamento B2B LATAM**

O *Revenue Engine* interno da Aeternum Atlas está maduro e homologado para fechar o caixa mensal (como comprovado pela fatura orgânica de R$ 52.000 gerada). Agora, definimos a arquitetura para cruzar a ponte entre a matemática local e o dinheiro real.

---

## 1. AUDITORIA DE GATEWAYS

### 1.1 Asaas
* **Forte:** Soberano no B2B do Brasil. Emite Boleto, Pix estático/dinâmico e cobra no Cartão.
* **Diferencial Crítico B2B:** Emite Nota Fiscal de Serviço Eletrônica (NFS-e) nativamente atrelada à cobrança. Uma faculdade que paga R$ 52.000 exige nota fiscal de prefeitura, e o Asaas automatiza isso.
* **Integração:** Webhooks robustos, permite injeção de `external_reference` (para Idempotência).
* **Limitação:** Focado quase 100% no Brasil.

### 1.2 Stripe
* **Forte:** O padrão ouro global para SaaS. Arquitetura de faturas (Invoices) e True-Ups fantástica.
* **Webhooks:** Insuperáveis na rastreabilidade. Multi-país (resolve Europa, EUA, e grande parte da LATAM).
* **Limitação LATAM/Brasil:** O Stripe Brasil possui limitações para emissão massiva de boletos B2B puristas e **não emite NFS-e** (requer integração extra com NFE.io ou eNotas, dobrando o custo de infraestrutura). Não atende empresas sediadas no Paraguai de forma nativa (exige Stripe Atlas / LLC).

### 1.3 Mercado Pago
* **Forte:** Altíssima penetração LATAM (Pix, Boleto, Cartões Locais).
* **Limitação B2B:** A API de assinaturas e conciliação de faturas híbridas (True-Up com valor variável todo mês) é complexa e focada predominantemente no B2C e e-commerce padrão.

### 1.4 Pagar.me
* **Forte:** Confiável no Brasil para Pix e Cartões (Gateway do Grupo Stone).
* **Limitação:** Não possui automação profunda de Nota Fiscal nativa como o Asaas para o nicho de SaaS Institucional B2B.

---

## 2. ESTRATÉGIA DE ARQUITETURA E RESPOSTAS TÉCNICAS

**1. Qual gateway deve ser implementado primeiro?**
**Asaas.** Sendo o nosso MVP focado no Brasil (UPE/etc), lidar com transações de altíssimo valor (R$ 50k+) em instituições de ensino exige Boleto/Pix robusto atrelado à emissão de Nota Fiscal automática.

**2. Qual gateway deve ser mantido para expansão internacional?**
**Stripe.** Quando o Atlas fechar com universidades no México, Europa ou EUA, o Stripe orquestrará as moedas locais via Cartão/Wire Transfer.

**3. A Aeternum deve usar um gateway único ou estratégia híbrida?**
**Híbrida.** (Asaas para o polo do Brasil; Stripe para a holding Internacional). O Supabase lidará com isso adicionando uma coluna `gateway_provider` (enum: `asaas`, `stripe`) na tabela `institutions`.

**4. Como mapear invoices internas para cobrança externa?**
Quando a Edge Function for engatilhada, ela chamará a RPC local (Fase 5.3). A RPC devolve o `invoice_id` interno e o valor de R$ 52k. A Edge Function então empacota isso num POST HTTP para a API do Asaas criando a fatura externa e usando nosso `invoice_id` como `external_reference`.

**5. Como armazenar IDs externos?**
Na tabela `invoices` atual, precisaremos adicionar duas colunas pontuais:
* `gateway_id` (varchar) -> Guarda o ID do Asaas (ex: `pay_12345`).
* `gateway_url` (varchar) -> Guarda o link do boleto/checkout que será renderizado no Painel Web.

**6. Como tratar webhooks?**
Criaremos uma Supabase Edge Function dedicada (ex: `/webhooks/asaas`). Ela receberá o *payload* do Asaas. Quando o evento `PAYMENT_RECEIVED` chegar, ela busca a fatura local pelo `external_reference` e altera a situação interna para `paid`.

**7. Como evitar cobrança duplicada externa?**
Sempre passaremos a nossa chave de unicidade (`billing_cycle_id`) no cabeçalho `Idempotency-Key` no Stripe, ou no `external_reference` no Asaas. Se a Edge Function cair e tentar de novo, o gateway devolverá a cobrança já criada.

**8. Como sincronizar status?**
Fluxo unidirecional de vida:
* `draft` (A RPC cria no banco, mas a API do gateway ainda não recebeu).
* `open` (Edge Function enviou pro gateway com sucesso. O cliente já pode pagar).
* `paid` (Webhook avisou que o dinheiro caiu).
* `overdue` (Webhook avisou ou script diário local varreu as datas vencidas).
* `cancelled/failed` (Webhook avisou sobre estorno ou bloqueio).

---

## 3. CONCLUSÃO OBRIGATÓRIA

* **Gateway recomendado para MVP:** Asaas (Boleto/Pix + NFS-e nativa quebra barreiras burocráticas no B2B Brasil).
* **Gateway recomendado para Brasil:** Asaas.
* **Gateway recomendado para LATAM:** Stripe (Para países onde o Stripe atua), e/ou dLocal se a expansão for extrema em países sem Stripe (Paraguai/Bolívia).
* **Estratégia final:** Arquitetura agnóstica de pagamento. A RPC transacional do PostgreSQL faz toda a matemática complexa sem saber o que é Stripe ou Asaas. A responsabilidade de falar com o mundo exterior recai sobre uma Edge Function "burra" que apenas traduz o nosso JSON interno para o payload exigido pelo gateway escolhido.
* **Próxima fase técnica:** **Fase 5.4B** (Desenvolvimento da Orquestradora Edge Function de Faturamento). Essa fase focará em escrever o TypeScript que chama o banco e atira a fatura validada para o sandbox do Asaas.

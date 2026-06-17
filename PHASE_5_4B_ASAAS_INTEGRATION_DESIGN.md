# ASAAS INTEGRATION DESIGN (Fase 5.4B)
**Projeto Técnico de Orquestração B2B para o Brasil**

O presente documento ratifica o design da camada de transporte financeiro. Ele atua como ponte entre a matemática inviolável do PostgreSQL (Fase 5.3) e o Asaas, o gateway escolhido para emissão de Boletos, Pix e Notas Fiscais das Universidades brasileiras.

---

## 1. SECRETS NECESSÁRIOS (Supabase Vault)
Antes de qualquer código ser escrito, o cofre do Supabase (`supabase secrets set`) deverá ser alimentado com as chaves de blindagem:
* `ASAAS_API_KEY`: Chave da API (Sandbox/Production).
* `ASAAS_ENVIRONMENT`: Flag (`sandbox` ou `production`) para roteamento de URLs.
* `ASAAS_WEBHOOK_TOKEN`: Token fixo fornecido pelo Asaas para garantir que os *Webhooks* recebidos vêm realmente do Asaas e não de um atacante.

## 2. EDGE FUNCTION DE EMISSÃO (`create-asaas-charge`)
Será a orquestradora ativa do nosso *Revenue Engine*:
* **Input:** Recebe apenas `{ "invoice_id": "uuid..." }` da interface administrativa.
* **Segurança:** O script injetará os cabeçalhos de *Auth* do usuário atual e verificará rigorosamente se a *Role* no JWT é `super_admin`.
* **Escalada de Privilégio:** Após validar o humano, o script assume a `service_role` (ignora o RLS) para rastrear os dados reais da Fatura (`invoices`) e da Instituição (`institutions`).
* **Regra de Negócio:**
  1. O *Customer ID* existe no nosso banco? Se não, invoca a API do Asaas e cria o Cliente (PJ).
  2. Dispara a criação do Boleto/Pix no Asaas.
  3. Atualiza a fatura interna (`invoices`) com: `gateway_provider = asaas`, `gateway_id = asaas_charge_id`, `gateway_url = asaas_invoiceUrl` e avança o status local para `open`.

## 3. PAYLOAD ASAAS (Engenharia do POST)
O JSON enviado ao Asaas mapeará nossos dados brutos com perfeição:
* `customer`: ID de cliente no Asaas.
* `billingType`: `BOLETO` (O Asaas envia o QR Code do Pix embutido).
* `value`: Mapeado do nosso `total_amount` (ex: 52000.00).
* `dueDate`: Mapeado do nosso `due_date`.
* `description`: `"Fatura Aeternum Atlas - Ciclo Junho/2026"`.
* `externalReference`: **Obrigatoriamente** o nosso `invoice_id` em formato UUID.

## 4. EDGE FUNCTION PASSIVA (`asaas-webhook`)
Será o nosso "ouvido" na internet. Receberá pulsos HTTP do Asaas 24 horas por dia:
* **Segurança:** Rejeita qualquer POST que não possuir o cabeçalho seguro `asaas-access-token` correspondente ao nosso *Secret*.
* **Eventos mapeados:**
  * `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED`: A Universidade pagou.
  * `PAYMENT_OVERDUE`: O boleto venceu.
  * `PAYMENT_DELETED`: Boleto cancelado pelo administrador.
  * `PAYMENT_REFUNDED`: Estorno devolvido ao cliente.

## 5. MAPEAMENTO TRANSLACIONAL DE STATUS
A fluência entre o banco local e o Asaas seguirá a seguinte conversão:
* **draft:** (Local apenas). Fatura não sincronizada.
* **open:** Asaas = `PENDING`.
* **paid:** Asaas = `RECEIVED` ou `CONFIRMED`.
* **overdue:** Asaas = `OVERDUE`.
* **cancelled:** Asaas = `DELETED`.
* **failed:** Asaas = `REFUNDED` / Carga falhou.

## 6. IDEMPOTÊNCIA E ANTIDUPLICAÇÃO EXTERNA
A injeção do `invoice_id` na chave `externalReference` é a espinha dorsal da integração. Antes de enviar um POST de criação de cobrança, a nossa Edge Function consultará a API do Asaas filtrando por `externalReference`. Se o Asaas responder que a fatura já existe lá, a nossa Edge Function aborta a tentativa de clonagem e apenas devolve o link que já estava criado.

## 7. BLINDAGEM DE SEGURANÇA B2B
* O Frontend web é ignorante. Ele jamais lerá ou guardará a `ASAAS_API_KEY`.
* A conversão de dinheiro é isolada no Deno (V8 Engine) dentro da camada Edge do Supabase.

## 8. COMPATIBILIDADE FUTURA (NFS-e e LATAM)
A arquitetura do Asaas resolve Pix, Cartão, Boleto e Nota Fiscal Eletrônica no mesmo fluxo. O modelo desenhado suportará a criação da fatura como assinatura passiva ou cobrança avulsa baseada no *True-Up*. Para escalar LATAM (Stripe), a lógica do `externalReference` será exatamente a mesma.

---

## 9. PARECER DE ARQUITETURA DE BANCO DE DADOS (ALERTA VERMELHO)
A arquitetura encontrou **dados faltantes críticos** na nossa tabela local `institutions`.
O Asaas exige obrigatoriamente um **CNPJ (cpfCnpj)** para criar clientes B2B.

* **Alteração de Tabela Necessária:** SIM.
Antes de escrever o código da integração, precisaremos adicionar pelo menos as colunas de faturamento na tabela de Instituições:
* `document` (varchar) - CNPJ/RUT da universidade.
* `financial_email` (varchar) - O e-mail de quem recebe o boleto.
* `asaas_customer_id` (varchar) - Para não duplicar clientes no gateway.

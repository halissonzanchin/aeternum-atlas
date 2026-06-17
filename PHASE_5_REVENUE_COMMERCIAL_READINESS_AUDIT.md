# REVENUE & COMMERCIAL READINESS AUDIT (Fase 5.0)
**Diagnóstico Estratégico de Prontidão B2B e B2C**

Este laudo avalia as capacidades da Aeternum Atlas de monetizar sua tecnologia, gerir contratos em larga escala, faturar automaticamente e blindar o produto contra a inadimplência ou uso excessivo de licenças.

---

## ETAPA 1 — ONBOARDING INSTITUCIONAL

**Fluxo:** `Instituição → Admin → Professor → Turmas → Alunos`

1. **O que já está automatizado?**
   * Criação de toda a Árvore Acadêmica (Campi, Cursos, Semestres, Disciplinas e Turmas) via upload de CSV (*Import Engine V2*).
   * Vinculação em massa de alunos em suas respectivas turmas.
   * Dashboards acadêmicos e analíticos retroalimentados automaticamente a cada acesso.
2. **O que ainda depende da equipe da Aeternum?**
   * O provisionamento nativo (criação da senha / envio de e-mail de ativação) na tabela de *Auth* do Supabase, pois a aplicação *Frontend* de um administrador da universidade não possui poder administrativo de `service_role` para criar contas de terceiros em lote sem se deslogar.
3. **O que impede onboarding de 1000+ alunos hoje?**
   * Exatamente a etapa de envio dos convites (*Auth Invites*). A importação em banco funciona para a hierarquia, mas o provisionamento real de senhas carece de um serviço backend (Edge Function) agindo como carteiro.

---

## ETAPA 2 — GESTÃO DE USUÁRIOS

**Auditoria:** O ecossistema atual não possui fluxos maduros de "Recuperar Senha" expostos robustamente no painel de administração da instituição, nem botões de "Reenviar Convite".
**Respostas:**
1. **O fluxo é self-service?** Não.
2. **O fluxo é parcialmente manual?** **Sim.** A faculdade faz o "Onboarding" dos dados via planilha, mas a *ativação das contas* com envio de *Magic Link/Password* é bloqueada por segurança do Frontend.
3. **O fluxo é totalmente manual?** Não, as entidades acadêmicas e os relatórios são 100% automatizados.

---

## ETAPA 3 — LICENCIAMENTO (TIERS)

**Auditoria:** O sistema calcula faturamento estimado multiplicando alunos por um "Ticket Médio", exibindo valores monetários no `LicenseSummaryPanel`. Contudo:
* Limites de Alunos: Inexistente como bloqueio rígido (Hard Limit).
* Limites de Armazenamento/Simulados: Inexistentes.

**Resposta:** 
**Como a plataforma controlaria contratos hoje?**
*Baseada na confiança e pós-faturamento.* O Super-Admin veria que a "Universidade X" importou 5.000 alunos e geraria um boleto manual correspondente, visto que a plataforma de software não cortaria ativamente o acesso do "aluno 5.001" caso a licença fosse para apenas 5.000.

---

## ETAPA 4 — BILLING READINESS (FATURAMENTO)

**Auditoria Estrutural do Banco de Dados:**

* **Tabelas que existem:** `institutions` (Instituições-base), que funcionam como os *Tenants*.
* **Tabelas que NÃO existem:** Nenhuma estrutura financeira (`subscriptions`, `invoices`, `plans`, `payment_methods`).
* **Quais seriam obrigatórias para automação?**
  1. `billing_plans` (Armazenar os limites de Starter, Pro, Enterprise).
  2. `institution_subscriptions` (Vínculo da faculdade com o plano, contendo `status: active/past_due`, `stripe_customer_id`, e datas de validade).

Sem a tabela `institution_subscriptions`, não é possível executar **"Bloqueio por Inadimplência"** de forma automatizada (*Hard Block* via *Row Level Security*).

---

## ETAPA 5 — CUSTOMER SUCCESS (CS)

**Auditoria Analítica:**
Os dashboards de `InstitutionRoiDashboard` e `AcademicAnalytics` são estado-da-arte. Eles rastreiam tempo de estudo, modelos mais vistos, taxas de erro em simulados e acessos por 30 dias.
**Resposta:**
**Os dashboards atuais já fornecem os indicadores de CS?**
**SIM, COM EXCELÊNCIA.** É plenamente possível identificar uma instituição com "Baixa Utilização" (alunos parados) ou "Em Risco de Churn" (pouco ROI educacional) diretamente pelas telas já construídas no Painel do Super Admin, permitindo ligações proativas da equipe de CS. Falta apenas um algoritmo passivo que dispare alertas de retenção automáticos.

---

## ETAPA 6 — COMERCIAL B2B (SIMULAÇÃO REAL)

**Se hoje uma universidade assinar contrato para 500 Alunos / 50 Professores / 100 Turmas:**

* **Etapas Automatizadas pela Plataforma:** O administrador da universidade loga, sobe o CSV no "Importar Alunos". A plataforma monta todo o ecossistema de dados, as 100 turmas e 20 disciplinas em 1 segundo.
* **Etapas Manuais (Trabalho da Equipe Aeternum):** 
  1. O time técnico precisará executar um script *Backend/CLI* na nuvem apontando para o Supabase que dispare o comando `admin.inviteUserByEmail` para esses 550 usuários.
  2. O time financeiro precisará cadastrar a assinatura da faculdade no ERP/Asaas/Stripe externo à plataforma e enviar o boleto manualmente.

---

## ETAPA 7 — SCORE FINAL DE PRONTIDÃO

* **Engenharia e Arquitetura de Software:** 10/10 (O banco de dados suporta milhões de conexões seguras).
* **Escalabilidade Educacional (LMS):** 9/10 (Pronto).
* **Operação (Customer Success):** 9/10 (O ROI acadêmico é perfeitamente visível).
* **Comercial (Fluxo de Vendas):** 2/10 (Não existe Paywall de B2C nem Gateway B2B).
* **Faturamento Automático (Billing):** 0/10 (Não existem tabelas de *Subscriptions*).

### CONCLUSÃO OBRIGATÓRIA

A plataforma está pronta para comercialização em larga escala?
Classificação Executiva: **PARCIALMENTE PRONTA**

**Fundamentação:** O produto educacional em si (Core Business) é excepcional e "Enterprise Ready". Contudo, as *Avenidas de Cobrança* e o *Gerenciamento de Acesso/Corte Financeiro* são nulos no momento. A Aeternum Atlas consegue operar hoje apenas no modelo **"Managed Service"** (onde a equipe interna gerencia os boletos e os convites manualmente para os clientes B2B). Para virar um **"SaaS Autossuficiente"** (Zero-Touch Sales), é vital a construção dos módulos de *Billing* e de uma *Edge Function* para emissão de convites.

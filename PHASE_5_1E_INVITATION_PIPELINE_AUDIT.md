# INVITATION PIPELINE READINESS AUDIT (Fase 5.1E)
**Auditoria Integral da Jornada de Onboarding B2B**

Este documento consagra a auditoria estratégica de toda a cadeia logística de identidades da Aeternum Atlas, desde a ingestão bruta de dados até a conversão final do usuário em um aluno pagante ativo, avaliando gargalos, segurança e UX.

---

## 1. FLUXO COMPLETO DE ONBOARDING

A arquitetura pipeline se desenha perfeitamente na seguinte esteira:
`Institution Admin` → `Importação CSV (Frontend)` → `Validação de Headers` → `Criação Hierarquia Acadêmica (Find-or-Create)` → `Identificação de usuários existentes (Cache)` → `Separação de usuários ausentes (Inéditos)` → `Disparo para Edge Function (invite-users)` → `Supabase Auth (Admin API)` → `Resend (SMTP Provider)` → `Email de Convite` → `Usuário clica no Magic Link` → `Criação de Senha (se necessário no fluxo)` → `Primeiro Login` → `Matrícula Ativa (Link)` → `Analytics Educacionais Ativos`.

---

## 2. AUDITORIA DE PERFIS

* **Super Admin:** O condutor raiz. Capaz de importar alunos e disparar convites para qualquer faculdade (`institution_id` global).
* **Institution Admin:** Confinado à sua própria faculdade. A Edge Function blinda a injeção de IDs alienígenas. É o orquestrador primário do CSV B2B.
* **Professor:** Entra como *User*. O convite injeta a *Role* `teacher` no Auth Metadata, permitindo-lhe futuramente ter dashboards de classe.
* **Aluno:** O *End-User* final. Recebe a *Role* `student`. Consome o produto educacional no visualizador 3D.

---

## 3. ESTADOS DO CONVITE (INVITATION STATUS)

**Cenário Atual:** Pobre. O Supabase nativo gerencia o estado binário no Auth (`Aguardando Verificação` vs `Confirmado`). O frontend não sabe se o aluno abriu a caixa de entrada.
**Cenário Futuro (Mandatório):** Para a equipe de Customer Success trabalhar, a tabela `users` precisará abrigar um campo enum (`invitation_status`) ou existir uma tabela separada `user_invitations` com a seguinte régua:
* `pending`: CSV importado, esperando a Edge Function rodar.
* `invited`: Disparo feito pela Edge Function para o Resend.
* `delivered`: Webhook do Resend acusa entrega na caixa postal.
* `opened`: Webhook do Resend acusa pixel de abertura lido.
* `accepted`: O Magic Link foi clicado e a conta validada.
* `active`: O aluno entrou e completou 1 aula/simulado.
* `expired`: O token do Supabase venceu (geralmente 24h a 7 dias).
* `failed`: E-mail retornou (Hard Bounce).
* `cancelled`: O Admin cancelou a matrícula.

---

## 4. RATE LIMITING E ESCALABILIDADE (STRESS TEST)

Simulando volumes progressivos contra a integração `Edge Function + Supabase Auth + Resend`:

* **50 Convites:** Sucesso imediato e invisível ao usuário (< 2 segundos).
* **500 Convites:** Sucesso garantido, beirando a margem de segurança do *timeout* padrão da função Serverless no Deno (~10 a 15 segundos). O Resend absorve nativamente.
* **2.000 Convites:** **RISCO DE TIMEOUT NA BORDA**. A função `invite-users` pode expirar se executar as 2.000 chamadas sequencialmente na API administrativa do Supabase no mesmo *Request HTTP*. Exige que o *Frontend* quebre em *chunks* (lotes) de 500 em 500, disparando requisições paralelas.
* **10.000 Convites:** **FALHA SISTÊMICA SE SÍNCRONO**. Um fluxo síncrono no Browser mataria a UI. Requer obrigatoriamente a migração do processamento para um **Sistema de Fila Assíncrona** (Ex: *BullMQ* no Deno ou *pg_cron* no banco de dados).

---

## 5. AUDITORIA DE SEGURANÇA B2B

* **Multi-Tenant Isolation:** ✅ Aprovado. A *Edge Function* valida `callerInstitution === payload.institution_id`.
* **JWT Validation:** ✅ Aprovado. O Token é extraído e verificado contra os servidores da AWS/Supabase internamente para provar que a sessão é válida e não forjada.
* **Replay Attack:** ✅ Aprovado. O Supabase Auth acusa `already registered` se tentarem mandar o mesmo *payload* 2 vezes.
* **Duplicate Invitations:** 🟡 Parcialmente Aprovado. O backend impede criar conta dupla, mas para evitar "Spam" e consumo inútil de cota do Resend, a Interface deve esconder a re-submissão.
* **Institution Escaping:** ✅ Aprovado (Barrado por RLS lógico no código Deno).
* **Email Spoofing:** ✅ Aprovado. Resolvido através do uso do Resend atrelado às assinaturas obrigatórias SPF/DKIM/DMARC no domínio `mail.aeternumatlas.com`.

---

## 6. AUDITORIA UX (USER EXPERIENCE)

**A Interface do Administrador:**
Deve exibir uma barra de progresso linear (Ex: "Importando hierarquia -> 100%. Enviando 40 convites -> Em andamento"). Após a falha ou vencimento, a lista de Alunos (`StudentsPanel`) deve exibir uma tag laranja `"Pendente"` com um botão de ação rápida `"Reenviar Convite"`.

**A Interface do Aluno:**
Deve receber um e-mail com logotipo da faculdade e botão massivo: *"Acessar meu Atlas Anatômico"*. Ao clicar, a tela de destino (`/auth/callback`) deve inteligentemente solicitar uma criação de Senha Permanente caso seja a primeira vez.

---

## 7. MÉTRICAS E KPI'S DE CS (CUSTOMER SUCCESS)

Para monitorar se a universidade parceira engajou:
1. `Invitations Sent`: Quantidade bruta despachada.
2. `Invitations Delivered`: Descontando Bounces e Spams.
3. `Activation Rate`: % de alunos que criaram a senha e entraram.
4. `Time to First Value (TTFV) / Average Activation Time`: Horas entre o disparo do administrador e o primeiro login do aluno no modelo 3D.

---

## 8. DEPENDÊNCIAS DO PIPELINE

* **O que já existe:** Importador massivo funcional, Código da Edge Function, Banco Hierárquico preparado, Validação de CSV robusta.
* **O que depende apenas de Deploy:** Ativar a função `invite-users` e configurar o SMTP Resend na aba "Auth" do painel Supabase.
* **O que depende de Código (Ação Crítica):** Interligar a UI do *AcademicImportService* do Frontend para fazer uma chamada `fetch(Edge_Function)` injetando os e-mails dos alunos inéditos.
* **O que depende de Infraestrutura Adicional Futura:** Tabela de métricas `user_invitations` e Webhooks do Resend para captar rastreamento (aberturas e falhas).

---

## 9. CLASSIFICAÇÃO FINAL E DELIBERAÇÕES

* **Pipeline pronto para deploy?** 🟢 SIM (Os códigos estão prontos e seguros).
* **Pipeline pronto para produção?** 🔴 NÃO. Falta "ligar os fios" entre o Frontend do Importador e a API da Função. E configurar a nuvem para aceitar e-mails.
* **Riscos Remanescentes:** O risco de lentidão sistêmica caso o Frontend jogue um JSON com mais de 500 e-mails na função de uma única vez (Timeout).
* **Prioridade Crítica Seguinte:** Acoplar o código Frontend com a chamada HTTP para a Edge Function.
* **Recomendação Final:** Realizar o *Wire-Up* (Integração) no código React, adicionando o *fetching* no `executeImport()`, dividindo em *chunks* e finalizar o ciclo.

# AUTH INFRASTRUCTURE & SMTP READINESS AUDIT (Fase 5.1C)
**Diagnóstico de Risco e Entregabilidade de Convites Massivos**

Esta auditoria analisa a infraestrutura nativa do Supabase (projeto atual) em relação aos estritos requerimentos operacionais para um *Onboarding* universitário de centenas de usuários simultâneos.

---

## ETAPA 1 — SUPABASE AUTH CONFIGURATION

* **Auth Provider & Email Auth:** Ativos por padrão.
* **Magic Links & Invite User:** Suportados pela API do Supabase e plenamente operacionais no SDK.
* **Configuração de Confirmação:** Ativa por padrão (exige que o usuário clique no link para validar o e-mail).
**Resposta:** O ambiente suporta a funcionalidade lógica de convites, **porém**, a configuração padrão (sem intervenção manual no painel web) possui limitações esmagadoras descritas abaixo.

---

## ETAPA 2 — SMTP CONFIGURATION & DELIVERABILITY

**Situação Atual Presumida (Sem Provedor Externo Configurado no Dashboard):**
O Supabase injeta um provedor SMTP de *sandbox* interno para projetos na nuvem que não configuram chaves próprias.
* **SMTP Customizado:** Não configurado.
* **Domínio Autenticado / SPF / DKIM / DMARC:** Inexistentes para o domínio "aeternumatlas.com". O remetente genérico utilizado é `noreply@mail.app.supabase.io`.
**Resposta:** 
1. A configuração atual é **Sandbox de Teste**. 
2. O risco de entregabilidade é **Altíssimo (Crítico)**. E-mails de convite para redes corporativas rígidas (ex: `@pucpr.br`, `@usp.br`) cairão diretamente no *Spam*, Quarentena ou sofrerão *Hard Bounce* por ausência de assinaturas de segurança DMARC nativas.

---

## ETAPA 3 — RATE LIMIT ANALYSIS

O Supabase aplica *Rate Limits* (Limites de Frequência) agressivos em seus serviços gratuitos/sandbox de e-mail para evitar abusos na AWS SES interna.
* **10 convites:** Passaria (talvez raspe no limite horário).
* **50 convites:** **Bloqueio (HTTP 429 Too Many Requests)**.
* **500 convites:** Falha massiva e risco de suspensão do Auth no projeto.
**Resposta:** Os limites atuais do servidor interno bloqueiam o envio maciço. O serviço atual **não suportaria** onboarding universitário B2B de forma alguma. É mandatório o uso de SendGrid, AWS SES ou Resend injetado nas configurações SMTP da plataforma.

---

## ETAPA 4 — EMAIL TEMPLATES

No painel do Supabase, existem modelos (templates) HTML brutos para:
* Convite de Usuário (Invite User)
* Confirmação de E-mail (Signup)
* Redefinição de Senha (Reset Password)
* Link Mágico (Magic Link)

**Resposta:**
Eles existem, mas **precisam ser profundamente personalizados** com a marca e a identidade visual da Aeternum Atlas. Sem essa personalização, a experiência institucional é **amadora**, pois o reitor receberia um e-mail sem formatação em inglês genérico dizendo *"You have been invited"*.

---

## ETAPA 5 — USER ACTIVATION FLOW

**O Fluxo:** `Aluno recebe convite → Clica no link no e-mail → Supabase verifica token → Redireciona para o Front-End da Aeternum → Acessa plataforma`.

**Resposta:**
1. **O fluxo completo já funciona?** Teoricamente sim.
2. **Existe algum ponto de quebra?** **SIM.** A URL de Redirecionamento (Site URL) no painel do Supabase deve estar configurada apontando corretamente para o Frontend de Produção (ex: `https://aeternum-atlas.vercel.app/`). Se não estiver, o e-mail gerará um erro 404 ao ser clicado. Outro ponto é que o "Invite User" entra na conta sem senha inicial (usa Magic Link). Se o aluno for desconectado, ele não saberá qual senha usar, forçando a UI a sugerir um *Reset Password* no primeiro acesso.

---

## ETAPA 6 — ENTERPRISE SIMULATION

**Simulando a chegada de uma faculdade com 500 alunos e 50 professores:**
1. **O ambiente atual suportaria?** **NÃO.** 
2. **Quantos convites poderiam falhar?** Aproximadamente 547 convites falhariam na porta do servidor do Supabase por estouro de cota (Rate Limit) do SMTP nativo.
3. **Qual a taxa de risco operacional?** **100% de frustração B2B.**

---

## CONCLUSÃO E DELIBERAÇÕES

**Classificação Executiva:** **NÃO PRONTO**

A arquitetura do nosso código Deno (Edge Function) está Enterprise Ready. No entanto, o motor de combustível em nuvem (SMTP do Supabase) está rodando no modo "Bicicleta".

**Podemos realizar o deploy da Edge Function invite-users com segurança?**
Sim, do ponto de vista do repositório de código, o deploy pode e deve ser feito para homologação. No entanto, ele **não deve ser liberado para a tela de Produção** até que as seguintes configurações manuais sejam executadas por um Diretor na tela do Supabase:
1. Configuração de um SMTP Customizado (ex: Resend / SendGrid / Amazon SES).
2. Aumento do *Rate Limit* de e-mails nas abas de Auth.
3. Configuração do `Site URL` de redirecionamento.
4. Tradução e estilização dos Templates HTML de E-mail.

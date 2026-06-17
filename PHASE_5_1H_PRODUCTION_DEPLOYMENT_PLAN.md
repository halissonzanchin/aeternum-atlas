# PRODUCTION DEPLOYMENT PLAN (Fase 5.1H)
**Runbook Operacional para Lançamento do Motor B2B**

Este documento orquestra o plano de guerra para a ativação do ecossistema de *Onboarding Automático* na Aeternum Atlas, definindo as etapas críticas de DevOps e DNS que devem ocorrer no "Dia D".

---

## 1. DEPLOY DA EDGE FUNCTION (`invite-users`)

* **Pré-requisitos:** CLI do Supabase instalada na máquina e usuário logado (`supabase login`).
* **Riscos:** Sobrescrita acidental caso já exista uma função com o mesmo nome, ou falha de autorização se o projeto alvo não estiver vinculado.
* **Rollback:** Deletar a função da nuvem temporariamente (`supabase functions delete invite-users --project-ref hyivyrietgjdazgizafp`) ou desativá-la pelo painel web, forçando o Frontend a usar o modo de Segurança *Fallback* (que não emite convites, mas salva a hierarquia).

---

## 2. INTEGRAÇÃO RESEND (SMTP) E ASSINATURAS

A ativação exige configuração na plataforma Resend e inserção das chaves SMTP geradas na aba `Authentication > SMTP` do painel Supabase.

* **DNS Config:** Adicionar registros TXT e MX indicados pelo painel do Resend no gerenciador de DNS (Registro.br / Cloudflare / Route53).
* **SPF (Sender Policy Framework):** O Resend emitirá um TXT (ex: `v=spf1 include:amazonses.com ~all`). Impede que filtros anti-spam barrem.
* **DKIM (DomainKeys Identified Mail):** Chave criptográfica provando que o e-mail partiu do servidor autorizado.
* **DMARC:** O protocolo rígido mandatário pelo Google e faculdades. Configurar um registro TXT `_dmarc` no domínio de envio. Ex: `v=DMARC1; p=quarantine;`

---

## 3. DOMÍNIO DE ENVIO RECOMENDADO

* **Domínio Recomendado:** `mail.aeternumatlas.com`
* **Por quê?** Nunca se utiliza o domínio raiz (`aeternumatlas.com`) ou o domínio da aplicação (`app.aeternumatlas.com`) para *Cold Email* ou Disparos Massivos transacionais. Caso um reitor furioso marque um lote como Spam, apenas o subdomínio `mail` sofre "Burnout" (Queima de IP), preservando o ranking de SEO do site principal e garantindo que o acesso web não sofra bloqueios de firewall corporativo.

---

## 4. BATERIA DE TESTES REAIS (Pós-Deploy)

A homologação seguirá degraus incrementais de estresse:
1. **Teste com 1 Usuário:** Cria-se um e-mail falso ou secundário (ex: `teste1@gmail.com`). Validar se o e-mail chega na caixa de entrada sem ser filtrado.
2. **Teste com 10 Usuários:** Validação de renderização de lote. Medir tempo (deve ser < 1s).
3. **Teste com 50 Usuários:** Validação de *Chunking* Front-end. Confirmar se a interface não trava e se o pacote de limite exato funciona.
4. **Teste com 500 Usuários:** Simulação *Enterprise*. Validar se ocorrem retornos *429 Too Many Requests* pelo Resend ou *504 Gateway Timeout* pela Edge Function. Aferir o tempo médio real (estimado ~15 segundos).

---

## 5. ESTRATÉGIAS DE ROLLBACK (Plano de Fuga)

* **Falha SMTP (Resend bloqueado):** O administrador da Supabase apenas desliga a chave de SMTP customizado no painel web, voltando para o Sandbox nativo do Supabase (que falhará, mas não quebrará a aplicação frontend).
* **Falha Edge Function (Erro 500):** Não exige intervenção no código. O *Frontend React* foi programado em *Try/Catch* e absorverá a queda, mostrando aviso laranja ("Fallback") e continuando a estruturação da universidade em banco sem convidar.
* **Falha Auth (Instabilidade global Supabase):** Suspender temporariamente as importações CSV B2B no painel da aplicação (Esconder o botão via *Feature Flag*).

---

## 6. CHECKLIST OPERACIONAL (DIA DO DEPLOY)

1. [ ] **Passo 1:** Criar conta oficial no provedor **Resend**.
2. [ ] **Passo 2:** Validar subdomínio `mail.aeternumatlas.com` no DNS (TXT, DKIM, SPF, DMARC).
3. [ ] **Passo 3:** Pegar as credenciais SMTP no Resend (Host, Port, User, Password).
4. [ ] **Passo 4:** Inserir credenciais na Dashboard Supabase (`Authentication > Providers > Email > Enable Custom SMTP`).
5. [ ] **Passo 5:** Executar CLI local: `supabase functions deploy invite-users --project-ref hyivyrietgjdazgizafp --no-verify-jwt`.
6. [ ] **Passo 6:** Abrir painel Frontend (Aeternum Atlas) com *Institution Admin*.
7. [ ] **Passo 7:** Fazer upload de uma planilha com 1 aluno (Teste Unitário).
8. [ ] **Passo 8:** Fazer upload de uma planilha com 50 alunos (Teste Lote).

---

## 7. CLASSIFICAÇÃO EXECUTIVA FINAL

* **O motor B2B está pronto para Deploy?** 🟢 SIM. Toda infraestrutura de código e de UX está blindada.
* **Dependências restantes?** Exclusivamente **DevOps Visual** (Trabalho braçal de Diretor/CTO em logar no site do Resend, configurar DNS, e ligar a chavinha no Supabase).
* **Risco Operacional no "Dia D":** Baixo. Caso tudo dê errado, o código Frontend possui amortecedores (Fallback) para não exibir "Tela Branca da Morte" aos clientes.
* **Esforço Estimado:** ~45 minutos para um Engenheiro Pleno/Sênior resolver os passos de DNS e CLI apontados acima.
* **Recomendação Final:** Agendar Janela de Manutenção (Ex: Sexta-Feira às 22h) para executar o Checklist Operacional, disparando a bateria de 10 alunos testes para sua equipe validar o visual e o *deliverability* (entregabilidade) dos e-mails nas caixas de entrada.

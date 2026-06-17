# IDENTITY & ONBOARDING AUTOMATION AUDIT (Fase 5.1)
**Auditoria de Identidade e Automação de Convites**

Este relatório técnico diagnostica o fluxo atual de provisionamento de contas da plataforma Aeternum Atlas, evidenciando o abismo arquitetural entre a criação de registros B2C e as restrições de segurança que paralisam o onboarding massivo B2B.

---

## ETAPA 1 — AUTHENTICATION FLOW

1. **Como cada perfil é criado hoje?**
   Sem uma ferramenta automatizada interna, um Administrador Institucional, Professor ou Aluno B2B só pode ser registrado na tabela `auth.users` se a equipe interna da Aeternum intervir manualmente (via Painel do Supabase) ou através de rotas de *Sign Up* genéricas B2C (se habilitadas).
2. **Como cada perfil recebe acesso?**
   Através de login via `email` e `password` fornecidos na tela de acesso.
3. **Como cada perfil redefine senha?**
   Caso o fluxo padrão esteja na interface, eles utilizam o *Password Reset Link* do próprio provedor do Supabase Auth enviado para o e-mail cadastrado.

---

## ETAPA 2 — SUPABASE AUTH

* **O frontend possui capacidade real de criar usuários?**
  **NÃO para operações B2B em lote.**
* **Por quê?** O SDK do cliente (`supabase.auth.signUp()`) está programado para registrar uma conta e *imediatamente logar o usuário nessa nova conta*. Se um Coordenador logado tentar importar 50 alunos via Frontend, no 1º aluno criado o Coordenador será deslogado de sua própria conta para assumir a sessão do aluno recém-criado.
* **Dependência:** O sistema **depende obrigatoriamente de Backend**. Apenas a *Admin API* do Supabase (`auth.admin.createUser` ou `auth.admin.inviteUserByEmail`), operada com a chave `service_role` (extremamente sigilosa), pode criar usuários silenciosamente e disparar convites sem afetar a sessão de quem os cria.

---

## ETAPA 3 — INVITATION SYSTEM

* **O que existe hoje?** Rigorosamente nada além das ferramentas nativas soltas dentro do painel de desenvolvedor do Supabase Studio.
* **O que NÃO existe (e é mandatório)?**
  * Tabela ou coluna para rastrear *Status do Convite* (Pendente/Expirado/Aceito).
  * Gatilho de Envio de Convites em Lote.
  * Botão de *"Reenviar Convite"* nos dashboards da Instituição.

---

## ETAPA 4 — LIMITAÇÕES DO IMPORTADOR CSV (Fase 4C.2)

O Importador Massivo construído cumpre perfeitamente seu papel de mapeamento de hierarquia, porém ele é cego quanto à criação de credenciais. Atualmente ele **APENAS VINCULA USUÁRIOS EXISTENTES**.
Se o CSV contiver 50 alunos e 10 nunca tiverem acessado a plataforma, o importador vincula 40 nas turmas e joga os 10 para o relatório de erros com o aviso de *"Aluno não cadastrado"*. Ele é incapaz de convidar ou criar as contas faltantes.

---

## ETAPA 5 — BACKEND OPTIONS

Para resolver o envio dos convites e a criação de Auth Users, avaliamos três trilhas:

A) **Supabase Edge Functions (Deno):** Executam globalmente na borda da CDN em milissegundos. Integradas nativamente ao projeto Supabase atual.
B) **Backend Node.js Tradicional:** Exige criação de uma nova base de código, CI/CD separado e hospedagem extra (Vercel, Heroku, AWS).
C) **Deno Functions genéricas:** Requer infraestrutura externa (Deno Deploy) e configuração manual de chaves.

**Conclusões:**
* **Menor Custo e Menor Complexidade:** **Supabase Edge Functions**. Já acompanham o ecossistema existente, sem custo de devops adicional e sem necessidade de lidar com CORS complexo.
* **Solução Recomendada para Aeternum Atlas:** Supabase Edge Functions.

---

## ETAPA 6 — ENTERPRISE READINESS (Simulação de Impacto)

**Cenário: Ativação de 500 alunos e 50 professores (550 contas inéditas).**

* **Hoje:** Um desenvolvedor ou suporte técnico da Aeternum teria que usar ferramentas da linha de comando, manipular scripts Python ou inserir os e-mails manualmente no Supabase Studio. Tempo estimado: **Horas** de validação manual.
* **Após Automação:** O Administrador da Faculdade sobe a planilha; as turmas são geradas, e a *Edge Function* dispara assincronamente os 550 convites. Tempo estimado do administrador: **< 1 minuto**.

---

## CONCLUSÃO OBRIGATÓRIA

**"Qual é o caminho mais rápido para eliminar completamente a intervenção manual da equipe da Aeternum Atlas no onboarding institucional?"**

O caminho mais rápido e eficiente é a **criação imediata de uma Supabase Edge Function (`invite-users`)**. 
Esta função agirá como uma ponte segura: o Importador CSV no Frontend identificará os e-mails não cadastrados e enviará um pacote JSON para a *Edge Function*. A função (usando a `service_role` key oculta) invocará `supabase.auth.admin.inviteUserByEmail()` para todo o lote, gerando os registros de forma transparente e repassando as IDs de volta ao Frontend para que o Vínculo de Turmas seja finalizado, tudo em um único clique.

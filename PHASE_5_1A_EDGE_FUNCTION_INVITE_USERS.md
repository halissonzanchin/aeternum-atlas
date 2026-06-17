# EDGE FUNCTION: INVITE USERS (Fase 5.1A)
**Documentação Oficial de Deploy e Integração B2B**

Esta documentação homologa a primeira função de borda da Aeternum Atlas, desenhada para atuar como ponte entre a interface do administrador educacional e o ecossistema restrito de autenticação do Supabase.

---

## 1. OBJETIVO DA FUNÇÃO

A função `invite-users` é um microserviço *stateless* escrito em Deno TypeScript. Ela permite que a aplicação web (Frontend) ordene o envio massivo de convites (`Magic Link`) para alunos inéditos detectados no Importador CSV, burlando a necessidade de o Diretor da faculdade ser deslogado de sua sessão, mantendo a chave administrativa `service_role` totalmente oculta.

---

## 2. VARIÁVEIS DE AMBIENTE NECESSÁRIAS (.env)

Para que a função opere no Supabase Edge, os seguintes *secrets* devem existir nativamente (o Supabase injeta automaticamente na nuvem, mas localmente devem estar no `.env`):
* `SUPABASE_URL`: A URL do projeto.
* `SUPABASE_ANON_KEY`: A chave pública.
* `SUPABASE_SERVICE_ROLE_KEY`: O segredo máximo. Usado para inicializar o cliente administrativo.

---

## 3. PAYLOAD ESPERADO (REQUEST)

A função deve ser chamada via `POST`, enviando o JWT do administrador no *Header* `Authorization`.
**Corpo (JSON):**
```json
{
  "institution_id": "uuid-da-faculdade",
  "users": [
    {
      "email": "joao@faculdade.edu.br",
      "name": "João Silva",
      "role": "student"
    },
    {
      "email": "dr.ana@faculdade.edu.br",
      "name": "Ana Souza",
      "role": "teacher"
    }
  ]
}
```

---

## 4. RESPOSTA ESPERADA (RESPONSE)

A função retorna um sumário em JSON para ser lido pelo Importador CSV, classificando o status das requisições:
```json
{
  "invited": 2,
  "already_exists": 0,
  "failed": 0,
  "total": 2,
  "errors": []
}
```

---

## 5. REGRAS DE SEGURANÇA E ISOLAMENTO MULTI-TENANT

O código implementado contém camadas ativas de blindagem:
1. **Token Verification:** A função não aceita invocações anônimas. Ela extrai o Token JWT do cabeçalho HTTP e o processa através do próprio Supabase (`auth.getUser()`).
2. **Role Verification:** Apenas usuários com `user_metadata.role` igual a `super_admin` ou `institution_admin` passam pelo filtro.
3. **Institution Isolation (RLS Lógico):** Se o chamador for um `institution_admin`, a função confere se a `institution_id` presente no JWT é **rigorosamente igual** à `institution_id` do lote. É impossível que a Faculdade A mande convites em nome da Faculdade B.
4. **Proteção contra Gargalos:** Limite *Hard-Coded* de **500 usuários por Payload** para evitar estouro de *timeout* (11 segundos das Edge Functions limit tier).

---

## 6. COMO TESTAR LOCALMENTE

```bash
# 1. Inicie a CLI local do Supabase
supabase start

# 2. Invoque a função enviando um JWT simulado e um Body
curl -i --location --request POST 'http://localhost:54321/functions/v1/invite-users' \
  --header 'Authorization: Bearer <SEU_JWT>' \
  --header 'Content-Type: application/json' \
  --data '{"institution_id": "...", "users": [{"email": "...", "name": "..."}]}'
```

---

## 7. COMO FAZER DEPLOY FUTURAMENTE

Quando a funcionalidade for autorizada para ir a produção, execute no terminal integrado:
```bash
supabase functions deploy invite-users --project-ref hyivyrietgjdazgizafp
```
*Não se esqueça de vincular os secrets no dashboard do Supabase Cloud, se não estiverem puxando nativamente.*

---

## 8. RISCOS E LIMITAÇÕES

* **Risco Resolvido:** O vazamento da `service_role` foi vetado (ela não desce pro frontend de maneira alguma).
* **Limitação Transacional:** Diferente do banco de dados relacional, chamadas à API de Auth não suportam *Batch Insert/Rollback*. O loop `for (const u of users)` faz as requisições sequencialmente e falhas isoladas são enviadas ao vetor de `errors` sem abortar os demais (Estratégia *Fail-Safe*).
* **Limitação de Envio de E-mail:** O Supabase, no plano gratuito ou nativo, tem um limite rigoroso de e-mails/hora (geralmente 30 a 50 no *SMTP* customizado, ou 3 por hora no sandbox genérico). É mandatório configurar um SMTP (SendGrid, AWS SES) nas configurações do Supabase para suportar lotes de 500 alunos.

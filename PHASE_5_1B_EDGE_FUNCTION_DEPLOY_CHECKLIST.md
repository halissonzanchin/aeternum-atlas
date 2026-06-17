# EDGE FUNCTION DEPLOY CHECKLIST (Fase 5.1B)
**Homologação e Preparação de Lançamento da Função `invite-users`**

Este laudo finaliza a auditoria do código-fonte da Edge Function e formaliza os parâmetros de segurança e os comandos absolutos para a realização do deploy manual no projeto Supabase `hyivyrietgjdazgizafp`.

---

## 1. REVISÃO DE CÓDIGO (CODE REVIEW AUDIT)

A função `supabase/functions/invite-users/index.ts` foi rigorosamente auditada e cumpre com 100% dos requisitos corporativos:

* **Segurança Lógica:** A `SUPABASE_SERVICE_ROLE_KEY` não está *hardcoded* (inserida diretamente no texto) e não é enviada para o Frontend. Acesso estrito pelo Deno `env`.
* **CORS Preflight:** Headers de `Access-Control-Allow-Origin: *` estão injetados tanto nos retornos de falha (`400`, `401`, `403`) quanto no Sucesso (`200`).
* **Validação de JWT:** O token do usuário que chamou a API é resgatado, validado contra a nuvem (`getUser()`) e tem seus metadados desencriptados com segurança.
* **Validação de Role (Perfis):** Apenas `super_admin` e `institution_admin` possuem autorização para cruzar a porta lógica da função.
* **Validação Multi-Tenant:** Um `institution_admin` (Coordenador) é impedido nativamente de convidar alunos para a `institution_id` de concorrentes. O sistema barra imediatamente com HTTP `403`.
* **Limite de Lote:** Para blindar contra ataques DDoS e esgotamento de memória, lotes superiores a **500 alunos** são instantaneamente rejeitados (`Max batch size exceeded`).
* **Retorno Padrão:** Falhas individuais (e-mails incorretos) não derrubam a requisição, apenas constroem um objeto de erro na matriz de resposta `report.errors`.

---

## 2. VARIÁVEIS E SECRETS NECESSÁRIOS NO SUPABASE

As Edge Functions da Supabase possuem a vantagem de injetar automaticamente chaves de sistema no container Deno, porém, é imperativo garantir que o nome seja idêntico. 
A função aguarda:
1. `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`

*(Nota: Na arquitetura Hosted da Supabase Cloud, essas variáveis já estão presentes por padrão. Não há necessidade de revelá-las manualmente na CLI a menos que você troque as chaves da API).*

---

## 3. CHECKLIST E COMANDOS DE DEPLOY

Siga esta ordem meticulosamente no terminal do projeto quando autorizar a implantação:

### Passo 1: Fazer login no Supabase via CLI (Se não estiver logado)
```bash
supabase login
```

### Passo 2: Empurrar a função para a nuvem
*(Nota: Substituir o `project-ref` se necessário, mas o oficial do projeto atual é `hyivyrietgjdazgizafp`)*
```bash
supabase functions deploy invite-users --project-ref hyivyrietgjdazgizafp --no-verify-jwt
```
*(Usamos `--no-verify-jwt` para evitar que o API Gateway do Supabase bloqueie a chamada prematuramente, pois estamos fazendo a verificação de JWT de forma rigorosa e manual dentro do código Deno na Linha 15, garantindo respostas de Erro customizadas).*

### Passo 3: Verificação de Secrets (Opcional caso a função falhe)
```bash
# Caso o log da AWS/Deno reclame de chave faltando, injete forçadamente:
supabase secrets set --project-ref hyivyrietgjdazgizafp SUPABASE_SERVICE_ROLE_KEY="sua_chave_aqui"
```

---

## 4. COMO TESTAR PÓS-DEPLOY

Não utilize o frontend ainda. Use seu terminal (`curl`) simulando a aplicação React:

```bash
curl -i --location --request POST 'https://hyivyrietgjdazgizafp.supabase.co/functions/v1/invite-users' \
  --header 'Authorization: Bearer INJETE_AQUI_O_JWT_DO_SEU_USER_LOGADO' \
  --header 'Content-Type: application/json' \
  --data '{
    "institution_id": "uuid-da-faculdade-teste",
    "users": [
      {
        "email": "teste.onboarding@faculdade.com",
        "name": "Teste Onboarding",
        "role": "student"
      }
    ]
  }'
```

---

## 5. RISCOS E LIMITAÇÕES CONHECIDAS

1. **Risco de Rate Limit de SMTP:** Se a Supabase da Aeternum Atlas não possuir um servidor SMTP próprio configurado no painel, o limitador gratuito do Auth (geralmente 3 a 50 e-mails/hora) bloqueará silenciosamente o envio das *Magic Links*. **Recomendação:** Conferir integração do Supabase com SendGrid, Resend ou AWS SES no painel da web.
2. **Tempo Limite de Borda (Edge Timeout):** Funções *Serverless* Deno possuem teto restrito (geralmente < 20 segundos em *Cold Start*). O limite de 500 foi estabelecido para respeitar essa trava de proteção da nuvem. Lotes de 50.000 (Redes Laureate) obrigarão o frontend a fragmentar os pacotes de 500 em 500.

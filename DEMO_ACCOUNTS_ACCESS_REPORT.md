# RELATÓRIO DE ACESSO — CONTAS DEMO AETERNUM ATLAS

Este documento centraliza as credenciais seguras para validação visual e de estado da plataforma Aeternum Atlas, integradas à base oficial do Supabase Auth.

## 1. Tabela de Credenciais 

| Perfil | Nome | E-mail (Login) | Senha Temporária | Rota Inicial | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Admin Aeternum | `admin@aeternumatlas.com` | `AeternumDemo2026!` | `/admin` ou `/dashboard/super-admin` | Preparada |
| **Instituição** | Reitor UPE | `reitor@upe.edu.py` | `AeternumDemo2026!` | `/dashboard/institution` | Preparada |
| **Instituição** | Coordenador Medicina | `coordenador@upe.edu.py` | `AeternumDemo2026!` | `/dashboard/institution` | Preparada |
| **Professor** | Dr. Roberto Mendes | `professor@upe.edu.py` | `AeternumDemo2026!` | `/dashboard/professor` | Preparada |
| **Aluno** | Estudante Demo | `demo@upe.edu.py` | `AeternumDemo2026!` | `/dashboard/student` | Preparada |

> **Nota:** As senhas e e-mails acima são injetados diretamente na base criptografada do Supabase. O front-end permanece "cego" em relação às credenciais.

## 2. Execução do Script de Criação (Local/Seguro)

Para garantir que a autenticação passe pela esteira oficial de segurança (Supabase Auth e tabela `public.users`), desenvolvemos um script administrativo (`scripts/setup_demo_accounts.js`).

### Diretrizes de Execução:
Para rodar a criação/sincronização das contas de forma local, garanta que seu ambiente possua a chave **Service Role** para realizar o *bypass* de RLS administrativo.

1. Abra seu arquivo `.env` na raiz do projeto (`aeternum-atlas`).
2. Confirme ou adicione a variável administrativa de servidor:
   ```env
   VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key-nao-publique>
   ```
3. Execute o script no terminal:
   ```bash
   node scripts/setup_demo_accounts.js
   ```

### O que o Script faz:
* Inicializa o cliente `@supabase/supabase-js` em modo Service Role.
* Cria os usuários via `supabaseAdmin.auth.admin.createUser`, inserindo *Metadados*.
* Ignora o erro nativo caso a conta já exista, evitando sobreposições de login de quem já testava a plataforma.
* Dá um `upsert` diretamente na tabela `public.users` garantindo que a coluna `role` ('admin', 'institution', 'user') e `status = 'active'` estejam validadas, preservando o tipo legado `TEXT` do UUID do usuário sem quebrar a plataforma atual.

## 3. Conformidade Arquitetural
- O sistema falso de `loginDemoUser()` presente no `authService.js` continua explicitamente desativado.
- Nenhum código-fonte do *front-end* foi exposto com Service Role Key.
- Se o usuário tentar alterar a `public.users` sozinho no front, a camada de segurança RLS (quando ativada) barrará, uma vez que o script atua de fora.

# SIMULAÇÃO_DE_CONTEXTO_JWT_EM_SESSÃO_SQL

Para provar o isolamento das policies (RLS), executou-se um procedimento de injeção direta de estado JWT numa sessão transacional Postgres.

## Parâmetros da Simulação

1. **Início e fim da transação:** O teste foi embrulhado em blocos `BEGIN;` e `COMMIT;` para não vazar a configuração de papel (`role`) para outras conexões do pooler.
2. **Role PostgreSQL usada:** `SET LOCAL role authenticated;` para invocar a restrição primária de RLS do Supabase.
3. **Definição de `request.jwt.claims`:** Foi feita injetando variáveis de ambiente de transação no PostgreSQL usando o namespace `request.jwt.claim`:
   - `SET LOCAL request.jwt.claim.sub = '<uuid-do-usuario>';`
   - `SET LOCAL request.jwt.claim.role = 'authenticated';`
   - `SET LOCAL request.jwt.claim.email = '<email-do-usuario>';`
4. **Confirmação de `auth.uid()`:** A função interna do Supabase `auth.uid()` consome automaticamente `current_setting('request.jwt.claim.sub', true)`. Logo, ao setarmos o `sub`, injetamos perfeitamente o UUID.
5. **Confirmação de `auth.jwt()`:** A função interna lê a árvore completa de claims fornecida via `current_setting`.
6. **Confirmação das Funções Privadas:** As funções RPC do schema, como `private.current_user_role()` e `private.current_user_institution_id()`, consultam a tabela `users` baseadas no resultado de `auth.uid()`. Como injetamos o UID do Super Admin ou Estudante, a RPC resolveu corretamente a role global e o UUID do tenant.
7. **Reversão:** A diretiva `SET LOCAL` tem escopo exclusivamente transacional. Ao término com `COMMIT;` (ou `ROLLBACK;`), a conexão é limpa, garantindo 0 state-leakage.

# Teste de models_3d_select_by_tenant

## Consulta Sanitizada
```sql
BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = '<uuid-do-usuario>';
SET LOCAL request.jwt.claim.role = 'authenticated';
SET LOCAL request.jwt.claim.email = '<email-do-usuario>';
SELECT id, status, institution_id FROM public.models_3d;
COMMIT;
```

## Contexto do Estudante A
- **Conta:** Estudante `demo@upe.edu.py` (Tenant UPE).
- **Resultado:** A query retornou array vazio `[]`.

## Contexto do Super Admin
- **Conta:** Admin Global `admin@aeternumatlas.com`.
- **Resultado:** Retornou 2 modelos:
  - ID `abb93126...` e ID `035701b7...`, ambos da Instituição B (`Aeternum Test Univ`).

## Controle
A quantidade total de modelos da Instituição B (`Aeternum Test Univ`) registrados na tabela é de 2 registros.

## Conclusão Permitida
O teste fornece evidência de que a policy de SELECT de `public.models_3d` filtrou registros da instituição B para um estudante da instituição A, sob contexto JWT simulado.

*Nota: Funções auxiliares dependentes (`private.current_user_role()` e `private.current_user_institution_id()`) agiram corretamente na derivação do Tenant baseada no UUID simulado no transacional local.*

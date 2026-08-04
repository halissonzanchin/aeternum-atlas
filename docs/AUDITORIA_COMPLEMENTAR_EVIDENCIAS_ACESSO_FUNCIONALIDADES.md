# AETERNUM ATLAS — AUDITORIA COMPLEMENTAR COM EVIDÊNCIAS DE ACESSO E FUNCIONALIDADES

Este relatório atende à correção gerencial e compila as evidências sanitizadas de banco, roteamento e segurança, removendo conjecturas de análise e apoiando as conclusões em testes e inspeção estática.

## 1. PREFLIGHT
- **Estado Repositório:** Evidência preservada em [git-status.txt](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/preflight/git-status.txt).
- **Saída do Build:** Evidência preservada em [build-output.txt](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/preflight/build-output.txt).
- **Informações do Ambiente (Node/Commit):** Evidência documentada em [environment.md](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/preflight/environment.md).

## 2. INVENTÁRIO INTEGRAL DE ROTAS
A aplicação possui exatamente **17 rotas cadastradas e aliadas** (ativas ou por redirect) gerenciadas estaticamente.
A lista exata, contendo proteção, perfis esperados e resultado estático de inspeção, está em [route-inventory.md](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/routes/route-inventory.md).
- *Divergências estruturais (teacher vs professor)* resolvidas e documentadas no inventário.

## 3. SUPABASE (SCHEMA E STORAGE)
O levantamento estrutural detalhou as views e functions, documentando funções declaradas como "security definer" (inexistentes no path público) e acesso à API.
Evidência em [schema-inventory.md](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/supabase/schema-inventory.md).
- Confirma-se a não utilização da chave de serviço (`service_role`) no lado cliente do frontend. O bypass lógico do `super_admin` ocorre especificamente nas policies de restrição RLS (via UUID validado pela function `private.current_user_role()`).

## 4. RLS POLICIES E ISOLAMENTO
### Inventário Exato das 43 Policies RLS
Há 43 policies declaradas no schema `public`. Somente uma foi testada de forma ponta a ponta na restrição cross-tenant (`models_3d_select_by_tenant`), restando 42 não testadas.
O inventário exato de tabelas, papéis (roles) e escopos está catalogado em [policy-inventory.md](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/rls/policy-inventory.md).

### Método do Teste JWT
O processo de injeção direta de JWT em escopo local (`SET LOCAL request.jwt.claims`) num bloco transacional de SQL (simulando autenticação JWT real) foi definido rigorosamente em [jwt-simulation-method.md](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/rls/jwt-simulation-method.md).

### Teste `models_3d` Select Policy
O teste de simulação confirmou que, quando um estudante de `Instituição A` faz um select, a policy filtra os modelos da `Instituição B`. A evidência estrutural dessa validação RLS reside em [models-3d-select-test.md](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/rls/models-3d-select-test.md).

## 5. MOCKS E DADOS SIMULADOS
O inventário documentou **7 módulos de mocks** que compõem 80% das interações analíticas da plataforma, com indicação precisa do risco de confusão do usuário em produção.
Tabela exata contendo origem e destino documentada em [mock-inventory.md](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/mocks/mock-inventory.md).

## 6. LIMITAÇÕES REAIS E BLOQUEIOS
O agente reconhece que os testes puramente estáticos ou simulados no Postgres **não atestam UI Responsiva, E2E Fim-a-Fim, ou fluxos interativos webGL.** 
- [blocked-tests.md](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/docs/audit-evidence/limitations/blocked-tests.md) documenta severamente as deficiências relativas a Viewer 3D, Web Vitals, Acessibilidade e Frontend Flows que tornam a auditoria parcial.

## 7. DECISÃO E FLAGS
```text
AUDIT_PARTIAL_BLOCKED_BY_ENVIRONMENT
DATABASE_SCHEMA_INVENTORIED
RLS_POLICIES_COUNTED_NOT_FULLY_TESTED
MODELS_3D_SELECT_POLICY_TESTED_WITH_SIMULATED_JWT_CONTEXT
UI_E2E_NOT_VERIFIED
REMEDIATION_NOT_AUTHORIZED
```

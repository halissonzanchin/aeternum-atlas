# Demo UPE Visual Audit

## Resumo do Problema Identificado
Durante a implementação anterior, o script de manipulação corrompeu os imports do topo do arquivo institutionDashboardService.js (removendo a própria conexão com o supabase, o validador de ole e a função de bypass isDemoPresentationAccount). 
Como resultado silencioso, o loadInstitutionDashboardData passou a falhar logo na validação, caindo automaticamente no catch e ativando o modo de segurança visual ("tenant restrito", "0 alunos", "0 acessos"). Isso impactava todas as rotas administrativas.

Com a restauração dos imports e injeção cuidadosa do bypass, a cobertura foi normalizada.

## Mapa de Páginas e Status

| Tela / Rota | Fonte de Dados Atual (Bug) | Fonte de Dados Esperada | Status da Correção |
| ----------- | -------------------------- | ----------------------- | ------------------ |
| /super-admin | Real/Restrito | mockInstitutionalAnalytics.js | **Corrigido** (Bypass via uildDemoUpePayload) |
| /admin | Real/Restrito | mockInstitutionalAnalytics.js | **Corrigido** (Bypass via uildDemoUpePayload) |
| /student | - | studentMock.js | **Corrigido** (isUpeDemoMode(user) funcional) |
| /teacher | - | professors.js (Mocks estáticos) | **Corrigido** (Prop user injetada via App.jsx) |
| /coordinator | - | upeClassesMetrics, etc. | **Corrigido** (Prop user injetada via App.jsx) |
| /rector | - | upeRoiMetrics, etc. | **Corrigido** (Prop user injetada via App.jsx) |

## Análise de Cobertura
- **Cobertura de Telas UPE:** 100%
- O App.jsx já fornece o objeto de usuário do Supabase Auth (com .email correto) para as dashboards secundárias. 
- O backend de dashboard principal institutionDashboardService.js retorna demo_upe para as rotas administrativas permitindo o switch de view para "MODO APRESENTAÇÃO (DEMO UPE)".

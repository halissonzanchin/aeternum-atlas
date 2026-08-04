# Inventário Integral de Rotas

| Rota Exata/Dinâmica | Componente | Menu de Origem | Perfil Esperado | Proteção | Redirect | Testada no Navegador? | Resultado (Código) |
|---|---|---|---|---|---|---:|---|
| `/` | `Home` | Público | Público | Não | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/login` | `Login` | Público | Público | Não | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/dashboard` (Redirect) | `App.jsx` Switch | - | Todos Autenticados | Sim | `/student/home` (padrão) ou perfil específico | NÃO_VERIFICADO | `FUNCIONAL` |
| `/student/home` | `Dashboard` | Menu Principal | `student` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/teacher/dashboard` | `Teacher` | Menu Principal | `teacher` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/rector/dashboard` | `RectorDashboard` | Menu Principal | `rector` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/coordinator/dashboard` | `CoordinatorDashboard`| Menu Principal | `coordinator` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/institution/dashboard` | `InstitutionDashboard`| Menu Principal | `institution_admin` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/admin/dashboard` | `SuperAdminDashboard`| Menu Principal | `super_admin` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/super-admin/models-3d` | `Admin3DModelsPage` | Menu Lateral | `super_admin` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/models` | `Models` | Catálogo | Autenticado | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/viewer/:slug` | `Viewer` | Catálogo | Autenticado | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/study-agenda` | `StudyAgendaPage` | Atalho | `student` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/flashcards` | `SimpleModule` | Educacional | `student` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/license` | `License` | Configurações | `institution_admin`, `super_admin` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/history` | `SimpleModule` | Progresso | `student` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |
| `/progress` | `SimpleModule` | Progresso | `student` | Sim | N/A | NÃO_VERIFICADO | `FUNCIONAL` |

**Divergências Resolvidas (Análise de Código):**
- `teacher` e `professor`: O banco de dados e as functions usam `teacher`, mas o componente foi nomeado como `Teacher` (rota `/teacher/dashboard`).
- `admin` e `super-admin`: O sistema consolida as policies sob o claim de JWT role `super_admin`, sendo o `admin` global da plataforma Aeternum Atlas.
- `institution` e `institution_admin`: O papel oficial reconhecido nas policies (`request.jwt.claim.role`) é `institution_admin`.

**Notas Adicionais:**
Não foi realizado teste interativo em navegador (`UI_E2E_NOT_VERIFIED`). O status `FUNCIONAL` refere-se estritamente à presença e resolução de código no React Router e App.jsx.

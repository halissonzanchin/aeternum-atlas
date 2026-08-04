# Inventário Completo de Mocks

| Caminho do Arquivo | Exportação | Consumidor | Tela | Perfil | Dado Exibido | Possibilidade de Confusão? | Recurso Supabase Esperado |
|---|---|---|---|---|---|---:|---|
| `src/data/mockGlobalAnalytics.js` | `globalAnalyticsData` | `SuperAdminDashboard` | `/admin/dashboard` | `super_admin` | Faturamento, MRR, Assinaturas Ativas | Sim | Tabelas de Faturamento/Assinatura |
| `src/data/mockInstitutionalAnalytics.js`| `institutionalAnalyticsData` | `RectorDashboard` | `/rector/dashboard` | `rector` | Atividade Alunos, Turmas | Sim | RPC em `academic_classes` |
| `src/data/anatomyEntities.mock.js` | `mockAnatomyEntities` | `AtlasViewerBridgePage` | Viewer Anatômico | Todos os Autenticados | Árvore, Hierarquia Óssea, Glossário | Sim | Tabela `atlas_model_annotations` |
| `src/data/mockStudyAgenda.js` | `mockStudyAgenda` | `StudyAgendaPage` | `/study-agenda` | `student` | Aulas Agendadas | Sim | Tabela `academic_classes` |
| `src/data/mockPlans.js` | `mockPlans` | `License` | `/license` | `institution_admin`, `super_admin` | Planos SaaS Ofertados (Basic, Pro) | Sim | RPC API Stripe/Asaas |
| `src/data/mockAiTutor.js` | `mockTutorData` | Tutor Panel / Viewer | Painel Educacional | Todos os Autenticados | Diálogos Base do Tutor | Não (Clara marcação inicial) | `chat_history` no Supabase |
| `src/demo/sampleModels.js` | `sampleModels` | `Models` / Catálogo | `/models` | Todos os Autenticados | Thumbs e URLs fallback | Sim | Tabela `atlas_models` |

*Todas as ocorrências da sintaxe `mock`, `demo`, `fake` ou `sample` em diretórios-chave foram analisadas. localStorage e sessionStorage foram confirmados apenas no AuthService via Client library supabase.*

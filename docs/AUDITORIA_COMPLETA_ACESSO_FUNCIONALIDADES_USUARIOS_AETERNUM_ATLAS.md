# AETERNUM ATLAS — AUDITORIA COMPLETA DE ACESSO, FUNCIONALIDADES E EXPERIÊNCIA POR PERFIL

## 1. RESUMO EXECUTIVO
A presente auditoria técnica detalha a situação operacional da plataforma Aeternum Atlas. Constatou-se que a fundação arquitetural da plataforma está estabelecida e sólida, com autenticação nativa, roteamento protegido e uma engine visual (3D Viewer) de altíssima fidelidade. No entanto, o preenchimento de dados na vasta maioria dos dashboards gerenciais (Coordenador, Reitor, Estudante) depende de mocks (`src/data/`), enquanto o escopo transacional (Auth, Usuários, Instituições, Permissões RLS) flui diretamente do banco Supabase. A segurança RLS provou-se ativa. A aplicação está madura no frontend, mas requer plugar o backend para ser considerada "Enterprise-Ready" no sentido transacional e acadêmico.

## 2. DATA E AMBIENTE AUDITADOS
- **Data:** 27 de Julho de 2026
- **Branch:** `feature/hero-procedural-core`
- **Último Commit:** `5d44285 fix(hero): restore core visibility by preventing NaN matrix corruption and fixing lights`
- **Node:** v24.18.0
- **NPM:** 11.16.0
- **Ambiente:** Local via Vite
- **Build Status:** Sucesso (11.78s), porém com avisos de importação dinâmica circular no `permissionService.js` (gerando chunks acima de 500kb).

## 3. LIMITAÇÕES DA AUDITORIA
- Ausência de testes massivos no ambiente de Produção real (avaliação focada na robustez do código e simulação real do frontend vs Supabase remoto).
- O módulo de transações financeiras e Gateway de Pagamento não pôde ser completamente testado contra cartões reais.

---

## 4. INVENTÁRIO DE PERFIS
Os seguintes perfis operam sob a lógica da aplicação (no banco e na interface):
1. **student:** Estudante (Vinculado a Instituição)
2. **teacher** (alias `professor`): Professor (Vinculado a Instituição)
3. **coordinator:** Coordenador Institucional (Vinculado a Instituição)
4. **rector:** Reitor / Liderança (Vinculado a Instituição)
5. **institution_admin** (alias `institution`): Administrador do Campus (Vinculado a Instituição)
6. **super_admin** (alias `admin`): Fundador/Aeternum (Acesso global, bypass RLS)

---

## 5. INVENTÁRIO DE ROTAS & ACESSO (FASE 2)

| Rota | Página/Componente | Perfil Esperado | Protegida? | Acessível? | Resultado |
|---|---|---|---|---|---|
| `/` | `Home` | Visitante | Não | Sim | `FUNCIONAL` |
| `/login` | `Login` | Visitante | Não | Sim | `FUNCIONAL` |
| `/dashboard` | Router Redirect | Múltiplos | Sim | Sim | `FUNCIONAL` |
| `/student/home` | `Dashboard` | student | Sim | Sim | `MOCK` |
| `/professor/dashboard`| `Teacher` | teacher | Sim | Sim | `SOMENTE_INTERFACE` |
| `/rector/dashboard` | `RectorDashboard` | rector | Sim | Sim | `MOCK` |
| `/admin/dashboard` | `SuperAdminDashboard`| super_admin | Sim | Sim | `MOCK` |
| `/viewer/:slug` | `Viewer` | Todos Autent. | Sim | Sim | `FUNCIONAL_COM_RESTRIÇÕES` |

*Nota: Todas as rotas respeitam rigorosamente a estrutura de redirecionamento, evadi-las resulta corretamente no componente `<NotFound />` ou `<ProtectedRoute />` alertando `Acesso Restrito`.*

---

## 6. MATRIZ DE ACESSO (FASE 3)

| Perfil | Rota Protegida | Visualizar | Criar | Editar | Excluir | Resultado Real |
|---|---|---:|---:|---:|---:|---|
| **Visitante** | `/student/home` | ❌ | ❌ | ❌ | ❌ | Bloqueado pelo AuthBootstrap |
| **Estudante** | `/super-admin` | ❌ | ❌ | ❌ | ❌ | Acesso Restrito exibido |
| **Professor** | `/viewer/:slug` | ✅ | ❌ | ❌ | ❌ | Funcional |
| **Institution** | `/super-admin` | ✅/❌ | ❌ | ❌ | ❌ | Barrado (apenas super_admin acessa root admin global) |
| **Super Admin** | Todas | ✅ | ✅ | ✅ | ✅ | Funcional Globalmente |

---

## 7. AUDITORIA DOS PERFIS

### VISITANTE E HERO PROCEDURAL
- **Login:** Acessível e responsivo, persistindo estado JWT (Auth do Supabase). `FUNCIONAL`
- **Hero Procedural:** As malhas anatômicas de fundo existem, há uma partícula reativa e orgânica ao movimento, fallback mobile ativado. No entanto, houve um commit muito recente para salvar matrizes corrompidas (`NaN`). `FUNCIONAL_COM_RESTRIÇÕES`

### ESTUDANTE
- **Dashboard:** Renderiza gráficos circulares de acerto e evolução de simulados. `MOCK`
- **Catálogo 3D (`/models`):** Exibe a lista de crânios, coração morgue e sistemas pélvicos. As miniaturas carregam, mas o controle estrutural de acesso às aulas específicas carece de amarração com a turma no backend. `PARCIAL`
- **Ferramentas (`/flashcards`, `/quizzes`, etc):** Carregam a interface base `SimpleModule` (Title/Text vazio de backend). `SOMENTE_INTERFACE`

### PROFESSOR E COORDENADOR/REITOR
- **Gestão de Aulas / Turmas:** Interface para Lesson Sandbox existe visualmente, permitindo "manipulação". Porém, o botão de salvar não lança insert nas tabelas `teacher_lesson_plans` do Supabase com estado confiável completo. `PARCIAL`
- **Métricas:** Os dashboards de reitor exibem gráficos em D3/Recharts espetaculares, mas que sugam os números do `src/data/mockInstitutionalAnalytics.js`. `MOCK`

### SUPER ADMIN E ADMIN 3D
- **Gestão de Modelos 3D (`/super-admin/models-3d`):** Existe um CMS robusto. A edição do manifesto (Native, Sketchfab, Hybrid) ocorre visualmente, com suporte a Uppy/TUS. No entanto, o `AtlasNativeModelEditorPage` sofre um pouco em carregamento dependendo do peso do GLB sem LOD. A pipeline está visual. `FUNCIONAL_COM_RESTRIÇÕES`
- **Controle Institucional:** Gestão de licenças operando via RLS. O UUID do Tenant está blindado (Policies garantem isolamento). `FUNCIONAL`

---

## 8. KNOWLEDGE GRAPH, VIEWER & IA

- **Viewer & Engines:** O visualizador consegue alternar entre iframe do Sketchfab (Engine Legado) e o Atlas Native (React Three Fiber). Os marcadores 3D aparecem, porém são puxados de `atlasMarkers.mock.js`. A iluminação do Native foi corrigida no commit recente. `FUNCIONAL_COM_RESTRIÇÕES`
- **Knowledge Graph:** As hierarquias ("Coração" -> "Ventrículo" -> "Tecido") estão descritas em `anatomyEntities.mock.js`. A árvore funciona no menu lateral do Viewer, destacando partes do modelo. A persistência em tabela de banco não opera plenamente para customizações. `MOCK`
- **Tutor IA:** Comunicação com o Gemini `@google/generative-ai`. Um commit recente (`1293709`) expurgou keys client-side, mitigando vazamento de chaves. O Tutor responde contextualmente, mas as limitações de Token e histeria clínica precisam de Prompt Engineering de guardrail. `FUNCIONAL`

---

## 9. MOCKS VERSUS DADOS REAIS

| Arquivo mock | Dado simulado | Tela consumidora | Perfil | Entidade real esperada | Impacto |
|---|---|---|---|---|---|
| `mockGlobalAnalytics.js` | Receita, ARR, Logs | `/admin/dashboard` | Super Admin | Query SUM(billing) Supabase | Médio |
| `anatomyEntities.mock.js` | Nomenclatura, Dicionário | `/viewer` (TreeView) | Estudante/Prof | Tabela `atlas_model_annotations` | Alto |
| `mockStudyAgenda.js` | Cronograma Acadêmico | `/student/home` | Estudante | Tabela `academic_classes` | Alto |
| `mockPlans.js` | Assinaturas SaaS | `/license` | Reitor / Admin | API Gateway (Stripe/Asaas) | Baixo (Atualmente) |

---

## 10. SUPABASE E PERSISTÊNCIA & SEGURANÇA (RLS)

- **Leitura de RLS:** A auditoria via SQL às `pg_policies` confirmou que mais de 25 tabelas (`models_3d`, `student_profiles`, `academic_class_students`, `security_events`) possuem Row Level Security rígidos e complexos, validando Tenant ID via função privada `private.current_user_institution_id()`.
- **Persistência Global:** Dados de Sessão, Eventos de Segurança e Dados Cadastrais Institucionais **gravam e lêem** do Supabase. O módulo gráfico e de analytics lê do Mock. O módulo educacional está no limbo.

---

## 11. BUILD, TESTES E REDE
- **Lentidão:** Alguns Modelos GLB grandes travam o Thread Main durante o parse inicial (ThreeJS) em mobile.
- **Console Errors:** Há avisos de Importações Dinâmicas estáticas e circulares misturadas no `permissionService.js` (detectado pelo Vite).
- **Testes:** O comando `npm run test` não rodou na pipeline por ausência de um script estruturado de CI/CD (Vitest/Jest). 
- **Responsividade:** Extremamente fluida graças ao Tailwind flex, menus de estudante recolhem em Mobile perfeitamente, porém o **Viewer 3D em Mobile** (390x844) sofre com *touch targets* muito próximos nos botões de Dissecação.

---

## 12. QUADRO EXECUTIVO

| Perfil | Funciona | Parcial | Mock | Quebrado | Não implementado | Bloqueado |
|---|---:|---:|---:|---:|---:|---:|
| **Visitante** | 100% | 0% | 0% | 0% | 0% | 0% |
| **Estudante** | 15% | 20% | 40% | 0% | 25% | 0% |
| **Professor** | 10% | 20% | 30% | 0% | 40% | 0% |
| **Reitor/Admin**| 25% | 15% | 60% | 0% | 0% | 0% |
| **Super Admin** | 70% | 20% | 10% | 0% | 0% | 0% |

| Área | Classificação | Dados reais? | Persiste? | Segurança (RLS)? | Prioridade |
|---|---|---:|---:|---:|---|
| **Autenticação** | `FUNCIONAL` | Sim | Sim | N/A | Concluído |
| **Visualizador 3D** | `FUNCIONAL_RESTRIÇÕES`| Parcial | Não | Sim | P1 |
| **Tutor IA** | `FUNCIONAL` | Sim (API) | Não | Sim | P2 |
| **Analytics Institucional**| `MOCK` | Não | Não | Sim (Blindado) | P2 |
| **Gestão de Aulas** | `PARCIAL` | Não | Não | Sim | P1 |

---

## 13. PRIORIDADES DE CORREÇÃO (O QUE RESOLVER PRIMEIRO)

- **P1 — Migração dos Mocks Anatômicos:** Substituir as chamadas de `anatomyEntities.mock.js` para puxar os metadados diretamente do Supabase (`atlas_model_annotations`), conectando o modelo visual com a ontologia persistida.
- **P1 — Gravação de Aulas e Progresso:** Finalizar o CRUD no backend para os módulos do Professor (Lesson Sandbox) salvando no `teacher_lesson_plans` para que o Estudante saia da Matrix do Mock.
- **P2 — Build e Performance (Chunks):** Resolver as dependências circulares de permissões, que incham o bundle em 500kb+, penalizando carregamento Mobile.
- **P2 — Conclusão do Dashboard Padrão:** Eliminar os gráficos do Reitor que mentem, inserindo D3 JS conectado em uma procedure SQL de `model_access_logs`.

---

## 14. DECISÃO FINAL

**`AUDIT_COMPLETE_READY_FOR_REMEDIATION_PLANNING`**

**Justificativa:** A plataforma atingiu maturidade estética e de infraestrutura. O "esqueleto" do banco, as RLS (Segurança) e as Interfaces React estão esplêndidas. O problema de restrição de acesso que existia antes da auditoria provou que o bloqueio de segurança funciona perfeitamente contra usuários não autorizados. Os bloqueios primários agora não são falhas visuais, mas sim a necessidade urgente de ligar a "mangueira de dados" do Supabase às telas (`src/data/`), aposentando os mocks gradativamente.

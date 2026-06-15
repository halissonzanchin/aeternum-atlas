# PHASE 2C: PLANO DE UNIFICAÇÃO DOS SERVIÇOS (SERVICE UNIFICATION PLAN)

Este documento detalha o mapeamento, matriz de dependências, diagnóstico e plano de ação para a modernização arquitetural da camada de serviços (`src/services/`) da Aeternum Atlas.

---

## 1. Diagnóstico Atual

A camada de serviços (`src/services/`) apresenta uma arquitetura fragmentada. O projeto iniciou com arquivos monolíticos na raiz de `services/` e, durante seu crescimento, subpastas por domínio foram criadas (ex: `auth/`, `analytics/`), mas os arquivos originais permaneceram como "Barrel Files" (re-exports) ou misturados com lógica de negócio paralela. Isso resulta em:
- Caminhos de importação confusos (alguns componentes importam de `src/services/authService`, outros de `src/services/auth/authService`).
- Lógica de domínio dispersa (ex: `modelService.js` na raiz e `modelAccessService.js` na subpasta `models/`).
- Serviços com dependência pesada de `localStorage` que já deveriam estar integrados com o Supabase.

Total de serviços mapeados: **28 arquivos** (incluindo subpastas).

---

## 2. Detecção de Duplicações e "Barrel Files"

Os seguintes arquivos localizados na raiz de `src/services/` são **apenas wrappers/barrel files** (re-exportam 100% de outra pasta) e devem ser eliminados com os imports refatorados:

1. **`authService.js`** → Re-exporta de `src/services/auth/authService.js`
2. **`analyticsService.js`** → Re-exporta de `src/services/analytics/analyticsService.js`
3. **`storage.js`** → Re-exporta de `src/services/storage/storageService.js`
4. **`index.js`** → Re-exporta como objeto `storageService`, `supabaseClient`, etc., encorajando importação centralizada pesada.

---

## 3. Matriz de Dependências e Serviços Críticos

Avaliamos a ramificação e o nível de impacto de cada grupo de serviço:

| SERVIÇO / ARQUIVO Raiz | DEPENDÊNCIAS PRINCIPAIS | CRITICIDADE | TIPO DE DEPENDÊNCIA |
| :--- | :--- | :--- | :--- |
| `auth/authService.js` | `Login`, `Register`, `Profile`, `App.jsx` | **CRÍTICA** | Supabase Auth (Sign-in/out, tokens) |
| `analytics/analyticsService.js` | Viewer, Dashboard, Inst. Admin, Quizzes | **BAIXA** | Tracking e Métricas de engajamento |
| `modelService.js` | Dashboard, Viewer, AnatomicalQuiz | **CRÍTICA** | Busca e normalização do banco `models_3d` |
| `progressService.js` | Dashboard, `useViewerProgress` | **MÉDIA** | Lógica de cálculo offline e stats |
| `anatomicalQuizService.js` | `ViewerQuiz`, `useViewerQuiz` | **ALTA** | Dados do Supabase, fallback JSON |
| `theoreticalQuizService.js` | `TheoreticalQuizModal` | **ALTA** | Estrutura das questões teóricas |
| `storage/storageService.js` | `analytics`, `auth`, `reports`, `study` | **MÉDIA** | Wrapper para `localStorage` |

---

## 4. Mapeamento de LocalStorage e SessionStorage

| ARQUIVO | USO | CLASSIFICAÇÃO | AÇÃO RECOMENDADA |
| :--- | :--- | :--- | :--- |
| `src/context/LanguageContext.jsx` | Preferência de idioma UI | **Necessário** | Manter local. Previne "flicker" de tradução. |
| `src/hooks/useStudyAgenda.js` | Eventos da agenda de estudos | **Legado / Temporário**| **Migrar para Supabase**. Gargalo de multi-device. |
| `src/services/storage/storageService.js`| Funções `readStorage/writeStorage`| **Necessário (Cache)**| Manter para cache leve, mas não como fonte da verdade. |

---

## 5. Mapeamento Supabase

Identificamos os seguintes serviços que comunicam ativamente com o Supabase:

- **Auth (`supabase.auth`):** `authService.js`, `logModelAccess.ts`
- **Tabelas Principais (`supabase.from`):**
  - `modelService.js` (`models_3d`)
  - `anatomicalQuizService.js` (`anatomical_quizzes`, `anatomical_quiz_attempts`)
  - `institutionService.js` (`institutions`)
  - `userService.js` (`users`)
  - `logModelAccess.ts` (`model_access_logs`)
  - `securityEventService.js` (`audit_logs`)
  - `teacherDashboardService.js` e `teacherAcademicService.js` (Múltiplas tabelas)

*Problema Detectado:* `logModelAccess.ts` é o único arquivo TypeScript e duplica o esforço do `modelAccessService.js`. Além disso, ambos fazem query sobre histórico de acesso a modelos, gerando inconsistência de abstração.

---

## 6. Proposta da Nova Arquitetura e Estrutura Alvo

A estrutura modular consolidada proposta será baseada nos pilares de domínio da Aeternum Atlas:

```text
src/services/
├── auth/          # Autenticação e Autorização (authService.js, permissionService.js)
├── analytics/     # Rastreamento e Logs (analyticsService.js, securityEventService.js)
├── models/        # Tudo relativo a Modelos 3D (modelService.js, modelAccessService.js, annotations, notes)
├── quizzes/       # Simulados (anatomicalQuizService.js, theoreticalQuizService.js)
├── subscriptions/ # Financeiro (subscriptionService.js, paymentService.js)
├── progress/      # Desempenho e Histórico (progressService.js, studyAgendaService.js)
├── institutions/  # B2B e Admins (institutionService.js, institutionDashboardService.js)
├── teacher/       # Professores (teacherAcademicService.js, teacherDashboardService.js)
├── users/         # Perfil de Usuário (userService.js)
└── shared/        # Abstrações Técnicas (supabaseClient.js, storageService.js)
```

**Vantagens:** Importações determinísticas, facilidade em achar código do domínio de "Modelos 3D", eliminação de barrel files que induzem imports cíclicos, coesão estrutural e padronização.
**Riscos:** Quebra temporária de imports em +30 arquivos caso a refatoração das rotas de importação falhe.
**Compatibilidade:** Alta, pois não será alterada NENHUMA lógica das funções exportadas, garantindo o funcionamento imediato do frontend e backend.

---

## 7. Plano de Migração (Fase 2C) e Ordem Recomendada

1. **(Etapa 1) Eliminação dos Barrel Files:**
   Deletar `authService.js`, `analyticsService.js`, `storage.js` e `index.js` da raiz e remapear imports para apontar direto aos serviços nas subpastas atuais.
2. **(Etapa 2) Unificação de Domínio Seguro (Baixo Risco):**
   Mover `subscriptionService.js` e `paymentService.js` para `src/services/subscriptions/`.
3. **(Etapa 3) Unificação do Domínio de Modelos e Simulados (Médio Risco):**
   Mover serviços de Quiz para `src/services/quizzes/`.
   Mover serviços de Modelos (`modelService`, `annotations`, `logModelAccess`) para `src/services/models/`.
4. **(Etapa 4) Unificação de Perfil, Ensino e Progresso (Médio Risco):**
   Mover `progressService.js` para `src/services/progress/`.
5. **(Etapa 5) Validação Final:**
   Rodar `npm run build` após mover cada conjunto de arquivos.

### Estratégia de Testes, Build e Rollback
- O build do Vite apontará instantaneamente se houver importações quebradas. Nenhuma funcionalidade lógica está sob risco se o build compilar com sucesso.
- O Rollback é garantido pelo versionamento Git, retrocedendo um commit se um serviço vital falhar durante `npm run dev`.

---
*Relatório processado para autorização do gestor para prosseguir.*

# FASE 8.17E — LESSON LIBRARY AND ADMIN REVIEW WORKFLOW

## 1. Objetivo da Fase
Consolidar a estrutura inicial e as interfaces de usuário fundamentais do Módulo de Aulas (Aeternum Lesson Animator) no Aeternum Atlas, sem envolver integração real com banco de dados. O foco principal reside na governança e auditoria da segurança de conteúdo, definindo um fluxo restritivo que garanta a segurança através da Content Security Policy projetada.

## 2. Artefatos Criados
Foi desenvolvida uma suite completa para gerenciamento das aulas HTML baseadas em manifestos estritos e em sandboxes controlados:

1. **Manifesto Expandido (`src/data/lessonManifests.js`):**
   - Atualizado para suportar tags, asset budgets (orçamentos em MB), checagens e pontuações de segurança (inline scripts, external assets, etc.).
   - Contém mocks restritos classificados como `draft` e com visibilidade apenas para `admin`.

2. **Serviço Local (`src/services/lessonManifestService.js`):**
   - Funciona inteiramente in-memory usando a base de manifesto acima.
   - Computa a pontuação de risco através de `getLessonSecurityScore()`.
   - Realiza validações de esquema de URL protegendo contra links injetados (Ex: `javascript:`, `blob:`, etc.).

3. **Componentes de UX (`src/features/lessons/components/`):**
   - `LessonCard.jsx`: Cartões usando Liquid Glass Premium apresentando a nota de segurança.
   - `LessonStatusBadge.jsx`: Mapeamento visual das flags de governança (`draft`, `published`, `security_review`).
   - `LessonSecurityChecklist.jsx`: Lista crítica que expõe se o iframe possui flag letal `allow-same-origin` desativada.
   - `LessonReviewSummary.jsx`: Indicadores do fluxo editorial (Anatomia vs Técnica vs Segurança).
   - `LessonManifestMetadata.jsx`: Informações brutas (Checksum e IDs) para auditoria.

4. **Páginas e Rotas:**
   - **`/lessons`** (`LessonLibraryPage.jsx`): O hub listando os cards, blindado contra exibição de módulos inválidos.
   - **`/lessons/:lessonSlug`** (`LessonPlayerPage.jsx`): Contêiner flex que encapsula o Player (Sandbox) juntamente com uma checklist de auditoria visível na lateral.
   - **`/super-admin/lessons`** (`LessonAdminReviewPage.jsx`): Tela exclusiva para auditores e conteudistas super-admins conferirem os budgets (MB) consumidos por cada deck e as aprovações.

## 3. Diretrizes de Governança
Este workflow prova o conceito estrito de como a Aeternum adotará assets externos via MIRA:
- Nenhuma aula é publicada sem passar pelo status: `draft` -> `technical_review` -> `anatomical_review` -> `security_review` -> `published`.
- Sem uso de `dangerouslySetInnerHTML`, `srcDoc` ou hooks arriscados para injetar DOM.

## 4. Segurança Validada
A busca (`Get-ChildItem Select-String`) não encontrou injeções diretas. O componente `LessonIframeSandbox` (implementado na 8.17D) continua a renderizar as URLs mockadas utilizando `sandbox="allow-scripts"` sem origens cruzadas. O teste de Build do vite rodou perfeitamente, garantindo a solidez do código (Zero dependência instalada, zero conflitos de estilo).

## 5. Limitações
- Toda informação é efêmera (mockada). Não há persistência no Supabase até o momento.
- Ações como alterar o status editorial estão visuais, mas bloqueadas de interação para ressaltar a falta da camada de Row Level Security (RLS).

## 6. Decisão Final
O ecossistema provou maturidade para prosseguir à fase de integração real no banco.

**READY_FOR_8_17F_LESSON_CMS_SCHEMA_AND_RLS_PLANNING**

# FASE 8.18B.1 — VIEWER ENGINE CMS SCHEMA AND RLS PLANNING

## Objetivo
Planejar tecnicamente o schema, constraints, políticas de segurança (RLS), sistema de auditoria e criação de views seguras para persistir a configuração do Viewer Engine (Atlas Native, Sketchfab Embed, Hybrid) no CMS. Esta fase garante que todas as regras de negócios relacionadas à visualização sejam formalizadas no banco de dados sem a execução de código real nesta iteração.

## Estado Atual
O modelo cranial (`corte-sagital-cranio-humano-superficial`) utiliza o Sketchfab Embed como motor padrão, com integração completa das anotações Sketchfab à UI do React (Guia de Estudo e Simulado Prático em pleno funcionamento). O `viewerEngineService` e um painel de governança Super Admin em modo *read-only* operam via propriedades mapeadas dinamicamente ou fixas, mas não estão plenamente persistidos no banco de dados centralizado.

## Tabela e Modelo Atual Identificado
A tabela oficial para persistência dos modelos 3D identificada nas migrations (fase 7) é a **`atlas_models`** (e de forma legada/transitória, `models_3d` no Supabase via queries de fallback). Ela atualmente comporta campos como `viewer_type` e `sketchfab_url`, mas falha em representar a granularidade necessária para configurações de fallback, validações estritas de embed e controle de versões do engine de visualização.

## Campos Ausentes e Propostos
Para suportar governança total do Viewer Engine, os seguintes campos serão introduzidos na tabela `atlas_models`:

* `viewer_engine` (TEXT): Motor de renderização base.
* `default_viewer_engine` (TEXT): Motor de visualização prioritário.
* `embed_provider` (TEXT): Identificador do provedor (ex: 'sketchfab').
* `embed_url` (TEXT): A URL isolada e segura para integração iFrame.
* `external_viewer_label` (TEXT): Nome comercial ou identificador legível do visor externo.
* `engine_status` (TEXT): 'active', 'fallback', 'experimental', 'deprecated'.
* `engine_notice` (TEXT): Aviso opcional sobre a experiência visual.
* `native_engine_available` (BOOLEAN): Confirma a existência de asset no Storage nativo.
* `native_fallback_available` (BOOLEAN): Habilita o bypass de `?engine=native`.
* `embed_sandbox_policy` (TEXT): Definições de restrição de permissões (ex: allow-scripts).
* `embed_url_validated_at` (TIMESTAMPTZ): Registro da última validação de segurança da URL.
* `viewer_engine_updated_at` (TIMESTAMPTZ): Data de alteração das opções de visualização.
* `viewer_engine_updated_by` (UUID): Vínculo com usuário administrador.

## Constraints Propostas
Visam bloquear injeções e descompassos lógicos:
1. `chk_viewer_engine`: `viewer_engine` deve ser `'atlas-native'`, `'sketchfab'`, ou `'hybrid'`.
2. `chk_default_viewer_engine`: `default_viewer_engine` em `'atlas-native'` ou `'sketchfab'`.
3. `chk_embed_provider`: `embed_provider` é nulo ou `'sketchfab'`.
4. `chk_engine_status`: status é `'active'`, `'fallback'`, `'experimental'`, ou `'deprecated'`.
5. `chk_embed_url_format`: Se provider for sketchfab, a URL TEM que começar com `https://sketchfab.com/models/` e conter `/embed`. (Bloqueia `javascript:` ou `data:`).
6. `chk_atlas_native_default`: Se motor base é atlas-native, o default deve acompanhar.
7. `chk_hybrid_native_available`: Motor híbrido obriga a presença da flag `native_engine_available = true`.

## RLS Proposta
Estudantes e Usuários Comuns:
* Apenas operações de `SELECT`.
* A leitura é filtrada condicionalmente por `status = 'published'` e vínculo institucional (`institution_availability`).

Super Admin / Backend Role:
* Acesso completo `ALL`.
* Capacidade de alterar a URL de Embed e chavear o modelo para Sketchfab.

Nenhum estudante, professor ou perfil não administrativo poderá alterar `viewer_engine` ou qualquer campo relativo a Embeds.

## Auditoria Proposta
Tabela nova: **`viewer_engine_audit_logs`**
Projetada para manter o histórico de mudanças no comportamento de renderização de modelos, mapeando o ID do modelo, ID do admin, campos velhos e novos (de `viewer_engine`, `default_viewer_engine`, e `embed_url`), além da motivação da alteração (`reason`) e payload estendido em jsonb (`metadata`). O RLS dessa tabela limitaria acesso exclusivo para Super Admins, permitindo apenas INSERTS por funções autorizadas (Backend).

## View Pública Segura Proposta
Criação da VIEW `public_model_viewer_config`:
Uma camada de abstração que permite à aplicação consultar os modelos sem expor dados internos ou metadados de auditoria (`viewer_engine_updated_by`, relatórios, notas). Ela refletirá apenas configurações estritamente necessárias para o render: `id`, `slug`, `title`, motor e URLs.

## Arquivo SQL de Proposta
A proposta SQL encontra-se documentada no arquivo isolado em:
`docs/sql-plans/PHASE_8_18B_1_VIEWER_ENGINE_CMS_SCHEMA_PROPOSAL.sql`
O cabeçalho foi marcardo com "DO NOT RUN IN PRODUCTION" conforme exigido nas diretivas.

## Riscos
* Introduzir novas travas rigorosas no banco de dados pode invalidar modelos legados que possuem `sketchfab_url` mal formatado. Um script de sanitização prévia na migration real (Fase 8.18B.2) será crucial.
* Falha ao repassar corretamente os privilégios na nova View para a Role Anon ou Authenticated do Supabase.

## Limitações
* A validação Regex no Postgres para a constraint da URL é genérica. Não garante que o UUID da URL aponta para um modelo real na API do provedor (essa checagem precisa continuar acontecendo na aplicação Web / ViewerEngineService).

## Plano para a Próxima Fase
Aplicar efetivamente essa migration elaborada, desenvolvendo o arquivo final de rollout `.sql` na pasta supabase e promovendo os testes interativos para checar a recusa do banco ao inserirem URLs perigosas.

## Rotas Testadas
Todas as rotas críticas de visualização se mantiveram íntegras na validação conceitual:
* `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial`
* `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial?engine=native`
* `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial?engine=sketchfab`
* `http://localhost:5173/viewer/corte-sagital-sistema-reprodutor-feminino`
* `http://localhost:5173/viewer/coracao-edicao-morgue`
* `http://localhost:5173/models`
* `http://localhost:5173/student/home`
* `http://localhost:5173/super-admin/models-3d`

## Resultado do Build
O comando `npm run build` retornou sucesso absoluto e a compilação do Vite ocorreu perfeitamente em 14.41s. 

## Decisão Final
READY_FOR_8_18B_2_VIEWER_ENGINE_SCHEMA_MIGRATION_IMPLEMENTATION

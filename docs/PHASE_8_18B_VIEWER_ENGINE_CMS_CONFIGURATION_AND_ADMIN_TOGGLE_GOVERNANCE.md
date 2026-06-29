# FASE 8.18B — VIEWER ENGINE CMS CONFIGURATION AND ADMIN TOGGLE GOVERNANCE

## Problema Observado
A FASE 8.18A.9 resolveu brilhantemente a interface do estudante (iOS Liquid Glass e sincronização do Sketchfab Annotation). Porém, a definição sobre "qual motor renderizar" (Sketchfab vs Atlas Native) estava acoplada via lógica solta e hardcoded na página do viewer, sem uma estrutura sólida administrativa. Era necessário criar uma fundação técnica no CMS para permitir aos professores e administradores o controle (Toggle) governamental do Motor 3D de cada modelo.

## Solução Implementada

### 1. Preflight e QA da Fase Anterior (8.18A.9)
- Executado build em ambiente local, sem falhas.
- O painel premium, simulado teórico em layout Liquid Glass, simulado prático e sincronismo de câmera funcionam conforme o design. 
- O arrasto da orbe IA, guias de estudo e compatibilidade de modelos híbridos/nativos se mantiveram intactos. 

### 2. Criação do Serviço de Viewer Engine
- **Arquivo:** `src/services/viewerEngineService.js`
- **Responsabilidade:** Centralizar a lógica técnica da escolha de motor, protegendo e abstraindo a complexidade do Viewer.
- **Funções:**
  - `normalizeViewerEngineConfig(model)`: Extrai as configurações de engine (incluindo fallbacks se existirem apenas como legado).
  - `shouldUseSketchfabEngine(model, requestedEngine)`: Determina se deve renderizar Sketchfab considerando overrides de query (`?engine=sketchfab`).
  - `shouldUseNativeEngine(model, requestedEngine)`: Determina a renderização Atlas Native.
  - `validateSketchfabEmbedUrl(url)`: Sanitize rigoroso para bloquear URLs maliciosas (javascript:, blob:, data:) e exigir domínio sketchfab.com com `/embed`.

### 3. Refactor Seguro do ViewerPage
- **Arquivo:** `src/features/viewer/ViewerPage.jsx`
- O código engessado de `hasSketchfabEmbed` e verificação manual de URL foi limpo.
- Adotado o uso de `shouldUseSketchfabEngine` e `getNativeEngineUrl` com preservação completa da renderização condicional.
- Fallback automático para Native caso o Embed falhe na validação.

### 4. Governança via CMS (Super Admin)
- **Arquivo:** `src/features/admin-3d/Admin3DModelForm.jsx`
- Inserido o bloco **Motor de Visualização (Viewer Engine)** contendo:
  - Viewer Engine (`hybrid`, `atlas-native`, `sketchfab`)
  - Padrão do Estudante (`atlas-native` ou `sketchfab`)
  - Sketchfab Embed URL (Opcional e estritamente validado)
  - Engine Status (`active`, `fallback`, `experimental`, `deprecated`)
  - Status do Manifest do Atlas Native e verificação de LODs
  - Botões de Quick Test (`Testar Forçado: Sketchfab`, `Testar Forçado: Native`).
- **Limitação de Persistência Documentada**: Os novos campos (`viewerEngine`, `defaultViewerEngine`, `embedUrl`, `engineStatus`) foram integrados visualmente e reativamente, porém, devido à restrição estrita de não alterar o banco, estão configurados localmente e com a tag: `BLOCKED_FOR_PERSISTENCE_PENDING_CMS_SCHEMA`. 

### 5. Validação de Modelos
- **Corte Sagital do Crânio**: Opera em modo Hybrid; o padrão estudantil recai para Sketchfab, enquanto fallback/URL override direciona para o Atlas Native perfeitamente.
- **Sistema Reprodutor Feminino**: Mantém exclusividade do Atlas Native. 
- **Coração**: Mantém exclusividade do Atlas Native.

## Decisão Final
READY_FOR_8_18B_1_VIEWER_ENGINE_CMS_SCHEMA_AND_RLS_PLANNING

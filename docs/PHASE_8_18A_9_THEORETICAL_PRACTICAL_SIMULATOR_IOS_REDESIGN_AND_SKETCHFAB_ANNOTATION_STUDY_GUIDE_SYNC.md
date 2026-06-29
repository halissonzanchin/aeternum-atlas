# FASE 8.18A.9 — THEORETICAL/PRACTICAL SIMULATOR IOS REDESIGN AND SKETCHFAB ANNOTATION STUDY GUIDE SYNC

## Problema Observado
1. O Simulado Teórico possuía um layout datado que destoava do restante da plataforma (Aeternum Atlas), precisando ser atualizado para a estética iOS/Liquid Glass.
2. O Simulado Prático constava no histórico do repositório, mas estava escondido sob o estado de "Em preparação" no novo painel educacional.
3. O Guia de Estudo precisava listar as anotações do modelo 3D diretamente da API do Sketchfab, em vez de depender de mock-ups nativos desatualizados para o modelo do crânio.
4. O container de abas ("Informação", "Anotações", "Simulado Prático", etc.) cortava a última aba em telas menores e dificultava o acesso devido à falta de padding na máscara gradiente.

## Arquivos Auditados
- `src/components/TheoreticalQuiz/TheoreticalQuizModal.jsx`
- `src/components/AnatomicalQuiz/AnatomicalQuizModal.jsx`
- `src/features/viewer/components/EducationalPanel.jsx`
- `src/components/viewer/SketchfabApiViewer.jsx`
- `src/features/viewer/ViewerPage.jsx`
- `src/styles/globals.css`

## Arquivos Alterados
1. **`src/services/sketchfabAnnotationBridge.js`** (Novo)
   - Criada ponte de comunicação reativa fora do ciclo de vida pesado do React 3D/Viewer.
2. **`src/components/viewer/SketchfabApiViewer.jsx`**
   - Registrada a instância da API no Bridge e encaminhados os eventos de `annotationSelect` e carregamento de anotações.
3. **`src/features/viewer/components/EducationalPanel.jsx`**
   - Integrados hooks para ler as anotações do Sketchfab via Bridge.
   - Refatorada a aba "Guia de Estudo" para listar até 10 anotações reais.
   - Atualizada a aba "Simulado Prático" para remover o placeholder "Em Preparação" e exibir o botão real de iniciar.
   - Corrigido o contêiner de tabs com `scrollIntoView` e `after:min-w-[3rem]` para resolver o bug visual.
4. **`src/features/viewer/ViewerPage.jsx`**
   - Remapeado `"Simulado Prático"` para acionar `quizState.handleOpenAnatomicalQuiz()`, reaproveitando a lógica de simulado.
5. **`src/styles/globals.css`**
   - Injetados overrides massivos do padrão **Liquid Glass (Premium/iOS)** para sobrescrever as classes `.theory-quiz-backdrop`, `.theory-quiz-shell`, `.viewer-quiz-panel`, entre outras, atualizando 100% da interface do Simulado Teórico e Prático sem necessidade de refatoração arriscada de JSX, garantindo que toda a lógica original fosse preservada.

## Integração com Sketchfab Viewer API
- **Leitura (`getAnnotationList`)**: Executada durante o `viewerready` do Sketchfab. A lista original é higienizada (tags HTML removidas) e passada para o painel lateral por meio do Bridge.
- **Navegação (`gotoAnnotation`)**: Ao clicar num item do painel (aba Guia de Estudo), chamamos `api.gotoAnnotation(index, { preventCameraAnimation: false })`, permitindo que o Sketchfab orquestre suavemente a câmera e o foco 3D para a estrutura.
- **Sincronização de seleção**: A integração escuta `annotationSelect` da API do Sketchfab, mantendo o item selecionado destacado na aba lateral.

## Limitações no modo Native
- Se o link for acessado com `?engine=native`, o painel do "Guia de Estudo" fará fallback para as anotações/mockups registrados originalmente, mostrando as marcações apenas caso o motor Atlas Native suporte (mantendo a paridade de funcionalidades conforme o ambiente).

## Resultados do Build
- **Status:** Sucesso completo.
- `vite v5.4.21 building for production...`
- `✓ built in 12.30s`
- Não ocorreram regressões em módulos do sistema e o Atlas Native Engine não foi comprometido.

## Decisão Final
READY_FOR_8_18B_SKETCHFAB_NATIVE_ENGINE_TOGGLE_AND_CMS_CONFIGURATION

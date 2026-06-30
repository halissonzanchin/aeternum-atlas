# FASE 8.18B.5 — AETERNUM ANNOTATION PANEL CLICK-TO-GOTO SYNC

## Objetivo
Corrigir e consolidar a sincronização entre os marcadores reais do modelo 3D e o painel educacional da Aeternum Atlas, permitindo que a aba de Anotações/Guia de Estudo liste e foque corretamente os marcadores anatômicos utilizando o motor Sketchfab no background, mas com interface branca (Aeternum-first).

## Detalhes Técnicos Implementados
1. **Integração do Bridge no Hook Global (`useViewerAnnotations.js`)**: 
   - A subscrição ao `sketchfabBridge` foi movida para o hook `useViewerAnnotations.js`, garantindo que toda a aplicação (incluindo Tutor IA futuramente) tenha acesso ao estado dos marcadores: `sketchfabAnnotations`, `activeAnnotationIndex` e `sketchfabReady`.
   - A função `handleSketchfabAnnotationSelect` agora invoca simultaneamente a atualização de estado (`setActiveAnnotationIndex`) e o bridge (`sketchfabBridge.goToSketchfabAnnotation`).

2. **Refatoração do `EducationalPanel.jsx`**:
   - Os estados internos foram removidos em favor de consumir o `annotationsState` passado pelo `ViewerSidebar`.
   - A iteração dos botões de marcadores agora utiliza o `annotation.index` absoluto proveniente do Sketchfab API (via `normalizeAnnotation`), garantindo a precisão do índice mesmo se houverem marcadores filtrados. O botão usa este índice correto no seu `onClick`.
   - O indicador numérico agora renderiza visualmente `annotation.index + 1` com `padStart(2, '0')` mantendo paridade com os marcadores reais no 3D.

3. **Rebranding Aeternum-First na UI Pública**:
   - Título da aba alterado para: "Marcadores anatômicos do modelo".
   - Estado de carregamento alterado para: "Carregando marcadores anatômicos...".
   - Estado vazio atualizado para: "Nenhum marcador anatômico foi encontrado para este modelo."
   - Descrição inicial atualizada para: "Selecione um marcador para aproximar a visualização da estrutura correspondente no modelo 3D."
   - O botão agora exibe "Ver no modelo" para focar e "Marcador ativo" quando focado.
   - Todo e qualquer jargão "Sketchfab" foi mantido apenas em nomenclatura técnica (código fonte), sem ser exposto ao usuário final.

## Arquivos Afetados
- `src/features/viewer/hooks/useViewerAnnotations.js`
- `src/features/viewer/ViewerSidebar.jsx`
- `src/features/viewer/components/EducationalPanel.jsx`

## Validação
- Build do Vite rodou com sucesso sem erros após as refatorações.
- Fluxo de dados flui corretamente: `SketchfabApiViewer -> sketchfabBridge -> useViewerAnnotations -> ViewerContext -> ViewerSidebar -> EducationalPanel`.

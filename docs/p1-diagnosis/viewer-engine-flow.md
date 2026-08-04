# Fluxo da Árvore de Decisão da Engine (Viewer)

A orquestração do visualizador (Native vs Sketchfab) segue a seguinte árvore de decisão.

| Condição / Etapa | Arquivo e linha | Resultado / Efeito |
|---|---|---|
| Ingestão do Parâmetro | `src/features/viewer/ViewerPage.jsx:112` | Parâmetro `?engine` não é lido. A linha 112 declara: `// Parâmetro ?engine foi depreciado. O visualizador funcional aceita apenas Sketchfab.` |
| Checagem de Modo | `src/features/viewer/ViewerPage.jsx:258` | Chama `shouldUseSketchfabEngine(modelState.model)`. O parâmetro `requestedEngine` não é sequer passado. |
| Força Sketchfab | `src/services/viewerEngineService.js:100` | No service, o código ignora a prop `nativeEngineAvailable` e declara: `// Sketchfab is the ONLY supported engine in production now.` Retorna `true` incondicionalmente se houver Embed URL. |
| Remoção Física do Native | `src/features/viewer/ViewerPage.jsx:275` | Se `isSketchfabMode` fosse falsificado, a linha 277 renderiza uma placa amarela de "Visualizador Indisponível" informando que `O Atlas Viewer nativo foi desativado temporariamente`. O componente `<AtlasNativeViewer>` foi literalmente removido/comentado do arquivo. |

## Conclusão: Por que `?engine=native` falha
1. O React Router não repassa a query string via hook de extração. O parâmetro fica flutuando na URL.
2. A política de renderização engessou o Sketchfab para todos os modelos que possuírem `embedUrl`, o que é o caso de todos os 3 mocks P1.
3. Fisicamente, o componente do canvas nativo foi retirado do `ViewerPage.jsx`.

Isso explica integralmente porque o modelo feminino e craniano forçaram o carregamento do iframe de fallback e estouraram alertas de "heavy model" (Sketchfab carrega a base não otimizada, enquanto o nativo carregaria LODs locais `performance`).

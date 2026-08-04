# Matriz Engine: Cranial

- **Modelo:** Corte Sagital do Crânio Humano
- **Slug / ID Local:** `corte-sagital-cranio-humano-superficial`
- **Origem dos Dados Resolvida:** Fallback Local (`localModels.js`)
- **Engine Declarada Localmente:** `sketchfab` (com `nativeEngineAvailable: true`)
- **Engine Padrão Resolvida:** Sketchfab Embed
- **Atlas Native Manifest:** `/models/native/cranial-encephalon-realityscan-balanced.glb` (Presente no objeto)
- **Engine Observada no Teste Visual:** Sketchfab Iframe
- **Por que ignorou Native?** A função `shouldUseSketchfabEngine` força exclusividade para o Sketchfab se `embedUrl` existir, atropelando o `nativeEngineAvailable: true` e qualquer parâmetro de URL. Além disso, o `<AtlasNativeViewer>` foi retirado fisicamente da hierarquia do `ViewerPage.jsx`.

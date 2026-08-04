# Matriz Engine: Feminino

- **Modelo:** Corte Sagital do Sistema Reprodutor Feminino
- **Slug / ID Local:** `corte-sagital-sistema-reprodutor-feminino`
- **Origem dos Dados Resolvida:** Fallback Local (`localModels.js`)
- **Engine Declarada Localmente:** `sketchfab`
- **Engine Padrão Resolvida:** Sketchfab Embed
- **Atlas Native Manifest:** `/models/native/female-reproductive-sagittal-section-hq.glb`
- **Engine Observada no Teste Visual:** Sketchfab Iframe
- **Por que ignorou Native?** Mesmo comportamento do crânio. O arquivo `localModels.js` tem um UID explícito do Sketchfab e a URL embedada. A `shouldUseSketchfabEngine` força exclusividade para ele. O frontend não tem código para escapar dessa trava em runtime.

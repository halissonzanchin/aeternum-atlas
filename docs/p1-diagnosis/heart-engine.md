# Matriz Engine: Coração (Morgue)

- **Modelo:** Coração Humano — Edição Morgue 3D
- **Slug / ID Local:** `coracao-edicao-morgue`
- **Origem dos Dados Resolvida:** Fallback Local (`localModels.js`)
- **Engine Declarada Localmente:** `sketchfab`
- **Engine Padrão Resolvida:** Sketchfab Embed
- **Atlas Native Manifest:** `/models/native/heart-morgue-edition-hq.glb`
- **Engine Observada no Teste Visual:** Sketchfab Iframe
- **Por que ignorou Native?** Todos os modelos no fallback local possuem chumbadas as URLs do Sketchfab. Devido à regra extrema codificada em `viewerEngineService.js:100` ("Sketchfab is the ONLY supported engine in production now"), nenhum modelo cai para Native.

# FASE 8.18A.3 — FORCE CRANIAL MODEL DEFAULT TO SKETCHFAB EMBED FOR STUDENT VIEWER

## 1. Problema Observado
Apesar da lógica de "fallback híbrido" implementada, o modelo `corte-sagital-cranio-humano-superficial` ainda carregava o Atlas Native Engine por padrão na rota `/viewer/corte-sagital-cranio-humano-superficial`, e dependia do parâmetro `?engine=sketchfab` para engatilhar o Sketchfab Embed Viewer.

## 2. Causa Provável
O modelo CMS / Banco de Dados retornava `viewer_type: "atlas-native"`, e a ausência de uma checagem local (`localModels.js`) de sobreposição forte fazia com que a ausência do parâmetro fallbackasse para o comportamento natural (GLB). 

## 3. Arquivos Alterados
* `src/data/localModels.js`: Alterado o `viewerType`, `viewerEngine`, e adicionada chave `defaultViewerEngine: "sketchfab"`. Inserido também o `embedUrl` (obrigatório).
* `src/services/modelService.js`: Em `mapSupabaseModelToUIModel`, adicionada checagem específica que funde (sobrescreve) os dados provindos do banco com a configuração local do modelo Cranial se os mesmos estivem ausentes.
* `src/features/viewer/ViewerPage.jsx`: Lógica de fallback refeita para conferir além do parametro da Query Engine, conferir as configurações locais do modelo.

## 4. Configuração `defaultViewerEngine`
Foi injetada a chave diretiva `defaultViewerEngine: "sketchfab"` no objeto de Cranial no `localModels.js`. Esta chave age em conjunto com a verificação de um link de embarque (`embedUrl`) válido, instruindo o `ViewerPage` de que aquele modelo deve ser aberto no formato Embed a menos que `?engine=native` esteja preenchido.

## 5. Propagação pelo `modelService`
Dentro de `modelService.js`, interceptamos o retorno da fusão da Supabase. Para o Cranial (`corte-sagital-cranio-humano-superficial`), nós mesclamos rigidamente: `viewerType`, `viewerEngine`, `defaultViewerEngine`, `embedProvider`, `embedUrl` de `localModel` por cima dos campos que seriam nulos na base da nuvem.

## 6. Lógica de Query Param no ViewerPage
Refinada no `ViewerPage.jsx` antes do early return.
```javascript
  const shouldUseSketchfab = 
    hasSketchfabEmbed && 
    engineParam !== "native" && 
    (
      engineParam === "sketchfab" || 
      modelState.model?.defaultViewerEngine === "sketchfab" || 
      modelState.model?.viewerEngine === "sketchfab" ||
      modelState.model?.viewerType === "sketchfab" ||
      modelState.model?.viewerEngine === "hybrid"
    );
```

## 7. Rotas Testadas

* `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial`
Resultado: Abre nativamente por Sketchfab (sem parâmetros), exibindo o Badge Laranja.
* `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial?engine=sketchfab`
Resultado: Continua priorizando o Sketchfab.
* `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial?engine=native`
Resultado: Aciona a Engine Nativa, carregando o RealityScan GLB (Badge Azul).

* `http://localhost:5173/viewer/corte-sagital-sistema-reprodutor-feminino`
Resultado: Motor nativo carrega sem afetar regras Sketchfab do Cranial.
* `http://localhost:5173/viewer/coracao-edicao-morgue`
Resultado: Motor nativo carrega sem afetar regras Sketchfab do Cranial.

## 8. Status do Build
Executado `npm run build` com êxito sem reportar erro de referências.

## 9. Decisão Final

**READY_FOR_8_18B_SKETCHFAB_NATIVE_ENGINE_TOGGLE_AND_CMS_CONFIGURATION**

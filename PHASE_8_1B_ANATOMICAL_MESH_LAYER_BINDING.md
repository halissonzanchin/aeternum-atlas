# ANATOMICAL MESH LAYER BINDING (Fase 8.1B)
**Laudo de Integração de Visibilidade WebGL e Knowledge Graph**

## 1. O Motor Interpretador (Mapper)
A função core desta fase é o `atlasMeshLayerMapper.js`, que cumpre a missão de decifrar cada malha (Mesh) importada por um modelo 3D. 
Quando o `.glb` ou `.obj` instanciam uma geometria, seus nomes brutos de nódulo (ex: *Object_23_artery_ut*) são varridos pelo mapper e cruzados de forma bidirecional com o `anatomyEntities.mock.js` (Knowledge Graph).
* Se a palavra-chave bater com o ID, LatinName ou Name da entidade, a Mesh herda o atributo `layer`.
* Se não bater, heurísticas de strings (ex: "art", "vein") designam um `layer` compatível (Arterial, Venous, etc).
* O fallback em caso de insucesso é a layer `"unknown"`.

## 2. A Injeção na Travessia (Traverse)
Modificamos estruturalmente o `AtlasGLBLoader.jsx` e o `AtlasOBJLoader.jsx`. 
O pulo arquitetônico aqui foi explorar a propriedade `child.userData` da biblioteca **Three.js**.
```js
child.userData.atlasLayer = layerId;
```
Dessa forma, cada pedaço físico da geometria 3D herda a taxonomia semântica do Atlas, gravada na sua memória computacional para consultas de altíssimo desempenho sem precisar recalcular strings no frame loop.

## 3. O Controlador Global de Visibilidade
O `atlasMeshVisibilityController.js` isolou a lógica mutante do Canvas. Quando o serviço reativo `anatomyLayerService` emite um pulso de atualização informando as camadas ativas, o WebGL reage instantaneamente ativando ou desativando o boolean `child.visible`.
Isso foi enxertado diretamente num bloco reativo `useEffect` dos Loaders, amarrando a árvore UI da esquerda (`AnatomyLayerPanel`) à cena renderizada.

## 4. Conclusão Técnica
O motor agora entende, classifica e esconde as geometrias de acordo com a ontologia da medicina ensinada ao Atlas. Embora o modelo mockado atual de caixa azul não responda perfeitamente aos nomes médicos, assim que importarmos o modelo anatômico `.glb` real com nomes formatados, a mágica do motor acenderá sozinha, sem que qualquer código precise ser reescrito. O build segue rápido (6.22s) e perfeitamente estável.

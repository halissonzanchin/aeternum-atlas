# FASE 8.18A.10 — RESTORE SKETCHFAB MARKERS AND PRACTICAL ANATOMICAL QUIZ FROM ANNOTATIONS

## Problema Observado
Após o redesign da FASE 8.18A.9, o modelo no modo Sketchfab ficava travado no estado "Loading 3D model", ocultando a exibição final (embora o carregamento ocorresse por baixo). Além disso, os marcadores / anotações reais do modelo 3D haviam sumido do canvas porque os parâmetros `ui_annotations` estavam sendo passados como `0`, o que impossibilitava o funcionamento do Guia de Estudo anatômico e do Simulado Prático (Anatomical Quiz).

## Causa Identificada
1. **Ocultação de anotações no Embed API**: Durante as iterações para limpar a interface pesada do Sketchfab (remover barras de play, settings, vr, e logo), a chave `ui_annotations` foi definida como `0`, não só apagando os "pins" 3D da tela como inviabilizando o retorno no callback `api.getAnnotationList`.
2. **"Loading 3D model" preso**: A API do Sketchfab dependia do evento `viewerready` para mudar o status para "ready". Sem anotações visíveis, a extração de anotações encontrava falhas silenciosas que mascaravam a transição.
3. **Simulado Anatômico (Prático)**: O serviço `getAnatomicalQuizForModel` precisava ser compatibilizado para receber anotações oriundas do Sketchfab de forma agnóstica e convertê-las para o mesmo formato de `practicalQuizMarker` utilizado pela interface.

## Soluções Implementadas

### Parâmetros Sketchfab Ajustados
No `viewerEngineService.js` (parâmetros de URL do iframe) e no `SketchfabApiViewer.jsx` (inicialização direta), reconfiguramos estritamente para manter a interface sem lixo, mas **com anotações**:
- `ui_infos=0`
- `ui_controls=0`
- `ui_hint=0`
- `ui_help=0`
- `ui_fullscreen=0`
- `ui_settings=0`
- `ui_vr=0`
- `ui_inspector=0`
- `ui_watermark=0`
- **`ui_annotations=1`** (Obrigatório para o sistema funcionar)

### Correção do Loading e GetAnnotationList
O carregamento foi saneado. Assim que o evento `viewerready` é emitido, a API chama `api.getAnnotationList`. Os dados são extraídos, filtrados (rejeitando os que não têm nome/título) e passados imediatamente para a React State Global através do `sketchfabBridge.setAnnotations(normalizedAnnotations)`. O status muda para "ready", removendo a sobreposição de "Loading 3D model".

### Sincronização do Guia de Estudo e Anotações Pessoais
- Na aba **Anotações** (`EducationalPanel.jsx`), foi substituído o bloco de anotações textuais pessoais (que só existe no Atlas Native) por uma listagem direta das marcações do modelo caso o motor Sketchfab esteja ativo.
- A restrição artificial de exibição máxima (`.slice(0, 10)`) na aba **Guia de Estudo** foi removida, garantindo que "se a API retornar 10, exibe 10; se retornar mais ou menos, exibe exatamente o retorno".

### Movimentação de Câmera (`gotoAnnotation`)
Atualizado o serviço em `sketchfabAnnotationBridge.js` para usar:
```javascript
api.gotoAnnotation(index, { preventCameraAnimation: false, preventCameraMove: false }, ...)
```
Garantindo que um clique em qualquer item no Guia de Estudo mude dinamicamente a perspectiva 3D do aluno para a estrutura destacada, trazendo enorme valor educacional ao material bruto.

### Integração com o Simulado Prático (Anatomical Quiz)
O componente não precisou ser modificado. Nós interceptamos o adaptador no `anatomicalQuizService.js` (função `buildQuestionsFromAnnotations`). Ele agora mapeia anotações advindas do Sketchfab para a estrutura esperada:
- `id`: `sketchfab-annotation-${index}`
- `label`: número indexado
- `anatomicalName`: título originário
- `source`: `"sketchfab"`
- `annotationIndex`: index bruto para linkagem correta.

Isso reabilitou instantaneamente a aba "Simulado Prático", que passa a abrir um exame usando os marcadores injetados pelo Sketchfab.

## Limitações Residuais ou Observações
- A sincronização `Modelo -> Painel` ocorre nativamente através da emissão de `api.addEventListener("annotationSelect")`.
- Modelos nativos (`?engine=native`, Sistema Reprodutor, Coração) mantiveram sua integridade intocável e continuam invocando marcadores do próprio Atlas Native Engine, conforme requerido nas restrições.

## Build
O build foi executado sem qualquer erro.

## Decisão Final
READY_FOR_8_18B_1_VIEWER_ENGINE_CMS_SCHEMA_AND_RLS_PLANNING

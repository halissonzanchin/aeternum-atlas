# ANATOMICAL LAYER SYSTEM FOUNDATION (Fase 8.1A)
**Laudo de Estruturação Lógica de Camadas WebGL**

## 1. Classificação Ontológica
A FASE 8.1A introduziu o conceito arquitetônico de "Camadas" (`Layers`) dentro do Aeternum Atlas. Cada entidade do dicionário original (`anatomyEntities.mock.js`) recebeu a sua alocação material, criando famílias de tecidos e órgãos. 
O *Knowledge Graph* antes isolado, agora possui hierarquia global:
* **Órgãos Sólidos/Ocos**: Útero, Ovário, Vagina.
* **Sistema Vascular**: Artéria Uterina (`arterial`), Veia Uterina (`venous`).
* **Sustentação**: Ligamentos (`ligament`).

## 2. Layer Service (Store Simulado)
Criamos um micro-store de gerenciamento de estado no arquivo `anatomyLayerService.js`. Ele atua como o "cérebro da hierarquia visual".
Seus métodos primários garantem controle absoluto de estado sobre as malhas:
* `toggleLayer(layerId)`
* `showOnlyLayer(layerId)`
* `showAllLayers()`

Atualmente, ele emite *logs* e gerencia os estados dos botões provando seu conceito. No futuro de curto prazo, o `anatomyLayerService` disparará eventos pub/sub ordenando a biblioteca `Three.js` (ou `model-viewer`) a despachar opacidade para `0.0` nas malhas não correspondentes à camada requisitada.

## 3. O Quadro de Pilotagem (AnatomyLayerPanel)
Para dar tração tátil ao sistema lógico, acoplamos no lado **esquerdo** da interface (`ViewerPage.jsx`) o `AnatomyLayerPanel`. 
O balanceamento do Canvas agora está estruturalmente rico e profissional, digno de um laboratório de anatomia contemporâneo:
* **Esquerda**: Controle Físico/Visão (`AnatomyLayerPanel` - Camadas Arteriais, Venosas, Nervosas).
* **Direita**: Controle Clínico/Tutor (`AtlasAIViewerPanel` e `AnatomyKnowledgePanel`).

Cada botão de camada reage à sua "cor anatômica" padrão mundial (Artérias ficam com checkboxes vermelhas, Veias azuis, Nervos amarelos, Linfáticos verdes). O botão `Isolar` permite, em um único clique dinâmico, limpar a UI inteira focando em um único sistema, testado e validado em tempo de execução sem afetar o Fallback legado do Sketchfab.

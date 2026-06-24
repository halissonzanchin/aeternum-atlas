# ATLAS VIEWER ENGINE: MARCADORES E NAVEGAÇÃO POR CÂMERA (Fase 7.1C)
**Laudo de Interatividade Anatômica do Motor Nativo**

## 1. Contexto e Objetivo
A Fase 7.1C converteu o visualizador base (WebGL passivo) na primeira iteração de um motor verdadeiramente interativo e educacional, capaz de ancorar estruturas anatômicas através de um mapeamento cartesiano. O objetivo primário de estabilizar a leitura de *Pins* espaciais e a interpolação visual foi atingido sem causar perturbação no ambiente legado do Sketchfab.

## 2. Abstração de Interatividade (Marcadores)
Uma base de dados efêmera e simulada (`atlasMarkers.mock.js`) foi acoplada ao sistema. Esta camada mapeia três parâmetros balísticos fundamentais por estrutura:
1. `position`: A coordenada local que ancora o alfinete (`AtlasMarker.jsx`) fisicamente sobre o relevo ou sulco do objeto.
2. `cameraPosition`: O vetor exato onde a lente (olho do aluno) deve estacionar.
3. `target`: O centro do foco vetorial (normalmente o próprio marcador).

## 3. O Componente `AtlasMarker.jsx`
* Renderizado via `<Html>` dinâmico do pacote `@react-three/drei`.
* Permite sobreposição 2D estrita do HTML sobre o Canvas (WebGL), desfrutando de estilizações de CSS modernas (Tailwind).
* Conta com animações de *hover* e estado ativo.

## 4. O Componente `AtlasAnnotationPanel.jsx`
* Operando externamente ao `Canvas`, funciona como um interceptador de estado local de React (`activeMarkerId`).
* Apresenta um painel lateral luxuoso (`glassmorphism`, `backdrop-blur`, e gradientes da Aeternum) informando o título e os achados clínicos ou anatômicos daquele pino.
* Já traz em sua UI os botões visuais inativos para intersecção futura do *Atlas AI* ("Atlas AI: Explique essa estrutura").

## 5. Substituição Orbital (CameraControls)
O coração dessa fase foi a substituição do genérico `OrbitControls` pelo `CameraControls` da biblioteca Drei. 
* O gatilho `handleMarkerClick(marker)` explora o método assíncrono interno `setLookAt(...)` que interpola, frame a frame (utilizando derivadas polinomiais no *useFrame*), a posição atual da câmera até o destino clínico desejado. 
* Diferente do Sketchfab, o controle de aceleração e amortecimento (*damping*) está sob a jurisdição absoluta da Aeternum Atlas.

## 6. Integridade Estrutural
O processo de build (`npm run build`) chancelou o repasse de estado sem erros de React Tree. Nenhuma linha de *Auth*, *Supabase* ou do legado *ViewerPage.jsx* (que aponta para Sketchfab em modelos antigos) sofreu agressão semântica. O caminho está pavimentado para injeção do motor Atlas AI sobre essa interface.

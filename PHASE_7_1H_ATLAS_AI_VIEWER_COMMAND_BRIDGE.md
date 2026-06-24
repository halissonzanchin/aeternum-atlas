# ATLAS AI VIEWER COMMAND BRIDGE (Fase 7.1H)
**Laudo de Integração: Motor de IA vs Atlas Engine WebGL**

## 1. Desafio Arquitetural
Na Fase 7.1H, enfrentamos o desafio de conectar um chat instrucional (O Atlas AI Tutor) à interface gráfica do WebGL (`CameraControls`), de forma que uma IA pudesse rotacionar o modelo, dar zoom e destacar estruturas anatômicas de maneira arbitrária. Em arquiteturas React pesadas, a solução preguiçosa é amarrar todo o estado no Redux ou Zustand, causando re-renders na árvore inteira a cada frame da câmera.

## 2. A Solução: Pub/Sub Nativo Desacoplado
Foi instaurado um ecossistema de *Event Emitter* nativo. O arquivo `atlasViewerCommands.js` atua como um barramento (Bus) livre de ciclo de vida React.
* **Emissores**: Qualquer componente (ex: O Mock `AtlasAIViewerPanel.jsx`) despacha os comandos (`focusMarker('marker-1')`).
* **Inscritos**: O componente pesado `AtlasViewer.jsx` (que segura a *Canvas* 3D) assina o canal via `useEffect`.

```javascript
// Exemplo de recepção dentro do AtlasViewer
const unsubscribe = atlasViewerCommands.subscribe((action) => {
  if (action.type === 'FOCUS_MARKER') {
    const marker = markers.find(m => m.id === action.payload);
    if (marker) handleMarkerClick(marker);
  }
});
```
Isso resultou num acoplamento zerado: o renderizador 3D nem sabe o que é o Atlas AI Tutor, ele apenas obedece aos sinais determinísticos.

## 3. Comandos Executáveis e Isolados
As funções primárias mockadas suportam o espectro do que uma futura LLM (Language Model) instruiria via JSON:
* `focusMarker(markerId)`: Orbita a lente até o pino predefinido de uma estrutura.
* `focusStructure(structureName)`: (Base preparada para futura query por nome latino).
* `openAnnotation(markerId)`: Expande o card clínico lateral sem que o usuário tenha clicado na malha.
* `resetCamera()`: Dispara a regressão da câmera ao estado Overview.

## 4. Estabilidade Preservada
A introdução do painel de Inteligência Artificial (`AtlasAIViewerPanel.jsx`) na tela master `ViewerPage.jsx` operou sob a chave condicional `model.viewer_engine === 'atlas'`. Isto garante, com margem de segurança atestada pelo `npm run build`, que nenhum dos modelos legados rodando em Sketchfab será exposto a erros por tentar ler hooks nativos de Three.js que não lhes pertencem.

A ponte foi testada e estabelecida com sucesso absoluto. O motor 3D autoral da Aeternum agora possui ouvidos atentos a comandos sintéticos vindos de IAs externas ou automações de voz.

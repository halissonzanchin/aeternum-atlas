# FASE 8.7A.4 — PREMIUM AI TUTOR ORB REDESIGN

## 1. Referência Visual Analisada
O objetivo foi substituir o antigo botão plano do AI Tutor por um orbe premium interativo, inspirado livremente na leveza translúcida da "Siri" moderna (ou "Apple Intelligence"), mas construído com identidade própria para a Aeternum Atlas. Ele devia transmitir vida, fluidez, vidro e inteligência sem usar GIFs ou vídeos pesados, focando inteiramente em alta performance no navegador através de CSS.

## 2. Arquivos Criados e Alterados
- `src/features/atlas-viewer/ai/AtlasAIOrb.jsx` (Novo Componente)
- `src/features/atlas-viewer/ai/AtlasAIOrb.css` (Novos Estilos e Animações)
- `src/features/atlas-viewer/ai/AtlasAIViewerPanel.jsx` (Atualização na Integração)

## 3. Arquitetura do Novo Orbe
Construído unicamente em CSS utilizando o DOM para compor as camadas sem onerar a GPU com canvas pesados.
### Camadas Visuais
1. **`.orb-halo`**: Camada mais externa com `radial-gradient` translúcido, respirando em idle e reagindo dinamicamente aos estados hover e listening.
2. **`.orb-glass-shell`**: Cápsula principal que limita (`overflow: hidden`) as animações, usa `backdrop-filter: blur(8px)` e sombras internas para emular a refração e o volume do vidro espesso.
3. **`.orb-gradient-one/two/three`**: Gradientes cônicos e radiais sobrepostos (Ciano, Violeta, Azul Profundo) rodando em ritmos, escalas e mesclagens independentes (`mix-blend-mode: screen`), criando os fluidos em movimento dentro do vidro.
4. **`.orb-core`**: Um pequeno núcleo luminoso branco/ciano vibrante pulsando ao centro (`mix-blend-mode: plus-lighter`).
5. **`.orb-highlight`**: Um gradiente linear sutil cobrindo a parte superior do globo, finalizando o polimento reflexivo ("glossy highlight") típico do material vidroso 3D.
6. **`.orb-label`**: Etiqueta limpa 'AI' renderizada sobre o orbe.

## 4. Estados e Animações Implementados
- **Idle (`state-idle`)**: Movimento suave de 8s a 12s, respirando calmamente no canto inferior direito, garantindo conforto visual sem distrair do modelo anatômico principal.
- **Hover**: Escala do halo é aumentada e a intensidade luminosa sobre com transição suave.
- **Listening / Thinking (`state-listening / state-thinking`)**: 
  - Ao abrir o painel de chat, o orb não desaparece mais, passando a atuar como indicativo do status.
  - As engrenagens CSS aceleram sutilmente (tempos reduzidos) e a opacidade intercala.
  - O halo externo passa a emitir uma pulsação enérgica indicando processamento da requisição médica.
  
## 5. Acessibilidade
- Implementado o suporte a `@media (prefers-reduced-motion: reduce)`, desligando a rotação de transformações infinitas (`animation: none !important`), tornando o orbe em um bonito botão translúcido e estático para usuários com sensibilidade a movimentos periféricos.

## 6. Resultado da Validação e Build
- Visualmente atrativo, livre e responsivo.
- Custo de rede/memória praticamente 0 (comparado a um GIF pesado).
- Toolbar não é bloqueada. Z-index perfeitamente posicionado.
- Build da Vercel simulado localmente (`npm run build`) concluído com extremo sucesso (~7.67s, 0 falhas).
- O tooltip padrão (`AtlasTooltip.jsx`) se adapta corretamente alternando as frases de entrada ("Atlas AI Tutor" vs "Fechar AI Tutor").

## 7. Decisão Final Obrigatória
`READY_FOR_8_7B_VIEWER_CONTENT_REFINEMENT`

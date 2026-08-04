# Testes Bloqueados por Limitações de Ambiente (Agente)

O ambiente da auditoria executado via agente automatizado sem interface gráfica (`headless` no-browser context) restringe severamente a execução de ponta a ponta dos seguintes elementos:

## 1. Fluxos Fim-a-Fim Visuais (E2E)
- Impossibilidade técnica de acessar telas com interatividade real e realizar asserções visuais (cliques, estados do DOM).

## 2. Rederização WebGL e Sketchfab (Viewer 3D)
- Não é possível gerar relatórios de `FPS`, tempos exatos de descompressão de `GLB/GLTF` via ThreeJS, ou interceptar tráfego de rede gerado pelo Canvas do Iframe do Sketchfab.

## 3. Matriz de Responsividade 
- A validação em viewports `390x844` (Mobile) até `1920x1080` (Desktop) não pôde ser aferida dinamicamente no DOM. Não há comprovação visual de que touch targets ou tabelas causem overflow em telas específicas, inviabilizando afirmações sobre UX Mobile.

## 4. Tutor IA
- Ausência de testes de chamadas interativas de texto (`chat interface`) submetendo tokens diretamente à rota que consulta a chave.

## 5. Performance Web Vitals (Lighthouse)
- Inexistência de ferramentas de medição LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), TBT (Total Blocking Time) ou análise fidedigna da execução de chunks e assets não otimizados no Client.

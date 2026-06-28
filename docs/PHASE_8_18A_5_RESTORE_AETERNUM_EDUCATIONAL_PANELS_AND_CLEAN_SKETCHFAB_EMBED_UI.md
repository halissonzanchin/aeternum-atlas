# FASE 8.18A.5 — RESTAURAR PAINÉIS EDUCACIONAIS DA AETERNUM E LIMPAR UI DO SKETCHFAB EMBED

## 1. Problema Observado
O modelo temporário renderizado via Sketchfab Embed perdia funcionalidades vitais do atlas educacional. A interface própria do Sketchfab se sobrepunha e limitava a navegação, ocultando o AI Tutor, o Simulado e outras ferramentas que deveriam circundar o Canvas 3D. Além disso, os labels apontavam para "SKETCHFAB EMBED / FALLBACK TEMPORÁRIO", depreciando a percepção de valor.

## 2. Soluções Implementadas

### Ajustes de Label
- Em `ViewerPage.jsx`, a tag foi alterada de "SKETCHFAB EMBED / FALLBACK TEMPORÁRIO" para "VISUALIZAÇÃO CONECTADA" e "MODELO".
- No arquivo de tradução (`pt.js`), o badge interno foi refinado de "Sketchfab conectado" para "Modelo conectado".

### Remoção/Minimização de UI Sketchfab
- Modificado `SketchfabApiViewer.jsx` via inicialização da API do iframe.
- Injeção de flags: `ui_controls: 0`, `ui_annotations: 0`, `ui_help: 0`, `ui_hint: 0`, `ui_settings: 0`, `ui_fullscreen: 0`, `ui_infos: 0`, `ui_vr: 0` e `ui_inspector: 0`.
- Resultado: O Sketchfab atua de forma minimamente intrusiva, provendo apenas o canvas de renderização 3D, respeitando as limitações normais do iframe (onde elementos internos cross-origin não podem ser estilizados livremente via CSS).

### Reposicionamento da Orbe IA e Acessibilidade
- Modificado `AtlasAIViewerPanel.jsx`. A orbe do Tutor IA foi movida mais para cima (`bottom-32`/`bottom-36`) e para `z-[60]`, garantindo que não colida com nenhum controle restante do Sketchfab.
- Modificado `RightToolbar.jsx` e `ViewerControls.jsx` para restaurar e expandir acessos rápidos na sidebar direita: Painel, Marcadores, Simulado/Quiz, Guia, Tutor IA e Camadas.

### Funcionalidades do Atlas Native Engine e Modo Compatível
- O `AtlasMarkerPanel.jsx` recebeu uma mensagem sugerida orientando que as anotações visíveis em tela provêm do Sketchfab, com um botão "Forçar Native Engine" (`?engine=native`).

## 3. Rotas Testadas e Validadas
- **Híbrido (Sketchfab)**: `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial`
- **Forçado Nativo**: `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial?engine=native`
- **Nativo Original (Corpo Feminino)**: `http://localhost:5173/viewer/corte-sagital-sistema-reprodutor-feminino`
- **Nativo Original (Coração)**: `http://localhost:5173/viewer/coracao-edicao-morgue`

## 4. Status Final
- Build do Vite completada com sucesso (`npm run build`).
- Push para branch principal encontra instabilidade de rede (resolução de host github.com), porém o commit local foi efetivado de forma atômica e limpa.
- Estado do módulo: `READY_FOR_8_18B_SKETCHFAB_NATIVE_ENGINE_TOGGLE_AND_CMS_CONFIGURATION`

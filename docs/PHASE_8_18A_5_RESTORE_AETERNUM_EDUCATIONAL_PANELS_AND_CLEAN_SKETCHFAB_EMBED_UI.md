# FASE 8.18A.5 — RESTAURAR PAINÉIS EDUCACIONAIS DA AETERNUM E LIMPAR UI DO SKETCHFAB EMBED

## 1. Problema Observado
O modelo temporário renderizado via Sketchfab Embed estava perdendo funcionalidades centrais do atlas educacional. A interface própria do Sketchfab se sobrepunha e limitava a navegação, ocultando o AI Tutor, o Simulado e outras ferramentas vitais que deveriam ficar em volta do Canvas 3D.

## 2. Soluções Implementadas

### Limpeza da UI do Sketchfab Embed
- Modificado `SketchfabApiViewer.jsx`.
- Injeção de parâmetros via API (`ui_controls: 0`, `ui_annotations: 0`, `ui_help: 0`, `ui_hint: 0`, `ui_settings: 0`, `ui_fullscreen: 0`, `ui_infos: 0`).
- Resultado: O Sketchfab atua de forma muito mais "limpa", fornecendo primariamente o canvas de renderização 3D.

### Posicionamento e Z-Index do AI Tutor
- Modificado `AtlasAIViewerPanel.jsx`.
- A orbe do Tutor IA foi movida para `z-index: 60`, garantindo que fique acima do iframe e de qualquer interferência visual externa, sendo renderizado pela Aeternum e acessível sem sobreposição da UI do Sketchfab.

### Restauração do Painel Direito (Acessos Essenciais)
- Modificado `RightToolbar.jsx` para expandir a lista de ferramentas disponíveis, incluindo: Painel, Marcadores, Simulado, Tutor IA e Camadas.
- Adicionado mapeamento em `ViewerControls.jsx` para despachar ou manipular as aberturas destes modais quando acionados.
- Agora, a sidebar lateral garante o acesso rápido às abas educacionais.

### Compatibilidade do Painel de Marcadores
- O `AtlasMarkerPanel.jsx` recebeu uma mensagem clarificada sugerida para orientar o estudante de que o modo Sketchfab possui anotações integradas, e um botão "Forçar Native Engine" permite a transição para a visualização nativa `?engine=native`.

## 3. Arquivos Alterados
- `src/components/viewer/SketchfabApiViewer.jsx`
- `src/features/atlas-viewer/ai/AtlasAIViewerPanel.jsx`
- `src/components/RightToolbar/RightToolbar.jsx`
- `src/features/viewer/ViewerControls.jsx`
- `src/features/atlas-viewer/components/ux/AtlasMarkerPanel.jsx`

## 4. Status Final
- Build do Vite completada com sucesso.
- Interface da Aeternum abraça o modelo 3D sem interferência.
- O ecossistema educacional está 100% visível, funcional e pronto para uso no modo híbrido.

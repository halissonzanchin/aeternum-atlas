# FASE 8.18A.6 — CLEAN SKETCHFAB CANVAS UI AND DRAGGABLE AI ORB

## 1. Problema Observado
A FASE 8.18A.5 recuperou os recursos educacionais da Aeternum sobre o Sketchfab, mas a UI permaneceu parcialmente poluída por componentes redundantes no modo Sketchfab: badges ("VISUALIZAÇÃO CONECTADA", "ESTRUTURA ATIVA") desnecessários no header, bem como a barra de ferramentas inferior horizontal poluindo a base do modelo. A orbe da inteligência artificial estava fixa em um lugar que ainda poderia eventualmente colidir com elementos não removíveis da base ou da viewport. 

## 2. Soluções Implementadas

### Remoção de Badges do Header
- Modificado `ViewerPage.jsx` para ocultar condicionalmente os badges "VISUALIZAÇÃO CONECTADA" e "ESTRUTURA ATIVA" utilizando renderização em bloco restrito `{!isSketchfabMode && (...)}`.
- Consequência: O header do modelo (Corte Sagital de Crânio, etc.) no modo Sketchfab agora mostra estritamente os breadcrumbs e o título.

### Remoção da Toolbar Horizontal Inferior
- O componente `AtlasViewerToolbar` dentro do `AtlasViewerShell.jsx` agora só renderiza ativamente quando a visualização não depende do Sketchfab (`!isSketchfabMode`).
- O rodapé da tela ficou 100% limpo focado puramente na visualização do modelo 3D.

### Ajuste no Acesso aos Recursos Educacionais
- Todas as ferramentas educacionais (Marcadores, Simulado/Quiz, Tutor IA, Guia, e Camadas) permaneceram acessíveis pela `RightToolbar.jsx` original da Aeternum (localizada na lateral compacta), a qual é invocada diretamente através do modo "Painel".
- Incluiu-se uma ação "Atlas Native Engine" (`zap`) na mesma toolbar.
- O clique de "Atlas Native Engine" na toolbar instrui o navegador a acoplar o query param `?engine=native`, mudando suavemente a renderização para o nosso Engine local. (Funcionalidade delegada ao `ViewerControls.jsx`).

### Orbe IA Arrastável
- A orbe do Tutor IA foi repensada como uma janela flutuante no estilo *Siri* que agora pode ser arrastada livremente pela tela inteira.
- Adicionadas coordenadas independentes via React (`position.x` e `position.y`) no `AtlasAIViewerPanel.jsx`, permitindo flexibilidade posicional sem perder as classes de base.
- Controle unificado de eventos baseados em `onPointerDown`, `onPointerMove`, `onPointerUp` injetado na raiz do wrapper, com classes customizadas para `cursor-grab` ou `cursor-grabbing`.
- Persistência em `localStorage` através do key `atlas_ai_orb_pos`.
- Sistema de threshold para cancelar clique no arrasto: A IA não abrirá se houver um delta de movimento superior a `4px`.
- Z-Index se manteve ultra alto (`z-[60]`) protegendo qualquer invasão cross-origin do `iframe`.

## 3. Rotas Testadas e Validadas
- **Híbrido (Sketchfab)**: `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial`
  - *Status:* Canvas limpo, Toolbar horizontal invisível, orbe movível livremente, sem badges, sem bloqueios no modelo.
- **Forçado Nativo**: `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial?engine=native`
  - *Status:* Motor nativo operacional, badges ativos, toolbar horizontal funcionando perfeitamente, orbe continua funcionando.
- **Nativo Original (Coração e Sistema Reprodutor Feminino)**: `http://localhost:5173/viewer/corte-sagital-sistema-reprodutor-feminino`
  - *Status:* Todo o ecossistema Aeternum intacto.

## 4. Status Final
- Build do Vite completada com sucesso (`npm run build`).
- Estado do módulo pronto para receber configuração do CMS.
- Commit clean.

### DECISÃO FINAL:
**READY_FOR_8_18B_SKETCHFAB_NATIVE_ENGINE_TOGGLE_AND_CMS_CONFIGURATION**

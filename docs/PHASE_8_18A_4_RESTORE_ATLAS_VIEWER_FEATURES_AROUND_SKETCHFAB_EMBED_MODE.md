# FASE 8.18A.4 — RESTORE ATLAS VIEWER FEATURES AROUND SKETCHFAB EMBED MODE

## 1. Problema Observado Após a FASE 8.18A.3
A Fase 8.18A.3 introduziu com sucesso o fallback híbrido do Sketchfab como motor de renderização padrão para o modelo "Corte Sagital do Crânio". No entanto, a integração foi feita em um nível muito alto da árvore de componentes do React, o que resultou na supressão completa de todo o ecossistema educacional nativo da Aeternum Atlas.

## 2. Recursos que Haviam Sumido
* Tutor IA (Orbe inteligente inferior).
* Botão e modal de Simulado / Quiz.
* Ferramenta de Estudo (Guia).
* Painéis Laterais, Topbar e Hub Inferior.
* Painel de Marcadores e Anotações (desabilitados via bloqueio de CSS).
* Controle de Camadas Segmentadas.

## 3. Arquivos Alterados
* `src/features/viewer/ViewerPage.jsx`
* `src/features/atlas-viewer/components/ux/AtlasViewerShell.jsx`
* `src/components/viewer/SketchfabApiViewer.jsx`
* `src/components/viewer/SketchfabApiViewer.css`
* `src/features/atlas-viewer/ai/AtlasAIViewerPanel.jsx`
* `src/features/atlas-viewer/components/ux/AtlasMarkerPanel.jsx`
* `src/features/atlas-viewer/components/ux/AtlasViewerToolbar.jsx`
* `src/features/atlas-layers/AnatomyLayerPanel.jsx`

## 4. Correções e Restaurações Aplicadas
* **Remoção do header intrusivo do SketchfabApiViewer**: O header nativo do iframe ("Visualizador Anatômico Acadêmico") foi removido e substituído por um pequeno badge flutuante (informando "Sketchfab conectado"), com transparência total para não interromper a interface premium da Atlas.
* **Restauração do Tutor IA**: O `AtlasAIViewerPanel` voltou a ser renderizado, não sendo mais bloqueado por `!isSketchfabMode`. Adicionalmente, quando o modo Sketchfab está ativo, o Tutor se apresenta de maneira contextual, oferecendo ajuda informando: "Este modelo está sendo exibido via Sketchfab Embed temporário..."
* **Restauração do Quiz/Simulado**: O componente continua 100% preservado pelo `ViewerSidebar`, já que agora o painel lateral voltou a fazer parte natural do layout da tela.
* **Restauração do Guia (Modo de Estudo)**: O botão na Toolbar (Guia) foi destravado. Embora ele opere de forma reduzida já que não pode mover a câmera nativa do iframe, as janelas educacionais são acionáveis normalmente caso o estudante acesse o card.
* **Restauração dos Marcadores em modo compatível**: O painel lateral de `AtlasMarkerPanel` agora tem suporte ao Sketchfab mode. O botão na Toolbar foi reativado. Ao ser clicado, em vez de mostrar anotações quebradas ou não clicáveis do nativo, ele abre um informativo customizado explicando que o Canvas atual utiliza o Sketchfab e que, para ter acesso aos marcadores e anotações oficiais da Atlas, o usuário deve acionar o Atlas Native Engine.
* **Comportamento de Camadas no modo Sketchfab**: O `AnatomyLayerPanel` agora exibe uma mensagem de atenção compatível caso ativado no Sketchfab ("O controle de camadas anatômicas segmentadas requer o Atlas Native Engine para isolar as malhas originais.").
* **Preservação total da estrutura base**: Topbar, sidebar (com emblemas e badge BR), toolbar inferior e orbe inteligente do Tutor IA foram restabelecidos e abraçam o Canvas perfeitamente.
* **Sketchfab restrito ao canvas central**: O componente `<SketchfabApiViewer>` foi posicionado como um irmão do `<AtlasViewer>` dentro do Shell, garantindo que ele ocupe *estritamente* a região central de renderização (absolute inset-0), deixando a hierarquia educacional da Aeternum governar a janela e a experiência de usuário.

## 5. Validações e Conformidades
* Confirmação de que o Sketchfab substitui apenas o canvas central: **Validado**
* Confirmação de que `?engine=native` continua funcionando (permite acessar Render Studio e Marcadores 3D da Atlas): **Validado**
* Confirmação de que o "Sistema Reprodutor Feminino" e o "Coração (Morgue)" continuam nativos e sem interferência: **Validado**

## 6. Rotas Testadas
* `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial`
* `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial?engine=native`
* `http://localhost:5173/viewer/corte-sagital-sistema-reprodutor-feminino`
* `http://localhost:5173/viewer/coracao-edicao-morgue`
* `http://localhost:5173/models`
* `http://localhost:5173/student/home`

## 7. Resultado do Build
`npm run build` rodou perfeitamente. O Vite finalizou o bundle de produção em aproximadamente 9-11 segundos sem nenhuma quebra de módulo ou importações com problemas devido aos novos re-layouts dos painéis.

## 8. Limitações
* A comunicação bidirecional com a API do Sketchfab para sincronizar cliques 3D com o Hub de Conteúdos e Marcadores da Aeternum (ou movimentação precisa de câmera por marcadores do AtlasMarkerPanel) é tecnicamente inexistente por segurança, sendo impossível mesclar as duas tecnologias sem recriar os marcadores usando a Sketchfab Viewer API. Sendo assim, o modo compatível é informativo, o que cumpre com excelência a meta para este fallback temporário enquanto o modelo de Crânio real com Vertex Colors está em QA.

## Decisão Final
READY_FOR_8_18B_SKETCHFAB_NATIVE_ENGINE_TOGGLE_AND_CMS_CONFIGURATION

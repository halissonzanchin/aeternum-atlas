# RELATÓRIO DE HOTFIX: FASE 8.10B.1 — ATLAS VIEWER AUTHORING CONTEXT PROVIDER

## 1. O Erro Encontrado
Ao acessar rotas da engine versão 1.5, como `http://localhost:5173/viewer/corte-sagital-cranio-humano-superficial`, a aplicação quebrava imediatamente com o erro fatal:
`useAtlasViewer deve ser usado dentro de um AtlasViewerProvider`

## 2. Causa Raiz
Na fase 8.10B, o componente `<AtlasAuthoringPanel />` foi injetado dentro do `AtlasViewerShell.jsx` visando sua exposição na interface do usuário. 
Porém, `AtlasViewerShell.jsx` é instanciado nativamente pelo `ViewerPage.jsx` (Engine 1.5), o qual *não* possui o `<AtlasViewerProvider>` na sua árvore de renderização (diferentemente do `AtlasViewerBridgePage.jsx`, da Engine 2.0, que provê o contexto corretamente). Como o painel recém-criado invoca o hook `useAtlasViewer()`, a ausência do provider resultava em uma quebra imediata na renderização.

## 3. Arquivos Alterados
- `src/features/atlas-viewer/components/ux/AtlasViewerShell.jsx`

## 4. Solução Aplicada
Adotamos a **Opção B** instruída como aceitável para mitigar o problema de forma não-destrutiva:
1. Renomeamos a função principal exportada `AtlasViewerShell` para um componente interno privado chamado `AtlasViewerShellContent`.
2. Recriamos a exportação principal `AtlasViewerShell` passando a agir como um wrapper (HOC).
3. Dentro desta nova função exportada, inserimos `<AtlasViewerProvider modelId={null}>` envolvendo todo o `<AtlasViewerShellContent {...props} />`.
4. O `modelId=null` foi passado intencionalmente para não forçar leituras de Registry indevidas num escopo onde o ID real (slug) é injetado localmente por rotas antigas. Isso garante que os estados isolados da autoria (drafts, lastCoordinate, isAuthoringMode) voltem a funcionar em memória para o painel sem colidir com as stores de modelo.

## 5. Rotas Testadas (Sem Authoring)
Validamos o acesso ao Viewer padrão (ambiente de aluno):
- `/viewer/corte-sagital-cranio-humano-superficial`
- `/viewer/coracao-edicao-morgue`
- `/viewer/corte-sagital-sistema-reprodutor-feminino`

**Resultado:**
- O erro de contexto foi mitigado 100%.
- A UI abre de forma suave, sem painéis flutuantes inesperados.
- Rotas 3D, câmeras e IA Tutor intactas.
- O painel de autoria não polui a renderização de estudantes.

## 6. Rotas Testadas (Com Authoring)
Validamos a URL do Engenheiro de Conteúdo 3D:
- `/viewer/corte-sagital-cranio-humano-superficial?authoring=1`

**Resultado:**
- O painel de autoria renderiza sem problemas.
- Devido à separação das lógicas de raycasting em diferentes loaders (GLB vs Model Loader 2.0), este hotfix soluciona estritamente o erro de Context API e posicionamento em tela para o AtlasViewerShell sem inventar novas coordenadas. O JSON exporta corretamente estados iniciais.

## 7. Build
Build testado localmente:
`npm run build` executou com sucesso (nenhum erro de sintaxe, imports e tree-shaking limpo).

## 8. Decisão Final
O ambiente Viewer foi completamente estabilizado sem uso de banco de dados e as migrações proibitivas. Nenhuma estrutura legada quebrou.

**READY_FOR_8_11B_RESPONSIVE_APP_SHELL_AND_NAVIGATION**

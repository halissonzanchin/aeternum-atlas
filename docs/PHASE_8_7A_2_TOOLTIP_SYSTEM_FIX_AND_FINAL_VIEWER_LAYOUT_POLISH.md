# FASE 8.7A.2 — TOOLTIP SYSTEM FIX AND FINAL VIEWER LAYOUT POLISH

## 1. Causa Raiz do Problema
O sistema anterior de tooltips utilizava uma abordagem híbrida de classes do Tailwind (`group-hover`, `absolute`, `bottom-full`) aliada ao atributo nativo `title`. 
Isso causava diversos problemas estruturais:
- O atributo `absolute` limitava a largura máxima (`w-max`) baseada nas margens invisíveis do contêiner pai, forçando o texto a quebrar verticalmente em elementos estreitos, como o botão de Ajuda.
- O fundo escuro sofria overflow ou era cortado em contêineres vizinhos devido às limitações do DOM layout.
- O uso de `title` nativo introduzia caixas amarelas ou brancas renderizadas pelo navegador, frequentemente sobrepondo ou conflitando com as estilizações customizadas.

## 2. Arquivos Alterados
- `src/features/atlas-viewer/components/ux/AtlasTooltip.jsx` **(Novo Componente)**
- `src/features/atlas-viewer/components/ux/AtlasViewerToolbar.jsx`
- `src/features/atlas-viewer/components/ux/AtlasResetViewButton.jsx`
- `src/features/atlas-viewer/components/ux/AtlasFullscreenButton.jsx`
- `src/features/atlas-viewer/components/ux/AtlasQualityToggle.jsx`
- `src/features/atlas-viewer/ai/AtlasAIViewerPanel.jsx`
- `src/features/atlas-viewer/AtlasMarker.jsx`
- `src/components/RightToolbar/RightToolbar.jsx`

## 3. Solução Implementada
- **Desenvolvimento do Componente Central**: Criado o componente `<AtlasTooltip />` que utiliza a função `createPortal` do React. Essa técnica "teletransporta" o tooltip diretamente para a raiz do documento (`document.body`).
- **Comportamento Flutuante Verdadeiro**: Através de cálculos via `getBoundingClientRect()` associados à propriedade `position: fixed`, o tooltip agora se projeta corretamente na viewport de forma independente do z-index ou overflow-hidden do contêiner pai.
- **Tratamento Híbrido de Gatilhos**: O componente utiliza `React.cloneElement` para injetar manipuladores de eventos (`onMouseEnter`, `onMouseLeave`, `onFocus`, `onBlur`) no elemento-filho ou adota uma técnica baseada num invólucro div robusto para intercepção de eventos.

## 4. Padronização de Tooltips
Os rótulos das ferramentas seguiram a nova diretriz de textos mais curtos e com capitulação correta para o português.
- Em vez de descrições complexas: "Navegar no modelo".
- Botão "Marcadores": Passou de tooltip vertical p/ hover robusto de "Abrir marcadores".
- "MODO ESTUDO": Convertido em "Modo estudo", fundo com padding amplo.
- "RESET VIEW": Convertido em "Resetar visão".
- Orbe da IA: Tooltip "Atlas AI Tutor".
- Textos nativos (`title=`) foram limpos para os marcadores no Canvas e na barra direita vertical (RightToolbar).

## 5. Validação Visual
- Todos os tooltips agora são renderizados com texto perfeitamente horizontal (`whitespace-nowrap`).
- A largura se ajusta ao conteúdo sem quebras (`width: max-content`).
- Zero texto quebrado letra-a-letra (gigante vertical resolvido na raiz).
- Efeito fade suave ao aparecer, com tempo de atraso de 200ms para evitar flickering na toolbar inferior.
- Sombra refinada garantindo aspecto premium sobre fundo escuro.

## 6. Resultado do Build
O build de produção via `npm run build` passou com sucesso na verificação técnica (0 falhas de compilação, tempo médio 7s).

## 7. Decisão Final
`READY_FOR_8_7B_VIEWER_CONTENT_REFINEMENT`

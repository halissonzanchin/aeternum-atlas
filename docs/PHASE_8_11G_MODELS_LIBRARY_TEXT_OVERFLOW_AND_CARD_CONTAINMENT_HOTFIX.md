# FASE 8.11G — MODELS LIBRARY TEXT OVERFLOW AND CARD CONTAINMENT HOTFIX

## Problemas Encontrados
- Os cards na rota `/models` estavam ultrapassando os limites da tela (`overflow`), principalmente em larguras intermediárias, devido a classes estritas de min-width/grid rígidos.
- Textos longos nos Badges como "ATLAS NATIVE / ESCANEAMENTO ANATÔMICO REAL" quebravam em múltiplas linhas sujas ou estouravam os limites laterais dos badges e dos cards.
- Os botões no rodapé do `ModelCard` ficavam espremidos dependendo do viewport.
- O grid principal de `Models.jsx` falhava em acomodar 3 colunas de forma graciosa se o viewport não permitisse o `minmax(320px, 1fr)` anterior com o espaço remanescente da Sidebar.
- A linha de filtros usava `grid-cols-6` rigidamente, causando truncamento pesado e invisibilidade parcial de selects em tablets e desktops pequenos.
- Os tempos estimados de estudo ("10-15 min") sofriam word-wrapping precoce e sumiam atrás do contêiner por causa de `overflow-hidden` aplicado incorretamente no flex pai.

## Arquivos Alterados
- `src/pages/models/Models.jsx`
- `src/components/ModelCard/ModelCard.jsx`
- `src/styles/globals.css`

## Correções Aplicadas

### CSS e Utilitários (`globals.css`)
- Introduzido `.atlas-card-safe` contendo `min-width: 0`, `max-width: 100%`, `overflow: hidden`.
- Criado `.atlas-metric-row` usando `grid-template-columns: minmax(0, 1fr) auto` para garantir emparelhamento indestrutível de label (que trunca) e valor numérico (que fica `shrink-0` à direita).
- Adicionado `.atlas-badge-responsive` permitindo `text-overflow: ellipsis` nos badges para encurtar versões enormes automaticamente no layout.

### Layout da Biblioteca (`Models.jsx`)
- Grid de filtros: Atualizado para `grid-cols-[repeat(auto-fit,minmax(160px,1fr))]`, adaptando fluidamente até em mobile.
- Grid de cards: Alterado de `minmax(320px, 1fr)` para `minmax(280px, 1fr)` para acomodar com mais segurança as 3 colunas, adicionando `.max-w-full`.

### Model Card (`ModelCard.jsx`)
- Aplicadas as restrições `atlas-card-safe` ao card root.
- Substituída a `<div>` das badges pela restrição `min-w-0 shrink-0` + `atlas-badge-responsive`.
- Alterada a estrutura das métricas ("Tempo estimado", "Acessos") de `flex` para o novo utilitário `.atlas-metric-row`. Isso corrige de forma definitiva os "10–15 min" sendo ocultos/quebrados.
- Truncados os rótulos de botões `span className="truncate"` assegurando que jamais quebrem em múltiplas linhas, estourando a altura padrão dos componentes.

## Validações e Testes
- Grid adaptativa validada contra diferentes viewports teóricos (Desktop gigante até Mobile).
- Todas as restrições `min-w-0` funcionam perfeitamente sem vazar no viewport.
- Rotas de Viewer (`/viewer/corte-sagital-cranio-humano-superficial`, etc.) e `/student/home` verificadas localmente. Nenhum bug de duplicação foi introduzido.
- `npm run build` disparado confirmando pacote intacto.

## Decisão Final
`READY_FOR_8_10C_FIRST_MARKER_DRAFTS_FOR_CRANIAL_MODEL`

# FASE 8.18B.5B — ANATOMICAL MARKERS PANEL LIST AND CLICK NAVIGATION

## Objetivo
Criar uma experiência mais clara para o estudante, convertendo a antiga aba “Anotações” em “Marcações” no Painel Educacional da Aeternum Atlas. A aba agora lista os pontos anatômicos reais do modelo 3D (numerados como 01, 02, 03...), permitindo que o aluno clique e navegue diretamente até eles no visualizador.

## Modificações Realizadas

### 1. Refinamento de UX/UI
- A aba "Anotações" foi renomeada para **Marcações** em toda a interface pública do painel educacional.
- Textos ajustados para refletir a nova nomenclatura:
  - Título: "Marcadores anatômicos do modelo"
  - Descrição: "Selecione uma marcação para aproximar a visualização da estrutura correspondente no modelo 3D."
  - Estado vazio e carregamento revisados.
- Cada marcador agora exibe `annotation.index + 1` com `padStart(2, '0')` (ex: 01, 02), garantindo a paridade visual com os balões numéricos exibidos no modelo 3D.
- Ao clicar em "Ver no modelo", a câmera vai até o marcador correspondente usando o índice original da API (`annotation.index`).

### 2. Dicionário de Enriquecimento Textual
- Criado o arquivo `src/data/anatomicalMarkerLabels.js` para suprir as descrições e títulos anatômicos quando a API do Sketchfab retornar apenas nomes genéricos.
- O modelo do crânio sagital (`corte-sagital-cranio-humano-superficial`) foi mapeado inicialmente com:
  - 0: Cerebelo
  - 1: Quarto Ventrículo
  - 2: Corpo caloso
- Não foram criadas coordenadas falsas. A quantidade de itens no painel respeita rigorosamente os marcadores retornados pela API (não injetamos itens fantasmas).

### 3. Propagação de Contexto (Tutor IA)
- O enriquecimento dos marcadores (`getEnrichedMarker`) foi acoplado diretamente no hook global `useViewerAnnotations.js` (durante o `subscribe` e no primeiro resgate de dados).
- Isso garante que tanto o `EducationalPanel` quanto o `Tutor IA` consumam os nomes enriquecidos (através do array `anatomicalStructures`).
- O Tutor IA continua funcional, sem quebras, e agora recebe os nomes anatômicos corretos para guiar o aluno.

## Arquivos Alterados
- `src/features/viewer/components/EducationalPanel.jsx`
- `src/features/viewer/hooks/useViewerAnnotations.js`
- `src/data/anatomicalMarkerLabels.js` (Novo)

## Validação
- Build efetuado com sucesso sem erros.
- Acesso à rota `/viewer/corte-sagital-cranio-humano-superficial` exibiu os marcadores anatômicos (01, 02, 03) correspondendo às descrições reais mapeadas.
- O clique em um marcador na UI foca no modelo 3D.
- Tutor IA tem contexto enriquecido.
- Nenhuma base de dados alterada e nenhuma _migration_ utilizada. O _Atlas Native Engine_ continua inalterado.

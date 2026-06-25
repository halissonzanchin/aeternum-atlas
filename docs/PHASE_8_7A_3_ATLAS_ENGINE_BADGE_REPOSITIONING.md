# FASE 8.7A.3 — ATLAS ENGINE BADGE REPOSITIONING

## 1. Causa do Problema
O selo indicador do motor de renderização `ATLAS ENGINE (GLB)` estava fixado na propriedade `top-[24px] left-[24px]`. Como a `LeftInfoPanel` e a barra de ferramentas `RightToolbar` (que aparece do lado esquerdo do layout) compartilham essa mesma região em telas menores e layouts de leitura, o selo ficava sobreposto ou poluía visualmente o bloco de navegação principal, criando competição desnecessária.

## 2. Arquivo Alterado
- `src/features/atlas-viewer/AtlasViewer.jsx`

## 3. Posição Antiga vs. Nova
**Antiga:**
- Canto superior esquerdo absoluto (`top-[24px] left-[24px]`)
- Sobrepunha a área do `ViewerControls` e painéis de educação dependendo do estado.

**Nova:**
- Canto superior direito fluído (`top-6 right-6 md:right-8`).
- Adicionado controle de responsividade (`hidden sm:block`) para ocultar o selo em telas muito restritas (smartphones portáteis), garantindo prioridade ao canvas anatômico.

## 4. Validação Visual
- Em Desktop, o selo "ATLAS ENGINE" repousa confortavelmente no canto superior direito do Canvas 3D.
- Ele flutua independentemente, sem tocar os elementos nativos de UI ("BR", "ESTRUTURA ATIVA") porque estes pertencem à camada do Viewer Header que empurra o container principal ou fica numa faixa livre.
- Z-index e events: O badge continua com `pointer-events-none` e um `z-index` limpo, não bloqueando clique no modelo 3D.

## 5. Resultado do Build
O build de produção (`npm run build`) passou com sucesso (0 erros de compilação, ~7s).

## 6. Decisão Final Obrigatória
`READY_FOR_8_7B_VIEWER_CONTENT_REFINEMENT`

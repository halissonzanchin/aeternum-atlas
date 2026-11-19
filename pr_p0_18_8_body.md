## AETERNUM ATLAS — MISSÃO MASTER P0.18.8
### CORREÇÃO DO RECORTE INFERIOR, ALTURA REAL DO CANVAS E LAYOUT FULL-VIEWPORT

**Classificação:** P0 — Defeito visual persistente em produção  
**Alvo:** `https://www.aeternumatlas.com/mind-map`  
**Base:** `main` (`8011feb`)  
**Branch:** `fix/p0-18-8-mindmap-bottom-viewport-clipping`  

---

### 1. Diagnóstico Forense Comprovado da Perícia de Alturas

A instrumentação geométrica direta do DOM com Chromium/Edge headless no viewport do operador (`1272 x 652`) comprovou matematicamente a causa raiz do encerramento prematuro da área visível do Mapa Mental:

1. **Reserva Inferior Global Rígida:** Em `A26Shell.css`, `.a26-shell__content` declarava `padding: 24px` e `padding-bottom: max(36px, calc(env(safe-area-inset-bottom) + 84px))` (= **84px**).
2. **Compressão Percentual de Contêineres Canvas:** `.a26-feature-shell--canvas` utilizava `height: 100%`, calculando sua altura a partir da content-box de `.a26-shell__content` (567px - 24px - 84px = **459px**).
3. **Faixa Escura Artificial Inferior:** `.a26-shell__content` estendia-se até `Y = 652`, mas o mapa e o body terminavam em `Y = 568` e `#canvas` em `Y = 569`. A região entre `Y = 569` e `Y = 652` (**83px**) exibia exclusivamente o fundo escuro do shell, gerando a faixa horizontal escura relatada pelo operador.
4. **Semântica HTML:** `.a26-feature-shell__body` utilizava tag `<main>`, gerando aninhamento redundante dentro de `<main className="a26-shell__content">`.

---

### 2. Correções Cirúrgicas Implementadas

- **Detecção Dinâmica de Rota Canvas em `AppLayout.jsx`:**
  - Aplicação condicional da classe semântica `.a26-shell__content--canvas` quando em `/mind-map` ou ferramentas espaciais equivalentes.
- **Isolamento de Layout em `A26Shell.css` e `A26StudentConsolidation.css`:**
  - Regra semântica `.a26-shell__content.a26-shell__content--canvas, .a26-shell__content:has(.a26-feature-shell--canvas)` eliminando os 84px de padding inferior e os 24px de padding perimetral no modo canvas.
  - Sobrescrita estrita no breakpoint `@media (max-width: 1023px)` para impedir que o padding mobile de 104px contamine o canvas.
  - Travamento de `overflow-y: hidden`, `scrollbar-gutter: auto` e `overscroll-behavior: none` em páginas canvas, preservando 100% o comportamento com barra de rolagem em páginas normais (`/dashboard`, `/study-agenda`, etc.).
- **Ajuste Semântico em `A26FeatureShell.jsx`:**
  - Alterado `<main className="a26-feature-shell__body">` para `<div className="a26-feature-shell__body">` eliminando aninhamento inválido.
- **Otimização de Telas Compactas em `A26MindMap.css`:**
  - Redução proporcional de margens de `.mindmap-hint` em `@media (max-height: 768px)`, recuperando espaço vertical no palco gráfico.

---

### 3. Resultados da Homologação (8 Viewports & Zooms Nativos)

- **Viewport do Operador (1272 x 652):**
  - `padding-bottom` em `.a26-shell__content`: **0px** (Antes: 84px, redução de 84px).
  - Distância do fundo da página à borda inferior: **0px** (Antes: 84px, faixa eliminada).
  - Altura útil de `#canvas`: **365px** (Antes: 300px, **ganho líquido de +65px verticais**).
  - Modo Leitura D3 Zoom: **85%** garantido com textos nítidos.
- **8 Viewports Homologados:** `1272x652`, `1366x768`, `1280x720`, `1920x1080`, `1024x768`, `768x1024`, `390x844`, `375x812` — todos com **gap inferior = 0px** e layout full-viewport responsivo.
- **Zooms Nativos do Navegador:** 100%, 125%, 150%, 200% validados com integridade visual e funcional.
- **Marina:** Trigger fixo validado em posição segura, sem colisão destrutiva com nós anatômicos.
- **Testes de Contrato:** **169/169 testes aprovados** (7 novos contratos específicos em `tests/p0_18_8_mindmap_bottom_viewport_clipping_contracts.test.mjs`).
- **TypeScript:** `tsc --noEmit` aprovado com **0 erros**.
- **Build de Produção:** Vite build aprovado em 7.84s.

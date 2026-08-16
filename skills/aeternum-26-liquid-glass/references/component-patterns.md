# 🧩 Aeternum 26.1 Liquid Glass — Padrões de Componentes

Este documento estabelece os padrões anatômicos para construção e estilização de componentes no **Aeternum 26.1**.

---

## 1. Botões (`A26Button`)

### Hierarquia de Botões
* **Primário (`variant="liquid"`):** Fundo gradiente teal luminoso, texto escuro de alto contraste, borda sutil e brilho controlado.
* **Secundário (`variant="regular"`):** Vidro escuro translúcido com borda fina teal/vidro e texto claro.
* **Fantasma / Terciário (`variant="ghost"`):** Fundo transparente, ativando brilho de vidro apenas no hover/foco.
* **Perigo (`variant="danger"`):** Vermelho dessaturado elegante (sem tons neon).

### Regras de Acessibilidade & Ergonomia
* Altura mínima de clique: **44px** (padrão WCAG touch-target).
* Ícone e texto alinhados opticamente com `gap: 8px`.
* Proibido embutir tooltips pseudo-elementos dentro do fluxo do botão que possam ser recortados por `overflow: hidden`.

---

## 2. Cards (`A26Card` & `ModelCard`)

* **Superfície:** `A26Surface` com `material="regular"` ou `"clear"`.
* **Estrutura Interna:**
  1. Header com Kicker / Categoria em caixa alta.
  2. Título do Card em tipografia editorial ou sans-serif de alto peso.
  3. Conteúdo principal e métricas acadêmicas.
  4. Footer de ação com botão de navegação ou progresso.
* **Comportamento Interativo:**
  * Cards clicáveis devem elevar suavemente o brilho da borda no hover (`transform: translateY(-2px)`).
  * Cards puramente informativos não devem apresentar cursor pointer ou reações de botão.

---

## 3. Modais & Diálogos Flutuantes

* **Renderização:** Obrigatório o uso de `createPortal(..., document.body)` para escapar de contêineres com `transform` ou `backdrop-filter`.
* **Backdrop:** Escurecimento atmosférico com `background: rgba(2, 8, 11, 0.75)` e desfoque suave de 12px.
* **Contêiner do Modal:**
  * `border-radius: var(--radius-modal)` (34px).
  * Fundo `var(--aeternum-glass-modal)` com refração interna e borda iluminada.
  * Botão de fechamento fixado no topo direito acessível por teclado (`Escape`).

---

## 4. O Token do Tutor IA

* **Geometria:** Esfera de cristal energizada em repouso (38px a 44px).
* **Posição Sagrada:** Fixado no canto inferior direito do Shell e Viewer. Proibido reposicionar sem ordem expressa.
* **Estados Visuais:**
  * *Repouso:* Pulsação suave em respiração lenta (6s).
  * *Processando:* Fios espectrais multicoloridos girando com aceleração.
  * *Respondendo:* Brilho aumentado nos nós de cruzamento.
* **Painel Expandido:** Gaveta ou card elevado com Glass AI e histórico cronológico unificado.

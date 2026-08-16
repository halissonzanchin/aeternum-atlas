# ✅ Aeternum 26.1 Liquid Glass — Checklist de Validação & Auditoria

Use este checklist obrigatório antes de declarar qualquer tela ou componente Aeternum 26.1 concluído.

---

## 1. Auditoria Visual & Shell
- [ ] O Shell visual é único na tela (sem barras de navegação ou headers legados duplicados)?
- [ ] O vidro possui profundidade real com camadas translúcidas escuras (sem aspecto leitoso/branco opaco)?
- [ ] A refração interna está sutil e não compromete a leitura dos textos?
- [ ] O dourado foi utilizado estritamente em títulos editoriais, métricas de destaque e detalhes institucionais?
- [ ] O teal identifica as ações de interação, foco, progresso e links ativos?
- [ ] O espectro multicolorido está contido exclusivamente no ecossistema do Tutor IA?

---

## 2. Matriz de Responsividade Mínima
- [ ] **Desktop 4K / Full HD (`1920×1080`):** Grids equilibrados, legibilidade preservada e respiro amplo.
- [ ] **Notebook Padrão (`1366×768`):** Zero corte de botões Hero no viewport vertical de 530px.
- [ ] **Tablet Vertical (`768×1024`):** Cards adaptam-se em 2 colunas sem sobreposição.
- [ ] **Celular Compacto (`390×844`):** Coluna única, modais via drawer/portal e botões com área de toque mínima de 44px.
- [ ] **Scrollbars:** Ausência total de overflow horizontal (`body { overflow-x: hidden }`) e sem barras verticais duplicadas.

---

## 3. Acessibilidade & Contratos
- [ ] Os pares de cores principais atendem à taxa de contraste mínima **WCAG AA** (4.5:1 para texto normal, 3:1 para títulos).
- [ ] O anel de foco por teclado (`:focus-visible`) é evidente com contorno teal e offset.
- [ ] O token flutuante do Tutor IA preserva sua posição e dimensões congeladas.
- [ ] Animações e efeitos respeitam a diretiva `@media (prefers-reduced-motion: reduce)`.

---

## 4. Definition of Done (Critérios de Conclusão)
1. `npm run test:contracts` aprovado com 100% de sucesso.
2. `npm run build` gerado sem avisos de bundle crítico ou erros de minificação.
3. Teste em navegador comprovando ausência de regressão visual nas 4 resoluções chave.

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("P0.18.7 — Dynamic horizontal tree spacing based on label dimensions and depth offsets", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Não deve conter a fórmula antiga estática de 290px fixos por nível
  assert.doesNotMatch(pageSource, /230\s*\+\s*\(d\.depth\s*-\s*1\)\s*\*\s*290/);

  // Deve computar larguras máximas por nível e calcular depthOffsets dinamicamente
  assert.match(pageSource, /maxWByDepth\[d\.depth\]/);
  assert.match(pageSource, /depthOffsets/);
  assert.match(pageSource, /d\.y\s*=\s*depthOffsets\[d\.depth\]/);
});

test("P0.18.7 — Dual view modes: MODO LEITURA (legible scale floor) vs VISÃO GERAL (overview fit)", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Estado explícito de modo de visualização
  assert.match(pageSource, /const\s*\[viewMode,\s*setViewMode\]\s*=\s*useState\("reading"\)/);

  // Modo Leitura com piso calibrado para legibilidade humana (>= 0.85)
  assert.match(pageSource, /targetMode\s*===\s*"reading"/);
  assert.match(pageSource, /scale\s*=\s*Math\.max\(0\.85/);

  // Visão Geral com enquadramento completo da árvore
  assert.match(pageSource, /Math\.max\(0\.08,\s*rawScale\s*\*\s*0\.94\)/);

  // Controles de modo na toolbar
  assert.ok(pageSource.includes("mindmap-mode-toggle"));
  assert.ok(pageSource.includes("mindmap-mode-btn"));
});

test("P0.18.7 — Elimination of fictitious 200px limit & real canvas margin calculations", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Elimina o Math.max(200, ...) fictício
  assert.doesNotMatch(pageSource, /Math\.max\(200,\s*W\s*-\s*padLeft/);
  assert.doesNotMatch(pageSource, /Math\.max\(200,\s*H\s*-\s*padTop/);

  // Usa margens limpas reais
  assert.match(pageSource, /availW\s*=\s*Math\.max\(50,\s*W\s*-\s*padLeft\s*-\s*padRight\)/);
  assert.match(pageSource, /availH\s*=\s*Math\.max\(50,\s*H\s*-\s*padTop\s*-\s*padBottom\)/);
});

test("P0.18.7 — Programmatic vs user interaction isolation (ResizeObserver & ZoomBehavior)", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Distingue zoom programático de interação manual do usuário usando event.sourceEvent
  assert.match(pageSource, /isProgrammaticZoomRef/);
  assert.match(pageSource, /event\.sourceEvent\s*&&\s*!isProgrammaticZoomRef\.current/);

  // ResizeObserver preserva o modo atual e recalcula sem bloqueio indevido
  assert.match(pageSource, /fitGraphToViewport\(false,\s*\{\s*mode:\s*viewMode\s*\}\)/);
});

test("P0.18.7 — Adaptive lateral editor collapse and expand", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Largura e altura adaptativas no estado inicial
  assert.match(pageSource, /window\.innerWidth\s*<=\s*1300\s*\|\|\s*window\.innerHeight\s*<=\s*700/);
  assert.ok(pageSource.includes("sidebarCollapsed"));
  assert.ok(pageSource.includes("setSidebarCollapsed"));
});

test("P0.18.7 — Minimap coordinate precision and reactive state binding", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Estado reativo treeBounds para renderização imediata do minimapa
  assert.match(pageSource, /const\s*\[treeBounds,\s*setTreeBounds\]\s*=\s*useState\(null\)/);

  // Mapeamento exato de coordenadas compensando o padding de 8px no viewBox 140x85
  assert.match(pageSource, /\(vbX\s*-\s*8\)\s*\/\s*124/);
  assert.match(pageSource, /\(vbY\s*-\s*8\)\s*\/\s*69/);
});

test("P0.18.7 — Localized Marina clearance without penalizing entire canvas width", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Não penaliza padBottom globalmente com marinaOverlapH
  assert.doesNotMatch(pageSource, /padBottom\s*=\s*Math\.max\(48,\s*marinaOverlapH/);

  // Ajusta apenas ty em caso de colisão de canto
  assert.match(pageSource, /overlapY\s*=\s*nodeBottom\s*-\s*marinaTopInSvg/);
});

test("P0.18.7 — CSS styling for mode toggle, elevated minimap z-index and short screen optimization", async () => {
  const cssSource = await read("src/styles/A26MindMap.css");

  assert.ok(cssSource.includes(".mindmap-mode-toggle"));
  assert.ok(cssSource.includes(".mindmap-mode-btn"));
  assert.match(cssSource, /\.mindmap-minimap\s*\{[^}]*z-index:\s*30/);
  assert.ok(cssSource.includes("@media (max-height: 768px)"));
});

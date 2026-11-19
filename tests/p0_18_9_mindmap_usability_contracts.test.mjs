import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../src/pages/student/AnatomicalMindMapPage.jsx", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../src/styles/A26MindMap.css", import.meta.url), "utf8");

test("P0.18.9 — Hybrid B+C Tabbed architecture in Sidebar", () => {
  // Tab state initialization
  assert.match(pageSource, /const\s*\[sidebarTab,\s*setSidebarTab\]\s*=\s*useState\(["']structure["']\)/);

  // Tab navigation markup with accessible WAI-ARIA tablist & tabs
  assert.match(pageSource, /role=["']tablist["']/);
  assert.match(pageSource, /role=["']tab["']/);
  assert.match(pageSource, /id=["']tab-structure["']/);
  assert.match(pageSource, /id=["']tab-ai["']/);
  assert.match(pageSource, /aria-controls=["']panel-structure["']/);
  assert.match(pageSource, /aria-controls=["']panel-ai["']/);

  // Structure tab panel with outline box, textarea, and pinned action footer
  assert.match(pageSource, /id=["']panel-structure["']/);
  assert.match(pageSource, /className=["']mindmap-tab-panel mindmap-tab-panel--structure["']/);
  assert.match(pageSource, /className=["']mindmap-sidebar-actions["']/);
  assert.match(pageSource, /onClick=\{renderFromOutline\}/);

  // AI Tab panel with composer, quick suggestion chips, and auto tab-switch on completion
  assert.match(pageSource, /id=["']panel-ai["']/);
  assert.match(pageSource, /className=["']mindmap-tab-panel mindmap-tab-panel--ai["']/);
  assert.match(pageSource, /className=["']mindmap-ai-suggestions["']/);
  assert.match(pageSource, /setSidebarTab\(["']structure["']\)/);
});

test("P0.18.9 — Adaptive Topbar with Container Queries and A26Popover", () => {
  // Primary controls in Topbar
  assert.match(pageSource, /className=["']mindmap-topbar["']/);
  assert.match(pageSource, /className=["']mindmap-mode-toggle["']/);
  assert.match(pageSource, /className=["']zoom-percentage-btn["']/);

  // Secondary actions grouped in desktop containers and popover
  assert.match(pageSource, /className=["']topbar-desktop-actions/);
  assert.match(pageSource, /className=["']zoom-desktop-tools["']/);
  assert.match(pageSource, /className=["']mindmap-more-menu-wrap["']/);
  assert.match(pageSource, /<A26Popover[\s\S]*?className=["']mindmap-more-popover["']/);

  // Container query CSS declarations
  assert.match(cssSource, /container-type:\s*inline-size;/);
  assert.match(cssSource, /container-name:\s*mindmap-canvas;/);
  assert.match(cssSource, /@container\s+mindmap-canvas\s*\(max-width:\s*860px\)/);
  assert.match(cssSource, /\.topbar-desktop-actions,\s*\.zoom-desktop-tools\s*\{[^}]*display:\s*none\s*!important;/);
});

test("P0.18.9 — Collapsible Minimap with floating pill and zero node overlap", () => {
  // Minimap state and keyboard shortcut
  assert.match(pageSource, /const\s*\[minimapExpanded,\s*setMinimapExpanded\]\s*=\s*useState\(false\)/);
  assert.match(pageSource, /case\s*["']m["']:\s*case\s*["']M["']:\s*e\.preventDefault\(\);\s*setMinimapExpanded\(/);

  // Collapsed floating pill and expanded minimap view
  assert.match(pageSource, /className=["']mindmap-minimap-pill["']/);
  assert.match(pageSource, /className=["']mindmap-minimap is-expanded["']/);
  assert.match(pageSource, /className=["']mindmap-minimap__minimize-btn["']/);

  // CSS rules for pill and expanded minimap
  assert.match(cssSource, /\.mindmap-minimap-pill\s*\{[^}]*position:\s*absolute;/);
  assert.match(cssSource, /\.mindmap-minimap\s*\{[^}]*position:\s*absolute;/);
  assert.match(cssSource, /\.mindmap-minimap__header/);
});

test("P0.18.9 — Node typography calibration and visual legibility (Fase 10)", () => {
  // Typography measurement matching canvas font specifications
  assert.match(pageSource, /measurementCtx\.font\s*=\s*depth === 0 \? "700 14\.5px Inter, system-ui, sans-serif" : "600 12\.8px Inter, system-ui, sans-serif"/);

  // D3 text rendering font sizes and weights
  assert.match(pageSource, /\.attr\(["']font-size["'],\s*\(d\)\s*=>\s*\(d\.depth === 0 \? 14\.5 : 12\.8\)\)/);
  assert.match(pageSource, /\.attr\(["']font-weight["'],\s*\(d\)\s*=>\s*\(d\.depth === 0 \? 700 : 600\)\)/);
  assert.match(pageSource, /\.attr\(["']letter-spacing["'],\s*["']-0\.01em["']\)/);
});

test("P0.18.9 — Light mode contrast and frosted glass styling", () => {
  assert.match(cssSource, /\.a26-theme-light\s+\.mindmap-sidebar-nav/);
  assert.match(cssSource, /\.a26-theme-light\s+\.mindmap-tab-btn/);
  assert.match(cssSource, /\.a26-theme-light\s+\.mindmap-minimap-pill/);
  assert.match(cssSource, /\.a26-theme-light\s+\.mindmap-more-popover/);
  assert.match(cssSource, /\.a26-theme-light\s+\.mindmap-suggestion-chip/);
});

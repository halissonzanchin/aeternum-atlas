/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.9.2
 * CONTRACT TEST: ERGONOMIC 3-REGION AI TAB, SMART SCROLL & RESPONSIVE TOOLBAR
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const MINDMAP_CSS_PATH = path.resolve("src/styles/A26MindMap.css");
const MINDMAP_PAGE_PATH = path.resolve("src/pages/student/AnatomicalMindMapPage.jsx");

test("P0.18.9.2 — AnatomicalMindMapPage implements 3-region AI Tab Architecture", () => {
  const jsx = fs.readFileSync(MINDMAP_PAGE_PATH, "utf8");

  // Region 1: Header/State
  assert.match(jsx, /className="mindmap-ai-header"/, "Must render .mindmap-ai-header for status and state");

  // Region 2: Central Scrollable Content
  assert.match(jsx, /className="mindmap-ai-scrollable-content"/, "Must render .mindmap-ai-scrollable-content for input and suggestions");

  // Region 3: Persistent Actions
  assert.match(jsx, /className="mindmap-ai-actions"/, "Must render .mindmap-ai-actions for bottom generate button & link");
  assert.match(jsx, /className="mindmap-ai-footer-link"/, "Must render .mindmap-ai-footer-link inside actions");
});

test("P0.18.9.2 — A26MindMap.css styles 3-region architecture with scrollable middle and pinned bottom", () => {
  const css = fs.readFileSync(MINDMAP_CSS_PATH, "utf8");

  // AI Tab Panel is flex column with zero overflow-y clip
  assert.match(css, /\.mindmap-tab-panel--ai\s*{[^}]*display:\s*flex;/);
  assert.match(css, /\.mindmap-tab-panel--ai\s*{[^}]*flex-direction:\s*column;/);

  // Region 1 Header shrinks to 0
  assert.match(css, /\.mindmap-ai-header\s*{[^}]*flex-shrink:\s*0;/);

  // Region 2 Scrollable content has flex: 1, overflow-y: auto, and overscroll contain
  assert.match(css, /\.mindmap-ai-scrollable-content\s*{[^}]*overflow-y:\s*auto;/);
  assert.match(css, /\.mindmap-ai-scrollable-content\s*{[^}]*overscroll-behavior:\s*contain;/);

  // Region 3 Actions is pinned to bottom with flex-shrink: 0
  assert.match(css, /\.mindmap-ai-actions\s*{[^}]*flex-shrink:\s*0;/);
  assert.match(css, /\.mindmap-ai-actions\s*{[^}]*margin-top:\s*auto;/);
});

test("P0.18.9.2 — A26MindMap.css configures overscroll containment and flex layout on sidebar", () => {
  const css = fs.readFileSync(MINDMAP_CSS_PATH, "utf8");

  const sidebarBlockMatch = css.match(/\.mindmap-sidebar\s*{([^}]+)}/);
  assert.ok(sidebarBlockMatch, ".mindmap-sidebar must exist");
  assert.match(sidebarBlockMatch[1], /overscroll-behavior:\s*contain/, "Must configure overscroll-behavior: contain on sidebar");
  assert.match(sidebarBlockMatch[1], /display:\s*flex/, "Must configure display: flex on sidebar");
});

test("P0.18.9.2 — Sidebar tab buttons prevent text collision and badge clipping", () => {
  const css = fs.readFileSync(MINDMAP_CSS_PATH, "utf8");

  assert.match(css, /\.mindmap-tab-btn\s*{[^}]*min-width:\s*0;/);
  assert.match(css, /\.mindmap-tab-btn\s*{[^}]*overflow:\s*hidden;/);
  assert.match(css, /\.mindmap-tab-btn\s*\.mindmap-tab-text\s*{[^}]*text-overflow:\s*ellipsis;/);
  assert.match(css, /\.mindmap-tab-badge\s*{[^}]*flex-shrink:\s*0;/);
});

test("P0.18.9.2 — Canvas Container Queries calibrate toolbar tiers without window media query bugs", () => {
  const css = fs.readFileSync(MINDMAP_CSS_PATH, "utf8");

  // Compact tier
  assert.match(css, /@container\s+mindmap-canvas\s*\(\s*max-width:\s*860px\s*\)/);

  // Intermediate tier (e.g. 80% zoom with sidebar open)
  assert.match(css, /@container\s+mindmap-canvas\s*\(\s*min-width:\s*861px\s*\)\s*and\s*\(\s*max-width:\s*1179px\s*\)/);
  assert.match(css, /\.topbar-export-group\s+\.export-btn-short\s*{[^}]*display:\s*inline\s*!important;/);

  // Full desktop tier
  assert.match(css, /@container\s+mindmap-canvas\s*\(\s*min-width:\s*1180px\s*\)/);
});

test("P0.18.9.2 — D3 SVG node font-sizes remain strictly preserved from P0.18.9", () => {
  const jsx = fs.readFileSync(MINDMAP_PAGE_PATH, "utf8");

  // Root node: 14.5px, Branch node: 12.8px
  assert.match(jsx, /\.attr\("font-size",\s*\(d\)\s*=>\s*\(d\.depth\s*===\s*0\s*\?\s*14\.5\s*:\s*12\.8\)\)/);
});

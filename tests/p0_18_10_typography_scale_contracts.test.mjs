/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.10
 * CONTRACT TEST: AETERNUM 26.4 SEMANTIC TYPOGRAPHY SCALE & RESPONSIVE HIERARCHY
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FOUNDATION_PATH = path.resolve("src/styles/A26Foundation.css");
const SHELL_PATH = path.resolve("src/styles/A26Shell.css");
const MINDMAP_PAGE_PATH = path.resolve("src/pages/student/AnatomicalMindMapPage.jsx");

test("P0.18.10 — A26Foundation defines calibrated Aeternum 26.4 semantic typography tokens", () => {
  const css = fs.readFileSync(FOUNDATION_PATH, "utf8");

  assert.match(css, /--a26-text-display-size:\s*clamp\(1\.625rem,\s*2\.2vw,\s*1\.875rem\);/);
  assert.match(css, /--a26-text-h1-size:\s*clamp\(1\.375rem,\s*1\.8vw,\s*1\.5rem\);/);
  assert.match(css, /--a26-text-h2-size:\s*1\.2rem;/);
  assert.match(css, /--a26-text-h3-size:\s*1\.0625rem;/);
  assert.match(css, /--a26-text-body-academic-size:\s*0\.96875rem;/);
  assert.match(css, /--a26-text-body-size:\s*0\.875rem;/);
  assert.match(css, /--a26-text-caption-size:\s*0\.75rem;/);
  assert.match(css, /--a26-text-label-size:\s*0\.8125rem;/);
  assert.match(css, /--a26-text-metric-size:\s*1\.5625rem;/);
});

test("P0.18.10 — A26Foundation enforces zero !important in foundation stylesheets", () => {
  const css = fs.readFileSync(FOUNDATION_PATH, "utf8");
  assert.doesNotMatch(css, /!important/, "A26Foundation.css must not use !important");
});

test("P0.18.10 — A26Foundation protects mobile viewports against iOS Safari auto-zoom (min 16px)", () => {
  const css = fs.readFileSync(FOUNDATION_PATH, "utf8");
  assert.match(css, /@media\s*\(max-width:\s*768px\)/);
  assert.match(css, /input\.a26-input/);
  assert.match(css, /select\.a26-select/);
  assert.match(css, /font-size:\s*16px;/);
});

test("P0.18.10 — A26Shell implements compact navigation footprint (saving ~64px vertical space)", () => {
  const css = fs.readFileSync(SHELL_PATH, "utf8");

  // Topbar calibrated to 60px height
  assert.match(css, /\.a26-shell__topbar\s*{[^}]*min-height:\s*60px;/);

  // Sidebar buttons calibrated to 40px height with 13.5px font
  assert.match(css, /\.a26-shell__sidebar-nav button\s*,\s*\.a26-shell__mobile-menu button\s*{[^}]*min-height:\s*40px;/);
  assert.match(css, /\.a26-shell__sidebar-nav button\s*,\s*\.a26-shell__mobile-menu button\s*{[^}]*font-size:\s*var\(--a26-text-nav-size,\s*13\.5px\);/);
});

test("P0.18.10 — Mind Map D3 SVG node font-sizes remain strictly preserved from P0.18.9", () => {
  const code = fs.readFileSync(MINDMAP_PAGE_PATH, "utf8");
  
  // D3 node label size: 14.5px root, 12.8px branch
  assert.match(code, /\.attr\("font-size",\s*\(d\)\s*=>\s*\(d\.depth\s*===\s*0\s*\?\s*14\.5\s*:\s*12\.8\)\)/);
});

test("P0.18.10 — A26Foundation exports body-academic and label typography utility classes", () => {
  const css = fs.readFileSync(FOUNDATION_PATH, "utf8");
  assert.match(css, /\.a26-type-body-academic\s*{/);
  assert.match(css, /\.a26-type-label\s*{/);
});

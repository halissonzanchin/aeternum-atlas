import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appLayout = await readFile(new URL("../src/components/Layout/AppLayout.jsx", import.meta.url), "utf8");
const featureShell = await readFile(new URL("../src/components/aeternum-26/A26FeatureShell.jsx", import.meta.url), "utf8");
const shellCss = await readFile(new URL("../src/styles/A26Shell.css", import.meta.url), "utf8");
const studentConsolidationCss = await readFile(new URL("../src/styles/A26StudentConsolidation.css", import.meta.url), "utf8");
const mindMapCss = await readFile(new URL("../src/styles/A26MindMap.css", import.meta.url), "utf8");
const mindMapPage = await readFile(new URL("../src/pages/student/AnatomicalMindMapPage.jsx", import.meta.url), "utf8");

test("P0.18.8 — AppLayout implements dynamic canvas route detection and applies a26-shell__content--canvas", () => {
  assert.match(appLayout, /isCanvasRoute\s*=\s*Boolean\(/);
  assert.match(appLayout, /path === "\/mind-map"/);
  assert.match(appLayout, /className=\{`a26-shell__content\$\{isCanvasRoute \? " a26-shell__content--canvas" : ""\}`\}/);
  assert.match(appLayout, /id="a26-shell-content"/);
});

test("P0.18.8 — A26Shell.css eliminates artificial bottom reservation for canvas content in desktop and mobile", () => {
  // Desktop canvas reset: 0 padding, 0 padding-bottom, 100% height
  assert.match(shellCss, /\.a26-shell__content\.a26-shell__content--canvas,\s*\.a26-shell__content:has\(\.a26-feature-shell--canvas\)\s*\{[^}]*padding:\s*0;/s);
  assert.match(shellCss, /\.a26-shell__content\.a26-shell__content--canvas,\s*\.a26-shell__content:has\(\.a26-feature-shell--canvas\)\s*\{[^}]*padding-bottom:\s*0;/s);
  assert.match(shellCss, /\.a26-shell__content\.a26-shell__content--canvas,\s*\.a26-shell__content:has\(\.a26-feature-shell--canvas\)\s*\{[^}]*height:\s*100%;/s);
  assert.match(shellCss, /\.a26-shell__content\.a26-shell__content--canvas,\s*\.a26-shell__content:has\(\.a26-feature-shell--canvas\)\s*\{[^}]*overflow:\s*hidden;/s);

  // Mobile / tablet reset: overrides padding: 20px 20px 104px
  assert.match(shellCss, /@media \(max-width: 1023px\)[\s\S]*\.a26-shell__content\.a26-shell__content--canvas,\s*\.a26-shell__content:has\(\.a26-feature-shell--canvas\)[\s\S]*padding:\s*0;[\s\S]*padding-bottom:\s*0;/);
});

test("P0.18.8 — A26StudentConsolidation.css locks overflow and scrollbar gutters for canvas pages", () => {
  assert.match(studentConsolidationCss, /\.a26-shell__content\.a26-shell__content--canvas,\s*\.a26-shell__content:has\(\.a26-feature-shell--canvas\)\s*\{[^}]*overflow-y:\s*hidden;/s);
  assert.match(studentConsolidationCss, /\.a26-shell__content\.a26-shell__content--canvas,\s*\.a26-shell__content:has\(\.a26-feature-shell--canvas\)\s*\{[^}]*scrollbar-gutter:\s*auto;/s);
  assert.match(studentConsolidationCss, /\.a26-shell__content\.a26-shell__content--canvas,\s*\.a26-shell__content:has\(\.a26-feature-shell--canvas\)\s*\{[^}]*overscroll-behavior:\s*none;/s);
});

test("P0.18.8 — A26FeatureShell uses valid semantic div body container without nesting main elements", () => {
  assert.match(featureShell, /<div className="a26-feature-shell__body">/);
  assert.doesNotMatch(featureShell, /<main className="a26-feature-shell__body">/);
});

test("P0.18.8 — A26MindMap.css optimizes hint margins on compact viewports to maximize canvas height", () => {
  assert.match(mindMapCss, /@media \(max-height: 768px\)[\s\S]*\.mindmap-hint[\s\S]*margin:\s*0\.2rem 1rem 0\.35rem;/);
});

test("P0.18.8 — Non-canvas pages preserve safe area and bottom navigation clearance", () => {
  // Non-canvas .a26-shell__content preserves padding-bottom: max(36px, calc(env(safe-area-inset-bottom) + 84px))
  assert.match(shellCss, /\.a26-shell__content\s*\{[^}]*padding-bottom:\s*max\(\s*36px,\s*calc\(env\(safe-area-inset-bottom\)\s*\+\s*84px\)\s*\);/s);
});

test("P0.18.8 — AnatomicalMindMapPage preserves Reading mode floor and dual view modes", () => {
  assert.match(mindMapPage, /viewMode === "reading"/);
  assert.match(mindMapPage, /scale = Math\.max\(0\.85/);
  assert.match(mindMapPage, /scale = Math\.min\(1\.35, Math\.max\(0\.08, rawScale \* 0\.94\)\)/);
  assert.match(mindMapPage, /Localized Marina clearance/);
});

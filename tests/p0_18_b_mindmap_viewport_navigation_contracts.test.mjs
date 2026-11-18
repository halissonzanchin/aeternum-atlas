import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("P0.18.B — AnatomicalMindMapPage removes rigid scale floor and supports full zoom range", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Não deve conter o piso antigo de 0.35 que cortava nós em zoom 100%
  assert.doesNotMatch(pageSource, /Math\.max\(0\.35/);
  // Deve conter o piso calibrado (0.08) para árvores extensas
  assert.match(pageSource, /Math\.max\(0\.08/);

  // scaleExtent deve suportar de 0.05 a 3.5
  assert.match(pageSource, /scaleExtent\(\[0\.05,\s*3\.5\]\)/);
});

test("P0.18.B — AnatomicalMindMapPage provides complete navigation tools and minimap", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  // Toolbar controls
  assert.ok(pageSource.includes("zoom-percentage-btn"));
  assert.ok(pageSource.includes("zoomTo100"));
  assert.ok(pageSource.includes("centerRoot"));
  assert.ok(pageSource.includes("Ajustar à tela"));
  assert.ok(pageSource.includes("Centralizar raiz"));
  assert.ok(pageSource.includes("mindmap-minimap"));
  assert.ok(pageSource.includes("minimap-viewport-indicator"));
  assert.ok(pageSource.includes("handleMinimapClick"));
});

test("P0.18.B — AnatomicalMindMapPage implements keyboard pan and zoom shortcuts", async () => {
  const pageSource = await read("src/pages/student/AnatomicalMindMapPage.jsx");

  assert.ok(pageSource.includes("ArrowLeft"));
  assert.ok(pageSource.includes("ArrowRight"));
  assert.ok(pageSource.includes("ArrowUp"));
  assert.ok(pageSource.includes("ArrowDown"));
  assert.ok(pageSource.includes("zoomBehaviorRef.current.translateBy"));
});

test("P0.18.B — A26MindMap.css styles navigation percentage, minimap and frosted indicators", async () => {
  const cssSource = await read("src/styles/A26MindMap.css");

  assert.ok(cssSource.includes(".zoom-percentage-btn"));
  assert.ok(cssSource.includes(".mindmap-minimap"));
  assert.ok(cssSource.includes(".minimap-viewport-indicator"));
  assert.ok(cssSource.includes(".mindmap-minimap__badge"));
});

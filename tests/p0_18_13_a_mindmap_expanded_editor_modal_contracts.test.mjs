import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const mindmapCssPath = path.join(repoRoot, "src/styles/A26MindMap.css");
const pageJsxPath = path.join(repoRoot, "src/pages/student/AnatomicalMindMapPage.jsx");

test("P0.18.13-A — Mind Map expanded editor modal implements 4-region vertical flexbox", () => {
  const css = fs.readFileSync(mindmapCssPath, "utf8");

  // Região do modal em flexbox vertical sem scroll externo arbitrário
  assert.match(
    css,
    /\.a26-modal\.mindmap-editor-modal\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s,
    "Modal deve ser display: flex e flex-direction: column"
  );

  assert.match(
    css,
    /\.a26-modal\.mindmap-editor-modal\s*\{[^}]*overflow:\s*hidden;/s,
    "Modal deve ter overflow: hidden no desktop para eliminar barra de rolagem externa competidora"
  );
});

test("P0.18.13-A — Mind Map expanded editor content and textarea flex properly without rigid minimums", () => {
  const css = fs.readFileSync(mindmapCssPath, "utf8");

  // Região 3 elástica
  assert.match(
    css,
    /\.mindmap-editor-modal\s+\.a26-modal__content\s*\{[^}]*flex:\s*1\s+1\s+auto;[^}]*min-height:\s*0;/s,
    "Content do modal deve expandir elasticamente com flex: 1 1 auto e min-height: 0"
  );

  assert.match(
    css,
    /\.mindmap-editor-modal\s+\.mindmap-expanded-editor\s+textarea\.a26-field__control\s*\{[^}]*resize:\s*none;[^}]*overflow-y:\s*auto;/s,
    "Textarea deve ter resize: none e overflow-y: auto para concentrar rolagem internamente"
  );
});

test("P0.18.13-A — Mind Map expanded editor actions footer remains anchored and visible", () => {
  const css = fs.readFileSync(mindmapCssPath, "utf8");

  // Região 4 do footer
  assert.match(
    css,
    /\.mindmap-editor-modal\s+\.a26-modal__actions\s*\{[^}]*flex:\s*0\s+0\s+auto;/s,
    "Footer de ações deve ter flex: 0 0 auto para nunca ser comprimido ou cortado"
  );
});

test("P0.18.13-A — Mind Map expanded editor supports Light Liquid Glass theme", () => {
  const css = fs.readFileSync(mindmapCssPath, "utf8");

  assert.match(
    css,
    /\.a26-theme-light\s+\.a26-modal\.mindmap-editor-modal\s*\{/s,
    "Deve conter regras de adaptação para Light Liquid Glass"
  );

  assert.match(
    css,
    /\.a26-theme-light\s+\.mindmap-editor-modal\s+\.mindmap-expanded-editor\s+textarea\.a26-field__control\s*\{[^}]*color:\s*#0f172a;/s,
    "Textarea em tema claro deve usar tipografia escura #0f172a"
  );
});

test("P0.18.13-A — Mind Map expanded editor implements responsive mobile and compact viewport rules", () => {
  const css = fs.readFileSync(mindmapCssPath, "utf8");

  assert.match(
    css,
    /@media\s*\(\s*max-width:\s*480px\s*\)\s*\{[^}]*\.mindmap-editor-modal\s+\.a26-modal__actions\s*\{[^}]*flex-direction:\s*column-reverse;/s,
    "Em telas estreitas (<= 480px) as ações devem empilhar verticalmente"
  );

  assert.match(
    css,
    /@media\s*\(\s*max-height:\s*480px\s*\)\s*\{[^}]*\.a26-modal\.mindmap-editor-modal\s*\{[^}]*overflow-y:\s*auto;/s,
    "Em viewports extremamente baixos (<= 480px) deve haver salvaguarda de scroll externo seguro"
  );
});

test("P0.18.13-A — AnatomicalMindMapPage wires expanded editor modal with accessible actions and labels", () => {
  const jsx = fs.readFileSync(pageJsxPath, "utf8");

  assert.match(jsx, /open=\{isOutlineEditorOpen\}/, "Modal deve estar conectado ao estado isOutlineEditorOpen");
  assert.match(jsx, /className="mindmap-editor-modal"/, "Modal deve receber a classe scoped mindmap-editor-modal");
  assert.match(jsx, /renderFromOutline\(\);[\s\S]*setIsOutlineEditorOpen\(false\);/, "Botão Aplicar e renderizar deve disparar renderFromOutline e fechar");
});

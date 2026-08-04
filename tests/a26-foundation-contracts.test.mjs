import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../src/styles/A26Foundation.css", import.meta.url), "utf8");
const globalsCss = await readFile(new URL("../src/styles/globals.css", import.meta.url), "utf8");
const primitives = await readFile(new URL("../src/components/aeternum-26/A26Primitives.jsx", import.meta.url), "utf8");
const playground = await readFile(new URL("../src/features/aeternum-26/A26FoundationPlayground.jsx", import.meta.url), "utf8");
const adapter = await readFile(new URL("../src/components/system/AeternumGlassSurface.jsx", import.meta.url), "utf8");
const card = await readFile(new URL("../src/components/Card/Card.jsx", import.meta.url), "utf8");
const legacyButton = await readFile(new URL("../src/components/Button/Button.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/pages/home/Home.jsx", import.meta.url), "utf8");
const dashboard = await readFile(new URL("../src/pages/dashboard/Dashboard.jsx", import.meta.url), "utf8");

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) files.push(...await sourceFiles(url));
    else if (/\.(?:css|js|jsx|ts|tsx)$/.test(entry.name)) files.push(url);
  }

  return files;
}

const applicationSourceFiles = await sourceFiles(new URL("../src/", import.meta.url));

const primitiveNames = [
  "A26Button",
  "A26Card",
  "A26DataDisclosure",
  "A26EmptyState",
  "A26ErrorState",
  "A26Field",
  "A26IconButton",
  "A26LoadingState",
  "A26Metric",
  "A26Modal",
  "A26Popover",
  "A26SegmentedControl",
  "A26Sidebar",
  "A26TabBar",
  "A26Toolbar",
  "A26TutorSurface"
];

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map(value => Number.parseInt(value, 16) / 255);
  return channels
    .map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("the four official A26 materials are tokenized", () => {
  for (const material of ["clear", "regular", "substantial", "opaque"]) {
    assert.match(css, new RegExp(`--a26-material-${material}-bg:`));
    assert.match(css, new RegExp(`\\.a26-material-${material}\\s*\\{`));
  }
});

test("foundation contains accessibility and composition safeguards", () => {
  assert.doesNotMatch(css, /!important/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.match(css, /\[data-a26-blur="true"\]\s+\[data-a26-blur="true"\]/);
});

test("all official primitives are exported and demonstrated", () => {
  for (const name of primitiveNames) {
    assert.match(primitives, new RegExp(`(?:function|const)\\s+${name}\\b`));
    assert.match(playground, new RegExp(`<${name}\\b`));
  }
});

test("legacy surfaces declare their A26 adapter contract", () => {
  assert.match(adapter, /data-a26-adapter/);
  assert.match(adapter, /data-a26-material/);
  assert.match(card, /data-a26-material="opaque"/);
  assert.doesNotMatch(card, /backdrop-blur/);
});

test("liquid controls are reusable across public, student and legacy actions", () => {
  assert.match(primitives, /variant = "liquid"/);
  assert.match(css, /\.a26-button--liquid,[\s\S]*\.a26-button--secondary\s*\{/);
  assert.match(css, /\.a26-button--liquid:hover,[\s\S]*inset 0 -1px 0 rgb\(223 197 127/);
  assert.match(legacyButton, /a26-liquid-button-adapter/);
  assert.match(home, /variant="liquid"[\s\S]*public-home-nav-button/);
  assert.match(dashboard, /variant="liquid"/);
});

test("essential A26 token pairs meet WCAG AA", () => {
  assert.ok(contrast("f4fbfa", "091318") >= 4.5);
  assert.ok(contrast("aebfbe", "091318") >= 4.5);
  assert.ok(contrast("031112", "37c8c3") >= 4.5);
});

test("interactive controls do not use clipped global pseudo-tooltips", async () => {
  const offenders = [];

  for (const file of applicationSourceFiles) {
    const source = await readFile(file, "utf8");
    if (/data-tooltip|\[data-tooltip\]/.test(source)) offenders.push(file.pathname);
  }

  assert.deepEqual(offenders, []);
  assert.doesNotMatch(globalsCss, /content:\s*attr\(data-tooltip\)/);
});

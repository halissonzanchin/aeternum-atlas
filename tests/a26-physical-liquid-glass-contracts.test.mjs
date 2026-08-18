import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("A26Primitives exports A26LiquidLens physical optical primitive", () => {
  const file = fs.readFileSync(path.join(root, "src/components/aeternum-26/A26Primitives.jsx"), "utf8");
  assert.match(file, /export function A26LiquidLens/);
  assert.match(file, /data-a26-lens="true"/);
  assert.match(file, /a26-lens__caustic-rim/);
  assert.match(file, /a26-lens__specular-spot/);
});

test("A26Foundation defines physical lens engine and caustics styles", () => {
  const file = fs.readFileSync(path.join(root, "src/styles/A26Foundation.css"), "utf8");
  assert.match(file, /\.a26-liquid-lens/);
  assert.match(file, /--a26-lens-magnification:\s*2\.1/);
  assert.match(file, /--a26-lens-distortion:\s*0\.55/);
  assert.match(file, /--a26-lens-chromatic:\s*0\.02/);
  assert.match(file, /\.a26-lens__caustic-rim/);
  assert.match(file, /\.a26-lens__specular-spot/);
});

test("A26Surface implements dynamic chromatic spectrum and Blinn-Phong specular", () => {
  const file = fs.readFileSync(path.join(root, "src/styles/A26Foundation.css"), "utf8");
  assert.match(file, /\.a26-surface__spectrum/);
  assert.match(file, /\.a26-surface__specular/);
  assert.match(file, /\.a26-surface--interactive:active[\s\S]*scale\(0\.978\)/);
});

test("Aeternum 26.1 SKILL.md declares the 4-Pillar Physical Lens Architecture", () => {
  const skillPath = path.join(process.env.USERPROFILE, ".gemini/config/skills/aeternum-26-liquid-glass/SKILL.md");
  if (fs.existsSync(skillPath)) {
    const file = fs.readFileSync(skillPath, "utf8");
    assert.match(file, /Physical Lens Architecture/i);
    assert.match(file, /Magnification Distortion/i);
    assert.match(file, /Chromatic & Caustics/i);
    assert.match(file, /Fluid Surface Tension/i);
    assert.match(file, /Specular & Depth/i);
  }
});

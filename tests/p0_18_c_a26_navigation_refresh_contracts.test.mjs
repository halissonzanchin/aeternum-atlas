import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const shellCss = await readFile(new URL("../src/styles/A26Shell.css", import.meta.url), "utf8");
const appLayout = await readFile(new URL("../src/components/layout/AppLayout.jsx", import.meta.url), "utf8");
const sidebar = await readFile(new URL("../src/components/Sidebar/Sidebar.jsx", import.meta.url), "utf8");

test("P0.18.C — Sidebar exhibits A26.3 curvilinear fluid frosted crystal geometry", () => {
  // Must have 1.25rem right-side border radius eliminating rigid 90-deg angles
  assert.match(
    shellCss,
    /\.a26-shell__sidebar\s*\{[^}]*border-radius:\s*0\s+1\.25rem\s+1\.25rem\s+0;/s,
    "Sidebar must have curvilinear border-radius (0 1.25rem 1.25rem 0)"
  );
  // Must have lateral ambient glow box-shadow
  assert.match(
    shellCss,
    /\.a26-shell__sidebar\s*\{[^}]*box-shadow:\s*10px\s+0\s+35px/s,
    "Sidebar must have lateral ambient shadow"
  );
});

test("P0.18.C — Topbar canopy exhibits A26.3 curvilinear lower border and optical material variables", () => {
  // Must have 1.25rem bottom border radius eliminating rigid bottom corners
  assert.match(
    shellCss,
    /\.a26-shell__topbar\s*\{[^}]*border-radius:\s*0\s+0\s+1\.25rem\s+1\.25rem;/s,
    "Topbar must have curvilinear bottom border radius (0 0 1.25rem 1.25rem)"
  );
  // Must preserve official A26 material variables and shadow
  assert.match(
    shellCss,
    /\.a26-shell__topbar\s*\{[^}]*--a26-material-blur:\s*24px;/s,
    "Topbar must declare official --a26-material-blur token"
  );
  assert.match(
    shellCss,
    /\.a26-shell__topbar\s*\{[^}]*box-shadow:\s*0\s+12px\s+36px/s,
    "Topbar must declare canopy drop shadow"
  );
});

test("P0.18.C — Workarea content container provides curvilinear contour and Marina floating clearance", () => {
  // Must have rounded top-left corner
  assert.match(
    shellCss,
    /\.a26-shell__content\s*\{[^}]*border-radius:\s*1\.25rem\s+0\s+0\s+0;/s,
    "Content container must have continuous curvilinear border radius (1.25rem 0 0 0)"
  );
  // Must reserve safe margin for floating assistant Marina
  assert.match(
    shellCss,
    /\.a26-shell__content\s*\{[^}]*padding-bottom:\s*max\(\s*36px,\s*calc\(env\(safe-area-inset-bottom\)\s*\+\s*84px\)\);/s,
    "Content container must reserve bottom clearance for floating Marina trigger"
  );
});

test("P0.18.C — Navigation items active state exhibits bioluminescent glow and elevation in Dark & Light modes", () => {
  // Dark mode active state
  assert.match(
    shellCss,
    /\.a26-shell__sidebar-nav button\.is-active[^}]*background:\s*radial-gradient/s,
    "Active sidebar navigation button must have bioluminescent radial-gradient"
  );
  assert.match(
    shellCss,
    /\.a26-shell__sidebar-nav button\.is-active[^}]*transform:\s*translateX\(3px\);/s,
    "Active sidebar navigation button must have subtle lateral translation (3px)"
  );
  assert.match(
    shellCss,
    /\.a26-shell__sidebar-nav button\.is-active[^}]*box-shadow:[^}]*0\s+0\s+18px\s+rgb\(92\s+232\s+223\s*\/\s*0\.18\)/s,
    "Active sidebar navigation button must have glowing cyan box-shadow"
  );

  // Light mode active state
  assert.match(
    shellCss,
    /\.a26-theme-light \.a26-shell__sidebar-nav button\.is-active[^}]*box-shadow:[^}]*0\s+4px\s+18px\s+rgba\(15,\s*118,\s*110,\s*0\.14\)/s,
    "Active sidebar navigation button in light theme must have emerald/teal ambient shadow"
  );
  assert.match(
    shellCss,
    /\.a26-theme-light \.a26-shell__sidebar-nav button\.is-active[^}]*color:\s*#042f2e;/s,
    "Active sidebar navigation button in light theme must have high contrast text"
  );
});

test("P0.18.C — Mobile bottom navigation button active state includes luminescence and safe indicators", () => {
  assert.match(
    shellCss,
    /\.a26-shell__bottom-nav button\.is-active\s*\{[^}]*radial-gradient/s,
    "Mobile bottom navigation active button must have radial gradient glow"
  );
  assert.match(
    shellCss,
    /\.a26-theme-light \.a26-shell__bottom-nav button\.is-active\s*\{[^}]*radial-gradient/s,
    "Mobile bottom navigation active button in light theme must have radial gradient glow"
  );
});

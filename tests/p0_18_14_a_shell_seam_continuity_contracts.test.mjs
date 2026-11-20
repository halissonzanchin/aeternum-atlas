import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const shellCss = await readFile(new URL("../src/styles/A26Shell.css", import.meta.url), "utf8");

test("P0.18.14.A — Desktop Sidebar exhibits continuous straight vertical divider at topbar junction", () => {
  // Sidebar top-right corner must be 0 to provide a continuous vertical divider line from y=0
  assert.match(
    shellCss,
    /\.a26-shell__sidebar\s*\{[^}]*border-radius:\s*0\s+0\s+1\.25rem\s+0;/s,
    "Desktop sidebar must have border-radius: 0 0 1.25rem 0 (straight top-right corner)"
  );

  // Must preserve 1.25rem bottom-right corner for ergonomic fluid curvature
  assert.doesNotMatch(
    shellCss,
    /\.a26-shell__sidebar\s*\{[^}]*border-radius:\s*0\s+1\.25rem/s,
    "Desktop sidebar must NOT curve at top-right corner (which previously caused notched gap)"
  );
});

test("P0.18.14.A — Desktop Topbar establishes clean 90-degree flush T-junction with Sidebar", () => {
  // Topbar bottom-left corner must be 0 in desktop base rule to meet the sidebar divider flush
  assert.match(
    shellCss,
    /\.a26-shell__topbar\s*\{[^}]*border-radius:\s*0\s+0\s+1\.25rem\s+0;/s,
    "Desktop topbar base rule must have border-radius: 0 0 1.25rem 0 (straight bottom-left corner, curved bottom-right)"
  );

  // Extract base rule before media queries
  const baseTopbarMatch = shellCss.match(/\.a26-shell__topbar\s*\{([^}]*)\}/);
  assert.ok(baseTopbarMatch, "Base .a26-shell__topbar rule must exist");
  assert.match(baseTopbarMatch[1], /border-radius:\s*0\s+0\s+1\.25rem\s+0;/);
  assert.doesNotMatch(baseTopbarMatch[1], /border-radius:\s*0\s+0\s+1\.25rem\s+1\.25rem;/);
});

test("P0.18.14.A — Mobile viewports (<1024px) preserve symmetrical lower canopy curvature", () => {
  // When sidebar is hidden on mobile, topbar spans full width and retains symmetrical rounding
  assert.match(
    shellCss,
    /@media\s*\(max-width:\s*1023px\)[\s\S]*?\.a26-shell__topbar\s*\{[^}]*border-radius:\s*0\s+0\s+1\.25rem\s+1\.25rem;/s,
    "Mobile topbar must preserve symmetrical bottom-left and bottom-right curvature (0 0 1.25rem 1.25rem)"
  );
});

test("P0.18.14.A — Light and Dark theme consistency preserves seamless shell junction", () => {
  // Light theme overrides must not reintroduce broken corner radii on sidebar or topbar
  const lightSidebar = shellCss.match(/\.a26-theme-light\s+\.a26-shell__sidebar\s*\{([^}]*)\}/s);
  if (lightSidebar) {
    assert.doesNotMatch(lightSidebar[1], /border-radius:\s*0\s+1\.25rem/);
  }

  const lightTopbar = shellCss.match(/\.a26-theme-light\s+\.a26-shell__topbar\s*\{([^}]*)\}/s);
  if (lightTopbar) {
    assert.doesNotMatch(lightTopbar[1], /border-radius:\s*0\s+0\s+1\.25rem\s+1\.25rem/);
  }
});

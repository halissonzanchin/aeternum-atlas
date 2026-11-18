import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const foundationCss = await readFile(new URL("../src/styles/A26Foundation.css", import.meta.url), "utf8");
const shellCss = await readFile(new URL("../src/styles/A26Shell.css", import.meta.url), "utf8");
const notifCss = await readFile(new URL("../src/components/Notifications/notificationCenter.css", import.meta.url), "utf8");
const surfaceJsx = await readFile(new URL("../src/components/aeternum-26/A26Surface.jsx", import.meta.url), "utf8");
const primitivesJsx = await readFile(new URL("../src/components/aeternum-26/A26Primitives.jsx", import.meta.url), "utf8");

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

test("Frosted Crystal material tokens are properly declared in A26Foundation.css", () => {
  assert.match(foundationCss, /--a26-material-frosted-bg:\s*rgb\(6\s+18\s+23\s*\/\s*0\.92\)/);
  assert.match(foundationCss, /--a26-material-frosted-blur:\s*24px/);
  assert.match(foundationCss, /--a26-material-frosted-saturation:\s*160%/);
  assert.match(foundationCss, /--a26-material-frosted-border:/);
  assert.match(foundationCss, /--a26-material-frosted-shadow:/);

  // Light theme tokens
  assert.match(foundationCss, /--a26-material-frosted-bg:\s*rgba\(255,\s*255,\s*255,\s*0\.94\)/);
  assert.match(foundationCss, /--a26-material-frosted-blur:\s*28px/);
});

test("A26Foundation.css defines .a26-material-frosted class with optical properties", () => {
  assert.match(foundationCss, /\.a26-material-frosted\s*\{[\s\S]*--a26-material-background:\s*var\(--a26-material-frosted-bg\)/);
  assert.match(foundationCss, /\.a26-material-frosted\s*\{[\s\S]*--a26-material-blur:\s*var\(--a26-material-frosted-blur\)/);
  assert.match(foundationCss, /\.a26-material-frosted\s*\{[\s\S]*--a26-material-border:\s*var\(--a26-material-frosted-border\)/);
  assert.match(foundationCss, /\.a26-material-frosted\s*\{[\s\S]*--a26-material-shadow:\s*var\(--a26-material-frosted-shadow\)/);
});

test("Nested blur rule preserves floating surfaces (popovers and modals)", () => {
  assert.match(
    foundationCss,
    /\[data-a26-blur="true"\]\s+\[data-a26-blur="true"\]:not\(\.a26-popover\):not\(\.a26-modal\):not\(\.a26-surface--floating\):not\(\[data-a26-floating="true"\]\)/
  );
  assert.match(
    foundationCss,
    /\.a26-popover,\s*\r?\n\s*\.a26-modal,\s*\r?\n\s*\.a26-surface--floating,\s*\r?\n\s*\[data-a26-floating="true"\]/
  );
});

test("A26Surface supports frosted material in its canonical set", () => {
  assert.match(surfaceJsx, /MATERIALS\s*=\s*new Set\(\[["']clear["'],\s*["']regular["'],\s*["']substantial["'],\s*["']opaque["'],\s*["']frosted["']\]\)/);
});

test("A26Popover and A26Modal apply frosted material and floating flag", () => {
  assert.match(primitivesJsx, /function A26Popover\(\{[\s\S]*material\s*=\s*"frosted"/);
  assert.match(primitivesJsx, /data-a26-floating="true"/);
  assert.match(primitivesJsx, /function A26Modal\(\{[\s\S]*data-a26-floating="true"/);
});

test("Accessibility and graceful degradation fallbacks are verified", () => {
  assert.match(foundationCss, /@supports not \(\(backdrop-filter:\s*blur\(2px\)\)/);
  assert.match(foundationCss, /@media\s*\(prefers-reduced-transparency:\s*reduce\)/);
  assert.doesNotMatch(foundationCss, /!important/);
});

test("Notification cards have high opacity and compliant WCAG contrast", () => {
  assert.match(notifCss, /\.a26-notification-card\s*\{[\s\S]*background:\s*rgba\(11,\s*28,\s*35,\s*0\.82\)/);
  assert.match(notifCss, /\.a26-notification-card\.is-unread\s*\{[\s\S]*background:\s*rgba\(14,\s*38,\s*47,\s*0\.92\)/);
  
  // High contrast text colors:
  // Title #f8fafc on background #0e262f -> contrast
  assert.ok(contrast("f8fafc", "0e262f") >= 11.0); // WCAG AAA
  // Snippet #cbd5e1 on background #0e262f -> contrast
  assert.ok(contrast("cbd5e1", "0e262f") >= 7.0);  // WCAG AAA
  // Time #94a3b8 on background #0e262f -> contrast
  assert.ok(contrast("94a3b8", "0e262f") >= 4.5);  // WCAG AA
});

test("A26Shell adheres strictly to responsive boundary contracts", () => {
  assert.match(shellCss, /\.a26-shell__popover\s*\{[\s\S]*max-width:\s*min\(330px,\s*calc\(100vw - 28px\)\);/);
});

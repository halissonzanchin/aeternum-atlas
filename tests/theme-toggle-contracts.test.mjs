import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("ThemeContext exists and exports ThemeProvider and useTheme", () => {
  const file = fs.readFileSync(path.join(root, "src/context/ThemeContext.jsx"), "utf8");
  assert.match(file, /export function ThemeProvider/);
  assert.match(file, /export function useTheme/);
  assert.match(file, /a26-theme-light/);
  assert.match(file, /a26-theme-dark/);
});

test("LineIcon exports sun and moon vector paths for theme switching", () => {
  const file = fs.readFileSync(path.join(root, "src/components/icons/LineIcon.jsx"), "utf8");
  assert.match(file, /sun:/);
  assert.match(file, /moon:/);
});

test("AppLayout integrates Theme Toggle button in Topbar", () => {
  const file = fs.readFileSync(path.join(root, "src/components/Layout/AppLayout.jsx"), "utf8");
  assert.match(file, /useTheme/);
  assert.match(file, /a26-shell__theme-toggle/);
  assert.match(file, /toggleTheme/);
});

test("A26Foundation defines Light Liquid Glass tokens", () => {
  const file = fs.readFileSync(path.join(root, "src/styles/A26Foundation.css"), "utf8");
  assert.match(file, /\.a26-theme-light/);
  assert.match(file, /--a26-color-canvas:\s*#e8eef3/);
  assert.match(file, /--a26-color-text:\s*#0f172a/);
  assert.match(file, /--a26-color-teal:\s*#0f766e/);
});

test("A26Shell defines Light Liquid Glass layout styling", () => {
  const file = fs.readFileSync(path.join(root, "src/styles/A26Shell.css"), "utf8");
  assert.match(file, /.a26-theme-light .a26-shell/);
  assert.match(file, /.a26-theme-light .a26-shell__sidebar/);
  assert.match(file, /.a26-theme-light .a26-shell__topbar/);
});

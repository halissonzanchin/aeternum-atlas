import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const baselinePath = path.join(root, "scripts", "a26-backdrop-baseline.json");
const officialFoundation = "src/styles/A26Foundation.css";
const supportedExtensions = new Set([".css", ".js", ".jsx", ".ts", ".tsx"]);
const backdropPattern = /(?:-webkit-)?backdrop-filter\s*:|backdropFilter\s*:/g;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolutePath));
    else if (supportedExtensions.has(path.extname(entry.name))) files.push(absolutePath);
  }

  return files;
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const findings = [];

for (const absolutePath of await walk(sourceRoot)) {
  const relativePath = path.relative(root, absolutePath).replaceAll("\\", "/");
  const source = await readFile(absolutePath, "utf8");
  const count = source.match(backdropPattern)?.length || 0;
  if (count > 0) findings.push({ relativePath, count });
}

const violations = findings.filter(({ relativePath, count }) => (
  relativePath !== officialFoundation
  && count > (baseline[relativePath] || 0)
));

if (violations.length > 0) {
  console.error("A26 glass contract violated: use A26Surface instead of adding backdrop-filter.");
  for (const violation of violations) {
    console.error(`- ${violation.relativePath}: ${violation.count} declaration(s), baseline ${baseline[violation.relativePath] || 0}`);
  }
  process.exitCode = 1;
} else {
  const legacyCount = findings
    .filter(({ relativePath }) => relativePath !== officialFoundation)
    .reduce((total, finding) => total + finding.count, 0);
  console.log(`A26 glass contract passed. Legacy baseline: ${legacyCount} declaration(s); new direct declarations: 0.`);
}

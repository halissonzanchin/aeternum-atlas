import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.platform === "linux" && !process.env.ESBUILD_BINARY_PATH) {
  const linuxBin = path.resolve(__dirname, "../node_modules/.pnpm/@esbuild+linux-x64@0.28.2/node_modules/@esbuild/linux-x64/bin/esbuild");
  if (fs.existsSync(linuxBin)) {
    process.env.ESBUILD_BINARY_PATH = linuxBin;
  }
}

let esbuild;
const pnpmEsbuild = path.resolve(__dirname, "../node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/lib/main.js");
const directEsbuild = path.resolve(__dirname, "../node_modules/esbuild/lib/main.js");

if (fs.existsSync(pnpmEsbuild)) {
  esbuild = (await import("file://" + pnpmEsbuild.replace(/\\/g, "/"))).default;
} else if (fs.existsSync(directEsbuild)) {
  esbuild = (await import("file://" + directEsbuild.replace(/\\/g, "/"))).default;
} else {
  esbuild = (await import("esbuild")).default;
}

await esbuild.build({
  entryPoints: [path.resolve(__dirname, "../apps/gateway/src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node24",
  outfile: path.resolve(__dirname, "../dist/gateway.mjs"),
  format: "esm"
});

console.log("Gateway compilado com sucesso em dist/gateway.mjs!");

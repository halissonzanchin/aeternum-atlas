import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "dist");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = http.createServer((request, response) => {
  if (!fs.existsSync(root)) {
    response.writeHead(503, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<h1>Aeternum Atlas</h1><p>Build não encontrado. Execute <code>npm install</code> e <code>npm run build</code> antes de usar o servidor estático.</p>");
    return;
  }

  const url = new URL(request.url, `http://localhost:${port}`);
  const requestedPath = decodeURIComponent(url.pathname);
  let filePath = path.join(root, requestedPath === "/" ? "index.html" : requestedPath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, "index.html");
  }

  const ext = path.extname(filePath);
  response.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Aeternum Atlas static server at http://localhost:${port}`);
});

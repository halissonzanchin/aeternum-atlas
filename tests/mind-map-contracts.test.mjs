import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildMindMapTutorPrompt,
  generateAuthenticatedMindMap,
  normalizeMindMapOutline
} from "../src/services/ai/mindMapGenerationService.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [pageSource, cssSource, edgeSource, primitivesSource] = await Promise.all([
  read("src/pages/student/AnatomicalMindMapPage.jsx"),
  read("src/styles/A26MindMap.css"),
  read("supabase/functions/ai-tutor/index.ts"),
  read("src/components/aeternum-26/A26Primitives.jsx")
]);

test("normalizador aceita Markdown controlado e produz uma árvore segura e única", () => {
  const outline = normalizeMindMapOutline(`# Sistema Nervoso
- Encéfalo
  - Córtex cerebral
  - Tronco encefálico
- Medula espinal
  - Substância cinzenta
  - Substância branca
- Relações clínicas
  - Síndrome medular`);

  const lines = outline.split("\n");
  assert.equal(lines[0], "Sistema Nervoso");
  assert.equal(lines.length, 9);
  assert.equal(new Set(lines.map((line) => line.trim().toLocaleLowerCase("pt-BR"))).size, lines.length);
  assert.ok(lines.slice(1).every((line) => /^\s+\S/.test(line)));
});

test("geração usa a sessão autenticada do Tutor com contexto do mapa mental", async () => {
  const calls = [];
  const result = await generateAuthenticatedMindMap({
    topic: "Plexo braquial",
    sendTutorMessage: async (request) => {
      calls.push(request);
      return {
        mode: "online",
        conversationId: "conversation-1",
        text: `Plexo braquial
 Raízes
  C5
  C6
 Troncos
  Superior
  Médio
 Fascículos
  Lateral`
      };
    }
  });

  assert.equal(result.mode, "online");
  assert.equal(result.conversationId, "conversation-1");
  assert.equal(calls[0].context.source, "mind-map");
  assert.equal(calls[0].context.route, "/mind-map");
  assert.match(calls[0].contextLabel, /Plexo braquial/);
});

test("prompt do mapa impõe formato hierárquico e evita referências fabricadas", () => {
  const prompt = buildMindMapTutorPrompt("Sistema linfático");
  assert.match(prompt, /Responda somente com o esboço hierárquico/i);
  assert.match(prompt, /Não invente referências/i);
  assert.match(prompt, /TEMA: Sistema linfático/);
});

test("página preserva o motor D3 e remove o gerador simulado", () => {
  assert.match(pageSource, /d3\.tree\(\)/);
  assert.match(pageSource, /d3\s*\.\s*zoom\(\)/);
  assert.match(pageSource, /handleExportPNG/);
  assert.match(pageSource, /handleExportPDF/);
  assert.match(pageSource, /generateAuthenticatedMindMap/);
  assert.match(pageSource, /openTutor\(\{/);
  assert.doesNotMatch(pageSource, /Acidentes Anatômicos Principais de/);
});

test("interface usa os materiais oficiais A26 e contém responsividade sem overflow horizontal", () => {
  assert.match(pageSource, /A26Sidebar/);
  assert.match(pageSource, /A26Toolbar/);
  assert.match(pageSource, /A26Surface/);
  assert.match(cssSource, /min-width:\s*0/);
  assert.match(cssSource, /overflow:\s*hidden/);
  assert.match(cssSource, /@media \(max-width: 880px\)/);
  assert.doesNotMatch(cssSource, /material-["']?liquid/);
});

test("editor lateral mantém as ações visíveis e limita a rolagem ao esboço", () => {
  assert.match(cssSource, /\.mindmap-sidebar\s*\{[\s\S]*?grid-template-rows:\s*auto auto minmax\(5\.5rem, 1fr\) auto/);
  assert.match(cssSource, /\.mindmap-outline-box\s*\{[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*hidden/);
  assert.match(cssSource, /\.mindmap-outline-box textarea\.a26-field__control\s*\{[\s\S]*?overflow:\s*auto/);
  assert.match(cssSource, /\.mindmap-sidebar-actions\s*\{[\s\S]*?z-index:\s*2/);
});

test("estrutura editável oferece editor ampliado sem redimensionar o canvas", () => {
  assert.match(pageSource, /isOutlineEditorOpen/);
  assert.match(pageSource, /aria-haspopup="dialog"/);
  assert.match(pageSource, /t\(["']mindMap\.expandButton["']/);
  assert.match(pageSource, /className="mindmap-editor-modal"/);
  assert.match(pageSource, /t\(["']mindMap\.applyAndRender["']/);
  assert.match(cssSource, /\.a26-modal\.mindmap-editor-modal\s*\{[\s\S]*?width:\s*min\(58rem, calc\(100vw - 2rem\)\)/);
  assert.match(cssSource, /\.mindmap-expanded-editor textarea\.a26-field__control\s*\{[\s\S]*?min-height:\s*clamp\(20rem, 52dvh, 34rem\)/);
});

test("modal mantém o editor focado durante alterações sucessivas", () => {
  assert.match(primitivesSource, /const onCloseRef = useRef\(onClose\)/);
  assert.match(primitivesSource, /onCloseRef\.current\?\.\(\)/);
  assert.match(primitivesSource, /}, \[open\]\);/);
  assert.match(primitivesSource, /createPortal\(\(/);
  assert.match(primitivesSource, /\), document\.body\)/);
});

test("Tutor aplica protocolo específico do mapa mental no servidor", () => {
  assert.match(edgeSource, /context\.source === "mind-map"/);
  assert.match(edgeSource, /Modo de saída — Mapa Mental Anatômico/);
  assert.match(edgeSource, /Responda SOMENTE com o esboço hierárquico solicitado/);
});

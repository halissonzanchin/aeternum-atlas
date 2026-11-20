import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

// File paths
const socraticJsxPath = path.join(repoRoot, "src/features/dashboard/components/SocraticClinicalCaseModal.jsx");
const socraticCssPath = path.join(repoRoot, "src/features/dashboard/components/SocraticClinicalCaseModal.css");
const notebookLmJsxPath = path.join(repoRoot, "src/features/atlas-viewer/ai/NotebookLMToolModal.jsx");
const a26PrimitivesJsxPath = path.join(repoRoot, "src/components/aeternum-26/A26Primitives.jsx");
const a26FoundationCssPath = path.join(repoRoot, "src/styles/A26Foundation.css");
const a26StudentConsolidationCssPath = path.join(repoRoot, "src/styles/A26StudentConsolidation.css");
const agendaPopoverJsxPath = path.join(repoRoot, "src/components/student/agenda/AgendaPopoverModal.jsx");
const a26StudyAgendaCssPath = path.join(repoRoot, "src/styles/A26StudyAgenda.css");
const studentHistoryJsxPath = path.join(repoRoot, "src/components/admin/StudentHistoryModal.jsx");
const adminStudentsCssPath = path.join(repoRoot, "src/components/admin/adminStudents.css");
const globalsCssPath = path.join(repoRoot, "src/styles/globals.css");
const muralModularBoardCssPath = path.join(repoRoot, "src/components/MuralModularBoard/MuralModularBoard.css");

// Wave 1 — DEF-P0-01: Socratic Clinical Case Modal
test("DEF-P0-01 — SocraticClinicalCaseModal implements contained 3-region flexbox and Escape key", () => {
  const jsx = fs.readFileSync(socraticJsxPath, "utf8");
  const css = fs.readFileSync(socraticCssPath, "utf8");

  assert.match(jsx, /e\.key\s*===\s*"Escape"/, "Socratic modal deve escutar tecla Escape");
  assert.match(jsx, /className="[^"]*a26-socratic-modal-body[^"]*"/, "Socratic modal deve conter classe a26-socratic-modal-body no scroll container");

  assert.match(css, /\.a26-socratic-modal-card\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s, "Card deve ser flex column");
  assert.match(css, /\.a26-socratic-modal-card\s*\{[^}]*overflow:\s*hidden;/s, "Card deve ter overflow: hidden");
  assert.match(css, /\.a26-socratic-modal-card\s*\{[^}]*max-height:\s*min\(700px,\s*calc\(100dvh\s*-\s*2\.5rem\)\);/s, "Card deve limitar max-height responsivo");
  assert.match(css, /\.a26-socratic-modal-body\s*\{[^}]*flex:\s*1\s+1\s+auto;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s, "Body deve ter flex: 1 1 auto, min-height: 0 e overflow-y: auto");
  assert.match(css, /\.a26-socratic-footer\s*\{[^}]*flex:\s*0\s+0\s+auto;/s, "Footer deve ter flex: 0 0 auto para ancoragem");
});

// Wave 2 — DEF-P1-02: NotebookLMToolModal
test("DEF-P1-02 — NotebookLMToolModal implements constrained flexbox and Escape key", () => {
  const jsx = fs.readFileSync(notebookLmJsxPath, "utf8");

  assert.match(jsx, /e\.key\s*===\s*"Escape"/, "NotebookLM modal deve escutar tecla Escape");
  assert.match(jsx, /max-h-\[min\(88dvh,640px\)\]/, "NotebookLM modal deve ter max-height clamp");
  assert.match(jsx, /flex flex-col/, "NotebookLM modal deve ser flex flex-col");
  assert.match(jsx, /overflow-hidden/, "NotebookLM modal deve ter overflow-hidden");
  assert.match(jsx, /flex-1 min-h-0 overflow-y-auto/, "NotebookLM body deve ter flex-1 min-h-0 overflow-y-auto");
});

// Wave 2 — DEF-P1-03: A26Modal Contained Pattern
test("DEF-P1-03 — A26Modal supports layout='contained' and auto-contained with actions", () => {
  const jsx = fs.readFileSync(a26PrimitivesJsxPath, "utf8");
  const css = fs.readFileSync(a26FoundationCssPath, "utf8");

  assert.match(jsx, /layout\s*=\s*"auto"/, "A26Modal deve ter prop layout com padrão 'auto'");
  assert.match(jsx, /a26-modal--contained/, "A26Modal deve injetar classe a26-modal--contained");
  assert.match(jsx, /data-a26-layout=/, "A26Modal deve renderizar data-a26-layout");

  assert.match(css, /\.a26-modal--contained,\s*\.a26-modal\[data-a26-layout="contained"\]\s*\{[^}]*overflow:\s*hidden;/s, "Modal contido deve ter overflow: hidden");
  assert.match(css, /\.a26-modal--contained\s+\.a26-modal__content[^\{]*\{[^}]*flex:\s*1\s+1\s+auto;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s, "Content deve ser elástico com scroll interno");
  assert.match(css, /\.a26-modal--contained\s+\.a26-modal__actions[^\{]*\{[^}]*flex:\s*0\s+0\s+auto;/s, "Actions devem ser ancoradas");
});

// Wave 3 — DEF-P1-04: Atlas AI Tutor Vertical Geometry
test("DEF-P1-04 — Atlas AI Tutor uses dynamic clamp and compact viewport queries", () => {
  const css = fs.readFileSync(a26StudentConsolidationCssPath, "utf8");

  assert.match(css, /top:\s*clamp\(68px,\s*11vh,\s*102px\)\s*!important;/, "Tutor deve usar clamp responsivo para top");
  assert.match(css, /bottom:\s*clamp\(74px,\s*12vh,\s*116px\)\s*!important;/, "Tutor deve usar clamp responsivo para bottom");
  assert.match(css, /@media\s*\(max-height:\s*720px\)\s*\{[^}]*top:\s*64px\s*!important;[^}]*bottom:\s*68px\s*!important;/s, "Tutor deve ter media query para max-height: 720px");
});

// Wave 4 — DEF-P2-05: AgendaPopoverModal
test("DEF-P2-05 — AgendaPopoverModal implements flex containment and Escape key", () => {
  const jsx = fs.readFileSync(agendaPopoverJsxPath, "utf8");
  const css = fs.readFileSync(a26StudyAgendaCssPath, "utf8");

  assert.match(jsx, /e\.key\s*===\s*"Escape"/, "Agenda popover deve escutar tecla Escape");
  assert.match(css, /\.a26-popover-card\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*overflow:\s*hidden;/s, "Card deve ser flex column overflow hidden");
  assert.match(css, /\.a26-popover-header\s*\{[^}]*flex:\s*0\s+0\s+auto;/s, "Header deve ser fixo");
  assert.match(css, /\.a26-popover-body\s*\{[^}]*flex:\s*1\s+1\s+auto;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s, "Body deve ter scroll próprio");
  assert.match(css, /\.a26-popover-footer\s*\{[^}]*flex:\s*0\s+0\s+auto;/s, "Footer de ações deve ser fixo");
});

// Wave 4 — DEF-P2-06: StudentHistoryModal Sticky Header
test("DEF-P2-06 — StudentHistoryModal has sticky header and Escape key", () => {
  const jsx = fs.readFileSync(studentHistoryJsxPath, "utf8");
  const css = fs.readFileSync(adminStudentsCssPath, "utf8");

  assert.match(jsx, /e\.key\s*===\s*"Escape"/, "Histórico do aluno deve escutar tecla Escape");
  assert.match(css, /\.student-history-modal\s+\.admin-modal-header[^\{]*\{[^}]*position:\s*sticky;[^}]*top:\s*-20px;[^}]*z-index:\s*20;/s, "Admin modal header deve ser sticky com z-index");
});

// Wave 4 — DEF-P2-07: AgendaTaskModal Textarea Resize
test("DEF-P2-07 — AgendaTaskModal textarea has resize: none", () => {
  const css = fs.readFileSync(a26StudyAgendaCssPath, "utf8");

  assert.match(css, /\.agenda-task-modal\s+textarea\s*\{[^}]*resize:\s*none;/s, "Agenda task modal textarea não deve permitir redimensionamento descontrolado");
});

// Wave 4 — DEF-P2-08: TheoreticalQuizModal Sticky Commandbar
test("DEF-P2-08 — TheoreticalQuizModal commandbar is sticky at top: 0", () => {
  const css = fs.readFileSync(globalsCssPath, "utf8");

  assert.match(css, /\.theory-quiz-commandbar\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*z-index:\s*30;/s, "Theory quiz commandbar deve ser sticky no topo com z-index");
});

// Wave 5 — DEF-P3-09: MuralModularBoard Modal Max-Height
test("DEF-P3-09 — MuralModularBoard modal has max-height clamp and overflow-y: auto", () => {
  const css = fs.readFileSync(muralModularBoardCssPath, "utf8");

  assert.match(css, /\.notes-board__modal\s*\{[^}]*max-height:\s*min\(88dvh,\s*560px\);[^}]*overflow-y:\s*auto;/s, "Mural modular modal deve conter max-height clamp e scroll próprio");
});

// Wave 5 — DEF-P3-10: Global Textarea Safeguard in Overlays
test("DEF-P3-10 — A26Foundation enforces global textarea anti-distortion safeguard", () => {
  const css = fs.readFileSync(a26FoundationCssPath, "utf8");

  assert.match(css, /\.a26-modal\s+textarea[^\{]*\{[^}]*max-width:\s*100%;/s, "Textareas em modais devem ter max-width 100%");
  assert.match(css, /\.a26-modal--contained\s+textarea[^\{]*\{[^}]*resize:\s*none;/s, "Textareas em modais contidos devem ter resize: none");
});

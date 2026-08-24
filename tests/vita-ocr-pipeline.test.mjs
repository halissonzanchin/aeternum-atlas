import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  classifyOcrResult,
  parseTesseractTsv,
  selectStratifiedPages
} from "../tools/scripts/ocr_anatomy_pilot.js";

test("OCR pilot selects low-text pages across the whole book", () => {
  const pages = Array.from({ length: 100 }, (_, index) => ({
    num: index + 1,
    text: index % 10 === 0 ? "texto digital suficiente para não precisar de reconhecimento óptico" : ""
  }));
  const selected = selectStratifiedPages(pages, 5, 40);

  assert.equal(selected.length, 5);
  assert.ok(selected[0].pageNumber < 20);
  assert.ok(selected.at(-1).pageNumber > 80);
  assert.ok(selected.every((page) => page.originalTextCharacters < 40));
});

test("Tesseract TSV preserves page coordinates and confidence", () => {
  const tsv = [
    "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext",
    "1\t1\t0\t0\t0\t0\t0\t0\t2400\t3200\t-1\t",
    "5\t1\t1\t1\t1\t1\t100\t200\t180\t45\t95.5\tEscápula",
    "5\t1\t1\t1\t1\t2\t300\t200\t210\t45\t82.5\tposterior",
    "5\t1\t2\t1\t1\t1\t120\t500\t160\t42\t30\tglenoide"
  ].join("\n");

  const result = parseTesseractTsv(tsv);
  assert.equal(result.pageWidth, 2400);
  assert.equal(result.pageHeight, 3200);
  assert.equal(result.totalWordCount, 3);
  assert.equal(result.acceptedWordCount, 2);
  assert.equal(result.wordBoxes[0].text, "Escápula");
  assert.match(result.ocrText, /Escápula posterior/);
});

test("OCR quality gate never auto-accepts the manual review state", () => {
  const classification = classifyOcrResult({
    meanConfidence: 91,
    acceptedWordCount: 80,
    totalWordCount: 85
  });
  assert.equal(classification.pageKind, "scanned-text");
  assert.equal(classification.qualityGate, "high");
  assert.equal(classification.reviewStatus, "pending");
});

test("OCR staging remains private and isolated from Atlas IA", () => {
  const migration = fs.readFileSync(
    new URL("../supabase/migrations/20260823032907_add_vita_ocr_staging.sql", import.meta.url),
    "utf8"
  );
  const pipeline = fs.readFileSync(
    new URL("../tools/scripts/ocr_anatomy_pilot.js", import.meta.url),
    "utf8"
  );

  assert.match(migration, /ALTER TABLE public\.vita_ocr_pages ENABLE ROW LEVEL SECURITY/i);
  assert.match(migration, /REVOKE ALL ON public\.vita_ocr_pages FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /GRANT SELECT, INSERT, UPDATE ON public\.vita_ocr_pages TO service_role/i);
  assert.doesNotMatch(migration, /GRANT\s+SELECT[^;]+TO\s+(anon|authenticated)/i);
  assert.doesNotMatch(pipeline, /google vision|azure|amazon textract|openai/i);
  assert.match(pipeline, /aeternum-vita-ocr-/i);
});

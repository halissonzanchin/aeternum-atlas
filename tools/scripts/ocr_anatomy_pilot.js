/**
 * Aeternum Vita - piloto OCR privado e retomável.
 *
 * O processo seleciona páginas sem texto digital, renderiza cada página em
 * diretório temporário, executa Tesseract local e envia apenas texto, métricas
 * e caixas de palavras à tabela privada vita_ocr_pages. Nenhuma imagem é
 * persistida ou transmitida a provedores externos.
 *
 * Uso:
 *   node tools/scripts/ocr_anatomy_pilot.js --limit-pages=5
 *   node tools/scripts/ocr_anatomy_pilot.js --limit-pages=50 --upload --resume
 *   node tools/scripts/ocr_anatomy_pilot.js --book=fretes --limit-pages=10
 */

import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const ROOT_DIR = process.cwd();
const PDF_BOOKS_DIR = path.join(ROOT_DIR, "knowledge_base", "pdf_books");
const SUPABASE_URL = process.env.SUPABASE_URL
  || process.env.VITE_SUPABASE_URL
  || "https://hyivyrietgjdazgizafp.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PIPELINE_VERSION = 2;
const DEFAULT_LIMIT_PAGES = 5;
const DEFAULT_TEXT_THRESHOLD = 40;
const MAX_WORD_BOXES = 5_000;
const MIN_ACCEPTED_WORD_CONFIDENCE = 50;

const WINDOWS_TESSERACT = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";
const WINDOWS_TESSDATA = path.join(
  process.env.LOCALAPPDATA || "C:\\Users\\Public",
  "AeternumVita",
  "tessdata-best"
);

export const PILOT_BOOKS = Object.freeze([
  Object.freeze({
    id: "fretes",
    titleIncludes: "fretes neuroanatomia encefalo medular",
    languages: ["spa", "lat"],
    dpi: 300,
    pageSegmentationMode: 3
  }),
  Object.freeze({
    id: "mcminn",
    titleIncludes: "gran atlas mcminn",
    languages: ["spa", "lat", "eng"],
    dpi: 400,
    pageSegmentationMode: 11
  }),
  Object.freeze({
    id: "uokochi",
    titleIncludes: "atlas fotografica uokochi",
    languages: ["spa", "lat"],
    dpi: 400,
    pageSegmentationMode: 3
  }),
  Object.freeze({
    id: "yokochi",
    titleIncludes: "yokochi anatomia atlas",
    languages: ["spa", "lat"],
    dpi: 400,
    pageSegmentationMode: 11
  })
]);

function argumentValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) || "";
}

function positiveInteger(value, fallback) {
  const number = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function cleanText(value) {
  return String(value || "")
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function bookTitle(fileName) {
  return path.basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function selectStratifiedPages(pages, limit, textThreshold = DEFAULT_TEXT_THRESHOLD) {
  const candidates = (Array.isArray(pages) ? pages : [])
    .map((page) => ({
      pageNumber: Number(page?.num),
      originalText: cleanText(page?.text),
      originalTextCharacters: cleanText(page?.text).length
    }))
    .filter((page) => Number.isInteger(page.pageNumber) && page.pageNumber > 0)
    .filter((page) => page.originalTextCharacters < textThreshold)
    .sort((left, right) => left.pageNumber - right.pageNumber);

  if (candidates.length <= limit) return candidates;

  const selectedIndexes = new Set();
  for (let index = 0; index < limit; index += 1) {
    const candidateIndex = Math.min(
      candidates.length - 1,
      Math.floor(((index + 0.5) * candidates.length) / limit)
    );
    selectedIndexes.add(candidateIndex);
  }

  return [...selectedIndexes]
    .sort((left, right) => left - right)
    .map((index) => candidates[index]);
}

export function parseTesseractTsv(tsv) {
  const rows = String(tsv || "").replace(/\r/g, "").split("\n");
  const wordBoxes = [];
  const lineMap = new Map();
  let pageWidth = 0;
  let pageHeight = 0;

  for (let index = 1; index < rows.length; index += 1) {
    if (!rows[index]) continue;
    const columns = rows[index].split("\t");
    if (columns.length < 11) continue;

    const level = Number(columns[0]);
    if (level === 1) {
      pageWidth = Math.max(pageWidth, Number(columns[8]) || 0);
      pageHeight = Math.max(pageHeight, Number(columns[9]) || 0);
      continue;
    }
    if (level !== 5 || columns.length < 12) continue;

    const text = cleanText(columns.slice(11).join("\t"));
    if (!text) continue;
    const confidence = Number(columns[10]);
    const blockNumber = Number(columns[2]) || 0;
    const paragraphNumber = Number(columns[3]) || 0;
    const lineNumber = Number(columns[4]) || 0;
    const lineKey = `${blockNumber}:${paragraphNumber}:${lineNumber}`;
    if (!lineMap.has(lineKey)) lineMap.set(lineKey, []);
    lineMap.get(lineKey).push(text);

    wordBoxes.push({
      text,
      confidence: Number.isFinite(confidence) ? Math.max(-1, Math.min(100, confidence)) : -1,
      left: Number(columns[6]) || 0,
      top: Number(columns[7]) || 0,
      width: Number(columns[8]) || 0,
      height: Number(columns[9]) || 0,
      block: blockNumber,
      paragraph: paragraphNumber,
      line: lineNumber
    });
  }

  const measurableWords = wordBoxes.filter((word) => word.confidence >= 0);
  const acceptedWords = measurableWords.filter(
    (word) => word.confidence >= MIN_ACCEPTED_WORD_CONFIDENCE
  );
  const meanConfidence = measurableWords.length
    ? measurableWords.reduce((total, word) => total + word.confidence, 0) / measurableWords.length
    : 0;

  return {
    ocrText: cleanText([...lineMap.values()].map((words) => words.join(" ")).join("\n")),
    meanConfidence: Number(meanConfidence.toFixed(2)),
    acceptedWordCount: acceptedWords.length,
    totalWordCount: measurableWords.length,
    pageWidth,
    pageHeight,
    wordBoxes: wordBoxes.slice(0, MAX_WORD_BOXES),
    wordBoxesTruncated: wordBoxes.length > MAX_WORD_BOXES
  };
}

export function classifyOcrResult(result) {
  let pageKind = "unlabeled-plate";
  if (result.acceptedWordCount >= 40) pageKind = "scanned-text";
  else if (result.acceptedWordCount >= 4) pageKind = "sparse-labels";

  let qualityGate = "no_text";
  if (result.meanConfidence >= 80 && result.acceptedWordCount >= 25) qualityGate = "high";
  else if (result.meanConfidence >= 60 && result.acceptedWordCount >= 5) qualityGate = "moderate";
  else if (result.totalWordCount > 0) qualityGate = "low";

  return {
    pageKind,
    qualityGate,
    reviewStatus: qualityGate === "low" || qualityGate === "no_text"
      ? "needs_review"
      : "pending"
  };
}

function commandExists(command) {
  return command && (path.isAbsolute(command) ? fs.existsSync(command) : true);
}

function runProcess(command, args, { maxOutputCharacters = 60_000_000 } = {}) {
  return new Promise((resolve, reject) => {
    const usesCommandWrapper = process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
    const child = spawn(command, args, {
      windowsHide: true,
      shell: usesCommandWrapper,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    const append = (current, chunk) => {
      const next = current + chunk.toString("utf8");
      if (next.length > maxOutputCharacters) {
        child.kill();
        reject(new Error(`Saída excedeu ${maxOutputCharacters} caracteres: ${command}`));
        return current;
      }
      return next;
    };

    child.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${path.basename(command)} terminou com código ${code}: ${cleanText(stderr).slice(0, 600)}`));
    });
  });
}

async function renderPdfPage({ pdfPath, pageNumber, dpi, outputPrefix, pdftoppmPath }) {
  await runProcess(pdftoppmPath, [
    "-f", String(pageNumber),
    "-l", String(pageNumber),
    "-r", String(dpi),
    "-png",
    "-singlefile",
    pdfPath,
    outputPrefix
  ]);
  const imagePath = `${outputPrefix}.png`;
  if (!fs.existsSync(imagePath)) throw new Error(`Poppler não gerou a página ${pageNumber}.`);
  return imagePath;
}

async function recognizePage({ imagePath, languages, pageSegmentationMode, tesseractPath, tessdataPath }) {
  const args = [imagePath, "stdout"];
  if (tessdataPath) args.push("--tessdata-dir", tessdataPath);
  args.push(
    "-l", languages.join("+"),
    "--oem", "1",
    "--psm", String(pageSegmentationMode),
    "tsv"
  );
  const { stdout } = await runProcess(tesseractPath, args);
  if (!stdout.replace(/^\uFEFF/, "").startsWith("level\tpage_num\t")) {
    throw new Error("Tesseract não devolveu TSV; verifique tessdata/configs/tsv.");
  }
  return parseTesseractTsv(stdout);
}

async function existingPages(supabase, sourceHash) {
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("vita_ocr_pages")
    .select("page_number")
    .eq("source_sha256", sourceHash)
    .eq("pipeline_version", PIPELINE_VERSION)
    .limit(1_000);
  if (error) throw new Error(`Falha ao consultar retomada OCR: ${error.message}`);
  return new Set((data || []).map((row) => Number(row.page_number)));
}

async function uploadPage(supabase, record) {
  if (!supabase) return;
  const { error } = await supabase
    .from("vita_ocr_pages")
    .upsert(record, { onConflict: "source_sha256,page_number,pipeline_version" });
  if (error) throw new Error(`Supabase recusou a página ${record.page_number}: ${error.message}`);
}

function selectedBookConfigs(bookFilter) {
  if (!bookFilter) return PILOT_BOOKS;
  const normalized = normalizeSearchText(bookFilter);
  return PILOT_BOOKS.filter((book) => book.id === normalized || book.titleIncludes.includes(normalized));
}

function findBookFile(files, config) {
  return files.find((fileName) => normalizeSearchText(fileName).includes(config.titleIncludes));
}

async function processBook({
  config,
  fileName,
  limitPages,
  textThreshold,
  upload,
  resume,
  supabase,
  tesseractPath,
  tessdataPath,
  pdftoppmPath
}) {
  const pdfPath = path.join(PDF_BOOKS_DIR, fileName);
  const fileBuffer = fs.readFileSync(pdfPath);
  const sourceHash = sha256(fileBuffer);
  const parser = new PDFParse({ data: fileBuffer });
  let pages;
  try {
    const parseResult = await parser.getText();
    pages = Array.isArray(parseResult.pages) ? parseResult.pages : [];
  } finally {
    await parser.destroy();
  }

  const selectedPages = selectStratifiedPages(pages, limitPages, textThreshold);
  const completedPages = upload && resume ? await existingPages(supabase, sourceHash) : new Set();
  const temporaryRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "aeternum-vita-ocr-"));
  const summary = { book: fileName, selected: selectedPages.length, processed: 0, skipped: 0, gates: {} };

  try {
    for (const page of selectedPages) {
      if (completedPages.has(page.pageNumber)) {
        summary.skipped += 1;
        continue;
      }

      const startedAt = Date.now();
      const outputPrefix = path.join(temporaryRoot, `page-${page.pageNumber}`);
      const imagePath = await renderPdfPage({
        pdfPath,
        pageNumber: page.pageNumber,
        dpi: config.dpi,
        outputPrefix,
        pdftoppmPath
      });
      const imageBuffer = await fsPromises.readFile(imagePath);
      const ocr = await recognizePage({
        imagePath,
        languages: config.languages,
        pageSegmentationMode: config.pageSegmentationMode,
        tesseractPath,
        tessdataPath
      });
      const classification = classifyOcrResult(ocr);
      const record = {
        book_title: bookTitle(fileName),
        source_file: fileName,
        source_sha256: sourceHash,
        page_number: page.pageNumber,
        source_image_sha256: sha256(imageBuffer),
        page_width_pixels: Math.max(ocr.pageWidth, 1),
        page_height_pixels: Math.max(ocr.pageHeight, 1),
        dpi: config.dpi,
        language_codes: config.languages,
        page_kind: classification.pageKind,
        extraction_method: "tesseract-tsv",
        ocr_text: ocr.ocrText,
        mean_confidence: ocr.meanConfidence,
        accepted_word_count: ocr.acceptedWordCount,
        total_word_count: ocr.totalWordCount,
        word_boxes: ocr.wordBoxes,
        review_status: classification.reviewStatus,
        pipeline_version: PIPELINE_VERSION,
        metadata: {
          corpus: "aeternum-vita",
          pilot: true,
          originalTextCharacters: page.originalTextCharacters,
          qualityGate: classification.qualityGate,
          tesseractPageSegmentationMode: config.pageSegmentationMode,
          wordBoxesTruncated: ocr.wordBoxesTruncated,
          processingMilliseconds: Date.now() - startedAt
        },
        updated_at: new Date().toISOString()
      };

      await uploadPage(upload ? supabase : null, record);
      summary.processed += 1;
      summary.gates[classification.qualityGate] = (summary.gates[classification.qualityGate] || 0) + 1;
      console.log(
        `  página ${page.pageNumber}: ${classification.pageKind}, confiança ${ocr.meanConfidence}, `
        + `${ocr.acceptedWordCount} palavras aceitas, gate ${classification.qualityGate}${upload ? ", enviada" : ""}.`
      );
      await fsPromises.rm(imagePath, { force: true });
    }
  } finally {
    const expectedPrefix = path.join(os.tmpdir(), "aeternum-vita-ocr-");
    if (temporaryRoot.startsWith(expectedPrefix)) {
      await fsPromises.rm(temporaryRoot, { recursive: true, force: true });
    }
  }

  return summary;
}

export async function run() {
  const upload = process.argv.includes("--upload");
  const resume = process.argv.includes("--resume");
  const limitPages = positiveInteger(argumentValue("limit-pages"), DEFAULT_LIMIT_PAGES);
  const textThreshold = positiveInteger(argumentValue("text-threshold"), DEFAULT_TEXT_THRESHOLD);
  const bookFilter = argumentValue("book");
  const dpiOverride = positiveInteger(argumentValue("dpi"), 0);
  const psmOverride = positiveInteger(argumentValue("psm"), 0);
  const languageOverride = argumentValue("languages")
    .split("+")
    .map((language) => language.trim().toLowerCase())
    .filter(Boolean);
  const tesseractPath = process.env.TESSERACT_PATH
    || (process.platform === "win32" ? WINDOWS_TESSERACT : "tesseract");
  const tessdataPath = process.env.TESSDATA_PREFIX
    || (process.platform === "win32" ? WINDOWS_TESSDATA : "");
  const pdftoppmPath = process.env.PDFTOPPM_PATH || "pdftoppm";

  if (!fs.existsSync(PDF_BOOKS_DIR)) throw new Error(`Pasta de PDFs ausente: ${PDF_BOOKS_DIR}`);
  if (!commandExists(tesseractPath)) throw new Error(`Tesseract ausente: ${tesseractPath}`);
  if (!commandExists(pdftoppmPath)) throw new Error(`pdftoppm ausente: ${pdftoppmPath}`);
  if (tessdataPath && !fs.existsSync(tessdataPath)) throw new Error(`tessdata ausente: ${tessdataPath}`);
  if (tessdataPath && !fs.existsSync(path.join(tessdataPath, "configs", "tsv"))) {
    throw new Error(`Configuração TSV ausente: ${path.join(tessdataPath, "configs", "tsv")}`);
  }
  if (upload && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error("O upload OCR exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no processo.");
  }

  const configs = selectedBookConfigs(bookFilter).map((config) => ({
    ...config,
    dpi: dpiOverride || config.dpi,
    pageSegmentationMode: psmOverride || config.pageSegmentationMode,
    languages: languageOverride.length ? languageOverride : config.languages
  }));
  if (!configs.length) throw new Error(`Livro piloto desconhecido: ${bookFilter}`);
  const files = fs.readdirSync(PDF_BOOKS_DIR).filter((file) => file.toLowerCase().endsWith(".pdf"));
  const supabase = upload ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  }) : null;
  const summaries = [];

  console.log(
    `Aeternum Vita OCR - ${configs.length} livro(s), até ${limitPages} página(s) por livro, `
    + `${upload ? "estágio privado Supabase" : "validação local sem upload"}.`
  );

  for (const config of configs) {
    const fileName = findBookFile(files, config);
    if (!fileName) throw new Error(`PDF do piloto não localizado: ${config.id}`);
    console.log(`\n${fileName} (${config.languages.join("+")}, ${config.dpi} DPI, PSM ${config.pageSegmentationMode})`);
    summaries.push(await processBook({
      config,
      fileName,
      limitPages,
      textThreshold,
      upload,
      resume,
      supabase,
      tesseractPath,
      tessdataPath,
      pdftoppmPath
    }));
  }

  const totals = summaries.reduce((accumulator, summary) => ({
    selected: accumulator.selected + summary.selected,
    processed: accumulator.processed + summary.processed,
    skipped: accumulator.skipped + summary.skipped
  }), { selected: 0, processed: 0, skipped: 0 });
  console.log(`\nConcluído: ${totals.processed} processadas, ${totals.skipped} retomadas, ${totals.selected} selecionadas.`);
  console.log(JSON.stringify({ pipelineVersion: PIPELINE_VERSION, totals, books: summaries }, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  run().catch((error) => {
    console.error(`Falha no piloto OCR da Aeternum Vita: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}

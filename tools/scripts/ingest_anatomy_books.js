/**
 * Ingestão textual privada dos PDFs para a Aeternum Vita.
 *
 * O script preserva a página física do PDF, cria trechos idempotentes e envia
 * apenas ao projeto Supabase do Aeternum Atlas. Nenhum conteúdo é transmitido
 * a provedores externos de embedding.
 *
 * Uso:
 *   node tools/scripts/ingest_anatomy_books.js --dry-run
 *   node tools/scripts/ingest_anatomy_books.js
 *   node tools/scripts/ingest_anatomy_books.js --book=Moore
 *   node tools/scripts/ingest_anatomy_books.js --book=Moore --limit-pages=20
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const ROOT_DIR = process.cwd();
const PDF_BOOKS_DIR = path.join(ROOT_DIR, "knowledge_base", "pdf_books");
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://hyivyrietgjdazgizafp.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CHUNK_SIZE_CHARACTERS = 1_200;
const OVERLAP_CHARACTERS = 180;
const UPSERT_BATCH_SIZE = 150;

function argumentValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) || "";
}

function cleanText(text) {
  return String(text || "")
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkPage(text) {
  const normalized = cleanText(text);
  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_SIZE_CHARACTERS, normalized.length);
    if (end < normalized.length) {
      const sentenceBoundary = Math.max(
        normalized.lastIndexOf(". ", end),
        normalized.lastIndexOf("; ", end),
        normalized.lastIndexOf(": ", end)
      );
      const wordBoundary = normalized.lastIndexOf(" ", end);
      const boundary = sentenceBoundary > start + 500 ? sentenceBoundary + 1 : wordBoundary;
      if (boundary > start) end = boundary;
    }

    const content = normalized.slice(start, end).trim();
    if (content.length >= 40) chunks.push(content);
    if (end >= normalized.length) break;
    const nextStart = Math.max(end - OVERLAP_CHARACTERS, start + 1);
    start = nextStart;
  }
  return chunks;
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

function buildRecords(parseResult, fileName, sourceHash, pageLimit) {
  const pages = Array.isArray(parseResult.pages) ? parseResult.pages : [];
  const selectedPages = pageLimit > 0 ? pages.slice(0, pageLimit) : pages;
  const title = bookTitle(fileName);
  const records = [];

  for (const page of selectedPages) {
    const pageNumber = Number(page.num);
    if (!Number.isInteger(pageNumber) || pageNumber <= 0) continue;
    const chunks = chunkPage(page.text);
    chunks.forEach((content, chunkIndex) => {
      records.push({
        book_title: title,
        source_file: fileName,
        source_sha256: sourceHash,
        page_number: pageNumber,
        chunk_index: chunkIndex,
        content,
        metadata: {
          corpus: "aeternum-vita",
          pageKind: "pdf-physical-page",
          ingestionVersion: 2
        },
        updated_at: new Date().toISOString()
      });
    });
  }
  return records;
}

async function ingestBook(supabase, records) {
  let ingested = 0;
  for (let index = 0; index < records.length; index += UPSERT_BATCH_SIZE) {
    const batch = records.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from("vita_anatomical_knowledge")
      .upsert(batch, { onConflict: "source_sha256,page_number,chunk_index" });
    if (error) throw new Error(`Supabase recusou o lote ${Math.floor(index / UPSERT_BATCH_SIZE) + 1}: ${error.message}`);
    ingested += batch.length;
    process.stdout.write(`   Enviados ${ingested}/${records.length} trechos\r`);
  }
  if (records.length) process.stdout.write("\n");
  return ingested;
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const bookFilter = cleanText(argumentValue("book")).toLocaleLowerCase();
  const pageLimit = Math.max(0, Number.parseInt(argumentValue("limit-pages"), 10) || 0);

  if (!fs.existsSync(PDF_BOOKS_DIR)) throw new Error(`Pasta de livros ausente: ${PDF_BOOKS_DIR}`);
  const files = fs.readdirSync(PDF_BOOKS_DIR)
    .filter((file) => file.toLocaleLowerCase().endsWith(".pdf"))
    .filter((file) => !bookFilter || file.toLocaleLowerCase().includes(bookFilter));
  if (!files.length) throw new Error("Nenhum PDF corresponde ao filtro informado.");
  if (!dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error("A ingestão remota exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do processo.");
  }

  const supabase = dryRun ? null : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  let totalChunks = 0;
  let uniqueBooks = 0;
  const sourceHashes = new Set();

  console.log(`Aeternum Vita — ${files.length} arquivo(s) PDF encontrado(s), modo ${dryRun ? "dry-run" : "ingestão privada"}.`);
  for (const fileName of files) {
    const filePath = path.join(PDF_BOOKS_DIR, fileName);
    const fileBuffer = fs.readFileSync(filePath);
    const sourceHash = sha256(fileBuffer);
    if (sourceHashes.has(sourceHash)) {
      console.log(`\n${fileName}: cópia binária já processada; ignorada.`);
      continue;
    }
    sourceHashes.add(sourceHash);
    uniqueBooks += 1;
    const parser = new PDFParse({ data: fileBuffer });

    try {
      const parseResult = await parser.getText(pageLimit > 0 ? { first: pageLimit } : undefined);
      const records = buildRecords(parseResult, fileName, sourceHash, pageLimit);
      console.log(`\n${fileName}: ${parseResult.pages?.length || 0} páginas, ${records.length} trechos.`);
      totalChunks += dryRun ? records.length : await ingestBook(supabase, records);
    } finally {
      await parser.destroy();
    }
  }

  console.log(`\nConcluído: ${uniqueBooks} PDFs únicos e ${totalChunks} trechos ${dryRun ? "preparados" : "ingeridos"}.`);
}

run().catch((error) => {
  console.error(`Falha na ingestão da Aeternum Vita: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});

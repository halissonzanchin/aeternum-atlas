/**
 * ingest_anatomy_books.js
 * Script de ingestão e vetorização de livros de anatomia em PDF (RAG).
 * 
 * Uso:
 *   node tools/scripts/ingest_anatomy_books.js [--dry-run]
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const ROOT_DIR = process.cwd();
const PDF_BOOKS_DIR = path.join(ROOT_DIR, "knowledge_base", "pdf_books");
const CHUNKS_OUTPUT_DIR = path.join(ROOT_DIR, "knowledge_base", "ingested_chunks");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://hyivyrietgjdazgizafp.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const CHUNK_SIZE_CHARS = 800; // Tamanho ideal do trecho de conhecimento
const OVERLAP_CHARS = 100;    // Sobreposição para manter continuidade do contexto

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim();
}

function chunkText(fullText, chunkSize = CHUNK_SIZE_CHARS, overlap = OVERLAP_CHARS) {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < fullText.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < fullText.length) {
      const spaceIndex = fullText.lastIndexOf(" ", endIndex);
      if (spaceIndex > startIndex) {
        endIndex = spaceIndex;
      }
    }

    const chunkContent = cleanText(fullText.slice(startIndex, endIndex));
    if (chunkContent.length > 50) { // Ignorar chunks curtos demais ou vazios
      chunks.push(chunkContent);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= fullText.length) break;
  }

  return chunks;
}

/**
 * Gera embedding de 768 dimensões via Google Gemini API
 */
async function generateEmbedding(text, apiKey) {
  if (!apiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] }
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (err) {
    console.warn("⚠️ Falha ao gerar embedding:", err.message);
    return null;
  }
}

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log("=================================================");
  console.log("📚 AETERNUM ATLAS - INGESTÃO DE LIVROS EM PDF");
  console.log("=================================================");
  console.log(`Pasta de livros: ${PDF_BOOKS_DIR}`);
  console.log(`Modo Dry-Run (apenas simulação local): ${isDryRun ? "SIM" : "NÃO"}`);

  if (!fs.existsSync(PDF_BOOKS_DIR)) {
    console.error(`❌ Pasta ${PDF_BOOKS_DIR} não foi encontrada.`);
    process.exit(1);
  }

  ensureDirectory(CHUNKS_OUTPUT_DIR);

  const files = fs.readdirSync(PDF_BOOKS_DIR).filter(f => f.toLowerCase().endsWith(".pdf"));

  if (!files.length) {
    console.log("⚠️ Nenhum arquivo .pdf encontrado na pasta knowledge_base/pdf_books/.");
    process.exit(0);
  }

  console.log(`\nFound ${files.length} PDF files for processing:`);
  files.forEach((file, i) => console.log(`  ${i + 1}. ${file}`));

  let supabase = null;
  if (!isDryRun && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }

  let totalChunksIngested = 0;

  for (const fileName of files) {
    const filePath = path.join(PDF_BOOKS_DIR, fileName);
    const bookTitle = path.basename(fileName, ".pdf").replace(/_/g, " ").replace(/-/g, " ");

    console.log(`\n📖 Processando: "${fileName}"...`);
    const fileBuffer = fs.readFileSync(filePath);

    try {
      const parser = new PDFParse({ data: fileBuffer });
      const parseResult = await parser.getText();
      const extractedText = cleanText(parseResult.text || parseResult);

      console.log(`   Caracteres extraídos: ${extractedText.length}`);

      const chunks = chunkText(extractedText);
      console.log(`   Dividido em ${chunks.length} trechos conceituais.`);

      const bookOutputJson = path.join(CHUNKS_OUTPUT_DIR, `${path.basename(fileName, ".pdf")}_chunks.json`);
      fs.writeFileSync(bookOutputJson, JSON.stringify(chunks, null, 2));
      console.log(`   💾 Trechos gravados em cache local: ${path.basename(bookOutputJson)}`);

      if (!isDryRun && supabase) {
        console.log(`   🚀 Enviando trechos para o Supabase (vector table)...`);
        const batchSize = 25;
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const records = [];

          for (let j = 0; j < batch.length; j++) {
            const content = batch[j];
            const embedding = GEMINI_API_KEY ? await generateEmbedding(content, GEMINI_API_KEY) : null;
            records.push({
              book_title: bookTitle,
              chapter_title: `Trecho ${i + j + 1}`,
              chunk_index: i + j + 1,
              content,
              embedding
            });
          }

          const { error } = await supabase.from("anatomical_knowledge_base").insert(records);
          if (error) {
            console.error(`   ❌ Erro no lote ${i / batchSize + 1}:`, error.message);
          } else {
            totalChunksIngested += records.length;
            process.stdout.write(`   ✓ Ingeridos ${Math.min(i + batchSize, chunks.length)}/${chunks.length} trechos...\r`);
          }
        }
        console.log("\n   ✅ Ingestão do livro concluída no banco de dados!");
      }

    } catch (pdfErr) {
      console.error(`❌ Erro ao ler PDF "${fileName}":`, pdfErr.message);
    }
  }

  console.log("\n=================================================");
  console.log(`🎉 PROCESSO CONCLUÍDO! Total de trechos processados: ${totalChunksIngested}`);
  console.log("=================================================");
}

run();

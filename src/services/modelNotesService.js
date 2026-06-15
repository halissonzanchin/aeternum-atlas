import { readStorage, storageKeys, writeStorage } from "./storage/storageService";

const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;
const PDF_MARGIN_X = 50;
const PDF_FIRST_LINE_Y = 792;
const PDF_BODY_LINE_GAP = 16;
const PDF_LINES_PER_PAGE = 43;

function userKey(user) {
  return user?.id || user?.email || "anonymous";
}

function noteKey(user, modelId) {
  return `${userKey(user)}:${modelId}`;
}

function readNotes() {
  return readStorage(storageKeys.modelNotes, {});
}

function writeNotes(notes) {
  return writeStorage(storageKeys.modelNotes, notes);
}

function sanitizeFilename(value) {
  return String(value || "modelo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "modelo";
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function wrapText(text, maxLength = 88) {
  const paragraphs = String(text || "")
    .replace(/\r/g, "")
    .split("\n");

  return paragraphs.flatMap(paragraph => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [""];

    const lines = [];
    let line = "";

    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxLength && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    if (line) lines.push(line);
    return lines;
  });
}

function textToPdfHex(text) {
  const safeText = String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "-");

  return `<${Array.from(safeText)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase())
    .join("")}>`;
}

function chunkLines(lines) {
  const pages = [];
  for (let index = 0; index < lines.length; index += PDF_LINES_PER_PAGE) {
    pages.push(lines.slice(index, index + PDF_LINES_PER_PAGE));
  }
  return pages.length ? pages : [[]];
}

function contentStream(lines, pageNumber, pageCount) {
  const commands = [
    "BT",
    "/F1 16 Tf",
    `${PDF_MARGIN_X} ${PDF_FIRST_LINE_Y} Td`,
    `${textToPdfHex("Aeternum Atlas - Anotações do Modelo")} Tj`,
    "/F1 10 Tf",
    `0 -22 Td`,
    `${textToPdfHex(`Página ${pageNumber} de ${pageCount}`)} Tj`
  ];

  lines.forEach((line, index) => {
    commands.push(index === 0 ? "0 -24 Td" : `0 -${PDF_BODY_LINE_GAP} Td`);
    commands.push(`${textToPdfHex(line || " ")} Tj`);
  });

  commands.push("ET");
  return commands.join("\n");
}

function buildPdfDocument(pages) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  const pageIds = [];

  pages.forEach((pageLines, index) => {
    const pageId = objects.length + 1;
    const contentId = pageId + 1;
    const stream = contentStream(pageLines, index + 1, pages.length);

    pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let body = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = body.length;
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return body;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getModelNote(user, modelId) {
  if (!modelId) return { content: "", updatedAt: null };
  return readNotes()[noteKey(user, modelId)] || { content: "", updatedAt: null };
}

export function saveModelNote(user, model, content) {
  const modelId = model?.id;
  if (!modelId) return { content: content || "", updatedAt: null };

  const notes = readNotes();
  const savedNote = {
    userId: userKey(user),
    modelId,
    modelTitle: model?.title || "",
    content: String(content || ""),
    updatedAt: new Date().toISOString()
  };

  writeNotes({
    ...notes,
    [noteKey(user, modelId)]: savedNote
  });

  return savedNote;
}

export function exportModelNotePdf({ user, model, note }) {
  const modelTitle = model?.title || note?.modelTitle || "Modelo 3D";
  const updatedAt = note?.updatedAt || new Date().toISOString();
  const content = String(note?.content || "").trim();
  const filename = `aeternum-anotacoes-${sanitizeFilename(modelTitle)}.pdf`;
  const lines = [
    `Modelo: ${modelTitle}`,
    `Aluno/usuário: ${user?.name || user?.email || "Usuário local"}`,
    `Atualizado em: ${formatDateTime(updatedAt)}`,
    "",
    "Anotações:",
    "",
    ...wrapText(content)
  ];
  const pdf = buildPdfDocument(chunkLines(lines));
  const blob = new Blob([pdf], { type: "application/pdf" });

  downloadBlob(blob, filename);
  return filename;
}

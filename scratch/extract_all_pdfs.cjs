const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../knowledge_base/pdf_books');
const outputBaseDir = path.join(__dirname, '../public/pdf-medical-illustrations');

const SYSTEM_FOLDERS = [
  'cardiovascular',
  'neuroanatomy',
  'spine-neck',
  'upper-limb',
  'lower-limb-femur',
  'cranium-head',
  'viscera'
];

SYSTEM_FOLDERS.forEach(folder => {
  const p = path.join(outputBaseDir, folder);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

console.log('Indexando e auditando extração de imagens dos PDFs...');
const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.pdf'));
console.log(`Encontrados ${files.length} arquivos PDF em knowledge_base/pdf_books.`);

let totalExtracted = 0;

files.forEach(file => {
  const filePath = path.join(booksDir, file);
  try {
    const stats = fs.statSync(filePath);
    console.log(`- PDF: "${file}" (${Math.round(stats.size / 1024 / 1024)} MB)`);
  } catch (err) {
    console.warn(`Erro ao ler ${file}:`, err.message);
  }
});

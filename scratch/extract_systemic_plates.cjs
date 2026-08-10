const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../knowledge_base/pdf_books');
const outputBaseDir = path.join(__dirname, '../public/pdf-medical-illustrations');

const TARGET_BOOKS = [
  { name: 'Atlas de Anatomia Humana Vol 1 Cabeca e Pescoco_240806_225629.pdf', category: 'spine-neck', prefix: 'sobotta_spine_neck' },
  { name: 'FRETES - Neuroanatomía encéfalo medular_240806_225351.pdf', category: 'neuroanatomy', prefix: 'fretes_neuro' },
  { name: 'TOMO 1 - Latarjet - Ruiz Liard Anatomia Humana 5a Edicion .pdf', category: 'upper-limb', prefix: 'latarjet_upper' },
  { name: 'TOMO 2 - Latarjet - Ruiz Liard Anatomia Humana 5a Edicion .pdf', category: 'lower-limb-femur', prefix: 'latarjet_lower' }
];

TARGET_BOOKS.forEach(book => {
  const filePath = path.join(booksDir, book.name);
  const targetDir = path.join(outputBaseDir, book.category);

  if (!fs.existsSync(filePath)) {
    console.warn(`Arquivo não encontrado: ${book.name}`);
    return;
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Extracting images from ${book.name} -> ${book.category}...`);
  const buffer = fs.readFileSync(filePath);

  let count = 0;
  let pos = 0;

  while (pos < buffer.length - 4 && count < 60) {
    if (buffer[pos] === 0xFF && buffer[pos+1] === 0xD8 && buffer[pos+2] === 0xFF) {
      let endPos = pos + 3;
      let foundEnd = false;
      while (endPos < buffer.length - 1) {
        if (buffer[endPos] === 0xFF && buffer[endPos+1] === 0xD9) {
          foundEnd = true;
          endPos += 2;
          break;
        }
        endPos++;
      }

      if (foundEnd) {
        const imgBuffer = buffer.slice(pos, endPos);
        // Filter for medium/large anatomical figures (between 30KB and 500KB)
        if (imgBuffer.length > 30000 && imgBuffer.length < 500000) {
          count++;
          const filename = `${book.prefix}_plate_${String(count).padStart(3, '0')}.jpg`;
          const outPath = path.join(targetDir, filename);
          fs.writeFileSync(outPath, imgBuffer);
          console.log(`  + Extracted: ${filename} (${Math.round(imgBuffer.length / 1024)} KB)`);
        }
        pos = endPos;
        continue;
      }
    }
    pos++;
  }
  console.log(`✓ Completed ${book.category}: ${count} figures extracted.\n`);
});

console.log('🎉 Categorical PDF extraction complete!');

const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '../knowledge_base/pdf_books/Netter sin etiquetas - Imagens.pdf');
const outputDir = path.join(__dirname, '../public/pdf-medical-illustrations/netter-unlabeled');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Lendo PDF Netter sin etiquetas...');
const buffer = fs.readFileSync(pdfPath);

let count = 0;
let pos = 0;

while (pos < buffer.length - 4) {
  // Check for JPEG SOI marker (0xFF, 0xD8, 0xFF)
  if (buffer[pos] === 0xFF && buffer[pos+1] === 0xD8 && buffer[pos+2] === 0xFF) {
    // Find JPEG EOI marker (0xFF, 0xD9)
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
      // Filter out tiny thumbnail icons (< 5KB)
      if (imgBuffer.length > 5000) {
        count++;
        const filename = `netter_unlabeled_plate_${String(count).padStart(3, '0')}.jpg`;
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, imgBuffer);
        console.log(`Extraída prancha Netter #${count}: ${filename} (${Math.round(imgBuffer.length / 1024)} KB)`);
      }
      pos = endPos;
      continue;
    }
  }
  pos++;
}

console.log(`\n✅ Processamento concluído! Total de pranchas sem etiquetas extraídas: ${count}`);

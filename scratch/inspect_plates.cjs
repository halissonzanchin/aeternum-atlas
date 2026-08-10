const fs = require('fs');
const path = require('path');

const netterDir = path.join(__dirname, '../public/pdf-medical-illustrations/netter-unlabeled');
const files = fs.readdirSync(netterDir).filter(f => f.endsWith('.jpg'));

console.log(`Total de pranchas em netter-unlabeled: ${files.length}`);

// Sample inspect files around 470, 500, 600, 200, 300 to find exact index ranges
console.log('Sample filenames:');
console.log(files.slice(0, 10));
console.log(files.slice(200, 210));
console.log(files.slice(465, 475));
console.log(files.slice(600, 610));

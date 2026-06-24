const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');
const searchTerms = ['atlasEducationalRegistry', 'atlasAiTutorRegistry', 'atlasQuizRegistry', 'corteSagitalEncefalo'];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  searchTerms.forEach(term => {
    if (content.includes(term) && content.includes('import')) {
      const lines = content.split('\n').filter(l => l.includes('import') && l.includes(term));
      if (lines.length > 0) {
        console.log(`[${file}]`);
        lines.forEach(l => console.log('  ' + l.trim()));
      }
    }
  });
});

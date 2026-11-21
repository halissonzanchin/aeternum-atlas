import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3/P0.19_B_MATRIZ_CIENTIFICA_ANTES_DEPOIS.json', 'utf8'));

console.log('=== RESCUED CASES (Legacy BLOCKED -> Qualified PASS) ===');
const rescued = data.cases.filter(c => c.legacy.gate === 'BLOCKED' && c.qualified.gate === 'PASS');
console.log(`Total Rescued: ${rescued.length} of 40\n`);

rescued.forEach(c => {
  console.log(`[${c.id}] [${c.category}] [${c.lang.toUpperCase()}] "${c.query}"`);
  console.log(`   Legacy Failed Query: ${JSON.stringify(c.legacy.queries)} -> 0 chunks`);
  console.log(`   Qualified Queries: ${JSON.stringify(c.qualified.queries)} -> ${c.qualified.sourcesCount} chunks`);
  console.log(`   Top Source: ${c.qualified.topSource}`);
  console.log('---------------------------------------------------------');
});

console.log('\n=== NEGATIVE CONTROLS (Fictitious / Non-existent anatomy) ===');
data.cases.filter(c => c.isFictitious).forEach(c => {
  console.log(`[${c.id}] [${c.category}] "${c.query}"`);
  console.log(`   Legacy Gate: ${c.legacy.gate} (${c.legacy.sourcesCount} chunks, expected: ${c.expectedGate})`);
  console.log(`   Qualified Gate: ${c.qualified.gate} (${c.qualified.sourcesCount} chunks, expected: ${c.expectedGate})`);
  console.log(`   Gate Verdict: ${c.qualified.gate === c.expectedGate ? 'PASSED (FAIL-CLOSED INTEGRITY VERIFIED)' : 'FAILED'}`);
});

console.log('\n=== ALL 40 CASES BREAKDOWN BY CATEGORY ===');
const categories = {};
data.cases.forEach(c => {
  if (!categories[c.category]) categories[c.category] = { total: 0, legacyPass: 0, qualifiedPass: 0 };
  categories[c.category].total++;
  if (c.legacy.correct) categories[c.category].legacyPass++;
  if (c.qualified.correct) categories[c.category].qualifiedPass++;
});
console.table(categories);

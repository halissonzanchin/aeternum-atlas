import { pt } from "../src/i18n/translations/pt.js";
import { en } from "../src/i18n/translations/en.js";
import { es } from "../src/i18n/translations/es.js";
import { de } from "../src/i18n/translations/de.js";
import fs from "fs";
import path from "path";

function getAllKeys(obj, prefix = "") {
  let keys = [];
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

const ptKeys = new Set(getAllKeys(pt));
const enKeys = new Set(getAllKeys(en));
const esKeys = new Set(getAllKeys(es));
const deKeys = new Set(getAllKeys(de));

console.log("==========================================");
console.log("🔍 AUDITORIA DE COBERTURA DE DICIONÁRIOS I18N");
console.log("==========================================");
console.log(`Total de chaves em Português (PT - Base): ${ptKeys.size}`);
console.log(`Total de chaves em Inglês (EN):            ${enKeys.size}`);
console.log(`Total de chaves em Espanhol (ES):          ${esKeys.size}`);
console.log(`Total de chaves em Alemão (DE):            ${deKeys.size}`);
console.log("------------------------------------------");

// Verificar chaves faltando em relação a PT
const missingInEn = [...ptKeys].filter(k => !enKeys.has(k));
const missingInEs = [...ptKeys].filter(k => !esKeys.has(k));
const missingInDe = [...ptKeys].filter(k => !deKeys.has(k));

console.log(`❌ Chaves ausentes em EN (${missingInEn.length}):`);
if (missingInEn.length > 0) {
  console.log(missingInEn.slice(0, 30).map(k => `  - ${k}`).join("\n"));
  if (missingInEn.length > 30) console.log(`  ... e mais ${missingInEn.length - 30} chaves.`);
}

console.log(`\n❌ Chaves ausentes em ES (${missingInEs.length}):`);
if (missingInEs.length > 0) {
  console.log(missingInEs.slice(0, 30).map(k => `  - ${k}`).join("\n"));
  if (missingInEs.length > 30) console.log(`  ... e mais ${missingInEs.length - 30} chaves.`);
}

console.log(`\n❌ Chaves ausentes em DE (${missingInDe.length}):`);
if (missingInDe.length > 0) {
  console.log(missingInDe.slice(0, 30).map(k => `  - ${k}`).join("\n"));
  if (missingInDe.length > 30) console.log(`  ... e mais ${missingInDe.length - 30} chaves.`);
}

console.log("\n==========================================");
console.log("🔍 AUDITORIA DE COMPONENTES E TEXTOS HARDCODED");
console.log("==========================================");

const srcDir = path.resolve("./src");
function findJsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes("node_modules") && !fullPath.includes("dist")) {
        results = results.concat(findJsxFiles(fullPath));
      }
    } else if (file.endsWith(".jsx") || file.endsWith(".js")) {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = findJsxFiles(srcDir);
const filesWithoutUseLanguage = [];
const suspiciousHardcodedFiles = [];

allFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(srcDir, filePath);

  if (filePath.endsWith(".jsx")) {
    const hasUseLanguage = content.includes("useLanguage") || content.includes("t(");
    if (!hasUseLanguage) {
      filesWithoutUseLanguage.push(relPath);
    }

    // Procura por textos em português suspeitos no JSX
    const ptPatterns = [
      />\s*(Anatomia|Módulo|Disponível|Visualizador|Estudante|Carregando|Salvar|Iniciar|Gerar|Simulação|Caso Clínico|Não encontrado|Histórico|Configurações|Perfil|Sair|Favoritos|Vídeos|Cursos|Início|Modelos 3D|Atlas Anatômico|Mural|Progresso|Desempenho|Sem dados|Acessar|Abrir|Fechar|Confirmar|Cancelar)\s*</gi
    ];

    let matches = [];
    ptPatterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        matches.push(...match);
      }
    });

    if (matches.length > 0 && !hasUseLanguage) {
      suspiciousHardcodedFiles.push({ file: relPath, matches: matches.slice(0, 5) });
    }
  }
});

console.log(`\nComponentes JSX sem useLanguage/t (${filesWithoutUseLanguage.length}):`);
console.log(filesWithoutUseLanguage.slice(0, 25).map(f => `  - ${f}`).join("\n"));

console.log(`\nComponentes com strings estáticas em português sem i18n hook:`);
suspiciousHardcodedFiles.forEach(item => {
  console.log(`  - ${item.file} -> [${item.matches.join(", ")}]`);
});

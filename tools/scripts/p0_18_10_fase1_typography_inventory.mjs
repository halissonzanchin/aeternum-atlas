/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.10
 * FASE 1: INVENTÁRIO TIPOGRÁFICO ESTÁTICO GLOBAL
 */

import fs from "node:fs";
import path from "node:path";

const STYLES_DIR = "src/styles";
const SRC_DIR = "src";

const TARGET_FILES = [
  "src/styles/A26Foundation.css",
  "src/styles/A26Shell.css",
  "src/styles/A26FeatureShell.css",
  "src/styles/A26StudentConsolidation.css",
  "src/styles/A26MindMap.css",
  "src/styles/AcademicEvolutionDashboard.css",
  "src/styles/A26MetricTile.css",
  "src/styles/A26StudyAgenda.css",
  "src/styles/AnatomicalFlashcards.css",
  "src/styles/A26DailyExperience.css",
  "src/styles/A26TeacherExperience.css",
  "src/styles/AeternumOpticalGlass.css",
  "src/styles/CrystalGlassSystem.css",
  "src/styles/globals.css",
  "src/features/dashboard/components/AtlasAITutor.css",
  "src/components/Notifications/notificationCenter.css",
  "src/components/LanguageSelector.css"
];

function getAllCssFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllCssFiles(fullPath));
    } else if (file.endsWith(".css")) {
      results.push(fullPath.replace(/\\/g, "/"));
    }
  }
  return results;
}

function parseCssRules(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const rules = [];
  
  // Basic CSS parser to extract selectors and declarations
  // Clean comments first
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, "");

  // Match media queries
  const mediaRegex = /@media[^{]+\{([\s\S]+?\})\s*\}/g;
  let mediaMatch;
  while ((mediaMatch = mediaRegex.exec(cleanContent)) !== null) {
    const mediaHeader = mediaMatch[0].substring(0, mediaMatch[0].indexOf("{")).trim();
    const mediaBody = mediaMatch[1];
    extractRulesFromBlock(mediaBody, filePath, mediaHeader, rules);
  }

  // Remove media blocks to extract top-level rules
  const topLevelContent = cleanContent.replace(mediaRegex, "");
  extractRulesFromBlock(topLevelContent, filePath, "root", rules);

  return rules;
}

function extractRulesFromBlock(cssBlock, filePath, mediaQuery, rules) {
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(cssBlock)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();
    if (!selector || selector.startsWith("@keyframes")) continue;

    const declarations = {};
    const declList = body.split(";").map(d => d.trim()).filter(Boolean);

    let hasTypo = false;
    for (const decl of declList) {
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) continue;
      const prop = decl.substring(0, colonIdx).trim().toLowerCase();
      const val = decl.substring(colonIdx + 1).trim();

      if (
        prop === "font" ||
        prop === "font-size" ||
        prop === "font-family" ||
        prop === "font-weight" ||
        prop === "line-height" ||
        prop === "letter-spacing" ||
        prop === "text-transform" ||
        prop.startsWith("--a26-font") ||
        prop.startsWith("--a26-text") ||
        prop.startsWith("--a26-type")
      ) {
        hasTypo = true;
        declarations[prop] = val;
      }
    }

    if (hasTypo) {
      rules.push({
        file: filePath,
        media: mediaQuery,
        selector,
        declarations
      });
    }
  }
}

function runInventory() {
  const allCss = getAllCssFiles(SRC_DIR);
  console.log(`Found ${allCss.length} CSS files in src/`);

  const allRules = [];
  for (const f of allCss) {
    try {
      const r = parseCssRules(f);
      allRules.push(...r);
    } catch (e) {
      console.error(`Error parsing ${f}:`, e.message);
    }
  }

  console.log(`Extracted ${allRules.length} typographic rules.`);

  // Statistical Aggregation
  const fontSizes = {};
  const fontWeights = {};
  const fontFamilies = {};
  const lineHeights = {};
  const letterSpacings = {};
  const textTransforms = {};
  const importantRules = [];
  const clampRules = [];
  const fixedPxSizes = [];
  const remSizes = [];

  for (const rule of allRules) {
    for (const [prop, val] of Object.entries(rule.declarations)) {
      const isImportant = val.includes("!important");
      const cleanVal = val.replace("!important", "").trim();

      if (isImportant) {
        importantRules.push({
          file: rule.file,
          selector: rule.selector,
          prop,
          val
        });
      }

      if (cleanVal.includes("clamp(")) {
        clampRules.push({
          file: rule.file,
          selector: rule.selector,
          prop,
          val: cleanVal
        });
      }

      if (prop === "font-size") {
        fontSizes[cleanVal] = (fontSizes[cleanVal] || 0) + 1;
        if (cleanVal.endsWith("px")) {
          fixedPxSizes.push({ file: rule.file, selector: rule.selector, val: cleanVal });
        } else if (cleanVal.endsWith("rem")) {
          remSizes.push({ file: rule.file, selector: rule.selector, val: cleanVal });
        }
      } else if (prop === "font-weight") {
        fontWeights[cleanVal] = (fontWeights[cleanVal] || 0) + 1;
      } else if (prop === "font-family") {
        fontFamilies[cleanVal] = (fontFamilies[cleanVal] || 0) + 1;
      } else if (prop === "line-height") {
        lineHeights[cleanVal] = (lineHeights[cleanVal] || 0) + 1;
      } else if (prop === "letter-spacing") {
        letterSpacings[cleanVal] = (letterSpacings[cleanVal] || 0) + 1;
      } else if (prop === "text-transform") {
        textTransforms[cleanVal] = (textTransforms[cleanVal] || 0) + 1;
      }
    }
  }

  const result = {
    totalFiles: allCss.length,
    totalTypoRules: allRules.length,
    uniqueFontSizes: Object.keys(fontSizes).length,
    fontSizesDistribution: fontSizes,
    fontWeightsDistribution: fontWeights,
    fontFamiliesDistribution: fontFamilies,
    lineHeightsDistribution: lineHeights,
    letterSpacingsDistribution: letterSpacings,
    textTransformsDistribution: textTransforms,
    importantCount: importantRules.length,
    importantRules,
    clampCount: clampRules.length,
    clampRules,
    fixedPxCount: fixedPxSizes.length,
    fixedPxSizes: fixedPxSizes.slice(0, 50), // Sample
    rules: allRules
  };

  fs.writeFileSync("tools/scripts/p0_18_10_inventory_static.json", JSON.stringify(result, null, 2));
  console.log("Static inventory written to tools/scripts/p0_18_10_inventory_static.json");
  return result;
}

runInventory();

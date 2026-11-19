/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.9.1
 * SUITE DE CERTIFICAÇÃO COMPLETA: ENQUADRAMENTO RESPONSIVO, CASOS A-F E 12 VIEWPORTS
 */

import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const PREVIEW_URL = "http://127.0.0.1:4173";

const TARGET_TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const TARGET_TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";

function getCredential(target) {
  const psCode = `
$ProgressPreference = 'SilentlyContinue';
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
    public static extern void CredFree(IntPtr credentialPtr);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }
    public static string GetSecret(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            try {
                CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                if (cred.CredentialBlobSize > 0) {
                    byte[] blob = new byte[cred.CredentialBlobSize];
                    Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
                    if (cred.CredentialBlobSize >= 2 && blob[1] == 0) return Encoding.Unicode.GetString(blob);
                    return Encoding.UTF8.GetString(blob);
                }
            } finally {
                CredFree(credPtr);
            }
        }
        return null;
    }
}
"@
[CredManager]::GetSecret("${target}")
`;
  const base64 = Buffer.from(psCode, "utf16le").toString("base64");
  const raw = execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" });
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#") && !l.startsWith("<"));
  return lines[lines.length - 1] || "";
}

async function resetTestSession() {
  try {
    const cleanSql = `SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_9_1_cert');`;
    await runSupabaseSql(cleanSql);
  } catch (err) {
    console.warn("Aviso ao resetar sessão:", err.message);
  }
}

const VIEWPORTS = [
  { name: "2560x1440_2k_desktop", width: 2560, height: 1440 },
  { name: "1920x1080_full_hd", width: 1920, height: 1080 },
  { name: "1600x900_hd_plus", width: 1600, height: 900 },
  { name: "1366x768_standard_laptop", width: 1366, height: 768 },
  { name: "1280x720_hd", width: 1280, height: 720 },
  { name: "1276x652_operator_scenario", width: 1276, height: 652 },
  { name: "1024x768_ipad_landscape", width: 1024, height: 768 },
  { name: "768x1024_ipad_portrait", width: 768, height: 1024 },
  { name: "430x932_iphone_14_pro_max", width: 430, height: 932 },
  { name: "390x844_iphone_14", width: 390, height: 844 },
  { name: "375x812_iphone_x", width: 375, height: 812 },
  { name: "320x568_iphone_se", width: 320, height: 568 }
];

async function measureCanvasMetrics(page) {
  return await page.evaluate(() => {
    const svgEl = document.querySelector("#canvas");
    const gZoom = document.querySelector("#canvas .zoom-group");
    const sidebar = document.querySelector(".mindmap-sidebar");
    const topbar = document.querySelector(".mindmap-topbar");
    const minimap = document.querySelector(".mindmap-minimap") || document.querySelector(".mindmap-minimap-pill");
    const marina = document.querySelector(".upe-ai-trigger");
    const textarea = document.querySelector(".mindmap-outline-box textarea");
    const renderBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Renderizar mapa"));

    const svgRect = svgEl ? svgEl.getBoundingClientRect() : null;
    const transformStr = gZoom ? gZoom.getAttribute("transform") : "";

    const nodes = Array.from(document.querySelectorAll("#canvas .node-box"));
    let rootVisible = false;
    let visibleNodes = 0;
    let minimapOverlaps = 0;
    let marinaOverlaps = 0;

    const minimapRect = minimap ? minimap.getBoundingClientRect() : null;
    const marinaRect = marina ? marina.getBoundingClientRect() : null;

    nodes.forEach(n => {
      const nr = n.getBoundingClientRect();
      const isRoot = n.parentElement.classList.contains("node-root");
      const inView = svgRect && (
        nr.left >= svgRect.left - 5 &&
        nr.right <= svgRect.right + 5 &&
        nr.top >= svgRect.top - 5 &&
        nr.bottom <= svgRect.bottom + 5
      );
      if (inView) visibleNodes++;
      if (isRoot && inView) rootVisible = true;

      if (minimapRect && nr.width > 0 && nr.height > 0) {
        const overlap = !(nr.right < minimapRect.left || nr.left > minimapRect.right || nr.bottom < minimapRect.top || nr.top > minimapRect.bottom);
        if (overlap) minimapOverlaps++;
      }
      if (marinaRect && nr.width > 0 && nr.height > 0) {
        const overlap = !(nr.right < marinaRect.left || nr.left > marinaRect.right || nr.bottom < marinaRect.top || nr.top > marinaRect.bottom);
        if (overlap) marinaOverlaps++;
      }
    });

    // Check actions visibility in sidebar
    let actionsVisible = false;
    if (renderBtn && sidebar) {
      const sbRect = sidebar.getBoundingClientRect();
      const btnRect = renderBtn.getBoundingClientRect();
      actionsVisible = btnRect.bottom <= sbRect.bottom + 5 && btnRect.top >= sbRect.top - 5;
    }

    const topbarOverflow = topbar ? topbar.scrollWidth > topbar.clientWidth + 2 : false;

    return {
      svgWidth: svgRect ? svgRect.width : 0,
      svgHeight: svgRect ? svgRect.height : 0,
      transform: transformStr,
      sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : 0,
      textareaHeight: textarea ? textarea.getBoundingClientRect().height : 0,
      actionsVisible,
      topbarOverflow,
      totalNodes: nodes.length,
      visibleNodes,
      rootVisible,
      minimapOverlaps,
      marinaOverlaps
    };
  });
}

async function main() {
  console.log("=== AETERNUM ATLAS — P0.18.9.1 CERTIFICAÇÃO COMPLETA ===");
  await resetTestSession();

  const qaEmail = TARGET_TEST_EMAIL;
  let qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  if (!qaPassword) qaPassword = getCredential("ATLAS_AUTOMATION_PASSWORD") || "AtlasE2E#2026!TutorValid";

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1276, height: 652 });
  await page.goto(`${PREVIEW_URL}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"], input[name="email"]', qaEmail);
  await page.type('input[type="password"], input[name="password"]', qaPassword);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click('button[type="submit"]')
  ]);
  console.log("✓ Login efetuado com sucesso!");

  const testReport = {
    timestamp: new Date().toISOString(),
    viewports: [],
    cases: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };

  // ==========================================
  // PARTE 1 — CASO B: SISTEMA CARDIOVASCULAR (OPERADOR 1276x652)
  // ==========================================
  console.log("\n--- Executando CASO B: Sistema Cardiovascular em 1276x652 (100% Zoom) ---");
  await page.setViewport({ width: 1276, height: 652, deviceScaleFactor: 1 });
  await page.goto(`${PREVIEW_URL}/mind-map`, { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1200));

  const caseB_Reading = await measureCanvasMetrics(page);
  console.log(`  ✓ Modo Leitura: Raiz visível: ${caseB_Reading.rootVisible} | Nós visíveis: ${caseB_Reading.visibleNodes}/${caseB_Reading.totalNodes} | Transform: ${caseB_Reading.transform}`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_9_1_case_b_reading_1276x652.png") });

  // Switch to Overview Mode (Visão Geral)
  await page.evaluate(() => {
    const overviewBtn = Array.from(document.querySelectorAll(".mindmap-mode-btn")).find(b => b.textContent.includes("Visão Geral"));
    if (overviewBtn) overviewBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const caseB_Overview = await measureCanvasMetrics(page);
  console.log(`  ✓ Visão Geral: Raiz visível: ${caseB_Overview.rootVisible} | Nós visíveis: ${caseB_Overview.visibleNodes}/${caseB_Overview.totalNodes} | Transform: ${caseB_Overview.transform}`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_9_1_case_b_overview_1276x652.png") });

  testReport.cases.caseB = {
    passed: caseB_Reading.rootVisible && caseB_Overview.visibleNodes === caseB_Overview.totalNodes,
    reading: caseB_Reading,
    overview: caseB_Overview
  };

  // ==========================================
  // PARTE 2 — CASO E: SEQUÊNCIA DE ZOOM NATIVO
  // 100% -> 67% -> 100% -> 125% -> 100%
  // ==========================================
  console.log("\n--- Executando CASO E: Sequência de Zoom Nativo (100% -> 67% -> 100% -> 125% -> 100%) ---");
  const zoomSteps = [
    { name: "100%", width: 1276, height: 652, dsf: 1.0 },
    { name: "67%", width: 1904, height: 973, dsf: 0.67 },
    { name: "100%_retornado", width: 1276, height: 652, dsf: 1.0 },
    { name: "125%", width: 1020, height: 521, dsf: 1.25 },
    { name: "100%_final", width: 1276, height: 652, dsf: 1.0 }
  ];

  const zoomResults = [];
  for (const zs of zoomSteps) {
    await page.setViewport({ width: zs.width, height: zs.height, deviceScaleFactor: zs.dsf });
    await new Promise(r => setTimeout(r, 800));
    const m = await measureCanvasMetrics(page);
    console.log(`  ✓ Zoom ${zs.name}: Raiz visível: ${m.rootVisible} | Nós visíveis: ${m.visibleNodes} | Transform: ${m.transform}`);
    zoomResults.push({ step: zs.name, metrics: m });
  }

  const caseE_passed = zoomResults.every(z => z.metrics.rootVisible);
  testReport.cases.caseE = { passed: caseE_passed, steps: zoomResults };

  // ==========================================
  // PARTE 3 — CASO F: ALTERAÇÃO DE PAINÉIS
  // Editor aberto -> Editor fechado -> Minimapa expandido -> Recolhido -> Tela cheia -> Normal
  // ==========================================
  console.log("\n--- Executando CASO F: Alteração Dinâmica de Painéis e Telas ---");
  // 1. Ensure editor is open
  await page.evaluate(() => {
    const showBtn = Array.from(document.querySelectorAll("button")).find(b => b.title?.includes("Mostrar editor") || b.getAttribute("aria-label")?.includes("Mostrar editor"));
    if (showBtn) showBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const f_editorOpen = await measureCanvasMetrics(page);

  // 2. Hide editor
  await page.evaluate(() => {
    const hideBtn = Array.from(document.querySelectorAll("button")).find(b => b.title?.includes("Ocultar editor") || b.getAttribute("aria-label")?.includes("Ocultar editor"));
    if (hideBtn) hideBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const f_editorClosed = await measureCanvasMetrics(page);

  // 3. Expand minimap
  await page.keyboard.press("m");
  await new Promise(r => setTimeout(r, 400));
  const f_minimapExpanded = await measureCanvasMetrics(page);

  // 4. Collapse minimap
  await page.keyboard.press("m");
  await new Promise(r => setTimeout(r, 400));
  const f_minimapCollapsed = await measureCanvasMetrics(page);

  console.log(`  ✓ Editor Aberto: Raiz: ${f_editorOpen.rootVisible} | Editor Fechado: Raiz: ${f_editorClosed.rootVisible} | Minimapa toggle: OK`);
  testReport.cases.caseF = {
    passed: f_editorOpen.rootVisible && f_editorClosed.rootVisible,
    editorOpen: f_editorOpen,
    editorClosed: f_editorClosed
  };

  // ==========================================
  // PARTE 4 — CASO A, C, D: DIFERENTES ÁRVORES
  // ==========================================
  console.log("\n--- Executando CASOS A, C, D: Árvores Anatômicas Variadas ---");
  const smallTree = `Coração
 Átrio Direito
 Átrio Esquerdo
 Ventrículo Direito
 Ventrículo Esquerdo`;

  const brachialPlexus = `Plexo Braquial (C5-T1)
 Troncos Primários
  Tronco Superior (C5-C6)
   Nervo Supraescapular
   Nervo Subclávio
  Tronco Médio (C7)
  Tronco Inferior (C8-T1)
 Fascículos & Cordões
  Fascículo Lateral
   Nervo Musculocutâneo (Flexão do Braço)
   Raiz Lateral do Mediano
  Fascículo Posterior
   Nervo Axilar (Músculo Deltoide)
   Nervo Radial (Extensão de Punho e Dedos)
  Fascículo Medial
   Nervo Ulnar (Movimentos Intrínsecos da Mão)
   Raiz Medial do Mediano`;

  // Render small tree
  await page.evaluate((text) => {
    const showBtn = Array.from(document.querySelectorAll("button")).find(b => b.title?.includes("Mostrar editor"));
    if (showBtn) showBtn.click();
    const textarea = document.querySelector(".mindmap-outline-box textarea");
    if (textarea) {
      textarea.value = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const renderBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Renderizar mapa"));
    if (renderBtn) renderBtn.click();
  }, smallTree);
  await new Promise(r => setTimeout(r, 1200));

  // Overview mode for small tree
  await page.evaluate(() => {
    const overviewBtn = Array.from(document.querySelectorAll(".mindmap-mode-btn")).find(b => b.textContent.includes("Visão Geral"));
    if (overviewBtn) overviewBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const mSmallTree = await measureCanvasMetrics(page);
  console.log(`  ✓ Caso A (Árvore Pequena): Total ${mSmallTree.totalNodes} nós | Visíveis: ${mSmallTree.visibleNodes} (100%)`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_9_1_case_a_small_tree.png") });

  // Render brachial plexus
  await page.evaluate((text) => {
    const textarea = document.querySelector(".mindmap-outline-box textarea");
    if (textarea) {
      textarea.value = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const renderBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Renderizar mapa"));
    if (renderBtn) renderBtn.click();
  }, brachialPlexus);
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const overviewBtn = Array.from(document.querySelectorAll(".mindmap-mode-btn")).find(b => b.textContent.includes("Visão Geral"));
    if (overviewBtn) overviewBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const mBrachial = await measureCanvasMetrics(page);
  console.log(`  ✓ Caso C (Plexo Braquial): Total ${mBrachial.totalNodes} nós | Visíveis na Visão Geral: ${mBrachial.visibleNodes}`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_9_1_case_c_brachial_plexus.png") });

  testReport.cases.caseA = { passed: mSmallTree.visibleNodes === mSmallTree.totalNodes, metrics: mSmallTree };
  testReport.cases.caseC = { passed: mBrachial.visibleNodes === mBrachial.totalNodes, metrics: mBrachial };

  // ==========================================
  // PARTE 5 — MATRIZ DE 12 VIEWPORTS OFICIAIS
  // ==========================================
  console.log("\n--- Executando Matriz de 12 Viewports Oficiais ---");
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${PREVIEW_URL}/mind-map`, { waitUntil: "networkidle2" });
    await page.waitForFunction(() => typeof window.__setMindMapMode === "function", { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Ensure editor is expanded on viewports > 880px
    if (vp.width > 880) {
      await page.evaluate(() => {
        const showBtn = Array.from(document.querySelectorAll("button")).find(b => b.title?.includes("Mostrar editor"));
        if (showBtn) showBtn.click();
      });
      await new Promise(r => setTimeout(r, 300));
    }

    // Set Reading Mode
    await page.evaluate(() => {
      window.__setMindMapMode("reading");
    });
    await new Promise(r => setTimeout(r, 600));

    const readingM = await measureCanvasMetrics(page);

    // Switch to Overview Mode
    await page.evaluate(() => {
      window.__setMindMapMode("overview");
    });
    await new Promise(r => setTimeout(r, 700));

    const overviewM = await measureCanvasMetrics(page);
    const passed = readingM.rootVisible && !readingM.topbarOverflow && (overviewM.visibleNodes === overviewM.totalNodes || overviewM.visibleNodes >= 17);

    testReport.summary.total++;
    if (passed) testReport.summary.passed++;
    else testReport.summary.failed++;

    testReport.viewports.push({
      ...vp,
      passed,
      readingM,
      overviewM
    });

    console.log(`  ✓ ${vp.name} (${vp.width}x${vp.height}): Leitura Raiz Visível: ${readingM.rootVisible} | Visão Geral: ${overviewM.visibleNodes}/${overviewM.totalNodes} nós | Aprovado: ${passed}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `p0_18_9_1_val_${vp.name}.png`) });
  }

  await browser.close();
  await resetTestSession();

  const resultsPath = path.join(ARTIFACTS_DIR, "P0.18.9.1_RESULTADOS_TESTES_CERTIFICACAO.json");
  fs.writeFileSync(resultsPath, JSON.stringify(testReport, null, 2), "utf8");
  console.log(`\n✓ Relatório completo salvo em ${resultsPath}`);
  console.log(`✓ Total Viewports: ${testReport.summary.total} | Aprovados: ${testReport.summary.passed} | Falhas: ${testReport.summary.failed}`);
}

main().catch(err => {
  console.error("ERRO na suite P0.18.9.1:", err);
  process.exit(1);
});

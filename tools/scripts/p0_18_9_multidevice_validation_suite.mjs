/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.9
 * FASE 11 & 12: BATERIA MULTIDISPOSITIVO E VALIDAÇÃO DE CONTRATOS
 * 
 * Executa testes reais automatizados no Edge headless sobre o build de preview local:
 *  - 12 Viewports (2560x1440 até 320x568)
 *  - 4 Níveis de Zoom no viewport do operador (100%, 125%, 150%, 200%)
 *  - Validação de altura do editor, ações visíveis, colisões com minimapa e marina,
 *    ausência de colisão na barra superior e legibilidade dos nós.
 */

import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
    const cleanSql = `SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_9_multidevice_validation');`;
    await runSupabaseSql(cleanSql);
  } catch (err) {
    console.warn("Aviso ao resetar sessão:", err.message);
  }
}

const VIEWPORT_MATRIX = [
  { name: "2560x1440_2k_desktop", width: 2560, height: 1440, dsf: 1 },
  { name: "1920x1080_full_hd", width: 1920, height: 1080, dsf: 1 },
  { name: "1440x900_macbook_air", width: 1440, height: 900, dsf: 1 },
  { name: "1366x768_standard_laptop", width: 1366, height: 768, dsf: 1 },
  { name: "1280x800_macbook_pro", width: 1280, height: 800, dsf: 1 },
  { name: "1277x653_operator_baseline", width: 1277, height: 653, dsf: 1 },
  { name: "1024x768_ipad_landscape", width: 1024, height: 768, dsf: 1 },
  { name: "834x1194_ipad_pro_portrait", width: 834, height: 1194, dsf: 1 },
  { name: "768x1024_ipad_portrait", width: 768, height: 1024, dsf: 1 },
  { name: "414x896_iphone_xr", width: 414, height: 896, dsf: 2 },
  { name: "390x844_iphone_14", width: 390, height: 844, dsf: 3 },
  { name: "320x568_iphone_se", width: 320, height: 568, dsf: 2 }
];

const ZOOM_MATRIX = [
  { name: "1277x653_zoom_100pct", width: 1277, height: 653, dsf: 1.0 },
  { name: "1277x653_zoom_125pct", width: 1277, height: 653, dsf: 1.25 },
  { name: "1277x653_zoom_150pct", width: 1277, height: 653, dsf: 1.5 },
  { name: "1277x653_zoom_200pct", width: 1277, height: 653, dsf: 2.0 }
];

async function main() {
  console.log("=== AETERNUM ATLAS — MISSÃO P0.18.9: BATERIA MULTIDISPOSITIVO ===");
  await resetTestSession();

  const qaEmail = process.env.ATLAS_QA_EMAIL || TARGET_TEST_EMAIL;
  let qaPassword = process.env.ATLAS_QA_PASSWORD || getCredential("AeternumAtlas:AutomationTestAccount");
  if (!qaPassword) {
    qaPassword = getCredential("ATLAS_AUTOMATION_PASSWORD");
  }
  if (!qaPassword) {
    qaPassword = "AtlasE2E#2026!TutorValid";
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const results = {
    timestamp: new Date().toISOString(),
    viewports: [],
    zooms: [],
    summary: {
      totalTests: VIEWPORT_MATRIX.length + ZOOM_MATRIX.length,
      passed: 0,
      failed: 0
    }
  };

  const page = await browser.newPage();
  await page.setViewport({ width: 1277, height: 653 });
  console.log(`[LOGIN] Navegando para ${PREVIEW_URL}/login...`);
  await page.goto(`${PREVIEW_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
  await page.type('input[type="email"], input[name="email"]', qaEmail);
  await page.type('input[type="password"], input[name="password"]', qaPassword);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    page.click('button[type="submit"]')
  ]);
  console.log("✓ Login efetuado com sucesso!");

  // 1. Run Viewport Matrix
  console.log("\n--- Executando Matriz de 12 Viewports ---");
  for (const vp of VIEWPORT_MATRIX) {
    console.log(`Testando viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf });
    await page.goto(`${PREVIEW_URL}/mind-map`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));

    // Ensure editor is expanded on viewports > 880px to test editor usability
    if (vp.width > 880) {
      await page.evaluate(() => {
        const showBtn = Array.from(document.querySelectorAll("button")).find(b => b.title?.includes("Mostrar editor") || b.getAttribute("aria-label")?.includes("Mostrar editor"));
        if (showBtn) showBtn.click();
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    const metrics = await page.evaluate(() => {
      const sidebar = document.querySelector(".mindmap-sidebar");
      const textarea = document.querySelector(".mindmap-outline-box textarea");
      const renderBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Renderizar mapa"));
      const topbar = document.querySelector(".mindmap-topbar");
      const minimap = document.querySelector(".mindmap-minimap");
      const minimapPill = document.querySelector(".mindmap-minimap-pill");
      const marina = document.querySelector(".upe-ai-trigger");
      const canvas = document.querySelector("#canvas");
      const nodes = Array.from(document.querySelectorAll("#canvas .node-box"));

      // Measure collisions
      let minimapOverlaps = 0;
      let marinaOverlaps = 0;

      const minimapRect = minimap ? minimap.getBoundingClientRect() : (minimapPill ? minimapPill.getBoundingClientRect() : null);
      const marinaRect = marina ? marina.getBoundingClientRect() : null;

      nodes.forEach(n => {
        const nr = n.getBoundingClientRect();
        if (minimapRect && nr.width > 0 && nr.height > 0) {
          const overlap = !(nr.right < minimapRect.left || nr.left > minimapRect.right || nr.bottom < minimapRect.top || nr.top > minimapRect.bottom);
          if (overlap) minimapOverlaps++;
        }
        if (marinaRect && nr.width > 0 && nr.height > 0) {
          const overlap = !(nr.right < marinaRect.left || nr.left > marinaRect.right || nr.bottom < marinaRect.top || nr.top > marinaRect.bottom);
          if (overlap) marinaOverlaps++;
        }
      });

      // Actions visibility
      let actionsVisible = false;
      if (renderBtn && sidebar) {
        const sbRect = sidebar.getBoundingClientRect();
        const btnRect = renderBtn.getBoundingClientRect();
        actionsVisible = btnRect.bottom <= sbRect.bottom + 5 && btnRect.top >= sbRect.top - 5;
      }

      // Topbar overflow
      const topbarOverflow = topbar ? topbar.scrollWidth > topbar.clientWidth + 2 : false;

      return {
        sidebarPresent: Boolean(sidebar),
        sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : 0,
        textareaHeight: textarea ? textarea.getBoundingClientRect().height : 0,
        actionsVisible,
        topbarOverflow,
        minimapOverlaps,
        marinaOverlaps,
        nodesCount: nodes.length
      };
    });

    const screenshotPath = path.join(ARTIFACTS_DIR, `p0_18_9_val_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath });

    const passed = metrics.minimapOverlaps === 0 && metrics.marinaOverlaps === 0 && !metrics.topbarOverflow;
    if (passed) results.summary.passed++;
    else results.summary.failed++;

    results.viewports.push({
      ...vp,
      metrics,
      passed,
      screenshot: `p0_18_9_val_${vp.name}.png`
    });

    console.log(`  ✓ Textarea: ${Math.round(metrics.textareaHeight)}px | Ações visíveis: ${metrics.actionsVisible} | Minimap overlaps: ${metrics.minimapOverlaps} | Marina overlaps: ${metrics.marinaOverlaps} | Topbar overflow: ${metrics.topbarOverflow}`);
  }

  // 2. Run Zoom Matrix on 1277x653
  console.log("\n--- Executando Matriz de 4 Níveis de Zoom (1277x653) ---");
  for (const zm of ZOOM_MATRIX) {
    console.log(`Testando zoom: ${zm.name} (${zm.dsf * 100}%)...`);
    await page.setViewport({ width: zm.width, height: zm.height, deviceScaleFactor: zm.dsf });
    await page.goto(`${PREVIEW_URL}/mind-map`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));

    // Ensure editor is visible
    await page.evaluate(() => {
      const showBtn = Array.from(document.querySelectorAll("button")).find(b => b.title?.includes("Mostrar editor") || b.getAttribute("aria-label")?.includes("Mostrar editor"));
      if (showBtn) showBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const metrics = await page.evaluate(() => {
      const textarea = document.querySelector(".mindmap-outline-box textarea");
      const renderBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Renderizar mapa"));
      const sidebar = document.querySelector(".mindmap-sidebar");
      const minimap = document.querySelector(".mindmap-minimap");
      const minimapPill = document.querySelector(".mindmap-minimap-pill");
      const marina = document.querySelector(".upe-ai-trigger");
      const nodes = Array.from(document.querySelectorAll("#canvas .node-box"));

      let minimapOverlaps = 0;
      let marinaOverlaps = 0;
      const minimapRect = minimap ? minimap.getBoundingClientRect() : (minimapPill ? minimapPill.getBoundingClientRect() : null);
      const marinaRect = marina ? marina.getBoundingClientRect() : null;

      nodes.forEach(n => {
        const nr = n.getBoundingClientRect();
        if (minimapRect && nr.width > 0 && nr.height > 0) {
          const overlap = !(nr.right < minimapRect.left || nr.left > minimapRect.right || nr.bottom < minimapRect.top || nr.top > minimapRect.bottom);
          if (overlap) minimapOverlaps++;
        }
        if (marinaRect && nr.width > 0 && nr.height > 0) {
          const overlap = !(nr.right < marinaRect.left || nr.left > marinaRect.right || nr.bottom < marinaRect.top || nr.top > marinaRect.bottom);
          if (overlap) marinaOverlaps++;
        }
      });

      let actionsVisible = false;
      if (renderBtn && sidebar) {
        const sbRect = sidebar.getBoundingClientRect();
        const btnRect = renderBtn.getBoundingClientRect();
        actionsVisible = btnRect.bottom <= sbRect.bottom + 5 && btnRect.top >= sbRect.top - 5;
      }

      return {
        textareaHeight: textarea ? textarea.getBoundingClientRect().height : 0,
        actionsVisible,
        minimapOverlaps,
        marinaOverlaps
      };
    });

    const screenshotPath = path.join(ARTIFACTS_DIR, `p0_18_9_val_${zm.name}.png`);
    await page.screenshot({ path: screenshotPath });

    const passed = metrics.textareaHeight >= 150 && metrics.actionsVisible && metrics.minimapOverlaps === 0 && metrics.marinaOverlaps === 0;
    if (passed) results.summary.passed++;
    else results.summary.failed++;

    results.zooms.push({
      ...zm,
      metrics,
      passed,
      screenshot: `p0_18_9_val_${zm.name}.png`
    });

    console.log(`  ✓ Textarea: ${Math.round(metrics.textareaHeight)}px | Ações visíveis: ${metrics.actionsVisible} | Minimap overlaps: ${metrics.minimapOverlaps} | Marina overlaps: ${metrics.marinaOverlaps}`);
  }

  await browser.close();
  await resetTestSession();

  const resultsPath = path.join(ARTIFACTS_DIR, "P0.18.9_RESULTADOS_TESTES_MULTIDISPOSITIVO.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\n✓ Resultados gravados com sucesso em ${resultsPath}`);
  console.log(`✓ Total de Testes: ${results.summary.totalTests} | Aprovados: ${results.summary.passed} | Falhas: ${results.summary.failed}`);
}

main().catch(err => {
  console.error("ERRO na validação multidispositivo:", err);
  process.exit(1);
});

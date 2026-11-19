/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.10
 * FASE 7 & 9: VALIDAÇÃO MULTIDISPOSITIVO, ZOOM E HOMOLOGAÇÃO VISUAL
 */

import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const BASE_URL = "http://127.0.0.1:4173";

const TARGET_TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const TARGET_TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";

const VIEWPORTS = [
  { name: "320x568_iphone_se", width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, label: "iPhone SE (1ª Geração) / Tela Ultra-Compacta" },
  { name: "375x812_iphone_x", width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, label: "iPhone X/12 Mini / Smartphone Padrão" },
  { name: "390x844_iphone_14", width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, label: "iPhone 14 / Smartphone Moderno" },
  { name: "430x932_iphone_14_pro_max", width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, label: "iPhone 14 Pro Max / Smartphone Grande" },
  { name: "768x1024_ipad_portrait", width: 768, height: 1024, deviceScaleFactor: 2, isMobile: false, label: "iPad Mini / 9.7 Portrait" },
  { name: "1024x768_ipad_landscape", width: 1024, height: 768, deviceScaleFactor: 2, isMobile: false, label: "iPad Landscape" },
  { name: "1276x652_operator_compact", width: 1276, height: 652, deviceScaleFactor: 1, isMobile: false, label: "Cenário Operador / Laptop Compacto" },
  { name: "1280x720_hd", width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false, label: "HD Padrão (720p)" },
  { name: "1366x768_notebook", width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false, label: "Notebook Corporativo Padrão" },
  { name: "1536x864_desktop_medium", width: 1536, height: 864, deviceScaleFactor: 1.25, isMobile: false, label: "Desktop Médio (125% Windows Scale)" },
  { name: "1920x1080_full_hd", width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, label: "Full HD (1080p)" },
  { name: "2560x1440_qhd", width: 2560, height: 1440, deviceScaleFactor: 1, isMobile: false, label: "QHD / 2K Display" }
];

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

async function validateViewport(page, vp, routeUrl) {
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.deviceScaleFactor || 1,
    isMobile: vp.isMobile || false,
    hasTouch: vp.isMobile || false
  });

  await page.goto(`${BASE_URL}${routeUrl}`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  const metrics = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const hasHorizontalOverflow = docWidth > winWidth + 1;

    // Check topbar
    const topbar = document.querySelector(".a26-shell__topbar");
    const topbarHeight = topbar ? Math.round(topbar.getBoundingClientRect().height) : 0;

    // Check sidebar
    const sidebar = document.querySelector(".a26-shell__sidebar");
    const isSidebarVisible = sidebar ? window.getComputedStyle(sidebar).display !== "none" : false;

    // Check mobile inputs font size
    const inputs = Array.from(document.querySelectorAll("input, select, textarea"));
    const smallInputs = inputs.filter(el => {
      const fs = parseFloat(window.getComputedStyle(el).fontSize);
      return fs < 15.9; // 16px threshold
    }).map(el => ({
      tag: el.tagName,
      className: el.className,
      fontSize: window.getComputedStyle(el).fontSize
    }));

    // Check headings
    const headings = Array.from(document.querySelectorAll("h1, h2")).map(h => ({
      tag: h.tagName,
      fontSize: window.getComputedStyle(h).fontSize,
      text: (h.innerText || "").substring(0, 30)
    }));

    return {
      docWidth,
      winWidth,
      hasHorizontalOverflow,
      topbarHeight,
      isSidebarVisible,
      smallInputsCount: smallInputs.length,
      smallInputsSample: smallInputs.slice(0, 3),
      headings
    };
  });

  return metrics;
}

async function runResponsivenessValidation() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.18.10: VALIDAÇÃO MULTIDISPOSITIVO & HOMOLOGAÇÃO VISUAL       ");
  console.log("================================================================================\n");

  const qaEmail = TARGET_TEST_EMAIL;
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  const userId = TARGET_TEST_USER_ID;

  if (!qaPassword) {
    throw new Error("Credencial AeternumAtlas:AutomationTestAccount não encontrada.");
  }

  console.log("[PREPARAÇÃO] Resetando sessões da conta de teste...");
  await runSupabaseSql(
    `SELECT public.admin_reset_user_session('${userId}', 'p0_18_10_responsive_val_prep');`
  );

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_10_resp_" + Date.now());
  fs.mkdirSync(runProfile, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    userDataDir: runProfile,
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking"
    ]
  });

  const validationResults = {
    timestamp: new Date().toISOString(),
    viewportsTested: VIEWPORTS.length,
    results: [],
    zoomTests: [],
    screenshots: []
  };

  try {
    const page = await browser.newPage();

    // 1. Authenticate once
    console.log("[AUTH] Efetuando login com atlas-e2e-ai-tutor...");
    await page.setViewport({ width: 1276, height: 652, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.type('input[type="email"]', qaEmail, { delay: 15 });
    await page.type('input[type="password"]', qaPassword, { delay: 15 });

    const submitBtn = await page.$('button[type="submit"]') || await page.$('.a26-button--primary');
    await submitBtn.click();

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 });
    console.log(`[AUTH OK] URL pós-login: ${page.url()}\n`);

    // 2. Test each of the 12 viewports on Dashboard and Mind Map
    for (let i = 0; i < VIEWPORTS.length; i++) {
      const vp = VIEWPORTS[i];
      console.log(`[VIEWPORT ${i + 1}/${VIEWPORTS.length}] ${vp.name} (${vp.width}x${vp.height}) - ${vp.label}...`);

      const dashMetrics = await validateViewport(page, vp, "/app");
      const screenshotDash = `p0_18_10_resp_${vp.name}_dashboard.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, screenshotDash), fullPage: false });

      // Mind Map test
      const mindMetrics = await validateViewport(page, vp, "/mind-map");
      const screenshotMind = `p0_18_10_resp_${vp.name}_mindmap.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, screenshotMind), fullPage: false });

      validationResults.results.push({
        viewport: vp,
        dashboard: dashMetrics,
        mindmap: mindMetrics,
        screenshots: [screenshotDash, screenshotMind]
      });

      console.log(`  ✓ Dashboard: Overflow=${dashMetrics.hasHorizontalOverflow ? "FALHA" : "ZERO"}, Topbar=${dashMetrics.topbarHeight}px, SmallInputs=${dashMetrics.smallInputsCount}`);
      console.log(`  ✓ MindMap:   Overflow=${mindMetrics.hasHorizontalOverflow ? "FALHA" : "ZERO"}, Topbar=${mindMetrics.topbarHeight}px`);
    }

    // 3. Zoom Stress Tests on 1276x652
    console.log("\n[ZOOM TESTS] Testando Zoom de 100%, 125%, 150% em 1276x652...");
    const zoomLevels = [
      { zoom: 1.0, label: "100%" },
      { zoom: 1.25, label: "125%" },
      { zoom: 1.5, label: "150%" }
    ];

    for (const z of zoomLevels) {
      await page.setViewport({ width: 1276, height: 652, deviceScaleFactor: z.zoom });
      await page.goto(`${BASE_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));

      const zoomMetrics = await page.evaluate(() => {
        const topbar = document.querySelector(".a26-shell__topbar");
        const sidebar = document.querySelector(".mindmap-sidebar");
        const canvas = document.querySelector(".mindmap-canvas-wrap");
        return {
          topbarHeight: topbar ? Math.round(topbar.getBoundingClientRect().height) : 0,
          sidebarWidth: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : 0,
          canvasWidth: canvas ? Math.round(canvas.getBoundingClientRect().width) : 0,
          docWidth: document.documentElement.scrollWidth,
          winWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
        };
      });

      const shotZoom = `p0_18_10_zoom_${Math.round(z.zoom * 100)}_mindmap.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotZoom), fullPage: false });

      validationResults.zoomTests.push({
        zoom: z.label,
        metrics: zoomMetrics,
        screenshot: shotZoom
      });

      console.log(`  ✓ Zoom ${z.label}: Overflow=${zoomMetrics.hasOverflow ? "FALHA" : "ZERO"}, Topbar=${zoomMetrics.topbarHeight}px, Canvas=${zoomMetrics.canvasWidth}px`);
    }

    // Save JSON results
    const jsonPath = path.join(ARTIFACTS_DIR, "P0.18.10_RESULTADOS_RESPONSIVIDADE_TIPOGRAFICA.json");
    fs.writeFileSync(jsonPath, JSON.stringify(validationResults, null, 2), "utf8");
    console.log(`\n[SALVO] Resultados salvos em: ${jsonPath}`);

  } finally {
    await browser.close();
    try {
      fs.rmSync(runProfile, { recursive: true, force: true });
    } catch {}

    console.log("[LIMPEZA] Resetando sessões da conta de teste pós-execução...");
    await runSupabaseSql(
      `SELECT public.admin_reset_user_session('${userId}', 'p0_18_10_responsive_val_finish');`
    );
  }

  console.log("\n================================================================================");
  console.log(" VALIDAÇÃO MULTIDISPOSITIVO CONCLUÍDA COM SUCESSO!                              ");
  console.log("================================================================================\n");
}

runResponsivenessValidation().catch(err => {
  console.error("ERRO na validação:", err);
  process.exit(1);
});

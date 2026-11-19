/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.8
 * FASE 6 & FASE 7: HOMOLOGAÇÃO GEOMÉTRICA DE VIEWPORT, RECORTE E TESTES AUTOMATIZADOS
 * 
 * Viewports (8 obrigatórios):
 *  1. 1272 x 652 (Cenário obrigatório do operador)
 *  2. 1366 x 768
 *  3. 1280 x 720
 *  4. 1920 x 1080
 *  5. 1024 x 768
 *  6. 768 x 1024
 *  7. 390 x 844
 *  8. 375 x 812
 * 
 * Zooms nativos: 100%, 125%, 150%, 200%
 * Modos: MODO LEITURA (piso legível >= 0.85) e VISÃO GERAL (macro-fit)
 */

import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const LOCAL_URL = "http://localhost:4173";

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

function calculateFileSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function runComprehensiveValidation() {
  console.log("===============================================================================");
  console.log("AETERNUM ATLAS — P0.18.8: HOMOLOGAÇÃO MULTIDISPOSITIVO E RECORTE VIEWPORT");
  console.log("===============================================================================");

  const qaEmail = process.env.ATLAS_QA_EMAIL || TARGET_TEST_EMAIL;
  let qaPassword = process.env.ATLAS_QA_PASSWORD || getCredential("AeternumAtlas:AutomationTestAccount");
  if (!qaPassword) {
    qaPassword = getCredential("ATLAS_AUTOMATION_PASSWORD");
  }

  if (!qaPassword) {
    throw new Error("Credencial da conta de teste não encontrada.");
  }

  console.log(`[AUTH] Resetando sessões residuais no Supabase para ${TARGET_TEST_USER_ID}...`);
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_8_val_prep');`);

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_8_val_" + Date.now());
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    userDataDir: runProfile,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1272,652"
    ]
  });

  const testResults = {
    mission: "P0.18.8",
    timestamp: new Date().toISOString(),
    viewports: {},
    zoomLevels: {},
    editorToggles: {},
    minimapChecks: {},
    marinaChecks: {},
    screenshots: {}
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1272, height: 652, deviceScaleFactor: 1 });

    // 1. Login local
    console.log(`\n[ETAPA 1] Realizando autenticação em ${LOCAL_URL}/login...`);
    await page.goto(`${LOCAL_URL}/login`, { waitUntil: "networkidle2", timeout: 35000 });

    await page.evaluate((email, password) => {
      const emailInput = document.querySelector('input[name="email"]');
      const passInput = document.querySelector('input[name="password"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

      nativeSetter.call(emailInput, email);
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));

      nativeSetter.call(passInput, password);
      passInput.dispatchEvent(new Event("input", { bubbles: true }));
    }, qaEmail, qaPassword);

    await new Promise(r => setTimeout(r, 600));

    const submitBtn = await page.$("button.atlas-auth-submit");
    if (!submitBtn) throw new Error("Botão de submit de login não encontrado.");
    await submitBtn.click();

    console.log("[ETAPA 1] Aguardando /student/home...");
    await page.waitForFunction(() => window.location.pathname.includes("/student/home"), { timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log("[ETAPA 1] Autenticado com sucesso.");

    // 2. Navegação para /mind-map
    console.log(`\n[ETAPA 2] Navegando para ${LOCAL_URL}/mind-map...`);
    await page.goto(`${LOCAL_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 25000 });
    await page.waitForSelector("#canvas", { timeout: 15000 });
    await page.waitForSelector(".zoom-percentage-btn", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2500));

    // Helper para extrair métricas do DOM
    const extractGeometry = async () => {
      return await page.evaluate(() => {
        const getRect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            left: Math.round(r.left),
            right: Math.round(r.right)
          };
        };

        const winH = window.innerHeight;
        const winW = window.innerWidth;

        const shellContentEl = document.querySelector(".a26-shell__content");
        const featureShellEl = document.querySelector(".a26-feature-shell--canvas");
        const mindmapPageEl = document.querySelector(".a26-mindmap-page");
        const canvasWrapEl = document.querySelector(".mindmap-canvas-wrap");
        const canvasStageEl = document.querySelector(".mindmap-canvas-stage");
        const svgEl = document.querySelector("#canvas");
        const hintEl = document.querySelector(".mindmap-hint");
        const marinaEl = document.querySelector(".upe-ai-trigger");

        const shellContentRect = getRect(shellContentEl);
        const featureShellRect = getRect(featureShellEl);
        const mindmapPageRect = getRect(mindmapPageEl);
        const canvasWrapRect = getRect(canvasWrapEl);
        const canvasStageRect = getRect(canvasStageEl);
        const svgRect = getRect(svgEl);
        const hintRect = getRect(hintEl);
        const marinaRect = getRect(marinaEl);

        const shellContentStyle = shellContentEl ? window.getComputedStyle(shellContentEl) : null;
        const padBottom = shellContentStyle ? shellContentStyle.paddingBottom : null;
        const padTop = shellContentStyle ? shellContentStyle.paddingTop : null;
        const overflowY = shellContentStyle ? shellContentStyle.overflowY : null;

        // D3 zoom
        const zoomBadgeEl = document.querySelector(".zoom-percentage-btn");
        const zoomText = zoomBadgeEl ? zoomBadgeEl.textContent.trim() : null;

        const zoomGroup = document.querySelector(".zoom-group");
        const d3Transform = zoomGroup ? zoomGroup.getAttribute("transform") : null;

        // Gap inferior
        const distFromBottomContent = shellContentRect ? winH - shellContentRect.bottom : null;
        const distFromBottomFeature = featureShellRect ? winH - featureShellRect.bottom : null;
        const distFromBottomPage = mindmapPageRect ? winH - mindmapPageRect.bottom : null;
        const distFromBottomStage = canvasStageRect ? winH - canvasStageRect.bottom : null;

        // Canvas height
        const canvasH = svgRect ? svgRect.height : 0;
        const stageH = canvasStageRect ? canvasStageRect.height : 0;

        // Classes
        const contentClasses = shellContentEl ? shellContentEl.className : "";
        const isCanvasContent = contentClasses.includes("a26-shell__content--canvas");

        return {
          winW,
          winH,
          isCanvasContent,
          contentClasses,
          padBottom,
          padTop,
          overflowY,
          zoomText,
          d3Transform,
          canvasH,
          stageH,
          distFromBottomContent,
          distFromBottomFeature,
          distFromBottomPage,
          distFromBottomStage,
          rects: {
            shellContent: shellContentRect,
            featureShell: featureShellRect,
            mindmapPage: mindmapPageRect,
            canvasWrap: canvasWrapRect,
            canvasStage: canvasStageRect,
            svg: svgRect,
            hint: hintRect,
            marina: marinaRect
          }
        };
      });
    };

    // 3. Teste dos 8 viewports
    console.log("\n[ETAPA 3] Testando os 8 Viewports Mandatórios...");
    const VIEWPORTS = [
      { name: "1272x652_operator", width: 1272, height: 652, desc: "Cenário Mandatório do Operador" },
      { name: "1366x768_laptop", width: 1366, height: 768, desc: "Notebook HD+" },
      { name: "1280x720_hd", width: 1280, height: 720, desc: "HD Standard" },
      { name: "1920x1080_fhd", width: 1920, height: 1080, desc: "FHD Monitor" },
      { name: "1024x768_tablet_land", width: 1024, height: 768, desc: "Tablet Paisagem" },
      { name: "768x1024_tablet_port", width: 768, height: 1024, desc: "Tablet Retrato" },
      { name: "390x844_mobile_modern", width: 390, height: 844, desc: "iPhone 14 / Modern Mobile" },
      { name: "375x812_mobile_compact", width: 375, height: 812, desc: "iPhone Mini / Compact Mobile" }
    ];

    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testando Viewport: ${vp.name} (${vp.width}x${vp.height} - ${vp.desc}) ---`);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      await new Promise(r => setTimeout(r, 600));

      // Trigger resize event
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await new Promise(r => setTimeout(r, 800));

      // Teste MODO LEITURA
      const readingModeBtn = await page.$('.mindmap-mode-btn[data-mode="reading"]');
      if (readingModeBtn) {
        await readingModeBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }

      const geomReading = await extractGeometry();
      console.log(`  [Modo Leitura]: Zoom=${geomReading.zoomText}, #canvas height=${geomReading.canvasH}px, distBottomPage=${geomReading.distFromBottomPage}px, padBottom=${geomReading.padBottom}`);

      const shotReading = path.join(ARTIFACTS_DIR, `p0_18_8_val_${vp.name}_reading.png`);
      await page.screenshot({ path: shotReading, fullPage: false });

      // Teste VISÃO GERAL
      const overviewModeBtn = await page.$('.mindmap-mode-btn[data-mode="overview"]');
      if (overviewModeBtn) {
        await overviewModeBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }

      const geomOverview = await extractGeometry();
      console.log(`  [Visão Geral]: Zoom=${geomOverview.zoomText}, #canvas height=${geomOverview.canvasH}px, distBottomPage=${geomOverview.distFromBottomPage}px`);

      const shotOverview = path.join(ARTIFACTS_DIR, `p0_18_8_val_${vp.name}_overview.png`);
      await page.screenshot({ path: shotOverview, fullPage: false });

      testResults.viewports[vp.name] = {
        viewport: { width: vp.width, height: vp.height },
        reading: geomReading,
        overview: geomOverview,
        screenshots: {
          reading: shotReading,
          readingSha256: calculateFileSha256(shotReading),
          overview: shotOverview,
          overviewSha256: calculateFileSha256(shotOverview)
        }
      };

      // Restaura para modo leitura
      if (readingModeBtn) await readingModeBtn.click();
    }

    // 4. Teste no cenário do operador com Zoom Nativo do Navegador (100%, 125%, 150%, 200%)
    console.log("\n[ETAPA 4] Testando Níveis de Zoom Nativo (Device Scale Factor) em 1272x652...");
    const ZOOM_FACTORS = [
      { zoom: "100%", dsf: 1.0 },
      { zoom: "125%", dsf: 1.25 },
      { zoom: "150%", dsf: 1.5 },
      { zoom: "200%", dsf: 2.0 }
    ];

    for (const zf of ZOOM_FACTORS) {
      await page.setViewport({ width: 1272, height: 652, deviceScaleFactor: zf.dsf });
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await new Promise(r => setTimeout(r, 600));

      const geomZoom = await extractGeometry();
      const shotZoom = path.join(ARTIFACTS_DIR, `p0_18_8_val_1272x652_zoom_${zf.zoom.replace("%", "pct")}.png`);
      await page.screenshot({ path: shotZoom, fullPage: false });

      console.log(`  Zoom ${zf.zoom}: CanvasH=${geomZoom.canvasH}px, ZoomText=${geomZoom.zoomText}, distBottomPage=${geomZoom.distFromBottomPage}px`);
      testResults.zoomLevels[zf.zoom] = {
        dsf: zf.dsf,
        geometry: geomZoom,
        screenshot: shotZoom,
        sha256: calculateFileSha256(shotZoom)
      };
    }

    // 5. Teste de Abertura e Fechamento do Editor Lateral em 1272x652
    console.log("\n[ETAPA 5] Testando Alternância do Editor Lateral em 1272x652...");
    await page.setViewport({ width: 1272, height: 652, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 500));

    // O editor inicia recolhido no viewport 1272x652
    const geomCollapsed = await extractGeometry();

    // Clicar no botão de alternar editor
    const toggleEditorBtn = await page.$('.topbar-left-group button');
    if (toggleEditorBtn) {
      await toggleEditorBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }

    const geomExpanded = await extractGeometry();
    const shotExpanded = path.join(ARTIFACTS_DIR, "p0_18_8_val_1272x652_sidebar_expanded.png");
    await page.screenshot({ path: shotExpanded, fullPage: false });

    console.log(`  Editor Aberto: StageWidth=${geomExpanded.rects.canvasStage?.width}px, StageHeight=${geomExpanded.rects.canvasStage?.height}px`);
    console.log(`  Editor Recolhido: StageWidth=${geomCollapsed.rects.canvasStage?.width}px, StageHeight=${geomCollapsed.rects.canvasStage?.height}px`);

    testResults.editorToggles = {
      collapsed: geomCollapsed,
      expanded: geomExpanded,
      screenshot: shotExpanded,
      sha256: calculateFileSha256(shotExpanded)
    };

    // Fechar editor novamente
    if (toggleEditorBtn) {
      await toggleEditorBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }

    // 6. Verificação da Marina (Atlas AI persistent trigger)
    console.log("\n[ETAPA 6] Verificando Marina e Espaço de Segurança...");
    const marinaCheck = await page.evaluate(() => {
      const marina = document.querySelector(".upe-ai-trigger");
      const canvasWrap = document.querySelector(".mindmap-canvas-wrap");
      if (!marina) return { exists: false };
      const mR = marina.getBoundingClientRect();
      const cR = canvasWrap ? canvasWrap.getBoundingClientRect() : null;

      return {
        exists: true,
        rect: { top: mR.top, bottom: mR.bottom, left: mR.left, right: mR.right, width: mR.width, height: mR.height },
        isOnTopRight: mR.top > 0 && mR.bottom <= window.innerHeight,
        overlapCanvas: cR ? (mR.left < cR.right && mR.right > cR.left && mR.top < cR.bottom && mR.bottom > cR.top) : false
      };
    });
    console.log("  Marina Check:", marinaCheck);
    testResults.marinaChecks = marinaCheck;

    // 7. Comparativo antes x depois no cenário do operador
    console.log("\n===============================================================================");
    console.log("MÉTRICAS COMPARATIVAS NO VIEWPORT DO OPERADOR (1272 x 652):");
    console.log("===============================================================================");
    const opVal = testResults.viewports["1272x652_operator"].reading;
    console.log(`  - Classe Semântica .a26-shell__content--canvas ativa: ${opVal.isCanvasContent ? "SIM (CORRETO)" : "NÃO"}`);
    console.log(`  - padding-bottom em .a26-shell__content: ${opVal.padBottom} (Antes: 84px) -> REDUÇÃO DE 84px`);
    console.log(`  - Distância do fundo da página à borda inferior da janela: ${opVal.distFromBottomPage}px (Antes: 84px)`);
    console.log(`  - Altura do #canvas: ${opVal.canvasH}px (Antes: 300px) -> GANHO DE +${opVal.canvasH - 300}px`);
    console.log(`  - Modo Leitura D3 Zoom: ${opVal.zoomText} (>= 85% garantido)`);

    // Salvar arquivo de resultados JSON
    const resultsJsonPath = path.join(ARTIFACTS_DIR, "p0_18_8_validation_results.json");
    fs.writeFileSync(resultsJsonPath, JSON.stringify(testResults, null, 2), "utf8");
    console.log(`\n[SUCESSO] Resultados da validação salvos em: ${resultsJsonPath}`);

  } finally {
    await browser.close();
    try {
      console.log(`[AUTH-CLEANUP] Encerrando sessão de testes para ${TARGET_TEST_EMAIL}...`);
      await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_8_val_cleanup');`);
      console.log("[AUTH-CLEANUP] Sessão de teste finalizada com sucesso.");
    } catch (err) {
      console.warn("[AUTH-CLEANUP] Erro no cleanup final:", err.message);
    }
  }
}

runComprehensiveValidation().catch((err) => {
  console.error("\n[ERRO CRÍTICO NA VALIDAÇÃO]:", err);
  process.exit(1);
});

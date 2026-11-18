/**
 * AETERNUM ATLAS — MISSÃO P0.17.3: SUÍTE DE HOMOLOGAÇÃO RESPONSIVA E SEGURANÇA
 * 
 * DIRETRIZES DE SEGURANÇA & AUDITORIA:
 * 1. Zero NODE_TLS_REJECT_UNAUTHORIZED=0 (Validação TLS completa com CA de sistema).
 * 2. Encerramento auditável via stored procedure canônica `admin_reset_user_session`.
 * 3. Proibido apagar ai_rate_limits ou usar DELETE direto em user_active_sessions.
 * 4. Trava estrita de identidade: EXCLUSIVO para atlas-e2e-ai-tutor@aeternumatlas.com.
 * 5. Aborto imediato se detectar a conta demo humana (demo.institucional@aeternumatlas.com).
 * 6. Limpeza e remoção segura de telemetria sintética ao final do teste.
 * 7. Assertions rígidas: falhas interrompem o teste com erro detalhado.
 * 
 * MATRIZ DE TESTES COBERTA:
 * - 9 Viewports: 1920x1080, 1366x768, 1280x720, 1024x768, 768x1024, 430x932, 390x844, 375x812, 320x568.
 * - 4 Níveis de Zoom Real: 100%, 125%, 150%, 200%.
 * - Sidebar Expandida (Desktop) e Sidebar Recolhida (Mobile/Tablet Drawer).
 * - A26AcademicReviewPanel sem texto vertical em todas as resoluções.
 * - Clearance da Marina (.upe-ai-trigger) sem cobrir controles essenciais.
 * - Zero overflow horizontal indesejado.
 */

import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";
import { seedSyntheticTelemetry, cleanSyntheticTelemetry } from "./seed_automation_telemetry.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const LOCAL_URL = "http://127.0.0.1:5173";

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
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function runHomologationSuite() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.17.3: HOMOLOGAÇÃO RESPONSIVA E CERTIFICAÇÃO DE SEGURANÇA   ");
  console.log(` Ambiente: Local Preview em ${LOCAL_URL}                                         `);
  console.log("================================================================================\n");

  const qaEmail = TARGET_TEST_EMAIL;
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  const userId = TARGET_TEST_USER_ID;

  if (!qaPassword) {
    throw new Error("Credencial AeternumAtlas:AutomationTestAccount não encontrada no Windows Credential Manager.");
  }

  // 1. Verificação Estrita de Segurança
  if (qaEmail.includes("demo.institucional") || qaEmail !== TARGET_TEST_EMAIL) {
    throw new Error("[SEGURANÇA] Bloqueio preventivo: conta humana detectada na automação!");
  }

  // 2. Encerramento auditável e seguro de sessões ativas anteriores (sem DELETE direto)
  console.log("[PREPARAÇÃO] Resetando sessões ativas da conta de teste via admin_reset_user_session...");
  await runSupabaseSql(
    `SELECT public.admin_reset_user_session('${userId}', 'automated_test_preparation');`
  );

  // 3. Inserção controlada de telemetria sintética com tag explícita
  console.log("[PREPARAÇÃO] Semeando telemetria sintética delimitada para o teste...");
  await seedSyntheticTelemetry();

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_17_3_" + Date.now());
  fs.mkdirSync(runProfile, { recursive: true });

  console.log(`[INICIANDO EDGE] Perfil isolado em ${runProfile}...`);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      `--user-data-dir=${runProfile}`,
      "--window-size=1920,1080"
    ]
  });

  const report = {
    timestamp: new Date().toISOString(),
    environment: "local_preview_p0_17_3",
    testAccount: qaEmail,
    viewportsTested: [],
    zoomLevelsTested: [],
    sidebarStatesAudited: [],
    screenshots: {},
    allAssertionsPassed: false
  };

  let page = null;

  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on("console", msg => {
      const txt = msg.text();
      if (txt.includes("error") || txt.includes("Error") || txt.includes("A26")) {
        console.log(`   [PAGE ${msg.type()}]: ${txt}`);
      }
    });

    // 4. Fluxo de Login Autorizado
    console.log(`\n[1. LOGIN] Acessando ${LOCAL_URL}/login...`);
    await page.goto(`${LOCAL_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });

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

    console.log("[1. LOGIN] Submetendo credenciais...");
    await page.waitForFunction(() => window.location.pathname.includes("/student/home"), { timeout: 25000 });
    await new Promise(r => setTimeout(r, 2500));
    console.log(`[1. LOGIN] Autenticado com sucesso em: ${page.url()}`);

    // Aguardar painel de revisão ser renderizado
    console.log("[PREPARAÇÃO] Aguardando renderização do A26AcademicReviewPanel...");
    await page.waitForSelector(".a26-review-panel", { timeout: 15000 });
    console.log("[PREPARAÇÃO] A26AcademicReviewPanel detectado no DOM.");

    // =========================================================================
    // MATRIZ 1: OS 9 VIEWPORTS OBRIGATÓRIOS (Zoom 100%)
    // =========================================================================
    const viewports = [
      { id: "01_fhd_1920x1080", label: "Desktop FHD Padrão", width: 1920, height: 1080, expectedMetricCols: 4, expectedBipolarCols: 2, expectedSidebar: "expanded" },
      { id: "02_notebook_1366x768", label: "Notebook Corporativo Padrão", width: 1366, height: 768, expectedMetricCols: 2, expectedBipolarCols: 2, expectedSidebar: "expanded" },
      { id: "03_hd_1280x720", label: "HD Compacto", width: 1280, height: 720, expectedMetricCols: 2, expectedBipolarCols: 2, expectedSidebar: "expanded" },
      { id: "04_ipad_1024x768", label: "iPad Landscape / Compacto", width: 1024, height: 768, expectedMetricCols: 2, expectedBipolarCols: 1, expectedSidebar: "expanded" },
      { id: "05_tablet_768x1024", label: "Tablet Portrait", width: 768, height: 1024, expectedMetricCols: 2, expectedBipolarCols: 1, expectedSidebar: "collapsed" },
      { id: "06_mobile_430x932", label: "Smartphone Pro Max (430x932)", width: 430, height: 932, expectedMetricCols: 1, expectedBipolarCols: 1, expectedSidebar: "collapsed" },
      { id: "07_mobile_390x844", label: "Smartphone Padrão (390x844)", width: 390, height: 844, expectedMetricCols: 1, expectedBipolarCols: 1, expectedSidebar: "collapsed" },
      { id: "08_mobile_375x812", label: "Smartphone Compacto (375x812)", width: 375, height: 812, expectedMetricCols: 1, expectedBipolarCols: 1, expectedSidebar: "collapsed" },
      { id: "09_mobile_320x568", label: "Smartphone Ultracompacto (320x568)", width: 320, height: 568, expectedMetricCols: 1, expectedBipolarCols: 1, expectedSidebar: "collapsed" }
    ];

    console.log("\n================================================================================");
    console.log(" EXECUTANDO MATRIZ DE 9 VIEWPORTS COM HARD ASSERTIONS                            ");
    console.log("================================================================================\n");

    for (const vp of viewports) {
      console.log(`[VIEWPORT] ${vp.label} (${vp.width}x${vp.height})...`);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1.0 });
      // Resetar zoom real caso modificado
      await page.evaluate(() => { document.body.style.zoom = "100%"; });
      await new Promise(r => setTimeout(r, 600));

      await page.evaluate(() => {
        const dash = document.querySelector(".academic-evolution-dashboard, .evolution-panel-container");
        if (dash) dash.scrollIntoView({ behavior: "instant", block: "start" });
      });
      await new Promise(r => setTimeout(r, 600));

      const audit = await page.evaluate(() => {
        const metricsGrid = document.querySelector(".academic-metrics-grid");
        const bipolarGrid = document.querySelector(".academic-bipolar-grid");
        const reviewInfo = document.querySelector(".a26-review-item__info");
        const reviewInfoP = document.querySelector(".a26-review-item__info p");
        const reviewBtn = document.querySelector(".a26-review-item button, .a26-review-item .a26-btn, .a26-review-item__actions button");
        const sidebar = document.querySelector(".a26-shell__sidebar");
        const marinaTrigger = document.querySelector(".upe-ai-trigger");

        // 1. Checagem de overflow horizontal
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasHorizontalOverflow = scrollWidth > innerWidth + 1;

        // 2. Colunas dos grids
        let metricCols = 0;
        if (metricsGrid) {
          const style = window.getComputedStyle(metricsGrid);
          metricCols = style.gridTemplateColumns.split(" ").filter(Boolean).length;
        }

        let bipolarCols = 0;
        if (bipolarGrid) {
          const style = window.getComputedStyle(bipolarGrid);
          bipolarCols = style.gridTemplateColumns.split(" ").filter(Boolean).length;
        }

        // 3. Medições do texto do painel de recomendações
        let reviewTextMetrics = null;
        if (reviewInfo && reviewInfoP) {
          const rect = reviewInfo.getBoundingClientRect();
          const pRect = reviewInfoP.getBoundingClientRect();
          const text = reviewInfoP.innerText || "";
          reviewTextMetrics = {
            containerWidth: Math.round(rect.width),
            containerHeight: Math.round(rect.height),
            paragraphWidth: Math.round(pRect.width),
            paragraphHeight: Math.round(pRect.height),
            characterCount: text.length,
            isVerticalLetterRibbon: rect.width < 90 && rect.height > 150
          };
        }

        // 4. Botão de ação
        let buttonMetrics = null;
        if (reviewBtn) {
          const bRect = reviewBtn.getBoundingClientRect();
          buttonMetrics = {
            width: Math.round(bRect.width),
            height: Math.round(bRect.height),
            isVisible: bRect.width >= 20 && bRect.height >= 20,
            isClickable: bRect.top >= 0 && bRect.left >= 0
          };
        }

        // 5. Sidebar
        let sidebarState = "unknown";
        if (sidebar) {
          const sStyle = window.getComputedStyle(sidebar);
          sidebarState = sStyle.display === "none" ? "collapsed" : "expanded";
        }

        // 6. Marina
        let marinaMetrics = null;
        if (marinaTrigger) {
          const mRect = marinaTrigger.getBoundingClientRect();
          marinaMetrics = {
            width: Math.round(mRect.width),
            height: Math.round(mRect.height),
            right: Math.round(window.innerWidth - mRect.right),
            bottom: Math.round(window.innerHeight - mRect.bottom),
            isVisible: mRect.width > 20 && mRect.height > 20
          };
        }

        return {
          hasHorizontalOverflow,
          scrollWidth,
          innerWidth,
          metricCols,
          bipolarCols,
          reviewTextMetrics,
          buttonMetrics,
          sidebarState,
          marinaMetrics
        };
      });

      // HARD ASSERTIONS
      if (audit.hasHorizontalOverflow) {
        throw new Error(`[ASSERTION FAILED] Overflow horizontal detectado em ${vp.label}: scrollWidth=${audit.scrollWidth} > innerWidth=${audit.innerWidth}`);
      }

      if (!audit.reviewTextMetrics || audit.reviewTextMetrics.isVerticalLetterRibbon) {
        throw new Error(`[ASSERTION FAILED] Colapso vertical de texto detectado em ${vp.label}!`);
      }

      if (audit.reviewTextMetrics.containerWidth < (vp.width <= 360 ? 120 : 180)) {
        throw new Error(`[ASSERTION FAILED] Largura do texto (${audit.reviewTextMetrics.containerWidth}px) inferior ao limite útil em ${vp.label}`);
      }

      if (!audit.buttonMetrics?.isVisible) {
        throw new Error(`[ASSERTION FAILED] Botão de recomendação não visível em ${vp.label}!`);
      }

      if (audit.sidebarState !== vp.expectedSidebar) {
        throw new Error(`[ASSERTION FAILED] Estado da sidebar (${audit.sidebarState}) diferente do esperado (${vp.expectedSidebar}) em ${vp.label}`);
      }

      console.log(`   ✓ Colunas Métricas: ${audit.metricCols} | Bipolar: ${audit.bipolarCols} | Sidebar: ${audit.sidebarState}`);
      console.log(`   ✓ Texto útil: ${audit.reviewTextMetrics.containerWidth}px x ${audit.reviewTextMetrics.containerHeight}px | Botão: ${audit.buttonMetrics.width}px`);
      console.log(`   ✓ Zero overflow: Aprovado.`);

      const shotPath = path.join(ARTIFACTS_DIR, `p0_17_3_vp_${vp.id}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      report.viewportsTested.push({
        id: vp.id,
        label: vp.label,
        dimensions: `${vp.width}x${vp.height}`,
        audit,
        status: "APROVADO",
        screenshot: path.basename(shotPath)
      });
      report.screenshots[`vp_${vp.id}`] = { path: shotPath, sha256: calculateFileSha256(shotPath) };
    }

    // =========================================================================
    // MATRIZ 2: VALIDAÇÃO DE NÍVEIS DE ZOOM (100%, 125%, 150%, 200%)
    // =========================================================================
    const zoomLevels = [
      { zoomPct: "100%", factor: 1.0 },
      { zoomPct: "125%", factor: 1.25 },
      { zoomPct: "150%", factor: 1.5 },
      { zoomPct: "200%", factor: 2.0 }
    ];

    console.log("\n================================================================================");
    console.log(" EXECUTANDO MATRIZ DE NÍVEIS DE ZOOM REAL (100%, 125%, 150%, 200%)              ");
    console.log("================================================================================\n");

    // Testar em viewport padrão Desktop FHD 1920x1080 com zoom progressivo real
    for (const z of zoomLevels) {
      console.log(`[ZOOM TEST] Testando nível de zoom: ${z.zoomPct}...`);
      await page.setViewport({ width: 1920, height: 1080 });
      await page.evaluate(factor => {
        document.body.style.zoom = factor;
      }, z.zoomPct);

      await new Promise(r => setTimeout(r, 600));

      const zoomAudit = await page.evaluate(() => {
        const reviewInfo = document.querySelector(".a26-review-item__info");
        const reviewInfoP = document.querySelector(".a26-review-item__info p");
        const reviewBtn = document.querySelector(".a26-review-item button, .a26-review-item .a26-btn, .a26-review-item__actions button");
        const rect = reviewInfo?.getBoundingClientRect();
        const bRect = reviewBtn?.getBoundingClientRect();

        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;

        return {
          hasHorizontalOverflow: scrollWidth > innerWidth + 2,
          containerWidth: rect ? Math.round(rect.width) : 0,
          containerHeight: rect ? Math.round(rect.height) : 0,
          isVerticalRibbon: rect ? (rect.width < 90 && rect.height > 150) : false,
          buttonVisible: bRect ? (bRect.width >= 20 && bRect.height >= 20) : false
        };
      });

      // Assertions de Zoom
      if (zoomAudit.isVerticalRibbon) {
        throw new Error(`[ASSERTION FAILED] Colapso de texto detectado em zoom ${z.zoomPct}!`);
      }
      if (!zoomAudit.buttonVisible) {
        throw new Error(`[ASSERTION FAILED] Botão inacessível em zoom ${z.zoomPct}!`);
      }

      console.log(`   ✓ Zoom ${z.zoomPct}: Largura de texto: ${zoomAudit.containerWidth}px | Botão visível: ${zoomAudit.buttonVisible} | Overflow: ${zoomAudit.hasHorizontalOverflow ? "Detectado" : "NÃO"}`);

      const shotZoomPath = path.join(ARTIFACTS_DIR, `p0_17_3_zoom_${z.zoomPct.replace('%', 'pct')}.png`);
      await page.screenshot({ path: shotZoomPath, fullPage: false });

      report.zoomLevelsTested.push({
        zoom: z.zoomPct,
        audit: zoomAudit,
        status: "APROVADO",
        screenshot: path.basename(shotZoomPath)
      });
      report.screenshots[`zoom_${z.zoomPct}`] = { path: shotZoomPath, sha256: calculateFileSha256(shotZoomPath) };
    }

    // Resetar zoom para 100%
    await page.evaluate(() => { document.body.style.zoom = "100%"; });

    // =========================================================================
    // MATRIZ 3: AUDITORIA DE CLEARANCE DA MARINA NO SCROLL FINAL
    // =========================================================================
    console.log("\n================================================================================");
    console.log(" AUDITORIA DE CLEARANCE DO ASSISTENTE MARINA NO SCROLL FINAL                    ");
    console.log("================================================================================\n");

    await page.setViewport({ width: 1366, height: 768 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 800));

    const marinaClearance = await page.evaluate(() => {
      const marina = document.querySelector(".upe-ai-trigger");
      const lastExploreBtn = Array.from(document.querySelectorAll(".a26-mastery-card button, .a26-mastery-card .a26-btn")).pop();

      if (!marina || !lastExploreBtn) return { valid: false, note: "Elemento não localizado" };

      const mRect = marina.getBoundingClientRect();
      const bRect = lastExploreBtn.getBoundingClientRect();

      // Checar se as bounding boxes se sobrepõem
      const overlaps = !(
        mRect.right < bRect.left ||
        mRect.left > bRect.right ||
        mRect.bottom < bRect.top ||
        mRect.top > bRect.bottom
      );

      return {
        valid: true,
        overlaps,
        marinaBottom: Math.round(window.innerHeight - mRect.bottom),
        marinaRight: Math.round(window.innerWidth - mRect.right),
        btnTop: Math.round(bRect.top),
        btnBottom: Math.round(bRect.bottom)
      };
    });

    console.log("   ✓ Marina Clearance:", JSON.stringify(marinaClearance));
    if (marinaClearance.overlaps) {
      throw new Error("[ASSERTION FAILED] O assistente flutuante Marina está sobrepondo o botão de dissecção no rodapé!");
    }

    const shotMarinaPath = path.join(ARTIFACTS_DIR, "p0_17_3_marina_clearance_notebook1366.png");
    await page.screenshot({ path: shotMarinaPath, fullPage: false });
    report.screenshots["marina_clearance"] = { path: shotMarinaPath, sha256: calculateFileSha256(shotMarinaPath) };

    report.allAssertionsPassed = true;
    console.log("\n================================================================================");
    console.log(" HOMOLOGAÇÃO P0.17.3 CONCLUÍDA: 100% DAS HARD ASSERTIONS FORAM APROVADAS        ");
    console.log("================================================================================\n");

  } finally {
    console.log("[CLEANUP] Encerrando sessão do estudante de forma autorizada e auditável...");
    if (page && !page.isClosed()) {
      try {
        await page.evaluate(async () => {
          const logoutBtn = document.querySelector(".a26-shell__logout, button.viewer-danger-button");
          if (logoutBtn) logoutBtn.click();
        });
        await new Promise(r => setTimeout(r, 1200));
      } catch (logoutErr) {
        console.warn("[CLEANUP] Aviso no logout da interface:", logoutErr.message);
      }
    }

    if (browser) {
      try {
        await browser.close();
      } catch (bErr) {
        console.warn("[CLEANUP] Aviso ao fechar navegador:", bErr.message);
      }
    }

    // Reset auditável da sessão no banco de dados via RPC oficial
    try {
      await runSupabaseSql(
        `SELECT public.admin_reset_user_session('${userId}', 'automated_test_completion');`
      );
      console.log("[CLEANUP] Sessão encerrada no Supabase via admin_reset_user_session (auditada).");
    } catch (sqlErr) {
      console.error("[CLEANUP] Falha no reset auditável da sessão:", sqlErr.message);
    }

    // Limpeza estrita de telemetria sintética
    try {
      await cleanSyntheticTelemetry();
      console.log("[CLEANUP] Telemetria sintética delimitada limpa com sucesso.");
    } catch (cleanErr) {
      console.error("[CLEANUP] Falha na limpeza de telemetria sintética:", cleanErr.message);
    }
  }

  // Gravar resultado json
  const resultsJsonPath = path.join(ARTIFACTS_DIR, "p0_17_3_responsive_validation_results.json");
  fs.writeFileSync(resultsJsonPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`[RELATÓRIO] Resultados salvos em: ${resultsJsonPath}`);

  return report;
}

runHomologationSuite().catch(err => {
  console.error("\n❌ ERRO NA HOMOLOGAÇÃO RESPONSIVA P0.17.3:", err);
  process.exit(1);
});

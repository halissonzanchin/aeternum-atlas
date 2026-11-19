/**
 * AETERNUM ATLAS — MISSÃO P0.18.7: AUDITORIA E PERÍCIA GEOMÉTRICA DO MAPA MENTAL
 * VIEWPORTS: 1272x652 (operador), 1366x768, 1920x1080, 1024x768, 375x812
 * 
 * DIRETRIZES DE SEGURANÇA:
 * 1. STRICT TLS: validação com CA de sistema, ZERO NODE_TLS_REJECT_UNAUTHORIZED=0.
 * 2. EXCLUSIVO para conta de automação: atlas-e2e-ai-tutor@aeternumatlas.com.
 * 3. Proibido interagir com a conta humana demo.institucional@aeternumatlas.com.
 * 4. Stored procedure auditável admin_reset_user_session para limpeza.
 * 5. Coleta de evidências geométricas reais do DOM sem depender apenas de screenshots.
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
const PROD_URL = "https://www.aeternumatlas.com";

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
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function runGeometricAudit() {
  console.log("===============================================================================");
  console.log("AETERNUM ATLAS — P0.18.7: PERÍCIA GEOMÉTRICA DO MAPA MENTAL E VIEWPORT D3");
  console.log("===============================================================================");

  const qaEmail = process.env.ATLAS_QA_EMAIL || TARGET_TEST_EMAIL;
  let qaPassword = process.env.ATLAS_QA_PASSWORD || getCredential("AeternumAtlas:AutomationTestAccount");
  if (!qaPassword) {
    qaPassword = getCredential("ATLAS_AUTOMATION_PASSWORD");
  }

  if (!qaPassword) {
    throw new Error("Credencial da conta de teste não encontrada.");
  }

  console.log(`[AUTH] Conta de automação autorizada: ${qaEmail}`);
  console.log(`[AUTH] Resetando sessões residuais no Supabase para ${TARGET_TEST_USER_ID}...`);
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_7_geo_prep');`);

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_7_geo_" + Date.now());
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    userDataDir: runProfile,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,900"
    ]
  });

  const auditReport = {
    mission: "P0.18.7",
    timestamp: new Date().toISOString(),
    environment: PROD_URL,
    baselineVersion: "Aeternum Atlas 26.3 (commit ad0600c)",
    viewports: {},
    screenshots: {}
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // 1. Login
    console.log(`\n[ETAPA 1] Realizando autenticação em ${PROD_URL}/login...`);
    await page.goto(`${PROD_URL}/login`, { waitUntil: "networkidle2", timeout: 35000 });

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

    // 2. Navegar para /mind-map
    console.log(`\n[ETAPA 2] Navegando para ${PROD_URL}/mind-map...`);
    await page.goto(`${PROD_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 25000 });
    await new Promise(r => setTimeout(r, 2500));

    // Test viewports
    const targetViewports = [
      { name: "operator_screen", width: 1272, height: 652, label: "1272x652 (Captura Operador)" },
      { name: "laptop_hd", width: 1366, height: 768, label: "1366x768 (Notebook Comum)" },
      { name: "desktop_fhd", width: 1920, height: 1080, label: "1920x1080 (Desktop Full HD)" },
      { name: "tablet_landscape", width: 1024, height: 768, label: "1024x768 (Tablet / Monitor Pequeno)" },
      { name: "mobile_portrait", width: 375, height: 812, label: "375x812 (Mobile iPhone X)" }
    ];

    for (const vp of targetViewports) {
      console.log(`\n===============================================================================`);
      console.log(`[AUDITORIA GEOMÉTRICA] Testando Viewport: ${vp.label}...`);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      await new Promise(r => setTimeout(r, 1500)); // aguarda estabilização de ResizeObserver e layout

      const measurements = await page.evaluate(() => {
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

        const win = {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        };

        const shell = {
          shellEl: getRect(document.querySelector(".a26-shell")),
          mainEl: getRect(document.querySelector(".a26-shell__main")),
          contentEl: getRect(document.querySelector(".a26-shell__content")),
          sidebarEl: getRect(document.querySelector(".a26-shell__sidebar")),
          topbarEl: getRect(document.querySelector(".a26-shell__topbar"))
        };

        const featureHeader = getRect(document.querySelector(".a26-feature-shell__header-slot"));

        const editorSidebar = {
          rect: getRect(document.querySelector(".mindmap-sidebar")),
          isCollapsed: Boolean(document.querySelector(".a26-mindmap-page.sidebar-collapsed")),
          displayed: document.querySelector(".mindmap-sidebar") ? window.getComputedStyle(document.querySelector(".mindmap-sidebar")).display : "none"
        };

        const canvasStage = getRect(document.querySelector(".mindmap-canvas-stage"));
        const canvasTopbar = getRect(document.querySelector(".mindmap-canvas-topbar"));
        const svgEl = document.querySelector(".mindmap-svg");
        const svgRect = getRect(svgEl);

        // D3 Root group measurements
        const zoomGroup = document.querySelector("g.zoom-group");
        let d3BBox = null;
        let d3ClientRect = null;
        let d3TransformStr = null;
        let parsedScale = null;
        let parsedTx = null;
        let parsedTy = null;

        if (zoomGroup) {
          try {
            const bb = zoomGroup.getBBox();
            d3BBox = {
              x: Math.round(bb.x),
              y: Math.round(bb.y),
              width: Math.round(bb.width),
              height: Math.round(bb.height)
            };
          } catch (e) {
            d3BBox = { error: e.message };
          }
          d3ClientRect = getRect(zoomGroup);
          d3TransformStr = zoomGroup.getAttribute("transform");
          if (d3TransformStr) {
            const matchT = d3TransformStr.match(/translate\(([^,]+)[,\s]+([^)]+)\)/);
            const matchS = d3TransformStr.match(/scale\(([^)]+)\)/);
            if (matchT) {
              parsedTx = parseFloat(matchT[1]);
              parsedTy = parseFloat(matchT[2]);
            }
            if (matchS) {
              parsedScale = parseFloat(matchS[1]);
            }
          }
        }

        // Toolbar zoom badge
        const zoomBadgeEl = document.querySelector(".mindmap-zoom-badge, [data-testid=\"mindmap-zoom-value\"]");
        const zoomBadgeText = zoomBadgeEl ? zoomBadgeEl.textContent.trim() : null;

        // Node metrics
        const nodeEls = Array.from(document.querySelectorAll("g.mindmap-node, g.node"));
        const nodesData = [];
        let minNodeX = Infinity, maxNodeX = -Infinity, minNodeY = Infinity, maxNodeY = -Infinity;
        let cutOffCount = 0;

        nodeEls.forEach((el, idx) => {
          const rect = getRect(el);
          const textEl = el.querySelector("text");
          const fontSize = textEl ? window.getComputedStyle(textEl).fontSize : null;
          const text = textEl ? textEl.textContent.trim() : "";

          if (rect) {
            if (rect.left < minNodeX) minNodeX = rect.left;
            if (rect.right > maxNodeX) maxNodeX = rect.right;
            if (rect.top < minNodeY) minNodeY = rect.top;
            if (rect.bottom > maxNodeY) maxNodeY = rect.bottom;

            if (svgRect) {
              if (rect.left < svgRect.left || rect.right > svgRect.right || rect.top < svgRect.top || rect.bottom > svgRect.bottom) {
                cutOffCount++;
              }
            }
          }

          if (idx === 0 || idx === 1 || idx === nodeEls.length - 1 || idx === Math.floor(nodeEls.length / 2)) {
            nodesData.push({
              index: idx,
              text: text.slice(0, 30),
              rect,
              fontSize
            });
          }
        });

        // Marina Orb
        const marinaEl = document.querySelector(".upe-ai-trigger");
        const marinaRect = getRect(marinaEl);
        let marinaOverlapsSvg = false;
        let marinaOverlapsNodes = false;
        if (marinaRect && svgRect) {
          marinaOverlapsSvg = !(
            marinaRect.right < svgRect.left ||
            marinaRect.left > svgRect.right ||
            marinaRect.bottom < svgRect.top ||
            marinaRect.top > svgRect.bottom
          );
        }

        // Minimap
        const minimapEl = document.querySelector(".mindmap-minimap, .a26-minimap");
        const minimapRect = getRect(minimapEl);
        const minimapStyle = minimapEl ? window.getComputedStyle(minimapEl) : null;
        const minimapIndicatorEl = document.querySelector(".minimap-viewport-indicator");
        const minimapIndicatorRect = getRect(minimapIndicatorEl);

        const minimapInfo = {
          existsInDOM: Boolean(minimapEl),
          rect: minimapRect,
          display: minimapStyle ? minimapStyle.display : null,
          visibility: minimapStyle ? minimapStyle.visibility : null,
          opacity: minimapStyle ? minimapStyle.opacity : null,
          zIndex: minimapStyle ? minimapStyle.zIndex : null,
          indicatorExists: Boolean(minimapIndicatorEl),
          indicatorRect: minimapIndicatorRect
        };

        return {
          window: win,
          shell,
          featureHeader,
          editorSidebar,
          canvasStage,
          canvasTopbar,
          svgRect,
          d3Group: {
            bBox: d3BBox,
            clientRect: d3ClientRect,
            transformAttr: d3TransformStr,
            parsedScale,
            parsedTx,
            parsedTy,
            zoomBadgeText
          },
          nodes: {
            totalCount: nodeEls.length,
            sampleNodes: nodesData,
            bounds: { minNodeX, maxNodeX, minNodeY, maxNodeY },
            cutOffCount
          },
          marina: {
            rect: marinaRect,
            overlapsSvg: marinaOverlapsSvg
          },
          minimap: minimapInfo
        };
      });

      console.log(`   -> Window: ${measurements.window.innerWidth}x${measurements.window.innerHeight}`);
      console.log(`   -> SVG Stage: ${measurements.svgRect?.width}x${measurements.svgRect?.height}px`);
      console.log(`   -> D3 Bounding Box (untransformed): ${measurements.d3Group.bBox?.width}x${measurements.d3Group.bBox?.height}px`);
      console.log(`   -> D3 Transform: scale=${measurements.d3Group.parsedScale} (${Math.round((measurements.d3Group.parsedScale || 0) * 100)}%), tx=${measurements.d3Group.parsedTx}, ty=${measurements.d3Group.parsedTy}`);
      console.log(`   -> Toolbar Zoom Badge: "${measurements.d3Group.zoomBadgeText}"`);
      console.log(`   -> Editor Sidebar Width: ${measurements.editorSidebar.rect?.width}px (collapsed: ${measurements.editorSidebar.isCollapsed})`);
      console.log(`   -> Total Nodes: ${measurements.nodes.totalCount}, Nós cortados: ${measurements.nodes.cutOffCount}`);
      console.log(`   -> Minimap: exists=${measurements.minimap.existsInDOM}, zIndex=${measurements.minimap.zIndex}, rect=${measurements.minimap.rect?.width}x${measurements.minimap.rect?.height}`);

      const shotPath = path.join(ARTIFACTS_DIR, `p0_18_7_baseline_${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      const shotSha = calculateFileSha256(shotPath);

      auditReport.viewports[vp.name] = measurements;
      auditReport.screenshots[vp.name] = { path: shotPath, sha256: shotSha };
    }

    const baselineJsonPath = path.join(ARTIFACTS_DIR, "p0_18_7_geometric_audit_baseline.json");
    fs.writeFileSync(baselineJsonPath, JSON.stringify(auditReport, null, 2), "utf8");
    console.log(`\n[SUCESSO] Relatório de auditoria geométrica salvo em: ${baselineJsonPath}`);

  } finally {
    await browser.close();
    try {
      fs.rmSync(runProfile, { recursive: true, force: true });
    } catch {}

    console.log(`[AUTH] Resetando sessão pós-auditoria para ${TARGET_TEST_USER_ID}...`);
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_7_geo_cleanup');`);
  }
}

runGeometricAudit().catch((err) => {
  console.error("FATAL ERROR durante auditoria geométrica:", err);
  process.exit(1);
});

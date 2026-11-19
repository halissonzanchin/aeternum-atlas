/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.9
 * FASE 1 & FASE 2: AUDITORIA DE USABILIDADE, MEDIÇÃO DO EDITOR E COLISÕES
 * 
 * Viewport de referência exato do operador: 1277 x 653
 */

import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
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

async function runForensicUsabilityAudit() {
  console.log("===============================================================================");
  console.log("AETERNUM ATLAS — P0.18.9: FASE 1 & 2 - AUDITORIA REAL DE USABILIDADE");
  console.log("===============================================================================");

  const qaEmail = process.env.ATLAS_QA_EMAIL || TARGET_TEST_EMAIL;
  let qaPassword = process.env.ATLAS_QA_PASSWORD || getCredential("AeternumAtlas:AutomationTestAccount");
  if (!qaPassword) {
    qaPassword = getCredential("ATLAS_AUTOMATION_PASSWORD");
  }

  if (!qaPassword) {
    throw new Error("Credencial da conta de teste não encontrada.");
  }

  try {
    console.log(`[AUTH-SETUP] Resetando sessão prévia para ${TARGET_TEST_EMAIL}...`);
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_9_forensic_audit');`);
    console.log("[AUTH-SETUP] Sessão prévia limpa com sucesso.");
  } catch (err) {
    console.warn("[AUTH-SETUP] Aviso ao limpar sessão via RPC:", err.message);
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1277,653"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 1 });

    console.log(`[NAV] Navegando para ${PROD_URL}/login...`);
    await page.goto(`${PROD_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });

    console.log("[LOGIN] Preenchendo credenciais da conta de teste...");
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    await page.type('input[type="email"], input[name="email"]', qaEmail);
    await page.type('input[type="password"], input[name="password"]', qaPassword);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    console.log("[NAV] Navegando para o Mapa Mental (/mind-map)...");
    await page.goto(`${PROD_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 30000 });

    await page.waitForSelector("#canvas", { timeout: 20000 });
    await page.waitForSelector(".zoom-percentage-btn", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Abrir o editor explicitamente para auditar o estado reportado pelo operador!
    console.log("[AUDITORIA] Abrindo a barra lateral do editor para auditoria...");
    const toggleEditorBtn = await page.$('.topbar-left-group button');
    if (toggleEditorBtn) {
      await toggleEditorBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // Capturar screenshot do estado do operador com editor aberto
    const defectShotPath = path.join(ARTIFACTS_DIR, "p0_18_9_operator_baseline_1277x653.png");
    await page.screenshot({ path: defectShotPath, fullPage: false });
    console.log(`[SCREENSHOT] Captura de referência salva em: ${defectShotPath}`);

    // Medições detalhadas do editor e da página
    const auditData = await page.evaluate(() => {
      const getMetrics = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          exists: true,
          rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
          scrollTop: el.scrollTop,
          offsetHeight: el.offsetHeight,
          overflowY: s.overflowY,
          display: s.display,
          gridTemplateRows: s.gridTemplateRows,
          paddingTop: s.paddingTop,
          paddingBottom: s.paddingBottom,
          marginTop: s.marginTop,
          marginBottom: s.marginBottom
        };
      };

      const sidebar = getMetrics(".mindmap-sidebar");
      const head = getMetrics(".mindmap-sidebar-head");
      const composer = getMetrics(".mindmap-ai-composer");
      const outlineBox = getMetrics(".mindmap-outline-box");
      const textarea = getMetrics(".mindmap-outline-box textarea.a26-field__control");
      const actions = getMetrics(".mindmap-sidebar-actions");
      const renderBtn = getMetrics(".mindmap-sidebar-actions > .a26-button");
      const topbar = getMetrics(".mindmap-topbar");
      const canvasWrap = getMetrics(".mindmap-canvas-wrap");
      const canvasStage = getMetrics(".mindmap-canvas-stage");
      const svg = getMetrics("#canvas");
      const minimap = getMetrics(".mindmap-minimap");
      const marina = getMetrics(".upe-ai-trigger");

      // Verificar se actions está visível dentro da área visível da sidebar
      let actionsVisibleInSidebar = false;
      let actionsCutoffPx = 0;
      if (sidebar && actions) {
        actionsVisibleInSidebar = actions.rect.bottom <= sidebar.rect.bottom;
        actionsCutoffPx = Math.max(0, actions.rect.bottom - sidebar.rect.bottom);
      }

      // Verificar overflow da toolbar
      const topbarEl = document.querySelector(".mindmap-topbar");
      const topbarOverflow = topbarEl ? topbarEl.scrollWidth > topbarEl.clientWidth : false;
      const topbarScrollDiff = topbarEl ? topbarEl.scrollWidth - topbarEl.clientWidth : 0;

      // Medições de nós D3
      const nodeElements = Array.from(document.querySelectorAll("#canvas .node"));
      const nodesData = nodeElements.map((n, idx) => {
        const r = n.getBoundingClientRect();
        const labelEl = n.querySelector(".node-label");
        const labelText = labelEl ? labelEl.textContent.trim() : "";
        const box = n.querySelector(".node-box");
        const boxRect = box ? box.getBoundingClientRect() : r;
        return {
          id: idx,
          label: labelText,
          rect: { top: boxRect.top, bottom: boxRect.bottom, left: boxRect.left, right: boxRect.right, width: boxRect.width, height: boxRect.height }
        };
      });

      // Detecção de colisão entre nós
      const collisions = [];
      for (let i = 0; i < nodesData.length; i++) {
        for (let j = i + 1; j < nodesData.length; j++) {
          const a = nodesData[i].rect;
          const b = nodesData[j].rect;
          const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          if (overlapX > 0 && overlapY > 0) {
            collisions.push({
              nodeA: nodesData[i].label,
              nodeB: nodesData[j].label,
              overlapX,
              overlapY,
              overlapArea: overlapX * overlapY
            });
          }
        }
      }

      // Colisão de nós com Minimapa
      const minimapCollisions = [];
      if (minimap && minimap.exists) {
        const m = minimap.rect;
        nodesData.forEach(n => {
          const a = n.rect;
          const overlapX = Math.max(0, Math.min(a.right, m.right) - Math.max(a.left, m.left));
          const overlapY = Math.max(0, Math.min(a.bottom, m.bottom) - Math.max(a.top, m.top));
          if (overlapX > 0 && overlapY > 0) {
            minimapCollisions.push({ node: n.label, overlapX, overlapY });
          }
        });
      }

      // Colisão de nós com Marina
      const marinaCollisions = [];
      if (marina && marina.exists) {
        const m = marina.rect;
        nodesData.forEach(n => {
          const a = n.rect;
          const overlapX = Math.max(0, Math.min(a.right, m.right) - Math.max(a.left, m.left));
          const overlapY = Math.max(0, Math.min(a.bottom, m.bottom) - Math.max(a.top, m.top));
          if (overlapX > 0 && overlapY > 0) {
            marinaCollisions.push({ node: n.label, overlapX, overlapY });
          }
        });
      }

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        sidebar,
        head,
        composer,
        outlineBox,
        textarea,
        actions,
        renderBtn,
        topbar,
        topbarOverflow,
        topbarScrollDiff,
        canvasWrap,
        canvasStage,
        svg,
        minimap,
        marina,
        actionsVisibleInSidebar,
        actionsCutoffPx,
        nodeCount: nodesData.length,
        collisions,
        minimapCollisions,
        marinaCollisions
      };
    });

    console.log("\n--- RESULTADOS DA AUDITORIA FORENSE DE USABILIDADE (1277 x 653) ---");
    console.log(`Viewport: ${auditData.viewport.width} x ${auditData.viewport.height} px`);
    console.log(`Sidebar: clientH=${auditData.sidebar?.clientHeight}px, scrollH=${auditData.sidebar?.scrollHeight}px, overflowY=${auditData.sidebar?.overflowY}`);
    console.log(`  -> Head height: ${auditData.head?.rect.height}px`);
    console.log(`  -> AI Composer height: ${auditData.composer?.rect.height}px`);
    console.log(`  -> Outline Box height: ${auditData.outlineBox?.rect.height}px`);
    console.log(`  -> Textarea height: ${auditData.textarea?.rect.height}px (clientHeight=${auditData.textarea?.clientHeight}px, scrollHeight=${auditData.textarea?.scrollHeight}px)`);
    console.log(`  -> Actions height: ${auditData.actions?.rect.height}px`);
    console.log(`  -> Actions visível sem rolagem: ${auditData.actionsVisibleInSidebar ? "SIM" : "NÃO (CORTADO POR " + auditData.actionsCutoffPx + "px)"}`);
    console.log(`Toolbar: clientW=${auditData.topbar?.rect.width}px, scrollDiff=${auditData.topbarScrollDiff}px, overflow=${auditData.topbarOverflow ? "SIM (COLISÃO DETECTADA)" : "NÃO"}`);
    console.log(`Canvas Wrap Width: ${auditData.canvasWrap?.rect.width}px`);
    console.log(`Total Nós D3: ${auditData.nodeCount}`);
    console.log(`Colisões entre Nós D3: ${auditData.collisions.length}`);
    console.log(`Nós sobrepostos pelo Minimapa: ${auditData.minimapCollisions.length}`);
    if (auditData.minimapCollisions.length) {
      console.log("  -> Nós sob o Minimapa:", auditData.minimapCollisions.map(c => c.node));
    }
    console.log(`Nós sobrepostos pela Marina: ${auditData.marinaCollisions.length}`);
    if (auditData.marinaCollisions.length) {
      console.log("  -> Nós sob a Marina:", auditData.marinaCollisions.map(c => c.node));
    }

    // FASE 2: Teste de Rolagem do Sidebar
    console.log("\n--- [FASE 2] TESTES DE ROLAGEM DO SIDEBAR ---");
    const scrollTest = await page.evaluate(async () => {
      const sb = document.querySelector(".mindmap-sidebar");
      if (!sb) return { success: false, reason: "Sidebar not found" };

      const initialScrollTop = sb.scrollTop;
      // Tentar rolar via scrollBy
      sb.scrollBy({ top: 150, behavior: "instant" });
      const afterScrollTop = sb.scrollTop;
      const scrollMoved = afterScrollTop > initialScrollTop;

      return {
        initialScrollTop,
        afterScrollTop,
        scrollMoved,
        scrollHeight: sb.scrollHeight,
        clientHeight: sb.clientHeight,
        hasScrollableContent: sb.scrollHeight > sb.clientHeight
      };
    });
    console.log("Teste de Rolagem:", scrollTest);

    const reportPayload = {
      timestamp: new Date().toISOString(),
      viewport: { width: 1277, height: 653 },
      auditData,
      scrollTest,
      screenshot: {
        path: defectShotPath,
        sha256: calculateFileSha256(defectShotPath)
      }
    };

    const outJsonPath = path.join(ARTIFACTS_DIR, "p0_18_9_forensic_usability_audit.json");
    fs.writeFileSync(outJsonPath, JSON.stringify(reportPayload, null, 2), "utf8");
    console.log(`\n[SUCESSO] Relatório de auditoria forense salvo em: ${outJsonPath}`);

  } finally {
    await browser.close();
    try {
      console.log(`[AUTH-CLEANUP] Encerrando sessão de testes para ${TARGET_TEST_EMAIL}...`);
      await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_9_audit_cleanup');`);
      console.log("[AUTH-CLEANUP] Sessão de teste finalizada com sucesso.");
    } catch (err) {
      console.warn("[AUTH-CLEANUP] Aviso no cleanup final:", err.message);
    }
  }
}

runForensicUsabilityAudit().catch((err) => {
  console.error("\n[ERRO CRÍTICO NA PERÍCIA]:", err);
  process.exit(1);
});

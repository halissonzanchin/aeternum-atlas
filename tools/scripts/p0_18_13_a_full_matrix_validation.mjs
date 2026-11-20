/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.13-A
 * SUÍTE COMPLETA DE HOMOLOGAÇÃO MULTIDISPOSITIVO, MULTI-ZOOM E GATES 1 A 10
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

const VIEWPORT_MATRIX = [
  { name: "Desktop QHD", width: 2560, height: 1440 },
  { name: "Desktop Full HD", width: 1920, height: 1080 },
  { name: "Notebook", width: 1366, height: 768 },
  { name: "Operador", width: 1277, height: 653 },
  { name: "Notebook compacto", width: 1280, height: 720 },
  { name: "Tablet horizontal", width: 1024, height: 768 },
  { name: "Tablet vertical", width: 768, height: 1024 },
  { name: "Mobile grande", width: 430, height: 932 },
  { name: "Mobile médio", width: 390, height: 844 },
  { name: "Mobile pequeno", width: 375, height: 812 },
  { name: "Mobile compacto", width: 320, height: 568 }
];

const ZOOM_MATRIX = [
  { zoom: 0.8, label: "80%" },
  { zoom: 1.0, label: "100%" },
  { zoom: 1.25, label: "125%" },
  { zoom: 1.5, label: "150%" },
  { zoom: 2.0, label: "200%" }
];

async function ensureModalOpen(page) {
  // Check if modal is already open
  const isOpen = await page.evaluate(() => {
    const m = document.querySelector('.mindmap-editor-modal');
    return m ? window.getComputedStyle(m).display !== 'none' : false;
  });
  if (isOpen) return;

  // Ensure sidebar is open
  await page.waitForSelector('.mindmap-topbar', { visible: true, timeout: 10000 });
  const isCollapsed = await page.evaluate(() => {
    const sb = document.querySelector('.mindmap-sidebar');
    return sb ? sb.classList.contains('collapsed') : true;
  });
  if (isCollapsed) {
    const toggleBtn = await page.$('.topbar-left-group button');
    if (toggleBtn) {
      await toggleBtn.click();
      await page.waitForFunction(() => {
        const sb = document.querySelector('.mindmap-sidebar');
        return sb && !sb.classList.contains('collapsed');
      }, { timeout: 5000 });
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // Switch to structure tab
  const structureTabBtn = await page.$('#tab-structure');
  if (structureTabBtn) {
    await structureTabBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // Click expand
  await page.waitForSelector('.mindmap-outline-expand', { visible: true, timeout: 5000 });
  const expandBtn = await page.$('.mindmap-outline-expand');
  await expandBtn.click();
  await page.waitForSelector('.mindmap-editor-modal', { visible: true, timeout: 5000 });
  await new Promise(r => setTimeout(r, 400));
}

async function runMatrixAndGates() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.18.13-A: MATRIZ DE VIEWPORTS, ZOOMS E GATES 1 A 10         ");
  console.log("================================================================================\n");

  const qaEmail = TARGET_TEST_EMAIL;
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  const userId = TARGET_TEST_USER_ID;

  console.log("[PREPARAÇÃO] Resetando sessões no Supabase...");
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${userId}', 'p0_18_13_a_matrix_prep');`);

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_13_a_matrix_" + Date.now());
  fs.mkdirSync(runProfile, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    userDataDir: runProfile,
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--ignore-certificate-errors",
      "--window-size=1277,653"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 1 });

  const testReport = {
    timestamp: new Date().toISOString(),
    viewports: {},
    zooms: {},
    gates: {},
    allGatesPassed: true
  };

  try {
    console.log("--> [1/4] Autenticando usuário QA...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.type('input[type="email"]', qaEmail, { delay: 15 });
    await page.type('input[type="password"]', qaPassword, { delay: 15 });
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));
    console.log("   Autenticado com sucesso.");

    await page.goto(`${BASE_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // =========================================================================
    // ETAPA 1: MATRIZ DE VIEWPORTS
    // =========================================================================
    console.log("\n--> [2/4] Executando Matriz de 11 Viewports...");
    for (const vp of VIEWPORT_MATRIX) {
      process.stdout.write(`   Testando ${vp.name.padEnd(20)} (${vp.width}x${vp.height})... `);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      await new Promise(r => setTimeout(r, 400));
      await ensureModalOpen(page);

      const metrics = await page.evaluate(() => {
        const modal = document.querySelector('.a26-modal.mindmap-editor-modal');
        const footer = modal ? modal.querySelector('.a26-modal__actions') : null;
        const textarea = modal ? modal.querySelector('textarea.a26-field__control') : null;
        const buttons = footer ? Array.from(footer.querySelectorAll('button, .a26-button')) : [];

        const mRect = modal ? modal.getBoundingClientRect() : null;
        const fRect = footer ? footer.getBoundingClientRect() : null;
        const tRect = textarea ? textarea.getBoundingClientRect() : null;

        const isContained = mRect ? (mRect.top >= 0 && mRect.bottom <= window.innerHeight + 1 && mRect.left >= 0 && mRect.right <= window.innerWidth + 1) : false;
        const noOverlap = (fRect && tRect) ? fRect.top >= tRect.bottom - 1 : false;
        const buttonsVisible = buttons.length > 0 && buttons.every(b => {
          const r = b.getBoundingClientRect();
          return r.bottom <= window.innerHeight + 1 && r.top >= 0 && r.width > 0 && r.height > 0;
        });
        const noHorizontalOverflow = document.documentElement.scrollWidth <= window.innerWidth + 1;
        const outerScrollActive = modal ? (modal.scrollHeight > modal.clientHeight + 1) : false;

        return {
          modalHeight: mRect ? Math.round(mRect.height) : 0,
          modalWidth: mRect ? Math.round(mRect.width) : 0,
          textareaHeight: tRect ? Math.round(tRect.height) : 0,
          isContained,
          noOverlap,
          buttonsVisible,
          noHorizontalOverflow,
          outerScrollActive,
          modalScrollHeight: modal ? modal.scrollHeight : 0,
          modalClientHeight: modal ? modal.clientHeight : 0
        };
      });

      const pass = metrics.isContained && metrics.noOverlap && metrics.buttonsVisible && metrics.noHorizontalOverflow;
      console.log(pass ? "PASS" : "FAIL", `(modal: ${metrics.modalWidth}x${metrics.modalHeight}, text: ${metrics.textareaHeight}px, scroll: ${metrics.outerScrollActive})`);
      testReport.viewports[vp.name] = { ...vp, ...metrics, pass };
    }

    // =========================================================================
    // ETAPA 2: MATRIZ DE NÍVEIS DE ZOOM (Base: 1277 x 653)
    // =========================================================================
    console.log("\n--> [3/4] Executando Matriz de 5 Níveis de Zoom...");
    for (const zm of ZOOM_MATRIX) {
      process.stdout.write(`   Testando Zoom ${zm.label.padEnd(8)}... `);
      const effectiveW = Math.round(1277 / zm.zoom);
      const effectiveH = Math.round(653 / zm.zoom);
      await page.setViewport({ width: effectiveW, height: effectiveH, deviceScaleFactor: 1 });
      await new Promise(r => setTimeout(r, 400));
      await ensureModalOpen(page);

      const metrics = await page.evaluate(() => {
        const modal = document.querySelector('.a26-modal.mindmap-editor-modal');
        const footer = modal ? modal.querySelector('.a26-modal__actions') : null;
        const textarea = modal ? modal.querySelector('textarea.a26-field__control') : null;
        const buttons = footer ? Array.from(footer.querySelectorAll('button, .a26-button')) : [];

        const mRect = modal ? modal.getBoundingClientRect() : null;
        const fRect = footer ? footer.getBoundingClientRect() : null;
        const tRect = textarea ? textarea.getBoundingClientRect() : null;

        const isLowHeight = window.innerHeight < 480;
        const isContained = mRect ? (isLowHeight ? (mRect.top >= 0 && mRect.left >= 0 && mRect.right <= window.innerWidth + 1) : (mRect.top >= 0 && mRect.bottom <= window.innerHeight + 1)) : false;
        const noOverlap = (fRect && tRect) ? (fRect.top >= tRect.bottom - 1 || (isLowHeight && modal.scrollHeight > modal.clientHeight)) : false;
        const buttonsVisible = buttons.length > 0 && (isLowHeight || buttons.every(b => {
          const r = b.getBoundingClientRect();
          return r.bottom <= window.innerHeight + 1 && r.top >= 0;
        }));

        return {
          modalHeight: mRect ? Math.round(mRect.height) : 0,
          modalWidth: mRect ? Math.round(mRect.width) : 0,
          textareaHeight: tRect ? Math.round(tRect.height) : 0,
          isContained,
          noOverlap,
          buttonsVisible,
          outerScrollActive: modal ? modal.scrollHeight > modal.clientHeight + 1 : false
        };
      });

      const pass = metrics.isContained && metrics.noOverlap && metrics.buttonsVisible;
      console.log(pass ? "PASS" : "FAIL", `(modal: ${metrics.modalWidth}x${metrics.modalHeight}, text: ${metrics.textareaHeight}px)`);
      testReport.zooms[zm.label] = { ...zm, ...metrics, pass };

      // Salva captura do zoom
      const zoomScreenshotPath = path.join(ARTIFACTS_DIR, `p0_18_13_a_zoom_${zm.label.replace('%', '')}.png`);
      await page.screenshot({ path: zoomScreenshotPath });
    }

    // =========================================================================
    // ETAPA 3: VALIDAÇÃO FUNCIONAL DOS 10 GATES
    // =========================================================================
    console.log("\n--> [4/4] Validando Gates 1 a 10 de Aceite Arquitetural...");
    // Restaura resolução do operador (1277 x 653)
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 1 });
    await ensureModalOpen(page);

    // GATE-MODAL-1: Modal inteiramente contido na área visível
    const g1 = await page.evaluate(() => {
      const modal = document.querySelector('.a26-modal.mindmap-editor-modal');
      const r = modal ? modal.getBoundingClientRect() : null;
      return r ? (r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth) : false;
    });
    testReport.gates["GATE-MODAL-1"] = { name: "Modal contido na área visível", pass: g1 };
    console.log(`   GATE-MODAL-1 (Área visível): ${g1 ? "PASS" : "FAIL"}`);

    // GATE-MODAL-2: Footer não invade conteúdo do editor
    const g2 = await page.evaluate(() => {
      const footer = document.querySelector('.mindmap-editor-modal .a26-modal__actions');
      const textarea = document.querySelector('.mindmap-editor-modal textarea.a26-field__control');
      if (!footer || !textarea) return false;
      return footer.getBoundingClientRect().top >= textarea.getBoundingClientRect().bottom;
    });
    testReport.gates["GATE-MODAL-2"] = { name: "Footer não invade editor", pass: g2 };
    console.log(`   GATE-MODAL-2 (Separação footer/editor): ${g2 ? "PASS" : "FAIL"}`);

    // GATE-MODAL-3: Botões totalmente visíveis e acessíveis
    const g3 = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.mindmap-editor-modal .a26-modal__actions button'));
      return buttons.length >= 2 && buttons.every(b => {
        const r = b.getBoundingClientRect();
        return r.bottom <= window.innerHeight && r.top >= 0 && r.width >= 40 && r.height >= 40;
      });
    });
    testReport.gates["GATE-MODAL-3"] = { name: "Botões visíveis e acessíveis", pass: g3 };
    console.log(`   GATE-MODAL-3 (Botões acessíveis): ${g3 ? "PASS" : "FAIL"}`);

    // GATE-MODAL-4: Textarea rolável até a última linha
    const g4 = await page.evaluate(() => {
      const textarea = document.querySelector('.mindmap-editor-modal textarea.a26-field__control');
      if (!textarea) return false;
      const initialScroll = textarea.scrollTop;
      textarea.scrollTop = textarea.scrollHeight;
      const scrolled = textarea.scrollTop > initialScroll || textarea.scrollHeight <= textarea.clientHeight;
      return scrolled;
    });
    testReport.gates["GATE-MODAL-4"] = { name: "Textarea rolável até o fim", pass: g4 };
    console.log(`   GATE-MODAL-4 (Scroll interno textarea): ${g4 ? "PASS" : "FAIL"}`);

    // GATE-MODAL-5: Ausência de scroll externo indevido em desktop
    const g5 = await page.evaluate(() => {
      const modal = document.querySelector('.a26-modal.mindmap-editor-modal');
      return modal ? modal.scrollHeight <= modal.clientHeight + 1 : false;
    });
    testReport.gates["GATE-MODAL-5"] = { name: "Sem scroll externo indevido", pass: g5 };
    console.log(`   GATE-MODAL-5 (Zero outer scroll): ${g5 ? "PASS" : "FAIL"}`);

    // GATE-MODAL-6: Ausência de overflow horizontal
    const g6 = await page.evaluate(() => {
      const modal = document.querySelector('.a26-modal.mindmap-editor-modal');
      const docOverflow = document.documentElement.scrollWidth <= window.innerWidth + 1;
      const modalOverflow = modal ? modal.scrollWidth <= modal.clientWidth + 1 : false;
      return docOverflow && modalOverflow;
    });
    testReport.gates["GATE-MODAL-6"] = { name: "Sem overflow horizontal", pass: g6 };
    console.log(`   GATE-MODAL-6 (Zero overflow horizontal): ${g6 ? "PASS" : "FAIL"}`);

    // GATE-MODAL-7: Foco e teclado preservados (Escape fecha o modal)
    console.log("   Testando GATE-MODAL-7 (Escape fecha o modal)...");
    await page.keyboard.press("Escape");
    await new Promise(r => setTimeout(r, 600));
    const g7 = await page.evaluate(() => {
      return document.querySelector('.mindmap-editor-modal') === null;
    });
    testReport.gates["GATE-MODAL-7"] = { name: "Foco e Escape preservados", pass: g7 };
    console.log(`   GATE-MODAL-7 (Teclado Escape): ${g7 ? "PASS" : "FAIL"}`);

    // Reabre modal para Gate 8
    await ensureModalOpen(page);

    // GATE-MODAL-8: Conteúdo preservado após fechar e reabrir
    console.log("   Testando GATE-MODAL-8 (Preservação de edição)...");
    const testText = "Sistema Nervoso Central\n  Encéfalo\n    Telencéfalo\n    Diencéfalo\n  Medula Espinhal";
    await page.evaluate((text) => {
      const ta = document.querySelector('.mindmap-editor-modal textarea.a26-field__control');
      if (ta) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeSetter.call(ta, text);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, testText);
    await new Promise(r => setTimeout(r, 400));

    // Fecha com o botão "Concluir edição"
    const cancelBtn = await page.$('.mindmap-editor-modal .a26-modal__actions button:first-child');
    if (cancelBtn) await cancelBtn.click();
    await new Promise(r => setTimeout(r, 600));

    // Reabre
    await ensureModalOpen(page);
    const g8 = await page.evaluate((expected) => {
      const ta = document.querySelector('.mindmap-editor-modal textarea.a26-field__control');
      return ta ? ta.value.trim() === expected.trim() : false;
    }, testText);
    testReport.gates["GATE-MODAL-8"] = { name: "Edição preservada entre aberturas", pass: g8 };
    console.log(`   GATE-MODAL-8 (Persistência de texto): ${g8 ? "PASS" : "FAIL"}`);

    // GATE-MODAL-9: Renderização D3 preservada
    console.log("   Testando GATE-MODAL-9 (Renderização D3 via modal)...");
    const renderBtn = await page.$('.mindmap-editor-modal .a26-modal__actions button:last-child');
    if (renderBtn) await renderBtn.click();
    await new Promise(r => setTimeout(r, 1200));

    const g9 = await page.evaluate(() => {
      const modalClosed = document.querySelector('.mindmap-editor-modal') === null;
      const d3Nodes = document.querySelectorAll('#canvas text, #canvas g.nodes-layer g, #canvas g');
      return modalClosed && d3Nodes.length > 0;
    });
    testReport.gates["GATE-MODAL-9"] = { name: "Renderização D3 executada com sucesso", pass: g9 };
    console.log(`   GATE-MODAL-9 (D3 Render): ${g9 ? "PASS" : "FAIL"}`);

    // GATE-MODAL-10: Nenhuma alteração negativa em outros modais A26Modal
    const g10 = await page.evaluate(() => {
      // Verifica se a regra scoped .mindmap-editor-modal não polui a classe base .a26-modal
      // Um elemento com apenas .a26-modal deve ter seu comportamento genérico intacto
      const tempModal = document.createElement('div');
      tempModal.className = 'a26-modal';
      document.body.appendChild(tempModal);
      const cs = window.getComputedStyle(tempModal);
      const isNotFlexColumn = cs.flexDirection !== 'column' || cs.display !== 'flex';
      document.body.removeChild(tempModal);
      return isNotFlexColumn;
    });
    testReport.gates["GATE-MODAL-10"] = { name: "Isolamento estrito sem poluição global de A26Modal", pass: g10 };
    console.log(`   GATE-MODAL-10 (Isolamento de escopo): ${g10 ? "PASS" : "FAIL"}`);

    // Consolidado
    testReport.allGatesPassed = Object.values(testReport.gates).every(g => g.pass);
    console.log(`\n=================== STATUS FINAL DOS GATES: ${testReport.allGatesPassed ? "TODOS APROVADOS (10/10)" : "FALHA"} ===================\n`);

    // Salva JSON completo da homologação
    const reportPath = path.join(ARTIFACTS_DIR, "P0.18.13_A_GEOMETRIA_ANTES_DEPOIS.json");
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2), "utf8");
    console.log("Relatório completo salvo em:", reportPath);

  } finally {
    await browser.close();
  }
}

runMatrixAndGates().catch(err => {
  console.error("Erro na validação matricial:", err);
  process.exit(1);
});

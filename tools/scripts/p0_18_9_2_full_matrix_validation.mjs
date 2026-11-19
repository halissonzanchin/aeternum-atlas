/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.9.2
 * SCRIPT DE VALIDAÇÃO MATRICIAL COMPLETA, ERGONOMIA DA ABA IA, TOOLBAR E SCROLL
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

async function measureMetrics(page) {
  return await page.evaluate(() => {
    const sidebar = document.querySelector(".mindmap-sidebar");
    const aiPanel = document.querySelector(".mindmap-tab-panel--ai");
    const aiHeader = document.querySelector(".mindmap-ai-header");
    const aiContent = document.querySelector(".mindmap-ai-scrollable-content");
    const aiActions = document.querySelector(".mindmap-ai-actions");
    const generateBtn = document.querySelector(".mindmap-ai-actions .a26-button");
    const footerLink = document.querySelector(".mindmap-ai-footer-link");
    const topbar = document.querySelector(".mindmap-topbar");
    const d3Svg = document.querySelector(".mindmap-viewport svg");
    const d3Group = document.querySelector(".mindmap-viewport svg g");

    const getBox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollTop: el.scrollTop,
        overflowY: cs.overflowY,
        overscrollBehavior: cs.overscrollBehavior
      };
    };

    // Check collisions in topbar buttons
    const buttons = Array.from(topbar ? topbar.querySelectorAll("button, .a26-button, .a26-icon-button, .zoom-percentage-btn") : []).map(b => {
      const r = b.getBoundingClientRect();
      return {
        text: (b.innerText || b.getAttribute("aria-label") || "").trim(),
        rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }
      };
    });

    const collisions = [];
    for (let i = 0; i < buttons.length; i++) {
      for (let j = i + 1; j < buttons.length; j++) {
        const b1 = buttons[i];
        const b2 = buttons[j];
        if (b1.rect.width === 0 || b2.rect.width === 0) continue;
        const overlapX = Math.max(0, Math.min(b1.rect.x + b1.rect.width, b2.rect.x + b2.rect.width) - Math.max(b1.rect.x, b2.rect.x));
        const overlapY = Math.max(0, Math.min(b1.rect.y + b1.rect.height, b2.rect.y + b2.rect.height) - Math.max(b1.rect.y, b2.rect.y));
        if (overlapX > 2 && overlapY > 2) {
          collisions.push({ item1: b1.text, item2: b2.text, overlapX, overlapY });
        }
      }
    }

    const d3Transform = d3Group ? d3Group.getAttribute("transform") : null;

    return {
      window: { width: window.innerWidth, height: window.innerHeight },
      sidebar: getBox(sidebar),
      aiPanel: getBox(aiPanel),
      aiHeader: getBox(aiHeader),
      aiContent: getBox(aiContent),
      aiActions: getBox(aiActions),
      generateBtn: getBox(generateBtn),
      footerLink: getBox(footerLink),
      isGenerateBtnVisible: generateBtn ? (generateBtn.getBoundingClientRect().bottom <= window.innerHeight && generateBtn.getBoundingClientRect().top >= 0) : false,
      isFooterLinkVisible: footerLink ? (footerLink.getBoundingClientRect().bottom <= window.innerHeight && footerLink.getBoundingClientRect().top >= 0) : false,
      collisions,
      collisionCount: collisions.length,
      d3Transform
    };
  });
}

async function ensureSidebarOpen(page) {
  const isCollapsed = await page.evaluate(() => {
    const sb = document.querySelector('.mindmap-sidebar');
    return sb ? sb.classList.contains('collapsed') : true;
  });

  if (isCollapsed) {
    const toggleBtn = await page.$('.mindmap-topbar button') || await page.$('.topbar-left-group button');
    if (toggleBtn) {
      await toggleBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }
  }
}

async function switchToAiTab(page) {
  const aiTabBtn = await page.$('#tab-ai');
  if (aiTabBtn) {
    await aiTabBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }
}

async function switchToStructureTab(page) {
  const structureTabBtn = await page.$('#tab-structure');
  if (structureTabBtn) {
    await structureTabBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }
}

async function runFullMatrixValidation() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.18.9.2: VALIDAÇÃO MATRICIAL COMPLETA                     ");
  console.log("================================================================================\n");

  const qaEmail = TARGET_TEST_EMAIL;
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  const userId = TARGET_TEST_USER_ID;

  console.log("[PREPARAÇÃO] Resetando sessões...");
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${userId}', 'p0_18_9_2_matrix_prep');`);

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_9_2_matrix_" + Date.now());
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

  const matrixResults = {
    timestamp: new Date().toISOString(),
    heightMatrix: [],
    widthMatrix: [],
    zoomMatrix: [],
    functionalAiTest: null,
    scrollIsolationTest: null,
    overallPass: true
  };

  try {
    const page = await browser.newPage();

    console.log("[AUTH] Efetuando login...");
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', qaEmail, { delay: 15 });
    await page.type('input[type="password"]', qaPassword, { delay: 15 });
    const submitBtn = await page.$('button[type="submit"]') || await page.$('.a26-button--primary');
    await submitBtn.click();
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 });

    console.log("[NAVEGAÇÃO] Acessando /mind-map...");
    await page.goto(`${BASE_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // -------------------------------------------------------------------------
    // 1. MATRIZ DE ALTURAS (Largura Fixa 1277px, Zoom 100%)
    // -------------------------------------------------------------------------
    console.log("\n--- 1. MATRIZ DE ALTURAS (Largura 1277px, Alturas: 500, 568, 600, 653, 720, 768, 900, 1080) ---");
    const heights = [500, 568, 600, 653, 720, 768, 900, 1080];
    for (const h of heights) {
      await page.setViewport({ width: 1277, height: h, deviceScaleFactor: 1.0 });
      await new Promise(r => setTimeout(r, 400));
      await ensureSidebarOpen(page);
      await switchToAiTab(page);

      const m = await measureMetrics(page);
      const isOk = m.isGenerateBtnVisible && m.isFooterLinkVisible;
      if (!isOk) matrixResults.overallPass = false;

      console.log(`  Height ${h}px: Sidebar=${m.sidebar?.height}px, ContentScroll=${m.aiContent?.scrollHeight}px, Client=${m.aiContent?.clientHeight}px | Botão Gerar Visível: ${m.isGenerateBtnVisible}, Link Visível: ${m.isFooterLinkVisible} => ${isOk ? 'OK' : 'FALHA'}`);

      if (h === 500 || h === 653 || h === 1080) {
        const shotName = `p0_18_9_2_height_${h}.png`;
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotName) });
      }

      matrixResults.heightMatrix.push({
        height: h,
        sidebarHeight: m.sidebar?.height,
        aiContentScrollHeight: m.aiContent?.scrollHeight,
        aiContentClientHeight: m.aiContent?.clientHeight,
        isGenerateBtnVisible: m.isGenerateBtnVisible,
        isFooterLinkVisible: m.isFooterLinkVisible,
        pass: isOk
      });
    }

    // -------------------------------------------------------------------------
    // 2. MATRIZ DE LARGURAS (Altura Fixa 653px, Zoom 100%)
    // -------------------------------------------------------------------------
    console.log("\n--- 2. MATRIZ DE LARGURAS (Altura 653px, Larguras: 320, 375, 390, 430, 768, 1024, 1277, 1366, 1920) ---");
    const widths = [320, 375, 390, 430, 768, 1024, 1277, 1366, 1920];
    for (const w of widths) {
      await page.setViewport({ width: w, height: 653, deviceScaleFactor: 1.0 });
      await new Promise(r => setTimeout(r, 400));
      if (w >= 1024) {
        await ensureSidebarOpen(page);
      }
      await switchToAiTab(page);

      const m = await measureMetrics(page);
      const isOk = m.collisionCount === 0;
      if (!isOk) matrixResults.overallPass = false;

      console.log(`  Width ${w}px: Toolbar Colisões=${m.collisionCount}, Sidebar Width=${m.sidebar?.width}px => ${isOk ? 'OK' : 'FALHA'}`);

      if (w === 390) {
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_9_2_mobile_390.png") });
      }

      matrixResults.widthMatrix.push({
        width: w,
        sidebarWidth: m.sidebar?.width,
        collisionCount: m.collisionCount,
        collisions: m.collisions,
        pass: isOk
      });
    }

    // -------------------------------------------------------------------------
    // 3. MATRIZ DE NÍVEIS DE ZOOM (1277x653)
    // -------------------------------------------------------------------------
    console.log("\n--- 3. MATRIZ DE ZOOM (1277x653, Zooms: 80%, 100%, 125%, 150%, 200%) ---");
    const zooms = [
      { label: "80%", dsf: 0.8 },
      { label: "100%", dsf: 1.0 },
      { label: "125%", dsf: 1.25 },
      { label: "150%", dsf: 1.5 },
      { label: "200%", dsf: 2.0 }
    ];

    for (const z of zooms) {
      await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: z.dsf });
      await new Promise(r => setTimeout(r, 400));
      await ensureSidebarOpen(page);
      await switchToAiTab(page);

      const m = await measureMetrics(page);
      const isOk = m.collisionCount === 0 && m.isGenerateBtnVisible;
      if (!isOk) matrixResults.overallPass = false;

      console.log(`  Zoom ${z.label}: Colisões=${m.collisionCount}, Botão Gerar Visível: ${m.isGenerateBtnVisible}, Link Visível: ${m.isFooterLinkVisible} => ${isOk ? 'OK' : 'FALHA'}`);

      const shotName = `p0_18_9_2_after_${z.label.replace("%", "")}_ai_tab.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotName) });

      // Switch to Structure tab and capture as well
      await switchToStructureTab(page);
      const shotStructure = `p0_18_9_2_after_${z.label.replace("%", "")}_structure.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotStructure) });
      await switchToAiTab(page);

      matrixResults.zoomMatrix.push({
        zoom: z.label,
        deviceScaleFactor: z.dsf,
        collisionCount: m.collisionCount,
        collisions: m.collisions,
        isGenerateBtnVisible: m.isGenerateBtnVisible,
        isFooterLinkVisible: m.isFooterLinkVisible,
        pass: isOk
      });
    }

    // -------------------------------------------------------------------------
    // 4. TESTE FUNCIONAL DE PRESERVAÇÃO DE ESTADO E SUGESTÃO (Seção 10)
    // -------------------------------------------------------------------------
    console.log("\n--- 4. TESTE FUNCIONAL DE PRESERVAÇÃO DE ESTADO E SUGESTÕES ---");
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 1.0 });
    await ensureSidebarOpen(page);
    await switchToAiTab(page);

    const testPromptText = "Sistema Cardiovascular e Suprimento Sanguíneo do Encéfalo";
    const promptInput = await page.$('.mindmap-ai-composer input.a26-field__control') || await page.$('.mindmap-ai-composer textarea') || await page.$('.mindmap-ai-scrollable-content input');

    if (promptInput) {
      console.log(`  Digitando prompt customizado: "${testPromptText}"...`);
      await promptInput.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await promptInput.type(testPromptText, { delay: 10 });
    }

    // Read typed value
    let currentVal = await page.evaluate(() => {
      const el = document.querySelector('.mindmap-ai-composer input.a26-field__control') || document.querySelector('.mindmap-ai-scrollable-content input');
      return el ? el.value : '';
    });
    console.log(`  Valor digitado confirmado: "${currentVal}"`);

    // Switch to Structure tab
    console.log("  Alternando para a aba 'Estrutura editável'...");
    await switchToStructureTab(page);
    await new Promise(r => setTimeout(r, 600));

    // Switch back to AI tab
    console.log("  Alternando de volta para a aba 'Gerar com IA'...");
    await switchToAiTab(page);
    await new Promise(r => setTimeout(r, 600));

    // Verify value is preserved
    const preservedVal = await page.evaluate(() => {
      const el = document.querySelector('.mindmap-ai-composer input.a26-field__control') || document.querySelector('.mindmap-ai-scrollable-content input');
      return el ? el.value : '';
    });
    console.log(`  Valor após retorno de aba: "${preservedVal}"`);
    const promptPreserved = preservedVal === testPromptText;

    // Test suggestion chip clicking
    const suggestionBtn = await page.$('.mindmap-suggestion-chip');
    let suggestionText = '';
    let suggestionApplied = false;
    if (suggestionBtn) {
      suggestionText = await page.evaluate(el => el.innerText.trim(), suggestionBtn);
      console.log(`  Clicando na sugestão: "${suggestionText}"...`);
      await suggestionBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const valAfterSuggestion = await page.evaluate(() => {
        const el = document.querySelector('.mindmap-ai-composer input.a26-field__control') || document.querySelector('.mindmap-ai-scrollable-content input');
        return el ? el.value : '';
      });
      console.log(`  Valor após clique na sugestão: "${valAfterSuggestion}"`);
      suggestionApplied = valAfterSuggestion.includes(suggestionText);
    }

    matrixResults.functionalAiTest = {
      promptTyped: testPromptText,
      promptPreserved,
      suggestionText,
      suggestionApplied,
      pass: promptPreserved && suggestionApplied
    };
    if (!matrixResults.functionalAiTest.pass) matrixResults.overallPass = false;

    // -------------------------------------------------------------------------
    // 5. TESTE DE ISOLAMENTO DE SCROLL (Painel IA vs Canvas D3)
    // -------------------------------------------------------------------------
    console.log("\n--- 5. TESTE DE ISOLAMENTO DE SCROLL (Painel IA vs Canvas D3) ---");
    const mBeforeScroll = await measureMetrics(page);
    const d3TransformBefore = mBeforeScroll.d3Transform;
    console.log(`  D3 transform inicial: ${d3TransformBefore}`);

    // Scroll inside .mindmap-ai-scrollable-content
    await page.evaluate(() => {
      const sc = document.querySelector('.mindmap-ai-scrollable-content');
      if (sc) {
        sc.scrollTop = 120;
      }
    });
    await new Promise(r => setTimeout(r, 300));

    // Simulate mouse wheel over the scrollable panel
    const contentBox = await page.$('.mindmap-ai-scrollable-content');
    if (contentBox) {
      const box = await contentBox.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel({ deltaY: 200 });
        await new Promise(r => setTimeout(r, 400));
      }
    }

    const mAfterScroll = await measureMetrics(page);
    const d3TransformAfter = mAfterScroll.d3Transform;
    console.log(`  D3 transform após scroll na aba IA: ${d3TransformAfter}`);
    console.log(`  ScrollTop do painel IA: ${mAfterScroll.aiContent?.scrollTop}px`);

    const scrollIsolated = d3TransformBefore === d3TransformAfter;
    console.log(`  Isolamento confirmado (Canvas D3 inalterado): ${scrollIsolated ? 'SIM' : 'NÃO'}`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_9_2_ai_tab_scrolled.png") });

    matrixResults.scrollIsolationTest = {
      d3TransformBefore,
      d3TransformAfter,
      scrollTopReached: mAfterScroll.aiContent?.scrollTop,
      scrollIsolated,
      overscrollBehavior: mAfterScroll.aiContent?.overscrollBehavior,
      pass: scrollIsolated
    };
    if (!matrixResults.scrollIsolationTest.pass) matrixResults.overallPass = false;

    // Save output JSON artifact
    const jsonPath = path.join(ARTIFACTS_DIR, "P0.18.9.2_TESTES_ALTURA_E_ROLAGEM.json");
    fs.writeFileSync(jsonPath, JSON.stringify(matrixResults, null, 2), "utf8");
    console.log(`\n[SALVO] Relatório completo em: ${jsonPath}`);
    console.log(`[STATUS FINAL] Validação Geral Aprovada? ${matrixResults.overallPass ? 'SIM (100% PASS)' : 'NÃO (FALHAS DETECTADAS)'}`);

  } finally {
    await browser.close();
    try {
      fs.rmSync(runProfile, { recursive: true, force: true });
    } catch {}

    await runSupabaseSql(`SELECT public.admin_reset_user_session('${userId}', 'p0_18_9_2_matrix_finish');`);
  }
}

runFullMatrixValidation().catch(err => {
  console.error("ERRO na validação matricial:", err);
  process.exit(1);
});

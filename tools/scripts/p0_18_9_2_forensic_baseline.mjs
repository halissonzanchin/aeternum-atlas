/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.9.2
 * FASE 1: REPRODUÇÃO FORENSE E MEDIÇÃO GEOMÉTRICA (100% vs 80% ZOOM)
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

async function measureMindMapForensic(page, zoomLabel) {
  return await page.evaluate((zLabel) => {
    const sidebar = document.querySelector(".mindmap-sidebar");
    const activeTabPanel = document.querySelector(".mindmap-tab-panel");
    const aiComposer = document.querySelector(".mindmap-ai-composer");
    const suggestions = document.querySelector(".mindmap-ai-suggestions");
    const generateBtn = document.querySelector(".mindmap-ai-composer .a26-button");
    const footerLink = document.querySelector(".mindmap-ai-footer-link");
    const topbar = document.querySelector(".mindmap-topbar");
    const topbarLeft = document.querySelector(".topbar-left-group");
    const topbarExport = document.querySelector(".topbar-export-group");
    const zoomControls = document.querySelector(".zoom-controls");
    const topbarDesktopActions = document.querySelector(".topbar-desktop-actions");
    const tabBtns = Array.from(document.querySelectorAll(".mindmap-tab-btn"));

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
        display: cs.display,
        flex: cs.flex
      };
    };

    // Check collisions between topbar buttons
    const topbarButtons = Array.from(topbar ? topbar.querySelectorAll("button, .a26-button, .a26-icon-button, .zoom-percentage-btn") : []).map(b => {
      const r = b.getBoundingClientRect();
      return {
        text: (b.innerText || b.getAttribute("aria-label") || "").trim(),
        rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }
      };
    });

    const collisions = [];
    for (let i = 0; i < topbarButtons.length; i++) {
      for (let j = i + 1; j < topbarButtons.length; j++) {
        const b1 = topbarButtons[i];
        const b2 = topbarButtons[j];
        if (b1.rect.width === 0 || b2.rect.width === 0) continue;
        const overlapX = Math.max(0, Math.min(b1.rect.x + b1.rect.width, b2.rect.x + b2.rect.width) - Math.max(b1.rect.x, b2.rect.x));
        const overlapY = Math.max(0, Math.min(b1.rect.y + b1.rect.height, b2.rect.y + b2.rect.height) - Math.max(b1.rect.y, b2.rect.y));
        if (overlapX > 2 && overlapY > 2) {
          collisions.push({ item1: b1.text, item2: b2.text, overlapX, overlapY });
        }
      }
    }

    return {
      zoom: zLabel,
      window: { width: window.innerWidth, height: window.innerHeight },
      sidebar: getBox(sidebar),
      activeTabPanel: getBox(activeTabPanel),
      aiComposer: getBox(aiComposer),
      suggestions: getBox(suggestions),
      generateBtn: getBox(generateBtn),
      footerLink: getBox(footerLink),
      topbar: getBox(topbar),
      topbarLeft: getBox(topbarLeft),
      topbarExport: getBox(topbarExport),
      zoomControls: getBox(zoomControls),
      topbarDesktopActions: getBox(topbarDesktopActions),
      tabButtons: tabBtns.map(b => ({
        text: b.innerText.trim(),
        width: Math.round(b.getBoundingClientRect().width),
        height: Math.round(b.getBoundingClientRect().height)
      })),
      collisions,
      isFooterLinkVisible: footerLink ? (footerLink.getBoundingClientRect().bottom <= window.innerHeight && footerLink.getBoundingClientRect().top >= 0) : false,
      isGenerateBtnVisible: generateBtn ? (generateBtn.getBoundingClientRect().bottom <= window.innerHeight && generateBtn.getBoundingClientRect().top >= 0) : false
    };
  }, zoomLabel);
}

async function runForensicAudit() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.18.9.2: PERÍCIA FORENSE (100% vs 80% ZOOM)                 ");
  console.log("================================================================================\n");

  const qaEmail = TARGET_TEST_EMAIL;
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  const userId = TARGET_TEST_USER_ID;

  console.log("[PREPARAÇÃO] Resetando sessões da conta de teste...");
  await runSupabaseSql(
    `SELECT public.admin_reset_user_session('${userId}', 'p0_18_9_2_forensic_prep');`
  );

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_9_2_forensic_" + Date.now());
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

  const forensicReport = {
    timestamp: new Date().toISOString(),
    runs: []
  };

  try {
    const page = await browser.newPage();

    // Authenticate
    console.log("[AUTH] Efetuando login...");
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.type('input[type="email"]', qaEmail, { delay: 15 });
    await page.type('input[type="password"]', qaPassword, { delay: 15 });
    const submitBtn = await page.$('button[type="submit"]') || await page.$('.a26-button--primary');
    await submitBtn.click();
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 });

    // Test Scenarios:
    // 1. 1277x653 at 100% zoom (deviceScaleFactor = 1.0)
    // 2. 1277x653 at 80% zoom (deviceScaleFactor = 0.8)
    const zoomConfigs = [
      { label: "100%", dsf: 1.0, width: 1277, height: 653 },
      { label: "80%", dsf: 0.8, width: 1277, height: 653 }
    ];

    for (const zc of zoomConfigs) {
      console.log(`\n--- Testando Zoom ${zc.label} (${zc.width}x${zc.height}, DSF ${zc.dsf}) ---`);
      await page.setViewport({ width: zc.width, height: zc.height, deviceScaleFactor: zc.dsf });
      await page.goto(`${BASE_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));

      // Ensure sidebar is open
      const isCollapsed = await page.evaluate(() => {
        const sb = document.querySelector('.mindmap-sidebar');
        return sb ? sb.classList.contains('collapsed') : true;
      });

      if (isCollapsed) {
        console.log("  Sidebar está colapsada por viewport compacto. Expandindo...");
        const toggleBtn = await page.$('.mindmap-topbar button') || await page.$('.topbar-left-group button');
        if (toggleBtn) {
          await toggleBtn.click();
          await new Promise(r => setTimeout(r, 500));
        }
      }

      // Capture Structure Tab
      const shotStructure = `p0_18_9_2_before_${zc.label.replace("%", "")}_structure.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotStructure), fullPage: false });
      const mStructure = await measureMindMapForensic(page, `${zc.label}_structure`);

      // Switch to AI Tab
      console.log(`  Alternando para a aba 'Gerar com IA'...`);
      const aiTabBtn = await page.$('#tab-ai');
      if (aiTabBtn) {
        await aiTabBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }

      // Capture AI Tab
      const shotAI = `p0_18_9_2_before_${zc.label.replace("%", "")}_ai_tab.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotAI), fullPage: false });
      const mAI = await measureMindMapForensic(page, `${zc.label}_ai_tab`);

      forensicReport.runs.push({
        zoom: zc.label,
        structureTab: mStructure,
        aiTab: mAI,
        screenshots: [shotStructure, shotAI]
      });

      console.log(`  Estrutura: Sidebar Height=${mStructure.sidebar?.height}px, Textarea ScrollHeight=${mStructure.activeTabPanel?.scrollHeight}px`);
      console.log(`  Aba IA:    Composer Height=${mAI.aiComposer?.height}px, ScrollHeight=${mAI.aiComposer?.scrollHeight}px`);
      console.log(`             Botão Gerar Visível? ${mAI.isGenerateBtnVisible}, Link Inferior Visível? ${mAI.isFooterLinkVisible}`);
      console.log(`             Colisões na Toolbar: ${mAI.collisions.length}`);
      if (mAI.collisions.length > 0) {
        console.log(`             -> Colisões detectadas:`, mAI.collisions);
      }
    }

    const jsonPath = path.join(ARTIFACTS_DIR, "P0.18.9.2_FORENSIC_BASELINE_MEASUREMENTS.json");
    fs.writeFileSync(jsonPath, JSON.stringify(forensicReport, null, 2), "utf8");
    console.log(`\n[SALVO] Relatório forense salvo em: ${jsonPath}`);

  } finally {
    await browser.close();
    try {
      fs.rmSync(runProfile, { recursive: true, force: true });
    } catch {}

    await runSupabaseSql(
      `SELECT public.admin_reset_user_session('${userId}', 'p0_18_9_2_forensic_finish');`
    );
  }
}

runForensicAudit().catch(err => {
  console.error("ERRO na perícia:", err);
  process.exit(1);
});

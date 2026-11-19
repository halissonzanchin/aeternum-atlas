/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.8
 * FASE 10: VERIFICAÇÃO FINAL EM PRODUÇÃO OFICIAL LIVE
 * 
 * URL: https://www.aeternumatlas.com/mind-map
 * Viewport: 1272 x 652 (Cenário do Operador)
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

async function runLiveVerification() {
  console.log("===============================================================================");
  console.log("AETERNUM ATLAS — P0.18.8: VERIFICAÇÃO EM PRODUÇÃO OFICIAL LIVE");
  console.log("===============================================================================");

  const qaEmail = process.env.ATLAS_QA_EMAIL || TARGET_TEST_EMAIL;
  let qaPassword = process.env.ATLAS_QA_PASSWORD || getCredential("AeternumAtlas:AutomationTestAccount");
  if (!qaPassword) {
    qaPassword = getCredential("ATLAS_AUTOMATION_PASSWORD");
  }

  if (!qaPassword) {
    throw new Error("Credencial da conta de teste não encontrada.");
  }

  // 1. Reset da sessão de teste
  try {
    console.log(`[AUTH-SETUP] Resetando sessão prévia para ${TARGET_TEST_EMAIL}...`);
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_8_live_prod_val');`);
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
      "--window-size=1272,652"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1272, height: 652, deviceScaleFactor: 1 });

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

    // Aguardar elementos essenciais
    await page.waitForSelector("#canvas", { timeout: 20000 });
    await page.waitForSelector(".zoom-percentage-btn", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2500)); // Estabilizar render D3 e ResizeObserver

    // Capturar screenshot em produção oficial
    const liveShotPath = path.join(ARTIFACTS_DIR, "p0_18_8_production_live_1272x652.png");
    await page.screenshot({ path: liveShotPath, fullPage: false });
    console.log(`[SCREENSHOT] Captura de produção oficial salva em: ${liveShotPath}`);

    const TARGET_SELECTORS = [
      { name: "a26-shell", selector: ".a26-shell" },
      { name: "a26-shell__main", selector: ".a26-shell__main" },
      { name: "a26-shell__topbar", selector: ".a26-shell__topbar" },
      { name: "a26-shell__content", selector: ".a26-shell__content" },
      { name: "a26-feature-shell--canvas", selector: ".a26-feature-shell--canvas" },
      { name: "a26-feature-shell__header-slot", selector: ".a26-feature-shell__header-slot" },
      { name: "a26-feature-shell__body", selector: ".a26-feature-shell__body" },
      { name: "a26-mindmap-page", selector: ".a26-mindmap-page" },
      { name: "mindmap-canvas-wrap", selector: ".mindmap-canvas-wrap" },
      { name: "mindmap-topbar", selector: ".mindmap-topbar" },
      { name: "mindmap-canvas-stage", selector: ".mindmap-canvas-stage" },
      { name: "#canvas", selector: "#canvas" },
      { name: "mindmap-hint", selector: ".mindmap-hint" }
    ];

    const liveData = await page.evaluate((selectors) => {
      const results = {};
      const winH = window.innerHeight;
      const winW = window.innerWidth;

      selectors.forEach(({ name, selector }) => {
        const el = document.querySelector(selector);
        if (!el) {
          results[name] = { exists: false };
          return;
        }

        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);

        results[name] = {
          exists: true,
          rect: {
            top: r.top,
            bottom: r.bottom,
            left: r.left,
            right: r.right,
            width: r.width,
            height: r.height,
            distFromBottom: winH - r.bottom
          },
          client: { width: el.clientWidth, height: el.clientHeight },
          scroll: { width: el.scrollWidth, height: el.scrollHeight },
          offset: { width: el.offsetWidth, height: el.offsetHeight },
          padding: {
            top: s.paddingTop,
            bottom: s.paddingBottom,
            left: s.paddingLeft,
            right: s.paddingRight
          },
          margin: {
            top: s.marginTop,
            bottom: s.marginBottom,
            left: s.marginLeft,
            right: s.marginRight
          },
          border: {
            top: s.borderTopWidth,
            bottom: s.borderBottomWidth
          },
          overflow: {
            x: s.overflowX,
            y: s.overflowY
          },
          sizing: {
            boxSizing: s.boxSizing,
            height: s.height
          }
        };
      });

      const zoomBadgeEl = document.querySelector(".zoom-percentage-btn");
      const zoomText = zoomBadgeEl ? zoomBadgeEl.textContent.trim() : null;

      const contentEl = document.querySelector(".a26-shell__content");
      const contentClasses = contentEl ? contentEl.className : "";

      return { winW, winH, zoomText, contentClasses, results };
    }, TARGET_SELECTORS);

    console.log("\n===============================================================================");
    console.log("CADEIA DE ALTURAS MEDIDA EM PRODUÇÃO AO VIVO (https://www.aeternumatlas.com):");
    console.log("===============================================================================");
    console.log(`Window Viewport: ${liveData.winW} x ${liveData.winH} px`);
    console.log(`Classes em .a26-shell__content: "${liveData.contentClasses}"`);
    console.log(`D3 Zoom no Modo Leitura: ${liveData.zoomText}`);

    TARGET_SELECTORS.forEach(({ name }) => {
      const d = liveData.results[name];
      if (!d || !d.exists) {
        console.log(`  ${name.padEnd(32)}: NÃO ENCONTRADO NO DOM`);
      } else {
        const top = Math.round(d.rect.top);
        const bottom = Math.round(d.rect.bottom);
        const h = Math.round(d.rect.height);
        const dist = Math.round(d.rect.distFromBottom);
        const pTop = d.padding.top;
        const pBottom = d.padding.bottom;
        console.log(`  ${name.padEnd(32)}: top=${String(top).padStart(3)} bottom=${String(bottom).padStart(3)} h=${String(h).padStart(3)} | gapInf=${String(dist).padStart(3)}px | pad(T=${pTop}, B=${pBottom})`);
      }
    });

    const reportPayload = {
      timestamp: new Date().toISOString(),
      url: `${PROD_URL}/mind-map`,
      viewport: { width: 1272, height: 652 },
      liveData,
      liveScreenshot: {
        path: liveShotPath,
        sha256: calculateFileSha256(liveShotPath)
      }
    };

    const outJsonPath = path.join(ARTIFACTS_DIR, "p0_18_8_production_live_audit.json");
    fs.writeFileSync(outJsonPath, JSON.stringify(reportPayload, null, 2), "utf8");
    console.log(`\n[SUCESSO] Relatório de produção oficial live salvo em: ${outJsonPath}`);

  } finally {
    await browser.close();
    try {
      console.log(`[AUTH-CLEANUP] Encerrando sessão de testes para ${TARGET_TEST_EMAIL}...`);
      await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_8_live_cleanup');`);
      console.log("[AUTH-CLEANUP] Sessão de teste finalizada com sucesso.");
    } catch (err) {
      console.warn("[AUTH-CLEANUP] Aviso no cleanup final:", err.message);
    }
  }
}

runLiveVerification().catch((err) => {
  console.error("\n[ERRO CRÍTICO NA VERIFICAÇÃO LIVE]:", err);
  process.exit(1);
});

/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.8
 * FASE 1 & FASE 2: PERÍCIA DA CADEIA DE ALTURAS E TESTE ISOLADO DA HIPÓTESE
 * 
 * Viewport obrigatório de referência: 1272 x 652
 * Elementos auditados na cadeia:
 *  1. .a26-shell
 *  2. .a26-shell__main
 *  3. .a26-shell__content
 *  4. .a26-feature-shell--canvas
 *  5. .a26-feature-shell__header-slot
 *  6. .a26-feature-shell__body
 *  7. .a26-mindmap-page
 *  8. .mindmap-canvas-wrap
 *  9. .mindmap-topbar
 * 10. .mindmap-canvas-stage
 * 11. #canvas
 * 12. .mindmap-hint
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

async function runHeightChainAudit() {
  console.log("===============================================================================");
  console.log("AETERNUM ATLAS — P0.18.8: FASE 1 & 2 - PERÍCIA FORENSE DA CADEIA DE ALTURAS");
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
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_8_forensic_audit');`);
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
    await new Promise(r => setTimeout(r, 2000)); // Estabilizar render D3

    // Capturar screenshot do defeito no baseline
    const defectShotPath = path.join(ARTIFACTS_DIR, "p0_18_8_initial_defect_1272x652.png");
    await page.screenshot({ path: defectShotPath, fullPage: false });
    console.log(`[SCREENSHOT] Captura do defeito salva em: ${defectShotPath}`);

    // Elementos a medir
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

    const measureElements = async () => {
      return await page.evaluate((selectors) => {
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
              bottom: s.borderBottomWidth,
              left: s.borderLeftWidth,
              right: s.borderRightWidth
            },
            overflow: {
              x: s.overflowX,
              y: s.overflowY
            },
            sizing: {
              boxSizing: s.boxSizing,
              height: s.height,
              minHeight: s.minHeight,
              maxHeight: s.maxHeight
            },
            layout: {
              display: s.display,
              flexDirection: s.flexDirection,
              gridTemplateRows: s.gridTemplateRows
            }
          };
        });

        return { winW, winH, results };
      }, TARGET_SELECTORS);
    };

    console.log("\n--- [FASE 1] MEDIÇÃO DA CADEIA DE ALTURAS NO BASELINE ---");
    const baselineData = await measureElements();

    console.log(`Window Viewport: ${baselineData.winW} x ${baselineData.winH} px`);
    console.log("\nCadeia de Alturas e Distância da Borda Inferior do Viewport (winH - rect.bottom):");
    TARGET_SELECTORS.forEach(({ name }) => {
      const d = baselineData.results[name];
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

    // FASE 2: TESTE ISOLADO DA HIPÓTESE
    console.log("\n--- [FASE 2] TESTE ISOLADO DA HIPÓTESE ---");
    console.log("Aplicando override temporário no client DOM de .a26-shell__content (padding: 0)...");

    const experimentResult = await page.evaluate(() => {
      const content = document.querySelector(".a26-shell__content");
      if (!content) return { applied: false, error: "Content not found" };

      // Guardar estilos originais
      const origPadding = content.style.padding;
      const origPaddingBottom = content.style.paddingBottom;

      // Aplicar remoção de padding e permitir full height
      content.style.padding = "0px";
      content.style.paddingBottom = "0px";
      content.style.overflow = "hidden"; // para modo canvas

      return {
        applied: true,
        origPadding,
        origPaddingBottom
      };
    });

    console.log("[FASE 2] Override aplicado:", experimentResult);
    // Aguardar re-layout e ResizeObserver
    await new Promise(r => setTimeout(r, 1000));

    // Forçar trigger de resize no window para o ResizeObserver do MindMap reagir
    await page.evaluate(() => {
      window.dispatchEvent(new Event("resize"));
    });
    await new Promise(r => setTimeout(r, 1000));

    const experimentData = await measureElements();

    console.log("\nCadeia de Alturas PÓS-OVERRIDE DE PADDING (Teste Isolado):");
    TARGET_SELECTORS.forEach(({ name }) => {
      const d = experimentData.results[name];
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

    const expShotPath = path.join(ARTIFACTS_DIR, "p0_18_8_experiment_no_padding_1272x652.png");
    await page.screenshot({ path: expShotPath, fullPage: false });
    console.log(`[SCREENSHOT] Captura do teste isolado salva em: ${expShotPath}`);

    // Salvar relatório JSON com os dois estados
    const reportPayload = {
      timestamp: new Date().toISOString(),
      viewport: { width: 1272, height: 652 },
      baseline: baselineData,
      experiment: experimentData,
      defectScreenshot: {
        path: defectShotPath,
        sha256: calculateFileSha256(defectShotPath)
      },
      experimentScreenshot: {
        path: expShotPath,
        sha256: calculateFileSha256(expShotPath)
      }
    };

    const outJsonPath = path.join(ARTIFACTS_DIR, "p0_18_8_height_chain_baseline.json");
    fs.writeFileSync(outJsonPath, JSON.stringify(reportPayload, null, 2), "utf8");
    console.log(`\n[SUCESSO] Relatório de perícia forense salvo em: ${outJsonPath}`);

  } finally {
    await browser.close();
    try {
      console.log(`[AUTH-CLEANUP] Encerrando sessão de testes para ${TARGET_TEST_EMAIL}...`);
      await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_8_audit_cleanup');`);
      console.log("[AUTH-CLEANUP] Sessão de teste finalizada com sucesso.");
    } catch (err) {
      console.warn("[AUTH-CLEANUP] Aviso no cleanup final:", err.message);
    }
  }
}

runHeightChainAudit().catch((err) => {
  console.error("\n[ERRO CRÍTICO NA PERÍCIA]:", err);
  process.exit(1);
});

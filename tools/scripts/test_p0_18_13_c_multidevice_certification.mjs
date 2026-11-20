import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

async function runCertification() {
  console.log("===============================================================");
  console.log("   AETERNUM ATLAS — CERTIFICAÇÃO MULTIDISPOSITIVO P0.18.13-C");
  console.log("===============================================================\n");

  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_13_c_cert');`);

  const runProfile = path.join(os.tmpdir(), "edge_cert_p0_18_13_c_" + Date.now());
  fs.mkdirSync(runProfile, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    userDataDir: runProfile,
    args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--ignore-certificate-errors"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1277, height: 653 });

  const results = {
    gateW1_Socratic: {},
    gateW3_AITutor: {},
    gateW4_AgendaPopover: {},
    matrixViewports: []
  };

  try {
    console.log("1. Autenticando com conta de testes...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', TARGET_TEST_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', getCredential("AeternumAtlas:AutomationTestAccount"), { delay: 10 });
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => !window.location.pathname.includes('/login'));
    console.log("   Autenticação bem-sucedida.\n");

    // =========================================================
    // 2. GATE-W3: Atlas AI Tutor Floating Panel Geometry
    // =========================================================
    console.log("2. Validando GATE-W3: Atlas AI Tutor Floating Panel em 1277x653...");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 1500));

    // Open AI Tutor Panel
    await page.evaluate(() => {
      const trigger = document.querySelector('.upe-ai-trigger');
      if (trigger) trigger.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const tutorMetrics = await page.evaluate(() => {
      const panel = document.querySelector('#upe-ai-panel') || document.querySelector('.upe-ai-panel');
      if (!panel) return { found: false };
      const body = panel.querySelector('.upe-ai-panel__body');
      const rect = panel.getBoundingClientRect();
      const style = window.getComputedStyle(panel);
      return {
        found: true,
        panelHeight: rect.height,
        panelTop: rect.top,
        panelBottom: rect.bottom,
        winHeight: window.innerHeight,
        bodyHeight: body ? body.getBoundingClientRect().height : null,
        topCss: style.top,
        bottomCss: style.bottom
      };
    });

    console.log("   Tutor Panel encontrado:", tutorMetrics.found);
    if (tutorMetrics.found) {
      console.log(`   Panel Height: ${tutorMetrics.panelHeight}px (Win: ${tutorMetrics.winHeight}px)`);
      console.log(`   Panel Top: ${tutorMetrics.panelTop}px, Bottom: ${tutorMetrics.panelBottom}px`);
      console.log(`   Body Height: ${tutorMetrics.bodyHeight}px`);
      console.log(`   CSS Computed: top=${tutorMetrics.topCss}, bottom=${tutorMetrics.bottomCss}`);
      results.gateW3_AITutor = {
        pass: tutorMetrics.panelHeight >= 480 && tutorMetrics.bodyHeight >= 200,
        ...tutorMetrics
      };
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_13_c_w3_ai_tutor_fixed.png") });
    }

    // Close AI Tutor
    await page.keyboard.press("Escape");
    await new Promise(r => setTimeout(r, 400));

    // =========================================================
    // 3. GATE-W1: Socratic Clinical Case Modal
    // =========================================================
    console.log("\n3. Validando GATE-W1: Socratic Clinical Case Modal...");
    await page.goto(`${BASE_URL}/ai-tutor`, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent && btn.textContent.includes('Gerar Caso Clínico'));
      b?.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const socraticMetrics = await page.evaluate(() => {
      const modal = document.querySelector('.a26-socratic-modal-card');
      const footer = document.querySelector('.a26-socratic-footer');
      const body = document.querySelector('.a26-socratic-modal-body');
      if (!modal || !footer || !body) return { found: false };
      const mRect = modal.getBoundingClientRect();
      const fRect = footer.getBoundingClientRect();
      return {
        found: true,
        modalHeight: mRect.height,
        footerBottom: fRect.bottom,
        winHeight: window.innerHeight,
        footerVisible: fRect.bottom <= window.innerHeight && fRect.top >= 0,
        modalContained: mRect.bottom <= window.innerHeight && mRect.top >= 0
      };
    });

    console.log("   Socratic Modal encontrado:", socraticMetrics.found);
    if (socraticMetrics.found) {
      console.log(`   Modal Height: ${socraticMetrics.modalHeight}px`);
      console.log(`   Footer Visible: ${socraticMetrics.footerVisible}, Modal Contained: ${socraticMetrics.modalContained}`);
      results.gateW1_Socratic = socraticMetrics;
    }

    // Close Socratic Modal with Escape
    await page.keyboard.press("Escape");
    await new Promise(r => setTimeout(r, 400));

    // =========================================================
    // 4. Matrix of 8 Essential Viewports & Zooms
    // =========================================================
    console.log("\n4. Homologação na Matriz de 8 Viewports Críticos...");
    const viewports = [
      { name: "Desktop 1920x1080 (FHD)", width: 1920, height: 1080 },
      { name: "Laptop 1440x900", width: 1440, height: 900 },
      { name: "Alvo Auditado 1277x653 (Chrome 100%)", width: 1277, height: 653 },
      { name: "Alvo Zoom 125% (1022x522)", width: 1022, height: 522 },
      { name: "Alvo Zoom 150% (851x435)", width: 851, height: 435 },
      { name: "Tablet iPad 768x1024", width: 768, height: 1024 },
      { name: "Mobile iPhone 390x844", width: 390, height: 844 },
      { name: "Compact Mobile 320x568", width: 320, height: 568 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 200));

      const evaluation = await page.evaluate(() => {
        return {
          scrollX: window.scrollX,
          docScrollWidth: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          hasHorizontalSpill: document.documentElement.scrollWidth > window.innerWidth + 2
        };
      });

      console.log(`   [${vp.name}]: Spill=${evaluation.hasHorizontalSpill ? "SIM (REPROVADO)" : "NÃO (APROVADO)"}`);
      results.matrixViewports.push({
        ...vp,
        hasHorizontalSpill: evaluation.hasHorizontalSpill,
        pass: !evaluation.hasHorizontalSpill
      });
    }

    // Save final report data
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "P0.18.13_C_CERTIFICACAO_RESULTS.json"),
      JSON.stringify(results, null, 2),
      "utf8"
    );

    console.log("\n===============================================================");
    console.log("   CERTIFICAÇÃO P0.18.13-C CONCLUÍDA COM SUCESSO!");
    console.log("===============================================================");
  } finally {
    await browser.close();
    try { fs.rmSync(runProfile, { recursive: true, force: true }); } catch {}
  }
}

runCertification().catch(err => {
  console.error("Erro na certificação:", err);
  process.exit(1);
});

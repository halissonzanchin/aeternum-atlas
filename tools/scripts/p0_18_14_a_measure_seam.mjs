process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

async function run() {
  const tag = process.argv[2] || "before";
  console.log(`=== Medindo geometria da junção Topbar/Sidebar [${tag.toUpperCase()}] ===`);

  try {
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_14_a_${tag}');`);
  } catch (e) {
    console.warn("Supabase session reset warn:", e.message);
  }

  const runProfile = path.join(os.tmpdir(), `edge_seam_${tag}_${Date.now()}`);
  fs.mkdirSync(runProfile, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    userDataDir: runProfile,
    args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--ignore-certificate-errors"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 2 });

  try {
    console.log("1. Autenticando...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', TARGET_TEST_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', getCredential("AeternumAtlas:AutomationTestAccount"), { delay: 10 });
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
    console.log("   Autenticado com sucesso.");

    // Ir para rota que tem o shell completo (ex: /mind-map ou /study-agenda)
    await page.goto(`${BASE_URL}/mind-map`, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 2000));

    // Medir geometria da junção Topbar/Sidebar
    const metrics = await page.evaluate(() => {
      const sidebar = document.querySelector('.a26-shell__sidebar');
      const topbar = document.querySelector('.a26-shell__topbar');
      const main = document.querySelector('.a26-shell__main');
      const shell = document.querySelector('.a26-shell');

      if (!sidebar || !topbar) {
        return { error: "Sidebar or Topbar not found in DOM" };
      }

      const sRect = sidebar.getBoundingClientRect();
      const tRect = topbar.getBoundingClientRect();
      const mRect = main ? main.getBoundingClientRect() : null;

      const sStyle = window.getComputedStyle(sidebar);
      const tStyle = window.getComputedStyle(topbar);

      return {
        shellGrid: window.getComputedStyle(shell).gridTemplateColumns,
        sidebar: {
          rect: { x: sRect.x, y: sRect.y, width: sRect.width, height: sRect.height, right: sRect.right, bottom: sRect.bottom },
          borderTopRightRadius: sStyle.borderTopRightRadius,
          borderBottomRightRadius: sStyle.borderBottomRightRadius,
          borderTopLeftRadius: sStyle.borderTopLeftRadius,
          borderBottomLeftRadius: sStyle.borderBottomLeftRadius,
          borderRightWidth: sStyle.borderRightWidth,
          borderRightColor: sStyle.borderRightColor,
          borderRightStyle: sStyle.borderRightStyle,
          boxShadow: sStyle.boxShadow
        },
        topbar: {
          rect: { x: tRect.x, y: tRect.y, width: tRect.width, height: tRect.height, right: tRect.right, bottom: tRect.bottom },
          borderTopLeftRadius: tStyle.borderTopLeftRadius,
          borderTopRightRadius: tStyle.borderTopRightRadius,
          borderBottomLeftRadius: tStyle.borderBottomLeftRadius,
          borderBottomRightRadius: tStyle.borderBottomRightRadius,
          borderBottomWidth: tStyle.borderBottomWidth,
          borderBottomColor: tStyle.borderBottomColor,
          borderBottomStyle: tStyle.borderBottomStyle,
          boxShadow: tStyle.boxShadow
        },
        seam: {
          horizontalGap: tRect.left - sRect.right,
          junctionX: sRect.right,
          junctionY: tRect.bottom,
          sidebarCurvesAtJunctionTop: sStyle.borderTopRightRadius !== '0px',
          topbarCurvesAtJunctionBottom: tStyle.borderBottomLeftRadius !== '0px'
        }
      };
    });

    console.log("Metricas coletadas:", JSON.stringify(metrics, null, 2));

    // Salvar JSON
    const metricsPath = path.join(ARTIFACTS_DIR, `P0.18.14_A_${tag.toUpperCase()}_SEAM_METRICS.json`);
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

    // Capturar tela cheia
    const fullPath = path.join(ARTIFACTS_DIR, `p0_18_14_a_shell_${tag}.png`);
    await page.screenshot({ path: fullPath });
    console.log(`Screenshot total salva em: ${fullPath}`);

    // Capturar screenshot focado na junção (crop ao redor de x: 276, y: 60)
    const clipX = Math.max(0, Math.round(metrics.sidebar.rect.right - 100));
    const clipY = 0;
    const clipW = 320;
    const clipH = 160;

    const zoomPath = path.join(ARTIFACTS_DIR, `p0_18_14_a_seam_${tag}.png`);
    await page.screenshot({
      path: zoomPath,
      clip: { x: clipX, y: clipY, width: clipW, height: clipH }
    });
    console.log(`Screenshot recortada da juncao salva em: ${zoomPath}`);

    return metrics;
  } finally {
    await browser.close();
    try { fs.rmSync(runProfile, { recursive: true, force: true }); } catch (_) {}
  }
}

run().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
});

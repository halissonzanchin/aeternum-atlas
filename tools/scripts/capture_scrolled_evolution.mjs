import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const DOMAIN = "https://www.aeternumatlas.com";

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

async function captureEvolutionPanel() {
  const demoEmail = "demo.institucional@aeternumatlas.com";
  const demoPassword = getCredential("AeternumAtlas:DemoAccount");
  const userId = "5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f";

  console.log("[SESSÃO] Limpando sessões ativas no Supabase...");
  await runSupabaseSql(`DELETE FROM public.user_active_sessions WHERE user_id = '${userId}';`);

  const runProfile = path.join(os.tmpdir(), "edge_atlas_panel_" + Date.now());
  fs.mkdirSync(runProfile, { recursive: true });

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

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(`${DOMAIN}/login`, { waitUntil: "networkidle2" });
    await page.evaluate((email, password) => {
      const emailInput = document.querySelector('input[name="email"]');
      const passInput = document.querySelector('input[name="password"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(emailInput, email);
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeSetter.call(passInput, password);
      passInput.dispatchEvent(new Event("input", { bubbles: true }));
    }, demoEmail, demoPassword);

    await new Promise(r => setTimeout(r, 600));
    const submitBtn = await page.$("button.atlas-auth-submit");
    await submitBtn.click();
    await page.waitForFunction(() => window.location.pathname.includes("/student/home"), { timeout: 25000 });
    await new Promise(r => setTimeout(r, 3000));

    // Rolar até o painel de evolução dentro de .a26-shell__content
    console.log("[SCROLL] Procurando e rolando até o painel de evolução dentro de .a26-shell__content...");
    const panelFound = await page.evaluate(() => {
      const scrollContainer = document.querySelector('.a26-shell__content');
      const evolutionPanel = document.querySelector('.evolution-panel, [class*="evolution"], [class*="Evolution"]');
      
      if (scrollContainer && evolutionPanel) {
        evolutionPanel.scrollIntoView({ behavior: 'instant', block: 'start' });
        return {
          found: true,
          panelClass: evolutionPanel.className,
          scrollTop: scrollContainer.scrollTop
        };
      }
      
      // Fallback: scroll manually
      if (scrollContainer) {
        scrollContainer.scrollTop = 1000;
        return { found: true, fallback: true, scrollTop: scrollContainer.scrollTop };
      }
      return { found: false };
    });
    console.log("[PANEL FOUND]", panelFound);

    await new Promise(r => setTimeout(r, 1500));

    // Capturar screenshot do viewport após scroll
    const scrolledFile = path.join(ARTIFACTS_DIR, "p0_15_scrolled_evolution_panel.png");
    await page.screenshot({ path: scrolledFile });
    console.log(`[SUCESSO] Screenshot rolado gravado em: ${scrolledFile}`);

  } finally {
    await browser.close();
    await runSupabaseSql(`DELETE FROM public.user_active_sessions WHERE user_id = '${userId}';`);
  }
}

captureEvolutionPanel().catch(err => {
  console.error(err);
  process.exit(1);
});

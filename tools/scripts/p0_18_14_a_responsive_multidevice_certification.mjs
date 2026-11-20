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

const VIEWPORTS = [
  { name: "2560x1440 (QHD/4K)", width: 2560, height: 1440, type: "desktop" },
  { name: "1920x1080 (FHD)", width: 1920, height: 1080, type: "desktop" },
  { name: "1600x900 (HD+)", width: 1600, height: 900, type: "desktop" },
  { name: "1366x768 (Laptop)", width: 1366, height: 768, type: "desktop" },
  { name: "1277x653 (Operator)", width: 1277, height: 653, type: "desktop" },
  { name: "1024x768 (Desktop Edge)", width: 1024, height: 768, type: "desktop" },
  { name: "1023x768 (Tablet Landscape)", width: 1023, height: 768, type: "tablet" },
  { name: "768x1024 (Tablet Portrait)", width: 768, height: 1024, type: "tablet" },
  { name: "390x844 (Mobile iPhone)", width: 390, height: 844, type: "mobile" },
  { name: "320x568 (Mobile Compact)", width: 320, height: 568, type: "mobile" }
];

const ZOOMS = [0.8, 1.0, 1.25, 1.5, 2.0];

async function runMultideviceCertification() {
  console.log("===============================================================================");
  console.log("   AETERNUM ATLAS — CERTIFICAÇÃO MULTIDISPOSITIVO E RESPONSIVA P0.18.14-A");
  console.log("   Unificação Visual Topbar/Sidebar — Seam Continuity Matrix");
  console.log("===============================================================================\n");

  try {
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_14_a_cert');`);
  } catch (e) {
    console.warn("Supabase session reset warning:", e.message);
  }

  const runProfile = path.join(os.tmpdir(), `edge_cert_${Date.now()}`);
  fs.mkdirSync(runProfile, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    userDataDir: runProfile,
    args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--ignore-certificate-errors"]
  });

  const page = await browser.newPage();
  const certResults = {
    viewports: [],
    zooms: [],
    themes: [],
    allPassed: true,
    timestamp: new Date().toISOString()
  };

  try {
    console.log("1. Autenticação na plataforma...");
    await page.setViewport({ width: 1277, height: 653 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', TARGET_TEST_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', getCredential("AeternumAtlas:AutomationTestAccount"), { delay: 10 });
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
    console.log("   Autenticado com sucesso.");

    await page.goto(`${BASE_URL}/mind-map`, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 2000));

    // 2. Testar todos os 10 Viewports
    console.log("\n2. Executando testes nos 10 Viewports...");
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      await new Promise(r => setTimeout(r, 300));

      const vpMetrics = await page.evaluate((isDesktop) => {
        const sidebar = document.querySelector('.a26-shell__sidebar');
        const topbar = document.querySelector('.a26-shell__topbar');

        if (!topbar) return { error: "Topbar not found" };

        const tStyle = window.getComputedStyle(topbar);
        const tRect = topbar.getBoundingClientRect();

        if (isDesktop) {
          if (!sidebar) return { error: "Sidebar not found in desktop" };
          const sStyle = window.getComputedStyle(sidebar);
          const sRect = sidebar.getBoundingClientRect();

          const seamFlush = Math.abs(tRect.left - sRect.right) < 1;
          const topCornerStraight = sStyle.borderTopRightRadius === '0px';
          const bottomCornerCurved = sStyle.borderBottomRightRadius === '20px';
          const topbarBottomLeftStraight = tStyle.borderBottomLeftRadius === '0px';
          const topbarBottomRightCurved = tStyle.borderBottomRightRadius === '20px';

          const passed = seamFlush && topCornerStraight && bottomCornerCurved && topbarBottomLeftStraight && topbarBottomRightCurved;
          return {
            isDesktop: true,
            passed,
            seamFlush,
            topCornerStraight,
            bottomCornerCurved,
            topbarBottomLeftStraight,
            topbarBottomRightCurved,
            sidebarRadius: sStyle.borderRadius,
            topbarRadius: tStyle.borderRadius,
            gap: tRect.left - sRect.right
          };
        } else {
          const sidebarHidden = !sidebar || window.getComputedStyle(sidebar).display === 'none';
          const topbarSymmetrical = tStyle.borderBottomLeftRadius === '20px' && tStyle.borderBottomRightRadius === '20px';
          const fullWidth = Math.abs(tRect.width - window.innerWidth) < 2;

          const passed = sidebarHidden && topbarSymmetrical && fullWidth;
          return {
            isDesktop: false,
            passed,
            sidebarHidden,
            topbarSymmetrical,
            fullWidth,
            topbarRadius: tStyle.borderRadius
          };
        }
      }, vp.type === "desktop");

      certResults.viewports.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        type: vp.type,
        metrics: vpMetrics
      });

      const mark = vpMetrics.passed ? "✔ PASS" : "✖ FAIL";
      console.log(`   [${mark}] ${vp.name.padEnd(28)} => ${JSON.stringify(vpMetrics)}`);
      if (!vpMetrics.passed) certResults.allPassed = false;

      // Screenshots especiais para evidência
      if (vp.width === 1920) {
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_14_a_shell_1920x1080.png") });
      }
      if (vp.width === 390) {
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_14_a_shell_mobile_390x844.png") });
      }
    }

    // 3. Testar Zooms no viewport do operador (1277x653)
    console.log("\n3. Executando testes nos 5 níveis de Zoom (1277x653)...");
    for (const zoom of ZOOMS) {
      // Ajustar viewport virtual para simular zoom
      const effectiveW = Math.round(1277 / zoom);
      const effectiveH = Math.round(653 / zoom);
      await page.setViewport({ width: effectiveW, height: effectiveH, deviceScaleFactor: zoom });
      await new Promise(r => setTimeout(r, 300));

      const isDesktopMode = effectiveW >= 1024;
      const zoomMetrics = await page.evaluate((isDesktop) => {
        const sidebar = document.querySelector('.a26-shell__sidebar');
        const topbar = document.querySelector('.a26-shell__topbar');
        if (!topbar) return { error: "Missing topbar" };

        const tStyle = window.getComputedStyle(topbar);
        const tRect = topbar.getBoundingClientRect();

        if (isDesktop) {
          if (!sidebar) return { error: "Missing sidebar in desktop" };
          const sStyle = window.getComputedStyle(sidebar);
          const sRect = sidebar.getBoundingClientRect();

          const seamFlush = Math.abs(tRect.left - sRect.right) < 2;
          const topCornerStraight = sStyle.borderTopRightRadius === '0px';
          const topbarBottomLeftStraight = tStyle.borderBottomLeftRadius === '0px';

          return {
            mode: "desktop",
            zoom: window.devicePixelRatio,
            seamFlush,
            topCornerStraight,
            topbarBottomLeftStraight,
            gap: tRect.left - sRect.right,
            passed: seamFlush && topCornerStraight && topbarBottomLeftStraight
          };
        } else {
          // Em zoom alto (>= 125% em 1277px), viewport efetivo entra em modo tablet/mobile (< 1024px)
          const sidebarHidden = !sidebar || window.getComputedStyle(sidebar).display === 'none';
          const topbarSymmetrical = tStyle.borderBottomLeftRadius === '20px' && tStyle.borderBottomRightRadius === '20px';
          const fullWidth = Math.abs(tRect.width - window.innerWidth) < 2;

          return {
            mode: "responsive-adaptive",
            zoom: window.devicePixelRatio,
            sidebarHidden,
            topbarSymmetrical,
            fullWidth,
            topbarRadius: tStyle.borderRadius,
            passed: sidebarHidden && topbarSymmetrical && fullWidth
          };
        }
      }, isDesktopMode);

      certResults.zooms.push({ zoom: `${Math.round(zoom * 100)}%`, effectiveWidth: effectiveW, metrics: zoomMetrics });
      const mark = zoomMetrics.passed ? "✔ PASS" : "✖ FAIL";
      console.log(`   [${mark}] Zoom ${String(Math.round(zoom * 100) + "%").padEnd(6)} (eff: ${effectiveW}px) => ${JSON.stringify(zoomMetrics)}`);
      if (!zoomMetrics.passed) certResults.allPassed = false;
    }

    // 4. Testar Tema Claro (Light Mode)
    console.log("\n4. Testando Tema Claro (Light Mode)...");
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      document.documentElement.classList.add("a26-theme-light");
      document.body.classList.add("a26-theme-light");
    });
    await new Promise(r => setTimeout(r, 500));

    const lightMetrics = await page.evaluate(() => {
      const sidebar = document.querySelector('.a26-shell__sidebar');
      const topbar = document.querySelector('.a26-shell__topbar');
      const sStyle = window.getComputedStyle(sidebar);
      const tStyle = window.getComputedStyle(topbar);
      const sRect = sidebar.getBoundingClientRect();
      const tRect = topbar.getBoundingClientRect();

      const seamFlush = Math.abs(tRect.left - sRect.right) < 1;
      const topCornerStraight = sStyle.borderTopRightRadius === '0px';
      const bottomCornerCurved = sStyle.borderBottomRightRadius === '20px';
      const topbarBottomLeftStraight = tStyle.borderBottomLeftRadius === '0px';
      const topbarBottomRightCurved = tStyle.borderBottomRightRadius === '20px';

      return {
        theme: "light",
        seamFlush,
        topCornerStraight,
        bottomCornerCurved,
        topbarBottomLeftStraight,
        topbarBottomRightCurved,
        sidebarRadius: sStyle.borderRadius,
        topbarRadius: tStyle.borderRadius,
        gap: tRect.left - sRect.right,
        passed: seamFlush && topCornerStraight && bottomCornerCurved && topbarBottomLeftStraight && topbarBottomRightCurved
      };
    });

    certResults.themes.push(lightMetrics);
    const lightMark = lightMetrics.passed ? "✔ PASS" : "✖ FAIL";
    console.log(`   [${lightMark}] Light Mode => ${JSON.stringify(lightMetrics)}`);
    if (!lightMetrics.passed) certResults.allPassed = false;

    // Capturar screenshots em Light Mode
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_18_14_a_shell_light.png") });
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "p0_18_14_a_seam_light.png"),
      clip: { x: 176, y: 0, width: 320, height: 160 }
    });
    console.log("   Screenshots Light Mode salvas.");

    // Salvar relatório JSON
    const reportPath = path.join(ARTIFACTS_DIR, "P0.18.14_A_RESPONSIVE_CERTIFICATION_RESULTS.json");
    fs.writeFileSync(reportPath, JSON.stringify(certResults, null, 2));
    console.log(`\nCertificação salva com sucesso em: ${reportPath}`);
    console.log(`Veredito Geral: ${certResults.allPassed ? "TOTALMENTE APROVADO (GO-PREVIEW)" : "REPROVADO"}`);

    return certResults;
  } finally {
    await browser.close();
    try { fs.rmSync(runProfile, { recursive: true, force: true }); } catch (_) {}
  }
}

runMultideviceCertification().catch(err => {
  console.error("Erro fatal na certificação:", err);
  process.exit(1);
});

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

async function runVisualAudit() {
  console.log("=== P0.15: AUDITORIA VISUAL E RESPONSIVA DO DASHBOARD (AETERNUM 26) ===\n");

  const demoEmail = "demo.institucional@aeternumatlas.com";
  const demoPassword = getCredential("AeternumAtlas:DemoAccount");
  const userId = "5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f";

  if (!demoPassword) {
    throw new Error("Credenciais do estudante demo não encontradas no Credential Manager (AeternumAtlas:DemoAccount).");
  }

  // Liberar sessões ativas da conta demo para First Session Wins
  console.log("[SESSÃO] Limpando sessões ativas residuais do estudante demo no Supabase...");
  await runSupabaseSql(`
    DELETE FROM public.user_active_sessions 
    WHERE user_id = '${userId}';
  `);

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p015_" + Date.now());
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

    // 1. Login
    console.log(`[LOGIN] Acessando ${DOMAIN}/login...`);
    await page.goto(`${DOMAIN}/login`, { waitUntil: "networkidle2", timeout: 30000 });

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
    if (!submitBtn) throw new Error("Botão de submit de login não encontrado.");
    await submitBtn.click();

    console.log("[LOGIN] Submetido. Aguardando chegada em /student/home...");
    await page.waitForFunction(() => window.location.pathname.includes("/student/home"), { timeout: 25000 });
    await new Promise(r => setTimeout(r, 3000));
    console.log("[LOGIN] Login efetuado com sucesso.");

    // Viewports list
    const viewports = [
      { name: "desktop_1920", width: 1920, height: 1080 },
      { name: "notebook_1366", width: 1366, height: 768 },
      { name: "tablet_768", width: 768, height: 1024 },
      { name: "mobile_390", width: 390, height: 844 }
    ];

    const visualAuditResults = {
      timestamp: new Date().toISOString(),
      viewports: {},
      domFindings: {},
      contrastFindings: []
    };

    // 2. Capture /student/home across 4 viewports
    for (const vp of viewports) {
      console.log(`\n[VIEWPORT] Testando ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 1200));

      const screenshotFile = `p0_15_viewport_${vp.name}.png`;
      const screenshotPath = path.join(ARTIFACTS_DIR, screenshotFile);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   Screenshot gravado: ${screenshotFile}`);

      // Avaliar overflow horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      visualAuditResults.viewports[vp.name] = {
        width: vp.width,
        height: vp.height,
        hasHorizontalScroll,
        screenshot: screenshotFile
      };
    }

    // 3. Inspeção detalhada de componentes de métricas (na resolução Desktop)
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise(r => setTimeout(r, 1000));

    // Inspecionar o que está visível no DOM do Dashboard
    const domMetrics = await page.evaluate(() => {
      const evolutionPanel = document.querySelector(".evolution-panel, [class*='evolution'], [class*='Evolution']");
      const strategicDonut = document.querySelector("[class*='StrategicProgress'], [class*='strategic-progress']");
      const weeklyChart = document.querySelector("[class*='WeeklyStudyChart'], [class*='weekly-study']");
      const statCards = Array.from(document.querySelectorAll("[class*='metric'], [class*='stat-card'], .grid > div")).map(el => ({
        text: ((el.innerText || "")).slice(0, 150).replace(/\n+/g, ' | '),
        className: el.className || ""
      }));

      // Textos de metas e percentuais visíveis
      const bodyText = document.body.innerText;
      const has48h = bodyText.includes("48h") || bodyText.includes("48 h");
      const has100Cards = bodyText.includes("100 flashcards") || bodyText.includes("100 cards");
      const has6Quizzes = bodyText.includes("6 simulados") || bodyText.includes("6 quizzes");
      const has500Questions = bodyText.includes("500") && bodyText.includes("Tutor");

      return {
        hasEvolutionPanel: !!evolutionPanel,
        hasStrategicDonut: !!strategicDonut,
        hasWeeklyChart: !!weeklyChart,
        has48h,
        has100Cards,
        has6Quizzes,
        has500Questions,
        statCardsCount: statCards.length,
        statCardsPreview: statCards.slice(0, 8)
      };
    });

    console.log("\n[DOM FINDINGS]:", JSON.stringify(domMetrics, null, 2));
    visualAuditResults.domFindings = domMetrics;

    // 4. Capturar componente específico de evolução/desempenho
    try {
      const panelHandle = await page.$("section, [class*='evolution'], [class*='dashboard-grid']");
      if (panelHandle) {
        const panelFile = path.join(ARTIFACTS_DIR, "p0_15_component_evolution_section.png");
        await panelHandle.screenshot({ path: panelFile });
        console.log(`   Screenshot da seção de evolução gravado.`);
      }
    } catch (e) {
      console.warn("Não foi possível recortar elemento específico:", e.message);
    }

    // 5. Visitar /progress e /academic-reports
    console.log(`\n[ROTA /progress] Navegando para ${DOMAIN}/progress...`);
    await page.goto(`${DOMAIN}/progress`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    const progressFile = path.join(ARTIFACTS_DIR, "p0_15_page_progress.png");
    await page.screenshot({ path: progressFile, fullPage: true });
    console.log(`   Screenshot de /progress gravado.`);

    console.log(`\n[ROTA /academic-reports] Navegando para ${DOMAIN}/academic-reports...`);
    await page.goto(`${DOMAIN}/academic-reports`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    const reportsFile = path.join(ARTIFACTS_DIR, "p0_15_page_academic_reports.png");
    await page.screenshot({ path: reportsFile, fullPage: true });
    console.log(`   Screenshot de /academic-reports gravado.`);

    // 6. Fazer logout limpo
    console.log(`\n[LOGOUT] Realizando logout para liberar sessão da conta demo...`);
    await page.goto(`${DOMAIN}/student/home`, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 1000));

    // Procurar botão de perfil ou logout
    await page.evaluate(() => {
      const logoutBtn = Array.from(document.querySelectorAll("button, a")).find(el => 
        el.innerText.toLowerCase().includes("sair") || 
        el.innerText.toLowerCase().includes("logout") ||
        el.getAttribute("aria-label")?.toLowerCase().includes("sair")
      );
      if (logoutBtn) logoutBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Salvar resultados do visual audit
    const outPath = path.join(ARTIFACTS_DIR, "p0_15_visual_audit_report.json");
    fs.writeFileSync(outPath, JSON.stringify(visualAuditResults, null, 2));
    console.log(`\n[SUCESSO] Auditoria visual e responsiva salva em: ${outPath}`);

  } finally {
    await browser.close();
    // Limpeza final de sessão no banco para garantir
    await runSupabaseSql(`
      DELETE FROM public.user_active_sessions 
      WHERE user_id = '${userId}';
    `);
    console.log("[SESSÃO] Limpeza pós-teste de sessões ativas concluída.");
  }
}

runVisualAudit().catch(err => {
  console.error("[ERRO NA AUDITORIA VISUAL]", err);
  process.exit(1);
});

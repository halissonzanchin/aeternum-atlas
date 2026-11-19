/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.10
 * FASE 2: PERÍCIA VISUAL COM NAVEGADOR REAL (COMPUTED STYLES & DENSIDADE)
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

async function auditPageTypography(page, routeName) {
  return await page.evaluate((rName) => {
    const textSelectors = [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "span", "strong", "small", "label",
      "button", "input", "textarea", "a",
      ".display-title", ".viewer-eyebrow", ".a26-text-kicker",
      ".a26-shell__brand-copy strong", ".a26-shell__sidebar-nav button",
      ".a26-shell__topbar h2", ".a26-badge", ".a26-button",
      ".node-label", ".metric-val", ".card-title"
    ];

    const elements = Array.from(document.querySelectorAll(textSelectors.join(",")));
    const recorded = [];
    const seen = new Set();

    for (const el of elements) {
      // Must be visible
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      
      const text = (el.innerText || el.textContent || el.placeholder || el.value || "").trim();
      if (!text || text.length === 0) continue;

      // Group / Deduplicate equivalent items on the same page
      const tag = el.tagName.toLowerCase();
      const className = (el.className && typeof el.className === "string") ? el.className.split(" ")[0] : "";
      const sig = `${tag}.${className}:${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`;
      if (seen.has(sig) && recorded.length > 50) continue;
      seen.add(sig);

      const cs = window.getComputedStyle(el);
      const isTruncated = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;

      // Classify semantic role
      let semanticRole = "body";
      if (tag === "h1" || tag === "h2" || tag === "h3" || className.includes("title")) semanticRole = "heading";
      else if (tag === "button" || className.includes("button") || className.includes("btn")) semanticRole = "button";
      else if (tag === "input" || tag === "textarea") semanticRole = "input";
      else if (className.includes("nav") || el.closest(".a26-shell__sidebar")) semanticRole = "navigation";
      else if (className.includes("topbar") || el.closest(".a26-shell__topbar")) semanticRole = "header";
      else if (className.includes("badge") || className.includes("kicker") || tag === "small") semanticRole = "metadata";
      else if (className.includes("metric") || className.includes("number")) semanticRole = "metric";

      recorded.push({
        route: rName,
        semanticRole,
        tag,
        selector: `${tag}${className ? '.' + className : ''}`,
        sampleText: text.substring(0, 45).replace(/\n/g, " "),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontSizePx: parseFloat(cs.fontSize),
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        color: cs.color,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        isTruncated
      });
    }

    return recorded;
  }, routeName);
}

async function runComputedTypographyAudit() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.18.10: AUDITORIA TIPOGRÁFICA EM NAVEGADOR REAL              ");
  console.log(` Target: ${BASE_URL} (Local Preview)                                            `);
  console.log("================================================================================\n");

  const qaEmail = TARGET_TEST_EMAIL;
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  const userId = TARGET_TEST_USER_ID;

  if (!qaPassword) {
    throw new Error("Credencial AeternumAtlas:AutomationTestAccount não encontrada.");
  }

  console.log("[PREPARAÇÃO] Resetando sessões da conta de teste...");
  await runSupabaseSql(
    `SELECT public.admin_reset_user_session('${userId}', 'p0_18_10_typo_audit_prep');`
  );

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_10_typo_" + Date.now());
  fs.mkdirSync(runProfile, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    userDataDir: runProfile,
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--window-size=1276,652"
    ]
  });

  const fullAudit = {
    timestamp: new Date().toISOString(),
    viewports: ["1276x652"],
    locales: ["pt-BR", "es"],
    routes: {},
    summary: {}
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1276, height: 652, deviceScaleFactor: 1 });

    // 1. Audit Public Route: Login
    console.log("[1/14] Auditando Rota Pública: /login...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    fullAudit.routes["/login"] = await auditPageTypography(page, "/login");

    // Authenticate
    console.log("[AUTH] Autenticando com conta de testes...");
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', qaEmail, { delay: 20 });
    await page.type('input[type="password"]', qaPassword, { delay: 20 });

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    else await page.keyboard.press("Enter");

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 25000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2500));

    // Mandatory Routes List
    const privateRoutes = [
      { path: "/student/home", name: "Início do Estudante" },
      { path: "/models", name: "Modelos 3D" },
      { path: "/atlas", name: "Atlas Anatômico" },
      { path: "/flashcards", name: "Flashcards" },
      { path: "/mind-map", name: "Mapa Mental" },
      { path: "/quizzes", name: "Simulados" },
      { path: "/study-agenda", name: "Agenda de Estudos" },
      { path: "/history", name: "Histórico Acadêmico" },
      { path: "/profile", name: "Perfil Estudantil" },
      { path: "/lessons", name: "Cursos e Lições" },
      { path: "/videos", name: "Vídeos e Mídia" },
      { path: "/admin/dashboard", name: "Painel Administrativo" },
      { path: "/ai-tutor", name: "Atlas AI Tutor" }
    ];

    let idx = 2;
    for (const r of privateRoutes) {
      console.log(`[${idx}/14] Auditando Rota Privada: ${r.path} (${r.name})...`);
      try {
        await page.goto(`${BASE_URL}${r.path}`, { waitUntil: "networkidle2", timeout: 20000 });
        await new Promise(res => setTimeout(res, 2000));
        fullAudit.routes[r.path] = await auditPageTypography(page, r.path);
      } catch (err) {
        console.warn(`Aviso: erro ao auditar ${r.path}:`, err.message);
        fullAudit.routes[r.path] = [];
      }
      idx++;
    }

    // Locale test: Switch to Spanish (es)
    console.log("[LOCALE] Testando extensão textual em Espanhol (es)...");
    await page.evaluate(() => {
      localStorage.setItem("aeternum_language", "es");
      window.location.reload();
    });
    await new Promise(r => setTimeout(r, 2500));
    fullAudit.routes["/student/home_es"] = await auditPageTypography(page, "/student/home_es");

    // Aggregate summary
    const allItems = Object.values(fullAudit.routes).flat();
    const roleStats = {};
    for (const item of allItems) {
      const role = item.semanticRole;
      if (!roleStats[role]) {
        roleStats[role] = {
          count: 0,
          fontSizesPx: [],
          fontWeights: new Set(),
          fontFamilies: new Set(),
          truncatedCount: 0
        };
      }
      roleStats[role].count++;
      roleStats[role].fontSizesPx.push(item.fontSizePx);
      roleStats[role].fontWeights.add(item.fontWeight);
      roleStats[role].fontFamilies.add(item.fontFamily);
      if (item.isTruncated) roleStats[role].truncatedCount++;
    }

    for (const [role, stats] of Object.entries(roleStats)) {
      const sizes = stats.fontSizesPx.sort((a,b) => a - b);
      stats.minSizePx = sizes[0] || 0;
      stats.maxSizePx = sizes[sizes.length - 1] || 0;
      stats.avgSizePx = Math.round(sizes.reduce((a,b) => a + b, 0) / sizes.length * 10) / 10;
      stats.fontWeights = Array.from(stats.fontWeights);
      stats.fontFamilies = Array.from(stats.fontFamilies);
      delete stats.fontSizesPx;
    }

    fullAudit.summary = {
      totalElementsAudited: allItems.length,
      roles: roleStats
    };

    console.log("\n--- Resumo dos Elementos Computados por Papel Semântico ---");
    console.table(Object.entries(roleStats).map(([role, s]) => ({
      Papel: role,
      Qtd: s.count,
      MinPx: s.minSizePx,
      MaxPx: s.maxSizePx,
      MedioPx: s.avgSizePx,
      Truncados: s.truncatedCount
    })));

    const outPath = path.join(ARTIFACTS_DIR, "P0.18.10_INVENTARIO_COMPUTED_STYLES.json");
    fs.writeFileSync(outPath, JSON.stringify(fullAudit, null, 2));
    console.log(`\nInventário computado salvo em: ${outPath}`);

  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(runProfile, { recursive: true, force: true });
    await runSupabaseSql(
      `SELECT public.admin_reset_user_session('${userId}', 'p0_18_10_typo_audit_teardown');`
    ).catch(() => {});
  }
}

runComputedTypographyAudit().catch(err => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});

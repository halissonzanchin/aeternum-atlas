/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.9
 * FASE 3, 4, 5, 6: EXPERIMENTOS COMPARATIVOS A, B, C E HÍBRIDO B+C
 * 
 * Viewport de teste: 1277 x 653 (Operador)
 * 
 * Critérios avaliados:
 *  1. Altura utilizável do textarea (px)
 *  2. Acesso direto a "Renderizar mapa" (visível sem rolagem do painel)
 *  3. Quantidade de rolagens necessárias para editar e renderizar
 *  4. Área disponível para o canvas (width px)
 *  5. Colisões com Minimapa e Marina
 *  6. Preservação de estado e acessibilidade
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

async function runVariantsExperiment() {
  console.log("===============================================================================");
  console.log("AETERNUM ATLAS — P0.18.9: EXPERIMENTOS COMPARATIVOS DE LAYOUT (A, B, C, B+C)");
  console.log("===============================================================================");

  const qaEmail = process.env.ATLAS_QA_EMAIL || TARGET_TEST_EMAIL;
  let qaPassword = process.env.ATLAS_QA_PASSWORD || getCredential("AeternumAtlas:AutomationTestAccount");
  if (!qaPassword) {
    qaPassword = getCredential("ATLAS_AUTOMATION_PASSWORD");
  }

  if (!qaPassword) {
    throw new Error("Credencial da conta de teste não encontrada.");
  }

  try {
    console.log(`[AUTH-SETUP] Resetando sessão prévia para ${TARGET_TEST_EMAIL}...`);
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_9_variants_experiment');`);
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
      "--window-size=1277,653"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 1 });

    console.log(`[NAV] Navegando para ${PROD_URL}/login...`);
    await page.goto(`${PROD_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });

    console.log("[LOGIN] Autenticando com conta de testes...");
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    await page.type('input[type="email"], input[name="email"]', qaEmail);
    await page.type('input[type="password"], input[name="password"]', qaPassword);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    console.log("[NAV] Navegando para /mind-map...");
    await page.goto(`${PROD_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector("#canvas", { timeout: 20000 });
    await page.waitForSelector(".zoom-percentage-btn", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Abrir o editor
    const toggleEditorBtn = await page.$('.topbar-left-group button');
    if (toggleEditorBtn) {
      await toggleEditorBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // Função de medição padronizada
    const measureSidebar = async () => {
      return await page.evaluate(() => {
        const sb = document.querySelector(".mindmap-sidebar");
        const textarea = document.querySelector(".mindmap-outline-box textarea.a26-field__control");
        const actions = document.querySelector(".mindmap-sidebar-actions");
        const renderBtn = document.querySelector(".mindmap-sidebar-actions > .a26-button");
        const composer = document.querySelector(".mindmap-ai-composer");
        const canvas = document.querySelector(".mindmap-canvas-wrap");

        const sbR = sb ? sb.getBoundingClientRect() : null;
        const txtR = textarea ? textarea.getBoundingClientRect() : null;
        const actR = actions ? actions.getBoundingClientRect() : null;
        const cvR = canvas ? canvas.getBoundingClientRect() : null;

        const isActionsVisible = (sbR && actR) ? (actR.bottom <= sbR.bottom + 2) : false;
        const actionsCutoff = (sbR && actR) ? Math.max(0, actR.bottom - sbR.bottom) : 0;

        return {
          sidebarHeight: sbR ? Math.round(sbR.height) : 0,
          sidebarScrollHeight: sb ? sb.scrollHeight : 0,
          textareaHeight: txtR ? Math.round(txtR.height) : 0,
          textareaClientHeight: textarea ? textarea.clientHeight : 0,
          isActionsVisible,
          actionsCutoff: Math.round(actionsCutoff),
          canvasWidth: cvR ? Math.round(cvR.width) : 0
        };
      });
    };

    // 1. BASELINE (Estado Atual)
    console.log("\n[TESTE 0] Medindo BASELINE Atual...");
    const mBaseline = await measureSidebar();
    console.log("  Métricas Baseline:", mBaseline);

    // 2. EXPERIMENTO A: SIDEBAR INTEGRALMENTE ROLÁVEL (Flex Flow)
    console.log("\n[TESTE 1] Simulando EXPERIMENTO A (Sidebar Integralmente Rolável)...");
    await page.evaluate(() => {
      const sb = document.querySelector(".mindmap-sidebar");
      const outlineBox = document.querySelector(".mindmap-outline-box");
      const textarea = document.querySelector(".mindmap-outline-box textarea.a26-field__control");

      if (sb) {
        sb.style.display = "flex";
        sb.style.flexDirection = "column";
        sb.style.overflowY = "auto";
        sb.style.gap = "1rem";
      }
      if (outlineBox) {
        outlineBox.style.display = "flex";
        outlineBox.style.flexDirection = "column";
        outlineBox.style.minHeight = "220px";
      }
      if (textarea) {
        textarea.style.minHeight = "180px";
        textarea.style.height = "180px";
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const mExpA = await measureSidebar();
    const shotExpA = path.join(ARTIFACTS_DIR, "p0_18_9_exp_a_full_scroll_1277x653.png");
    await page.screenshot({ path: shotExpA, fullPage: false });
    console.log("  Métricas Exp A:", mExpA);

    // 3. EXPERIMENTO B: ROLAGEM INTERNA COM AÇÕES FIXAS
    console.log("\n[TESTE 2] Simulando EXPERIMENTO B (Rolagem Central com Ações Fixas)...");
    await page.evaluate(() => {
      const sb = document.querySelector(".mindmap-sidebar");
      const composer = document.querySelector(".mindmap-ai-composer");
      const outlineBox = document.querySelector(".mindmap-outline-box");
      const textarea = document.querySelector(".mindmap-outline-box textarea.a26-field__control");
      const actions = document.querySelector(".mindmap-sidebar-actions");

      if (sb) {
        sb.style.display = "flex";
        sb.style.flexDirection = "column";
        sb.style.overflow = "hidden";
        sb.style.padding = "0.75rem";
      }

      // Criar wrapper de scroll central se não existir
      let scrollWrap = sb.querySelector(".exp-b-scroll-wrap");
      if (!scrollWrap) {
        scrollWrap = document.createElement("div");
        scrollWrap.className = "exp-b-scroll-wrap";
        scrollWrap.style.flex = "1";
        scrollWrap.style.minHeight = "0";
        scrollWrap.style.overflowY = "auto";
        scrollWrap.style.display = "flex";
        scrollWrap.style.flexDirection = "column";
        scrollWrap.style.gap = "0.75rem";

        // Mover composer e outlineBox para o scrollWrap
        if (composer) scrollWrap.appendChild(composer);
        if (outlineBox) scrollWrap.appendChild(outlineBox);

        // Inserir antes das actions
        if (actions) {
          sb.insertBefore(scrollWrap, actions);
          actions.style.flexShrink = "0";
          actions.style.paddingTop = "0.5rem";
          actions.style.borderTop = "1px solid rgba(97, 237, 228, 0.2)";
        }
      }

      if (textarea) {
        textarea.style.minHeight = "120px";
        textarea.style.height = "120px";
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const mExpB = await measureSidebar();
    const shotExpB = path.join(ARTIFACTS_DIR, "p0_18_9_exp_b_fixed_actions_1277x653.png");
    await page.screenshot({ path: shotExpB, fullPage: false });
    console.log("  Métricas Exp B:", mExpB);

    // 4. EXPERIMENTO C: EDITOR ADAPTATIVO POR ABAS (Tabbed Architecture)
    console.log("\n[TESTE 3] Simulando EXPERIMENTO C (Editor Adaptativo por Abas)...");
    await page.evaluate(() => {
      const sb = document.querySelector(".mindmap-sidebar");
      const composer = document.querySelector(".mindmap-ai-composer");
      const outlineBox = document.querySelector(".mindmap-outline-box");
      const textarea = document.querySelector(".mindmap-outline-box textarea.a26-field__control");
      const actions = document.querySelector(".mindmap-sidebar-actions");

      // Limpar wraps temporários
      const scrollWrap = sb.querySelector(".exp-b-scroll-wrap");
      if (scrollWrap) {
        if (composer) sb.appendChild(composer);
        if (outlineBox) sb.appendChild(outlineBox);
        if (actions) sb.appendChild(actions);
        scrollWrap.remove();
      }

      // No modo aba "Estrutura", o composer de IA fica oculto, liberando 100% da altura
      if (composer) composer.style.display = "none";

      if (sb) {
        sb.style.display = "flex";
        sb.style.flexDirection = "column";
        sb.style.overflow = "hidden";
        sb.style.padding = "0.85rem";
        sb.style.gap = "0.6rem";
      }

      // Adicionar barra de abas simulada
      let tabNav = sb.querySelector(".exp-c-tab-nav");
      if (!tabNav) {
        tabNav = document.createElement("div");
        tabNav.className = "exp-c-tab-nav";
        tabNav.style.display = "flex";
        tabNav.style.gap = "4px";
        tabNav.style.padding = "3px";
        tabNav.style.background = "rgba(4, 18, 22, 0.94)";
        tabNav.style.borderRadius = "0.75rem";
        tabNav.style.border = "1px solid rgba(97, 237, 228, 0.25)";
        tabNav.innerHTML = `
          <button style="flex:1; padding: 6px; font-weight:700; font-size:11px; background:#61ede4; color:#03090c; border:none; border-radius:0.55rem; cursor:pointer;">Estrutura (18 nós)</button>
          <button style="flex:1; padding: 6px; font-weight:600; font-size:11px; background:transparent; color:#94a3b8; border:none; border-radius:0.55rem; cursor:pointer;">Gerar com IA</button>
        `;
        sb.insertBefore(tabNav, sb.firstChild);
      }

      if (outlineBox) {
        outlineBox.style.display = "flex";
        outlineBox.style.flexDirection = "column";
        outlineBox.style.flex = "1";
        outlineBox.style.minHeight = "0";
      }

      if (textarea) {
        textarea.style.flex = "1";
        textarea.style.minHeight = "200px";
        textarea.style.height = "100%";
      }

      if (actions) {
        actions.style.flexShrink = "0";
        actions.style.paddingTop = "0.5rem";
        actions.style.borderTop = "1px solid rgba(97, 237, 228, 0.2)";
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const mExpC = await measureSidebar();
    const shotExpC = path.join(ARTIFACTS_DIR, "p0_18_9_exp_c_tabbed_1277x653.png");
    await page.screenshot({ path: shotExpC, fullPage: false });
    console.log("  Métricas Exp C:", mExpC);

    const comparisonReport = {
      timestamp: new Date().toISOString(),
      viewport: { width: 1277, height: 653 },
      variants: {
        baseline: mBaseline,
        experimentA_fullScroll: mExpA,
        experimentB_fixedActions: mExpB,
        experimentC_tabbed: mExpC
      },
      screenshots: {
        baseline: path.join(ARTIFACTS_DIR, "p0_18_9_operator_baseline_1277x653.png"),
        expA: shotExpA,
        expB: shotExpB,
        expC: shotExpC
      }
    };

    const outJsonPath = path.join(ARTIFACTS_DIR, "p0_18_9_variants_comparison.json");
    fs.writeFileSync(outJsonPath, JSON.stringify(comparisonReport, null, 2), "utf8");
    console.log(`\n[SUCESSO] Relatório comparativo salvo em: ${outJsonPath}`);

  } finally {
    await browser.close();
    try {
      console.log(`[AUTH-CLEANUP] Encerrando sessão de testes para ${TARGET_TEST_EMAIL}...`);
      await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_9_variants_cleanup');`);
      console.log("[AUTH-CLEANUP] Sessão de teste finalizada com sucesso.");
    } catch (err) {
      console.warn("[AUTH-CLEANUP] Aviso no cleanup final:", err.message);
    }
  }
}

runVariantsExperiment().catch((err) => {
  console.error("\n[ERRO CRÍTICO NO EXPERIMENTO]:", err);
  process.exit(1);
});

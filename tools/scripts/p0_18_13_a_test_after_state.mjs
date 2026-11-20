/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.18.13-A
 * VERIFICAÇÃO GEOMÉTRICA DO MODAL "ESTRUTURA EDITÁVEL" — AFTER STATE
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

async function runAfterVerification() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.18.13-A: PERÍCIA GEOMÉTRICA DO MODAL EXPANDIDO (AFTER)     ");
  console.log("================================================================================\n");

  const qaEmail = TARGET_TEST_EMAIL;
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  const userId = TARGET_TEST_USER_ID;

  console.log("[PREPARAÇÃO] Resetando sessões residuais no Supabase...");
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${userId}', 'p0_18_13_a_after_prep');`);

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_13_a_after_" + Date.now());
  fs.mkdirSync(runProfile, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    userDataDir: runProfile,
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--ignore-certificate-errors",
      "--window-size=1277,653"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 1 });

  try {
    console.log("--> [1/4] Autenticando...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    await page.type('input[type="email"]', qaEmail, { delay: 15 });
    await page.type('input[type="password"]', qaPassword, { delay: 15 });
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));
    console.log("   Autenticado com sucesso. Navegando para /mind-map...");

    await page.goto(`${BASE_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log("--> [2/4] Abrindo barra lateral e aba Estrutura...");
    await page.waitForSelector('.mindmap-topbar', { visible: true, timeout: 10000 });
    const isCollapsed = await page.evaluate(() => {
      const sb = document.querySelector('.mindmap-sidebar');
      return sb ? sb.classList.contains('collapsed') : true;
    });
    if (isCollapsed) {
      const toggleBtn = await page.$('.topbar-left-group button');
      if (toggleBtn) {
        await toggleBtn.click();
        await page.waitForFunction(() => {
          const sb = document.querySelector('.mindmap-sidebar');
          return sb && !sb.classList.contains('collapsed');
        }, { timeout: 5000 });
        await new Promise(r => setTimeout(r, 600));
      }
    }

    const structureTabBtn = await page.$('#tab-structure');
    if (structureTabBtn) {
      await structureTabBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }

    await page.waitForSelector('.mindmap-outline-expand', { visible: true, timeout: 5000 });

    console.log("--> [3/4] Clicando no botão Ampliar para abrir o modal...");
    const expandBtn = await page.$('.mindmap-outline-expand');
    if (!expandBtn) {
      throw new Error("Botão .mindmap-outline-expand não encontrado!");
    }
    await expandBtn.click();
    await new Promise(r => setTimeout(r, 800));

    await page.waitForSelector('.mindmap-editor-modal', { visible: true, timeout: 5000 });
    console.log("   Modal .mindmap-editor-modal renderizado.");

    console.log("--> [4/4] Realizando perícia geométrica completa...");
    const forensicData = await page.evaluate(() => {
      const getMetrics = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        return {
          tagName: el.tagName,
          className: el.className,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            left: Math.round(rect.left),
            right: Math.round(rect.right)
          },
          scroll: {
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            scrollTop: el.scrollTop,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            scrollLeft: el.scrollLeft,
            hasVerticalScroll: el.scrollHeight > el.clientHeight + 1,
            hasHorizontalScroll: el.scrollWidth > el.clientWidth + 1
          },
          computed: {
            display: cs.display,
            position: cs.position,
            overflowY: cs.overflowY,
            overflowX: cs.overflowX,
            maxHeight: cs.maxHeight,
            minHeight: cs.minHeight,
            height: cs.height,
            padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
            margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
            border: cs.border,
            boxShadow: cs.boxShadow,
            backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter
          }
        };
      };

      const windowInfo = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        visualViewportHeight: window.visualViewport ? window.visualViewport.height : window.innerHeight,
        visualViewportWidth: window.visualViewport ? window.visualViewport.width : window.innerWidth
      };

      const backdrop = document.querySelector('.a26-modal-backdrop');
      const modal = document.querySelector('.a26-modal.mindmap-editor-modal');
      const header = modal ? modal.querySelector('.a26-modal__header') : null;
      const description = modal ? modal.querySelector('.a26-modal__description') : null;
      const content = modal ? modal.querySelector('.a26-modal__content') : null;
      const editor = modal ? modal.querySelector('.mindmap-expanded-editor') : null;
      const field = modal ? modal.querySelector('.mindmap-expanded-editor .a26-field') : null;
      const label = modal ? modal.querySelector('.a26-field__label') : null;
      const textarea = modal ? modal.querySelector('textarea.a26-field__control') : null;
      const hint = modal ? modal.querySelector('.a26-field__hint') : null;
      const footer = modal ? modal.querySelector('.a26-modal__actions') : null;
      const closeBtn = modal ? modal.querySelector('.a26-modal__header button, .a26-icon-button') : null;

      const buttons = footer ? Array.from(footer.querySelectorAll('button, .a26-button')).map(b => ({
        text: (b.innerText || '').trim(),
        ...getMetrics(b)
      })) : [];

      const modalRect = modal ? modal.getBoundingClientRect() : null;
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      const textareaRect = textarea ? textarea.getBoundingClientRect() : null;

      const anomalies = {
        isModalOuterScrollActive: modal ? modal.scrollHeight > modal.clientHeight + 1 : false,
        modalScrollDelta: modal ? modal.scrollHeight - modal.clientHeight : 0,
        isTextareaInnerScrollActive: textarea ? textarea.scrollHeight > textarea.clientHeight + 1 : false,
        textareaScrollDelta: textarea ? textarea.scrollHeight - textarea.clientHeight : 0,
        isFooterBeyondModalBottom: (footerRect && modalRect) ? footerRect.bottom > modalRect.bottom : false,
        isFooterBeyondWindowBottom: footerRect ? footerRect.bottom > window.innerHeight : false,
        isModalBeyondWindowBottom: modalRect ? modalRect.bottom > window.innerHeight : false,
        footerDistanceFromWindowBottom: footerRect ? window.innerHeight - footerRect.bottom : 0,
        textareaMinHeightComputed: textarea ? window.getComputedStyle(textarea).minHeight : null,
        textareaActualHeight: textareaRect ? textareaRect.height : 0,
        modalActualHeight: modalRect ? modalRect.height : 0,
        modalMaxHeightComputed: modal ? window.getComputedStyle(modal).maxHeight : null
      };

      return {
        windowInfo,
        backdrop: getMetrics(backdrop),
        modal: getMetrics(modal),
        header: getMetrics(header),
        description: getMetrics(description),
        content: getMetrics(content),
        editor: getMetrics(editor),
        field: getMetrics(field),
        label: getMetrics(label),
        textarea: getMetrics(textarea),
        hint: getMetrics(hint),
        footer: getMetrics(footer),
        closeBtn: getMetrics(closeBtn),
        buttons,
        anomalies
      };
    });

    console.log("\n=================== RESULTADOS FORENSES (AFTER) ===================");
    console.log("Window:", forensicData.windowInfo);
    console.log("Modal Height:", forensicData.modal?.rect.height, "ScrollHeight:", forensicData.modal?.scroll.scrollHeight, "ClientHeight:", forensicData.modal?.scroll.clientHeight);
    console.log("Anomalia Outer Scroll no Modal:", forensicData.anomalies.isModalOuterScrollActive, `(excesso de ${forensicData.anomalies.modalScrollDelta}px)`);
    console.log("Textarea Height:", forensicData.textarea?.rect.height, "MinHeight computada:", forensicData.anomalies.textareaMinHeightComputed);
    console.log("Textarea Inner Scroll Active:", forensicData.anomalies.isTextareaInnerScrollActive, `(excesso de ${forensicData.anomalies.textareaScrollDelta}px)`);
    console.log("Footer Beyond Window Bottom:", forensicData.anomalies.isFooterBeyondWindowBottom);
    console.log("Footer Beyond Modal Bottom:", forensicData.anomalies.isFooterBeyondModalBottom);
    console.log("Footer Distance From Window Bottom:", forensicData.anomalies.footerDistanceFromWindowBottom, "px");
    console.log("Botões:", forensicData.buttons.map(b => `${b.text} (y: ${b.rect.y}, h: ${b.rect.height})`).join(", "));
    console.log("===================================================================\n");

    const screenshotPath = path.join(ARTIFACTS_DIR, "p0_18_13_a_after_1277x653_100.png");
    await page.screenshot({ path: screenshotPath });
    console.log("Screenshot AFTER salvo em:", screenshotPath);

    const jsonPath = path.join(ARTIFACTS_DIR, "P0.18.13_A_AFTER_FORENSIC_METRICS.json");
    fs.writeFileSync(jsonPath, JSON.stringify(forensicData, null, 2), "utf8");
    console.log("Métricas AFTER salvas em:", jsonPath);

  } finally {
    await browser.close();
  }
}

runAfterVerification().catch(err => {
  console.error("Erro fatal na verificação AFTER:", err);
  process.exit(1);
});

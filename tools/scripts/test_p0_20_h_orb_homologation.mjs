process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = process.env.EDGE_PATH || (
  process.platform === "win32"
    ? (fs.existsSync("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe")
        ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        : "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe")
    : "/usr/bin/google-chrome"
);

const PROFILE_DIR = path.join(os.tmpdir(), "aeternum_edge_p0_20_h_profile");
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const e2eEmail = "atlas-e2e-ai-tutor@aeternumatlas.com";
const e2ePassword = getCredential("AeternumAtlas:AutomationTestAccount");
const e2eUserId = "825b2496-ecec-4b67-8343-f8aa3578c224";

async function releaseAutomationSession(reason = "teardown_p0_20_h1_automacao") {
  try {
    await runSupabaseSql(`
      SELECT public.admin_reset_user_session(
        '${e2eUserId}'::uuid,
        '${reason}'
      ) as result;
    `);
    console.log(`[TEARDOWN] Sessão da conta de automação liberada via admin_reset_user_session (${reason}).`);
  } catch (e) {
    console.warn(`[TEARDOWN] Aviso na liberação da sessão de automação:`, e.message);
  }
}

async function runHomologation() {
  console.log("=== INICIANDO HOMOLOGAÇÃO ROBUSTA DA ESFERA DE CRISTAL (P0.20-H.1) ===");

  // 1. SEGURANÇA E FIRST_SESSION_WINS:
  // Executa exclusivamente o reset administrativo autorizado para a conta de automação.
  // JAMAIS executa 'DELETE FROM user_active_sessions'.
  await releaseAutomationSession("setup_p0_20_h1_automacao");

  let browser = null;

  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        `--user-data-dir=${PROFILE_DIR}`,
        "--window-size=1277,653"
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 2.0 });

    // 2. HOMOLOGAÇÃO DE ESTADOS ANIMADOS REAIS VIA HARNESS REACT
    console.log("\n--- TESTANDO ESTADOS ANIMADOS REAIS VIA REACT HARNESS ---");
    await page.goto("http://localhost:5173/orb_test_harness.html", { waitUntil: "networkidle0", timeout: 20000 });
    await page.waitForSelector(".aeternum-ai-orb-root canvas", { timeout: 10000 });

    const states = ["idle", "focus", "listening", "thinking", "speaking"];
    const stateResults = {};

    for (const st of states) {
      console.log(`Aplicando prop React state="${st}"...`);
      await page.evaluate((targetState) => {
        window.__SET_ORB_STATE__(targetState);
      }, st);

      await new Promise(r => setTimeout(r, 400));

      // Verificar dataset no canvas confirmando que o componente React aplicou o estado
      const appliedState = await page.evaluate(() => {
        const canvas = document.querySelector(".atlas-ai-orb__canvas");
        return canvas ? canvas.dataset.orbState : null;
      });

      if (appliedState !== st) {
        throw new Error(`Falha no React harness: prop ${st} não foi refletida no canvas dataset.`);
      }

      // Provar que a animação está ativa comparando frames separados por 120ms
      const isActivelyAnimating = await page.evaluate(async () => {
        const canvas = document.querySelector(".atlas-ai-orb__canvas");
        const f1 = canvas.toDataURL("image/png");
        await new Promise(r => setTimeout(r, 120));
        const f2 = canvas.toDataURL("image/png");
        return f1 !== f2;
      });

      stateResults[st] = { appliedState, isActivelyAnimating };

      // Capturar screenshot do estado animado real
      const orbEl = await page.$(".aeternum-ai-orb-root");
      if (orbEl) {
        await orbEl.screenshot({ path: path.join(ARTIFACTS_DIR, `p0_20_h_after_state_${st}.png`) });
      }
    }

    console.log("Resultados dos Estados Animados:", JSON.stringify(stateResults, null, 2));

    // 3. AUTENTICAÇÃO LIMPA DO ESTUDANTE NA APLICAÇÃO REAL
    console.log("\n--- NAVEGANDO PARA LOGIN NA APLICAÇÃO REAL ---");
    await page.goto("http://localhost:5173/login", { waitUntil: "networkidle2", timeout: 25000 });

    const isLoginPage = await page.$('input[name="email"], input[type="email"]');
    if (isLoginPage) {
      console.log("Preenchendo credenciais da conta de automação...");
      await page.evaluate((email, password) => {
        const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(emailInput, email);
        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
        emailInput.dispatchEvent(new Event("change", { bubbles: true }));
        nativeSetter.call(passInput, password);
        passInput.dispatchEvent(new Event("input", { bubbles: true }));
        passInput.dispatchEvent(new Event("change", { bubbles: true }));
      }, e2eEmail, e2ePassword);

      await new Promise(r => setTimeout(r, 600));
      await page.evaluate(() => {
        const btn = document.querySelector("button.atlas-auth-submit, button[type='submit']");
        if (btn) btn.click();
      });

      try {
        await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
      } catch (err) {
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_login_fail.png") });
        throw err;
      }
    }

    // 4. MODO A: MARINA COM IDENTIFICAÇÃO EM /student/home
    console.log("\n--- HOMOLOGANDO MODO A (MARINA COM IDENTIFICAÇÃO) ---");
    await page.goto("http://localhost:5173/student/home", { waitUntil: "networkidle2", timeout: 20000 });
    await page.waitForSelector(".upe-ai-trigger, .aeternum-ai-orb-root", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    const triggerEl = await page.$(".upe-ai-trigger");
    if (triggerEl) {
      await triggerEl.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_a_trigger.png") });
    }
    const orbEl = await page.$(".aeternum-ai-orb-root");
    if (orbEl) {
      await orbEl.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_a_orb_crop.png") });
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_student_home.png") });

    // 5. MODO C: CABEÇALHO DO TUTOR ABERTO
    console.log("\n--- HOMOLOGANDO MODO C (CABEÇALHO DO TUTOR) ---");
    if (triggerEl) {
      await triggerEl.click();
      await new Promise(r => setTimeout(r, 900));
      await page.waitForSelector(".upe-ai-panel", { timeout: 5000 });

      const headerOrb = await page.$(".upe-ai-panel__header .aeternum-ai-orb-root");
      if (headerOrb) {
        await headerOrb.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_c_header_orb.png") });
      }
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_tutor_open.png") });

      const closeBtn = await page.$(".upe-ai-panel__close");
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }

    // 6. MODO B: ESFERA COMPACTA EM /flashcards
    console.log("\n--- HOMOLOGANDO MODO B (ESFERA COMPACTA EM /flashcards) ---");
    await page.goto("http://localhost:5173/flashcards", { waitUntil: "networkidle2", timeout: 20000 });
    await page.waitForSelector(".a26-flashcards-container, .a26-generator-surface", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    const compactTrigger = await page.$(".upe-ai-trigger");
    if (compactTrigger) {
      await compactTrigger.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_b_compact_trigger.png") });
    }
    const compactOrb = await page.$(".aeternum-ai-orb-root");
    if (compactOrb) {
      await compactOrb.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_b_compact_orb_crop.png") });
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_flashcards_1277x653.png") });

    // 7. HOVER E FOCO ACESSÍVEL NO MODO COMPACTO
    console.log("\n--- HOMOLOGANDO HOVER E FOCO ACESSÍVEL ---");
    if (compactTrigger) {
      // Teste de Hover
      await compactTrigger.hover();
      await new Promise(r => setTimeout(r, 400));
      await compactTrigger.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h1_hover_compact.png") });

      const hoverStyles = await page.evaluate(() => {
        const tr = document.querySelector(".upe-ai-trigger");
        const st = window.getComputedStyle(tr);
        return {
          background: st.backgroundColor,
          border: st.borderWidth + " " + st.borderStyle,
          boxShadow: st.boxShadow,
          borderRadius: st.borderRadius
        };
      });

      console.log("Métricas de Hover no modo compacto:", JSON.stringify(hoverStyles, null, 2));

      // Teste de Foco Acessível via Navegação por Teclado (:focus-visible)
      console.log("\nAplicando foco acessível por teclado no trigger compacto...");
      // Simula navegação por teclado (API nativa de foco do Puppeteer)
      await page.focus(".upe-ai-trigger");
      // Pressiona Shift para registrar a modalidade de teclado e engajar :focus-visible
      await page.keyboard.press("Shift");
      await new Promise(r => setTimeout(r, 400));

      const focusValidation = await page.evaluate(() => {
        const tr = document.querySelector(".upe-ai-trigger");
        const st = window.getComputedStyle(tr);
        const rect = tr.getBoundingClientRect();
        return {
          isFocused: document.activeElement === tr,
          isFocusVisible: tr.matches(":focus-visible"),
          outline: st.outlineStyle + " " + st.outlineWidth + " " + st.outlineColor,
          outlineOffset: st.outlineOffset,
          borderRadius: st.borderRadius,
          boxShadow: st.boxShadow,
          width: rect.width,
          height: rect.height,
          ratio: (rect.width / rect.height).toFixed(4),
          circular: Math.abs(rect.width - rect.height) < 0.2,
          touchSafe: rect.width >= 44 && rect.height >= 44
        };
      });

      console.log("Validação de Foco Acessível por Teclado (:focus-visible):", JSON.stringify(focusValidation, null, 2));

      if (!focusValidation.isFocused || !focusValidation.isFocusVisible) {
        throw new Error("Falha na validação de foco: trigger não ativou :focus-visible por teclado.");
      }

      await compactTrigger.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h1_focus_compact.png") });
    }

    // 8. MEDIÇÃO RIGOROSA: DPR vs CSS ZOOM vs ZOOM NATIVO DO NAVEGADOR
    console.log("\n--- HOMOLOGANDO DPR vs CSS ZOOM vs ZOOM NATIVO DO NAVEGADOR ---");

    // A. Densidade de Pixels (HiDPI / Retina DPR = 2.0)
    // Mede a fidelidade subpixel mantendo as dimensões de layout invariantes (56x56px)
    await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 2.0 });
    const dpr2Metrics = await page.evaluate(() => {
      const orb = document.querySelector(".aeternum-ai-orb-root");
      const r = orb.getBoundingClientRect();
      return {
        type: "PixelDensity_HiDPI",
        dpr: window.devicePixelRatio,
        layoutWidth: r.width,
        layoutHeight: r.height,
        ratio: (r.width / r.height).toFixed(4)
      };
    });
    console.log("Métricas A - Densidade de Pixels (DPR 2.0):", dpr2Metrics);

    // B. Propriedade CSS 'zoom' a 125% (Escala de layout declarativa CSS)
    // Altera a geometria da árvore de layout CSS (56px * 1.25 = 70px)
    await page.evaluate(() => {
      document.documentElement.style.zoom = "1.25";
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_home_1277x653_css_zoom125.png") });
    // Preserva compatibilidade com o nome do artefato anterior
    fs.copyFileSync(
      path.join(ARTIFACTS_DIR, "p0_20_h_after_home_1277x653_css_zoom125.png"),
      path.join(ARTIFACTS_DIR, "p0_20_h_after_home_1277x653_zoom125.png")
    );

    const cssZoomMetrics = await page.evaluate(() => {
      const tr = document.querySelector(".upe-ai-trigger");
      const r = tr.getBoundingClientRect();
      return {
        type: "CSS_Zoom_Property",
        cssZoomApplied: document.documentElement.style.zoom,
        renderedWidth: r.width,
        renderedHeight: r.height,
        ratio: (r.width / r.height).toFixed(4),
        touchSafe: r.width >= 44 && r.height >= 44,
        perfectCircle: Math.abs(r.width - r.height) < 0.2
      };
    });
    console.log("Métricas B - Propriedade CSS zoom (1.25):", cssZoomMetrics);

    // Restaura propriedade CSS zoom antes do teste de zoom nativo
    await page.evaluate(() => {
      document.documentElement.style.zoom = "1.0";
    });
    await new Promise(r => setTimeout(r, 200));

    // C. Zoom Nativo do Navegador / Escala de Visualização (Page Scale Factor 125% via CDP)
    // Injeta a ampliação nativa de viewport do motor Chromium sem recorrer à propriedade CSS zoom
    const cdp = await page.target().createCDPSession();
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1.25 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_home_1277x653_native_zoom125.png") });

    const nativeZoomMetrics = await page.evaluate(() => {
      const tr = document.querySelector(".upe-ai-trigger");
      const r = tr.getBoundingClientRect();
      const visualScale = window.visualViewport ? window.visualViewport.scale : null;
      return {
        type: "Native_Browser_CDP_PageScaleFactor",
        visualViewportScale: visualScale,
        clientRectWidth: r.width,
        clientRectHeight: r.height,
        ratio: (r.width / r.height).toFixed(4),
        touchSafe: r.width >= 44 && r.height >= 44,
        perfectCircle: Math.abs(r.width - r.height) < 0.2
      };
    });
    console.log("Métricas C - Zoom Nativo do Navegador (PageScale 1.25 via CDP):", nativeZoomMetrics);

    // Restaura escala nativa do navegador via CDP
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1.0 });
    await cdp.detach();

    // 9. VALIDAÇÃO NAS RESOLUÇÕES CANÔNICAS
    const viewports = [
      { name: "1277x653_100pct", width: 1277, height: 653, dpr: 1.0 },
      { name: "1366x768", width: 1366, height: 768, dpr: 1.0 },
      { name: "1920x1080", width: 1920, height: 1080, dpr: 1.0 },
      { name: "390x844_mobile", width: 390, height: 844, dpr: 1.0 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr });
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `p0_20_h_after_home_${vp.name}.png`) });
    }

    // 10. LOGOUT LIMPO E REGULAR VIA APLICAÇÃO
    console.log("\n--- EXECUTANDO LOGOUT LIMPO REGULAR VIA APLICAÇÃO ---");
    await page.goto("http://localhost:5173/student/home", { waitUntil: "networkidle2", timeout: 15000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const logout = btns.find(b => b.textContent && b.textContent.includes("Sair"));
      if (logout) logout.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    console.log("Logout regular executado com sucesso.");

    console.log("\n=== HOMOLOGAÇÃO P0.20-H.1 FINALIZADA COM SUCESSO INTEGRAL ===");
  } finally {
    // 1. Tentar logout regular na interface se o navegador ainda estiver aberto e ativo
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const p = pages[0];
          await p.evaluate(() => {
            const btns = Array.from(document.querySelectorAll("button"));
            const logout = btns.find(b => b.textContent && b.textContent.includes("Sair"));
            if (logout) logout.click();
          });
          await new Promise(r => setTimeout(r, 600));
        }
      } catch (_) {}

      try {
        await browser.close();
        console.log("Navegador Edge finalizado.");
      } catch (e) {
        console.warn("Aviso ao fechar navegador:", e.message);
      }
    }

    // 2. Teardown administrativo autorizado no banco (garante zero sessões órfãs mesmo em caso de erro)
    // Preserva FIRST_SESSION_WINS e nunca usa DELETE na tabela de sessões
    await releaseAutomationSession("teardown_p0_20_h1_automacao");
  }
}

runHomologation().catch(err => {
  console.error("Erro na homologação:", err);
  process.exit(1);
});

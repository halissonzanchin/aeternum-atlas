import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const VIEWPORTS = [
  { name: "1920x1080_desktop_fhd", width: 1920, height: 1080 },
  { name: "1440x900_desktop_mac", width: 1440, height: 900 },
  { name: "1366x768_desktop_hd", width: 1366, height: 768 },
  { name: "1280x720_desktop_compact", width: 1280, height: 720 },
  { name: "1024x768_tablet_landscape", width: 1024, height: 768 },
  { name: "768x1024_tablet_portrait", width: 768, height: 1024 },
  { name: "390x844_mobile_iphone", width: 390, height: 844 },
  { name: "360x800_mobile_compact", width: 360, height: 800 }
];

async function run() {
  console.log("=== INICIANDO HOMOLOGAÇÃO EMPÍRICA P0.21-UI.MASTER ===");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  const results = {
    home: {},
    beta: {},
    regressions: {}
  };

  try {
    // 1. AUDITORIA COMPLETA DA HOME
    console.log("\n--- TESTANDO HEADER DA HOME EM TODOS OS 8 VIEWPORTS ---");
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto("http://localhost:5173/", { waitUntil: "networkidle2" });
      await new Promise(r => setTimeout(r, 600));

      const homeMetrics = await page.evaluate(() => {
        const header = document.querySelector(".cinematic-public-header");
        const actions = document.querySelector(".public-actions");
        const lang = document.querySelector(".public-header-language");
        const login = document.querySelector(".public-login-button");
        const beta = document.querySelector(".public-beta-cta");
        const nav = document.querySelector(".public-home-nav");
        const logo = document.querySelector(".brand-lockup");
        const registerInHeader = Array.from(header?.querySelectorAll("button") || [])
          .some(b => b.textContent.includes("REGISTRAR"));

        const getBox = el => el ? {
          x: el.getBoundingClientRect().x,
          y: el.getBoundingClientRect().y,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
          right: el.getBoundingClientRect().right,
          bottom: el.getBoundingClientRect().bottom
        } : null;

        const langBox = getBox(lang);
        const loginBox = getBox(login);
        const betaBox = getBox(beta);
        const actionsBox = getBox(actions);

        // Checar sobreposição entre login e beta
        let buttonsOverlap = false;
        if (loginBox && betaBox) {
          buttonsOverlap = !(loginBox.right <= betaBox.x || betaBox.right <= loginBox.x);
        }

        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          headerVisible: !!header,
          registerInHeader,
          actionsBox,
          langBox,
          loginBox,
          betaBox,
          buttonsOverlap,
          langVisible: langBox && langBox.width > 0 && langBox.height > 0 && langBox.right <= window.innerWidth,
          betaVisible: betaBox && betaBox.width > 0 && betaBox.height > 0 && betaBox.right <= window.innerWidth,
          loginVisible: loginBox && loginBox.width > 0 && loginBox.height > 0
        };
      });

      results.home[vp.name] = homeMetrics;
      console.log(`[Home ${vp.name}] HorizScroll: ${homeMetrics.hasHorizontalScroll} | LangVis: ${homeMetrics.langVisible} | Overlap: ${homeMetrics.buttonsOverlap} | RegInHeader: ${homeMetrics.registerInHeader}`);

      // Screenshot do header da home
      const shotPath = path.join(ARTIFACTS_DIR, `audit_home_${vp.name}_after.png`);
      await page.screenshot({ path: shotPath });
    }

    // 2. AUDITORIA DA PÁGINA PROGRAMA BETA
    console.log("\n--- TESTANDO PÁGINA /PROGRAMA-BETA ---");
    for (const vp of [
      { name: "1440x900_desktop", width: 1440, height: 900 },
      { name: "1024x768_tablet_land", width: 1024, height: 768 },
      { name: "768x1024_tablet_port", width: 768, height: 1024 },
      { name: "390x844_mobile", width: 390, height: 844 }
    ]) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto("http://localhost:5173/programa-beta", { waitUntil: "networkidle2" });
      await new Promise(r => setTimeout(r, 600));

      const betaMetrics = await page.evaluate(() => {
        const shell = document.querySelector(".atlas-auth-shell--beta");
        const story = document.querySelector(".atlas-auth-story--beta");
        const card = document.querySelector(".atlas-auth-card--beta");
        const prelaunch = document.querySelector(".beta-prelaunch-banner");
        const prelaunchBtn = document.querySelector(".beta-submit-button--prelaunch");
        const consentTiles = document.querySelectorAll(".beta-consent-tile");

        // Checar alinhamento a laser das linhas do form
        const fullNameEl = document.querySelector('input[name="fullName"]');
        const emailEl = document.querySelector('input[name="email"]');
        const instEl = document.querySelector('input[name="institutionName"]');
        const courseEl = document.querySelector('input[name="course"]');

        const fnBox = fullNameEl ? fullNameEl.getBoundingClientRect() : null;
        const emBox = emailEl ? emailEl.getBoundingClientRect() : null;
        const instBox = instEl ? instEl.getBoundingClientRect() : null;
        const crBox = courseEl ? courseEl.getBoundingClientRect() : null;

        const row1DeltaY = (fnBox && emBox) ? Math.abs(fnBox.y - emBox.y) : null;
        const row2DeltaY = (instBox && crBox) ? Math.abs(instBox.y - crBox.y) : null;

        const storyBox = story ? story.getBoundingClientRect() : null;
        const cardBox = card ? card.getBoundingClientRect() : null;

        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          storyHeight: storyBox ? storyBox.height : 0,
          cardHeight: cardBox ? cardBox.height : 0,
          row1DeltaY,
          row2DeltaY,
          prelaunchVisible: !!prelaunch,
          prelaunchBtnText: prelaunchBtn ? prelaunchBtn.textContent.trim() : null,
          consentTilesCount: consentTiles.length
        };
      });

      results.beta[vp.name] = betaMetrics;
      console.log(`[Beta ${vp.name}] StoryHeight: ${betaMetrics.storyHeight}px | CardHeight: ${betaMetrics.cardHeight}px | Row1DeltaY: ${betaMetrics.row1DeltaY}px | PrelaunchBtn: "${betaMetrics.prelaunchBtnText}"`);

      // Viewport screenshot
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `audit_beta_${vp.name}_viewport_after.png`) });
      // Full page screenshot
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `audit_beta_${vp.name}_full_after.png`), fullPage: true });
    }

    // 3. REGRESSÃO EM /LOGIN E /REGISTER
    console.log("\n--- TESTANDO REGRESSÃO EM /LOGIN E /REGISTER ---");
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto("http://localhost:5173/login", { waitUntil: "networkidle2" });
    const loginOk = await page.evaluate(() => {
      const form = document.querySelector(".atlas-auth-card");
      return !!form && !document.querySelector(".atlas-auth-shell--beta");
    });
    results.regressions.login = { ok: loginOk };
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `audit_regression_login_after.png`) });

    await page.goto("http://localhost:5173/register", { waitUntil: "networkidle2" });
    const registerOk = await page.evaluate(() => {
      const form = document.querySelector(".atlas-auth-card");
      return !!form && !document.querySelector(".atlas-auth-shell--beta");
    });
    results.regressions.register = { ok: registerOk };
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `audit_regression_register_after.png`) });

    console.log(`[Regressões] Login intacto: ${loginOk} | Register intacto: ${registerOk}`);

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "p0_21_ui_master_homologation_results.json"),
      JSON.stringify(results, null, 2)
    );
    console.log("\n=== HOMOLOGAÇÃO CONCLUÍDA COM SUCESSO ===");
  } catch (err) {
    console.error("ERRO NA HOMOLOGAÇÃO:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();

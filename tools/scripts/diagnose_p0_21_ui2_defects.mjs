import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const VIEWPORTS = [
  { name: "2560x1440_ultrawide", width: 2560, height: 1440 },
  { name: "1920x1080_fhd", width: 1920, height: 1080 },
  { name: "1600x900_notebook_lg", width: 1600, height: 900 },
  { name: "1440x900_notebook", width: 1440, height: 900 },
  { name: "1366x768_notebook_hd", width: 1366, height: 768 },
  { name: "1280x720_notebook_compact", width: 1280, height: 720 },
  { name: "1180x820_intermediate", width: 1180, height: 820 },
  { name: "1024x768_tablet_land", width: 1024, height: 768 },
  { name: "820x1180_tablet_port", width: 820, height: 1180 },
  { name: "768x1024_tablet", width: 768, height: 1024 },
  { name: "430x932_phone_lg", width: 430, height: 932 },
  { name: "390x844_phone", width: 390, height: 844 },
  { name: "360x800_phone_compact", width: 360, height: 800 },
  { name: "320x568_small", width: 320, height: 568 }
];

async function diagnose() {
  console.log("=== INICIANDO DIAGNÓSTICO ESTRUTURAL P0.21-UI.2 ===");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  const results = {
    home: {},
    beta: {}
  };

  try {
    // 1. Diagnóstico do Header e Atlas 360 na Home
    console.log("\n--- AUDITANDO HEADER E ATLAS 360 DA HOME ---");
    for (const vp of [
      { name: "1440x900_notebook", width: 1440, height: 900 },
      { name: "1366x768_notebook_hd", width: 1366, height: 768 },
      { name: "1280x720_notebook_compact", width: 1280, height: 720 },
      { name: "1180x820_intermediate", width: 1180, height: 820 },
      { name: "1024x768_tablet_land", width: 1024, height: 768 },
      { name: "390x844_phone", width: 390, height: 844 }
    ]) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto("https://www.aeternumatlas.com/", { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 600));

      const homeAudit = await page.evaluate(() => {
        const header = document.querySelector(".cinematic-public-header");
        const logo = document.querySelector(".brand-lockup");
        const nav = document.querySelector(".public-home-nav");
        const navButtons = Array.from(document.querySelectorAll(".public-home-nav-button"));
        const actions = document.querySelector(".public-actions");
        const lang = document.querySelector(".public-header-language");
        const login = document.querySelector(".public-login-button");
        const beta = document.querySelector(".public-beta-cta");

        const getBox = el => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
            right: Math.round(r.right),
            bottom: Math.round(r.bottom),
            visible: r.width > 0 && r.height > 0 && window.getComputedStyle(el).display !== "none"
          };
        };

        const navBoxes = navButtons.map(b => ({
          text: b.textContent.trim(),
          box: getBox(b)
        }));

        const langBox = getBox(lang);
        const loginBox = getBox(login);
        const betaBox = getBox(beta);
        const navBox = getBox(nav);

        // Verificar sobreposição entre o último botão da nav (ex: Sobre Nós) e o idioma
        let navOverlapLang = false;
        let navOverlapDetail = null;
        if (langBox && langBox.visible) {
          for (const nb of navBoxes) {
            if (nb.box && nb.box.visible) {
              const overlap = !(nb.box.right <= langBox.x || langBox.right <= nb.box.x);
              if (overlap) {
                navOverlapLang = true;
                navOverlapDetail = `Botão "${nb.text}" [x:${nb.box.x}..${nb.box.right}] colide com Idioma [x:${langBox.x}..${langBox.right}]`;
                break;
              }
            }
          }
        }

        // Medir esferas do Atlas 360
        const orbitCore = document.querySelector(".p4-orbit-core");
        const planets = Array.from(document.querySelectorAll(".p4-planet"));
        const coreBox = getBox(orbitCore);
        const planetBoxes = planets.map((p, idx) => ({
          text: p.textContent.trim(),
          box: getBox(p)
        }));

        let planetCoreCollisions = [];
        if (coreBox) {
          for (const pb of planetBoxes) {
            if (pb.box) {
              const dx = (pb.box.x + pb.box.width / 2) - (coreBox.x + coreBox.width / 2);
              const dy = (pb.box.y + pb.box.height / 2) - (coreBox.y + coreBox.height / 2);
              const dist = Math.sqrt(dx * dx + dy * dy);
              const minDist = (pb.box.width / 2) + (coreBox.width / 2);
              if (dist < minDist) {
                planetCoreCollisions.push(`${pb.text}: dist ${Math.round(dist)}px < minDist ${Math.round(minDist)}px`);
              }
            }
          }
        }

        return {
          navVisible: navBox ? navBox.visible : false,
          navBox,
          langBox,
          loginBox,
          betaBox,
          navOverlapLang,
          navOverlapDetail,
          planetCoreCollisions,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });

      results.home[vp.name] = homeAudit;
      console.log(`[HOME ${vp.name}] NavVis: ${homeAudit.navVisible} | Overlap: ${homeAudit.navOverlapLang} (${homeAudit.navOverlapDetail || "Nenhum"}) | CoreCollisions: ${homeAudit.planetCoreCollisions.length}`);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `diag_home_${vp.name}.png`) });
    }

    // 2. Diagnóstico do Programa Beta (/programa-beta)
    console.log("\n--- AUDITANDO PAINEL ESQUERDO DO PROGRAMA BETA ---");
    for (const vp of [
      { name: "1440x900_notebook", width: 1440, height: 900 },
      { name: "1366x768_notebook_hd", width: 1366, height: 768 },
      { name: "1280x720_notebook_compact", width: 1280, height: 720 },
      { name: "1024x768_tablet_land", width: 1024, height: 768 },
      { name: "768x1024_tablet", width: 768, height: 1024 },
      { name: "390x844_phone", width: 390, height: 844 }
    ]) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto("https://www.aeternumatlas.com/programa-beta", { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 600));

      const betaAudit = await page.evaluate(() => {
        const story = document.querySelector(".atlas-auth-story--beta");
        const card = document.querySelector(".atlas-auth-card--beta");
        const statusBadge = document.querySelector(".atlas-auth-status");
        const capabilities = Array.from(document.querySelectorAll(".atlas-auth-capability"));

        const getBox = el => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
            right: Math.round(r.right),
            bottom: Math.round(r.bottom)
          };
        };

        const storyBox = getBox(story);
        const cardBox = getBox(card);
        const statusBox = getBox(statusBadge);
        const capBoxes = capabilities.map(c => getBox(c));

        const computedStyle = story ? window.getComputedStyle(story) : null;
        const isSticky = computedStyle?.position === "sticky";
        const hasScroll = story ? (story.scrollHeight > story.clientHeight + 2) : false;

        // Verificar se os filhos extrapolam a borda inferior do story
        let childrenOverflowStory = false;
        let overflowDetail = null;
        if (storyBox) {
          if (statusBox && statusBox.bottom > storyBox.bottom) {
            childrenOverflowStory = true;
            overflowDetail = `Status badge bottom (${statusBox.bottom}) > story bottom (${storyBox.bottom})`;
          }
          for (let i = 0; i < capBoxes.length; i++) {
            if (capBoxes[i] && capBoxes[i].bottom > storyBox.bottom) {
              childrenOverflowStory = true;
              overflowDetail = `Capability[${i}] bottom (${capBoxes[i].bottom}) > story bottom (${storyBox.bottom})`;
            }
          }
        }

        return {
          storyBox,
          cardBox,
          isSticky,
          hasInternalScroll: hasScroll,
          scrollHeight: story ? story.scrollHeight : 0,
          clientHeight: story ? story.clientHeight : 0,
          childrenOverflowStory,
          overflowDetail,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });

      results.beta[vp.name] = betaAudit;
      console.log(`[BETA ${vp.name}] Sticky: ${betaAudit.isSticky} | InternalScroll: ${betaAudit.hasInternalScroll} (ScrollH: ${betaAudit.scrollHeight}px vs ClientH: ${betaAudit.clientHeight}px) | ChildOverflow: ${betaAudit.childrenOverflowStory} (${betaAudit.overflowDetail || "Nenhum"})`);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `diag_beta_${vp.name}.png`), fullPage: true });
    }

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "p0_21_ui2_baseline_diagnosis.json"),
      JSON.stringify(results, null, 2)
    );
    console.log("\n=== DIAGNÓSTICO CONCLUÍDO COM SUCESSO ===");
  } catch (err) {
    console.error("ERRO NO DIAGNÓSTICO:", err);
  } finally {
    await browser.close();
  }
}

diagnose();
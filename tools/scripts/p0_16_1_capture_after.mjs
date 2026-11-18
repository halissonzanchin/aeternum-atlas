import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const BASE_URL = "http://localhost:5173/preview-surfaces.html";

async function run() {
  console.log("=== CAPTURANDO ESTADO POSTERIOR (AFTER) DAS SUPERFÍCIES FROSTED CRYSTAL ===");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--ignore-certificate-errors"]
  });

  try {
    const page = await browser.newPage();

    // 1. Notificações Aberto (AFTER - Dark Mode Desktop 1440x900)
    console.log("Capturando Central de Notificações (AFTER - Dark Mode 1440x900)...");
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}?view=notifications`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      localStorage.setItem("aeternum_theme", "dark");
      document.documentElement.className = "a26-theme-dark";
      document.body.className = "a26-theme-dark";
    });
    await new Promise(r => setTimeout(r, 600));
    const notifPath = path.join(ARTIFACTS_DIR, "p0_16_1_notification_popover_after.png");
    await page.screenshot({ path: notifPath });
    console.log("Salvo:", notifPath);

    // 2. Perfil Popover (AFTER - Dark Mode Desktop 1440x900)
    console.log("Capturando Perfil Popover (AFTER - Dark Mode 1440x900)...");
    await page.goto(`${BASE_URL}?view=profile`, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 600));
    const profilePath = path.join(ARTIFACTS_DIR, "p0_16_1_profile_popover_after.png");
    await page.screenshot({ path: profilePath });
    console.log("Salvo:", profilePath);

    // 3. Modal Aberto (AFTER - Dark Mode Desktop 1440x900)
    console.log("Capturando Modal de Leitura (AFTER - Dark Mode 1440x900)...");
    await page.goto(`${BASE_URL}?view=modal`, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 600));
    const modalPath = path.join(ARTIFACTS_DIR, "p0_16_1_modal_after.png");
    await page.screenshot({ path: modalPath });
    console.log("Salvo:", modalPath);

    // 4. Notificações Aberto (AFTER - Light Mode Desktop 1440x900)
    console.log("Capturando Central de Notificações (AFTER - Light Mode 1440x900)...");
    await page.goto(`${BASE_URL}?view=notifications`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      localStorage.setItem("aeternum_theme", "light");
      document.documentElement.className = "a26-theme-light";
      document.body.className = "a26-theme-light";
    });
    await new Promise(r => setTimeout(r, 600));
    const lightPath = path.join(ARTIFACTS_DIR, "p0_16_1_notification_popover_light.png");
    await page.screenshot({ path: lightPath });
    console.log("Salvo:", lightPath);

    // Reverter para dark mode para os testes responsivos
    await page.evaluate(() => {
      localStorage.setItem("aeternum_theme", "dark");
      document.documentElement.className = "a26-theme-dark";
      document.body.className = "a26-theme-dark";
    });

    // 5. Responsividade nos Viewports
    const viewports = [
      { name: "mobile_390", width: 390, height: 844 },
      { name: "tablet_768", width: 768, height: 1024 },
      { name: "notebook_1366", width: 1366, height: 768 },
      { name: "desktop_1920", width: 1920, height: 1080 }
    ];

    for (const vp of viewports) {
      console.log(`Capturando Viewport ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      await page.goto(`${BASE_URL}?view=notifications`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 600));
      const vpPath = path.join(ARTIFACTS_DIR, `p0_16_1_responsive_${vp.name}.png`);
      await page.screenshot({ path: vpPath });
      console.log("Salvo:", vpPath);
    }

    // 6. Teste de Fallback sem backdrop-filter (emulação de navegador legado / prefers-reduced-transparency)
    console.log("Capturando Fallback sem backdrop-filter...");
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE_URL}?view=notifications`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        .a26-material-frosted, [data-a26-material="frosted"] {
          background-color: rgb(6 18 23 / 0.98) !important;
        }
      `;
      document.head.appendChild(style);
    });
    await new Promise(r => setTimeout(r, 600));
    const fallbackPath = path.join(ARTIFACTS_DIR, "p0_16_1_no_blur_fallback.png");
    await page.screenshot({ path: fallbackPath });
    console.log("Salvo:", fallbackPath);

    console.log("=== CAPTURAS POSTERIORES CONCLUÍDAS COM SUCESSO ===");
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error("Erro nas capturas posteriores:", err);
  process.exit(1);
});

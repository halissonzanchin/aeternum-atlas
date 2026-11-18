import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const BASE_URL = "http://localhost:5173/preview-surfaces.html";

async function run() {
  console.log("=== CAPTURANDO ESTADO ANTERIOR (BEFORE) DAS SUPERFÍCIES ===");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--ignore-certificate-errors"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // 1. Notificações Aberto (BEFORE)
    console.log("Capturando Central de Notificações (BEFORE)...");
    await page.goto(`${BASE_URL}?view=notifications`, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 600));
    const notifPath = path.join(ARTIFACTS_DIR, "p0_16_1_notification_popover_before.png");
    await page.screenshot({ path: notifPath });
    console.log("Salvo:", notifPath);

    // 2. Perfil Aberto (BEFORE)
    console.log("Capturando Perfil Popover (BEFORE)...");
    await page.goto(`${BASE_URL}?view=profile`, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 600));
    const profilePath = path.join(ARTIFACTS_DIR, "p0_16_1_profile_popover_before.png");
    await page.screenshot({ path: profilePath });
    console.log("Salvo:", profilePath);

    // 3. Modal Aberto (BEFORE)
    console.log("Capturando Modal de Leitura (BEFORE)...");
    await page.goto(`${BASE_URL}?view=modal`, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 600));
    const modalPath = path.join(ARTIFACTS_DIR, "p0_16_1_modal_before.png");
    await page.screenshot({ path: modalPath });
    console.log("Salvo:", modalPath);

    console.log("=== CAPTURA ANTERIOR CONCLUÍDA COM SUCESSO ===");
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error("Erro na captura anterior:", err);
  process.exit(1);
});

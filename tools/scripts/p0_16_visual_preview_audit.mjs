import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const PREVIEW_URL = "http://localhost:5173/preview-metrics.html";

const viewports = [
  { name: "desktop_1920", width: 1920, height: 1080, dpr: 1 },
  { name: "notebook_1366", width: 1366, height: 768, dpr: 1 },
  { name: "tablet_768", width: 768, height: 1024, dpr: 2, isMobile: true },
  { name: "mobile_390", width: 390, height: 844, dpr: 3, isMobile: true }
];

async function run() {
  console.log("=== INICIANDO AUDITORIA VISUAL RESPONSIVA P0.16 ===");
  console.log("Target URL:", PREVIEW_URL);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--ignore-certificate-errors"
    ]
  });

  const auditReport = {
    timestamp: new Date().toISOString(),
    viewportsTested: [],
    componentsAudit: {},
    passed: true
  };

  try {
    const page = await browser.newPage();

    for (const vp of viewports) {
      console.log(`\nAuditando Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        isMobile: vp.isMobile || false
      });

      await page.goto(PREVIEW_URL, { waitUntil: "networkidle0", timeout: 15000 });
      await new Promise(r => setTimeout(r, 1000));

      // Verificar overflow horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth ||
               document.body.scrollWidth > window.innerWidth;
      });

      console.log(`- Overflow horizontal detectado: ${hasHorizontalScroll}`);

      // Capturar screenshot do viewport
      const screenshotPath = path.join(ARTIFACTS_DIR, `p0_16_a26_dashboard_${vp.name.split('_')[0]}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`- Screenshot salvo: ${screenshotPath}`);

      auditReport.viewportsTested.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        hasHorizontalScroll,
        screenshot: path.basename(screenshotPath)
      });

      if (hasHorizontalScroll) {
        auditReport.passed = false;
      }
    }

    // Auditoria de Componentes no Desktop 1920
    console.log("\nAuditoria detalhada de componentes no Desktop 1920...");
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(PREVIEW_URL, { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 800));

    const componentsToAudit = [
      { selector: ".academic-metrics-grid", name: "metric_tiles", filename: "p0_16_component_metric_tiles.png" },
      { selector: ".academic-systems-grid", name: "anatomical_mastery", filename: "p0_16_component_anatomical_mastery.png" },
      { selector: ".academic-chronometer-panel", name: "chronometer_chart", filename: "p0_16_component_chronometer_chart.png" },
      { selector: ".a26-review-panel", name: "academic_review_panel", filename: "p0_16_component_academic_review_panel.png" }
    ];

    for (const comp of componentsToAudit) {
      const el = await page.$(comp.selector);
      if (el) {
        const filePath = path.join(ARTIFACTS_DIR, comp.filename);
        await el.screenshot({ path: filePath });
        console.log(`- Componente [${comp.name}] capturado: ${filePath}`);
        auditReport.componentsAudit[comp.name] = {
          selector: comp.selector,
          captured: true,
          file: comp.filename
        };
      } else {
        console.warn(`- AVISO: Componente [${comp.name}] não encontrado pelo seletor ${comp.selector}`);
        auditReport.componentsAudit[comp.name] = {
          selector: comp.selector,
          captured: false
        };
      }
    }

    // Gravar relatório JSON
    const reportPath = path.join(ARTIFACTS_DIR, "p0_16_visual_audit_report.json");
    fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), "utf8");
    console.log(`\nRelatório salvo com sucesso: ${reportPath}`);

  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error("Erro na auditoria visual:", err);
  process.exit(1);
});

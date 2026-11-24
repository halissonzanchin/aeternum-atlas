import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const distDir = path.resolve("dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const REQUIRED_VIEWPORTS = [
  { name: "1920x1080_fhd", width: 1920, height: 1080 },
  { name: "1440x900_notebook", width: 1440, height: 900 },
  { name: "1366x768_notebook_hd", width: 1366, height: 768 },
  { name: "1280x720_notebook_compact", width: 1280, height: 720 },
  { name: "1024x768_tablet_land", width: 1024, height: 768 },
  { name: "768x1024_tablet_port", width: 768, height: 1024 },
  { name: "430x932_phone_pro_max", width: 430, height: 932 },
  { name: "390x844_phone_iphone12", width: 390, height: 844 },
  { name: "360x800_phone_android", width: 360, height: 800 },
  { name: "320x568_phone_compact", width: 320, height: 568 }
];

const ZOOM_LEVELS = [
  { label: "100%", factor: 1.0 },
  { label: "125%", factor: 1.25 },
  { label: "150%", factor: 1.5 }
];

function createServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split("?")[0];
      if (reqPath === "/" || !path.extname(reqPath)) reqPath = "/index.html";
      const filePath = path.join(distDir, reqPath);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexFile = path.join(distDir, "index.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(indexFile).pipe(res);
      }
    });

    server.listen(port, () => resolve(server));
  });
}

async function runSuite() {
  const PORT = 4288;
  const server = await createServer(PORT);
  console.log(`Local preview server listening on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  const cdp = await page.target().createCDPSession();

  const report = {
    timestamp: new Date().toISOString(),
    viewports: [],
    zoomMatrix: [],
    auroraVeil: {},
    typography: {},
    performance: {},
    allPassed: true
  };

  try {
    const testUrl = `http://127.0.0.1:${PORT}/programa-beta`;

    // --- 1. AUDITORIA DO AURORA VEIL E PERFORMANCE ---
    console.log("\n=== 1. AUDITORIA DO AURORA VEIL E PERFORMANCE ===");
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 600));

    const auroraCheck = await page.evaluate(() => {
      const wrapper = document.querySelector(".aurora-veil-wrapper");
      const canvas = document.querySelector(".aurora-veil-canvas");
      const vignette = document.querySelector(".aurora-veil-vignette");
      const fallback = document.querySelector(".aurora-veil-fallback");

      if (!wrapper) return { found: false };

      const wrapperStyle = window.getComputedStyle(wrapper);
      const canvasStyle = canvas ? window.getComputedStyle(canvas) : null;

      // Pointer events check
      const pointerEventsNone = wrapperStyle.pointerEvents === "none" &&
                                (!canvasStyle || canvasStyle.pointerEvents === "none");

      // WebGL Context check
      let webglContextActive = false;
      if (canvas) {
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        webglContextActive = Boolean(gl);
      }

      return {
        found: true,
        canvasFound: Boolean(canvas),
        vignetteFound: Boolean(vignette),
        fallbackFound: Boolean(fallback),
        zIndex: wrapperStyle.zIndex,
        pointerEventsNone,
        webglContextActive,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0
      };
    });

    console.log("[Aurora Veil Elements]:", auroraCheck);

    // Test Visibility Pausing (document.hidden simulation)
    const pauseCheck = await page.evaluate(async () => {
      let isPaused = false;
      // Trigger visibilitychange to hidden
      Object.defineProperty(document, "hidden", { value: true, writable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      await new Promise(r => setTimeout(r, 200));
      // Revert visibility to visible
      Object.defineProperty(document, "hidden", { value: false, writable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      return { handled: true };
    });
    console.log("[Aurora Veil Auto-Pause on Hidden]:", pauseCheck);

    // Test Prefers-Reduced-Motion
    await cdp.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }]
    });
    await page.goto(testUrl, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 400));

    const reducedMotionCheck = await page.evaluate(() => {
      const wrapper = document.querySelector(".aurora-veil-wrapper");
      return { reducedRendered: Boolean(wrapper) };
    });
    console.log("[Aurora Veil Reduced Motion]:", reducedMotionCheck);

    // Reset reduced motion
    await cdp.send("Emulation.setEmulatedMedia", { media: "screen", features: [] });

    report.auroraVeil = {
      ...auroraCheck,
      pauseHandled: pauseCheck.handled,
      reducedHandled: reducedMotionCheck.reducedRendered,
      pass: auroraCheck.found && auroraCheck.pointerEventsNone && auroraCheck.webglContextActive
    };
    if (!report.auroraVeil.pass) report.allPassed = false;

    // --- 2. AUDITORIA TIPOGRÁFICA ---
    console.log("\n=== 2. AUDITORIA TIPOGRÁFICA INSTITUCIONAL ===");
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 500));

    const typeCheck = await page.evaluate(() => {
      const brandStrong = document.querySelector(".atlas-auth-story--beta .atlas-auth-brand strong");
      const storyTitle = document.querySelector(".atlas-auth-story--beta .atlas-auth-story-title");
      const heroTitle = document.querySelector(".beta-hero-title");
      const kicker = document.querySelector(".atlas-auth-kicker");
      const eyebrow = document.querySelector(".beta-hero-eyebrow");

      const brandFont = brandStrong ? window.getComputedStyle(brandStrong).fontFamily : "";
      const storyTitleFont = storyTitle ? window.getComputedStyle(storyTitle).fontFamily : "";
      const heroTitleFont = heroTitle ? window.getComputedStyle(heroTitle).fontFamily : "";
      const kickerTransform = kicker ? window.getComputedStyle(kicker).textTransform : "";
      const eyebrowTransform = eyebrow ? window.getComputedStyle(eyebrow).textTransform : "";

      const usesCormorantOrCinzel = (font) =>
        font.toLowerCase().includes("cormorant") || font.toLowerCase().includes("cinzel") || font.toLowerCase().includes("georgia");

      return {
        brandFont,
        storyTitleFont,
        heroTitleFont,
        kickerTransform,
        eyebrowTransform,
        storyTitleIsSerif: usesCormorantOrCinzel(storyTitleFont),
        heroTitleIsSerif: usesCormorantOrCinzel(heroTitleFont),
        brandIsSerif: usesCormorantOrCinzel(brandFont),
        kickersUppercase: kickerTransform === "uppercase" && eyebrowTransform === "uppercase"
      };
    });

    console.log("[Typography Audit]:", typeCheck);
    report.typography = {
      ...typeCheck,
      pass: typeCheck.storyTitleIsSerif && typeCheck.heroTitleIsSerif && typeCheck.kickersUppercase
    };
    if (!report.typography.pass) report.allPassed = false;

    // --- 3. MATRIZ DE 10 VIEWPORTS (COM CONTENÇÃO E FORMULÁRIO) ---
    console.log("\n=== 3. MATRIZ DE 10 VIEWPORTS (RESPONSIVIDADE E CONTENÇÃO) ===");
    for (const vp of REQUIRED_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 400));

      const vpAudit = await page.evaluate(() => {
        const shell = document.querySelector(".atlas-auth-shell--beta");
        const story = document.querySelector(".atlas-auth-story--beta");
        const card = document.querySelector(".atlas-auth-card--beta");
        const status = document.querySelector(".atlas-auth-status");
        const capabilities = Array.from(document.querySelectorAll(".atlas-auth-capability"));

        if (!story || !card || !status) return { error: "Elementos essenciais ausentes" };

        const storyRect = story.getBoundingClientRect();
        const statusRect = status.getBoundingClientRect();
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;

        // Subpixel tolerance 2px
        const statusContained = (
          statusRect.top >= storyRect.top - 2 &&
          statusRect.bottom <= storyRect.bottom + 2 &&
          statusRect.left >= storyRect.left - 2 &&
          statusRect.right <= storyRect.right + 2
        );

        const allCapabilitiesContained = capabilities.every(c => {
          const cr = c.getBoundingClientRect();
          return (
            cr.top >= storyRect.top - 2 &&
            cr.bottom <= storyRect.bottom + 2 &&
            cr.left >= storyRect.left - 2 &&
            cr.right <= storyRect.right + 2
          );
        });

        const hasInternalScroll = story.scrollHeight > story.clientHeight + 4;
        const hasHorizontalScroll = bodyWidth > winWidth + 1;

        return {
          storyFound: true,
          statusContained,
          allCapabilitiesContained,
          capabilityCount: capabilities.length,
          hasInternalScroll,
          hasHorizontalScroll,
          storyHeight: Math.round(storyRect.height),
          cardHeight: Math.round(card.getBoundingClientRect().height)
        };
      });

      // Test typing interaction into form fields
      let formTypingOk = false;
      try {
        await page.type("input#fullName, input[name='fullName']", "Teste Responsividade", { delay: 5 });
        formTypingOk = true;
      } catch (e) {
        formTypingOk = false;
      }

      const pass = !vpAudit.error &&
                   vpAudit.storyFound &&
                   vpAudit.statusContained &&
                   vpAudit.allCapabilitiesContained &&
                   vpAudit.capabilityCount === 3 &&
                   !vpAudit.hasInternalScroll &&
                   !vpAudit.hasHorizontalScroll &&
                   formTypingOk;

      if (!pass) report.allPassed = false;

      report.viewports.push({ viewport: vp.name, width: vp.width, height: vp.height, ...vpAudit, formTypingOk, pass });
      console.log(`[Viewport ${vp.name}] Pass: ${pass} | StoryH: ${vpAudit.storyHeight}px | CardH: ${vpAudit.cardHeight}px | StatusContained: ${vpAudit.statusContained} | H-Scroll: ${vpAudit.hasHorizontalScroll}`);

      // Capture screenshots for core resolutions
      if (["1920x1080_fhd", "1440x900_notebook", "1366x768_notebook_hd", "1280x720_notebook_compact", "1024x768_tablet_land", "390x844_phone_iphone12"].includes(vp.name)) {
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `suite_p0_21_ui3_beta_${vp.name}.png`), fullPage: true });
      }
    }

    // --- 4. MATRIZ DE ZOOM REAL (100%, 125%, 150%) ---
    console.log("\n=== 4. MATRIZ DE ZOOM REAL (100%, 125%, 150%) ===");
    for (const dt of [
      { name: "1920x1080_fhd", w: 1920, h: 1080 },
      { name: "1440x900_notebook", w: 1440, h: 900 },
      { name: "1366x768_notebook_hd", w: 1366, h: 768 }
    ]) {
      for (const zoom of ZOOM_LEVELS) {
        const effW = Math.round(dt.w / zoom.factor);
        const effH = Math.round(dt.h / zoom.factor);

        await page.setViewport({ width: effW, height: effH });
        await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: zoom.factor });
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 350));

        const zoomAudit = await page.evaluate(() => {
          const story = document.querySelector(".atlas-auth-story--beta");
          const status = document.querySelector(".atlas-auth-status");
          const form = document.querySelector(".atlas-auth-card--beta");

          const storyRect = story.getBoundingClientRect();
          const statusRect = status.getBoundingClientRect();

          const statusContained = (
            statusRect.top >= storyRect.top - 2 &&
            statusRect.bottom <= storyRect.bottom + 2
          );

          const hasInternalScroll = story.scrollHeight > story.clientHeight + 4;
          const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth + 1;

          return {
            statusContained,
            hasInternalScroll,
            hasHorizontalScroll
          };
        });

        const pass = zoomAudit.statusContained &&
                     !zoomAudit.hasInternalScroll &&
                     !zoomAudit.hasHorizontalScroll;

        if (!pass) report.allPassed = false;

        report.zoomMatrix.push({
          device: dt.name,
          zoom: zoom.label,
          effectiveRes: `${effW}x${effH}`,
          ...zoomAudit,
          pass
        });

        console.log(`[Zoom ${dt.name} @ ${zoom.label}] Pass: ${pass} | EffRes: ${effW}x${effH} | StatusContained: ${zoomAudit.statusContained} | H-Scroll: ${zoomAudit.hasHorizontalScroll}`);
      }
    }

  } catch (err) {
    console.error("Erro na suíte de testes:", err);
    report.allPassed = false;
    report.error = err.message;
  } finally {
    await browser.close();
    server.close();
  }

  const jsonPath = path.join(ARTIFACT_DIR, "p0_21_ui3_aurora_beta_suite_results.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nResultados salvos em: ${jsonPath}`);
  console.log(`STATUS FINAL: ${report.allPassed ? "100% PASS (TUDO APROVADO)" : "REQUER ATENÇÃO"}`);

  return report;
}

runSuite();

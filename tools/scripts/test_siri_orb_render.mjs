import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUTPUT_DIR = "C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 30px;
    background: #080d22;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 40px;
    font-family: sans-serif;
    color: white;
  }
  .preview-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
</style>
</head>
<body>
  <div class="preview-card">
    <h3>512px High Res</h3>
    <canvas id="canvas-lg" width="512" height="512" style="width: 256px; height: 256px;"></canvas>
  </div>
  <div class="preview-card">
    <h3>56px Actual Size (2x DPR)</h3>
    <canvas id="canvas-sm" width="112" height="112" style="width: 56px; height: 56px;"></canvas>
  </div>

<script>
function renderSiriCrystalOrb(canvas, time = 0, state = "idle", intensity = 0.85) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.485;

  ctx.clearRect(0, 0, w, h);
  ctx.save();

  // 1. Clip to the circular sphere boundary
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // 2. Translucent Glass Sphere Interior (Midnight Liquid Glass Substrate)
  const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  baseGrad.addColorStop(0, "rgba(14, 24, 52, 0.15)");
  baseGrad.addColorStop(0.60, "rgba(8, 16, 38, 0.30)");
  baseGrad.addColorStop(0.90, "rgba(10, 20, 48, 0.55)");
  baseGrad.addColorStop(1.0, "rgba(16, 32, 70, 0.75)");
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // 3. Volumetric Internal Ambient Color Haze (Matching Apple Siri Interior Glow)
  // Upper dome: Rich, warm magenta/fuchsia ambient glow
  const topHaze = ctx.createRadialGradient(
    cx,
    cy - radius * 0.35,
    radius * 0.05,
    cx,
    cy - radius * 0.15,
    radius * 0.88
  );
  topHaze.addColorStop(0, "rgba(255, 50, 160, 0.52)");
  topHaze.addColorStop(0.40, "rgba(195, 35, 185, 0.32)");
  topHaze.addColorStop(0.75, "rgba(110, 20, 140, 0.12)");
  topHaze.addColorStop(1.0, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topHaze;
  ctx.fill();

  // Lower dome: Electric cyan/azure ambient glow
  const botHaze = ctx.createRadialGradient(
    cx - radius * 0.10,
    cy + radius * 0.35,
    radius * 0.05,
    cx,
    cy + radius * 0.15,
    radius * 0.85
  );
  botHaze.addColorStop(0, "rgba(0, 150, 255, 0.44)");
  botHaze.addColorStop(0.45, "rgba(0, 225, 215, 0.25)");
  botHaze.addColorStop(0.75, "rgba(15, 75, 170, 0.10)");
  botHaze.addColorStop(1.0, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = botHaze;
  ctx.fill();

  // 4. Volumetric Organic Siri Ribbons
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  let speedMult = 1.0;
  let ampMult = 1.0;
  if (state === "listening") { speedMult = 1.5; ampMult = 1.25; }
  else if (state === "thinking") { speedMult = 2.0; ampMult = 1.1; }
  else if (state === "speaking") { speedMult = 1.7; ampMult = 1.35; }

  const STEPS = 90;
  const att = (x) => {
    const k = 2.4;
    return Math.pow(k / (k + x * x), 2.2);
  };

  const ribbons = [
    {
      name: "magenta-top",
      baseAngle: -Math.PI * 0.45, // pointing high up (~80 deg)
      span: radius * 1.60,
      maxAmp: radius * 0.36,
      thickness: radius * 0.56,
      freq: 1.1,
      speed: 0.95,
      phase: 0.3,
      color: "255, 45, 145"
    },
    {
      name: "turquoise-right",
      baseAngle: 0.06, // horizontal right (~3 deg)
      span: radius * 1.68,
      maxAmp: radius * 0.30,
      thickness: radius * 0.52,
      freq: 1.2,
      speed: 0.85,
      phase: 1.8,
      color: "35, 240, 190"
    },
    {
      name: "azure-left",
      baseAngle: Math.PI * 0.82, // down-left (~148 deg)
      span: radius * 1.65,
      maxAmp: radius * 0.32,
      thickness: radius * 0.54,
      freq: 1.15,
      speed: 1.05,
      phase: 3.2,
      color: "0, 160, 255"
    },
    {
      name: "orchid-upperleft",
      baseAngle: -Math.PI * 0.80, // up-left (~-144 deg)
      span: radius * 1.50,
      maxAmp: radius * 0.28,
      thickness: radius * 0.48,
      freq: 1.25,
      speed: 0.90,
      phase: 4.5,
      color: "190, 70, 255"
    },
    {
      name: "magenta-droplet",
      baseAngle: Math.PI * 0.58, // down-right (~104 deg)
      span: radius * 1.50,
      maxAmp: radius * 0.26,
      thickness: radius * 0.45,
      freq: 1.3,
      speed: 1.15,
      phase: 5.6,
      color: "255, 60, 160"
    }
  ];

  ribbons.forEach((rib) => {
    const angle = rib.baseAngle + 0.06 * Math.sin(time * 0.7 + rib.phase);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const perpX = -sinA;
    const perpY = cosA;

    const currentPhase = time * rib.speed + rib.phase;
    const halfSpan = rib.span / 2;

    const topPoints = [];
    const botPoints = [];
    const spinePoints = [];

    for (let i = -STEPS; i <= STEPS; i++) {
      const normU = (i / STEPS) * 2.6;
      const u = (i / STEPS) * halfSpan;

      const envelope = att(normU);
      const wave = Math.sin(normU * rib.freq - currentPhase) * rib.maxAmp * envelope;
      const thick = rib.thickness * envelope * (0.70 + 0.30 * Math.cos(normU * 1.1));

      const cxSlice = cx + u * cosA + wave * perpX;
      const cySlice = cy + u * sinA + wave * perpY;

      spinePoints.push({ x: cxSlice, y: cySlice });

      topPoints.push({
        x: cxSlice + (thick / 2) * perpX,
        y: cySlice + (thick / 2) * perpY
      });

      botPoints.push({
        x: cxSlice - (thick / 2) * perpX,
        y: cySlice - (thick / 2) * perpY
      });
    }

    // Volumetric Ribbon Fill with soft feathering
    ctx.beginPath();
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i < topPoints.length; i++) {
      ctx.lineTo(topPoints[i].x, topPoints[i].y);
    }
    for (let i = botPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(botPoints[i].x, botPoints[i].y);
    }
    ctx.closePath();

    const ribGrad = ctx.createLinearGradient(
      cx - halfSpan * cosA,
      cy - halfSpan * sinA,
      cx + halfSpan * cosA,
      cy + halfSpan * sinA
    );
    ribGrad.addColorStop(0, "rgba(" + rib.color + ", 0)");
    ribGrad.addColorStop(0.30, "rgba(" + rib.color + ", 0.50)");
    ribGrad.addColorStop(0.50, "rgba(" + rib.color + ", 0.88)");
    ribGrad.addColorStop(0.70, "rgba(" + rib.color + ", 0.50)");
    ribGrad.addColorStop(1.0, "rgba(" + rib.color + ", 0)");

    ctx.fillStyle = ribGrad;
    ctx.fill();

    // Central Crease Line — only visible across the central nexus
    ctx.beginPath();
    ctx.moveTo(spinePoints[0].x, spinePoints[0].y);
    for (let i = 1; i < spinePoints.length; i++) {
      ctx.lineTo(spinePoints[i].x, spinePoints[i].y);
    }

    const spineGrad = ctx.createLinearGradient(
      cx - halfSpan * cosA,
      cy - halfSpan * sinA,
      cx + halfSpan * cosA,
      cy + halfSpan * sinA
    );
    spineGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
    spineGrad.addColorStop(0.38, "rgba(255, 255, 255, 0.35)");
    spineGrad.addColorStop(0.50, "rgba(255, 255, 255, 0.95)");
    spineGrad.addColorStop(0.62, "rgba(255, 255, 255, 0.35)");
    spineGrad.addColorStop(1.0, "rgba(255, 255, 255, 0)");

    ctx.strokeStyle = spineGrad;
    ctx.lineWidth = Math.max(1.0, radius * 0.022);
    ctx.stroke();
  });

  // 5. Radiant Center Star Nexus (Pure glowing white star at intersection)
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.46);
  coreGrad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  coreGrad.addColorStop(0.18, "rgba(250, 255, 255, 0.95)");
  coreGrad.addColorStop(0.38, "rgba(220, 250, 255, 0.52)");
  coreGrad.addColorStop(0.68, "rgba(180, 230, 255, 0.16)");
  coreGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.46, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // Restore from screen compositeOperation

  // 6. Internal Specular Glass Crescent Reflection (Apple Optical Lens Curve)
  const crescentGrad = ctx.createRadialGradient(
    cx,
    cy - radius * 0.88,
    radius * 0.02,
    cx,
    cy - radius * 0.52,
    radius * 0.80
  );
  crescentGrad.addColorStop(0, "rgba(255, 255, 255, 0.58)");
  crescentGrad.addColorStop(0.22, "rgba(255, 255, 255, 0.22)");
  crescentGrad.addColorStop(0.55, "rgba(255, 255, 255, 0.04)");
  crescentGrad.addColorStop(1.0, "rgba(255, 255, 255, 0)");

  ctx.save();
  ctx.fillStyle = crescentGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy - radius * 0.46, radius * 0.74, radius * 0.36, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. Single Unified Photorealistic Conic Glass Rim
  ctx.save();
  const rimGrad = ctx.createConicGradient(-Math.PI / 2, cx, cy);
  rimGrad.addColorStop(0.00, "rgba(255, 55, 155, 0.45)");   // Top: Fuchsia
  rimGrad.addColorStop(0.20, "rgba(255, 255, 255, 0.88)");  // Top-Right: Crisp White Specular
  rimGrad.addColorStop(0.38, "rgba(35, 235, 185, 0.55)");   // Right/Bottom-Right: Turquoise
  rimGrad.addColorStop(0.55, "rgba(30, 90, 210, 0.35)");    // Bottom: Deep Indigo
  rimGrad.addColorStop(0.72, "rgba(0, 155, 255, 0.50)");    // Bottom-Left: Electric Azure
  rimGrad.addColorStop(0.88, "rgba(175, 65, 255, 0.45)");   // Upper-Left: Orchid
  rimGrad.addColorStop(1.00, "rgba(255, 55, 155, 0.45)");   // Back to Top Fuchsia

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = Math.max(1.0, radius * 0.016);
  ctx.stroke();
  ctx.restore();

  ctx.restore(); // Restore clipping
}

renderSiriCrystalOrb(document.getElementById("canvas-lg"), 0.5, "idle");
renderSiriCrystalOrb(document.getElementById("canvas-sm"), 0.5, "idle");
</script>
</body>
</html>
`;

async function run() {
  const htmlPath = path.join(OUTPUT_DIR, "scratch_siri_preview_v5.html");
  fs.writeFileSync(htmlPath, HTML_CONTENT, "utf8");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 450, deviceScaleFactor: 2.0 });
  await page.goto("file:///" + htmlPath.replace(/\\\\/g, "/"), { waitUntil: "networkidle0" });

  const screenshotPath = path.join(OUTPUT_DIR, "scratch_siri_test_capture_v5.png");
  await page.screenshot({ path: screenshotPath });

  await browser.close();
  console.log("Screenshot written to:", screenshotPath);
}

run().catch(console.error);

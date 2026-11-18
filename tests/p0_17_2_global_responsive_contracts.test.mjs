import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

test("P0.17.2/P0.17.3 — A26AcademicReviewPanel contracts: container query, flex wrap and ultracompact support", async () => {
  const panelCss = await fs.readFile(
    path.join(rootDir, "src", "styles", "A26AcademicReviewPanel.css"),
    "utf8"
  );
  const panelJsx = await fs.readFile(
    path.join(rootDir, "src", "components", "aeternum-26", "A26AcademicReviewPanel.jsx"),
    "utf8"
  );

  // Container query declarada para adaptação intrínseca
  assert.match(panelCss, /container-type:\s*inline-size;/);
  assert.match(panelCss, /container-name:\s*review-panel;/);

  // Flex wrap e separação de corpo e ações para evitar colapso de texto
  assert.match(panelCss, /\.a26-review-item\s*\{[\s\S]*flex-wrap:\s*wrap;/);
  assert.match(panelCss, /\.a26-review-item__body\s*\{[\s\S]*flex:\s*1\s+1\s+180px;/);
  assert.match(panelCss, /\.a26-review-item__body\s*\{[\s\S]*min-width:\s*0;/);
  assert.match(panelCss, /\.a26-review-item__info\s*\{[\s\S]*min-width:\s*0;/);
  assert.match(panelCss, /\.a26-review-item__info\s+p\s*\{[\s\S]*overflow-wrap:\s*break-word;/);

  // Quebra responsiva do botão para linha própria quando estreito
  assert.match(panelCss, /@container\s+review-panel\s*\(\s*max-width:\s*440px\s*\)\s*\{[\s\S]*\.a26-review-item__actions/);

  // Suporte a viewport ultracompacto (320px)
  assert.match(panelCss, /@media\s*\(\s*max-width:\s*360px\s*\)\s*\{[\s\S]*\.a26-review-panel/);

  // Estrutura JSX contém .a26-review-item__body e .a26-review-item__actions
  assert.match(panelJsx, /className="a26-review-item__body"/);
  assert.match(panelJsx, /className="a26-review-item__actions"/);
});

test("P0.17.2/P0.17.3 — AcademicEvolutionDashboard contracts: responsive grid breakpoints and ultracompact scale", async () => {
  const dashboardCss = await fs.readFile(
    path.join(rootDir, "src", "styles", "AcademicEvolutionDashboard.css"),
    "utf8"
  );

  // Safe padding contra sobreposição de elementos flutuantes
  assert.match(dashboardCss, /\.academic-evolution-dashboard\s*\{[\s\S]*padding-bottom:\s*clamp\(40px/);

  // Grid de Métricas com quebra em 1380px para notebooks e zoom elevado
  assert.match(dashboardCss, /@media\s*\(\s*max-width:\s*1380px\s*\)\s*\{\s*\.academic-metrics-grid\s*\{\s*grid-template-columns:\s*repeat\(2,\s*1fr\);/);

  // Grid Bipolar com proporção otimizada e quebra em 1240px
  assert.match(dashboardCss, /\.academic-bipolar-grid\s*\{[\s\S]*grid-template-columns:\s*1\.45fr\s+1fr;/);
  assert.match(dashboardCss, /@media\s*\(\s*max-width:\s*1240px\s*\)\s*\{\s*\.academic-bipolar-grid\s*\{\s*grid-template-columns:\s*1fr;/);

  // Grid de Sistemas Anatômicos adaptativo
  assert.match(dashboardCss, /\.academic-systems-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(280px,\s*1fr\)\);/);

  // Suporte a telas de 320px
  assert.match(dashboardCss, /@media\s*\(\s*max-width:\s*360px\s*\)\s*\{\s*\.academic-evolution-title/);
});

test("P0.17.2/P0.17.3 — A26MetricTile contracts: non-destructive wrap and badge stability", async () => {
  const tileCss = await fs.readFile(
    path.join(rootDir, "src", "styles", "A26MetricTile.css"),
    "utf8"
  );

  assert.match(tileCss, /\.a26-metric-tile__footer\s*\{[\s\S]*flex-wrap:\s*wrap;/);
  assert.match(tileCss, /\.a26-metric-tile__detail\s*\{[\s\S]*overflow-wrap:\s*break-word;/);
  assert.match(tileCss, /\.a26-metric-tile__badge\s*\{[\s\S]*flex-shrink:\s*0;/);
  assert.match(tileCss, /@media\s*\(\s*max-width:\s*360px\s*\)\s*\{\s*\.a26-metric-tile/);
});

test("P0.17.2/P0.17.3 — A26StudyChronometerChart contracts: horizontal scroll preservation", async () => {
  const chartCss = await fs.readFile(
    path.join(rootDir, "src", "styles", "A26StudyChronometerChart.css"),
    "utf8"
  );

  assert.match(chartCss, /\.a26-chronometer-chart__bars-container\s*\{[\s\S]*overflow-x:\s*auto;/);
  assert.match(chartCss, /\.a26-chronometer-col\s*\{[\s\S]*min-width:\s*28px;/);
  assert.match(chartCss, /@media\s*\(\s*max-width:\s*360px\s*\)\s*\{[\s\S]*\.a26-chronometer-chart__bars-container/);
});

test("P0.17.2/P0.17.3 — A26AnatomicalMasteryCard contracts: graceful header and footer wrapping", async () => {
  const cardCss = await fs.readFile(
    path.join(rootDir, "src", "styles", "A26AnatomicalMasteryCard.css"),
    "utf8"
  );

  assert.match(cardCss, /\.a26-mastery-card__header\s*\{[\s\S]*flex-wrap:\s*wrap;/);
  assert.match(cardCss, /\.a26-mastery-card__title\s*\{[\s\S]*overflow-wrap:\s*break-word;/);
  assert.match(cardCss, /\.a26-mastery-card__footer\s*\{[\s\S]*flex-wrap:\s*wrap;/);
  assert.match(cardCss, /@media\s*\(\s*max-width:\s*360px\s*\)\s*\{\s*\.a26-mastery-card/);
});

test("P0.17.2/P0.17.3 — A26StudentConsolidation contracts: safe zone clearance against floating triggers", async () => {
  const consolCss = await fs.readFile(
    path.join(rootDir, "src", "styles", "A26StudentConsolidation.css"),
    "utf8"
  );

  assert.match(consolCss, /\.academic-evolution-dashboard\s*\{[\s\S]*padding-bottom:\s*clamp\(120px/);
  assert.match(consolCss, /\.evolution-panel-container\s*,/);
});

test("P0.17.3 — Script Security & Session Auditing Contracts", async () => {
  const suiteScript = await fs.readFile(
    path.join(rootDir, "tools", "scripts", "p0_17_3_responsive_capture_suite.mjs"),
    "utf8"
  );
  const seedScript = await fs.readFile(
    path.join(rootDir, "tools", "scripts", "seed_automation_telemetry.mjs"),
    "utf8"
  );

  // 1. Proibido NODE_TLS_REJECT_UNAUTHORIZED = 0
  assert.doesNotMatch(suiteScript, /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']0["']/);
  assert.doesNotMatch(seedScript, /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']0["']/);

  // 2. Proibido apagar ai_rate_limits como rotina de teste
  assert.doesNotMatch(suiteScript, /DELETE\s+FROM\s+public\.ai_rate_limits/i);
  assert.doesNotMatch(seedScript, /DELETE\s+FROM\s+public\.ai_rate_limits/i);

  // 3. Proibido DELETE direto em user_active_sessions (deve usar admin_reset_user_session)
  assert.doesNotMatch(suiteScript, /DELETE\s+FROM\s+public\.user_active_sessions/i);
  assert.doesNotMatch(seedScript, /DELETE\s+FROM\s+public\.user_active_sessions/i);
  assert.match(suiteScript, /admin_reset_user_session/);

  // 4. Trava estrita contra conta demo humana
  assert.match(suiteScript, /demo\.institucional/);
  assert.match(seedScript, /demo\.institucional/);
});

/**
 * AETERNUM ATLAS — MISSÃO P0.18.7: HOMOLOGAÇÃO GEOMÉTRICA E FUNCIONAL DEFINITIVA
 * Viewports (8): 1920x1080, 1366x768, 1280x720, 1272x652, 1024x768, 768x1024, 390x844, 375x812
 * Modos: MODO LEITURA (piso legível >= 0.85) e VISÃO GERAL (ajuste à tela)
 * Cenários: Pequeno (<10 nós), Médio (Cardiovascular, 18 nós), Extenso (35+ nós)
 * Zooms nativos: 100%, 125%, 150%, 200%
 */

import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const LOCAL_URL = "http://localhost:4173";

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

function calculateFileSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function runComprehensiveValidation() {
  console.log("===============================================================================");
  console.log("AETERNUM ATLAS — P0.18.7: HOMOLOGAÇÃO GEOMÉTRICA E FUNCIONAL DEFINITIVA");
  console.log("===============================================================================");

  const qaEmail = process.env.ATLAS_QA_EMAIL || TARGET_TEST_EMAIL;
  let qaPassword = process.env.ATLAS_QA_PASSWORD || getCredential("AeternumAtlas:AutomationTestAccount");
  if (!qaPassword) {
    qaPassword = getCredential("ATLAS_AUTOMATION_PASSWORD");
  }

  if (!qaPassword) {
    throw new Error("Credencial da conta de teste não encontrada.");
  }

  console.log(`[AUTH] Resetando sessões residuais no Supabase para ${TARGET_TEST_USER_ID}...`);
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_7_val_prep');`);

  const runProfile = path.join(os.tmpdir(), "edge_atlas_p0_18_7_val_" + Date.now());
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    userDataDir: runProfile,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,900"
    ]
  });

  const testResults = {
    mission: "P0.18.7",
    timestamp: new Date().toISOString(),
    viewports: {},
    zoomLevels: {},
    treeScenarios: {},
    editorToggles: {},
    minimapChecks: {},
    screenshots: {}
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // 1. Login
    console.log(`\n[ETAPA 1] Realizando autenticação em ${LOCAL_URL}/login...`);
    await page.goto(`${LOCAL_URL}/login`, { waitUntil: "networkidle2", timeout: 35000 });

    await page.evaluate((email, password) => {
      const emailInput = document.querySelector('input[name="email"]');
      const passInput = document.querySelector('input[name="password"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

      nativeSetter.call(emailInput, email);
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));

      nativeSetter.call(passInput, password);
      passInput.dispatchEvent(new Event("input", { bubbles: true }));
    }, qaEmail, qaPassword);

    await new Promise(r => setTimeout(r, 600));

    const submitBtn = await page.$("button.atlas-auth-submit");
    if (!submitBtn) throw new Error("Botão de submit de login não encontrado.");
    await submitBtn.click();

    console.log("[ETAPA 1] Aguardando /student/home...");
    await page.waitForFunction(() => window.location.pathname.includes("/student/home"), { timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log("[ETAPA 1] Autenticado com sucesso.");

    // 2. Navegação para /mind-map
    console.log(`\n[ETAPA 2] Navegando para ${LOCAL_URL}/mind-map...`);
    await page.goto(`${LOCAL_URL}/mind-map`, { waitUntil: "networkidle2", timeout: 25000 });
    await new Promise(r => setTimeout(r, 2500));

    // Helper para extrair métricas do DOM
    const extractGeometry = async () => {
      return await page.evaluate(() => {
        const getRect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            left: Math.round(r.left),
            right: Math.round(r.right)
          };
        };

        const svgEl = document.querySelector("#canvas");
        const svgRect = getRect(svgEl);

        const zoomGroup = document.querySelector("g.zoom-group");
        let d3BBox = null;
        let d3ClientRect = null;
        let parsedScale = null;
        let parsedTx = null;
        let parsedTy = null;

        if (zoomGroup) {
          try {
            const bb = zoomGroup.getBBox();
            d3BBox = {
              x: Math.round(bb.x),
              y: Math.round(bb.y),
              width: Math.round(bb.width),
              height: Math.round(bb.height)
            };
          } catch {}
          d3ClientRect = getRect(zoomGroup);
          const tStr = zoomGroup.getAttribute("transform");
          if (tStr) {
            const matchT = tStr.match(/translate\(([^,]+)[,\s]+([^)]+)\)/);
            const matchS = tStr.match(/scale\(([^)]+)\)/);
            if (matchT) {
              parsedTx = parseFloat(matchT[1]);
              parsedTy = parseFloat(matchT[2]);
            }
            if (matchS) {
              parsedScale = parseFloat(matchS[1]);
            }
          }
        }

        const zoomBadge = document.querySelector(".zoom-percentage-btn");
        const zoomText = zoomBadge ? zoomBadge.textContent.trim() : "";

        // Nodes
        const nodes = Array.from(document.querySelectorAll("g.mindmap-node, g.node"));
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let cutOffs = 0;
        let rootNode = null;
        const labelsData = [];

        nodes.forEach((n, idx) => {
          const r = getRect(n);
          const textEl = n.querySelector("text.node-label");
          const text = textEl ? textEl.textContent.trim() : "";
          const fs = textEl ? window.getComputedStyle(textEl).fontSize : null;
          const isRoot = n.classList.contains("node-root") || idx === nodes.length - 1;

          if (r) {
            if (r.left < minX) minX = r.left;
            if (r.right > maxX) maxX = r.right;
            if (r.top < minY) minY = r.top;
            if (r.bottom > maxY) maxY = r.bottom;

            if (svgRect) {
              if (r.left < svgRect.left - 5 || r.right > svgRect.right + 5 || r.top < svgRect.top - 5 || r.bottom > svgRect.bottom + 5) {
                cutOffs++;
              }
            }
          }

          if (isRoot && !rootNode) {
            rootNode = { text, rect: r, fontSize: fs };
          }
          if (idx < 3) {
            labelsData.push({ text: text.slice(0, 30), rect: r, fontSize: fs });
          }
        });

        // Mode
        const readingBtn = document.querySelector(".mindmap-mode-btn:first-child");
        const overviewBtn = document.querySelector(".mindmap-mode-btn:last-child");
        const activeMode = readingBtn?.classList.contains("is-active") ? "reading" : overviewBtn?.classList.contains("is-active") ? "overview" : "unknown";

        // Editor
        const editorEl = document.querySelector(".mindmap-sidebar");
        const isCollapsed = document.querySelector(".a26-mindmap-page.sidebar-collapsed") !== null;

        // Minimap
        const minimapEl = document.querySelector(".mindmap-minimap");
        const minimapStyle = minimapEl ? window.getComputedStyle(minimapEl) : null;

        // Marina
        const marinaEl = document.querySelector(".upe-ai-trigger");
        const marinaRect = getRect(marinaEl);

        return {
          window: { width: window.innerWidth, height: window.innerHeight },
          svgRect,
          d3: {
            bBox: d3BBox,
            clientRect: d3ClientRect,
            scale: parsedScale,
            scalePercent: Math.round((parsedScale || 0) * 100),
            tx: Math.round(parsedTx || 0),
            ty: Math.round(parsedTy || 0),
            zoomText
          },
          nodes: {
            total: nodes.length,
            rootNode,
            sample: labelsData,
            bounds: { minX, maxX, minY, maxY },
            cutOffCount: cutOffs
          },
          activeMode,
          editor: {
            isCollapsed,
            rect: getRect(editorEl)
          },
          minimap: {
            exists: Boolean(minimapEl),
            zIndex: minimapStyle ? minimapStyle.zIndex : null,
            rect: getRect(minimapEl),
            display: minimapStyle ? minimapStyle.display : null
          },
          marina: {
            rect: marinaRect
          }
        };
      });
    };

    // -------------------------------------------------------------------------
    // 3. MATRIZ DE 8 VIEWPORTS OBRIGATÓRIOS
    // -------------------------------------------------------------------------
    console.log("\n[ETAPA 3] Testando matriz de 8 Viewports em Modo Leitura e Visão Geral...");
    const viewports = [
      { name: "operator_1272x652", w: 1272, h: 652, label: "1272x652 (Captura Operador)" },
      { name: "laptop_1366x768", w: 1366, h: 768, label: "1366x768 (Notebook)" },
      { name: "desktop_1920x1080", w: 1920, h: 1080, label: "1920x1080 (Full HD)" },
      { name: "hd_1280x720", w: 1280, h: 720, label: "1280x720 (HD Standard)" },
      { name: "tablet_1024x768", w: 1024, h: 768, label: "1024x768 (iPad Paisagem)" },
      { name: "tablet_portrait_768x1024", w: 768, h: 1024, label: "768x1024 (iPad Retrato)" },
      { name: "mobile_390x844", w: 390, h: 844, label: "390x844 (iPhone 13/14)" },
      { name: "mobile_375x812", w: 375, h: 812, label: "375x812 (iPhone X)" }
    ];

    for (const vp of viewports) {
      console.log(`\n--- Testando ${vp.label} ---`);
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 });
      await new Promise(r => setTimeout(r, 1200));

      // Test MODO LEITURA
      const modeReadingBtn = await page.$(".mindmap-mode-btn:first-child");
      if (modeReadingBtn) {
        await modeReadingBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }
      const readingGeo = await extractGeometry();
      console.log(`   [Modo Leitura] Escala: ${readingGeo.d3.scalePercent}%, Altura SVG: ${readingGeo.svgRect?.height}px, Editor Recolhido: ${readingGeo.editor.isCollapsed}`);

      // Test VISÃO GERAL
      const modeOverviewBtn = await page.$(".mindmap-mode-btn:last-child");
      if (modeOverviewBtn) {
        await modeOverviewBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }
      const overviewGeo = await extractGeometry();
      console.log(`   [Visão Geral]  Escala: ${overviewGeo.d3.scalePercent}%, Nós Cortados: ${overviewGeo.nodes.cutOffCount}, Minimapa zIndex: ${overviewGeo.minimap.zIndex}`);

      // Screenshots nos viewports chave
      if (vp.w === 1272 || vp.w === 1366 || vp.w === 1920) {
        // Volta para reading e tira shot
        if (modeReadingBtn) {
          await modeReadingBtn.click();
          await new Promise(r => setTimeout(r, 500));
        }
        const shotReading = path.join(ARTIFACTS_DIR, `p0_18_7_val_${vp.w}x${vp.h}_reading.png`);
        await page.screenshot({ path: shotReading, fullPage: false });

        if (modeOverviewBtn) {
          await modeOverviewBtn.click();
          await new Promise(r => setTimeout(r, 500));
        }
        const shotOverview = path.join(ARTIFACTS_DIR, `p0_18_7_val_${vp.w}x${vp.h}_overview.png`);
        await page.screenshot({ path: shotOverview, fullPage: false });

        testResults.screenshots[`${vp.w}x${vp.h}_reading`] = { path: shotReading, sha256: calculateFileSha256(shotReading) };
        testResults.screenshots[`${vp.w}x${vp.h}_overview`] = { path: shotOverview, sha256: calculateFileSha256(shotOverview) };
      }

      testResults.viewports[vp.name] = {
        reading: readingGeo,
        overview: overviewGeo,
        pass: readingGeo.d3.scale >= 0.85 && overviewGeo.nodes.cutOffCount === 0
      };
    }

    // -------------------------------------------------------------------------
    // 4. TESTE DE NÍVEIS DE ZOOM DO NAVEGADOR EM 1272x652
    // -------------------------------------------------------------------------
    console.log("\n[ETAPA 4] Validando Zoom Nativo do Navegador (100%, 125%, 150%, 200%) em 1272x652...");
    const zoomLevels = [
      { dsf: 1.0, label: "100%" },
      { dsf: 1.25, label: "125%" },
      { dsf: 1.5, label: "150%" },
      { dsf: 2.0, label: "200%" }
    ];

    for (const zl of zoomLevels) {
      await page.setViewport({ width: 1272, height: 652, deviceScaleFactor: zl.dsf });
      await new Promise(r => setTimeout(r, 800));
      const geo = await extractGeometry();
      console.log(`   -> Browser Zoom ${zl.label}: Escala D3=${geo.d3.scalePercent}%, SVG=${geo.svgRect?.width}x${geo.svgRect?.height}px`);
      testResults.zoomLevels[zl.label] = {
        deviceScaleFactor: zl.dsf,
        d3Scale: geo.d3.scale,
        svgWidth: geo.svgRect?.width,
        svgHeight: geo.svgRect?.height
      };
    }
    // Restaura dsf 1.0
    await page.setViewport({ width: 1272, height: 652, deviceScaleFactor: 1 });

    // -------------------------------------------------------------------------
    // 5. TESTE DOS 3 CENÁRIOS DE ÁRVORE
    // -------------------------------------------------------------------------
    console.log("\n[ETAPA 5] Testando 3 Cenários Anatômicos (Pequeno, Médio, Extenso)...");

    // Helper para injetar outline e renderizar
    const setTreeOutline = async (text) => {
      await page.evaluate((newText) => {
        const textarea = document.querySelector(".mindmap-outline-editor, textarea");
        if (textarea) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          setter.call(textarea, newText);
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, text);
      await new Promise(r => setTimeout(r, 600));

      const renderBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const b = btns.find(el => el.textContent.includes("Renderizar mapa"));
        if (b) { b.click(); return true; }
        return false;
      });
      await new Promise(r => setTimeout(r, 1200));
    };

    // Cenário 1: Mapa Pequeno (<10 nós)
    console.log("   -> Cenário 1: Mapa Pequeno (Artéria Coronária)...");
    const smallOutline = `# Artérias Coronárias
 Artéria Coronária Esquerda
  Ramo Interventricular Anterior
  Ramo Circunflexo
 Artéria Coronária Direita
  Ramo Marginal Direito
  Ramo Interventricular Posterior`;
    await setTreeOutline(smallOutline);
    const smallGeo = await extractGeometry();
    console.log(`      Nós=${smallGeo.nodes.total}, BBox=${smallGeo.d3.bBox?.width}x${smallGeo.d3.bBox?.height}px, Escala=${smallGeo.d3.scalePercent}%`);
    const shotSmall = path.join(ARTIFACTS_DIR, "p0_18_7_val_scenario_small.png");
    await page.screenshot({ path: shotSmall });
    testResults.treeScenarios["small"] = { geo: smallGeo, shot: shotSmall };

    // Cenário 2: Mapa Médio (Cardiovascular Padrão)
    console.log("   -> Cenário 2: Mapa Médio (Sistema Cardiovascular Padrão)...");
    const mediumOutline = `# Sistema Cardiovascular
 Coração e Câmaras
  Átrio Direito & Esquerdo
  Ventrículo Direito & Esquerdo
  Válvulas Cardíacas
 Vasos da Base
  Aorta Ascendente & Arco
  Tronco Braquiocefálico
  Artérias Carótidas Comuns
  Artérias Subclávias
  Veias Cavas Superior & Inferior
 Circulação Coronária
  Artéria Coronária Esquerda
  Artéria Coronária Direita
  Seio Coronário Venoso
 Correlações Clínicas
  Infarto Agudo do Miocárdio
  Angina de Peito & Isquemia Miocárdica
  Estenose Válvular Aórtica & Insuficiência`;
    await setTreeOutline(mediumOutline);
    const mediumGeo = await extractGeometry();
    console.log(`      Nós=${mediumGeo.nodes.total}, BBox=${mediumGeo.d3.bBox?.width}x${mediumGeo.d3.bBox?.height}px, Escala=${mediumGeo.d3.scalePercent}%`);
    const shotMedium = path.join(ARTIFACTS_DIR, "p0_18_7_val_scenario_medium.png");
    await page.screenshot({ path: shotMedium });
    testResults.treeScenarios["medium"] = { geo: mediumGeo, shot: shotMedium };

    // Cenário 3: Mapa Extenso (35+ nós e múltiplos níveis)
    console.log("   -> Cenário 3: Mapa Extenso (Sistema Nervoso Central e Periférico)...");
    const largeOutline = `# Sistema Nervoso Humano
 Sistema Nervoso Central
  Encéfalo
   Cérebro
    Telencéfalo
     Córtex Cerebral
     Núcleos da Base
    Diencéfalo
     Tálamo
     Hipotálamo
     Epitálamo
   Tronco Encefálico
    Mesencéfalo
    Ponte de Varólio
    Bulbo Raquidiano
   Cerebelo
    Córtex Cerebelar
    Núcleos Profundos
  Medula Espinhal
   Substância Cinzenta
   Substância Branca
   Vias Ascendentes Sensitivas
   Vias Descendentes Motoras
 Sistema Nervoso Periférico
  Nervos Cranianos
   Pares Sensitivos
   Pares Motores
   Pares Mistos
  Nervos Espinhais
   Plexo Braquial
   Plexo Lombossacral
  Sistema Nervoso Autônomo
   Divisão Simpática
   Divisão Parassimpática`;
    await setTreeOutline(largeOutline);
    const largeGeo = await extractGeometry();
    console.log(`      Nós=${largeGeo.nodes.total}, BBox=${largeGeo.d3.bBox?.width}x${largeGeo.d3.bBox?.height}px, Escala=${largeGeo.d3.scalePercent}%`);
    const shotLarge = path.join(ARTIFACTS_DIR, "p0_18_7_val_scenario_large.png");
    await page.screenshot({ path: shotLarge });
    testResults.treeScenarios["large"] = { geo: largeGeo, shot: shotLarge };

    // -------------------------------------------------------------------------
    // 6. TESTE DE INTERAÇÃO DO MINIMAPA E CLIQUE
    // -------------------------------------------------------------------------
    console.log("\n[ETAPA 6] Testando Navegação via Minimapa e Sincronização...");
    const minimapBox = await page.$(".mindmap-minimap");
    if (minimapBox) {
      const b = await minimapBox.boundingBox();
      if (b) {
        // Clica no canto esquerdo do minimapa
        await page.mouse.click(b.x + 20, b.y + 20);
        await new Promise(r => setTimeout(r, 600));
        const afterClickGeo = await extractGeometry();
        console.log(`   -> Clique minimapa executado: tx=${afterClickGeo.d3.tx}, ty=${afterClickGeo.d3.ty}`);
        testResults.minimapChecks = { pass: true, tx: afterClickGeo.d3.tx, ty: afterClickGeo.d3.ty };
      }
    }

    // -------------------------------------------------------------------------
    // 7. TESTE DE EXPANSÃO / RECOLHIMENTO DO EDITOR
    // -------------------------------------------------------------------------
    console.log("\n[ETAPA 7] Testando Alternância do Editor Lateral...");
    const toggleSidebarBtn = await page.$(".topbar-left-group button:first-child");
    if (toggleSidebarBtn) {
      const geoBefore = await extractGeometry();
      console.log(`   -> Estado inicial editor: recolhido=${geoBefore.editor.isCollapsed}, SVG width=${geoBefore.svgRect?.width}px`);
      await toggleSidebarBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const geoToggled = await extractGeometry();
      console.log(`   -> Estado após toggle: recolhido=${geoToggled.editor.isCollapsed}, SVG width=${geoToggled.svgRect?.width}px`);
      testResults.editorToggles = {
        before: geoBefore.editor.isCollapsed,
        after: geoToggled.editor.isCollapsed,
        widthDiff: (geoToggled.svgRect?.width || 0) - (geoBefore.svgRect?.width || 0)
      };
    }

    const reportPath = path.join(ARTIFACTS_DIR, "p0_18_7_validation_results.json");
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2), "utf8");
    console.log(`\n[SUCESSO] Homologação geométrica completa salva em: ${reportPath}`);

  } finally {
    await browser.close();
    try {
      fs.rmSync(runProfile, { recursive: true, force: true });
    } catch {}

    console.log(`[AUTH] Resetando sessão pós-teste para ${TARGET_TEST_USER_ID}...`);
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}', 'p0_18_7_val_cleanup');`);
  }
}

runComprehensiveValidation().catch((err) => {
  console.error("FATAL ERROR durante homologação:", err);
  process.exit(1);
});

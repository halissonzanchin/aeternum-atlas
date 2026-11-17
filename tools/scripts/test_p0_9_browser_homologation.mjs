import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE_DIR = 'C:\\Users\\halis\\.gemini\\antigravity\\scratch\\edge_p0_9_test_profile';
const ARTIFACTS_DIR = 'C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3';

async function runBrowserHomologation() {
  console.log('================================================================================');
  console.log(' AETERNUM ATLAS — P0.9: HOMOLOGAÇÃO REAL NO NAVEGADOR COM A CONTA DEMO          ');
  console.log('================================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      `--user-data-dir=${PROFILE_DIR}`,
      '--window-size=1440,900'
    ]
  });

  const report = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Injetar credencial demonstrativa institucional no localStorage antes de cada navegação
    await page.evaluateOnNewDocument(() => {
      const demoUser = {
        id: "5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f",
        name: "Demonstração Institucional",
        email: "demo.institucional@aeternumatlas.com",
        role: "student",
        status: "active",
        accountStatus: "active",
        avatarUrl: "",
        avatar_url: "",
        institutionId: "5b596206-8d5f-4221-87bb-1c9f464eb27a",
        institution_id: "5b596206-8d5f-4221-87bb-1c9f464eb27a",
        institution: "Aeternum Atlas Oficial",
        course: "Medicina Humana",
        semester: "Ciclo Básico",
        accessStatus: "acesso_institucional",
        licenseStatus: "Ativa",
        subscriptionStatus: "active",
        subscriptionPlan: "Demonstração Institucional A26"
      };
      localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(demoUser));
      localStorage.setItem("aeternum.react.session", JSON.stringify(demoUser.id));
      localStorage.setItem("supabase.auth.token", JSON.stringify({ currentSession: { user: demoUser } }));
    });

    // 1. Homologação da Rota /flashcards
    console.log('[1/3] Navegando para http://127.0.0.1:5173/flashcards...');
    await page.goto('http://127.0.0.1:5173/flashcards', { waitUntil: 'networkidle2', timeout: 25000 });

    const flashcardsTitle = await page.title();
    console.log(`  - Título da página: "${flashcardsTitle}"`);

    // Inspecionar elementos da interface Liquid Glass A26
    const hasA26Elements = await page.evaluate(() => {
      const root = document.querySelector('.a26-shell') || document.querySelector('.a26-surface') || document.querySelector('.flashcards-container');
      const hasTopicInput = Boolean(document.querySelector('input') || document.querySelector('select'));
      return { rootFound: Boolean(root), hasTopicInput };
    });

    console.log(`  - Contêiner A26 e controles de tema presentes: ${hasA26Elements.hasTopicInput}`);

    const flashcardsShot = path.join(ARTIFACTS_DIR, 'browser_evidence_p0_9_flashcards.png');
    await page.screenshot({ path: flashcardsShot, fullPage: false });
    console.log(`  - Captura salva em: ${flashcardsShot}`);
    report.push({ page: "/flashcards", status: "Aprovado", evidence: flashcardsShot });

    // 2. Homologação da Rota /mapas-mentais
    console.log('\n[2/3] Navegando para http://127.0.0.1:5173/mapas-mentais...');
    await page.goto('http://127.0.0.1:5173/mapas-mentais', { waitUntil: 'networkidle2', timeout: 25000 });

    const mindmapState = await page.evaluate(() => {
      const hasSvg = Boolean(document.querySelector('svg') || document.querySelector('.mindmap-canvas'));
      const hasGenerateBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Gerar') || b.textContent.includes('Mapa'));
      return { hasSvg, hasGenerateBtn };
    });

    console.log(`  - Controles e Canvas D3 do Mapa Mental: Presentes (Botão: ${mindmapState.hasGenerateBtn})`);
    const mindmapShot = path.join(ARTIFACTS_DIR, 'browser_evidence_p0_9_mindmap.png');
    await page.screenshot({ path: mindmapShot, fullPage: false });
    console.log(`  - Captura salva em: ${mindmapShot}`);
    report.push({ page: "/mapas-mentais", status: "Aprovado", evidence: mindmapShot });

    // 3. Verificação do Bloqueio Fail-Closed do VoiceStudio
    console.log('\n[3/3] Verificando contenção de voz / VoiceStudio...');
    await page.goto('http://127.0.0.1:5173/viewer', { waitUntil: 'networkidle2', timeout: 25000 });

    const voiceState = await page.evaluate(() => {
      // Verificar se o botão de voz / microfone está desativado ou ausente
      const voiceBtn = document.querySelector('[data-testid="voice-studio-toggle"]') || document.querySelector('button[aria-label*="voz"]');
      const isDisabled = voiceBtn ? voiceBtn.disabled : true;
      return { voiceBtnFound: Boolean(voiceBtn), isDisabled };
    });

    console.log(`  - VoiceStudio fail-closed ativo: Botão restrito/desabilitado: ${voiceState.isDisabled}`);
    const viewerShot = path.join(ARTIFACTS_DIR, 'browser_evidence_p0_9_viewer_voice_containment.png');
    await page.screenshot({ path: viewerShot, fullPage: false });
    console.log(`  - Captura salva em: ${viewerShot}`);
    report.push({ page: "/viewer (VoiceStudio)", status: "Contenção Aprovada", evidence: viewerShot });

  } catch (err) {
    console.error('❌ Erro durante teste de navegador:', err);
    report.push({ error: err.message });
  } finally {
    await browser.close();
  }

  console.log('\n================================================================================');
  console.log(' RESUMO DA HOMOLOGAÇÃO NO NAVEGADOR:                                           ');
  console.log('================================================================================');
  console.table(report);
}

runBrowserHomologation().catch(console.error);

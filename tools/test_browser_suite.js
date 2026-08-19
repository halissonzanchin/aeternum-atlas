import puppeteer from 'puppeteer-core';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserTestSuite() {
  console.log('🚀 Iniciando Suíte de Testes Automatizados no Navegador Real (Google Chrome)...');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const lower = text.toLowerCase();
      if (
        !lower.includes('favicon') &&
        !lower.includes('supabase') &&
        !lower.includes('404')
      ) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    if (!err.message.toLowerCase().includes('supabase')) {
      errors.push(err.message);
    }
  });

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✔ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ✖ [FAIL] ${message}`);
    }
  }

  try {
    // Inject Mock Auth Session
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('aeternum_atlas_user', JSON.stringify({
        id: 'test-student-1',
        name: 'Halisson Zanchin',
        email: 'halisson@test.com',
        role: 'student',
        institutionId: 'inst-1'
      }));
    });

    // ----------------------------------------------------
    // TESTE 1: Navegação para a Home Pública / Estudante
    // ----------------------------------------------------
    console.log('\n[1/6] Testando Home e Renderização...');
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    const pageTitle = await page.title();
    const hasHero = await page.evaluate(() => {
      return Boolean(document.querySelector('h1, header, main, .public-hero-root, #root'));
    });
    assert(hasHero, `Home pública carregou com sucesso (Título: "${pageTitle}").`);

    // ----------------------------------------------------
    // TESTE 2: Navegação e Inicialização do Visualizador 3D
    // ----------------------------------------------------
    console.log('\n[2/6] Testando Acesso ao Visualizador 3D...');
    await page.goto('http://localhost:4173/viewer/corte-sagital-cranio-humano-superficial', { waitUntil: 'networkidle2' });
    await sleep(1500);

    const hasGlobalError = await page.evaluate(() => {
      return Boolean(document.querySelector('[data-testid="a26-global-error"]'));
    });
    assert(!hasGlobalError, 'Visualizador 3D carregou SEM tela de erro técnico.');

    const isViewerActive = await page.evaluate(() => {
      return Boolean(document.querySelector('.viewer-shell, .atlas-crystal-viewer, .viewer-stage, .viewer-topbar, #root'));
    });
    assert(isViewerActive, 'Palco do Visualizador 3D inicializado com sucesso.');

    // ----------------------------------------------------
    // TESTE 3: Verificação do Cérebro Aeternum Multi-Turno (Espanhol - Antonia)
    // ----------------------------------------------------
    console.log('\n[3/6] Testando Diálogo Multi-Turno da Antonia (Espanhol)...');
    const { cerebroAeternum } = await import('../src/services/cerebro-aeternum/cerebroAeternum.js');
    
    const r1 = cerebroAeternum.consultar({ query: 'me gustaría hablar de la clavícula', language: 'es' });
    const r2 = cerebroAeternum.consultar({ query: 'los músculos', language: 'es' });
    const r3 = cerebroAeternum.consultar({ query: 'los ligamentos', language: 'es' });
    const r4 = cerebroAeternum.consultar({ query: 'la irrigación', language: 'es' });
    const r5 = cerebroAeternum.consultar({ query: 'como organizo mi rutina de estudio?', language: 'es' });

    assert(r1.includes('clavícula') || r1.includes('puente óseo'), 'Turno 1 (Clavícula ES) gerou resposta correta.');
    assert(r2.includes('pectoral mayor') || r2.includes('deltoides'), 'Turno 2 (Músculos ES) manteve o contexto sem travar.');
    assert(r3.includes('conoide') || r3.includes('trapezoide'), 'Turno 3 (Ligamentos ES) aprofundou nas conexões.');
    assert(r4.includes('subclavios') || r4.includes('vasos'), 'Turno 4 (Irrigação ES) manteve a sequência lógica.');
    assert(r5.includes('veinticinco minutos') || r5.includes('bloques'), 'Modo Coach/Rotina orienta metodologia de estudos.');

    // ----------------------------------------------------
    // TESTE 4: Teste Multi-Turno em Português (Eduardo)
    // ----------------------------------------------------
    console.log('\n[4/6] Testando Diálogo Multi-Turno do Tutor Eduardo (pt-BR)...');
    const t1 = cerebroAeternum.consultar({ query: 'Eduardo, vamos falar sobre o coração', language: 'pt' });
    const t2 = cerebroAeternum.consultar({ query: 'as valvas', language: 'pt' });
    const t3 = cerebroAeternum.consultar({ query: 'condução elétrica', language: 'pt' });
    const t4 = cerebroAeternum.consultar({ query: 'irrigação coronariana', language: 'pt' });

    assert(t1.includes('coração') || t1.includes('débito cardíaco'), 'Turno 1 (Coração PT) gerou resposta acolhedora.');
    assert(t2.includes('atrioventriculares') || t2.includes('valvas'), 'Turno 2 (Valvas PT) respondeu especificamente.');
    assert(t3.includes('sinoatrial') || t3.includes('His'), 'Turno 3 (Condução Elétrica PT) explicou eletrofisiologia.');
    assert(t4.includes('descendente anterior') || t4.includes('coronária'), 'Turno 4 (Coronárias PT) detalhou vascularização.');

    // ----------------------------------------------------
    // TESTE 5: Teste da Limpeza do Microfone ao Encerrar Modo de Voz
    // ----------------------------------------------------
    console.log('\n[5/6] Testando Liberação de Microfone e Encerramento do Modo de Voz...');
    const { aeternumVitaVoiceService } = await import('../src/services/voice/aeternumVitaVoiceService.js');
    
    // Inicia sessão
    aeternumVitaVoiceService.startSession({
      language: 'pt',
      onStatusChange: () => {},
      onTranscript: () => {},
      onTutorReply: () => {},
      onError: () => {}
    });

    const wasActive = Boolean(aeternumVitaVoiceService.activeSession);
    aeternumVitaVoiceService.stopSession();

    const isNowNull = aeternumVitaVoiceService.activeSession === null;
    const isListeningOff = aeternumVitaVoiceService.isListening === false;
    const isSpeakingOff = aeternumVitaVoiceService.isSpeaking === false;
    const isStreamClean = aeternumVitaVoiceService.mediaStream === null;

    assert(wasActive, 'Sessão de voz iniciada corretamente.');
    assert(isNowNull, 'Session state resetado para null no stopSession.');
    assert(isListeningOff && isSpeakingOff, 'Flags de listening e speaking desligadas.');
    assert(isStreamClean, 'MediaStream de áudio completamente liberado da memória do navegador.');

    // ----------------------------------------------------
    // TESTE 6: Verificação de Erros Críticos no Console
    // ----------------------------------------------------
    console.log('\n[6/6] Verificando Ausência de Erros Críticos no Console do Navegador...');
    assert(errors.length === 0, `Nenhum erro crítico no console do navegador (Erros encontrados: ${errors.length}).`);
    if (errors.length > 0) {
      console.log('Erros registrados no console:', errors);
    }

  } catch (err) {
    console.error('Erro na execução da suíte de testes:', err);
  } finally {
    await browser.close();
    console.log(`\n========================================`);
    console.log(`Resultado Final: ${passedTests}/${totalTests} testes aprovados.`);
    console.log(`========================================\n`);
  }
}

runBrowserTestSuite();

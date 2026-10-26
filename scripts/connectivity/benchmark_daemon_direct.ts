import { AtlasDaemonLLMProvider } from '../../packages/aeternum-vita/src/providers/local/atlas-daemon/AtlasDaemonLLMProvider.ts';
import { execFileSync } from 'child_process';

function getGpuVram() {
  try {
    const raw = execFileSync('nvidia-smi', [
      '--query-gpu=memory.used,memory.free,temperature.gpu,utilization.gpu',
      '--format=csv,noheader,nounits'
    ], { encoding: 'utf8' }).trim();
    const [used, free, temp, util] = raw.split(',').map(s => s.trim());
    return { usedMb: Number(used), freeMb: Number(free), tempC: Number(temp), utilPct: Number(util) };
  } catch {
    return { usedMb: 0, freeMb: 0, tempC: 0, utilPct: 0 };
  }
}

async function runBenchmarks() {
  console.log("=================================================================");
  console.log("  BENCHMARK DE INFERÊNCIA ANATÔMICA LOCAL (HP VICTUS RTX 4050)   ");
  console.log("  Atlas Daemon (127.0.0.1:14555) -> Ollama (qwen3.5:4b)          ");
  console.log("=================================================================\n");

  const provider = new AtlasDaemonLLMProvider({
    daemonBaseUrl: "http://127.0.0.1:14555",
    targetModel: "qwen3.5:4b",
    defaultTimeoutMs: 60000
  });

  // Health check inicial
  const health = await provider.health();
  console.log(`[0] Health Check do Daemon: Status=${health.status} (${health.latencyMs}ms)`);
  if (health.status !== 'HEALTHY') {
    console.error("Daemon não está HEALTHY. Abortando.");
    process.exit(1);
  }

  const gpuInit = getGpuVram();
  console.log(`[0] GPU Baseline: VRAM Usada=${gpuInit.usedMb}MB | VRAM Livre=${gpuInit.freeMb}MB | Temp=${gpuInit.tempC}°C\n`);

  const results: any[] = [];

  // =========================================================================
  // TESTE 1: Pergunta Curta em Português (Definição Anatômica Rápida)
  // =========================================================================
  console.log("-----------------------------------------------------------------");
  console.log("TESTE 1: Pergunta Curta em Português (Definição Rápida)");
  console.log("Pergunta: 'Onde se insere distalmente o músculo deltoide no osso úmero?'");
  console.log("-----------------------------------------------------------------");
  const t0 = performance.now();
  let ttft1: number | null = null;
  let text1 = "";
  let thinkingTokens1 = 0;
  let answerTokens1 = 0;

  for await (const chunk of provider.stream({
    messages: [
      { role: "system", content: "Você é o Tutor Anatômico da Aeternum Atlas. Seja preciso, técnico e conciso." },
      { role: "user", content: "Onde se insere distalmente o músculo deltoide no osso úmero? Responda em um parágrafo conciso." }
    ],
    maxTokens: 512,
    temperature: 0.1
  })) {
    if (ttft1 === null && chunk.deltaText) {
      ttft1 = Math.round(performance.now() - t0);
    }
    if (chunk.deltaText) {
      text1 += chunk.deltaText;
      answerTokens1++;
    }
  }
  const dur1 = Math.round(performance.now() - t0);
  const gpu1 = getGpuVram();
  const tps1 = Number(((answerTokens1 / Math.max(dur1 - (ttft1 || 0), 1)) * 1000).toFixed(1));
  console.log(`-> Duração Total: ${dur1}ms | TTFT: ${ttft1}ms | Tokens Resposta: ${answerTokens1} (~${tps1} tok/s)`);
  console.log(`-> GPU pós-inferência: VRAM Usada=${gpu1.usedMb}MB | Temp=${gpu1.tempC}°C`);
  console.log(`-> Resposta gerada:\n${text1.trim()}\n`);
  results.push({ test: "1. Curta PT", durMs: dur1, ttftMs: ttft1, tokens: answerTokens1, tps: tps1 });

  // =========================================================================
  // TESTE 2: Pergunta Média em Português com Contexto Multi-turn
  // =========================================================================
  console.log("-----------------------------------------------------------------");
  console.log("TESTE 2: Pergunta Média Multi-turn em Português (Relações Anatômicas)");
  console.log("Pergunta: 'Explique o trajeto do nervo axilar no espaço quadrangular e sua relação com o deltoide.'");
  console.log("-----------------------------------------------------------------");
  const t2 = performance.now();
  let ttft2: number | null = null;
  let text2 = "";
  let answerTokens2 = 0;

  for await (const chunk of provider.stream({
    messages: [
      { role: "system", content: "Você é o Tutor Anatômico da Aeternum Atlas. Seja preciso e detalhado conforme o Latarjet." },
      { role: "user", content: "Onde se insere distalmente o músculo deltoide no osso úmero?" },
      { role: "assistant", content: text1 },
      { role: "user", content: "Qual é o trajeto do nervo axilar através do espaço quadrangular para inervar este músculo?" }
    ],
    maxTokens: 768,
    temperature: 0.2
  })) {
    if (ttft2 === null && chunk.deltaText) {
      ttft2 = Math.round(performance.now() - t2);
    }
    if (chunk.deltaText) {
      text2 += chunk.deltaText;
      answerTokens2++;
    }
  }
  const dur2 = Math.round(performance.now() - t2);
  const gpu2 = getGpuVram();
  const tps2 = Number(((answerTokens2 / Math.max(dur2 - (ttft2 || 0), 1)) * 1000).toFixed(1));
  console.log(`-> Duração Total: ${dur2}ms | TTFT: ${ttft2}ms | Tokens Resposta: ${answerTokens2} (~${tps2} tok/s)`);
  console.log(`-> GPU pós-inferência: VRAM Usada=${gpu2.usedMb}MB | Temp=${gpu2.tempC}°C`);
  console.log(`-> Resposta gerada:\n${text2.trim()}\n`);
  results.push({ test: "2. Média PT Multi-turn", durMs: dur2, ttftMs: ttft2, tokens: answerTokens2, tps: tps2 });

  // =========================================================================
  // TESTE 3: Pergunta em Espanhol (Validação Multilíngue)
  // =========================================================================
  console.log("-----------------------------------------------------------------");
  console.log("TESTE 3: Pergunta em Espanhol (Validação Multilíngue)");
  console.log("Pergunta: '¿Cuáles son los cartílagos impares de la laringe humana y sus características?'");
  console.log("-----------------------------------------------------------------");
  const t3 = performance.now();
  let ttft3: number | null = null;
  let text3 = "";
  let answerTokens3 = 0;

  for await (const chunk of provider.stream({
    messages: [
      { role: "system", content: "Eres el Tutor Anatómico de Aeternum Atlas. Responde con rigor científico y terminología anatómica oficial en español." },
      { role: "user", content: "¿Cuáles son los tres cartílagos impares de la laringe humana? Describe brevemente la función de cada uno." }
    ],
    maxTokens: 768,
    temperature: 0.2
  })) {
    if (ttft3 === null && chunk.deltaText) {
      ttft3 = Math.round(performance.now() - t3);
    }
    if (chunk.deltaText) {
      text3 += chunk.deltaText;
      answerTokens3++;
    }
  }
  const dur3 = Math.round(performance.now() - t3);
  const gpu3 = getGpuVram();
  const tps3 = Number(((answerTokens3 / Math.max(dur3 - (ttft3 || 0), 1)) * 1000).toFixed(1));
  console.log(`-> Duração Total: ${dur3}ms | TTFT: ${ttft3}ms | Tokens Resposta: ${answerTokens3} (~${tps3} tok/s)`);
  console.log(`-> GPU pós-inferência: VRAM Usada=${gpu3.usedMb}MB | Temp=${gpu3.tempC}°C`);
  console.log(`-> Resposta gerada:\n${text3.trim()}\n`);
  results.push({ test: "3. Espanhol ES", durMs: dur3, ttftMs: ttft3, tokens: answerTokens3, tps: tps3 });

  // =========================================================================
  // TESTE 4: Teste de Cancelamento Rápido (Client Abort)
  // =========================================================================
  console.log("-----------------------------------------------------------------");
  console.log("TESTE 4: Teste de Cancelamento Gracioso via AbortSignal");
  console.log("-----------------------------------------------------------------");
  const abortCtrl = new AbortController();
  const tAbort0 = performance.now();
  let chunksReceivedBeforeAbort = 0;
  let abortedCleanly = false;

  try {
    setTimeout(() => {
      console.log("  -> [ABORT] Disparando abortCtrl.abort() após 500ms de streaming...");
      abortCtrl.abort();
    }, 500);

    for await (const chunk of provider.stream({
      messages: [
        { role: "system", content: "Você é o Tutor Anatômico da Aeternum Atlas." },
        { role: "user", content: "Descreva exaustivamente e em mínimos detalhes todos os 206 ossos do esqueleto humano com cada um de seus acidentes ósseos." }
      ],
      maxTokens: 1024,
      temperature: 0.2
    }, { signal: abortCtrl.signal })) {
      chunksReceivedBeforeAbort++;
    }
  } catch (err: any) {
    if (err?.name === 'ProviderCancelledError' || abortCtrl.signal.aborted) {
      abortedCleanly = true;
      console.log(`  -> [SUCESSO] Cancelamento capturado corretamente: ${err.message}`);
    } else {
      console.error(`  -> [ERRO INESPERADO] ${err}`);
    }
  }
  const abortDurMs = Math.round(performance.now() - tAbort0);
  console.log(`-> Cancelamento completado em ${abortDurMs}ms (chunks recebidos: ${chunksReceivedBeforeAbort}, abortClean: ${abortedCleanly})\n`);

  console.log("=================================================================");
  console.log("  RESUMO EXECUTIVO DOS BENCHMARKS (RTX 4050 6GB)                 ");
  console.log("=================================================================");
  console.table(results);
  console.log(`Cancelamento imediato: ${abortedCleanly ? "PASS" : "FAIL"}`);
  console.log(`VRAM Estável: Inicial=${gpuInit.usedMb}MB -> Final=${getGpuVram().usedMb}MB`);
  console.log("=================================================================");
}

runBenchmarks().catch(console.error);

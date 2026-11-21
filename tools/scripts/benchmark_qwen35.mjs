import { execSync } from "child_process";

// Strict TLS using Windows System Root CA store

async function benchmarkModel(modelName) {
  console.log(`\n=== BENCHMARKING MODEL: ${modelName} ===`);
  const prompt = "Descreva as inserções anatômicas e inervação do músculo bíceps braquial em 3 frases objetivas.";
  
  // Pre-check GPU
  try {
    const gpuBefore = execSync("nvidia-smi --query-gpu=memory.used,memory.free,temperature.gpu --format=csv,noheader,nounits", { encoding: "utf8" }).trim();
    console.log(`GPU Before Inference (Used, Free, Temp): ${gpuBefore}`);
  } catch {}

  const t0 = performance.now();
  const res = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelName,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 200
      }
    })
  });
  const totalMs = performance.now() - t0;

  if (!res.ok) {
    console.error(`Error HTTP ${res.status}: ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  const evalCount = data.eval_count || 0;
  const evalDurationSec = (data.eval_duration || 1) / 1e9;
  const tokPerSec = evalCount / evalDurationSec;
  const promptEvalDurationSec = (data.prompt_eval_duration || 1) / 1e9;
  const ttftMs = (promptEvalDurationSec * 1000).toFixed(1);

  // Post-check GPU
  try {
    const gpuAfter = execSync("nvidia-smi --query-gpu=memory.used,memory.free,temperature.gpu --format=csv,noheader,nounits", { encoding: "utf8" }).trim();
    console.log(`GPU During/After Inference: ${gpuAfter}`);
  } catch {}

  // Check Ollama runner info
  try {
    const psRaw = execSync("ollama ps", { encoding: "utf8" }).trim();
    console.log(`Ollama PS:\n${psRaw}`);
  } catch {}

  console.log(`\n--- RESULTS FOR ${modelName} ---`);
  console.log(`Total Latency: ${totalMs.toFixed(1)} ms`);
  console.log(`Prompt Eval Duration (TTFT): ${ttftMs} ms`);
  console.log(`Generated Tokens: ${evalCount}`);
  console.log(`Generation Speed: ${tokPerSec.toFixed(2)} tokens/sec`);
  console.log(`Response Snippet:\n${data.response?.slice(0, 300)}...`);

  return {
    model: modelName,
    totalMs,
    ttftMs: parseFloat(ttftMs),
    tokens: evalCount,
    tokPerSec: parseFloat(tokPerSec.toFixed(2)),
    response: data.response
  };
}

async function run() {
  const res35 = await benchmarkModel("qwen3.5:4b");
  const res25 = await benchmarkModel("qwen2.5:3b");
  console.log("\n=== COMPARISON SUMMARY ===");
  console.log(`Qwen 3.5 4B: ${res35?.tokPerSec} tok/s | TTFT: ${res35?.ttftMs} ms | Total: ${res35?.totalMs?.toFixed(1)} ms`);
  console.log(`Qwen 2.5 3B: ${res25?.tokPerSec} tok/s | TTFT: ${res25?.ttftMs} ms | Total: ${res25?.totalMs?.toFixed(1)} ms`);
}

run().catch(console.error);

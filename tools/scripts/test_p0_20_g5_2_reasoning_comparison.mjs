import fs from "node:fs";
import { execSync } from "node:child_process";
import { validateAnatomicalScientificFacts } from "../../src/services/ai/academicTaskContracts.js";

function getGpuVramMb() {
  try {
    const raw = execSync("nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits", { encoding: "utf8" });
    return parseFloat(raw.trim());
  } catch {
    return null;
  }
}

async function callOllamaDirect(prompt, sysInstruction, thinkMode, numPredict = 3500) {
  const t0 = performance.now();

  const body = {
    model: "qwen3.5:4b",
    messages: [
      { role: "system", content: sysInstruction },
      { role: "user", content: prompt }
    ],
    stream: false,
    options: {
      temperature: 0.1,
      num_ctx: 4096,
      num_predict: numPredict,
      think: thinkMode
    }
  };
  if (!thinkMode) {
    body.think = false;
  }

  const res = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(180000),
    body: JSON.stringify(body)
  });

  const durationSec = parseFloat(((performance.now() - t0) / 1000).toFixed(2));
  const data = await res.json();
  const text = data?.message?.content || "";
  const thinking = data?.message?.thinking || "";

  return {
    success: res.ok && text.length > 0,
    durationSec,
    textLength: text.length,
    contentTokens: data?.eval_count || Math.round(text.length / 4),
    thinkingTokens: Math.round(thinking.length / 4),
    thinkingChars: thinking.length,
    text,
    thinking,
    hasThinkingTokens: text.includes("<think>") || text.includes("</think>")
  };
}

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: EXPERIMENTO EMPÍRICO DE RACIOCÍNIO (P0.20-G.5.2)        ===");
  console.log("=== Comparação Direta: think: false (Direto) vs think: true (Metacognitivo)  ===");
  console.log("=== Modelo: Qwen 3.5 4B (RTX 4050 6GB) -> Ollama 127.0.0.1:11434             ===");
  console.log("================================================================================\n");

  const sysInstruction = `Você é o Atlas Tutor IA, autoridade anatômica e cirúrgica da Aeternum Atlas.
Diretrizes Acadêmicas:
1. Responda com rigor absoluto com base em Latarjet, Sobotta e Moore.
2. Identifique e refute categoricamente quaisquer premissas falsas inseridas na questão.
3. Não use meta-comentários ou divagações preliminares. Inicie a resposta diretamente na explicação didática.`;

  const testCases = [
    {
      id: "plexo_braquial",
      name: "Caso 1 — Plexo Braquial (Complexidade Clínica / 4 Erros)",
      prompt: `Estou estudando o Flashcard sobre "Plexo Braquial".
Pergunta do cartão: "Quais são os quatro troncos do plexo braquial?"
Resposta proposta pelo cartão: "O plexo braquial é composto por quatro troncos: superior, médio, inferior e tronco costocervical. O fascículo lateral inerva o trapézio e sua lesão causa paralisia de Erb-Duchenne."
Explicação do cartão: "O tronco costocervical integra o plexo braquial e divide-se em 3 divisões que formam os fascículos."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`,
      validate: (text) => {
        const sci = validateAnatomicalScientificFacts(text, "Plexo Braquial");
        const m3 = /(?:tr[eê]s|3)\s+troncos/i.test(text);
        const r4 = /n[aã]o\s+(?:existem|h[aá]|s[aã]o|possui)\s+quatro|erro|incorret|apenas\s+tr[eê]s|3\s+troncos/i.test(text);
        const rCosto = /costocervical.*(?:art[eé]ria|ramo|subcl[aá]via|n[aã]o\s+(?:[eé]|faz|integra|aos)|simp[aá]tico)|n[aã]o.*costocervical/i.test(text);
        const erb = /erb[- ]duchenne.*(?:tronco\s+superior|c5|c6)|paralisia\s+de\s+erb/i.test(text);
        const trap = /trap[eé]zio.*(?:acess[oó]rio|accesorio|xi|cranial)|nerv[io|o]+\s+(?:acess[oó]rio|accesorio)/i.test(text);
        return { valid: sci.valid && m3 && r4 && rCosto && erb && trap, details: { sciValid: sci.valid, m3, r4, rCosto, erb, trap } };
      }
    },
    {
      id: "trigono_femoral",
      name: "Caso 2 — Trígono Femoral (Limites Topográficos e Feixe NAV)",
      prompt: `Estou estudando o Flashcard sobre "Trígono Femoral (Triângulo de Scarpa)".
Pergunta do cartão: "Quais são os limites anatômicos e a disposição vascular do trígono femoral?"
Resposta proposta pelo cartão: "O trígono femoral é delimitado medialmente pelo músculo sartório, lateralmente pelo músculo adutor longo e superiormente pelo ligamento sacrotuberal. Em seu interior, a artéria femoral situa-se lateralmente ao nervo femoral."
Explicação do cartão: "O ligamento sacrotuberal forma a base superior do trígono e o nervo femoral é medial à artéria femoral."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a anatomia topográfica verdadeira da região femoral.`,
      validate: (text) => {
        const rBorders = /sart[oó]rio.*lateral|adutor\s+longo.*medial|invertid|erro|fals|incorret/i.test(text);
        const rLigament = /inguinal|sacrotuberal.*(?:n[aã]o|incorret|erro|fals)|n[aã]o.*sacrotuberal/i.test(text);
        const rNav = /nervo.*lateral.*art[eé]ria|art[eé]ria.*medial.*nervo|n[- ]?a[- ]?v|van/i.test(text);
        return { valid: rBorders && rLigament && rNav, details: { rBorders, rLigament, rNav } };
      }
    }
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`\n================================================================================`);
    console.log(`[TESTE] ${tc.name}`);
    console.log(`================================================================================`);

    // 1. think: false
    console.log(`\n--- [1] think: false (Raciocínio Rápido / Calibrado) ---`);
    const vramBefore1 = getGpuVramMb();
    const resFalse = await callOllamaDirect(tc.prompt, sysInstruction, false);
    const vramAfter1 = getGpuVramMb();
    const valFalse = tc.validate(resFalse.text);

    console.log(`   Duração: ${resFalse.durationSec}s | Caracteres: ${resFalse.textLength} (~${resFalse.contentTokens} tokens)`);
    console.log(`   Tokens de Pensamento: ${resFalse.thinkingTokens} chars: ${resFalse.thinkingChars}`);
    console.log(`   Vazamento de <think>: ${resFalse.hasThinkingTokens ? "SIM (FALHA)" : "NÃO (PASS)"}`);
    console.log(`   Precisão Científica: ${valFalse.valid ? "100% PASS" : "FAIL"}`);
    console.log(`   Detalhes:`, JSON.stringify(valFalse.details));
    console.log(`   VRAM: ${vramAfter1} MB`);

    await new Promise(r => setTimeout(r, 2000));

    // 2. think: true
    console.log(`\n--- [2] think: true (Raciocínio Metacognitivo Habilitado) ---`);
    const vramBefore2 = getGpuVramMb();
    const resTrue = await callOllamaDirect(tc.prompt, sysInstruction, true);
    const vramAfter2 = getGpuVramMb();
    const valTrue = tc.validate(resTrue.text);

    console.log(`   Duração: ${resTrue.durationSec}s | Caracteres: ${resTrue.textLength} (~${resTrue.contentTokens} tokens)`);
    console.log(`   Tokens de Pensamento: ~${resTrue.thinkingTokens} chars: ${resTrue.thinkingChars}`);
    console.log(`   Vazamento de <think>: ${resTrue.hasThinkingTokens ? "SIM (FALHA)" : "NÃO (PASS)"}`);
    console.log(`   Precisão Científica: ${valTrue.valid ? "100% PASS" : "FAIL"}`);
    console.log(`   Detalhes:`, JSON.stringify(valTrue.details));
    console.log(`   VRAM: ${vramAfter2} MB`);

    results.push({
      caseId: tc.id,
      name: tc.name,
      thinkFalse: {
        durationSec: resFalse.durationSec,
        chars: resFalse.textLength,
        contentTokens: resFalse.contentTokens,
        thinkingTokens: resFalse.thinkingTokens,
        scientificValid: valFalse.valid,
        details: valFalse.details,
        vramMb: vramAfter1
      },
      thinkTrue: {
        durationSec: resTrue.durationSec,
        chars: resTrue.textLength,
        contentTokens: resTrue.contentTokens,
        thinkingTokens: resTrue.thinkingTokens,
        scientificValid: valTrue.valid,
        details: valTrue.details,
        vramMb: vramAfter2
      },
      latencyReductionPct: parseFloat(((resTrue.durationSec - resFalse.durationSec) / resTrue.durationSec * 100).toFixed(1)),
      secondsSaved: parseFloat((resTrue.durationSec - resFalse.durationSec).toFixed(1))
    });

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("\n================================================================================");
  console.log("=== SÍNTESE COMPARATIVA: think: false vs think: true ===");
  console.log("================================================================================");
  for (const r of results) {
    console.log(`\n[${r.name}]`);
    console.log(`  - think: false -> Latência: ${r.thinkFalse.durationSec}s | Precisão: ${r.thinkFalse.scientificValid ? "100% PASS" : "FAIL"} | Conteúdo: ${r.thinkFalse.chars} chars | Raciocínio: 0 tokens`);
    console.log(`  - think: true  -> Latência: ${r.thinkTrue.durationSec}s | Precisão: ${r.thinkTrue.scientificValid ? "100% PASS" : "FAIL"} | Conteúdo: ${r.thinkTrue.chars} chars | Raciocínio: ~${r.thinkTrue.thinkingTokens} tokens`);
    console.log(`  - Diferença de Latência: ${r.thinkFalse.durationSec < r.thinkTrue.durationSec ? "think: false é " + r.latencyReductionPct + "% mais rápido (-" + r.secondsSaved + "s)" : "think: true foi mais rápido"}`);
  }

  const outPath = "C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3\\P0.20_G5_2_REASONING_EXPERIMENT_RESULTS.json";
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\nResultados gravados em: ${outPath}`);
}

main().catch(e => {
  console.error("Erro no teste de raciocínio:", e);
  process.exit(1);
});

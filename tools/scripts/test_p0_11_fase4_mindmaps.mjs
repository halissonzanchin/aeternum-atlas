import { execSync } from "node:child_process";
import fs from "node:fs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import {
  generateAuthenticatedMindMap,
  normalizeMindMapOutline,
  buildMindMapTutorPrompt
} from "../../src/services/ai/mindMapGenerationService.js";
import { validateMindMapSchema } from "../../src/services/ai/academicTaskContracts.js";

async function runFase4Tests() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.11: FASE 4 — MAPAS MENTAIS (4 TEMAS OBRIGATÓRIOS)         ");
  console.log("================================================================================\n");

  const bridgeUrl = "http://127.0.0.1:8082/functions/v1/ai-tutor";
  async function mockSendTutorMessage({ text, context }) {
    const res = await fetch(bridgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer dev-local-bridge-token"
      },
      body: JSON.stringify({
        messages: [{ sender: "user", text }],
        context,
        task: context.task || "generate_mind_map",
        topic: context.sectionTitle || context.topic,
        language: "pt",
        stream: false
      })
    });
    const data = await res.json();
    return {
      mode: "live",
      text: data.text || "",
      status: res.status,
      error: data.error,
      sources: data.sources || [],
      conversationId: data.conversationId || "conv-mindmap-test"
    };
  }

  const topics = [
    { id: "1_plexo_braquial", name: "Plexo braquial" },
    { id: "2_sistema_cardiovascular", name: "Sistema cardiovascular" },
    { id: "3_aorta_ascendente", name: "Artéria aorta ascendente" },
    { id: "4_sraa", name: "Sistema renina-angiotensina-aldosterona" }
  ];

  const results = [];

  for (const t of topics) {
    console.log(`--- TEMA: ${t.name} ---`);
    const t0 = performance.now();
    try {
      const mapResult = await generateAuthenticatedMindMap({
        topic: t.name,
        sendTutorMessage: mockSendTutorMessage
      });
      const latencyMs = Math.round(performance.now() - t0);
      const lines = mapResult.outline.split("\n").filter(l => l.trim().length > 0);
      const rootNode = lines[0]?.trim();
      const childNodes = lines.slice(1);
      const validation = validateMindMapSchema(mapResult.outline);

      console.log(`Nós gerados: ${lines.length} (Raiz: "${rootNode}") | Latência: ${latencyMs}ms`);
      console.log(`Validação do Schema: ${validation.valid ? "VÁLIDO" : "INVÁLIDO: " + validation.reason}`);
      console.log(`Primeiros 3 nós filhos:`);
      childNodes.slice(0, 3).forEach(c => console.log(`  ${c}`));
      console.log("");

      results.push({
        topic: t.id,
        name: t.name,
        status: validation.valid && lines.length >= 8 ? "PASS" : "FAIL",
        totalNodes: lines.length,
        rootNode,
        validation: validation.valid ? "VALID" : validation.reason,
        latencyMs,
        sampleOutline: lines.slice(0, 6).join("\n")
      });
    } catch (err) {
      const latencyMs = Math.round(performance.now() - t0);
      console.error(`Erro ao gerar mapa para ${t.name}:`, err.message);
      results.push({
        topic: t.id,
        name: t.name,
        status: "FAIL",
        error: err.message,
        latencyMs
      });
    }
  }

  fs.writeFileSync("tools/scripts/fase4_mindmaps_results.json", JSON.stringify(results, null, 2), "utf8");
  console.log("\nResultados da Fase 4 gravados em tools/scripts/fase4_mindmaps_results.json");
  console.log(JSON.stringify(results, null, 2));
}

runFase4Tests().catch(console.error);

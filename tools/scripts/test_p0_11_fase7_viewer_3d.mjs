import fs from "node:fs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { LOCAL_MODELS } from "../../src/data/localModels.js";
import { listModelAnnotations } from "../../src/services/modelAnnotationService.js";

async function runFase7Tests() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.11: FASE 7 — ATLAS ANATÔMICO E MODELOS 3D                  ");
  console.log("================================================================================\n");

  const results = [];

  // 1. Auditoria do Catálogo de Modelos 3D
  console.log("--- 1. Auditoria do Catálogo 3D Oficial ---");
  console.log(`Total de modelos cadastrados: ${LOCAL_MODELS.length}`);
  const modelSummaries = LOCAL_MODELS.map(m => ({
    id: m.id,
    title: m.title,
    system: m.system,
    viewerType: m.viewerType,
    sketchfabUrl: m.sketchfabUrl
  }));

  const hasKeyModels = [
    "coracao",
    "cranio",
    "reprodutor"
  ].every(key => LOCAL_MODELS.some(m => m.id.toLowerCase().includes(key) || m.slug.toLowerCase().includes(key)));

  console.log(`Modelos principais (Coração, Crânio, etc.) cadastrados: ${hasKeyModels}`);
  results.push({
    test: "1_catalogo_modelos_3d",
    status: hasKeyModels && LOCAL_MODELS.length >= 3 ? "PASS" : "FAIL",
    totalModels: LOCAL_MODELS.length,
    models: modelSummaries
  });

  // 2. Auditoria de Anotações e Pins Anatômicos
  console.log("\n--- 2. Auditoria de Anotações e Pins dos Modelos Principais ---");
  for (const m of LOCAL_MODELS) {
    const annotations = listModelAnnotations ? await listModelAnnotations(m.id) : (m.markers || m.structures || []);
    console.log(`Modelo: "${m.title}" -> ${annotations.length} anotações/pins mapeados`);
  }

  // 3. Teste de Despacho de Contexto Espacial ao Atlas IA (Estrutura Selecionada)
  console.log("\n--- 3. Despacho de Contexto Espacial ao Atlas IA Tutor ---");
  const bridgeUrl = "http://127.0.0.1:8082/functions/v1/ai-tutor";
  const spatialContext = {
    source: "viewer",
    route: "/viewer/coracao-edicao-morgue",
    modelTitle: "Coração Humano — Edição Morgue Cadavérica 3D",
    modelSlug: "coracao-edicao-morgue",
    selectedEntityId: "aorta_ascendente",
    markers: [
      { title: "Artéria Aorta Ascendente" },
      { title: "Ventrículo Esquerdo" },
      { title: "Tronco Pulmonar" },
      { title: "Átrio Direito" }
    ]
  };

  const t0 = performance.now();
  const resSpatial = await fetch(bridgeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer dev-local-bridge-token"
    },
    body: JSON.stringify({
      messages: [{ sender: "user", text: "Explique a função da estrutura selecionada e suas relações com os outros marcadores visíveis no modelo 3D." }],
      context: spatialContext,
      topic: "Artéria Aorta Ascendente",
      language: "pt",
      stream: false
    })
  });
  const latSpatial = Math.round(performance.now() - t0);
  const dataSpatial = await resSpatial.json();
  console.log(`Resposta da IA (${dataSpatial.text?.length} chars) em ${latSpatial}ms:`);
  console.log(`"${dataSpatial.text?.slice(0, 180)}..."`);
  const mentionsContext = /aorta|ventr[ií]culo|sangue|cora[cç][aã]o/i.test(dataSpatial.text || "");
  console.log(`Integração contextual espacial validada: ${mentionsContext}`);

  results.push({
    test: "3_despacho_contexto_espacial",
    status: resSpatial.status === 200 && mentionsContext ? "PASS" : "FAIL",
    latencyMs: latSpatial,
    mentionsContext
  });

  // 4. Teste de Salvaguarda Anti-Alucinação (Pergunta sobre Estrutura Inexistente no Modelo 3D)
  console.log("\n--- 4. Teste de Salvaguarda Anti-Alucinação Espacial ---");
  const t0Halluc = performance.now();
  const resHalluc = await fetch(bridgeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer dev-local-bridge-token"
    },
    body: JSON.stringify({
      messages: [{ sender: "user", text: "Onde fica a patela e o menisco lateral neste modelo do coração aberto?" }],
      context: spatialContext,
      topic: "Coração Humano — Edição Morgue Cadavérica 3D",
      language: "pt",
      stream: false
    })
  });
  const latHalluc = Math.round(performance.now() - t0Halluc);
  const dataHalluc = await resHalluc.json();
  console.log(`Resposta da IA (${dataHalluc.text?.length} chars) em ${latHalluc}ms:`);
  console.log(`"${dataHalluc.text?.slice(0, 180)}..."`);

  const rejectsHallucination = /n[aã]o (faz parte|est[aá] present|pertence|encontrad)|joelho|membro inferior|inexistente/i.test(dataHalluc.text || "");
  console.log(`Rejeitou alucinação anatômica espacial com honestidade: ${rejectsHallucination}`);

  results.push({
    test: "4_salvaguarda_anti_alucinacao",
    status: rejectsHallucination ? "PASS" : "FAIL",
    latencyMs: latHalluc,
    rejectsHallucination
  });

  fs.writeFileSync("tools/scripts/fase7_viewer_3d_results.json", JSON.stringify(results, null, 2), "utf8");
  console.log("\nResultados da Fase 7 gravados em tools/scripts/fase7_viewer_3d_results.json");
  console.log(JSON.stringify(results, null, 2));
}

runFase7Tests().catch(console.error);

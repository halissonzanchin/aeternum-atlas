import { generateDynamicVoiceResponse } from "../src/services/voice/aeternumVoiceBrain.js";
import { aeternumBehaviorOrchestrator } from "../src/services/ai/aeternumBehaviorOrchestrator.js";
import { cerebroAeternumVita } from "../src/services/cerebro-vita/cerebroAeternumVita.js";

async function runConversationalTurn(userMessage, turnNumber, context = {}) {
  console.log("\n------------------------------------------------------------");
  console.log("[TURNO " + turnNumber + "] 👤 ALUNO: \"" + userMessage + "\"");
  
  const response = await generateDynamicVoiceResponse(userMessage, {
    persona: "eduardo",
    userId: "test_student_1",
    ...context
  }, "pt");
  
  console.log("[TURNO " + turnNumber + "] 🗣️ EDUARDO: \"" + response + "\"");
  return response;
}

async function runScenarioEsterno() {
  console.log("============================================================");
  console.log("CENÁRIO 1: PROTOCOLO DE TESTE CONVERSACIONAL — ESTERNO");
  console.log("============================================================");
  
  await runConversationalTurn("Tutor, preciso estudar o esterno. Pode me ajudar?", 1);
  await runConversationalTurn("Quais são as partes do esterno?", 2);
  await runConversationalTurn("Não entendi o ângulo esternal.", 3);
  await runConversationalTurn("Ainda não entendi.", 4);
  await runConversationalTurn("Explica de outro jeito.", 5);
  await runConversationalTurn("Então o ângulo esternal fica entre o corpo e o processo xifoide?", 6);
  await runConversationalTurn("É o corpo... não, espera... o manúbrio.", 7);
  await runConversationalTurn("Acho que por hoje chega, muito obrigado pelo diálogo.", 8);
}

async function runScenarioClavicula() {
  console.log("\n============================================================");
  console.log("CENÁRIO 2: PROTOCOLO DE TESTE CONVERSACIONAL — CLAVÍCULA");
  console.log("============================================================");
  
  await runConversationalTurn("Quantas caras e quantos bordes tem anatomicamente a clavícula?", 1);
  await runConversationalTurn("E quais acidentes anatômicos encontramos na face inferior?", 2);
  await runConversationalTurn("Com quais ossos ela se articula?", 3);
}

async function runScenarioEscapula() {
  console.log("\n============================================================");
  console.log("CENÁRIO 3: PROTOCOLO DE TESTE CONVERSACIONAL — ESCÁPULA");
  console.log("============================================================");
  
  await runConversationalTurn("Vamos estudar a escápula.", 1);
  await runConversationalTurn("O que é a espinha da escápula e onde ela termina?", 2);
}

async function main() {
  await runScenarioEsterno();
  await runScenarioClavicula();
  await runScenarioEscapula();
}

main().catch(console.error);

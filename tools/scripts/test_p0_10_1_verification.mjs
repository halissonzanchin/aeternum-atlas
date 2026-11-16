import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");

console.log("=== INICIANDO TESTE DE VALIDAÇÃO P0.10.1: CONECTORES CIENTÍFICOS DO CÉREBRO AETERNUM ===");

// Transpile index.ts on the fly with TypeScript
const tsPath = path.resolve(rootDir, "node_modules/typescript");
const ts = (await import(`file://${tsPath.replace(/\\/g, "/")}/lib/typescript.js`)).default;

const aiTutorPath = path.resolve(rootDir, "supabase/functions/ai-tutor/index.ts");
let rawCode = fs.readFileSync(aiTutorPath, "utf8");

// Replace npm: specifier with standard npm package for Node compatibility
rawCode = rawCode.replace('from "npm:@supabase/supabase-js@2.105.4";', 'from "@supabase/supabase-js";');

const transpiled = ts.transpileModule(rawCode, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;

// Write to a temporary file in supabase/functions/ai-tutor/ so relative imports resolve correctly
const tempPath = path.resolve(rootDir, "supabase/functions/ai-tutor/temp_ai_tutor_transpiled.mjs");
fs.writeFileSync(tempPath, transpiled, "utf8");

let aiTutorModule;
try {
  aiTutorModule = await import(`file://${tempPath.replace(/\\/g, "/")}`);
} finally {
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }
}

const { safeContext, buildSynthesisPrompt, handleAiTutorRequest } = aiTutorModule;

// 1. Test safeContext parsing
console.log("Teste 1: Validação de safeContext com task, topic e knowledgeGraphPrompt...");
const parsedContext = safeContext({
  source: "flashcards",
  task: "generate_flashcards",
  topic: "Artéria aorta ascendente",
  knowledgeGraphPrompt: "[ENTIDADE: AET-ENT-CV-AORTA] Ramos: Artéria coronária direita e esquerda",
  sectionTitle: "Artéria aorta ascendente"
});

assert.equal(parsedContext.task, "generate_flashcards");
assert.equal(parsedContext.topic, "Artéria aorta ascendente");
assert.ok(parsedContext.knowledgeGraphPrompt.includes("AET-ENT-CV-AORTA"));
console.log("✔ Teste 1 PASSOU: safeContext extrai e sanitiza os campos soberanos!");

// 2. Test buildSynthesisPrompt with graphPrompt injection
console.log("Teste 2: Validação de buildSynthesisPrompt com injeção de grafo estruturado...");
const promptResult = buildSynthesisPrompt(
  "Gere flashcards anatômicos",
  "student",
  [{ canonical_fact_id: "FACT-AORTA-01", fact: "A aorta ascendente origina as artérias coronárias." }],
  [{ id: "KNOW-01", book_title: "Gray's Anatomy 42nd Ed", content: "The ascending aorta arises from the left ventricle.", page_number: 948 }],
  "Aluno Demo",
  "[GRAFO: AET-ENT-CV-AORTA -> origina -> AET-ENT-CV-CORONARY]"
);

assert.ok(promptResult.includes("=== MEMÓRIA CANÔNICA SOBERANA (AUTORIDADE MÁXIMA) ==="));
assert.ok(promptResult.includes("=== GRAFO DE RELAÇÕES ANATÔMICAS (CONHECIMENTO ESTRUTURADO) ==="));
assert.ok(promptResult.includes("[GRAFO: AET-ENT-CV-AORTA -> origina -> AET-ENT-CV-CORONARY]"));
assert.ok(promptResult.includes("=== FONTES DE EVIDÊNCIA QUALIFICADA (DADOS DE SUPORTE) ==="));
assert.ok(promptResult.includes("[ID: KNOW-01]"));
console.log("✔ Teste 2 PASSOU: buildSynthesisPrompt injeta o grafo estruturado e os IDs de fonte!");

// 3. Test handleAiTutorRequest with mock dependencies to test P0.2 & P0.3
console.log("Teste 3: Validação de handleAiTutorRequest — Desbloqueio de UNSUPPORTED_QUERY e RAG com topic limpo...");

// Mock JWT with session_id
const mockPayload = { sub: "user-123", session_id: "sess-abc" };
const mockToken = "header." + Buffer.from(JSON.stringify(mockPayload)).toString("base64") + ".signature";

let gatewayCalledWith = null;
let rpcCalls = [];

const mockDeps = {
  env: {
    AETERNUM_AI_GATEWAY_URL: "http://127.0.0.1:8081",
    AETERNUM_AI_GATEWAY_TOKEN: "mock-gateway-token",
    SUPABASE_URL: "https://mock.supabase.co",
    SUPABASE_ANON_KEY: "mock-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key"
  },
  createClient: (url, key) => {
    return {
      auth: {
        getUser: async () => ({ data: { user: { id: "user-123" } }, error: null })
      },
      from: (table) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: "user-123",
                role: "student",
                status: "active",
                session_guard_enabled: true,
                institution_id: "inst-atlas"
              },
              error: null
            })
          })
        })
      }),
      rpc: async (name, params) => {
        rpcCalls.push({ name, params });
        if (name === "consume_ai_rate_limit_tiered") {
          return { data: [{ allowed: true, retry_after_seconds: 0 }], error: null };
        }
        if (name === "match_vita_sovereign_knowledge") {
          return {
            data: [{
              id: "KNOW-AORTA-99",
              book_title: "Moore Anatomia Clínica 8ª Ed",
              chapter_title: "Tórax e Sistema Cardiovascular",
              page_number: 142,
              content: "A artéria aorta ascendente possui cerca de 5 cm de comprimento e origina os óstios coronarianos nos seios aórticos.",
              lexical_rank: 0.95,
              source_file: "moore_anatomia_8ed.pdf",
              source_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              retrieval_stage: 1
            }],
            error: null
          };
        }
        return { data: [], error: null };
      }
    };
  },
  fetchFn: async (url, opts) => {
    if (url.includes("/v1/llm/generate")) {
      const body = JSON.parse(opts.body);
      gatewayCalledWith = body;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            text: `[{"front": "Qual a primeira porção da aorta?", "back": "Aorta ascendente", "explanation": "A aorta ascendente emerge do ventrículo esquerdo.", "learningObjective": "Identificar a origem da aorta"}]`,
            providerId: "aeternum-gateway",
            modelId: "aeternum-llm"
          }
        })
      };
    }
    return { ok: false, status: 404 };
  }
};

const req = new Request("http://localhost:54321/functions/v1/ai-tutor", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${mockToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: [{
      role: "user",
      content: "Gere um baralho de flashcards anatômicos rigorosos sobre Artéria aorta ascendente com frente, verso, explicação e objetivo de aprendizagem."
    }],
    context: {
      source: "flashcards",
      task: "generate_flashcards",
      topic: "Artéria aorta ascendente",
      knowledgeGraphPrompt: "[GRAFO: AET-ENT-CV-AORTA -> relacao -> AET-ENT-CV-CORONARY]"
    },
    task: "generate_flashcards",
    topic: "Artéria aorta ascendente"
  })
});

const res = await handleAiTutorRequest(req, mockDeps);
assert.equal(res.status, 200);
const body = await res.json();

assert.ok(gatewayCalledWith !== null, "Gateway LLM deve ter sido invocado!");
assert.ok(gatewayCalledWith.systemInstruction.includes("Modo de saída — Flashcards Anatômicos"), "Deve incluir instrução de saída de flashcards!");
assert.ok(gatewayCalledWith.systemInstruction.includes("=== GRAFO DE RELAÇÕES ANATÔMICAS"), "Deve incluir o grafo estruturado!");
assert.ok(body.sources.length > 0, "Deve retornar fontes!");
assert.equal(body.sources[0].id, "KNOW-AORTA-99");
assert.equal(body.sources[0].sourceSha256, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

const matchCall = rpcCalls.find(c => c.name === "match_vita_sovereign_knowledge");
assert.ok(matchCall !== null, "match_vita_sovereign_knowledge deve ter sido chamada!");
console.log("Busca de RAG executada com query:", matchCall.params.search_query);
assert.ok(matchCall.params.search_query.includes("arteria") || matchCall.params.search_query.includes("aorta"));

console.log("✔ Teste 3 PASSOU: handleAiTutorRequest desbloqueia geração, prioriza busca limpa e propaga fontes completas com SHA-256!");
console.log("\n=== TODOS OS TESTES DE INTEGRAÇÃO P0.10.1 PASSARAM COM SUCESSO! ===");

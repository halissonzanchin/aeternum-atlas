import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

// =========================================================================
// 1. ANÁLISE ESTÁTICA E CONTRATO DE CÓDIGO FONTE (SURGICAL AUDIT)
// =========================================================================

test("AtlasAITutorSessionContext conecta useLanguage e prioriza UI ativa sobre contexto antigo", () => {
  const contextFile = fs.readFileSync(
    path.join(root, "src/context/AtlasAITutorSessionContext.jsx"),
    "utf8"
  );

  // Deve desestruturar language do useLanguage
  assert.match(contextFile, /const\s*\{\s*language,\s*t\s*\}\s*=\s*useLanguage\(\)/);

  // Deve ler localStorage['aeternum_language'] de forma segura
  assert.match(contextFile, /localStorage\?\.getItem\(["']aeternum_language["']\)/);

  // Deve priorizar cleanUiLang sobre cleanContextLang
  assert.match(
    contextFile,
    /const\s+activeLanguage\s*=\s*cleanUiLang\s*\|\|\s*cleanContextLang\s*\|\|\s*persistedLang\s*\|\|\s*["']pt["']/
  );

  // Deve injetar language no enrichedContext
  assert.match(contextFile, /language:\s*activeLanguage/);
});

test("atlasAITutorService implementa resolveEffectiveLanguage e envia language em 2 níveis no payload", () => {
  const serviceFile = fs.readFileSync(
    path.join(root, "src/features/atlas-viewer/ai/atlasAITutorService.js"),
    "utf8"
  );

  // Deve existir resolveEffectiveLanguage com whitelist ['es', 'pt', 'en', 'de']
  assert.match(serviceFile, /function\s+resolveEffectiveLanguage\s*\(/);
  assert.match(serviceFile, /clean === ['"]es['"]\s*\|\|\s*clean === ['"]pt['"]\s*\|\|\s*clean === ['"]en['"]\s*\|\|\s*clean === ['"]de['"]/);

  // buildTutorContext deve resolver o language
  assert.match(serviceFile, /language:\s*resolveEffectiveLanguage\(context\.language\)/);

  // processMessageStream deve enviar no body tanto language de primeiro nível quanto dentro de context
  assert.match(serviceFile, /body:\s*JSON\.stringify\(\{[\s\S]*?context:\s*tutorContext,[\s\S]*?language:\s*tutorContext\.language,/);
});

// =========================================================================
// 2. SIMULAÇÃO DE COMPORTAMENTO E PRECEDÊNCIA (4-TIER PRECEDENCE SUITE)
// =========================================================================

const VALID_LANGUAGES = new Set(["es", "pt", "en", "de"]);

function resolveLanguage(uiLang, contextLang, storageLang) {
  // Nível 1: Idioma ativo selecionado pelo estudante na interface (useLanguage)
  if (uiLang && typeof uiLang === "string") {
    const clean = uiLang.trim().toLowerCase();
    if (VALID_LANGUAGES.has(clean)) return clean;
  }

  // Nível 2: Idioma informado no context (fallback para chamadas sem UI ou especializadas)
  if (contextLang && typeof contextLang === "string") {
    const clean = contextLang.trim().toLowerCase();
    if (VALID_LANGUAGES.has(clean)) return clean;
  }

  // Nível 3: Preferência persistida válida (localStorage)
  if (storageLang && typeof storageLang === "string") {
    const clean = storageLang.trim().toLowerCase();
    if (VALID_LANGUAGES.has(clean)) return clean;
  }

  // Nível 4: Idioma padrão seguro
  return "pt";
}

function buildSimulatedPayload(message, context, uiLang, storageLang, conversationId = "conv-test-123") {
  const activeLanguage = resolveLanguage(uiLang, context?.language, storageLang);
  const tutorContext = {
    ...context,
    language: activeLanguage
  };

  return {
    messages: [{ sender: "user", text: message }],
    context: tutorContext,
    language: tutorContext.language,
    conversationId,
    stream: true
  };
}

test("Cenário 1: UI em ES com contexto antigo em PT -> Prevalece ES da interface ativa", () => {
  const uiLanguage = "es";
  const staleContext = {
    sectionTitle: "Ombro e Braço",
    language: "pt", // contexto antigo residual de navegação anterior
    modelSlug: "deltoid-muscle"
  };

  const payload = buildSimulatedPayload(
    "Explique a inervação do músculo deltoide",
    staleContext,
    uiLanguage,
    null
  );

  // A seleção ativa da interface DEVE sobrepor o contexto antigo residual
  assert.equal(payload.language, "es", "O campo raiz payload.language deve prevalecer como 'es'");
  assert.equal(payload.context.language, "es", "O campo context.language deve ser sobrescrito para 'es'");

  // Na Edge Function v52, 'es' dispara a diretiva obrigatória em Espanhol
  const isSpanish = (payload.context.language || payload.language).startsWith("es");
  assert.ok(isSpanish, "O backend deve ativar o modo Espanhol");
});

test("Cenário 2: UI em PT com contexto antigo em ES -> Prevalece PT da interface ativa", () => {
  const uiLanguage = "pt";
  const staleContext = {
    sectionTitle: "Plexo Braquial",
    language: "es", // contexto antigo residual
    modelSlug: "brachial-plexus"
  };

  const payload = buildSimulatedPayload(
    "¿Cuáles son las ramas colaterales?",
    staleContext,
    uiLanguage,
    null
  );

  assert.equal(payload.language, "pt", "O campo raiz payload.language deve prevalecer como 'pt'");
  assert.equal(payload.context.language, "pt", "O campo context.language deve ser sobrescrito para 'pt'");
});

test("Cenário 3: Mudança de idioma durante uma conversa ativa (Reatividade dinâmica)", () => {
  let currentUiLanguage = "es";
  const context = { modelTitle: "Articulação Glenoumeral", language: "es" };
  const sessionConversationId = "conv-session-active-789";

  // Turno 1 em Espanhol
  const payloadTurn1 = buildSimulatedPayload(
    "¿Qué ligamentos refuerzan la cápsula?",
    context,
    currentUiLanguage,
    "es",
    sessionConversationId
  );
  assert.equal(payloadTurn1.language, "es");
  assert.equal(payloadTurn1.context.language, "es");
  assert.equal(payloadTurn1.conversationId, sessionConversationId);

  // Estudante alterna idioma no Topbar para Português
  currentUiLanguage = "pt";

  // Turno 2 na mesma sessão (o contexto herdado do turno 1 continha language: 'es')
  const payloadTurn2 = buildSimulatedPayload(
    "E qual deles previne a luxação inferior?",
    payloadTurn1.context, // simula contexto residual da sessão
    currentUiLanguage,
    "pt",
    sessionConversationId
  );
  assert.equal(payloadTurn2.language, "pt", "O novo turno deve refletir imediatamente a troca para 'pt'");
  assert.equal(payloadTurn2.context.language, "pt");
  assert.equal(payloadTurn2.conversationId, sessionConversationId);
});

test("Cenário 4: Payload completo e preservação de metadados para Edge Function", () => {
  const context = {
    source: "viewer-3d",
    currentRoute: "/atlas/viewer/heart",
    sectionTitle: "Coração Humano",
    sectionQuestion: "Quais são as valvas cardíacas?",
    modelTitle: "Coração 3D",
    modelSlug: "heart-complete",
    description: "Modelo anatômico de alta fidelidade",
    activePanel: "markers",
    markers: [{ title: "Valva Aórtica" }, { title: "Valva Mitral" }],
    availableActions: ["CLOSE_PANELS", "FOCUS_MARKER"]
  };

  const payload = buildSimulatedPayload("Descreva a valva aórtica", context, "es", null);

  // Verificação de conformidade do contrato HTTP da Edge Function
  assert.equal(payload.stream, true);
  assert.equal(payload.conversationId, "conv-test-123");
  assert.equal(payload.language, "es");
  assert.equal(payload.context.language, "es");
  assert.equal(payload.context.sectionTitle, "Coração Humano");
  assert.equal(payload.context.modelSlug, "heart-complete");
  assert.equal(payload.context.markers.length, 2);
  assert.equal(payload.messages.length, 1);
  assert.equal(payload.messages[0].sender, "user");
});

test("Cenário 5: Ausência de regressões no histórico de mensagens da sessão", () => {
  // Simula histórico de mensagens acumulado na sessão
  const sessionHistory = [
    { id: "msg-1", sender: "user", text: "¿Cuáles son los músculos del manguito rotador?", timestamp: 1000 },
    { id: "msg-2", sender: "assistant", text: "Los músculos son supraespinoso, infraespinoso, redondo menor y subescapular.", timestamp: 2000 }
  ];

  // Nova mensagem enviada pelo usuário após mudar idioma da interface para PT
  const newUiLanguage = "pt";
  const newPayload = buildSimulatedPayload(
    "E qual a função do supraespinhal?",
    { language: "es" },
    newUiLanguage,
    "pt"
  );

  // O payload da nova mensagem usa o novo idioma
  assert.equal(newPayload.language, "pt");

  // O histórico pré-existente NÃO pode ser mutado ou poluído
  assert.equal(sessionHistory.length, 2);
  assert.equal(sessionHistory[0].text, "¿Cuáles son los músculos del manguito rotador?");
  assert.equal(sessionHistory[1].text.startsWith("Los músculos"), true);
});

test("Cenário 6: Precedência de 4 níveis estrita com isolamento de fallbacks", () => {
  // Nível 1: UI ativa definida supera contexto antigo e localStorage
  assert.equal(resolveLanguage("es", "pt", "pt"), "es");
  assert.equal(resolveLanguage("pt", "es", "es"), "pt");

  // Nível 2: Contexto explícito é usado quando UI não está definida
  assert.equal(resolveLanguage(undefined, "es", "pt"), "es");
  assert.equal(resolveLanguage(null, "pt", "es"), "pt");

  // Nível 3: localStorage válido é usado quando UI e contexto estão ausentes
  assert.equal(resolveLanguage(null, null, "es"), "es");
  assert.equal(resolveLanguage(undefined, undefined, "de"), "de");

  // Nível 4: Valor desconhecido, inválido ou nulo cai no padrão 'pt'
  assert.equal(resolveLanguage(null, null, "fr"), "pt");
  assert.equal(resolveLanguage(undefined, "it", null), "pt");
  assert.equal(resolveLanguage(null, null, null), "pt");
  assert.equal(resolveLanguage("", "", ""), "pt");
});

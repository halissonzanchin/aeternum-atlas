import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ANATOMICAL_FLASHCARD_TOPICS,
  FLASHCARD_DIFFICULTIES,
  selectCuratedFlashcards
} from "../src/data/anatomicalFlashcardBank.js";
import {
  CANONICAL_SOURCES_REGISTRY,
  FLASHCARD_GENERATION_MODES,
  decomposeTopicDynamically,
  generateAnatomicalFlashcards,
  normalizeGenerationMode,
  resolveSourceCitation,
  validateFlashcardCorrespondence
} from "../src/services/ai/flashcardGenerationService.js";
import esbuild from "esbuild";

const serviceSource = await readFile(new URL("../src/services/ai/flashcardGenerationService.js", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../src/pages/student/AnatomicalFlashcardsPage.jsx", import.meta.url), "utf8");
const configuratorSource = await readFile(new URL("../src/components/student/FlashcardDeckConfigurator.jsx", import.meta.url), "utf8");
const tutorSource = await readFile(new URL("../src/features/dashboard/components/AtlasAITutor.jsx", import.meta.url), "utf8");
const repetitionSource = await readFile(new URL("../src/services/ai/flashcardSpacedRepetitionService.js", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../src/styles/AnatomicalFlashcards.css", import.meta.url), "utf8");
const ollamaProviderSource = await readFile(new URL("../packages/aeternum-vita/src/providers/local/ollama/OllamaLLMProvider.ts", import.meta.url), "utf8");

test("banco editorial cobre seis temas e três dificuldades sem repetir perguntas", () => {
  assert.equal(ANATOMICAL_FLASHCARD_TOPICS.length, 6);
  const cards = ANATOMICAL_FLASHCARD_TOPICS.flatMap((topic) => topic.cards);
  assert.equal(cards.length, 72);
  assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);
  assert.equal(new Set(cards.map((card) => card.front.toLocaleLowerCase("pt-BR"))).size, cards.length);

  for (const topic of ANATOMICAL_FLASHCARD_TOPICS) {
    for (const difficulty of FLASHCARD_DIFFICULTIES) {
      assert.equal(topic.cards.filter((card) => card.difficulty === difficulty).length, 4);
    }
    for (const card of topic.cards) {
      assert.ok(card.learningObjective.length >= 3);
      assert.ok(card.front.length >= 18);
      assert.ok(card.back.length >= 3);
      assert.ok(card.explanation.length >= 18);
    }
  }
});

test("seleção curada respeita tema, dificuldade e limite sem completar por repetição", () => {
  const result = selectCuratedFlashcards({ topic: "fêmur", difficulty: "Difícil", count: 20 });
  assert.equal(result.matchedTopic?.title, "Fêmur e Osteologia");
  assert.equal(result.cards.length, 4);
  assert.ok(result.cards.every((card) => card.difficulty === "Difícil"));
  assert.equal(new Set(result.cards.map((card) => card.front)).size, result.cards.length);
});

test("gerador usa o contrato real do Tutor e não fabrica fallback ou bibliografia", () => {
  assert.match(serviceSource, /atlasAITutorService\.processMessageStream/);
  assert.doesNotMatch(serviceSource, /queryTutor/);
  assert.doesNotMatch(serviceSource, /findPdfImageForTopic/);
  assert.doesNotMatch(serviceSource, /Estrutura médica correspondente|Tuberosidade ou crista rugosa/);
  assert.match(serviceSource, /Não invente páginas, capítulos, livros, imagens/);
  assert.match(serviceSource, /Não duplicamos perguntas/);
  assert.match(serviceSource, /isTutorSuccess/);
  assert.match(serviceSource, /extractCardsFromScientificProse/);
});

test("interface envia contexto completo ao Tutor e usa apenas materiais A26 suportados", () => {
  assert.match(pageSource, /contextLabel: `Flashcards · \$\{card\.topic\}`/);
  assert.match(pageSource, /learningObjective: card\.learningObjective/);
  assert.match(tutorSource, /\.\.\.\(e\.detail\.context \|\| \{\}\)/);
  assert.doesNotMatch(pageSource, /material="liquid"/);
  assert.doesNotMatch(pageSource, /Fonte RAG/);
  assert.doesNotMatch(cssSource, /backdrop-filter/);
});

test("telemetria registra revisão e conclusão do baralho", () => {
  assert.match(pageSource, /eventType: "flashcard_reviewed"/);
  assert.match(pageSource, /eventType: "flashcard_deck_completed"/);
});

test("baralhos legados são migrados sem repetição, imagem ou alegação RAG não verificada", () => {
  assert.match(repetitionSource, /normalizeSavedDeck/);
  assert.match(repetitionSource, /seenQuestions\.has\(questionKey\)/);
  assert.match(repetitionSource, /imageVerified === true/);
  assert.match(repetitionSource, /Baralho salvo anteriormente/);
  assert.doesNotMatch(repetitionSource, /Revisão Espaçada RAG:/);
});

test("decomposição temática dinâmica generaliza para os 5 temas obrigatórios sem vazamento de aorta", () => {
  const topics = [
    { name: "Artéria aorta ascendente", system: "vascular" },
    { name: "Plexo braquial", system: "nervous" },
    { name: "Nervo radial", system: "nervous" },
    { name: "Fêmur", system: "skeletal" },
    { name: "Sistema digestório", system: "visceral" }
  ];

  for (const t of topics) {
    const subtopics = decomposeTopicDynamically(t.name);
    assert.equal(subtopics.length, 4);
    assert.ok(subtopics.every((s) => s.startsWith(t.name)));

    if (t.name !== "Artéria aorta ascendente") {
      // Subtemas de nervos, ossos ou vísceras NÃO podem mencionar termos exclusivos de aorta!
      const leaked = subtopics.some((s) => /aorta|coron[aá]ri|valsalva|tamponamento|stanford/i.test(s));
      assert.equal(leaked, false, `Vazamento de termos de aorta detectado no tema '${t.name}': ${subtopics.join("; ")}`);
    }

    if (t.system === "nervous") {
      assert.ok(subtopics.some((s) => /raízes|fascicular|túneis|motores|neuropraxia/i.test(s)));
    } else if (t.system === "skeletal") {
      assert.ok(subtopics.some((s) => /acidentes ósseos|inserções|trabecular|fratura/i.test(s)));
    } else if (t.system === "visceral") {
      assert.ok(subtopics.some((s) => /estratigrafia|peritoneais|celíaco|mesentérico|autonômica/i.test(s)));
    }
  }
});

test("validador de correspondência semântica rejeita desvio temático, tautologia, interrogativas e placeholders", () => {
  // 1. Cartão válido sobre Plexo Braquial
  const validPlexus = {
    front: "Quais são as raízes espinhais que constituem a formação do Plexo braquial?",
    back: "O plexo braquial é formado pelos ramos anteriores dos nervos espinhais C5 a T1.",
    explanation: "As raízes de C5 a T1 convergem no pescoço entre os músculos escalenos anterior e médio para formar os troncos superior, médio e inferior.",
    learningObjective: "Identificação das raízes formadoras do plexo braquial"
  };
  const resValid = validateFlashcardCorrespondence(validPlexus, "Plexo braquial");
  assert.equal(resValid.valid, true);

  // 2. Resposta interrogativa (deve ser rejeitada)
  const interrogative = {
    front: "Qual é o trajeto do nervo radial no compartimento posterior do braço?",
    back: "Qual é a relação entre o nervo radial e o sulco da artéria braquial profunda?",
    explanation: "O nervo radial perfura o septo intermuscular lateral.",
    learningObjective: "Trajeto do nervo radial"
  };
  const resInterrogative = validateFlashcardCorrespondence(interrogative, "Nervo radial");
  assert.equal(resInterrogative.valid, false);
  assert.equal(resInterrogative.reason, "CIRCULAR_OR_INTERROGATIVE");

  // 3. Resposta tautológica (repetição idêntica)
  const tautological = {
    front: "Como se caracteriza a cabeça do fêmur em relação ao acetábulo do quadril?",
    back: "A cabeça do fêmur em relação ao acetábulo do quadril.",
    explanation: "Articulação esferóidea com cartilagem hialina espessa.",
    learningObjective: "Articulação coxofemoral"
  };
  const resTautological = validateFlashcardCorrespondence(tautological, "Fêmur");
  assert.equal(resTautological.valid, false);
  assert.equal(resTautological.reason, "TAUTOLOGICAL");

  // 4. Desvio temático flagrante (cartão sobre aorta para pedido de Fêmur)
  const drift = {
    front: "Quais são os seios aórticos de Valsalva na emergência das coronárias?",
    back: "Os seios aórticos direito e esquerdo dão origem às respectivas artérias coronárias.",
    explanation: "Localizados na raiz da aorta ascendente logo acima das cúspides da valva aórtica.",
    learningObjective: "Raiz aórtica e coronárias"
  };
  const resDrift = validateFlashcardCorrespondence(drift, "Fêmur");
  assert.equal(resDrift.valid, false);
  assert.equal(resDrift.reason, "TOPIC_DRIFT");

  // 5. Placeholder simulado
  const placeholder = {
    front: "Qual é a estrutura anatômica principal do Sistema digestório?",
    back: "Estrutura médica correspondente ao tratado de anatomia.",
    explanation: "Informação genérica em placeholder.",
    learningObjective: "Visão geral"
  };
  const resPlaceholder = validateFlashcardCorrespondence(placeholder, "Sistema digestório");
  assert.equal(resPlaceholder.valid, false);
  assert.equal(resPlaceholder.reason, "INSUFFICIENT_SUBSTANTIATION");
});

test("rastreabilidade de fontes canônicas mapeia registros reais e rejeita alegação falsa de verificação", () => {
  // Moore 7ª ed Guanabara Koogan (Base Supabase real)
  const cit7 = resolveSourceCitation("Texto com citação [SRC-MOORE-7TH-BR] do acervo");
  assert.match(cit7, /7ª Edição/);
  assert.match(cit7, /Guanabara Koogan/);

  // Moore 8ª ed Wolters Kluwer (Grafo Rust)
  const cit8 = resolveSourceCitation("Texto com citação [SRC-MOORE-2018] do grafo");
  assert.match(cit8, /Clinically Oriented Anatomy/);
  assert.match(cit8, /Wolters Kluwer/);

  // Terminologia Anatomica TA2
  const citTA2 = resolveSourceCitation("Conforme [SRC-TA2-2019]");
  assert.match(citTA2, /Terminologia Anatomica Internacional/);

  // Texto sem citação explícita: NUNCA deve alegar "Evidências Científicas Verificadas"
  const citFallback = resolveSourceCitation("Texto sem nenhuma tag de fonte");
  assert.equal(citFallback, "Tutor IA · Síntese Conceitual Automatizada (Qwen 3.5 4B)");
  assert.doesNotMatch(citFallback, /Evidências Científicas Verificadas/);

  // Registro canônico declara proveniência e termo comercial sob Clean-Room
  assert.ok(CANONICAL_SOURCES_REGISTRY["SRC-MOORE-7TH-BR"].provenance.includes("20.334 registros"));
  assert.ok(CANONICAL_SOURCES_REGISTRY["SRC-MOORE-2018"].commercialNotice.includes("Clean-Room"));
});

test("gerador diferencia solicitado, gerado, validado e rejeitado com aviso honesto de geração parcial", async () => {
  // Mock de emissão com 3 cartões válidos e 1 candidato com desvio temático rejeitado
  const mockSender = async () => {
    return {
      mode: "live",
      status: 200,
      text: JSON.stringify([
        {
          front: "Qual é a origem das raízes primárias que compõem o Nervo radial?",
          back: "O nervo radial tem sua origem nas raízes espinhais de C5, C6, C7, C8 e T1 através do fascículo posterior do plexo braquial.",
          explanation: "É o maior ramo terminal do fascículo posterior, inervando o compartimento extensor do braço e antebraço.",
          learningObjective: "Origem e raízes do nervo radial",
          sourceCitation: "[SRC-MOORE-2018]"
        },
        {
          front: "Qual é o trajeto do Nervo radial no braço e sua relação com o osso úmero?",
          back: "O nervo radial cruza posteriormente ao úmero no interior do sulco do nervo radial, acompanhado pela artéria braquial profunda.",
          explanation: "Passa entre as cabeças medial e lateral do músculo tríceps braquial antes de perfurar o septo intermuscular lateral.",
          learningObjective: "Trajeto osteofibroso do nervo radial",
          sourceCitation: "[SRC-TA2-2019]"
        },
        {
          front: "Qual déficit motor clínico clássico resulta de fratura da diáfise umeral lesando o Nervo radial?",
          back: "Resulta na paralisia dos músculos extensores do punho e dedos, produzindo a deformidade clínica da 'mão caída'.",
          explanation: "Incapacidade de estender o punho e as articulações metacarpofalângicas por perda da inervação motora.",
          learningObjective: "Correlação clínica da lesão do nervo radial",
          sourceCitation: "[SRC-GRAY-2020]"
        },
        {
          front: "Como se caracterizam as artérias coronárias e os seios de Valsalva na raiz da aorta?",
          back: "As artérias coronárias emergem dos seios coronários direito e esquerdo.",
          explanation: "Relação cardiovascular da raiz da aorta.",
          learningObjective: "Raiz da aorta",
          sourceCitation: "[SRC-GRAY-2020]"
        }
      ])
    };
  };

  const deck = await generateAnatomicalFlashcards({
    topic: "Nervo radial",
    difficulty: "Difícil",
    cardCount: "standard", // solicita 10
    sendTutorMessage: mockSender
  });

  assert.equal(deck.requestedCount, 10);
  assert.equal(deck.isPartial, true);
  // O 4º cartão (sobre aorta) deve ter sido rejeitado por TOPIC_DRIFT!
  assert.equal(deck.cards.length, 3);
  assert.equal(deck.validatedCount, 3);
  assert.ok(deck.rejectedCount >= 1);
  assert.ok(deck.auditLedger.rejectedItems.some((item) => item.reason === "TOPIC_DRIFT"));
  assert.match(deck.generationNotice, /Foram preparados 3 cartões únicos validados dos 10 solicitados/);
  assert.match(deck.generationNotice, /Não duplicamos perguntas/);
});

test("P0.20-F: normalizeGenerationMode padroniza curated, tutor e hybrid sem rotular banco curado como Híbrido", () => {
  assert.equal(normalizeGenerationMode("curated"), FLASHCARD_GENERATION_MODES.CURATED);
  assert.equal(normalizeGenerationMode("curado"), FLASHCARD_GENERATION_MODES.CURATED);
  assert.equal(normalizeGenerationMode("editorial"), FLASHCARD_GENERATION_MODES.CURATED);
  assert.equal(normalizeGenerationMode("tutor"), FLASHCARD_GENERATION_MODES.TUTOR);
  assert.equal(normalizeGenerationMode("tutor_ia"), FLASHCARD_GENERATION_MODES.TUTOR);
  assert.equal(normalizeGenerationMode("hybrid"), FLASHCARD_GENERATION_MODES.HYBRID);
  assert.equal(normalizeGenerationMode("híbrido"), FLASHCARD_GENERATION_MODES.HYBRID);

  assert.doesNotMatch(pageSource, /activeDeck\.generationMode === "curado"/);
  assert.match(pageSource, /normalizeGenerationMode\(activeDeck\.generationMode/);
});

test("P0.20-F: AbortSignal é propagado desde o primeiro lote e aborta imediatamente sem vazamento", async () => {
  const controller = new AbortController();
  let receivedSignals = 0;

  const mockSender = async (payload = {}) => {
    if (payload.signal) receivedSignals += 1;
    controller.abort();
    if (payload.signal?.aborted) {
      const err = new Error("Aborted by user");
      err.name = "AbortError";
      throw err;
    }
    return { mode: "live", status: 200, text: "[]" };
  };

  await assert.rejects(
    () =>
      generateAnatomicalFlashcards({
        topic: "Clavícula e Ombro",
        difficulty: "Médio",
        cardCount: "few",
        preferTutorOnly: true,
        sendTutorMessage: mockSender,
        signal: controller.signal
      }),
    (err) => err.name === "AbortError"
  );
  assert.equal(receivedSignals, 1);
});

test("P0.20-F: geração progressiva emite estágios reais e preserva lotes validados se um lote posterior falhar", async () => {
  const stages = [];
  let callCount = 0;

  const mockSender = async () => {
    callCount += 1;
    if (callCount === 1) {
      return {
        mode: "live",
        status: 200,
        text: JSON.stringify([
          {
            front: "Quais são os troncos primários que compõem o Plexo Braquial no trígono posterior do pescoço?",
            back: "Os troncos superior (C5-C6), médio (C7) e inferior (C8-T1) formam a porção supraclavicular do plexo braquial.",
            explanation: "Emergem no hiato interescalênico entre os músculos escalenos anterior e médio.",
            learningObjective: "Troncos primários do plexo braquial",
            sourceCitation: "[SRC-MOORE-7TH-BR]"
          },
          {
            front: "Qual fascículo do Plexo Braquial origina diretamente os nervos radial e axilar?",
            back: "O fascículo posterior, formado pela união das divisões posteriores dos três troncos, origina os nervos radial e axilar.",
            explanation: "Posiciona-se posteriormente à segunda porção da artéria axilar.",
            learningObjective: "Fascículo posterior do plexo braquial",
            sourceCitation: "[SRC-MOORE-2018]"
          }
        ])
      };
    }
    throw new Error("Timeout simulado no lote 2");
  };

  const deck = await generateAnatomicalFlashcards({
    topic: "Plexo Braquial",
    difficulty: "Médio",
    cardCount: "standard",
    preferTutorOnly: true,
    sendTutorMessage: mockSender,
    onProgress: (p) => stages.push(p.stage)
  });

  assert.equal(deck.generationMode, "tutor");
  assert.equal(deck.cards.length, 2);
  assert.equal(deck.isPartial, true);
  assert.ok(stages.includes("preparing_evidence"));
  assert.ok(stages.includes("generating_batch"));
  assert.ok(stages.includes("validating_content"));
  assert.ok(stages.includes("batch_completed"));
  assert.ok(stages.includes("partial_complete"));
});

test("P0.20-F: FlashcardDeckConfigurator separa seleção de chip da geração e mantém Ajustar Baralho fora do fluxo vertical", () => {
  assert.match(configuratorSource, /onClick=\{\(\) => onTopicChange\?\.\(chip\)\}/);
  assert.doesNotMatch(configuratorSource, /onClick=\{\(\) => handleGenerate/);
  assert.match(configuratorSource, /Padrão: Médio/);
  assert.match(configuratorSource, /a26-configurator-popover-layer/);
  assert.match(cssSource, /\.a26-configurator-popover-anchor\s*\{[\s\S]*?position:\s*fixed/);
});

test("P0.20-F.4: resolveOllamaReasoningParams aplica reasoning_effort=none por requisição/tarefa e preserva raciocínio padrão em consultas abertas sem RAG", () => {
  assert.match(ollamaProviderSource, /resolveOllamaReasoningParams\(request,\s*this\.reasoningPolicy\)/);

  const fnMatch = ollamaProviderSource.match(/export function resolveOllamaReasoningParams[\s\S]*?^}/m);
  assert.ok(fnMatch, "resolveOllamaReasoningParams deve estar exportada em OllamaLLMProvider.ts");
  const { code } = esbuild.transformSync(fnMatch[0].replace(/^export\s+/, ""), { loader: "ts" });
  const resolveOllamaReasoningParams = new Function(`${code}; return resolveOllamaReasoningParams;`)();

  // 1. Tarefa estruturada (Flashcards / Mapas Mentais) -> reasoning_effort: "none", think: false
  assert.deepEqual(
    resolveOllamaReasoningParams({
      messages: [{ role: "user", content: "Gerar 5 flashcards" }],
      metadata: { task: "generate_flashcards" }
    }),
    { reasoning_effort: "none", think: false }
  );

  // 2. Pergunta científica complexa com fontes RAG (Tutor IA / Casos Socráticos / Simulados)
  // NÃO desativa o raciocínio apenas pela presença de fontes RAG: preserva raciocínio padrão ({})
  assert.deepEqual(
    resolveOllamaReasoningParams({
      systemInstruction: "FONTES DE EVIDÊNCIA QUALIFICADA:\n- [SRC-MOORE-7TH-BR] Forame Jugular...",
      messages: [{ role: "user", content: "Explique a Síndrome de Vernet." }],
      metadata: { source: "atlas-ai-tutor", retrieved_source_count: 3 }
    }),
    {}
  );

  // 3. Consulta aberta sem evidências RAG pré-injetadas -> preserva raciocínio padrão do Qwen 3.5 4B ({})
  assert.deepEqual(
    resolveOllamaReasoningParams({
      messages: [{ role: "user", content: "Qual nervo inerva o músculo serrátil anterior?" }],
      metadata: { source: "open-scientific-query", retrieved_source_count: 0, canonical_facts_count: 0 }
    }),
    {}
  );

  // 4. Override explícito por requisição (metadata.think = true / metadata.reasoningEffort)
  assert.deepEqual(
    resolveOllamaReasoningParams({
      systemInstruction: "FONTES DE EVIDÊNCIA QUALIFICADA",
      messages: [{ role: "user", content: "Caso complexo com raciocínio explícito" }],
      metadata: { think: true }
    }),
    {}
  );
  assert.deepEqual(
    resolveOllamaReasoningParams({
      messages: [{ role: "user", content: "Consulta rápida" }],
      metadata: { reasoningEffort: "none" }
    }),
    { reasoning_effort: "none", think: false }
  );

  // 5. Consulta com diretriz de síntese compartilhada NÃO desativa o raciocínio do Qwen (P0.20-F.7)
  assert.deepEqual(
    resolveOllamaReasoningParams({
      systemInstruction: "- Seja conciso e direto. Inicie imediatamente a resposta final solicitada sem reflexões preliminares ou metacognição.",
      messages: [{ role: "user", content: "Quais nervos passam pelo forame jugular?" }],
      metadata: { task: "tutor_ia", source: "atlas-ai-tutor" }
    }),
    {}
  );

  // 6. Cabeçalho oficial de modo de saída estruturado em sysInstruction ativa reasoning_effort=none
  assert.deepEqual(
    resolveOllamaReasoningParams({
      systemInstruction: "Modo de saída — Flashcards Anatômicos:\nResponda SOMENTE com um array JSON válido",
      messages: [{ role: "user", content: "Clavícula e Ombro" }]
    }),
    { reasoning_effort: "none", think: false }
  );
  assert.deepEqual(
    resolveOllamaReasoningParams({
      systemInstruction: "Modo de saída — Mapa Mental Anatômico:\nResponda SOMENTE com o esboço hierárquico",
      messages: [{ role: "user", content: "Artéria coronária esquerda" }]
    }),
    { reasoning_effort: "none", think: false }
  );
});



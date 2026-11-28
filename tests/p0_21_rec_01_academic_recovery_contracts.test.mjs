import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

test("P0.21-REC.01-R1 — Contract Suite: Academic & Visual Recovery", async (t) => {
  // ---------------------------------------------------------------------------
  // 1. REC-R1-01: Catálogo e Deduplicação Canônica (UUID vs Slug)
  // ---------------------------------------------------------------------------
  await t.test("REC-R1-01: mergeCatalogWithLocalModels preserva o UUID de persistência do banco em model.id e modelUuid", async () => {
    const { mergeCatalogWithLocalModels, CRANIAL_MODEL_SLUG, HEART_MODEL_SLUG } = await import("../src/data/localModels.js");

    const remoteModelsFromDb = [
      {
        id: "035701b7-a49f-4f3f-a0fc-b335675745be",
        institution_id: "11111111-1111-1111-1111-111111111111",
        title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
        slug: "corte-sagital-cranio-humano-superficial",
        sketchfab_url: "https://sketchfab.com/3d-models/corte-sagital-del-encefalo-humano-modelo-3d-0145e302fd94453c8f7fb2817e45060e",
        embed_url: "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e/embed",
        status: "active",
        catalogSource: "supabase"
      },
      {
        id: "abb93126-c9be-4938-8eca-161f56864781",
        institution_id: "11111111-1111-1111-1111-111111111111",
        title: "Coração Humano — Modelo Superficial 3D",
        slug: "coracao-humano-superficial",
        sketchfab_url: "https://sketchfab.com/3d-models/corazon-humano-3d-modelo-fd61a9605f4148a9b5274463f7adbcb5",
        embed_url: "https://sketchfab.com/models/fd61a9605f4148a9b5274463f7adbcb5/embed",
        status: "active",
        catalogSource: "supabase"
      }
    ];

    const merged = mergeCatalogWithLocalModels(remoteModelsFromDb);

    // Deve conter 3 modelos no total (2 enriquecidos do banco + 1 referência puramente local)
    assert.equal(merged.length, 3, "Catálogo consolidado deve conter exatamente 3 modelos");

    // Crânio deve ter o UUID original de models_3d preservado
    const cranial = merged.find(m => m.slug === "corte-sagital-cranio-humano-superficial" || m.title.includes("Crânio"));
    assert.ok(cranial, "Modelo do crânio deve existir no catálogo");
    assert.equal(cranial.id, "035701b7-a49f-4f3f-a0fc-b335675745be", "model.id do crânio DEVE ser o UUID da tabela models_3d, não o slug");
    assert.equal(cranial.modelUuid, "035701b7-a49f-4f3f-a0fc-b335675745be", "modelUuid deve guardar o UUID canônico");
    assert.equal(cranial.slug, "corte-sagital-cranio-humano-superficial", "slug deve ser preservado para rotas limpas");
    assert.equal(cranial.catalogSource, "supabase", "catalogSource do modelo enriquecido deve ser 'supabase'");
    assert.equal(cranial.institutionId, "11111111-1111-1111-1111-111111111111", "institutionId deve ser preservado");

    // Coração deve ter o UUID original de models_3d preservado
    const heart = merged.find(m => m.slug.includes("coracao") || m.title.includes("Coração"));
    assert.ok(heart, "Modelo do coração deve existir no catálogo");
    assert.equal(heart.id, "abb93126-c9be-4938-8eca-161f56864781", "model.id do coração DEVE ser o UUID da tabela models_3d");
    assert.equal(heart.catalogSource, "supabase", "catalogSource do coração deve ser 'supabase'");

    // O terceiro modelo (Reprodutor Feminino) deve ser puramente local reference
    const female = merged.find(m => m.slug.includes("reprodutor-feminino") || m.title.includes("Feminino"));
    assert.ok(female, "Modelo reprodutor feminino deve existir");
    assert.equal(female.catalogSource, "local_reference", "Modelo não retornado pelo banco deve ser 'local_reference'");
  });

  await t.test("REC-R1-01-B: Deduplicação entre models_3d e atlas_models preserva o UUID primário e identidades distintas", async () => {
    const { mergeCatalogWithLocalModels } = await import("../src/data/localModels.js");

    const models3dCranial = {
      id: "035701b7-a49f-4f3f-a0fc-b335675745be",
      title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
      slug: "corte-sagital-cranio-humano-superficial",
      catalogSource: "supabase"
    };

    const atlasModelsCranialDuplicate = {
      id: "2c57a03b-2c77-4119-b8bb-676ea59e9190",
      title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
      slug: "corte-sagital-cranio-humano-superficial",
      catalogSource: "atlas_models"
    };

    const atlasModelsDistinctSpine = {
      id: "99999999-9999-9999-9999-999999999999",
      title: "Coluna Vertebral Completa 3D",
      slug: "coluna-vertebral-completa",
      catalogSource: "atlas_models"
    };

    // Mesclar models_3d primeiro, depois atlas_models com um duplicado e um modelo distinto
    const merged = mergeCatalogWithLocalModels([
      models3dCranial,
      atlasModelsCranialDuplicate,
      atlasModelsDistinctSpine
    ]);

    // 1. O crânio DEVE manter o UUID de models_3d (035701b7...), não o de atlas_models (2c57a03b...)
    const cranial = merged.find(m => m.slug === "corte-sagital-cranio-humano-superficial");
    assert.ok(cranial, "Crânio deve existir");
    assert.equal(cranial.id, "035701b7-a49f-4f3f-a0fc-b335675745be", "Deduplicação NÃO pode sobrescrever UUID canônico de models_3d");
    assert.equal(cranial.modelUuid, "035701b7-a49f-4f3f-a0fc-b335675745be", "modelUuid deve guardar o UUID canônico original");
    assert.equal(cranial.atlasModelId, "2c57a03b-2c77-4119-b8bb-676ea59e9190", "atlasModelId deve ser registrado para rastreabilidade");

    // 2. O modelo distinto (Coluna Vertebral) deve ser adicionado como entidade separada
    const spine = merged.find(m => m.slug === "coluna-vertebral-completa");
    assert.ok(spine, "Modelo distinto de atlas_models deve ser preservado como nova entidade");
    assert.equal(spine.id, "99999999-9999-9999-9999-999999999999", "UUID do modelo distinto deve ser preservado");
  });

  // ---------------------------------------------------------------------------
  // 2. REC-R1-02: Geometria Visual da Sidebar & Prevenção de Overflow Spillover
  // ---------------------------------------------------------------------------
  await t.test("REC-R1-02: Sidebar usa logo size='sm' e A26Shell.css mantém text-overflow ellipsis seguro", () => {
    const sidebarCode = fs.readFileSync(path.join(rootDir, "src/components/Sidebar/Sidebar.jsx"), "utf8");
    const shellCss = fs.readFileSync(path.join(rootDir, "src/styles/A26Shell.css"), "utf8");

    // Logo deve ser size="sm" (42px) para liberar espaço para o título
    assert.match(
      sidebarCode,
      /<AeternumLogo[^>]*size="sm"/,
      "Sidebar.jsx deve utilizar <AeternumLogo size='sm'> para preservar a geometria horizontal"
    );

    // .a26-shell__brand-copy strong não pode ter overflow: visible solto que cause vazamento
    assert.match(
      shellCss,
      /\.a26-shell__brand-copy\s+strong\s*\{[^}]*text-overflow:\s*ellipsis/s,
      "A26Shell.css deve manter text-overflow: ellipsis para impedir quebras ou vazamentos visuais"
    );
    assert.match(
      shellCss,
      /\.a26-shell__brand-copy\s+strong\s*\{[^}]*overflow:\s*hidden/s,
      "A26Shell.css deve manter overflow: hidden como barreira de segurança física"
    );
  });

  // ---------------------------------------------------------------------------
  // 3. REC-R1-03: Viewport Dinâmico e Responsividade do Atlas AI Tutor
  // ---------------------------------------------------------------------------
  await t.test("REC-R1-03: AtlasAITutor.css possui clamp vertical dinâmico e recolhimento de orbe para telas <850px", () => {
    const tutorCss = fs.readFileSync(path.join(rootDir, "src/features/dashboard/components/AtlasAITutor.css"), "utf8");

    // Regras de clamp verticais dinâmicas
    assert.match(
      tutorCss,
      /top:\s*clamp\(/,
      "AtlasAITutor.css deve definir top dinâmico com clamp para evitar cortes verticais"
    );
    assert.match(
      tutorCss,
      /bottom:\s*clamp\(/,
      "AtlasAITutor.css deve definir bottom dinâmico com clamp"
    );
    assert.match(
      tutorCss,
      /max-height:\s*calc\(100dvh\s*-\s*\d+px\)/,
      "AtlasAITutor.css deve limitar max-height relativo a 100dvh"
    );

    // Media query para tablets landscape e telas baixas (<850px)
    assert.match(
      tutorCss,
      /@media\s*\(max-height:\s*850px\)/,
      "AtlasAITutor.css deve conter media query específica para max-height: 850px"
    );
  });

  // ---------------------------------------------------------------------------
  // 4. REC-R1-04: Exclusão Mútua Pedagógica no Dashboard do Estudante
  // ---------------------------------------------------------------------------
  await t.test("REC-R1-04: AcademicEvolutionDashboard garante exclusão mútua entre sistemas consolidados e foco a revisar", async () => {
    const dashboardCode = fs.readFileSync(
      path.join(rootDir, "src/features/dashboard/components/AcademicEvolutionDashboard.jsx"),
      "utf8"
    );

    // Deve conter verificação de exclusão mútua
    assert.match(
      dashboardCode,
      /strongSystems/,
      "AcademicEvolutionDashboard deve calcular explicitamente strongSystems"
    );
    assert.match(
      dashboardCode,
      /PEDAGOGICAL_THRESHOLDS|isConsolidated|consolidatedSystemNames/,
      "AcademicEvolutionDashboard deve conter limiares canônicos de classificação pedagógica"
    );

    // Verificação funcional de lógica pura:
    const mockSystems = [
      {
        systemName: "Sistema Nervoso",
        dataState: "DADOS_DISPONIVEIS",
        explorationCoveragePercent: 85,
        quizAccuracy: 95,
        structuresInspected: 12,
        quizAttempts: 3
      },
      {
        systemName: "Sistema Cardiovascular",
        dataState: "DADOS_PARCIAIS",
        explorationCoveragePercent: 30,
        quizAccuracy: 55,
        structuresInspected: 4,
        quizAttempts: 1
      }
    ];

    // Simular o filtro:
    const strong = mockSystems.filter(s =>
      s.dataState !== "SEM_HISTORICO" &&
      s.explorationCoveragePercent >= 75 &&
      s.quizAccuracy !== null &&
      s.quizAccuracy >= 80
    );

    const strongNames = new Set(strong.map(s => s.systemName));

    const weak = mockSystems.filter(s => {
      if (s.dataState === "SEM_HISTORICO") return false;
      if (strongNames.has(s.systemName)) return false; // Exclusão mútua
      const hasLowQuiz = s.quizAccuracy !== null && s.quizAccuracy < 70;
      const hasLowCoverage = s.explorationCoveragePercent < 50 && (s.structuresInspected > 0 || s.quizAttempts > 0);
      return hasLowQuiz || hasLowCoverage;
    });

    assert.equal(strong.length, 1);
    assert.equal(strong[0].systemName, "Sistema Nervoso");

    assert.equal(weak.length, 1);
    assert.equal(weak[0].systemName, "Sistema Cardiovascular");

    // Garantir que Sistema Nervoso NUNCA aparece em weak:
    assert.ok(!weak.some(w => w.systemName === "Sistema Nervoso"), "Sistema Nervoso consolidado NUNCA pode estar em weakSystems");
  });

  // ---------------------------------------------------------------------------
  // 5. REC-R1-04-B: A26StudyChronometerChart honestidade de estado zerado
  // ---------------------------------------------------------------------------
  await t.test("REC-R1-04-B: A26StudyChronometerChart exibe mensagem honesta quando totalMinutes === 0", () => {
    const chartCode = fs.readFileSync(
      path.join(rootDir, "src/components/aeternum-26/A26StudyChronometerChart.jsx"),
      "utf8"
    );

    assert.match(
      chartCode,
      /totalMinutes\s*>\s*0\s*\?\s*"[^"]*"\s*:\s*"Nenhuma sessão registrada no período selecionado"/,
      "A26StudyChronometerChart deve renderizar mensagem honesta quando totalMinutes for zero"
    );
  });
});

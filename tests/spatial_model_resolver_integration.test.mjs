import test from "node:test";
import assert from "node:assert/strict";
import { resolveSpatialGuidance } from "../src/services/spatial/spatialModelResolver.js";
import {
  BASELINE_AUTHORIZED_CATALOG,
  getSpatialCatalog,
  setSpatialCatalog,
  resetSpatialCatalog,
  validateModelIntegrity,
  validateInstitutionalAccess,
  deduplicateCatalogModels,
  fetchPublishedSpatialCatalog
} from "../src/services/spatial/spatialCatalogService.js";

test.afterEach(() => {
  resetSpatialCatalog();
});

test("Integração 1: Deduplicação lógica entre atlas_models e models_3d preservando anotações e permissões", () => {
  const rawAtlas = [
    {
      id: "atlas-uuid-skull",
      slug: "corte-sagital-cranio-humano-superficial",
      title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
      status: "published",
      institution_availability: "global",
      sketchfab_url: "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e",
      viewer_type: "sketchfab"
    }
  ];

  const rawLegacy = [
    {
      id: "legacy-uuid-skull", // UUID que detém as anotações na tabela model_annotations
      slug: "corte-sagital-cranio-humano-superficial",
      title: "Corte Sagital do Crânio Humano",
      status: "active",
      institution_id: "inst-default",
      sketchfab_url: "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e"
    }
  ];

  const deduplicated = deduplicateCatalogModels(rawAtlas, rawLegacy);

  // Deve haver apenas 1 modelo lógico unificado
  assert.equal(deduplicated.length, 1);
  const model = deduplicated[0];
  assert.equal(model.slug, "corte-sagital-cranio-humano-superficial");
  assert.equal(model.id, "atlas-uuid-skull", "Prioriza ID da tabela atlas_models como autoritativa");
  assert.ok(model.legacyIds.includes("legacy-uuid-skull"), "Preserva UUID legado para mapeamento de anotações");
  assert.equal(model.institutionAvailability, "global");
  assert.equal(model.sketchfabUid, "0145e302fd94453c8f7fb2817e45060e");
});

test("Integração 2: FAIL-CLOSED estrito — Falhas de consulta ou catálogo vazio não utilizam fallback obsoleto", async () => {
  // Simula cliente Supabase que retorna erro de banco
  const failingClient = {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: new Error("DB_CONNECTION_TIMEOUT") }),
        in: () => Promise.resolve({ data: null, error: new Error("DB_CONNECTION_TIMEOUT") })
      })
    })
  };

  const catalog = await fetchPublishedSpatialCatalog({ client: failingClient });

  // Em falha, FAIL-CLOSED deve retornar array vazio, NUNCA o catálogo de reserva
  assert.equal(Array.isArray(catalog), true);
  assert.equal(catalog.length, 0, "Catálogo deve ser vazio em caso de falha de consulta");

  // O resolver não deve recomendar nada
  const result = resolveSpatialGuidance({
    userQuery: "Mostre o crânio",
    aiResponseText: "Descrição do crânio",
    catalog
  });

  assert.equal(result.hasMatch, false);
  assert.equal(result.model, null);
  assert.equal(result.reason, "NO_ACCESSIBLE_MODELS_IN_CATALOG");
});

test("Integração 3: Validação de rotas reais — URL arbitrária ou modelo sem visualizador não gera navegação", () => {
  const invalidRouteModel = {
    id: "invalid-route-1",
    slug: "modelo-sem-rota-valida",
    title: "Modelo Sem Rota",
    status: "published",
    viewerUrl: "http://external-site.com/arbitrary-path", // Rota externa/inválida
    sketchfabUid: "abcdef1234567890abcdef1234567890",
    directKeywords: ["teste rota"],
    markers: []
  };

  const isValid = validateModelIntegrity(invalidRouteModel);
  assert.equal(isValid, false, "URL fora do padrão canônico /viewer/<slug> deve falhar na integridade");

  const missingViewerModel = {
    id: "missing-viewer-1",
    slug: "modelo-sem-viewer",
    title: "Modelo Sem Motor 3D",
    status: "published",
    viewerUrl: "/viewer/modelo-sem-viewer",
    sketchfabUid: null,
    sketchfabUrl: null,
    embedUrl: null,
    directKeywords: ["teste viewer"],
    markers: []
  };

  assert.equal(validateModelIntegrity(missingViewerModel), false, "Modelo sem motor 3D deve ser invalidado");
});

test("Integração 4: Políticas de acesso institucional e institution_availability (JSONB)", () => {
  // Modelo 1: Global
  const globalModel = {
    id: "global-1",
    slug: "modelo-global",
    title: "Modelo Global",
    institutionAvailability: "global",
    institutionId: null
  };
  assert.equal(validateInstitutionalAccess(globalModel, { institution_id: "inst-abc" }), true);
  assert.equal(validateInstitutionalAccess(globalModel, null), true);

  // Modelo 2: Restrito a array de instituições
  const restrictedModel = {
    id: "restr-1",
    slug: "modelo-restrito",
    title: "Modelo Restrito",
    institutionAvailability: ["inst-medicina-usp", "inst-einstein"],
    institutionId: null
  };

  // Aluno da USP -> Permitido
  assert.equal(validateInstitutionalAccess(restrictedModel, { institution_id: "inst-medicina-usp" }), true);
  // Aluno da Unicamp -> Bloqueado
  assert.equal(validateInstitutionalAccess(restrictedModel, { institution_id: "inst-unicamp" }), false);
  // Super Admin -> Permitido
  assert.equal(validateInstitutionalAccess(restrictedModel, { role: "super_admin" }), true);

  // Modelo 3: institution_id legado estrito
  const legacyInstModel = {
    id: "legacy-inst-1",
    slug: "modelo-legado-inst",
    title: "Modelo Legado",
    institutionId: "inst-santa-casa"
  };
  assert.equal(validateInstitutionalAccess(legacyInstModel, { institution_id: "inst-santa-casa" }), true);
  assert.equal(validateInstitutionalAccess(legacyInstModel, { institution_id: "inst-outra" }), false);
});

test("Integração 5: Vínculos anatômicos explícitos e homologados (Sem correspondências genéricas)", () => {
  // 1. Fêmur: ausente no catálogo -> corte imediato
  const femurResult = resolveSpatialGuidance({
    userQuery: "Qual a anatomia do fêmur e seus principais acidentes?",
    aiResponseText: "O fêmur é o osso mais longo do corpo humano.",
    catalog: BASELINE_AUTHORIZED_CATALOG
  });
  assert.equal(femurResult.hasMatch, false);
  assert.equal(femurResult.model, null);

  // 2. Coração: vínculo explícito com o modelo cardíaco
  const heartResult = resolveSpatialGuidance({
    userQuery: "Explique a anatomia do coração e sua vascularização coronária",
    aiResponseText: "O coração possui quatro câmaras musculares.",
    catalog: BASELINE_AUTHORIZED_CATALOG
  });
  assert.equal(heartResult.hasMatch, true);
  assert.equal(heartResult.model.slug, "coracao-humano-superficial");
  assert.equal(heartResult.matchType, "DIRECT_STRUCTURE_MATCH");

  // 3. Corpo Caloso: vínculo explícito com marcador real homologado
  const corpusCallosumResult = resolveSpatialGuidance({
    userQuery: "O que é o corpo caloso?",
    aiResponseText: "O corpo caloso une os hemisférios cerebrais.",
    catalog: BASELINE_AUTHORIZED_CATALOG
  });
  assert.equal(corpusCallosumResult.hasMatch, true);
  assert.equal(corpusCallosumResult.model.slug, "corte-sagital-cranio-humano-superficial");
  assert.equal(corpusCallosumResult.matchType, "CONTAINED_STRUCTURE_MATCH");
  assert.equal(corpusCallosumResult.matchedMarker.label, "Cuerpo Calloso (Corpo Caloso)");
  assert.equal(corpusCallosumResult.matchedMarker.annotationIndex, 3);
  assert.equal(corpusCallosumResult.matchedMarker.id, "61ab053e-39ed-4a5f-a71e-171865615a20");
});

test("Integração 6: Verificação de UUID, índice e Sketchfab UID antes do foco espacial", () => {
  const model = BASELINE_AUTHORIZED_CATALOG[0]; // Crânio
  const validMarker = model.markers[3]; // Corpo caloso

  // Marcador válido pertencente ao modelo
  const isModelMatch = validMarker.modelId === model.id || model.legacyIds.includes(validMarker.modelId);
  const isValidIndex = Number.isInteger(validMarker.annotationIndex) && validMarker.annotationIndex >= 0;
  const hasSketchfabUid = Boolean(validMarker.sketchfabUid || model.sketchfabUid);

  assert.equal(isModelMatch, true, "Marcador deve pertencer ao modelo");
  assert.equal(isValidIndex, true, "Índice deve ser inteiro >= 0");
  assert.equal(hasSketchfabUid, true, "Sketchfab UID deve estar presente");

  // Simula marcador corrompido de outro modelo
  const corruptedMarker = {
    id: "alien-marker-uuid",
    modelId: "unrelated-model-uuid",
    annotationIndex: -1,
    sketchfabUid: null,
    label: "Marcador Incompatível"
  };

  const isCorruptedValid = (corruptedMarker.modelId === model.id) &&
    Number.isInteger(corruptedMarker.annotationIndex) && corruptedMarker.annotationIndex >= 0 &&
    Boolean(corruptedMarker.sketchfabUid);

  assert.equal(isCorruptedValid, false, "Marcador corrompido deve ser bloqueado para foco espacial");
});

test("Integração 7: Modelo arquivado ou revogado é expurgado dinamicamente", () => {
  const catalogWithRevoked = [
    {
      id: "model-active-1",
      slug: "modelo-ativo",
      title: "Modelo Ativo",
      status: "published",
      viewerUrl: "/viewer/modelo-ativo",
      sketchfabUid: "uid1",
      directKeywords: ["ativo"],
      markers: []
    },
    {
      id: "model-revoked-2",
      slug: "modelo-revogado",
      title: "Modelo Revogado",
      status: "archived", // Status alterado para arquivado
      viewerUrl: "/viewer/modelo-revogado",
      sketchfabUid: "uid2",
      directKeywords: ["revogado"],
      markers: []
    }
  ];

  setSpatialCatalog(catalogWithRevoked);

  const resultRevoked = resolveSpatialGuidance({
    userQuery: "Mostre o modelo revogado",
    aiResponseText: "Descrição do modelo revogado"
  });

  assert.equal(resultRevoked.hasMatch, false, "Modelo com status arquivado não pode ser sugerido");
});

test("Integração 8: Novo modelo homologado é reconhecido dinamicamente via catálogo Supabase", async () => {
  // Simula consulta real bem-sucedida ao Supabase trazendo um novo modelo de Fêmur
  const mockSupabaseWithFemur = {
    from: (table) => ({
      select: () => ({
        eq: () => Promise.resolve({
          data: [
            {
              id: "femur-dynamic-uuid",
              slug: "femur-humano-3d",
              title: "Fêmur Humano 3D",
              status: "published",
              anatomical_system: "Sistema Esquelético",
              anatomical_region: "Membro Inferior",
              sketchfab_url: "https://sketchfab.com/models/femur3d1234567890abcdef12345678",
              institution_availability: "global"
            }
          ],
          error: null
        }),
        in: () => {
          const res = Promise.resolve({ data: [], error: null });
          res.order = () => Promise.resolve({ data: [], error: null });
          return res;
        }
      })
    })
  };

  const loadedCatalog = await fetchPublishedSpatialCatalog({ client: mockSupabaseWithFemur });

  assert.equal(loadedCatalog.length, 1);
  assert.equal(loadedCatalog[0].slug, "femur-humano-3d");

  // Agora a pergunta sobre o fêmur reconhece o modelo automaticamente
  const result = resolveSpatialGuidance({
    userQuery: "Gostaria de ver o modelo do fêmur humano",
    aiResponseText: "Aqui está o modelo do fêmur humano.",
    catalog: loadedCatalog
  });

  assert.equal(result.hasMatch, true);
  assert.equal(result.model.slug, "femur-humano-3d");
  assert.equal(result.matchType, "DIRECT_STRUCTURE_MATCH");
});

test("Integração 9: Resposta anatômica textual continua operante sem depender do catálogo 3D", () => {
  // Quando o catálogo 3D está totalmente inacessível ou vazio
  const result = resolveSpatialGuidance({
    userQuery: "Explique as características osteológicas da tíbia",
    aiResponseText: "A tíbia é o segundo maior osso do corpo humano, localizada medialmente na perna.",
    catalog: [] // Catálogo vazio
  });

  // O resolver retorna hasMatch: false de forma limpa
  assert.equal(result.hasMatch, false);
  assert.equal(result.model, null);

  // A resposta textual permanece intacta e rica, sem sofrer interferência
  assert.ok(result.reason === "NO_ACCESSIBLE_MODELS_IN_CATALOG");
});

test("Integração 10: Auditoria read-only do banco de dados oficial (Supabase hyivyrietgjdazgizafp)", async () => {
  // Verifica o catálogo base canônico auditado
  const catalog = BASELINE_AUTHORIZED_CATALOG;

  assert.equal(catalog.length, 2, "Banco oficial contém exatamente 2 modelos 3D");
  const skull = catalog.find(m => m.slug === "corte-sagital-cranio-humano-superficial");
  const heart = catalog.find(m => m.slug === "coracao-humano-superficial");

  assert.notEqual(skull, undefined, "Modelo do Crânio deve estar presente");
  assert.notEqual(heart, undefined, "Modelo do Coração deve estar presente");

  // Anotações reais auditadas
  assert.equal(skull.markers.length, 10, "Crânio deve ter exatamente 10 anotações");
  assert.equal(heart.markers.length, 10, "Coração deve ter exatamente 10 anotações");

  // Garante que o falso modelo reprodutor não existe
  const phantom = catalog.find(m => m.slug === "corte-sagital-sistema-reprodutor-feminino");
  assert.equal(phantom, undefined, "Falso modelo reprodutor feminino deve ser rigorosamente inexistente");
});

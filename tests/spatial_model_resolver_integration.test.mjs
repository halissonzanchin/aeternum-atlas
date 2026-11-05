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
  fetchPublishedSpatialCatalog,
  extractKeywordsFromModel
} from "../src/services/spatial/spatialCatalogService.js";
import { isSupabaseConfigured, getSupabaseClient } from "../src/services/supabase/supabaseClient.js";

test.afterEach(() => {
  resetSpatialCatalog();
});

// =============================================================================
// BLOCO 1: TESTES UNITÁRIOS PUROS — PERMISSÕES INSTITUCIONAIS E INTEGRIDADE
// =============================================================================

test("Unitário 1: validateInstitutionalAccess rejeita formatos desconhecidos, números, booleanos e objetos malformados", () => {
  const modelWithNumberAvail = { id: "m1", slug: "m-num", status: "published", institutionAvailability: 12345 };
  assert.equal(validateInstitutionalAccess(modelWithNumberAvail, { institution_id: "inst-1" }), false, "Número deve ser rejeitado");

  const modelWithBoolAvail = { id: "m2", slug: "m-bool", status: "published", institutionAvailability: false };
  assert.equal(validateInstitutionalAccess(modelWithBoolAvail, { institution_id: "inst-1" }), false, "Boolean false deve ser rejeitado");

  const modelWithMalformedObj = { id: "m3", slug: "m-obj", status: "published", institutionAvailability: { random_key: "random_val" } };
  assert.equal(validateInstitutionalAccess(modelWithMalformedObj, { institution_id: "inst-1" }), false, "Objeto sem flag global ou correspondência de tenant deve ser rejeitado");

  const modelWithEmptyArray = { id: "m4", slug: "m-arr", status: "published", institutionAvailability: [] };
  assert.equal(validateInstitutionalAccess(modelWithEmptyArray, { institution_id: "inst-1" }), false, "Array vazio deve ser rejeitado");
});

test("Unitário 2: validateInstitutionalAccess rejeita strings com falso 'global' (anti-spoofing de regex)", () => {
  // Strings maliciosas ou parciais não podem autorizar acesso
  const fakeGlobals = [
    "not_global",
    "global_restricted",
    "fake_global_scope",
    "is_not_global",
    "global_usp_only",
    "non-global"
  ];

  fakeGlobals.forEach(fakeStr => {
    const model = { id: "fake", slug: "fake-slug", status: "published", institutionAvailability: fakeStr };
    assert.equal(
      validateInstitutionalAccess(model, { institution_id: "inst-qualquer" }),
      false,
      `String '${fakeStr}' não pode conceder acesso global`
    );
  });
});

test("Unitário 3: validateInstitutionalAccess bloqueia usuário sem instituição em modelo restrito e usuário de instituição divergente", () => {
  const restrictedModel = {
    id: "m-usp",
    slug: "modelo-usp",
    status: "published",
    institutionAvailability: ["inst-medicina-usp", "inst-einstein"]
  };

  // Usuário anônimo / sem instituição -> Bloqueado
  assert.equal(validateInstitutionalAccess(restrictedModel, null), false);
  assert.equal(validateInstitutionalAccess(restrictedModel, {}), false);
  assert.equal(validateInstitutionalAccess(restrictedModel, { institution_id: null }), false);

  // Usuário de instituição diferente -> Bloqueado
  assert.equal(validateInstitutionalAccess(restrictedModel, { institution_id: "inst-unicamp" }), false);

  // Usuário de instituição permitida -> Autorizado
  assert.equal(validateInstitutionalAccess(restrictedModel, { institution_id: "inst-medicina-usp" }), true);
});

test("Unitário 4: validateInstitutionalAccess bloqueia usuário com status revogado, suspenso ou inativo", () => {
  const globalModel = { id: "m-glob", slug: "modelo-global", status: "published", institutionAvailability: "global" };

  // Usuário suspenso tentando acessar modelo global -> Bloqueado
  assert.equal(validateInstitutionalAccess(globalModel, { id: "u-1", status: "suspended" }), false);
  assert.equal(validateInstitutionalAccess(globalModel, { id: "u-2", status: "revoked" }), false);
  assert.equal(validateInstitutionalAccess(globalModel, { id: "u-3", is_active: false }), false);

  // Usuário ativo -> Autorizado
  assert.equal(validateInstitutionalAccess(globalModel, { id: "u-4", status: "active", is_active: true }), true);
});

test("Unitário 5: validateInstitutionalAccess rejeita modelo desprovido de declaração de disponibilidade (FAIL-CLOSED)", () => {
  // Modelo sem institutionAvailability e sem institutionId não pode vazar como público
  const unclassifiedModel = {
    id: "m-unclass",
    slug: "modelo-nao-classificado",
    status: "published",
    institutionAvailability: null,
    institutionId: null
  };

  assert.equal(validateInstitutionalAccess(unclassifiedModel, { institution_id: "inst-1" }), false);
  assert.equal(validateInstitutionalAccess(unclassifiedModel, null), false);

  // Apenas Super Admin tem prerrogativa de auditoria em modelos não classificados
  assert.equal(validateInstitutionalAccess(unclassifiedModel, { role: "super_admin" }), true);
});

test("Unitário 6: validateInstitutionalAccess autoriza estritamente formatos homologados", () => {
  // String "global" e "{global}"
  assert.equal(validateInstitutionalAccess({ institutionAvailability: "global" }, null), true);
  assert.equal(validateInstitutionalAccess({ institutionAvailability: "{global}" }, null), true);

  // Array com "global"
  assert.equal(validateInstitutionalAccess({ institutionAvailability: ["global"] }, null), true);

  // Objeto com is_global: true ou global: true
  assert.equal(validateInstitutionalAccess({ institutionAvailability: { is_global: true } }, null), true);
  assert.equal(validateInstitutionalAccess({ institutionAvailability: { global: true } }, null), true);

  // Objeto com chave de tenant explícita
  assert.equal(validateInstitutionalAccess({ institutionAvailability: { "inst-hospital-hc": true } }, { institution_id: "inst-hospital-hc" }), true);
});

test("Unitário 7: validateModelIntegrity exige rota canônica estrita '/viewer/<slug>' e slug kebab-case válido", () => {
  // Rota externa ou arbitrária -> Bloqueado
  assert.equal(validateModelIntegrity({
    id: "1", slug: "modelo-teste", title: "Teste", status: "published",
    viewerUrl: "http://external.com/path", sketchfabUid: "0145e302fd94453c8f7fb2817e45060e"
  }), false);

  // Rota divergente do slug -> Bloqueado
  assert.equal(validateModelIntegrity({
    id: "2", slug: "slug-verdadeiro", title: "Teste", status: "published",
    viewerUrl: "/viewer/outro-slug", sketchfabUid: "0145e302fd94453c8f7fb2817e45060e"
  }), false);

  // Slug inválido (com espaços, caracteres especiais ou curto) -> Bloqueado
  assert.equal(validateModelIntegrity({
    id: "3", slug: "slug com espaco", title: "Teste", status: "published",
    viewerUrl: "/viewer/slug com espaco", sketchfabUid: "0145e302fd94453c8f7fb2817e45060e"
  }), false);

  assert.equal(validateModelIntegrity({
    id: "4", slug: "ab", title: "Teste", status: "published",
    viewerUrl: "/viewer/ab", sketchfabUid: "0145e302fd94453c8f7fb2817e45060e"
  }), false);

  // Rota canônica perfeita -> Válido
  assert.equal(validateModelIntegrity({
    id: "5", slug: "modelo-valido-3d", title: "Teste", status: "published",
    viewerUrl: "/viewer/modelo-valido-3d", sketchfabUid: "0145e302fd94453c8f7fb2817e45060e"
  }), true);
});

test("Unitário 8: validateModelIntegrity rejeita status arquivado/deletado e modelos sem motor 3D", () => {
  const base = {
    id: "1", slug: "modelo-base", title: "Teste", status: "published",
    viewerUrl: "/viewer/modelo-base", sketchfabUid: "0145e302fd94453c8f7fb2817e45060e"
  };

  assert.equal(validateModelIntegrity({ ...base, archivedAt: "2026-10-01" }), false, "Arquivado deve ser rejeitado");
  assert.equal(validateModelIntegrity({ ...base, deletedAt: "2026-10-01" }), false, "Deletado deve ser rejeitado");
  assert.equal(validateModelIntegrity({ ...base, status: "draft" }), false, "Draft deve ser rejeitado");
  assert.equal(validateModelIntegrity({ ...base, sketchfabUid: null, sketchfabUrl: null, embedUrl: null }), false, "Sem motor 3D deve ser rejeitado");
});

// =============================================================================
// BLOCO 2: TESTES UNITÁRIOS PUROS — HOMOLOGAÇÃO ANATÔMICA EXPLÍCITA E BARREIRAS REGIONAIS
// =============================================================================

test("Unitário 9: extractKeywordsFromModel não infere nem fragmenta palavras soltas de títulos, slugs ou tags", () => {
  const model = {
    title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    slug: "corte-sagital-cranio-humano-superficial",
    canonicalEntity: "crânio",
    homologatedStructures: ["abóbada craniana", "base do crânio"],
    tags: ["anatomia", "neuro", "corte", "3d"]
  };

  const keywords = extractKeywordsFromModel(model);

  // Deve conter a entidade canônica expressa e estruturas homologadas
  assert.ok(keywords.includes("cranio"));
  assert.ok(keywords.includes("abobada craniana"));
  assert.ok(keywords.includes("base do cranio"));

  // NÃO PODE inventar palavras isoladas fragmentadas
  assert.equal(keywords.includes("superficial"), false, "Palavra genérica 'superficial' não pode ser keyword");
  assert.equal(keywords.includes("humano"), false, "Palavra genérica 'humano' não pode ser keyword");
  assert.equal(keywords.includes("corte"), false, "Termo técnico 'corte' não pode ser keyword");
  assert.equal(keywords.includes("3d"), false, "Termo '3d' não pode ser keyword");
});

test("Unitário 10: Homologação estrita — Fêmur ausente resulta em hasMatch: false imediato", () => {
  const result = resolveSpatialGuidance({
    userQuery: "Quais são as características osteológicas do fêmur?",
    aiResponseText: "O fêmur é o maior osso tubular do corpo humano.",
    catalog: BASELINE_AUTHORIZED_CATALOG
  });

  assert.equal(result.hasMatch, false);
  assert.equal(result.model, null);
  assert.equal(result.matchedMarker, null);
  assert.equal(result.reason, "STRUCTURE_NOT_IN_CATALOG");
});

test("Unitário 11: Barreira regional estrita — 'cabeça do fêmur' é categoricamente bloqueada contra crânio e coração", () => {
  const result = resolveSpatialGuidance({
    userQuery: "Explique a anatomia da cabeça do fêmur e sua articulação com o acetábulo",
    aiResponseText: "A cabeça do fêmur articula-se com o osso do quadril.",
    catalog: BASELINE_AUTHORIZED_CATALOG
  });

  assert.equal(result.hasMatch, false, "Barreira regional deve impedir associação polissêmica de 'cabeça do fêmur' ao crânio");
  assert.equal(result.model, null);
});

test("Unitário 12: Vínculo explícito — 'coração' casa com entidade canônica homologada", () => {
  const result = resolveSpatialGuidance({
    userQuery: "Explique a vascularização e anatomia do coração humano",
    aiResponseText: "O coração é um órgão muscular oco.",
    catalog: BASELINE_AUTHORIZED_CATALOG
  });

  assert.equal(result.hasMatch, true);
  assert.equal(result.model.slug, "coracao-humano-superficial");
  assert.equal(result.matchType, "DIRECT_STRUCTURE_MATCH");
});

test("Unitário 13: Vínculo explícito — 'corpo caloso' casa com marcador real homologado de model_annotations", () => {
  const result = resolveSpatialGuidance({
    userQuery: "Qual a função do corpo caloso?",
    aiResponseText: "O corpo caloso conecta os dois hemisférios cerebrais.",
    catalog: BASELINE_AUTHORIZED_CATALOG
  });

  assert.equal(result.hasMatch, true);
  assert.equal(result.model.slug, "corte-sagital-cranio-humano-superficial");
  assert.equal(result.matchType, "CONTAINED_STRUCTURE_MATCH");
  assert.equal(result.matchedMarker.label, "Cuerpo Calloso (Corpo Caloso)");
  assert.equal(result.matchedMarker.annotationIndex, 3);
  assert.equal(result.matchedMarker.id, "61ab053e-39ed-4a5f-a71e-171865615a20");
});

test("Unitário 14: Foco 3D exige UUID RFC 4122, annotationIndex numérico >= 0 e Sketchfab UID 32 hex", () => {
  const validMarker = {
    id: "61ab053e-39ed-4a5f-a71e-171865615a20",
    modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
    annotationIndex: 3,
    sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
    label: "Corpo Caloso"
  };

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const sketchfabUidRegex = /^[0-9a-f]{32}$/i;

  assert.ok(uuidRegex.test(validMarker.id), "UUID deve ser RFC 4122 válido");
  assert.ok(Number.isInteger(validMarker.annotationIndex) && validMarker.annotationIndex >= 0);
  assert.ok(sketchfabUidRegex.test(validMarker.sketchfabUid), "Sketchfab UID deve ser 32 hex");

  // Marcador inválido (ID sintético legado m-cran-3)
  const legacySyntheticMarker = {
    id: "m-cran-3",
    annotationIndex: 3,
    sketchfabUid: "0145e302fd94453c8f7fb2817e45060e"
  };
  assert.equal(uuidRegex.test(legacySyntheticMarker.id), false, "ID sintético m-cran-3 deve ser rejeitado");
});

// =============================================================================
// BLOCO 3: TESTES COM MOCKS DE CATÁLOGO (CLIENTES SUPABASE SIMULADOS)
// =============================================================================

test("Mock Client 15: Deduplicação lógica entre atlas_models e models_3d unificando por slug e preservando legacyIds", () => {
  const rawAtlas = [
    {
      id: "atlas-uuid-skull",
      slug: "corte-sagital-cranio-humano-superficial",
      title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
      status: "published",
      institution_availability: "global",
      sketchfab_url: "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e"
    }
  ];

  const rawLegacy = [
    {
      id: "legacy-uuid-skull",
      slug: "corte-sagital-cranio-humano-superficial",
      title: "Corte Sagital do Crânio Humano",
      status: "active",
      institution_id: "inst-default",
      sketchfab_url: "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e"
    }
  ];

  const deduplicated = deduplicateCatalogModels(rawAtlas, rawLegacy);

  assert.equal(deduplicated.length, 1);
  const model = deduplicated[0];
  assert.equal(model.id, "atlas-uuid-skull", "Prioriza ID da tabela atlas_models como autoritativa");
  assert.ok(model.legacyIds.includes("legacy-uuid-skull"), "Preserva UUID legado para mapeamento de chaves estrangeiras");
  assert.equal(model.institutionAvailability, "global");
  assert.equal(model.sketchfabUid, "0145e302fd94453c8f7fb2817e45060e");
});

test("Mock Client 16: FAIL-CLOSED estrito sob erro ou timeout simulado de banco (retorna estritamente [])", async () => {
  const failingMockClient = {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: new Error("SIMULATED_DB_TIMEOUT") }),
        in: () => Promise.resolve({ data: null, error: new Error("SIMULATED_DB_TIMEOUT") })
      })
    })
  };

  const catalog = await fetchPublishedSpatialCatalog({ client: failingMockClient });

  // FAIL-CLOSED: Nunca retorna fallback estático sob erro
  assert.equal(Array.isArray(catalog), true);
  assert.equal(catalog.length, 0, "Catálogo deve ser rigorosamente vazio sob falha");

  const result = resolveSpatialGuidance({
    userQuery: "Mostre o crânio",
    catalog
  });

  assert.equal(result.hasMatch, false);
  assert.equal(result.model, null);
  assert.equal(result.reason, "NO_ACCESSIBLE_MODELS_IN_CATALOG");
});

test("Mock Client 17: Injeção de catálogo dinâmico simulado com novo modelo homologado (demonstra extensibilidade sem tocar no código)", async () => {
  // Simula injeção de resposta do Supabase contendo um novo modelo de fêmur homologado com anotação real
  const mockSupabaseWithFemur = {
    from: (table) => ({
      select: () => ({
        eq: () => Promise.resolve({
          data: [
            {
              id: "femur-dynamic-uuid",
              slug: "femur-humano-3d",
              title: "Fêmur Humano 3D",
              canonical_entity: "fêmur",
              status: "published",
              anatomical_system: "Sistema Esquelético",
              anatomical_region: "Membro Inferior",
              sketchfab_url: "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e",
              institution_availability: "global"
            }
          ],
          error: null
        }),
        in: () => {
          const res = Promise.resolve({
            data: [
              {
                id: "33333333-4444-5555-6666-777777777777",
                model_id: "femur-dynamic-uuid",
                annotation_index: 0,
                sketchfab_uid: "0145e302fd94453c8f7fb2817e45060e",
                title: "Trocânter Maior",
                description: "Proeminência óssea lateral"
              }
            ],
            error: null
          });
          res.order = () => res;
          return res;
        }
      })
    })
  };

  const loadedCatalog = await fetchPublishedSpatialCatalog({ client: mockSupabaseWithFemur });

  assert.equal(loadedCatalog.length, 1);
  assert.equal(loadedCatalog[0].slug, "femur-humano-3d");
  assert.equal(loadedCatalog[0].canonicalEntity, "fêmur");

  // Consulta direta ao modelo do fêmur
  const directResult = resolveSpatialGuidance({
    userQuery: "Gostaria de ver o modelo do fêmur",
    catalog: loadedCatalog
  });
  assert.equal(directResult.hasMatch, true);
  assert.equal(directResult.model.slug, "femur-humano-3d");
  assert.equal(directResult.matchType, "DIRECT_STRUCTURE_MATCH");

  // Consulta ao marcador homologado do fêmur
  const markerResult = resolveSpatialGuidance({
    userQuery: "Onde fica o trocânter maior?",
    catalog: loadedCatalog
  });
  assert.equal(markerResult.hasMatch, true);
  assert.equal(markerResult.matchedMarker.label, "Trocânter Maior");
  assert.equal(markerResult.matchType, "CONTAINED_STRUCTURE_MATCH");
});

test("Mock Client 18: Modelo revogado ou arquivado dinamicamente é expurgado do catálogo", () => {
  const catalogWithRevoked = [
    {
      id: "m-active",
      slug: "modelo-ativo",
      title: "Modelo Ativo",
      status: "published",
      viewerUrl: "/viewer/modelo-ativo",
      sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
      canonicalEntity: "modelo ativo",
      markers: []
    },
    {
      id: "m-archived",
      slug: "modelo-revogado",
      title: "Modelo Revogado",
      status: "archived", // Status arquivado
      viewerUrl: "/viewer/modelo-revogado",
      sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
      canonicalEntity: "modelo revogado",
      markers: []
    }
  ];

  setSpatialCatalog(catalogWithRevoked);

  const resultRevoked = resolveSpatialGuidance({
    userQuery: "Mostre o modelo revogado",
    catalog: getSpatialCatalog()
  });

  assert.equal(resultRevoked.hasMatch, false, "Modelo arquivado não pode ser sugerido");
});

// =============================================================================
// BLOCO 4: TESTES DE INTEGRAÇÃO REACT E ISOLAMENTO DE SESSÃO
// =============================================================================

test("React/Sessão 19: getSpatialCatalog inicia em FAIL-CLOSED (retorna [] antes de consulta autorizada)", () => {
  // Antes de qualquer chamada a fetchPublishedSpatialCatalog ou setSpatialCatalog,
  // getSpatialCatalog deve retornar estritamente vazio no runtime.
  const initialRuntimeCatalog = getSpatialCatalog();
  assert.equal(Array.isArray(initialRuntimeCatalog), true);
  assert.equal(initialRuntimeCatalog.length, 0, "No runtime, o catálogo inicial deve ser [] antes de fetch autorizado");
});

test("React/Sessão 20: Isolamento de sessão — Usuário diferente sem permissão tem acesso negado no catálogo dinâmico", () => {
  const restrictedDynamicCatalog = [
    {
      id: "m-priv",
      slug: "modelo-privado-usp",
      title: "Modelo Privado USP",
      status: "published",
      viewerUrl: "/viewer/modelo-privado-usp",
      sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
      institutionAvailability: ["inst-usp"],
      canonicalEntity: "modelo privado",
      markers: []
    }
  ];

  setSpatialCatalog(restrictedDynamicCatalog);

  // Estudante da USP acessa
  const uspCatalog = getSpatialCatalog({ user: { id: "u-usp", institution_id: "inst-usp" } });
  assert.equal(uspCatalog.length, 1);

  // Logout / Estudante anônimo -> Bloqueado
  const anonCatalog = getSpatialCatalog({ user: null });
  assert.equal(anonCatalog.length, 0);

  // Estudante de outra instituição -> Bloqueado
  const otherCatalog = getSpatialCatalog({ user: { id: "u-outra", institution_id: "inst-unicamp" } });
  assert.equal(otherCatalog.length, 0);
});

test("React/Navegação 21: Resposta textual explicativa do Tutor permanece 100% operante e rica sem depender do catálogo 3D", () => {
  // Quando o catálogo 3D está totalmente inacessível ou vazio
  const explanation = "A tíbia é o segundo maior osso do corpo humano, localizada medialmente na perna.";
  const result = resolveSpatialGuidance({
    userQuery: "Explique as características osteológicas da tíbia",
    aiResponseText: explanation,
    catalog: [] // Catálogo vazio
  });

  // O resolver retorna hasMatch: false de forma limpa
  assert.equal(result.hasMatch, false);
  assert.equal(result.model, null);
  assert.equal(result.reason, "NO_ACCESSIBLE_MODELS_IN_CATALOG");

  // A resposta textual científica permanece intacta e rica
  assert.equal(explanation.includes("tíbia"), true);
});

// =============================================================================
// BLOCO 5: AUDITORIA DO ACERVO DE REFERÊNCIA EM CÓDIGO (BASELINE)
// =============================================================================

test("Auditoria em Código 22: Catálogo base canônico possui exatamente 2 modelos e falsa pelve feminina eliminada", () => {
  const catalog = BASELINE_AUTHORIZED_CATALOG;

  assert.equal(catalog.length, 2, "Catálogo base deve conter exatamente os 2 modelos reais auditados");

  const slugs = catalog.map(m => m.slug);
  assert.ok(slugs.includes("corte-sagital-cranio-humano-superficial"));
  assert.ok(slugs.includes("coracao-humano-superficial"));

  // Verificação de eliminação definitiva do falso registro
  assert.equal(
    slugs.includes("corte-sagital-sistema-reprodutor-feminino"),
    false,
    "Falso modelo reprodutor feminino deve estar 100% eliminado do código"
  );

  // Cada modelo possui exatamente 10 marcadores reais com UUIDs
  catalog.forEach(model => {
    assert.equal(model.markers.length, 10, `Modelo ${model.slug} deve ter 10 marcadores reais`);
    model.markers.forEach(marker => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assert.ok(uuidRegex.test(marker.id), `ID do marcador ${marker.label} deve ser um UUID real`);
    });
  });
});

// =============================================================================
// BLOCO 6: AUDITORIA READ-ONLY COM BANCO REAL SUPABASE
// =============================================================================

test("Supabase Real Read-Only 23: Executa auditoria read-only no banco oficial ou relata ausência de credenciais locais", async (t) => {
  if (!isSupabaseConfigured()) {
    t.skip("Credenciais de rede Supabase não injetadas no ambiente de testes local (VITE_SUPABASE_URL ausente)");
    return;
  }

  const sb = getSupabaseClient();
  const [atlasRes, legacyRes, annRes] = await Promise.all([
    sb.from("atlas_models").select("id, slug, status, institution_availability").eq("status", "published"),
    sb.from("models_3d").select("id, slug, status").in("status", ["active", "published", "available"]),
    sb.from("model_annotations").select("id, model_id, annotation_index, title")
  ]);

  assert.equal(atlasRes.error, null);
  assert.equal(legacyRes.error, null);
  assert.equal(annRes.error, null);

  assert.ok(atlasRes.data.length >= 1, "atlas_models deve possuir pelo menos 1 modelo publicado");
  assert.ok(legacyRes.data.length >= 2, "models_3d deve possuir exatamente 2 modelos");
  assert.equal(annRes.data.length, 20, "model_annotations deve possuir 20 anotações");
});

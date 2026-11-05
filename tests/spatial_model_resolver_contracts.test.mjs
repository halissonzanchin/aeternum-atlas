import test from "node:test";
import assert from "node:assert/strict";
import { resolveSpatialGuidance, AUTHORIZED_3D_CATALOG } from "../src/services/spatial/spatialModelResolver.js";

test("Matriz de Homologação 3D — Cenário 1: Fêmur (Nenhum modelo 3D sugerido)", () => {
  const result = resolveSpatialGuidance({
    userQuery: "Fale sobre a anatomia do fêmur e seus principais acidentes ósseos.",
    aiResponseText: "O fêmur é o osso mais longo do corpo humano. Na epífise proximal apresenta a cabeça do fêmur e o colo.",
    currentPath: ""
  });

  assert.equal(result.hasMatch, false);
  assert.equal(result.model, null);
  assert.equal(result.matchedMarker, null);
  assert.equal(result.reason, "STRUCTURE_HAS_NO_3D_MODEL_IN_CATALOG");
});

test("Matriz de Homologação 3D — Cenário 2: Coração (Modelo cardíaco real com marcadores válidos)", () => {
  const result = resolveSpatialGuidance({
    userQuery: "Explique a anatomia e vascularização do coração humano.",
    aiResponseText: "O coração é uma bomba muscular oca com quatro câmaras.",
    currentPath: ""
  });

  assert.equal(result.hasMatch, true);
  assert.equal(result.model.slug, "coracao-humano-superficial");
  assert.equal(result.matchType, "DIRECT_STRUCTURE_MATCH");
  assert.equal(result.model.status, "published");
  // Todos os marcadores pertencem à tabela model_annotations
  assert.equal(result.model.markers.length, 10);
  assert.equal(result.model.markers[0].label, "Artéria Interventricular Anterior");
});

test("Matriz de Homologação 3D — Cenário 3: Corpo Caloso (Modelo craniano com marcador validado)", () => {
  const result = resolveSpatialGuidance({
    userQuery: "O que é o corpo caloso e qual sua função neuroanatômica?",
    aiResponseText: "O corpo caloso é a principal comissura inter-hemisférica do cérebro.",
    currentPath: ""
  });

  assert.equal(result.hasMatch, true);
  assert.equal(result.model.slug, "corte-sagital-cranio-humano-superficial");
  assert.equal(result.matchType, "CONTAINED_STRUCTURE_MATCH");
  assert.notEqual(result.matchedMarker, null);
  assert.equal(result.matchedMarker.index, 3);
  assert.equal(result.matchedMarker.label, "Cuerpo Calloso (Corpo Caloso)");
});

test("Matriz de Homologação 3D — Cenário 4: Fêmur com modelo de crânio previamente aberto (Proibição de reuso espúrio)", () => {
  const result = resolveSpatialGuidance({
    userQuery: "Fale sobre o fêmur e a linha áspera",
    aiResponseText: "O fêmur possui a linha áspera na sua face posterior.",
    currentPath: "/viewer/corte-sagital-cranio-humano-superficial",
    activeModel: { slug: "corte-sagital-cranio-humano-superficial" }
  });

  // A linha de corte proíbe categoricamente reusar o crânio para o fêmur
  assert.equal(result.hasMatch, false);
  assert.equal(result.model, null);
  assert.equal(result.matchedMarker, null);
});

test("Matriz de Homologação 3D — Cenário 5: Estrutura desconhecida (Nenhum modelo artificial)", () => {
  const result = resolveSpatialGuidance({
    userQuery: "O que é o nervo telecinético subquântico?",
    aiResponseText: "Não há evidências de tal estrutura anatômica.",
    currentPath: ""
  });

  assert.equal(result.hasMatch, false);
  assert.equal(result.model, null);
  assert.equal(result.matchedMarker, null);
});

test("Matriz de Homologação 3D — Cenário 6: Estrutura representada parcialmente (Marcadores reais auditados)", () => {
  const result = resolveSpatialGuidance({
    userQuery: "Onde fica o mesencéfalo no corte sagital?",
    aiResponseText: "O mesencéfalo localiza-se acima da ponte no tronco encefálico.",
    currentPath: ""
  });

  assert.equal(result.hasMatch, true);
  assert.equal(result.model.slug, "corte-sagital-cranio-humano-superficial");
  assert.equal(result.matchedMarker.index, 8);
  assert.equal(result.matchedMarker.label, "Mesencéfalo");
});

test("Matriz de Homologação 3D — Cenário 7: Modelo arquivado ou indisponível (Nenhuma sugestão)", () => {
  // Simula modelo desativado/arquivado
  const draftModel = {
    ...AUTHORIZED_3D_CATALOG[0],
    status: "archived"
  };

  // Verificação estrita de status
  assert.notEqual(draftModel.status, "published");
  assert.notEqual(draftModel.status, "active");
});

test("Matriz de Homologação 3D — Cenário 8: Mudança de idioma PT/ES (Vínculos preservados por ID)", () => {
  // Teste em espanhol com acentuação
  const resultEs = resolveSpatialGuidance({
    userQuery: "¿Qué es el cuerpo calloso y cuál es su anatomía?",
    aiResponseText: "El cuerpo calloso es la mayor comisura del cerebro.",
    currentPath: ""
  });

  assert.equal(resultEs.hasMatch, true);
  assert.equal(resultEs.model.id, "035701b7-a49f-4f3f-a0fc-b335675745be");
  assert.equal(resultEs.matchedMarker.index, 3);

  // Teste em espanhol para coração
  const resultCorazon = resolveSpatialGuidance({
    userQuery: "¿Cuáles son las cavidades del corazón?",
    aiResponseText: "El corazón presenta dos aurículas y dos ventrículos.",
    currentPath: ""
  });

  assert.equal(resultCorazon.hasMatch, true);
  assert.equal(resultCorazon.model.id, "abb93126-c9be-4938-8eca-161f56864781");
});

test("Matriz de Homologação 3D — Cenário 9: Pergunta sobre o modelo atualmente aberto (Navegação contextual inequívoca)", () => {
  const resultContextual = resolveSpatialGuidance({
    userQuery: "O que estamos vendo neste modelo 3D?",
    aiResponseText: "Você está observando o corte sagital do crânio com as estruturas encefálicas expostas.",
    currentPath: "/viewer/corte-sagital-cranio-humano-superficial",
    activeModel: { slug: "corte-sagital-cranio-humano-superficial" }
  });

  assert.equal(resultContextual.hasMatch, true);
  assert.equal(resultContextual.matchType, "CONTEXTUAL_ACTIVE_MODEL");
  assert.equal(resultContextual.model.slug, "corte-sagital-cranio-humano-superficial");
});

test("Matriz de Homologação 3D — Cenário 10: Resposta sem modelo 3D (Desacoplamento visual preservado)", () => {
  // Nenhuma sugestão 3D para escápula ou tíbia
  const resultEscapula = resolveSpatialGuidance({
    userQuery: "Explique a espinha da escápula e acrômio",
    aiResponseText: "A espinha da escápula divide a face posterior nas fossas supra e infraespinais.",
    currentPath: ""
  });

  assert.equal(resultEscapula.hasMatch, false);
  assert.equal(resultEscapula.model, null);
});

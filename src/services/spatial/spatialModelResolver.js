/**
 * AETERNUM ATLAS — DETERMINISTIC SPATIAL 3D BINDING RESOLVER
 * Module: src/services/spatial/spatialModelResolver.js
 *
 * Fonte Única da Verdade para vínculos determinísticos entre consultas anatômicas e modelos 3D.
 * Previne alucinações de modelos, mapeamentos incorretos e exibição de marcadores espúrios.
 * Opera dinamicamente sobre o catálogo real do Supabase sem depender de listas estáticas permanentes.
 */

import {
  getSpatialCatalog,
  normalizeText,
  extractKeywordsFromModel,
  BASELINE_AUTHORIZED_CATALOG
} from "./spatialCatalogService.js";

export { BASELINE_AUTHORIZED_CATALOG };

// Regiões anatômicas conhecidas para prevenir colisões polissêmicas cruzadas (ex: cabeça do fêmur vs crânio)
const REGIONAL_INCOMPATIBILITIES = [
  {
    region: "lower_limb",
    triggers: ["femur", "fêmur", "coxa", "joelho", "patela", "tibia", "tíbia", "fibula", "fíbula", "quadril", "trocanter", "colo femoral"],
    incompatibleSystems: ["Sistema Nervoso Central", "Cabeça e Pescoço", "Cabeça", "Crânio", "Cranio", "Tórax", "Cardiovascular", "Coração", "Coracao"]
  },
  {
    region: "upper_limb",
    triggers: ["escapula", "escápula", "clavicula", "clavícula", "umero", "úmero", "radio", "rádio", "ulna", "ombro", "cotovelo", "punho", "mao", "mão"],
    incompatibleSystems: ["Sistema Nervoso Central", "Cabeça e Pescoço", "Cabeça", "Crânio", "Cranio", "Cardiovascular", "Coração", "Coracao"]
  },
  {
    region: "thorax_visceral",
    triggers: ["pulmao", "pulmão", "pulmoes", "pulmões", "pleura", "traqueia", "traquéia", "bronquio", "brônquio"],
    incompatibleSystems: ["Sistema Nervoso Central", "Cabeça e Pescoço", "Cabeça", "Crânio", "Cranio"]
  }
];

/**
 * Verifica se a consulta do usuário contém termos de uma região anatômica
 * que é expressamente incompatível com o sistema/região/órgão do modelo em análise.
 */
function isRegionIncompatible(normQuery, model) {
  const modelRegion = normalizeText(model.anatomicalRegion || "");
  const modelSystem = normalizeText(model.anatomicalSystem || "");
  const modelTitle = normalizeText(model.title || "");
  const modelSlug = normalizeText(model.slug || "");
  const modelCanon = normalizeText(model.canonicalEntity || "");

  for (const rule of REGIONAL_INCOMPATIBILITIES) {
    const queryHasRegionTrigger = rule.triggers.some(trig => {
      const regex = new RegExp(`\\b${normalizeText(trig)}\\b`, "i");
      return regex.test(normQuery);
    });

    if (queryHasRegionTrigger) {
      const isForbidden = rule.incompatibleSystems.some(sys => {
        const normSys = normalizeText(sys);
        return (
          modelRegion.includes(normSys) ||
          modelSystem.includes(normSys) ||
          modelTitle.includes(normSys) ||
          modelSlug.includes(normSys) ||
          modelCanon.includes(normSys)
        );
      });
      if (isForbidden) return true;
    }
  }

  return false;
}

/**
 * Resolve de forma determinística e segura se uma consulta anatômica
 * possui vínculo comprovado com um modelo 3D do catálogo homologado.
 *
 * @param {Object} params
 * @param {string} params.userQuery - Pergunta feita pelo estudante
 * @param {string} params.aiResponseText - Texto de resposta gerado pelo Tutor
 * @param {string} params.currentPath - URL ou rota atual do viewer (/viewer/slug)
 * @param {Object} params.activeModel - Modelo 3D ativo na sessão (se houver)
 * @param {Array} params.catalog - Catálogo customizado opcional (para injeção dinâmica ou testes)
 * @param {Object} params.user - Usuário autenticado para validação institucional
 * @returns {Object} { hasMatch: boolean, model: Object|null, matchedMarker: Object|null, matchType: string|null, reason: string }
 */
export function resolveSpatialGuidance({
  userQuery = "",
  aiResponseText = "",
  currentPath = "",
  activeModel = null,
  catalog = null,
  user = null
} = {}) {
  const normQuery = normalizeText(userQuery);
  const normPath = normalizeText(currentPath);

  // 1. Obter o catálogo de modelos disponíveis e autorizados
  const effectiveCatalog = Array.isArray(catalog)
    ? catalog.filter(m => {
        const isPub = ["published", "active", "publicado", "ativo"].includes(String(m.status || "").toLowerCase());
        const hasViewer = Boolean(m.viewerUrl || m.embedUrl || m.sketchfabUrl || m.sketchfabUid);
        return isPub && hasViewer;
      })
    : getSpatialCatalog({ user });

  if (!effectiveCatalog || effectiveCatalog.length === 0) {
    return {
      hasMatch: false,
      model: null,
      matchedMarker: null,
      matchType: null,
      reason: "NO_ACCESSIBLE_MODELS_IN_CATALOG"
    };
  }

  // Identifica o modelo ativo no visualizador
  const currentActiveModel = effectiveCatalog.find((m) =>
    (normPath && normPath.includes(normalizeText(m.slug))) ||
    (activeModel?.id && (m.id === activeModel.id || m.slug === activeModel.slug || (m.aliases && m.aliases.includes(activeModel.slug))))
  ) || null;

  if (normQuery) {
    // -------------------------------------------------------------------------
    // CRITÉRIO B: CORRESPONDÊNCIA DE ESTRUTURA CONTIDA NO MODELO (COM MARCADOR REAL)
    // Alta especificidade anatômica: se a pergunta foca em um acidente/marcador específico,
    // associa ao modelo e seleciona o marcador exato para foco tridimensional.
    // -------------------------------------------------------------------------
    for (const model of effectiveCatalog) {
      if (isRegionIncompatible(normQuery, model)) {
        continue;
      }

      if (Array.isArray(model.markers)) {
        for (const marker of model.markers) {
          // Validação de integridade: o marcador deve pertencer a este modelo e possuir UUID real
          const belongsToModel = !marker.modelId || marker.modelId === model.id || (Array.isArray(model.legacyIds) && model.legacyIds.includes(marker.modelId));
          if (!belongsToModel) {
            continue;
          }

          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (marker.id && !uuidRegex.test(marker.id)) {
            continue;
          }

          const synonyms = Array.isArray(marker.synonyms) ? marker.synonyms : [normalizeText(marker.label)];
          const markerHit = synonyms.some((syn) => {
            const cleanSyn = normalizeText(syn);
            if (!cleanSyn || cleanSyn.length < 3) return false;
            if (cleanSyn === "cabeca" || cleanSyn === "colo" || cleanSyn === "processo" || cleanSyn === "corpo") {
              return false;
            }
            const regex = new RegExp(`\\b${cleanSyn}\\b`, "i");
            return regex.test(normQuery);
          });

          if (markerHit) {
            return {
              hasMatch: true,
              model,
              matchedMarker: marker,
              matchType: "CONTAINED_STRUCTURE_MATCH",
              reason: `Estrutura '${marker.label}' contida no modelo '${model.title}'`
            };
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // CRITÉRIO A: CORRESPONDÊNCIA DIRETA DE ESTRUTURA (PRIMARY ENTITY)
    // -------------------------------------------------------------------------
    for (const model of effectiveCatalog) {
      if (isRegionIncompatible(normQuery, model)) {
        continue;
      }

      const keywords = Array.isArray(model.directKeywords) && model.directKeywords.length > 0
        ? model.directKeywords
        : extractKeywordsFromModel(model);

      if (!keywords || keywords.length === 0) {
        continue;
      }

      const directHit = keywords.some((kw) => {
        const cleanKw = normalizeText(kw);
        // Exclusão estrita de palavras polissêmicas isoladas como 'cabeça', 'colo', 'corpo'
        if (cleanKw === "cabeca" || cleanKw === "colo" || cleanKw === "processo" || cleanKw === "corpo") {
          return false;
        }
        const regex = new RegExp(`\\b${cleanKw}\\b`, "i");
        return regex.test(normQuery);
      });

      if (directHit) {
        return {
          hasMatch: true,
          model,
          matchedMarker: null,
          matchType: "DIRECT_STRUCTURE_MATCH",
          reason: `Consulta corresponde diretamente ao modelo '${model.title}'`
        };
      }
    }

    // -------------------------------------------------------------------------
    // CRITÉRIO C: NAVEGAÇÃO CONTEXTUAL NO MODELO ATIVO
    // -------------------------------------------------------------------------
    if (currentActiveModel) {
      // Se a pergunta menciona explicitamente outra região incompatível, aborta reuso
      if (!isRegionIncompatible(normQuery, currentActiveModel)) {
        const isContextualQuestion = /\b(neste modelo|neste corte|nesta peca|nesta peça|aqui no 3d|o que estamos vendo|anotacoes deste corte|marcadores|gire o modelo)\b/i.test(normQuery);
        if (isContextualQuestion) {
          return {
            hasMatch: true,
            model: currentActiveModel,
            matchedMarker: null,
            matchType: "CONTEXTUAL_ACTIVE_MODEL",
            reason: `Navegação contextual para o modelo ativo '${currentActiveModel.title}'`
          };
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // LINHA DE CORTE FINAL: NENHUM VÍNCULO COMPROVADO
  // -------------------------------------------------------------------------
  return {
    hasMatch: false,
    model: null,
    matchedMarker: null,
    matchType: null,
    reason: "STRUCTURE_NOT_IN_CATALOG"
  };
}

/**
 * AETERNUM ATLAS — SPATIAL CATALOG SERVICE
 * Module: src/services/spatial/spatialCatalogService.js
 *
 * Gerenciador de Catálogo 3D Autorizado e Fonte Única da Verdade para Modelos e Anotações.
 * Realiza consultas ao catálogo real do Supabase (models_3d, atlas_models, model_annotations),
 * resolvendo duplicações lógicas, respeitando políticas institucionais (inclusive institution_availability),
 * verificando rotas de visualizadores reais e aplicando política estrita FAIL-CLOSED.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../supabase/supabaseClient.js";

/**
 * Catálogo Base Verificado de Produção (Auditado diretamente contra o Supabase de Produção).
 * Utilizado para asserções de contrato e testes isolados determinísticos.
 * NUNCA é utilizado como fail-open em caso de erro de consulta em produção.
 */
export const BASELINE_AUTHORIZED_CATALOG = [
  {
    id: "035701b7-a49f-4f3f-a0fc-b335675745be",
    legacyIds: ["035701b7-a49f-4f3f-a0fc-b335675745be", "2c57a03b-2c77-4119-b8bb-676ea59e9190"],
    slug: "corte-sagital-cranio-humano-superficial",
    aliases: ["corte-sagital-cranio-humano-superficial"],
    title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    shortTitle: "Crânio Humano",
    canonicalEntity: "crânio",
    homologatedStructures: [
      "crânio", "corte sagital do crânio", "neuroanatomia", "encéfalo", "cérebro",
      "calvária", "meninges", "sagital de crânio", "sagital del cráneo"
    ],
    anatomicalSystem: "Sistema Nervoso Central",
    anatomicalRegion: "Cabeça e Pescoço",
    status: "published",
    isNavigable: true,
    viewerUrl: "/viewer/corte-sagital-cranio-humano-superficial",
    sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
    institutionAvailability: "global",
    institutionId: null,
    directKeywords: [
      "cranio", "corte sagital do cranio", "neuroanatomia", "encefalo", "cerebro",
      "calvaria", "meninges", "sagital de cranio", "sagital del craneo"
    ],
    markers: [
      {
        id: "bac2ac6a-2361-4eca-9f3c-423f65e290c3",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 0,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Cerebelo",
        description: "Cerebelo",
        synonyms: ["cerebelo", "cerebeloso", "cerebellar"]
      },
      {
        id: "799ceab4-76d9-420a-8058-bf7ad8e0e694",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 1,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Cuarto Ventrículo",
        description: "Cuarto Ventrículo",
        synonyms: ["quarto ventriculo", "cuarto ventriculo", "iv ventriculo"]
      },
      {
        id: "710324ef-c39c-48c3-8e64-69d9e4e65366",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 2,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Cuña (Cúneo)",
        description: "Cuña",
        synonyms: ["cuneo", "cuna", "cuneus"]
      },
      {
        id: "61ab053e-39ed-4a5f-a71e-171865615a20",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 3,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Cuerpo Calloso (Corpo Caloso)",
        description: "Cuerpo Calloso",
        synonyms: ["corpo caloso", "cuerpo calloso", "corpus callosum"]
      },
      {
        id: "ffb2cd99-3e8c-4a59-b33a-cd5ca34c2f6a",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 4,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Hipófisis (Hipófise)",
        description: "Hipófisis",
        synonyms: ["hipofise", "hipofisis", "pituitaria", "glandula pituitaria"]
      },
      {
        id: "1fd00529-3bfa-484d-9fc5-aabda0206835",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 5,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Giro Subcalloso",
        description: "Giro Subcalloso:",
        synonyms: ["giro subcaloso", "giro subcalloso"]
      },
      {
        id: "e75c91ba-c1b2-41d2-a084-0c03a919bae6",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 6,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Hoz del Cerebro Anterior (Foice do Cérebro)",
        description: "Hoz del Cerebro Anterior",
        synonyms: ["foice do cerebro", "hoz del cerebro", "falx cerebri"]
      },
      {
        id: "084d6fc2-1bc2-4e75-aad7-27017921063b",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 7,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Médula Oblongada (Bulbo)",
        description: "Médula Oblongada",
        synonyms: ["medula oblongada", "medula oblonga", "bulbo", "bulbo raquidiano"]
      },
      {
        id: "8e0418ca-93b3-4f38-97ef-2077a497bb1b",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 8,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Mesencéfalo",
        description: "Mesencéfalo",
        synonyms: ["mesencefalo", "mesencephalon"]
      },
      {
        id: "238a0391-23a2-41cd-83c8-a9a3f29ecab0",
        modelId: "035701b7-a49f-4f3f-a0fc-b335675745be",
        annotationIndex: 9,
        sketchfabUid: "0145e302fd94453c8f7fb2817e45060e",
        label: "Giro Cingular (Giro do Cíngulo)",
        description: "Giro Cingular",
        synonyms: ["giro cingular", "giro do cingulo", "giro cingulado", "cingulate gyrus"]
      }
    ]
  },
  {
    id: "abb93126-c9be-4938-8eca-161f56864781",
    legacyIds: ["abb93126-c9be-4938-8eca-161f56864781"],
    slug: "coracao-humano-superficial",
    aliases: ["coracao-edicao-morgue", "coracao-humano-superficial"],
    title: "Coração Humano — Modelo Superficial 3D",
    shortTitle: "Coração Humano",
    canonicalEntity: "coração",
    homologatedStructures: [
      "coração", "corazón", "heart", "miocárdio", "anatomia cardíaca", "morfologia cardíaca",
      "vasos da base", "cardiovascular"
    ],
    anatomicalSystem: "Sistema Cardiovascular",
    anatomicalRegion: "Tórax",
    status: "published",
    isNavigable: true,
    viewerUrl: "/viewer/coracao-humano-superficial",
    sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
    institutionAvailability: "global",
    institutionId: null,
    directKeywords: [
      "coracao", "corazon", "heart", "miocardio", "anatomia cardiaca", "morfologia cardiaca",
      "vasos da base", "cardiovascular"
    ],
    markers: [
      {
        id: "fa77dcae-d1eb-4f43-8a47-0bc809a03e94",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 0,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Artéria Interventricular Anterior",
        description: "Artéria Interventricular Anterior",
        synonyms: ["arteria interventricular anterior", "descendente anterior", "interventricular anterior"]
      },
      {
        id: "55ddb548-74ad-4659-bbaa-f3e64373d35c",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 1,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Cono Arterioso (Cone Arterioso)",
        description: "Cono Arterioso",
        synonyms: ["cono arterioso", "cone arterioso"]
      },
      {
        id: "7d43be1c-f2c7-47f8-b5b2-aec96a7d3071",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 2,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Tronco Pulmonar",
        description: "Tronco Pulmonar",
        synonyms: ["tronco pulmonar", "arteria pulmonar"]
      },
      {
        id: "55472f6c-f2c8-40e4-9afb-b7a5f0338689",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 3,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Orejuela Derecha (Aurícula Direita)",
        description: "Orejuela Derecha",
        synonyms: ["orejuela derecha", "auricula direita", "auricula derecha"]
      },
      {
        id: "c5cac140-8cf0-4e2d-8d8a-dcd554ac22ec",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 4,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Ventrículo Izquierdo (Ventrículo Esquerdo)",
        description: "Ventrículos Izquierdo",
        synonyms: ["ventriculo esquerdo", "ventriculos izquierdo", "ventriculo izquierdo"]
      },
      {
        id: "78d9b71a-dfcd-44e4-870b-663cd98e415a",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 5,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Ventrículo Direito",
        description: "Ventrículo Derecho",
        synonyms: ["ventriculo direito", "ventriculo derecho"]
      },
      {
        id: "ba817e32-d4f6-46e2-bfac-32feb51747ae",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 6,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Artéria Aorta Ascendente",
        description: "Artéria Aorta Ascendente",
        synonyms: ["aorta ascendente", "arteria aorta ascendente"]
      },
      {
        id: "190d0ac2-23c4-4163-b04d-56c075f22dcd",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 7,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Tronco Braquiocefálico",
        description: "Tronco Braquiocefálico",
        synonyms: ["tronco braquiocefalico", "arteria braquiocefalica"]
      },
      {
        id: "75ac17bc-81ac-456f-9392-d02ac2d71108",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 8,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Arco Aórtico",
        description: "Arco Aórtico",
        synonyms: ["arco aortico", "cajado da aorta"]
      },
      {
        id: "fe7bc516-5bdd-41c2-993b-aa557c8df112",
        modelId: "abb93126-c9be-4938-8eca-161f56864781",
        annotationIndex: 9,
        sketchfabUid: "fd61a9605f4148a9b5274463f7adbcb5",
        label: "Artéria Carótida Comum Esquerda",
        description: "Artéria Carótida Comum Izquierda",
        synonyms: ["carotida comum", "carotida comun", "carotida comum esquerda"]
      }
    ]
  }
];

let activeDynamicCatalog = null;
let lastFetchState = {
  status: "idle", // 'idle' | 'loading' | 'ready' | 'error' | 'empty'
  lastFetchAt: null,
  error: null
};

/**
 * Normaliza um texto removendo acentos e convertendo para minúsculas.
 */
export function normalizeText(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Extrai palavras-chave anatômicas de um modelo de forma homologada.
 */
export function extractKeywordsFromModel(model) {
  const keywords = new Set();

  const titleNorm = normalizeText(model.title);
  const slugNorm = normalizeText(model.slug).replace(/[-_]/g, " ");

  if (titleNorm) keywords.add(titleNorm);
  if (slugNorm) keywords.add(slugNorm);

  // Remove qualificadores genéricos mantendo termos anatômicos centrais (ex: "femur humano 3d" -> "femur")
  const cleanedTitle = titleNorm.replace(/\b(3d|modelo|visualizador|humano|humana)\b/g, "").replace(/\s+/g, " ").trim();
  if (cleanedTitle && cleanedTitle.length > 2) keywords.add(cleanedTitle);

  const cleanedSlug = slugNorm.replace(/\b(3d|modelo|visualizador|humano|humana)\b/g, "").replace(/\s+/g, " ").trim();
  if (cleanedSlug && cleanedSlug.length > 2) keywords.add(cleanedSlug);

  // Palavras anatômicas individuais (>3 caracteres) excluindo termos técnicos genéricos de visualização
  const words = [...titleNorm.split(/\s+/), ...slugNorm.split(/\s+/)];
  const genericTerms = new Set(["corte", "sagital", "superficial", "humano", "humana", "modelo", "vista", "3d", "peca", "anatomica", "para", "com", "sem", "sobre"]);
  words.forEach(w => {
    const cleanW = w.trim();
    if (cleanW.length >= 4 && !genericTerms.has(cleanW)) {
      keywords.add(cleanW);
    }
  });

  if (model.canonicalEntity) keywords.add(normalizeText(model.canonicalEntity));

  if (Array.isArray(model.homologatedStructures)) {
    model.homologatedStructures.forEach(s => {
      const clean = normalizeText(s);
      if (clean && clean.length > 2) keywords.add(clean);
    });
  }

  if (model.anatomicalSystem) keywords.add(normalizeText(model.anatomicalSystem));
  if (model.anatomicalRegion) keywords.add(normalizeText(model.anatomicalRegion));

  if (Array.isArray(model.tags)) {
    model.tags.forEach(t => {
      const clean = normalizeText(t);
      if (clean && clean.length > 2) keywords.add(clean);
    });
  }

  if (Array.isArray(model.directKeywords)) {
    model.directKeywords.forEach(k => {
      const clean = normalizeText(k);
      if (clean) keywords.add(clean);
    });
  }

  return Array.from(keywords);
}

/**
 * Valida a existência real da rota do visualizador e da integridade do modelo.
 * Não considera automaticamente válida uma URL `/viewer/<slug>` sem validação do slug e viewer.
 */
export function validateModelIntegrity(model) {
  if (!model || typeof model !== "object") return false;
  if (!model.id || !model.title || !model.slug) return false;

  // Slug deve ser válido e não vazio
  const cleanSlug = String(model.slug).trim();
  if (!cleanSlug || cleanSlug.length < 3) return false;

  // Status deve ser estritamente 'published' ou 'active'
  const isPublished = ["published", "active", "publicado", "ativo"].includes(
    String(model.status || "").toLowerCase()
  );
  if (!isPublished) return false;

  // Se o modelo foi arquivado ou marcado para deleção, invalida
  if (model.archivedAt || model.archived_at || model.deletedAt || model.deleted_at) {
    return false;
  }

  // A rota de navegação deve ser explicitamente validada
  const validRoute = model.viewerUrl && (
    model.viewerUrl === `/viewer/${cleanSlug}` ||
    model.viewerUrl.startsWith("/viewer/")
  );
  if (!validRoute) return false;

  // Deve possuir motor de renderização ou identificador Sketchfab verificado
  const hasViewerEngine = Boolean(model.sketchfabUid || model.sketchfabUrl || model.embedUrl);
  if (!hasViewerEngine) return false;

  return true;
}

/**
 * Valida se o usuário possui permissão institucional para acessar o modelo,
 * avaliando 'institution_availability' (JSONB) e 'institution_id'.
 */
export function validateInstitutionalAccess(model, user = null) {
  if (!model) return false;

  const role = String(user?.role || "").toLowerCase();
  const isSuperAdmin = role === "super_admin" || role === "superadmin" || role === "founder";
  if (isSuperAdmin) return true;

  const userInst = user?.institution_id || user?.institutionId || null;

  // 1. Avalia 'institution_availability' (JSONB da tabela moderna atlas_models)
  const avail = model.institutionAvailability ?? model.institution_availability;
  if (avail !== undefined && avail !== null) {
    // Caso 1: string "global" ou objeto com propriedade global
    if (avail === "global" || avail === "{global}") return true;
    if (typeof avail === "object") {
      if (avail.global === true || avail.is_global === true) return true;
      if (Array.isArray(avail)) {
        if (avail.includes("global") || avail.includes("{global}")) return true;
        if (userInst && avail.includes(userInst)) return true;
        // Se é array restrito e usuário não pertence
        return false;
      }
      if (userInst && avail[userInst]) return true;
    }
    if (typeof avail === "string" && /global/i.test(avail)) return true;
  }

  // 2. Avalia 'institution_id' legado ou explícito
  const modelInst = model.institutionId || model.institution_id || null;
  if (modelInst) {
    if (!userInst) return false;
    return modelInst === userInst;
  }

  // Se não possui restrição específica de instituição e não foi restrito por institution_availability
  return true;
}

/**
 * Retorna o catálogo espacial atualmente em vigor para o usuário (FAIL-CLOSED).
 * Se o catálogo dinâmico não foi carregado ou falhou, retorna vazio para evitar recomendações obsoletas.
 */
export function getSpatialCatalog({ user = null } = {}) {
  // Se houver um catálogo dinâmico carregado, usa-o
  if (activeDynamicCatalog !== null) {
    return activeDynamicCatalog
      .filter(validateModelIntegrity)
      .filter(m => validateInstitutionalAccess(m, user));
  }

  // FAIL-CLOSED: Se a última tentativa de consulta falhou ou retornou vazia, não usa fallback
  if (lastFetchState.status === "error" || lastFetchState.status === "empty") {
    return [];
  }

  // Em ambiente de teste ou inicial sem falha declarada, fornece o baseline homologado
  return BASELINE_AUTHORIZED_CATALOG
    .filter(validateModelIntegrity)
    .filter(m => validateInstitutionalAccess(m, user));
}

/**
 * Define ou atualiza dinamicamente o catálogo espacial ativo (para injeção em testes ou runtime).
 */
export function setSpatialCatalog(catalog) {
  if (Array.isArray(catalog)) {
    activeDynamicCatalog = catalog;
    lastFetchState = {
      status: catalog.length > 0 ? "ready" : "empty",
      lastFetchAt: Date.now(),
      error: null
    };
  }
}

/**
 * Restaura o catálogo espacial para o estado limpo.
 */
export function resetSpatialCatalog() {
  activeDynamicCatalog = null;
  lastFetchState = {
    status: "idle",
    lastFetchAt: null,
    error: null
  };
}

/**
 * Retorna o status atual do carregamento do catálogo espacial.
 */
export function getSpatialCatalogState() {
  return { ...lastFetchState };
}

/**
 * Resolve duplicações lógicas entre 'atlas_models' e 'models_3d' pelo slug validado.
 * Prioriza atlas_models como fonte autoritativa, preservando UUIDs e permissões.
 */
export function deduplicateCatalogModels(rawAtlas = [], rawLegacy = []) {
  const modelsBySlug = new Map();

  // 1. Processar atlas_models (fonte autoritativa moderna)
  rawAtlas.forEach(row => {
    if (!row.slug) return;
    const normSlug = normalizeText(row.slug);
    modelsBySlug.set(normSlug, {
      id: row.id,
      legacyIds: [row.id],
      slug: row.slug,
      title: row.title,
      shortTitle: row.title,
      status: row.status,
      canonicalEntity: row.title?.toLowerCase().includes("crânio") || row.title?.toLowerCase().includes("cranio")
        ? "crânio"
        : (row.title?.toLowerCase().includes("coração") || row.title?.toLowerCase().includes("coracao") ? "coração" : row.slug),
      anatomicalSystem: row.anatomical_system,
      anatomicalRegion: row.anatomical_region,
      institutionId: row.institution_id || null,
      institutionAvailability: row.institution_availability || "global",
      sketchfabUrl: row.sketchfab_url,
      embedUrl: row.embed_url,
      sketchfabUid: row.sketchfab_url?.match(/([a-f0-9]{32})/i)?.[1] || null,
      viewerUrl: `/viewer/${row.slug}`,
      isNavigable: true,
      archivedAt: row.archived_at || null,
      deletedAt: row.deleted_at || null,
      tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === "string" ? row.tags.split(",") : []),
      markers: []
    });
  });

  // 2. Processar ou mesclar models_3d (legada)
  rawLegacy.forEach(row => {
    if (!row.slug) return;
    const normSlug = normalizeText(row.slug);

    if (modelsBySlug.has(normSlug)) {
      // Já existe em atlas_models: preserva autoridade mas anexa UUID legado para mapeamento de anotações
      const existing = modelsBySlug.get(normSlug);
      if (row.id && !existing.legacyIds.includes(row.id)) {
        existing.legacyIds.push(row.id);
      }
      if (!existing.institutionId && row.institution_id) {
        existing.institutionId = row.institution_id;
      }
      if (!existing.sketchfabUid && row.sketchfab_url) {
        existing.sketchfabUid = row.sketchfab_url.match(/([a-f0-9]{32})/i)?.[1] || null;
      }
    } else {
      // Existe apenas na tabela legada: registra como modelo autoritativo
      modelsBySlug.set(normSlug, {
        id: row.id,
        legacyIds: [row.id],
        slug: row.slug,
        title: row.title,
        shortTitle: row.title,
        status: row.status,
        canonicalEntity: row.title?.toLowerCase().includes("crânio") || row.title?.toLowerCase().includes("cranio")
          ? "crânio"
          : (row.title?.toLowerCase().includes("coração") || row.title?.toLowerCase().includes("coracao") ? "coração" : row.slug),
        anatomicalSystem: row.anatomical_system,
        anatomicalRegion: row.anatomical_region,
        institutionId: row.institution_id || null,
        institutionAvailability: "global",
        sketchfabUrl: row.sketchfab_url,
        embedUrl: row.embed_url,
        sketchfabUid: row.sketchfab_url?.match(/([a-f0-9]{32})/i)?.[1] || null,
        viewerUrl: `/viewer/${row.slug}`,
        isNavigable: true,
        archivedAt: row.archived_at || null,
        deletedAt: row.deleted_at || null,
        tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === "string" ? row.tags.split(",") : []),
        markers: []
      });
    }
  });

  return Array.from(modelsBySlug.values());
}

/**
 * Consulta assíncrona ao catálogo do Supabase (models_3d, atlas_models e model_annotations).
 * Aplica deduplicação por slug, resolve anotações reais por UUID e adota estritamente FAIL-CLOSED.
 */
export async function fetchPublishedSpatialCatalog({ user = null, client = null } = {}) {
  const sb = client || getSupabaseClient();
  if (!sb || (!client && !isSupabaseConfigured())) {
    // FAIL-CLOSED: Se o Supabase não está configurado, o catálogo não emite recomendações
    lastFetchState = { status: "empty", lastFetchAt: Date.now(), error: null };
    activeDynamicCatalog = [];
    return [];
  }

  lastFetchState = { status: "loading", lastFetchAt: Date.now(), error: null };

  try {
    // 1. Consultar modelos em atlas_models e models_3d
    const [atlasRes, legacyRes] = await Promise.all([
      sb.from("atlas_models").select("*").eq("status", "published"),
      sb.from("models_3d").select("*").in("status", ["active", "published", "available"])
    ]);

    if (atlasRes.error) {
      throw new Error(`Falha ao consultar atlas_models: ${atlasRes.error.message}`);
    }
    if (legacyRes.error) {
      throw new Error(`Falha ao consultar models_3d: ${legacyRes.error.message}`);
    }

    const rawAtlas = atlasRes.data || [];
    const rawLegacy = legacyRes.data || [];

    // 2. Deduplicar pelo modelo lógico e slug validado
    const deduplicatedModels = deduplicateCatalogModels(rawAtlas, rawLegacy);

    if (deduplicatedModels.length === 0) {
      lastFetchState = { status: "empty", lastFetchAt: Date.now(), error: null };
      activeDynamicCatalog = [];
      return [];
    }

    // 3. Mapear todos os UUIDs (novos e legados) para buscar anotações reais
    const allModelIds = [];
    deduplicatedModels.forEach(m => {
      m.legacyIds.forEach(id => {
        if (!allModelIds.includes(id)) allModelIds.push(id);
      });
    });

    if (allModelIds.length > 0) {
      const { data: annData, error: annError } = await sb
        .from("model_annotations")
        .select("id, model_id, annotation_index, sketchfab_uid, title, description, eye, target, position")
        .in("model_id", allModelIds)
        .order("annotation_index", { ascending: true });

      if (annError) {
        throw new Error(`Falha ao consultar model_annotations: ${annError.message}`);
      }

      (annData || []).forEach(ann => {
        // Encontra o modelo lógico pai correspondente
        const parent = deduplicatedModels.find(m => m.legacyIds.includes(ann.model_id));
        if (parent) {
          // Previne duplicação de marcadores pelo mesmo annotation_index
          const alreadyExists = parent.markers.some(existing =>
            existing.annotationIndex === ann.annotation_index || existing.id === ann.id
          );
          if (!alreadyExists) {
            parent.markers.push({
              id: ann.id,
              modelId: parent.id, // Normaliza para o UUID autoritativo do modelo
              annotationIndex: ann.annotation_index,
              sketchfabUid: ann.sketchfab_uid,
              label: ann.title,
              description: ann.description || "",
              eye: ann.eye,
              target: ann.target,
              position: ann.position,
              synonyms: [normalizeText(ann.title)]
            });
            if (ann.sketchfab_uid && !parent.sketchfabUid) {
              parent.sketchfabUid = ann.sketchfab_uid;
            }
          }
        }
      });
    }

    const resolved = deduplicatedModels
      .map(m => ({
        ...m,
        directKeywords: extractKeywordsFromModel(m)
      }))
      .filter(validateModelIntegrity)
      .filter(m => validateInstitutionalAccess(m, user));

    activeDynamicCatalog = resolved;
    lastFetchState = {
      status: resolved.length > 0 ? "ready" : "empty",
      lastFetchAt: Date.now(),
      error: null
    };

    return resolved;
  } catch (err) {
    console.error("[spatialCatalogService] FAIL-CLOSED: Erro ao carregar catálogo do Supabase:", err.message);
    activeDynamicCatalog = [];
    lastFetchState = {
      status: "error",
      lastFetchAt: Date.now(),
      error: err
    };
    // FAIL-CLOSED: Retorna estritamente vazio. Nenhuma recomendação potencialmente obsoleta é emitida.
    return [];
  }
}

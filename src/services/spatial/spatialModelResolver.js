/**
 * AETERNUM ATLAS — DETERMINISTIC SPATIAL 3D BINDING RESOLVER
 * Module: src/services/spatial/spatialModelResolver.js
 * 
 * Fonte Única da Verdade para vínculos determinísticos entre consultas anatômicas e modelos 3D.
 * Previne alucinações de modelos, mapeamentos incorretos e exibição de marcadores espúrios.
 * Auditado diretamente contra as tabelas do Supabase (models_3d, atlas_models, model_annotations).
 */

function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Catálogo Autorizado de Modelos 3D e Marcadores Reais (Fonte de Verdade)
 * Mapeado a partir de models_3d e model_annotations do banco de produção.
 */
export const AUTHORIZED_3D_CATALOG = [
  {
    id: "035701b7-a49f-4f3f-a0fc-b335675745be",
    slug: "corte-sagital-cranio-humano-superficial",
    aliases: ["corte-sagital-cranio-humano-superficial"],
    title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    shortTitle: "Crânio Humano",
    anatomicalSystem: "Sistema Nervoso Central",
    anatomicalRegion: "Cabeça",
    status: "published",
    viewerUrl: "/viewer/corte-sagital-cranio-humano-superficial",
    // Palavras-chave estritas para correspondência direta (Critério A)
    // ATENÇÃO: 'cabeça' e 'cabeca' foram EXCLUÍDOS propositalmente por colidirem com 'cabeça do fêmur' e 'cabeça do úmero'
    directKeywords: [
      "cranio", "corte sagital do cranio", "neuroanatomia", "encefalo", "cerebro",
      "calvaria", "meninges", "sagital de cranio", "sagital del craneo"
    ],
    // Marcadores reais auditados de model_annotations (Critério B)
    markers: [
      { id: "m-cran-0", label: "Cerebelo", index: 0, synonyms: ["cerebelo", "cerebeloso", "cerebellar"] },
      { id: "m-cran-1", label: "Cuarto Ventrículo", index: 1, synonyms: ["quarto ventriculo", "cuarto ventriculo", "iv ventriculo"] },
      { id: "m-cran-2", label: "Cuña (Cúneo)", index: 2, synonyms: ["cuneo", "cuna", "cuneus"] },
      { id: "m-cran-3", label: "Cuerpo Calloso (Corpo Caloso)", index: 3, synonyms: ["corpo caloso", "cuerpo calloso", "corpus callosum"] },
      { id: "m-cran-4", label: "Hipófisis (Hipófise)", index: 4, synonyms: ["hipofise", "hipofisis", "pituitaria", "glandula pituitaria"] },
      { id: "m-cran-5", label: "Giro Subcalloso", index: 5, synonyms: ["giro subcaloso", "giro subcalloso"] },
      { id: "m-cran-6", label: "Hoz del Cerebro Anterior (Foice do Cérebro)", index: 6, synonyms: ["foice do cerebro", "hoz del cerebro", "falx cerebri"] },
      { id: "m-cran-7", label: "Médula Oblongada (Bulbo)", index: 7, synonyms: ["medula oblongada", "medula oblonga", "bulbo", "bulbo raquidiano"] },
      { id: "m-cran-8", label: "Mesencéfalo", index: 8, synonyms: ["mesencefalo", "mesencephalon"] },
      { id: "m-cran-9", label: "Giro Cingular (Giro do Cíngulo)", index: 9, synonyms: ["giro cingular", "giro do cingulo", "giro cingulado", "cingulate gyrus"] }
    ]
  },
  {
    id: "abb93126-c9be-4938-8eca-161f56864781",
    slug: "coracao-humano-superficial",
    aliases: ["coracao-edicao-morgue", "coracao-humano-superficial"],
    title: "Coração Humano — Modelo Superficial 3D",
    shortTitle: "Coração Humano",
    anatomicalSystem: "Sistema Cardiovascular",
    anatomicalRegion: "Tórax",
    status: "published",
    viewerUrl: "/viewer/coracao-humano-superficial",
    directKeywords: [
      "coracao", "corazon", "heart", "miocardio", "anatomia cardiaca", "morfologia cardiaca",
      "vasos da base", "cardiovascular"
    ],
    markers: [
      { id: "m-card-0", label: "Artéria Interventricular Anterior", index: 0, synonyms: ["arteria interventricular anterior", "descendente anterior", "interventricular anterior"] },
      { id: "m-card-1", label: "Cono Arterioso (Cone Arterioso)", index: 1, synonyms: ["cono arterioso", "cone arterioso"] },
      { id: "m-card-2", label: "Tronco Pulmonar", index: 2, synonyms: ["tronco pulmonar", "arteria pulmonar"] },
      { id: "m-card-3", label: "Orejuela Derecha (Aurícula Direita)", index: 3, synonyms: ["orejuela derecha", "auricula direita", "auricula derecha"] },
      { id: "m-card-4", label: "Ventrículo Izquierdo (Ventrículo Esquerdo)", index: 4, synonyms: ["ventriculo esquerdo", "ventriculos izquierdo", "ventriculo izquierdo"] },
      { id: "m-card-5", label: "Ventrículo Derecho (Ventrículo Direito)", index: 5, synonyms: ["ventriculo direito", "ventriculo derecho"] },
      { id: "m-card-6", label: "Artéria Aorta Ascendente", index: 6, synonyms: ["aorta ascendente", "arteria aorta ascendente"] },
      { id: "m-card-7", label: "Tronco Braquiocefálico", index: 7, synonyms: ["tronco braquiocefalico", "arteria braquiocefalica"] },
      { id: "m-card-8", label: "Arco Aórtico", index: 8, synonyms: ["arco aortico", "cajado da aorta"] },
      { id: "m-card-9", label: "Artéria Carótida Comum Esquerda", index: 9, synonyms: ["carotida comum", "carotida comun", "carotida comum esquerda"] }
    ]
  },
  {
    id: "corte-sagital-sistema-reprodutor-feminino",
    slug: "corte-sagital-sistema-reprodutor-feminino",
    aliases: ["corte-sagital-sistema-reprodutor-feminino"],
    title: "Corte Sagital do Sistema Reprodutor Feminino — Modelo 3D",
    shortTitle: "Sistema Reprodutor Feminino",
    anatomicalSystem: "Sistema Reprodutor Feminino",
    anatomicalRegion: "Pelve e Períneo",
    status: "published",
    viewerUrl: "/viewer/corte-sagital-sistema-reprodutor-feminino",
    directKeywords: [
      "sistema reprodutor feminino", "reprodutor feminino", "aparelho reprodutor feminino",
      "pelve feminina", "genitalia feminina interna", "genitália feminina"
    ],
    markers: [
      { id: "m-fem-0", label: "Útero & Cavidade Uterina", index: 0, synonyms: ["utero", "cavidade uterina", "corpo uterino", "fundo uterino"] },
      { id: "m-fem-1", label: "Bexiga Urinária", index: 1, synonyms: ["bexiga", "bexiga urinaria"] },
      { id: "m-fem-2", label: "Fundo de Saco de Douglas", index: 2, synonyms: ["fundo de saco de douglas", "saco de douglas", "recesso retouterino", "espaco de douglas"] },
      { id: "m-fem-3", label: "Canal Vaginal & Cérvix", index: 3, synonyms: ["canal vaginal", "vagina", "cervix", "colo do utero", "colo uterino"] }
    ]
  }
];

/**
 * Estruturas anatômicas comprovadamente ausentes da biblioteca 3D atual.
 * Se a consulta for sobre estas estruturas, a linha de corte proíbe terminantemente qualquer sugestão.
 */
const EXCLUDED_UNSUPPORTED_STRUCTURES = [
  // Membro Inferior
  "femur", "colo femoral", "trocanter", "trocanter maior", "trocanter menor", "tibia", "fibula",
  "patela", "joelho", "quadril", "coxa", "perna", "tarso", "metatarso", "tornozelo",
  // Membro Superior
  "escapula", "clavicula", "umero", "radio", "ulna", "ombro", "cotovelo", "punho", "mao",
  "braco", "antabraco", "carpo", "metacarpo", "plexo braquial",
  // Tórax não-cardíaco / Pulmões
  "pulmao", "pulmoes", "traqueia", "bronquio", "pleura", "diafragma",
  // Abdome
  "figado", "estomago", "pancreas", "rim", "rins", "baco", "intestino",
  // Coluna / Dorso
  "coluna vertebral", "vertebra", "disco intervertebral"
];

/**
 * Resolve de forma determinística e segura se uma consulta anatômica
 * possui vínculo comprovado com um modelo 3D do acervo oficial.
 *
 * @param {Object} params
 * @param {string} params.userQuery - Pergunta feita pelo estudante
 * @param {string} params.aiResponseText - Texto de resposta gerado pelo Tutor
 * @param {string} params.currentPath - URL ou rota atual do viewer (/viewer/slug)
 * @param {Object} params.activeModel - Modelo 3D ativo na sessão (se houver)
 * @returns {Object} { hasMatch: boolean, model: Object|null, matchedMarker: Object|null, matchType: string|null, reason: string }
 */
export function resolveSpatialGuidance({
  userQuery = "",
  aiResponseText = "",
  currentPath = "",
  activeModel = null
} = {}) {
  const normQuery = normalizeText(userQuery);
  const normResponse = normalizeText(aiResponseText);
  const normPath = normalizeText(currentPath);

  // Identifica o modelo ativo no visualizador
  const currentActiveModel = AUTHORIZED_3D_CATALOG.find((m) =>
    (normPath && normPath.includes(m.slug)) ||
    (activeModel?.slug && (activeModel.slug === m.slug || m.aliases.includes(activeModel.slug)))
  ) || null;

  // -------------------------------------------------------------------------
  // LINHA DE CORTE 1: VERIFICAÇÃO DE ESTRUTURAS SEM MODELO 3D NO ACERVO
  // -------------------------------------------------------------------------
  // Se a pergunta do estudante foca em uma estrutura sem modelo 3D (ex: Fêmur, Pulmão, Escápula),
  // NUNCA permita que termos coincidentes na resposta (como 'cabeça') ativem modelos de outras regiões!
  const matchesUnsupportedStructure = EXCLUDED_UNSUPPORTED_STRUCTURES.some((item) => {
    const regex = new RegExp(`\\b${item}\\b`, 'i');
    return regex.test(normQuery) || (normQuery.length < 3 && regex.test(normResponse));
  });

  if (matchesUnsupportedStructure) {
    return {
      hasMatch: false,
      model: null,
      matchedMarker: null,
      matchType: null,
      reason: "STRUCTURE_HAS_NO_3D_MODEL_IN_CATALOG"
    };
  }

  // -------------------------------------------------------------------------
  // CRITÉRIO A: CORRESPONDÊNCIA DIRETA DE ESTRUTURA (PRIMARY ENTITY)
  // -------------------------------------------------------------------------
  if (normQuery) {
    for (const model of AUTHORIZED_3D_CATALOG) {
      if (model.status !== "published" && model.status !== "active") continue;

      const directHit = model.directKeywords.some((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
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
    // CRITÉRIO B: CORRESPONDÊNCIA DE ESTRUTURA CONTIDA NO MODELO (COM MARCADOR)
    // -------------------------------------------------------------------------
    for (const model of AUTHORIZED_3D_CATALOG) {
      if (model.status !== "published" && model.status !== "active") continue;

      for (const marker of model.markers) {
        const markerHit = marker.synonyms.some((syn) => {
          const regex = new RegExp(`\\b${syn}\\b`, 'i');
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

    // -------------------------------------------------------------------------
    // CRITÉRIO C: NAVEGAÇÃO CONTEXTUAL NO MODELO ATIVO
    // -------------------------------------------------------------------------
    // Se o usuário está com um modelo aberto e faz pergunta deítica/contextual
    // ("o que vejo aqui?", "quais os pontos deste corte?", "mostre as anotações")
    if (currentActiveModel) {
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

  // -------------------------------------------------------------------------
  // LINHA DE CORTE FINAL: NENHUM VÍNCULO COMPROVADO
  // -------------------------------------------------------------------------
  return {
    hasMatch: false,
    model: null,
    matchedMarker: null,
    matchType: null,
    reason: "NO_VERIFIED_SPATIAL_BINDING"
  };
}

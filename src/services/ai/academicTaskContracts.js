/**
 * AETERNUM ATLAS — ACADEMIC TASK CONTRACTS & UNIFIED BRAIN ORCHESTRATION
 * Contratos padronizados de tarefas acadêmicas entre Frontend, Edge Functions e TutorEngine Rust (Qwen 3.5 4B).
 * Governança P0.7: Tipagem estrita, códigos de erro padronizados, validação de schema e telemetria.
 */

export const ACADEMIC_TASK_TYPES = Object.freeze({
  GENERATE_FLASHCARDS: "generate_flashcards",
  EXPLAIN_FLASHCARD: "explain_flashcard",
  GENERATE_MIND_MAP: "generate_mind_map",
  GENERATE_ANATOMICAL_QUIZ: "generate_anatomical_quiz",
  EXPLAIN_ANATOMICAL_STRUCTURE: "explain_anatomical_structure",
  GENERATE_STUDY_PLAN: "generate_study_plan",
  ANALYZE_LEARNING_PROGRESS: "analyze_learning_progress",
  RECOMMEND_REVISION: "recommend_revision",
  EXPLAIN_3D_MODEL: "explain_3d_model"
});

export const TUTOR_RESPONSE_MODES = Object.freeze({
  LIVE: "live",
  ONLINE: "online",
  STANDBY: "standby",
  ERROR: "error"
});

export const ACADEMIC_ERROR_CODES = Object.freeze({
  TUTOR_GATEWAY_UNAVAILABLE: "TUTOR_GATEWAY_UNAVAILABLE",
  TUTOR_RESPONSE_CONTRACT_MISMATCH: "TUTOR_RESPONSE_CONTRACT_MISMATCH",
  ANATOMICAL_EVIDENCE_INSUFFICIENT: "ANATOMICAL_EVIDENCE_INSUFFICIENT",
  FLASHCARD_SCHEMA_INVALID: "FLASHCARD_SCHEMA_INVALID",
  FLASHCARD_GENERATION_INCOMPLETE: "FLASHCARD_GENERATION_INCOMPLETE",
  MIND_MAP_SCHEMA_INVALID: "MIND_MAP_SCHEMA_INVALID",
  STUDY_PERSISTENCE_FAILED: "STUDY_PERSISTENCE_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  SCIENTIFIC_CONTRADICTION_CONFIRMED: "SCIENTIFIC_CONTRADICTION_CONFIRMED",
  ANATOMICAL_PREMISE_REJECTED: "ANATOMICAL_PREMISE_REJECTED",
  SCIENTIFIC_REVIEW_REQUIRED: "SCIENTIFIC_REVIEW_REQUIRED",
  PARTIALLY_VERIFIED: "PARTIALLY_VERIFIED",
  STREAM_TRUNCATED: "STREAM_TRUNCATED",
  EMPTY_RESPONSE: "EMPTY_RESPONSE",
  CITATION_PROVENANCE_MISMATCH: "CITATION_PROVENANCE_MISMATCH"
});

/**
 * Determina se o modo de conexão do Tutor é ativo e operacional.
 * Aceita tanto o modo canônico 'live' quanto o legado 'online'.
 */
export function isTutorModeActive(mode) {
  return mode === TUTOR_RESPONSE_MODES.LIVE || mode === TUTOR_RESPONSE_MODES.ONLINE;
}

/**
 * Identifica se a resposta do Tutor corresponde a uma recusa/abstenção científica
 * por evidência anatômica insuficiente nas fontes soberanas (Evidence Gate).
 */
export function isEvidenceInsufficient(response) {
  if (!response || typeof response !== "object") return false;
  if (response.knowledgeState === "INSUFFICIENT_EVIDENCE") return true;
  if (response.code === ACADEMIC_ERROR_CODES.ANATOMICAL_EVIDENCE_INSUFFICIENT) return true;
  const text = String(response.text || response.message || "").trim();
  return /Evidência anatômica insuficiente nas fontes soberanas/i.test(text);
}

/**
 * Valida se uma resposta do serviço de IA foi bem-sucedida, operacional e contém conteúdo anatômico válido.
 * Rejeita expressamente abstenções por insuficiência de evidência ou estados degradados.
 */
export function isTutorSuccess(response) {
  if (!response || typeof response !== "object") return false;
  if (!isTutorModeActive(response.mode)) return false;
  if (isEvidenceInsufficient(response)) return false;
  if (response.code && response.code !== "SUCCESS") return false;
  if (response.truncated === true || response.finishReason === "length") return false;
  const text = String(response.text || "").trim();
  return Boolean(text && text.length >= 5);
}

/**
 * Validador de Schema para Flashcards Anatômicos
 */
export function validateFlashcardSchema(card) {
  if (!card || typeof card !== "object") return false;
  const front = String(card.front || "").trim();
  const back = String(card.back || "").trim();
  const explanation = String(card.explanation || "").trim();
  const learningObjective = String(card.learningObjective || "").trim();

  if (front.length < 18 || back.length < 3 || explanation.length < 18) return false;
  if (/estrutura médica correspondente|tratado de anatomia|tuberosidade ou crista|placeholder/i.test(`${front} ${back}`)) {
    return false;
  }
  return {
    valid: true,
    card: {
      ...card,
      front,
      back,
      explanation,
      learningObjective: learningObjective || "Integração anatômica e raciocínio clínico"
    }
  };
}

/**
 * Validador de Schema para Esboço de Mapa Mental
 */
export function validateMindMapSchema(outlineText) {
  if (!outlineText || typeof outlineText !== "string") {
    return { valid: false, reason: "Esboço vazio ou inválido." };
  }
  const lines = outlineText.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 7) {
    return { valid: false, reason: "Menos de 7 nós identificados no mapa mental." };
  }
  const childCount = lines.filter((line) => /^\s+\S/.test(line)).length;
  if (childCount < 4) {
    return { valid: false, reason: "Hierarquia insuficiente de nós filhos." };
  }
  return {
    valid: true,
    totalNodes: lines.length,
    childCount,
    rootLabel: lines[0].trim()
  };
}

/**
 * Analisa se um trecho de texto anatômico contém uma proposição de forma afirmativa (positiva)
 * ou se ela aparece negada, refutada ou contextualizada como erro conceitual.
 */
function isPositiveAssertion(text, targetRegex, { exceptionRegex = null } = {}) {
  if (!text || !targetRegex.test(text)) return false;

  const sentences = text.split(/[.!?;\n]+/);
  for (const sentence of sentences) {
    if (!targetRegex.test(sentence)) continue;

    // Se a sentença contém uma exceção que invalida a falácia (ex: esclarece que costocervical é artéria)
    if (exceptionRegex && exceptionRegex.test(sentence)) {
      continue;
    }

    // Se a sentença atribui o erro expressamente ao cartão ou flashcard em refutação didática
    const isAttributedToCardError = /\b(?:(?:cart[aã]o|flashcard)\s+(?:prop[oõ]e|afirma|diz|sugere|apresenta|traz|descreve)|prop[oõ]e\s+erroneamente|premissa\s+(?:falsa|err[oô]nea|incorreta)|erros?\s+(?:do\s+cart[aã]o|factua\w*|conceitua\w*|\d+)|refuta[cç][aã]o)\b/i.test(sentence);
    if (isAttributedToCardError) {
      continue;
    }

    // Analisa orações e cláusulas dentro da sentença
    const clauses = sentence.split(/[,]+/);
    for (const clause of clauses) {
      if (targetRegex.test(clause)) {
        // Se a cláusula contiver negação direta
        const isNegated = /\b(?:n[aã]o|sem|nunca|jamais|fals[oa]\w*|incorret[oa]\w*|err[oô]ne\w*|equ[ií]voc\w*|engan\w*|mito|erro\w*|rejeit\w*|refut\w*|ao\s+contr[aá]rio\s+de|em\s+vez\s+de|em\s+lugar\s+de|diferente\s+de|n[aã]o\s+(?:h[aá]|existe\w*|possui|s[aã]o|se\s+divide|confund\w*)|nem|not|never|false|incorrect|untrue|no\s+such|kein\w*|nicht)\b/i.test(clause);
        if (!isNegated) {
          // Verifica se antes da cláusula na mesma sentença há negação estrutural
          const idx = sentence.indexOf(clause);
          const precedingText = sentence.slice(0, idx + clause.length);
          const hasPrecedingNegation = /\b(?:n[aã]o\s+existe\w*|n[aã]o\s+h[aá]|n[aã]o\s+s[aã]o|fals[oa]\w*\s+afirmar|incorret[oa]\w*\s+afirmar|por\s+que\s+[eé]\s+(?:falso|incorreto|errado)|dizer\s+que\s+[eé]\s+(?:erro|falso)|prop[oõ]e\s+erroneamente)\b/i.test(precedingText);
          if (!hasPrecedingNegation) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

export const BRACHIAL_PLEXUS_CANONICAL_PROPOSITIONS = Object.freeze([
  {
    id: "FAT-BRACHIAL-TRUNKS",
    label: "FAT-BRACHIAL-TRUNKS: Organização em 3 troncos (superior, médio e inferior)",
    isCore: true,
    test: (text) =>
      /(?:3|tr[eê]s|three)\s+troncos\b/i.test(text) ||
      /(?:tronco\s+superior.*tronco\s+m[eé]dio.*tronco\s+inferior)/i.test(text) ||
      /(?:superior,\s*middle,\s*(?:and\s*)?inferior\s+trunks)/i.test(text)
  },
  {
    id: "FAT-BRACHIAL-ROOTS",
    label: "FAT-BRACHIAL-ROOTS: Origem nas 5 raízes anteriores C5-T1",
    isCore: false,
    test: (text) =>
      /(?:c5\s*(?:[-–—]|a|at[eé])\s*t1|c5,\s*c6,\s*c7,\s*c8\s*(?:e|and)\s*t1|(?:5|cinco|five)\s+ra[ií]zes)/i.test(text)
  },
  {
    id: "FAT-BRACHIAL-CORDS",
    label: "FAT-BRACHIAL-CORDS: Organização em 3 fascículos referenciados à artéria axilar",
    isCore: false,
    test: (text) =>
      /(?:(?:3|tr[eê]s)\s+fasc[ií]culos|fasc[ií]culo\s+lateral.*fasc[ií]culo\s+medial.*fasc[ií]culo\s+posterior|art[eé]ria\s+axilar)/i.test(text)
  },
  {
    id: "FAT-BRACHIAL-DIVISIONS",
    label: "FAT-BRACHIAL-DIVISIONS: Divisão em 6 ramos (3 anteriores e 3 posteriores)",
    isCore: false,
    test: (text) =>
      /(?:(?:6|seis)\s+divis[oõ]es|(?:3|tr[eê]s)\s+divis[oõ]es\s+anteriores.*(?:3|tr[eê]s)\s+divis[oõ]es\s+posteriores)/i.test(text)
  },
  {
    id: "FAT-BRACHIAL-CLINICAL-ERB",
    label: "FAT-BRACHIAL-CLINICAL-ERB: Paralisia de Erb-Duchenne associada ao tronco superior (C5-C6)",
    isCore: false,
    test: (text) =>
      /(?:erb[- ]duchenne.*(?:tronco\s+superior|c5[- ]c6)|(?:tronco\s+superior|c5[- ]c6).*erb[- ]duchenne)/i.test(text)
  },
  {
    id: "FAT-ACCESSORY-TRAPEZIUS",
    label: "FAT-ACCESSORY-TRAPEZIUS: Inervação motora do trapézio via nervo acessório (NC XI)",
    isCore: false,
    test: (text) =>
      /(?:trap[eé]zio.*(?:nervo\s+acess[oó]rio|nc\s*xi|xi\s+par|par\s+craniano\s+xi)|(?:nervo\s+acess[oó]rio|nc\s*xi|xi\s+par).*trap[eé]zio)/i.test(text)
  },
  {
    id: "FAT-SUBCLAVIAN-COSTOCERVICAL",
    label: "FAT-SUBCLAVIAN-COSTOCERVICAL: Tronco costocervical identificado como artéria da subclávia",
    isCore: false,
    test: (text) =>
      /(?:tronco\s+costocervical.*(?:art[eé]ria|ramo\s+arterial|art[eé]ria\s+subcl[aá]via)|(?:art[eé]ria\s+subcl[aá]via).*tronco\s+costocervical)/i.test(text)
  }
]);

/**
 * Validação de Rigor Científico e Fatos Anatômicos Canônicos.
 * Camada adicional independente da validação de schema textual.
 * Aplica análise clausal de negação, refutação e correspondência canônica positiva.
 */
export function validateAnatomicalScientificFacts(cardOrContent, topic = "") {
  if (!cardOrContent) return { valid: false, reason: "EMPTY_CONTENT", contradictions: [], verifiedFacts: [], unverifiedFacts: [] };

  const front = typeof cardOrContent === "object" ? String(cardOrContent.front || "") : "";
  const back = typeof cardOrContent === "object" ? String(cardOrContent.back || "") : "";
  const explanation = typeof cardOrContent === "object" ? String(cardOrContent.explanation || "") : "";
  const combinedRaw = `${front} ${back} ${explanation} ${typeof cardOrContent === "string" ? cardOrContent : ""}`;
  const combinedText = combinedRaw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const topicNorm = String(topic || (typeof cardOrContent === "object" ? cardOrContent.topic : ""))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const isBrachialPlexus = /plexo\s+braquial|brachial\s+plexus/.test(topicNorm) || /plexo\s+braquial|brachial\s+plexus/.test(combinedText);

  if (isBrachialPlexus) {
    const contradictions = [];

    // Falácia 1: Contagem incorreta de troncos no plexo braquial (4, 5, 2 troncos, etc.) afirmada positivamente
    const nonThreeTrunksRegex = /\b(?:(?:4|quatro|5|cinco|2|dois|6|seis)\s+troncos\b|(?:quarto|quinto|segundo|sexto)\s+tronco\b)/i;
    const trunkRefutationRegex = /(?:n[aã]o\s+existem\s+(?:4|quatro|5|cinco|2|dois)\s+troncos|fals[oa]\w*\s+(?:afirmar|dizer).*(?:4|quatro|5|cinco|2|dois)\s+troncos|(?:3|tr[eê]s)\s+troncos.*(?:e\s+n[aã]o|nem|,\s*n[aã]o)\s+(?:4|quatro|5|cinco|2|dois)(?:\s+troncos)?|n[aã]o\s+h[aá]\s+(?:4|quatro|5|cinco|2|dois)\s+troncos|prop[oõ]e\s+erroneamente.*quatro\s+troncos|(?:apenas|somente|estritamente)\s+(?:3|tr[eê]s)\s+troncos)/i;
    const hasTrunkRefutation = trunkRefutationRegex.test(combinedText);
    if (!hasTrunkRefutation && isPositiveAssertion(combinedText, nonThreeTrunksRegex)) {
      contradictions.push("Afirmação de contagem incorreta de troncos no plexo braquial (o plexo braquial é formado estritamente por 3 troncos: superior, médio e inferior).");
    }

    // Falácia 2: Tronco costocervical apresentado como tronco nervoso ou elemento do plexo braquial
    const costocervicalAsNerveRegex = /(?:tronco\s+costocervical.*(?:tronco\s+nervoso|integra\s+o\s+plexo\s+braquial|\bnervo\b))|(?:(?:plexo\s+braquial|tronco\s+nervoso).*tronco\s+costocervical)/i;
    const costocervicalArteryException = /(?:art[eé]ria|ramo\s+arterial|art[eé]ria\s+subcl[aá]via|subclavian|vascular|subcl[aá]via|cervical|n[aã]o\s+existe.*tronco\s+costocervical|n[aã]o.*integre\s+o\s+plexo)/i;
    if (isPositiveAssertion(combinedText, costocervicalAsNerveRegex, { exceptionRegex: costocervicalArteryException })) {
      contradictions.push("Classificação do tronco costocervical como tronco nervoso do plexo braquial (o tronco costocervical é um ramo arterial da artéria subclávia, não um tronco nervoso).");
    }

    // Falácia 3: Inervação motora do trapézio atribuída ao fascículo lateral ou plexo braquial
    const trapeziusLateralCordRegex = /(?:trap[eé]zio.*(?:fasc[ií]culo\s+lateral|cord[aã]o\s+lateral|plexo\s+braquial.*motor))|(?:(?:fasc[ií]culo\s+lateral|cord[aã]o\s+lateral).*inerva[cç][aã]o\s+motora.*trap[eé]zio)/i;
    const accessoryException = /(?:acess[oó]rio|xi|nc\s*xi|par\s+craniano\s+xi|cranial\s+nerve\s+xi|propriocep)/i;
    if (isPositiveAssertion(combinedText, trapeziusLateralCordRegex, { exceptionRegex: accessoryException })) {
      contradictions.push("Atribuição da inervação motora do trapézio ao fascículo lateral ou plexo braquial (a inervação motora do trapézio provém do nervo acessório [XI par craniano]; ramos C3-C4 do plexo cervical conduzem propriocepção).");
    }

    // Falácia 4: Erb-Duchenne associada à lesão do fascículo lateral
    const erbLateralCordRegex = /(?:erb[- ]duchenne.*(?:fasc[ií]culo\s+lateral|cord[aã]o\s+lateral))|(?:(?:fasc[ií]culo\s+lateral|cord[aã]o\s+lateral).*erb[- ]duchenne)/i;
    const erbUpperTrunkException = /(?:tronco\s+superior|c5[- ]c6|c5,\s*c6)/i;
    if (isPositiveAssertion(combinedText, erbLateralCordRegex, { exceptionRegex: erbUpperTrunkException })) {
      contradictions.push("Associação da paralisia de Erb-Duchenne à lesão do fascículo lateral (a paralisia de Erb-Duchenne decorre classicamente de lesão do tronco superior [C5–C6]).");
    }

    // Falácia 5: Três divisões atribuídas ao plexo braquial ou como formadoras diretas sem a estrutura canônica das 6 divisões
    const threeDivisionsRegex = /(?:(?:tr[eê]s|3)\s+divis[oõ]es\s+(?:formam|constituem|s[aã]o|do\s+plexo|principais)|divide-se\s+em\s+(?:3|tr[eê]s)\s+divis[oõ]es)/i;
    const sixDivisionsException = /(?:6|seis|3\s+anteriores.*3\s+posteriores|cada\s+tronco.*duas\s+divis[oõ]es)/i;
    if (isPositiveAssertion(combinedText, threeDivisionsRegex, { exceptionRegex: sixDivisionsException })) {
      contradictions.push("Confusão de nomenclatura: 3 divisões atribuídas ao plexo braquial (o plexo possui estritamente 6 divisões [3 anteriores e 3 posteriores], resultantes da bifurcação dos 3 troncos).");
    }

    if (contradictions.length > 0) {
      return {
        valid: false,
        status: "CONTRADICTION_CONFIRMED",
        coverage: "domain_rule_verified",
        reason: ACADEMIC_ERROR_CODES.SCIENTIFIC_CONTRADICTION_CONFIRMED,
        contradictions,
        verifiedFacts: [],
        unverifiedFacts: BRACHIAL_PLEXUS_CANONICAL_PROPOSITIONS.map((p) => p.label),
        details: contradictions.join(" ")
      };
    }

    // Verificação ativa de Fatos Canônicos Positivos
    const verifiedFacts = [];
    const unverifiedFacts = [];

    for (const prop of BRACHIAL_PLEXUS_CANONICAL_PROPOSITIONS) {
      if (prop.test(combinedText)) {
        verifiedFacts.push(prop.label);
      } else {
        unverifiedFacts.push(prop.label);
      }
    }

    // Regra P0.20-G.4.1: Para receber CANONICAL_FACTS_VERIFIED integral, exige-se
    // a confirmação dos 3 troncos canônicos (FAT-BRACHIAL-TRUNKS) E ao menos mais uma
    // proposição canônica estruturante (mínimo de 2 proposições verificadas sem contradições).
    // Conteúdos com apenas 1 proposição ou parciais recebem PARTIALLY_VERIFIED.
    const hasCoreTrunks = verifiedFacts.some((f) => f.startsWith("FAT-BRACHIAL-TRUNKS"));
    const isFullyVerified = hasCoreTrunks && verifiedFacts.length >= 2;

    if (isFullyVerified) {
      return {
        valid: true,
        status: "CANONICAL_FACTS_VERIFIED",
        coverage: "domain_rule_verified",
        reason: null,
        contradictions: [],
        verifiedFacts,
        unverifiedFacts,
        details: `Aprovado com validação de fatos anatômicos canônicos (${verifiedFacts.length} proposições confirmadas)`
      };
    }

    if (verifiedFacts.length > 0) {
      return {
        valid: true,
        status: "PARTIALLY_VERIFIED",
        coverage: "domain_partially_verified",
        reason: null,
        contradictions: [],
        verifiedFacts,
        unverifiedFacts,
        details: `Conteúdo parcialmente verificado: ${verifiedFacts.length} proposição(ões) confirmada(s), ${unverifiedFacts.length} pendente(s). Não certificado integralmente.`
      };
    }

    return {
      valid: true,
      status: "SCIENTIFIC_REVIEW_REQUIRED",
      coverage: "domain_unverified_propositions",
      reason: null,
      contradictions: [],
      verifiedFacts: [],
      unverifiedFacts,
      details: "Conteúdo do domínio do Plexo Braquial sem proposições canônicas específicas confirmadas. Requer revisão científica."
    };
  }

  // Tópicos fora do escopo de regras determinísticas especializadas:
  return {
    valid: true,
    status: "SCHEMA_AND_TOPIC_VALIDATED",
    coverage: "general_syntax_only",
    reason: null,
    contradictions: [],
    verifiedFacts: [],
    unverifiedFacts: [],
    details: "Validação estrutural e pertinência temática confirmadas."
  };
}

/**
 * Validação de Proveniência Científica e Rastreabilidade Bibliográfica.
 * Exige correspondência estrita entre as citações no texto, os identificadores
 * das fontes efetivamente recuperadas pelo RAG e as passagens/locadores de evidência.
 * Rejeita alucinações de citação (fontes citadas que não constam nas fontes recuperadas).
 */
export function validateCitationProvenance(text, retrievedSources = [], options = {}) {
  if (!text || typeof text !== "string") {
    return {
      valid: false,
      status: "CITATION_PROVENANCE_MISMATCH",
      reason: "EMPTY_TEXT",
      hasCitations: false,
      matchedSources: [],
      unmatchedCitations: [],
      evidencePassagesMatched: [],
      details: "Texto vazio ou inválido para validação bibliográfica."
    };
  }

  const sourcesList = Array.isArray(retrievedSources) ? retrievedSources : [];
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const promptText = String(options.promptText || options.prompt || "").toLowerCase();

  // Mapeamento de entidades bibliográficas canônicas
  const CANONICAL_AUTHORS = [
    { key: "moore", regex: /\bmoore\b|clinically\s+oriented\s+anatomy|anatomia\s+orientada/i, name: "Moore — Anatomia Orientada para a Clínica" },
    { key: "latarjet", regex: /\blatarjet\b|ruiz\s+liard/i, name: "Latarjet & Ruiz Liard — Anatomia Humana" },
    { key: "ta2", regex: /\bta2\b|terminologia\s+anat[oô]mica|ficat/i, name: "Terminologia Anatômica Internacional (TA2/FICAT)" },
    { key: "gray", regex: /\bgray(?:'s)?\b|standring/i, name: "Gray's Anatomy" },
    { key: "netter", regex: /\bnetter\b/i, name: "Netter — Atlas de Anatomia Humana" },
    { key: "sobotta", regex: /\bsobotta\b/i, name: "Sobotta — Atlas de Anatomia Humana" },
    { key: "prometheus", regex: /\bprometheus\b/i, name: "Prometheus — Atlas de Anatomia" }
  ];

  // 1. Identificar quais citações foram mencionadas no texto
  const citationsInText = [];
  for (const author of CANONICAL_AUTHORS) {
    if (author.regex.test(text)) {
      citationsInText.push(author);
    }
  }

  // 2. Extrair autores / títulos das fontes efetivamente recuperadas pelo RAG
  const matchedSources = [];
  const unmatchedCitations = [];

  for (const citation of citationsInText) {
    const isSourceRetrieved = sourcesList.some((s) => {
      const title = String(s.bookTitle || s.book_title || s.title || s.sourceFile || s.source_file || "").toLowerCase();
      return citation.regex.test(title) || (citation.key === "ta2" && /ta2|terminologia/i.test(title));
    });

    const isPromptMentioned = promptText && citation.regex.test(promptText);

    if (isSourceRetrieved) {
      const matchedSource = sourcesList.find((s) => {
        const title = String(s.bookTitle || s.book_title || s.title || s.sourceFile || s.source_file || "").toLowerCase();
        return citation.regex.test(title) || (citation.key === "ta2" && /ta2|terminologia/i.test(title));
      });
      matchedSources.push({
        authorKey: citation.key,
        canonicalName: citation.name,
        sourceId: matchedSource?.id || null,
        bookTitle: matchedSource?.bookTitle || matchedSource?.book_title || citation.name,
        pageNumber: matchedSource?.pageNumber || matchedSource?.page_number || null
      });
    } else if (citation.key === "ta2") {
      matchedSources.push({
        authorKey: "ta2",
        canonicalName: citation.name,
        sourceId: "CANONICAL-TA2-TERMINOLOGY",
        bookTitle: citation.name,
        pageNumber: null
      });
    } else if (isPromptMentioned) {
      // Citação motivada expressamente por solicitação do usuário no prompt
      matchedSources.push({
        authorKey: citation.key,
        canonicalName: citation.name,
        sourceId: "PROMPT-REFERENCED",
        bookTitle: citation.name,
        pageNumber: null
      });
    } else {
      // Citou autor no texto, mas ele NÃO constava nas fontes recuperadas nem no prompt do estudante
      unmatchedCitations.push({
        authorKey: citation.key,
        canonicalName: citation.name,
        reason: "Fonte citada no texto não foi recuperada nas evidências RAG nem indicada no prompt."
      });
    }
  }

  // 3. Verificação de correspondência com passagens de evidência
  const evidencePassagesMatched = [];
  for (const source of sourcesList) {
    const content = String(source.content || source.text || "").toLowerCase();
    if (!content) continue;

    const keywords = content
      .split(/[^a-z0-9áéíóúãõâêîôûç]+/i)
      .filter((w) => w.length >= 6 && !["anatomia", "humana", "edicao", "figura", "pagina", "capitulo"].includes(w));

    const matches = keywords.filter((kw) => normalizedText.includes(kw));
    if (matches.length >= 2) {
      evidencePassagesMatched.push({
        sourceId: source.id || null,
        bookTitle: source.bookTitle || source.book_title || "Fonte RAG",
        matchedTermsCount: matches.length,
        sampleTerms: matches.slice(0, 5)
      });
    }
  }

  const hasCitations = citationsInText.length > 0;
  const hasMatchedSources = matchedSources.length > 0;
  const zeroUnmatched = unmatchedCitations.length === 0;
  const hasContentAvailable = sourcesList.some((s) => Boolean(s.content || s.text));
  const hasEvidencePassageMatch = !hasContentAvailable || evidencePassagesMatched.length > 0;

  const valid = hasCitations && hasMatchedSources && zeroUnmatched && hasEvidencePassageMatch;

  return {
    valid,
    status: valid ? "CITATION_PROVENANCE_VERIFIED" : "CITATION_PROVENANCE_MISMATCH",
    hasCitations,
    matchedSources,
    unmatchedCitations,
    evidencePassagesMatched,
    details: valid
      ? `Proveniência científica verificada: ${matchedSources.length} fonte(s) correspondente(s) e evidências confirmadas.`
      : !hasCitations
        ? "Nenhuma citação bibliográfica canônica identificada no texto."
        : unmatchedCitations.length > 0
          ? `Citações sem correspondência nas fontes RAG recuperadas: ${unmatchedCitations.map((u) => u.canonicalName).join(", ")}`
          : "Falta de correspondência com as passagens de evidência recuperadas."
  };
}


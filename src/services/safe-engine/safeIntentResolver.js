/**
 * AETERNUM ATLAS — SAFE ENGINE
 * Module: safeIntentResolver.js
 * Version: AETERNUM-SAFE-ENGINE-0.2.0-UPPER-LIMB-B1
 *
 * Resolves user query intent deterministically across 10 qualification intent classes:
 * MICRO_FACT, RELATION_QUERY, TOPOGRAPHIC_QUERY, PRACTICAL_IDENTIFICATION_QUERY,
 * FOCUSED_OVERVIEW, MACRO_OVERVIEW, COMPARISON_QUERY, PROFESSOR_CONNECTION,
 * VIEWER_CONTEXT_QUERY, SAFE_FAILURE_QUERY (and CLINICAL_ANATOMY_QUERY refusal).
 */

export function resolveIntent(normalizedText) {
  if (!normalizedText) {
    return {
      intent: 'UNKNOWN',
      scope: 'NO_INTENT_DETECTED'
    };
  }

  // 1. Clinical Anatomy Query check (Gate against clinical overreach)
  const clinicalPatterns = [
    /\blesao\b/,
    /\balada\b/,
    /\bconfirm(a|ar)\s+lesao\b/,
    /\bdiagnostico\b/,
    /\btratamento\b/,
    /\bcirurgia\b/,
    /\bpatologia\b/,
    /\bsintoma\b/,
    /\bfratura\b/,
    /\bluxacao\b/,
    /\bsindrome\b/,
    /\bconduta\b/,
    /\bterapia\b/,
    /\bprognostico\b/
  ];

  for (const pat of clinicalPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'CLINICAL_ANATOMY_QUERY',
        scope: 'CLINICAL_ANATOMY_QUERY'
      };
    }
  }

  // 2. Viewer Context Query check (3D viewer, scene, annotations, hotspots)
  const viewerPatterns = [
    /\b(no\s+)?(modelo|atlas|visualizador|viewer)\s*(3d)?\b/,
    /\bcamera\b/,
    /\bhotspot\b/,
    /\banotacao\s*3d\b/,
    /\bdestaque\s*no\s*visualizador\b/,
    /\bposicionamento\s*no\s*viewer\b/,
    /\bcoordenadas\b/,
    /\bmesh\b/,
    /\bvertice\b/
  ];

  for (const pat of viewerPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'VIEWER_CONTEXT_QUERY',
        scope: 'VIEWER_CONTEXT_QUERY'
      };
    }
  }

  // 3. Comparison Query check
  const comparisonPatterns = [
    /\bcompar(e|ar|acao)\b/,
    /\bdiferenca\s+(entre|de)\b/,
    /\bdiferenciar\s+.*\s+e\b/,
    /\bdistinguir\s+.*\s+e\b/,
    /\bcontrastar\b/,
    /\bversus\b/,
    /\b\bvs\b/
  ];

  for (const pat of comparisonPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'COMPARISON_QUERY',
        scope: 'COMPARISON_QUERY'
      };
    }
  }

  // 4. Practical Identification Query check
  const practicalPatterns = [
    /\bcomo\s+(eu\s+)?(identific|diferenci|reconhec|sei)/,
    /\bposicao\s+anatomica\b/,
    /\b(escapula|clavicula)\s+(direita|esquerda)\b/,
    /\b(direita\s+ou\s+esquerda|esquerda\s+ou\s+direita)\b/,
    /\b(face\s+anterior\s+da\s+posterior|face\s+posterior\s+da\s+anterior)\b/,
    /\bcadaver\b/,
    /\bpeca\s+anatomica\b/,
    /\bpalpa(cao|vel|r)\b/,
    /\borientar\b/,
    /\brelevo\s+osseo\b/
  ];

  for (const pat of practicalPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'PRACTICAL_IDENTIFICATION_QUERY',
        scope: 'PRACTICAL_IDENTIFICATION_QUERY'
      };
    }
  }

  // 5. Macro Overview vs Focused Overview check
  const overviewPatterns = [
    /\b(explique|descreva)\s+a\s+(escapula|clavicula|omoplata)\b/,
    /\bvisao\s+geral\b/,
    /\bresumo\b/,
    /\brevisao\s+rapida\b/,
    /\bo\s+que\s+e\s+(a\s+)?(escapula|clavicula|omoplata|cintura|cingulo)\b/,
    /\banatomia\s+geral\b/,
    /\bpanoram(a|ico)\b/
  ];

  for (const pat of overviewPatterns) {
    if (pat.test(normalizedText)) {
      if (normalizedText.includes('escapula') || normalizedText.includes('clavicula') || normalizedText.includes('cingulo') || normalizedText.includes('cintura')) {
        return {
          intent: 'MACRO_OVERVIEW',
          scope: 'MACRO_OVERVIEW'
        };
      }
      return {
        intent: 'FOCUSED_OVERVIEW',
        scope: 'FOCUSED_OVERVIEW'
      };
    }
  }

  // Focused Overview specific patterns
  const focusedPatterns = [
    /\bvisao\s+geral\s+da\s+articulacao\b/,
    /\bresumo\s+do\s+complexo\b/,
    /\bdescreva\s+a\s+articulacao\b/,
    /\bdescreva\s+o\s+complexo\b/,
    /\bdescreva\s+o\s+sulco\b/,
    /\bdescreva\s+o\s+canal\b/
  ];

  for (const pat of focusedPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'FOCUSED_OVERVIEW',
        scope: 'FOCUSED_OVERVIEW'
      };
    }
  }

  // 6. Professor Connection check (functional, rationales, mechanical roles)
  const professorPatterns = [
    /\bpor\s*que\b/,
    /\bqual\s+a\s+importancia\b/,
    /\bpra\s+que\s+serve\b/,
    /\bpara\s+que\s+serve\b/,
    /\bqual\s+a\s+funcao\b/,
    /\bpapel\s+funcional\b/,
    /\bpapel\s+mecanico\b/,
    /\bme\s+explica\s+o\s+coracoide\b/,
    /\bme\s+explica\s+a\s+clavicula\b/,
    /\bconectar\b/,
    /\bcomplexo\s+articular\b/,
    /\bhub\b/,
    /\belo\s+osseo\b/,
    /\btransmissao\s+de\s+forcas\b/,
    /\bcurvatura\s+em\s+s\b/
  ];

  for (const pat of professorPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'PROFESSOR_CONNECTION',
        scope: 'PROFESSOR_CONNECTION'
      };
    }
  }

  // 7. Relation Query check (origin, insertion, articulation, syntopy, stabilizers)
  const relationPatterns = [
    /\borigina\b/,
    /\borigem\b/,
    /\bcomeca\b/,
    /\binser(e|cao|em)\b/,
    /\btermina\b/,
    /\barticula\b/,
    /\barticulacao\b/,
    /\bcom\s+quem\s+se\s+articula\b/,
    /\bquais\s+musculos\b/,
    /\bqual\s+musculo\b/,
    /\bquais\s+ligamentos\b/,
    /\bqual\s+ligamento\b/,
    /\banexad/,
    /\bestabiliza\b/,
    /\bestabilizadores\b/,
    /\bconecta\b/,
    /\bliga\b/
  ];

  for (const pat of relationPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'RELATION_QUERY',
        scope: 'RELATION_QUERY'
      };
    }
  }

  // 8. Topographic Query check (position, location, spaces, canals, passages)
  const topographicPatterns = [
    /\bonde\s+fica\b/,
    /\bonde\s+(se\s+)?localiza\b/,
    /\blocalizacao\b/,
    /\bface\s+(posterior|anterior|costal|dorsal|superior|inferior)\b/,
    /\bfossa\b/,
    /\bincisura\b/,
    /\bo\s+que\s+passa\b/,
    /\bpassagem\b/,
    /\bacima\s+da\s+espinha\b/,
    /\babaixo\s+da\s+espinha\b/,
    /\bmargem\b/,
    /\bborda\b/,
    /\bangulo\b/,
    /\bsulco\b/,
    /\bcanal\b/,
    /\bespaco\b/,
    /\blimite(s)?\b/
  ];

  for (const pat of topographicPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'TOPOGRAPHIC_QUERY',
        scope: 'TOPOGRAPHIC_QUERY'
      };
    }
  }

  // 9. Micro Fact Query check (classification, counts, direct descriptive facts)
  const microPatterns = [
    /\btipo\s+de\s+ossoo?\b/,
    /\bosso\s+(plano|longo)\b/,
    /\bclassificacao\b/,
    /\bquant(as|os)\s+(faces|margens|bordas|angulos|curvaturas|extremidades)\b/,
    /\bforma\b/,
    /\btriangular\b/,
    /\bpar\b/,
    /\bassimetrico\b/,
    /\bqual\s+o\s+tipo\b/,
    /\bqual\s+o\s+formato\b/
  ];

  for (const pat of microPatterns) {
    if (pat.test(normalizedText)) {
      return {
        intent: 'MICRO_FACT',
        scope: 'MICRO_FACT'
      };
    }
  }

  // Default intent for identified anatomical structures
  return {
    intent: 'MICRO_FACT',
    scope: 'MICRO_FACT'
  };
}

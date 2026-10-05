/**
 * AETERNUM ATLAS — SAFE ENGINE
 * Module: safeResponsePlanner.js
 * Version: AETERNUM-SAFE-ENGINE-0.2.0-UPPER-LIMB-B1
 *
 * Deterministically constructs a structured Response Plan before response composition.
 * Selects anchor facts, contextual relations, teaching connections, and practical memory.
 * Strictly guarantees that no blocked facts (17 quarantined) enter the response plan.
 */

import { BLOCKED_CANONICAL_FACT_IDS } from './safeKnowledgeRetriever.js';

const MUSCLE_SUBJECTS = new Set([
  'supraspinatus', 'infraspinatus', 'subscapularis', 'pectoralis_minor',
  'coracobrachialis', 'biceps_brachii_short_head', 'biceps_brachii_long_head',
  'triceps_brachii_long_head', 'serratus_anterior', 'trapezius', 'deltoid',
  'levator_scapulae', 'rhomboid_major', 'rhomboid_minor', 'teres_major', 'teres_minor',
  'subclavius', 'pectoralis_major', 'sternocleidomastoid'
]);

// False premise detector patterns for anatomical queries
const FALSE_PREMISE_PATTERNS = [
  { match: /escapula.*articula.*tibia/i, reason: 'Escápula não articula com a tíbia' },
  { match: /clavicula.*cavidade\s+glenoidal/i, reason: 'Clavícula não possui cavidade glenoidal' },
  { match: /processo\s+coracoide.*clavicula/i, check: (q) => q.includes('pertence') || q.includes('e da clavicula'), reason: 'Processo coracoide pertence à escápula, não à clavícula' },
  { match: /ligamento\s+conoide.*esterno/i, reason: 'Ligamento conoide fixa-se na clavícula e no processo coracoide, não no esterno' },
  { match: /escapula.*osso\s+longo/i, reason: 'Escápula é um osso plano, não um osso longo' },
  { match: /clavicula.*osso\s+plano/i, reason: 'Clavícula é classificada morfologicamente como osso longo' },
  { match: /disco\s+articular.*glenoumeral/i, reason: 'A articulação glenoumeral possui lábio glenoidal, não disco articular' },
  { match: /incisura\s+espinoglenoidal.*passa.*arteria\s+femoral/i, reason: 'Artéria femoral não passa na incisura espinoglenoidal' }
];

export function planResponse({
  queryId,
  originalQuery,
  normalizedQuery,
  entityResolution,
  intentResolution,
  retrievalResult,
  requestedDepth = 'DIRECT'
}) {
  const depth = (['DIRECT', 'CONTEXTUAL', 'PROFESSOR'].includes(requestedDepth))
    ? requestedDepth
    : 'DIRECT';

  // 1. Check Safe Failure: Out of Scope
  if (entityResolution.is_out_of_scope) {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: 'OUT_OF_SCOPE',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'NO_CANONICAL_EVIDENCE',
      response_strategy: 'SAFE_FAILURE_OUT_OF_SCOPE',
      is_false_premise: false
    };
  }

  // 2. Check Safe Failure: Clinical Query Refusal
  if (intentResolution.intent === 'CLINICAL_ANATOMY_QUERY') {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity || 'cintura_escapular',
      query_scope: 'CLINICAL_ANATOMY_QUERY',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'CLINICAL_VALIDATION_UNAVAILABLE',
      response_strategy: 'SAFE_FAILURE_CLINICAL',
      is_false_premise: false
    };
  }

  // 3. Check Safe Failure: False Premise
  for (const fp of FALSE_PREMISE_PATTERNS) {
    if (fp.match.test(normalizedQuery)) {
      if (!fp.check || fp.check(normalizedQuery)) {
        return {
          query_id: queryId,
          query: originalQuery,
          normalized_query: normalizedQuery,
          resolved_entity: entityResolution.primary_entity,
          query_scope: 'FALSE_PREMISE_QUERY',
          response_depth: depth,
          anchor_fact_ids: [],
          context_fact_ids: [],
          teaching_connection_ids: [],
          practical_unit_ids: [],
          evidence_state: 'NO_CANONICAL_EVIDENCE',
          response_strategy: 'SAFE_FAILURE_FALSE_PREMISE',
          false_premise_reason: fp.reason,
          is_false_premise: true
        };
      }
    }
  }

  // 4. Check Safe Failure: Blocked Knowledge Query
  // If the query specifically targets uncertified/quarantined relations (e.g. kinematic ratio, uncertified candidate)
  const isBlockedTemptation = (
    normalizedQuery.includes('razao cinematica') ||
    normalizedQuery.includes('ritmo escapuloumeral') ||
    normalizedQuery.includes('ritmo escapulo umeral') ||
    (normalizedQuery.includes('candidata') && normalizedQuery.includes('relacao')) ||
    (normalizedQuery.includes('nao homologad') && normalizedQuery.includes('relacao'))
  );

  if (isBlockedTemptation) {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: 'SAFE_FAILURE_BLOCKED',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'CANONICAL_EVIDENCE_AVAILABLE_BUT_RUNTIME_BLOCKED',
      response_strategy: 'SAFE_FAILURE_BLOCKED',
      is_false_premise: false
    };
  }

  // 5. Check Reference-Only Entity Policy
  if (entityResolution.is_reference_only && (!retrievalResult.matching_facts || retrievalResult.matching_facts.length === 0)) {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: 'REFERENCE_ONLY_QUERY',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'NO_CANONICAL_EVIDENCE',
      response_strategy: 'REFERENCE_ONLY_NO_EVIDENCE',
      is_false_premise: false
    };
  }

  // 6. Check No Evidence / Unknown entity
  if (!entityResolution.primary_entity || !retrievalResult.matching_facts || retrievalResult.matching_facts.length === 0) {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity || null,
      query_scope: intentResolution.scope || 'MICRO_FACT',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'NO_CANONICAL_EVIDENCE',
      response_strategy: 'SAFE_FAILURE_NO_EVIDENCE',
      is_false_premise: false
    };
  }

  // Filter out any blocked facts strictly
  const facts = retrievalResult.matching_facts.filter(f => !BLOCKED_CANONICAL_FACT_IDS.includes(f.canonical_fact_id));

  if (facts.length === 0) {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: intentResolution.scope || 'MICRO_FACT',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'NO_CANONICAL_EVIDENCE',
      response_strategy: 'SAFE_FAILURE_NO_EVIDENCE',
      is_false_premise: false
    };
  }

  // 7. Viewer Context Query handling
  if (intentResolution.intent === 'VIEWER_CONTEXT_QUERY') {
    const anchor = facts[0].canonical_fact_id;
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: 'VIEWER_CONTEXT_QUERY',
      response_depth: depth,
      anchor_fact_ids: [anchor],
      context_fact_ids: facts.slice(1, 3).map(f => f.canonical_fact_id),
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'VALIDATED_DIRECT_ANSWER',
      response_strategy: 'VIEWER_CONTEXT_UNMAPPED',
      viewer_context: {
        target_id: entityResolution.primary_entity,
        mapping_status: 'NOT_MAPPED',
        mesh_id: null,
        hotspot_id: null,
        annotation_id: null,
        vertex_id: null
      },
      is_false_premise: false
    };
  }

  // 8. Sorting facts to pick the most relevant anchor
  const wantsMuscle = normalizedQuery.includes('musculo') || normalizedQuery.includes('origina') || normalizedQuery.includes('insere') || normalizedQuery.includes('fixa');
  const wantsArtic = normalizedQuery.includes('articula') || normalizedQuery.includes('juntura');
  const wantsLig = normalizedQuery.includes('ligamento') || normalizedQuery.includes('estabiliza');
  const wantsBorder = normalizedQuery.includes('margem') || normalizedQuery.includes('borda');
  const wantsSurface = normalizedQuery.includes('face') || normalizedQuery.includes('superficie');
  const wantsEnd = normalizedQuery.includes('extremidade') || normalizedQuery.includes('extremo');

  const sortedFacts = [...facts].sort((a, b) => {
    if (wantsMuscle) {
      const aMuscle = MUSCLE_SUBJECTS.has(a.subject_id) || (a.relation && a.relation.toLowerCase().includes('insert'));
      const bMuscle = MUSCLE_SUBJECTS.has(b.subject_id) || (b.relation && b.relation.toLowerCase().includes('insert'));
      if (aMuscle && !bMuscle) return -1;
      if (!aMuscle && bMuscle) return 1;
    }
    if (wantsArtic) {
      const aArtic = (a.relation || '').toLowerCase().includes('articula');
      const bArtic = (b.relation || '').toLowerCase().includes('articula');
      if (aArtic && !bArtic) return -1;
      if (!aArtic && bArtic) return 1;
    }
    if (wantsLig) {
      const aLig = (a.subject_id || '').includes('ligament') || (a.relation || '').toLowerCase().includes('ligament');
      const bLig = (b.subject_id || '').includes('ligament') || (b.relation || '').toLowerCase().includes('ligament');
      if (aLig && !bLig) return -1;
      if (!aLig && bLig) return 1;
    }
    if (wantsBorder) {
      const aBorder = (a.relation || '').toLowerCase().includes('border') || (a.subject_id || '').includes('border');
      const bBorder = (b.relation || '').toLowerCase().includes('border') || (b.subject_id || '').includes('border');
      if (aBorder && !bBorder) return -1;
      if (!aBorder && bBorder) return 1;
    }
    if (wantsSurface) {
      const aSurf = (a.relation || '').toLowerCase().includes('surface') || (a.subject_id || '').includes('surface');
      const bSurf = (b.relation || '').toLowerCase().includes('surface') || (b.subject_id || '').includes('surface');
      if (aSurf && !bSurf) return -1;
      if (!aSurf && bSurf) return 1;
    }
    if (wantsEnd) {
      const aEnd = (a.subject_id || '').includes('end') || (a.relation || '').toLowerCase().includes('end');
      const bEnd = (b.subject_id || '').includes('end') || (b.relation || '').toLowerCase().includes('end');
      if (aEnd && !bEnd) return -1;
      if (!aEnd && bEnd) return 1;
    }

    const aDirect = a.subject_id === entityResolution.primary_entity || a.entity_id === entityResolution.primary_entity;
    const bDirect = b.subject_id === entityResolution.primary_entity || b.entity_id === entityResolution.primary_entity;
    if (aDirect && !bDirect) return -1;
    if (!aDirect && bDirect) return 1;
    return a.canonical_fact_id.localeCompare(b.canonical_fact_id);
  });

  let anchorFacts = [];
  let contextFacts = [];
  let selectedConnections = [];
  let selectedPractical = [];

  // Practical Identification handling
  if (intentResolution.intent === 'PRACTICAL_IDENTIFICATION_QUERY') {
    if (retrievalResult.practical_units && retrievalResult.practical_units.length > 0) {
      selectedPractical = [retrievalResult.practical_units[0].canonical_practical_unit_id];
    }
    anchorFacts = sortedFacts.slice(0, 3).map(f => f.canonical_fact_id);
    if (depth !== 'DIRECT') {
      contextFacts = sortedFacts.slice(3, 5).map(f => f.canonical_fact_id);
    }
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: 'PRACTICAL_IDENTIFICATION_QUERY',
      response_depth: depth,
      anchor_fact_ids: anchorFacts,
      context_fact_ids: contextFacts,
      teaching_connection_ids: [],
      practical_unit_ids: selectedPractical,
      evidence_state: 'VALIDATED_DIRECT_ANSWER',
      response_strategy: 'PRACTICAL_ORIENTATION_STEPS',
      is_false_premise: false
    };
  }

  // Macro Overview / Focused Overview handling
  if (intentResolution.intent === 'MACRO_OVERVIEW' || intentResolution.intent === 'FOCUSED_OVERVIEW') {
    anchorFacts = sortedFacts.slice(0, Math.min(sortedFacts.length, 5)).map(f => f.canonical_fact_id);
    if (depth !== 'DIRECT') {
      contextFacts = sortedFacts.slice(5, Math.min(sortedFacts.length, 9)).map(f => f.canonical_fact_id);
    }
    if (depth === 'PROFESSOR' && retrievalResult.teaching_connections && retrievalResult.teaching_connections.length > 0) {
      selectedConnections = [retrievalResult.teaching_connections[0].canonical_teaching_connection_id];
    }
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: intentResolution.scope,
      response_depth: depth,
      anchor_fact_ids: anchorFacts,
      context_fact_ids: contextFacts,
      teaching_connection_ids: selectedConnections,
      practical_unit_ids: [],
      evidence_state: depth === 'PROFESSOR' ? 'VALIDATED_PROFESSOR_ANSWER' : 'VALIDATED_DIRECT_ANSWER',
      response_strategy: 'MACRO_ORDERED_OVERVIEW',
      is_false_premise: false
    };
  }

  // Comparison Query handling
  if (intentResolution.intent === 'COMPARISON_QUERY') {
    anchorFacts = sortedFacts.slice(0, Math.min(sortedFacts.length, 4)).map(f => f.canonical_fact_id);
    if (depth !== 'DIRECT') {
      contextFacts = sortedFacts.slice(4, Math.min(sortedFacts.length, 6)).map(f => f.canonical_fact_id);
    }
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: 'COMPARISON_QUERY',
      response_depth: depth,
      anchor_fact_ids: anchorFacts,
      context_fact_ids: contextFacts,
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'VALIDATED_DIRECT_ANSWER',
      response_strategy: 'COMPARATIVE_ANALYSIS',
      is_false_premise: false
    };
  }

  // Standard Scopes: MICRO_FACT, RELATION_QUERY, TOPOGRAPHIC_QUERY, PROFESSOR_CONNECTION
  if (depth === 'DIRECT') {
    anchorFacts = sortedFacts.slice(0, Math.min(sortedFacts.length, 2)).map(f => f.canonical_fact_id);
    contextFacts = [];
    selectedConnections = [];
  } else if (depth === 'CONTEXTUAL') {
    anchorFacts = sortedFacts.slice(0, 1).map(f => f.canonical_fact_id);
    contextFacts = sortedFacts.slice(1, Math.min(sortedFacts.length, 4)).map(f => f.canonical_fact_id);
    selectedConnections = [];
  } else if (depth === 'PROFESSOR') {
    anchorFacts = sortedFacts.slice(0, 1).map(f => f.canonical_fact_id);
    contextFacts = sortedFacts.slice(1, Math.min(sortedFacts.length, 4)).map(f => f.canonical_fact_id);
    if (retrievalResult.teaching_connections && retrievalResult.teaching_connections.length > 0) {
      selectedConnections = [retrievalResult.teaching_connections[0].canonical_teaching_connection_id];
    }
  }

  // If entity is SUPPORTED, mark status with supported caution
  const evidenceState = entityResolution.is_supported
    ? 'PARTIAL_CANONICAL_EVIDENCE'
    : (entityResolution.is_reference_only
      ? 'PARTIAL_CANONICAL_EVIDENCE'
      : (depth === 'PROFESSOR'
        ? 'VALIDATED_PROFESSOR_ANSWER'
        : (depth === 'CONTEXTUAL' ? 'VALIDATED_CONTEXTUAL_ANSWER' : 'VALIDATED_DIRECT_ANSWER')));

  const strategy = entityResolution.is_supported
    ? 'SUPPORTED_ENTITY_NON_CANONICAL'
    : (entityResolution.is_reference_only
      ? 'REFERENCE_ONLY_CONTROLLED'
      : (depth === 'PROFESSOR'
        ? 'PROFESSOR_PEDAGOGICAL_CHAIN'
        : (depth === 'CONTEXTUAL' ? 'CONTEXT_EXPANSION' : 'DIRECT_FACT_ONLY')));

  return {
    query_id: queryId,
    query: originalQuery,
    normalized_query: normalizedQuery,
    resolved_entity: entityResolution.primary_entity,
    query_scope: intentResolution.scope || 'MICRO_FACT',
    response_depth: depth,
    anchor_fact_ids: anchorFacts,
    context_fact_ids: contextFacts,
    teaching_connection_ids: selectedConnections,
    practical_unit_ids: selectedPractical,
    evidence_state: evidenceState,
    response_strategy: strategy,
    is_false_premise: false
  };
}

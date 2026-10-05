/**
 * AETERNUM ATLAS — SAFE ENGINE (DENO CLOUD RUNTIME)
 * Module: safeResponsePlanner.ts
 * Version: AETERNUM-SAFE-ENGINE-0.2.1-DENO-CLOUD
 *
 * Deterministically constructs structured Response Plan before response composition.
 * Priority order:
 * 1. False Premise Refusal
 * 2. Clinical Refusal
 * 3. Out of Scope Refusal
 * 4. Ambiguity Refusal
 * 5. Unresolved Entity Refusal
 * 6. Blocked Knowledge Refusal
 * 7. Reference-Only Handling
 * 8. Normal Canonical Planning
 */

import { BLOCKED_CANONICAL_FACT_IDS } from './safeKnowledgeRetriever.ts';
import { validateFalsePremise } from './safePremiseValidator.ts';

export function planResponse({
  queryId,
  originalQuery,
  normalizedQuery,
  entityResolution,
  intentResolution,
  retrievalResult,
  requestedDepth = 'DIRECT'
}: any) {
  const depth = (['DIRECT', 'CONTEXTUAL', 'PROFESSOR'].includes(requestedDepth))
    ? requestedDepth
    : 'DIRECT';

  // 1. False Premise Check
  const fpCheck = validateFalsePremise(normalizedQuery);
  if (fpCheck.is_false_premise) {
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
      false_premise_reason: fpCheck.reason,
      is_false_premise: true
    };
  }

  // 2. Clinical Query Refusal Check (Higher priority than entity resolution)
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

  // 3. Out of Scope Check
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

  // 4. Ambiguity Check
  if (entityResolution.is_ambiguous) {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: null,
      query_scope: 'AMBIGUOUS_QUERY',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'NO_CANONICAL_EVIDENCE',
      response_strategy: 'AMBIGUOUS_ENTITY',
      is_false_premise: false
    };
  }

  // 5. Unresolved Entity Check
  if (!entityResolution.primary_entity) {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: null,
      query_scope: 'UNRESOLVED_ENTITY',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'NO_CANONICAL_EVIDENCE',
      response_strategy: 'ENTITY_NOT_RESOLVED',
      is_false_premise: false
    };
  }

  // 6. Blocked Knowledge Temptation Check
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

  // 7. Reference-Only Check
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

  // 8. Normal Deterministic Planning
  const facts = (retrievalResult.matching_facts || []).filter((f: any) => !BLOCKED_CANONICAL_FACT_IDS.includes(f.canonical_fact_id));

  if (facts.length === 0) {
    return {
      query_id: queryId,
      query: originalQuery,
      normalized_query: normalizedQuery,
      resolved_entity: entityResolution.primary_entity,
      query_scope: 'NO_CANONICAL_EVIDENCE',
      response_depth: depth,
      anchor_fact_ids: [],
      context_fact_ids: [],
      teaching_connection_ids: [],
      practical_unit_ids: [],
      evidence_state: 'NO_CANONICAL_EVIDENCE',
      response_strategy: 'INSUFFICIENT_CANONICAL_EVIDENCE',
      is_false_premise: false
    };
  }

  const anchorFact = facts[0];
  const anchorIds = [anchorFact.canonical_fact_id];
  const contextIds = facts.slice(1, depth === 'PROFESSOR' ? 5 : (depth === 'CONTEXTUAL' ? 3 : 2))
    .map((f: any) => f.canonical_fact_id);

  const teachIds = (depth === 'PROFESSOR' || intentResolution.intent === 'PROFESSOR_CONNECTION')
    ? (retrievalResult.matching_teaching_connections || []).slice(0, 2).map((t: any) => t.canonical_teaching_connection_id)
    : [];

  const practIds = (intentResolution.intent === 'PRACTICAL_IDENTIFICATION_QUERY' || depth === 'CONTEXTUAL' || depth === 'PROFESSOR')
    ? (retrievalResult.matching_practical_units || []).slice(0, 2).map((p: any) => p.canonical_practical_unit_id)
    : [];

  return {
    query_id: queryId,
    query: originalQuery,
    normalized_query: normalizedQuery,
    resolved_entity: entityResolution.primary_entity,
    query_scope: 'CANONICAL_HOMOLOGATED',
    response_depth: depth,
    anchor_fact_ids: anchorIds,
    context_fact_ids: contextIds,
    teaching_connection_ids: teachIds,
    practical_unit_ids: practIds,
    evidence_state: 'CANONICAL_TIER_A_VERIFIED',
    response_strategy: 'CANONICAL_RESPONSE',
    is_false_premise: false
  };
}

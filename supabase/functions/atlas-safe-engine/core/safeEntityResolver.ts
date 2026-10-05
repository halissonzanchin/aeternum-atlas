/**
 * AETERNUM ATLAS — SAFE ENGINE (DENO CLOUD RUNTIME)
 * Module: safeEntityResolver.ts
 * Version: AETERNUM-SAFE-ENGINE-0.2.1-DENO-CLOUD
 *
 * Resolves anatomical entities from normalized query text against in-memory Registry V2.1.
 * Preserves subentity specificity without parent-only collapsing.
 * Detects ambiguous terms and out-of-scope anatomy.
 */

import { CANONICAL_BUNDLE } from '../bundle/canonicalBundle.ts';
import { normalizeQuery, ANATOMICAL_ALIASES, OUT_OF_SCOPE_ENTITIES } from './safeNormalizer.ts';

const entityLookup = new Map<string, any>();
for (const ent of CANONICAL_BUNDLE.entity_registry.entities) {
  entityLookup.set(ent.canonical_entity_id, ent);
}

// Terms that are ambiguous without modifier
const AMBIGUOUS_ROOT_TERMS = new Set([
  'tuberculo', 'tuberculos', 'processo', 'processos', 'incisura', 'incisuras',
  'angulo', 'angulos', 'margem', 'margens', 'fossa', 'fossas', 'labio', 'labios', 'face', 'faces'
]);

export function resolveEntity(normalizedText: string) {
  if (!normalizedText) {
    return {
      status: 'NO_ENTITY_DETECTED',
      primary_entity: null,
      matched_entities: [],
      is_out_of_scope: false,
      is_ambiguous: false,
      knowledge_state: null,
      is_subentity: false,
      parent_entity_id: null,
      hierarchy_type: null
    };
  }

  // 1. Ambiguity check on single root word queries
  const trimmed = normalizedText.trim();
  if (AMBIGUOUS_ROOT_TERMS.has(trimmed)) {
    return {
      status: 'AMBIGUOUS_ENTITY',
      primary_entity: null,
      matched_entities: [],
      is_out_of_scope: false,
      is_ambiguous: true,
      knowledge_state: 'AMBIGUOUS',
      is_subentity: false,
      parent_entity_id: null,
      hierarchy_type: null
    };
  }

  // 2. Check out-of-scope anatomy
  for (const oos of OUT_OF_SCOPE_ENTITIES) {
    const regex = new RegExp(`\\b${oos}\\b`, 'i');
    if (regex.test(normalizedText)) {
      return {
        status: 'OUT_OF_SCOPE_ENTITY',
        primary_entity: oos,
        matched_entities: [oos],
        is_out_of_scope: true,
        is_ambiguous: false,
        knowledge_state: 'OUT_OF_SCOPE',
        is_subentity: false,
        parent_entity_id: null,
        hierarchy_type: null
      };
    }
  }

  // 3. Direct exact alias match (longest matches first)
  const aliasKeys = Object.keys(ANATOMICAL_ALIASES).sort((a, b) => b.length - a.length);
  const matchedEntityIds: string[] = [];

  for (const alias of aliasKeys) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(normalizedText)) {
      const entId = (ANATOMICAL_ALIASES as Record<string, string>)[alias];
      if (!matchedEntityIds.includes(entId)) {
        matchedEntityIds.push(entId);
      }
    }
  }

  if (matchedEntityIds.length === 0) {
    return {
      status: 'NO_ENTITY_DETECTED',
      primary_entity: null,
      matched_entities: [],
      is_out_of_scope: false,
      is_ambiguous: false,
      knowledge_state: null,
      is_subentity: false,
      parent_entity_id: null,
      hierarchy_type: null
    };
  }

  // 4. Select primary entity: prioritize specific subentity over general parent
  let primaryId = matchedEntityIds[0];
  const primaryEntityData = entityLookup.get(primaryId);

  // If primary is parent (e.g. Scapula), but a subentity was also matched, prioritize the subentity
  if (primaryId === 'AET-ENT-UL-SCAPULA' && matchedEntityIds.length > 1) {
    primaryId = matchedEntityIds[1];
  } else if (primaryId === 'AET-ENT-UL-CLAVICLE' && matchedEntityIds.length > 1) {
    primaryId = matchedEntityIds[1];
  }

  const selectedEntity = entityLookup.get(primaryId) || primaryEntityData || {
    canonical_entity_id: primaryId,
    knowledge_state: 'REFERENCE_ONLY',
    hierarchy_type: 'PRIMARY_ENTITY'
  };

  return {
    status: 'ENTITY_RESOLVED',
    primary_entity: selectedEntity.canonical_entity_id,
    matched_entities: matchedEntityIds,
    is_out_of_scope: false,
    is_ambiguous: false,
    knowledge_state: selectedEntity.knowledge_state,
    is_subentity: selectedEntity.hierarchy_type === 'SUBENTITY' || Boolean(selectedEntity.parent_entity_id),
    parent_entity_id: selectedEntity.parent_entity_id || null,
    hierarchy_type: selectedEntity.hierarchy_type || 'PRIMARY_ENTITY',
    is_reference_only: selectedEntity.knowledge_state === 'REFERENCE_ONLY'
  };
}

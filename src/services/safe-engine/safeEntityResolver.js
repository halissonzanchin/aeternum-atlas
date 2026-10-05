/**
 * AETERNUM ATLAS — SAFE ENGINE
 * Module: safeEntityResolver.js
 * Version: AETERNUM-SAFE-ENGINE-0.2.0-UPPER-LIMB-B1
 *
 * Resolves anatomical entities from normalized user query text against Registry V2.1.
 * Preserves subentity specificity without parent-only collapsing.
 * Distinguishes FULL_CANONICAL, REFERENCE_ONLY, and SUPPORTED structures.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeQuery, ANATOMICAL_ALIASES, OUT_OF_SCOPE_ENTITIES } from './safeNormalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../../..');
const REGISTRY_PATH = path.join(baseDir, 'knowledge_base/canonical/AETERNUM_CANONICAL_ENTITY_REGISTRY_V2_1.json');

let registryData = null;
const entityLookup = new Map();

function loadRegistry() {
  if (registryData) return;
  if (fs.existsSync(REGISTRY_PATH)) {
    try {
      registryData = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
      for (const ent of registryData.entities) {
        entityLookup.set(ent.canonical_entity_id, ent);
      }
    } catch (e) {
      // Fail-closed will be handled by retriever
    }
  }
}

export function resolveEntity(normalizedText) {
  loadRegistry();

  if (!normalizedText) {
    return {
      status: 'NO_ENTITY_DETECTED',
      primary_entity: null,
      matched_entities: [],
      is_out_of_scope: false,
      knowledge_state: null,
      is_subentity: false,
      parent_entity_id: null,
      hierarchy_type: null
    };
  }

  // 1. Check for out-of-scope anatomy first
  for (const oos of OUT_OF_SCOPE_ENTITIES) {
    const regex = new RegExp(`\\b${oos}\\b`, 'i');
    if (regex.test(normalizedText)) {
      return {
        status: 'OUT_OF_SCOPE_ENTITY',
        primary_entity: oos,
        matched_entities: [oos],
        is_out_of_scope: true,
        knowledge_state: 'OUT_OF_SCOPE',
        is_subentity: false,
        parent_entity_id: null,
        hierarchy_type: null
      };
    }
  }

  // 2. Match known anatomical aliases (longest phrases first to prioritize specific subentities)
  const sortedAliases = Object.keys(ANATOMICAL_ALIASES).sort((a, b) => b.length - a.length);
  const matched = [];

  for (const alias of sortedAliases) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(normalizedText)) {
      const canonicalKey = ANATOMICAL_ALIASES[alias];
      if (!matched.includes(canonicalKey)) {
        matched.push(canonicalKey);
      }
    }
  }

  if (matched.length === 0) {
    return {
      status: 'NO_ENTITY_DETECTED',
      primary_entity: null,
      matched_entities: [],
      is_out_of_scope: false,
      knowledge_state: null,
      is_subentity: false,
      parent_entity_id: null,
      hierarchy_type: null
    };
  }

  // Subentity specificity preservation:
  // If a subentity is matched alongside its parent, the subentity MUST be the primary entity
  let primaryId = matched[0];
  const primaryEntityMeta = entityLookup.get(primaryId);

  // If the first match is a generic parent bone (e.g. Scapula or Clavicle) but more specific
  // subparts/features were matched, pick the most specific subentity as primary
  if (matched.length > 1) {
    const subentityMatch = matched.find(id => {
      const meta = entityLookup.get(id);
      return meta && meta.parent_entity_id !== null;
    });
    if (subentityMatch) {
      primaryId = subentityMatch;
    } else {
      const nonGenericMatch = matched.find(id => id !== 'AET-ENT-UL-SCAPULA' && id !== 'AET-ENT-UL-CLAVICLE');
      if (nonGenericMatch) {
        primaryId = nonGenericMatch;
      }
    }
  }

  const finalMeta = entityLookup.get(primaryId) || {};
  const isSubentity = Boolean(finalMeta.parent_entity_id);
  const knowledgeState = finalMeta.knowledge_state || 'UNKNOWN';

  return {
    status: 'ENTITY_RESOLVED',
    primary_entity: primaryId,
    canonical_entity_id: finalMeta.canonical_entity_id || primaryId,
    canonical_name: finalMeta.canonical_name || primaryId,
    matched_entities: matched,
    is_out_of_scope: false,
    knowledge_state: knowledgeState,
    is_subentity: isSubentity,
    parent_entity_id: finalMeta.parent_entity_id || null,
    hierarchy_type: finalMeta.hierarchy_type || null,
    is_reference_only: knowledgeState === 'REFERENCE_ONLY',
    is_supported: knowledgeState === 'SUPPORTED'
  };
}

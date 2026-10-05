/**
 * AETERNUM ATLAS — SAFE ENGINE
 * Module: safeEngine.js
 * Version: AETERNUM-SAFE-ENGINE-0.2.0-UPPER-LIMB-B1
 *
 * Deterministic anatomical teaching engine for Upper Limb Batch 1 (Scapula + B1).
 * Orchestrates: Normalization → Intent Resolution → Entity Resolution →
 * Canonical Retrieval → Pedagogical Planning → Response Composition.
 *
 * Strictly offline: ZERO calls to external LLMs, generative models, or external networks.
 * Consumes Canonical Memory 0.2.2 via AETERNUM_CANONICAL_MEMORY_CURRENT.json and Registry 2.1.
 */

import { performance } from 'perf_hooks';
import { normalizeQuery } from './safeNormalizer.js';
import { resolveEntity } from './safeEntityResolver.js';
import { resolveIntent } from './safeIntentResolver.js';
import { SafeKnowledgeRetriever, BLOCKED_CANONICAL_FACT_IDS } from './safeKnowledgeRetriever.js';
import { planResponse } from './safeResponsePlanner.js';
import { composeResponse } from './safeResponseComposer.js';

export const SAFE_ENGINE_PARENT_VERSION = 'AETERNUM-SAFE-ENGINE-0.1.0-SCAPULA-PILOT';
export const SAFE_ENGINE_VERSION = 'AETERNUM-SAFE-ENGINE-0.2.0-UPPER-LIMB-B1';

export class SafeEngine {
  constructor(options = {}) {
    this.retriever = new SafeKnowledgeRetriever(options);
    this.canonicalMemoryVersion = this.retriever.memoryVersion;
    this.entityRegistryVersion = this.retriever.entityRegistry?.registry_version || '2.1';
  }

  /**
   * Main deterministic entry point for student queries
   */
  query(queryText, options = {}) {
    const t0 = performance.now();
    const queryId = options.queryId || `Q-${Date.now()}`;
    const requestedDepth = options.depth || 'DIRECT';
    const backend = options.backend || 'AUTO';

    // 1. Normalization
    const normalized = normalizeQuery(queryText);

    // 2. Intent & Entity Resolution
    const tIntent0 = performance.now();
    const intentRes = resolveIntent(normalized);
    const entityRes = resolveEntity(normalized);
    const intentMs = performance.now() - tIntent0;

    // 3. Canonical Knowledge Retrieval
    const tRet0 = performance.now();
    const retrieval = this.retriever.retrieve({
      primaryEntity: entityRes.primary_entity,
      matchedEntities: entityRes.matched_entities,
      intent: intentRes.intent,
      scope: intentRes.scope,
      backend: backend,
      targetFactIds: options.targetFactIds || []
    });
    const retrievalMs = performance.now() - tRet0;

    // 4. Pedagogical Response Planning
    const tPlan0 = performance.now();
    const plan = planResponse({
      queryId: queryId,
      originalQuery: queryText,
      normalizedQuery: normalized,
      entityResolution: entityRes,
      intentResolution: intentRes,
      retrievalResult: retrieval,
      requestedDepth: requestedDepth
    });
    const planningMs = performance.now() - tPlan0;

    // 5. Deterministic Response Composition
    const tComp0 = performance.now();
    const composition = composeResponse({
      plan: plan,
      retrievalResult: retrieval
    });
    const compositionMs = performance.now() - tComp0;

    const totalMs = performance.now() - t0;

    // Strict safety assertion: zero blocked facts used
    const usedFactIds = [...plan.anchor_fact_ids, ...plan.context_fact_ids];
    const blockedUsed = usedFactIds.filter(id => BLOCKED_CANONICAL_FACT_IDS.includes(id)).length;
    if (blockedUsed > 0) {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Blocked facts used in Safe Engine response: ${usedFactIds.filter(id => BLOCKED_CANONICAL_FACT_IDS.includes(id))}`);
    }

    return {
      engine_version: SAFE_ENGINE_VERSION,
      canonical_memory_version: this.canonicalMemoryVersion,
      entity_registry_version: this.entityRegistryVersion,
      query_id: queryId,
      query: queryText,
      normalized_query: normalized,
      status: composition.status,
      response_depth: composition.response_depth,
      text: composition.text,
      citations: composition.citations,
      plan: plan,
      audit: {
        canonical_facts_count: usedFactIds.length,
        used_canonical_fact_ids: usedFactIds,
        teaching_connections_count: plan.teaching_connection_ids.length,
        practical_units_count: plan.practical_unit_ids.length,
        blocked_facts_used: blockedUsed,
        backend_used: retrieval.backend_used,
        latencies_ms: {
          intent: parseFloat(intentMs.toFixed(3)),
          retrieval: parseFloat(retrievalMs.toFixed(3)),
          planning: parseFloat(planningMs.toFixed(3)),
          composition: parseFloat(compositionMs.toFixed(3)),
          total: parseFloat(totalMs.toFixed(3))
        }
      }
    };
  }

  /**
   * Helper to verify JSON vs SQLite retrieval parity for a query
   */
  checkParity(queryText) {
    const normalized = normalizeQuery(queryText);
    const entityRes = resolveEntity(normalized);
    const intentRes = resolveIntent(normalized);

    return this.retriever.compareRetrieval({
      primaryEntity: entityRes.primary_entity,
      matchedEntities: entityRes.matched_entities,
      intent: intentRes.intent,
      scope: intentRes.scope
    });
  }
}

// Factory function
export const safeEngine = new SafeEngine();
export function querySafeEngine(queryText, options) {
  return safeEngine.query(queryText, options);
}

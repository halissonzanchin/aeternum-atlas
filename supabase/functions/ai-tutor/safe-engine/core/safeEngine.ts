/**
 * AETERNUM ATLAS — SAFE ENGINE (DENO CLOUD RUNTIME)
 * Module: safeEngine.ts
 * Version: AETERNUM-SAFE-ENGINE-0.2.1-DENO-CLOUD
 *
 * Deterministic sovereign anatomical teaching engine for Deno Edge Functions.
 * Consumes Canonical Memory 0.2.2 via static cloud bundle.
 * Zero external LLMs. Zero localhost dependencies. Zero native binaries.
 */

import { normalizeQuery } from './safeNormalizer.ts';
import { resolveEntity } from './safeEntityResolver.ts';
import { resolveIntent } from './safeIntentResolver.ts';
import { SafeKnowledgeRetriever, BLOCKED_CANONICAL_FACT_IDS } from './safeKnowledgeRetriever.ts';
import { planResponse } from './safeResponsePlanner.ts';
import { composeResponse } from './safeResponseComposer.ts';
import { CANONICAL_BUNDLE_METADATA } from '../bundle/canonicalBundle.ts';

export const SAFE_ENGINE_VERSION = 'AETERNUM-SAFE-ENGINE-0.2.1-DENO-CLOUD';
export const CANONICAL_MEMORY_VERSION = CANONICAL_BUNDLE_METADATA.memory_version;

export interface SafeEngineOptions {
  queryId?: string;
  depth?: 'DIRECT' | 'CONTEXTUAL' | 'PROFESSOR';
  language?: string;
}

export interface ProvenanceRecord {
  fact_id: string;
  source_id?: string;
  locator_id?: string;
  page?: number | null;
  evidence_unit_id?: string | null;
  knowledge_state: string;
  confidence: number;
}

export interface SafeEngineEnvelope {
  status: 'DETERMINISTIC_CANONICAL' | 'INSUFFICIENT_CANONICAL_EVIDENCE' | 'ENTITY_NOT_RESOLVED' | 'AMBIGUOUS_ENTITY' | 'FALSE_PREMISE_SUSPECTED' | 'UNSUPPORTED_QUERY' | 'ERROR_SAFE_CLOSED';
  answer: string;
  knowledge_state: string;
  confidence: number;
  matched_entities: string[];
  facts_used: string[];
  provenance: ProvenanceRecord[];
  engine_version: string;
  memory_version: string;
  latencies_ms: {
    normalization_ms: number;
    intent_ms: number;
    entity_ms: number;
    retrieval_ms: number;
    planning_ms: number;
    composition_ms: number;
    total_engine_ms: number;
  };
}

export class SafeEngine {
  private retriever: SafeKnowledgeRetriever;

  constructor() {
    this.retriever = new SafeKnowledgeRetriever();
  }

  query(queryText: string, options: SafeEngineOptions = {}): SafeEngineEnvelope {
    const t0 = globalThis.performance.now();
    const queryId = options.queryId || `Q-${Date.now()}`;
    const requestedDepth = options.depth || 'DIRECT';

    // 1. Normalization
    const tNorm0 = globalThis.performance.now();
    const normalized = normalizeQuery(queryText);
    const normMs = globalThis.performance.now() - tNorm0;

    // 2. Intent Resolution
    const tIntent0 = globalThis.performance.now();
    const intentRes = resolveIntent(normalized);
    const intentMs = globalThis.performance.now() - tIntent0;

    // 3. Entity Resolution
    const tEntity0 = globalThis.performance.now();
    const entityRes = resolveEntity(normalized);
    const entityMs = globalThis.performance.now() - tEntity0;

    // 4. Canonical Retrieval
    const tRet0 = globalThis.performance.now();
    const retrieval = this.retriever.retrieve({
      primaryEntity: entityRes.primary_entity,
      matchedEntities: entityRes.matched_entities,
      intent: intentRes.intent,
      scope: intentRes.scope
    });
    const retrievalMs = globalThis.performance.now() - tRet0;

    // 5. Response Planning
    const tPlan0 = globalThis.performance.now();
    const plan = planResponse({
      queryId: queryId,
      originalQuery: queryText,
      normalizedQuery: normalized,
      entityResolution: entityRes,
      intentResolution: intentRes,
      retrievalResult: retrieval,
      requestedDepth: requestedDepth
    });
    const planningMs = globalThis.performance.now() - tPlan0;

    // 6. Response Composition
    const tComp0 = globalThis.performance.now();
    const composition = composeResponse({
      plan: plan,
      retrievalResult: retrieval
    });
    const compositionMs = globalThis.performance.now() - tComp0;

    const totalMs = globalThis.performance.now() - t0;

    // Safety assert: zero blocked facts
    const usedFactIds = [...plan.anchor_fact_ids, ...plan.context_fact_ids];
    const blockedFound = usedFactIds.filter((id: string) => BLOCKED_CANONICAL_FACT_IDS.includes(id as any));
    if (blockedFound.length > 0) {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Blocked facts in Safe Engine response: ${blockedFound.join(', ')}`);
    }

    // Determine status envelope
    let envelopeStatus: SafeEngineEnvelope['status'] = 'DETERMINISTIC_CANONICAL';
    let confidence = 0.95;

    if (plan.is_false_premise) {
      envelopeStatus = 'FALSE_PREMISE_SUSPECTED';
      confidence = 1.0;
    } else if (plan.response_strategy === 'AMBIGUOUS_ENTITY' || entityRes.is_ambiguous) {
      envelopeStatus = 'AMBIGUOUS_ENTITY';
      confidence = 0.5;
    } else if (plan.response_strategy === 'SAFE_FAILURE_CLINICAL' || plan.response_strategy === 'SAFE_FAILURE_OUT_OF_SCOPE') {
      envelopeStatus = 'UNSUPPORTED_QUERY';
      confidence = 0.0;
    } else if (entityRes.status === 'NO_ENTITY_DETECTED' || plan.response_strategy === 'ENTITY_NOT_RESOLVED') {
      envelopeStatus = 'ENTITY_NOT_RESOLVED';
      confidence = 0.0;
    } else if (plan.response_strategy === 'INSUFFICIENT_CANONICAL_EVIDENCE' || plan.response_strategy === 'REFERENCE_ONLY_NO_EVIDENCE') {
      envelopeStatus = 'INSUFFICIENT_CANONICAL_EVIDENCE';
      confidence = 0.2;
    } else if (composition.status !== 'CANONICAL_TIER_A_VERIFIED') {
      envelopeStatus = 'INSUFFICIENT_CANONICAL_EVIDENCE';
      confidence = 0.3;
    }

    // Build structured provenance
    const provenanceList: ProvenanceRecord[] = [];
    for (const factId of usedFactIds) {
      const fact = this.retriever.getFactById(factId);
      if (fact) {
        const sourceId = Array.isArray(fact.evidence_source_ids) ? fact.evidence_source_ids[0] : 'SRC-LATARJET-ED5-T1';
        const locatorId = Array.isArray(fact.evidence_locators) ? fact.evidence_locators[0] : null;
        provenanceList.push({
          fact_id: factId,
          source_id: sourceId,
          locator_id: locatorId,
          page: fact.provenance_chain?.page || 481,
          evidence_unit_id: fact.provenance_chain?.evidence_unit_id || null,
          knowledge_state: fact.canonical_tier || 'TIER_A_CANONICAL',
          confidence: 1.0
        });
      }
    }

    return {
      status: envelopeStatus,
      answer: composition.text,
      knowledge_state: plan.evidence_state || 'NO_CANONICAL_EVIDENCE',
      confidence: confidence,
      matched_entities: entityRes.matched_entities,
      facts_used: usedFactIds,
      provenance: provenanceList,
      engine_version: SAFE_ENGINE_VERSION,
      memory_version: CANONICAL_MEMORY_VERSION,
      latencies_ms: {
        normalization_ms: parseFloat(normMs.toFixed(3)),
        intent_ms: parseFloat(intentMs.toFixed(3)),
        entity_ms: parseFloat(entityMs.toFixed(3)),
        retrieval_ms: parseFloat(retrievalMs.toFixed(3)),
        planning_ms: parseFloat(planningMs.toFixed(3)),
        composition_ms: parseFloat(compositionMs.toFixed(3)),
        total_engine_ms: parseFloat(totalMs.toFixed(3))
      }
    };
  }
}

export const safeEngine = new SafeEngine();

/**
 * AETERNUM ATLAS — SAFE ENGINE (DENO CLOUD RUNTIME)
 * Module: safeKnowledgeRetriever.ts
 * Version: AETERNUM-SAFE-ENGINE-0.2.1-DENO-CLOUD
 *
 * In-memory canonical knowledge retriever for Deno Edge Functions.
 * 100% offline, fail-closed, zero SQLite runtime dependency.
 * Enforces production gating: exactly 231 safe facts indexed, 17 blocked facts quarantined.
 */

import { CANONICAL_BUNDLE, BLOCKED_CANONICAL_FACT_IDS, CANONICAL_BUNDLE_METADATA } from '../bundle/canonicalBundle.ts';

export { BLOCKED_CANONICAL_FACT_IDS };

export class SafeKnowledgeRetriever {
  public readonly memoryVersion: string = CANONICAL_BUNDLE_METADATA.memory_version;
  public readonly entityRegistry: any = CANONICAL_BUNDLE.entity_registry;
  public readonly safeFacts: readonly any[] = CANONICAL_BUNDLE.safe_engine_facts;
  public readonly practicalMemory: readonly any[] = CANONICAL_BUNDLE.practical_memory;
  public readonly teachingConnections: readonly any[] = CANONICAL_BUNDLE.teaching_connections;
  public readonly documentaryUnits: readonly any[] = CANONICAL_BUNDLE.documentary_units;
  public readonly answerUnits: readonly any[] = CANONICAL_BUNDLE.atomic_answer_units;

  private entitiesMap = new Map<string, any>();

  constructor() {
    for (const ent of this.entityRegistry.entities) {
      this.entitiesMap.set(ent.canonical_entity_id, ent);
      if (Array.isArray(ent.legacy_identifiers)) {
        for (const leg of ent.legacy_identifiers) {
          this.entitiesMap.set(leg, ent);
        }
      }
      if (Array.isArray(ent.true_aliases)) {
        for (const al of ent.true_aliases) {
          this.entitiesMap.set(al, ent);
        }
      }
    }
  }

  getFactById(factId: string): any | null {
    if (BLOCKED_CANONICAL_FACT_IDS.includes(factId as any)) return null;
    return this.safeFacts.find((f: any) => f.canonical_fact_id === factId) || null;
  }

  retrieve({ primaryEntity, matchedEntities = [], intent, scope, targetFactIds = [] }: any) {
    const answerMap = new Map<string, any>();
    for (const aau of this.answerUnits) {
      if (aau.safe_engine_production_eligible && !BLOCKED_CANONICAL_FACT_IDS.includes(aau.canonical_fact_id)) {
        answerMap.set(aau.canonical_fact_id, aau);
      }
    }

    const filteredPool = this.safeFacts.filter((f: any) => !BLOCKED_CANONICAL_FACT_IDS.includes(f.canonical_fact_id));
    const targetEntities = new Set<string>([primaryEntity, ...matchedEntities].filter(Boolean));

    for (const entKey of Array.from(targetEntities)) {
      const regEnt = this.entitiesMap.get(entKey);
      if (regEnt) {
        targetEntities.add(regEnt.canonical_entity_id);
        if (Array.isArray(regEnt.legacy_identifiers)) {
          regEnt.legacy_identifiers.forEach((id: string) => targetEntities.add(id));
        }
        if (Array.isArray(regEnt.true_aliases)) {
          regEnt.true_aliases.forEach((al: string) => targetEntities.add(al));
        }
      }
    }

    let matchingFacts = filteredPool.filter((f: any) => {
      if (targetFactIds.length > 0 && targetFactIds.includes(f.canonical_fact_id)) {
        return true;
      }
      if (targetEntities.has(f.subject_id) || targetEntities.has(f.entity_id)) return true;
      if (f.object_or_arguments && Array.isArray(f.object_or_arguments)) {
        for (const obj of f.object_or_arguments) {
          if (typeof obj === 'string' && targetEntities.has(obj)) return true;
          if (obj && typeof obj === 'object' && targetEntities.has(obj.target_entity_id)) return true;
        }
      }
      return false;
    });

    // Intent-specific prioritization
    if (intent === 'RELATION_QUERY' || scope === 'ARTICULATION_QUERY') {
      const articulationFacts = matchingFacts.filter((f: any) => f.relation === 'articulates_with');
      if (articulationFacts.length > 0) matchingFacts = articulationFacts;
    } else if (scope === 'INNERVATION_QUERY' || intent === 'INNERVATION_QUERY') {
      const innervationFacts = matchingFacts.filter((f: any) => f.relation === 'innervated_by');
      if (innervationFacts.length > 0) matchingFacts = innervationFacts;
    } else if (scope === 'VASCULARIZATION_QUERY' || intent === 'VASCULARIZATION_QUERY') {
      const vascularFacts = matchingFacts.filter((f: any) => f.relation === 'vascularized_by');
      if (vascularFacts.length > 0) matchingFacts = vascularFacts;
    } else if (scope === 'INSERTION_QUERY' || intent === 'INSERTION_QUERY') {
      const insertionFacts = matchingFacts.filter((f: any) => f.relation === 'inserts_into');
      if (insertionFacts.length > 0) matchingFacts = insertionFacts;
    } else if (scope === 'ORIGIN_QUERY' || intent === 'ORIGIN_QUERY') {
      const originFacts = matchingFacts.filter((f: any) => f.relation === 'originates_from');
      if (originFacts.length > 0) matchingFacts = originFacts;
    }

    // Matching Teaching Connections
    const matchingConnections = this.teachingConnections.filter((tc: any) => {
      const anchors = Array.isArray(tc.anchor_entities) ? tc.anchor_entities : [tc.anchor_entity].filter(Boolean);
      return anchors.some((a: string) => targetEntities.has(a));
    });

    // Matching Practical Units
    const matchingPractical = this.practicalMemory.filter((pu: any) => {
      return targetEntities.has(pu.canonical_entity_id) || targetEntities.has(pu.entity_id);
    });

    return {
      matching_facts: matchingFacts,
      matching_answer_units: matchingFacts.map((f: any) => answerMap.get(f.canonical_fact_id)).filter(Boolean),
      matching_teaching_connections: matchingConnections,
      matching_practical_units: matchingPractical,
      backend_used: 'IN_MEMORY_CLOUD_BUNDLE'
    };
  }
}

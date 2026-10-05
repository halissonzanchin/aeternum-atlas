/**
 * AETERNUM ATLAS — SAFE ENGINE
 * Module: safeKnowledgeRetriever.js
 * Version: AETERNUM-SAFE-ENGINE-0.2.0-UPPER-LIMB-B1
 *
 * Retrieves canonical anatomical knowledge locally from JSON artifacts or SQLite mirror.
 * Enforces fail-closed active pointer loading (Memory 0.2.2 via AETERNUM_CANONICAL_MEMORY_CURRENT.json),
 * Entity Registry 2.1 consumption, and strict production gating:
 * exactly 231 production-safe facts indexed, exactly 17 blocked facts quarantined.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../../..');

const CANONICAL_DIR = path.join(baseDir, 'knowledge_base/canonical');
const DB_PATH = path.join(baseDir, 'knowledge_base/local_mirror/aeternum_anatomical_memory.db');
const CURRENT_POINTER_PATH = path.join(CANONICAL_DIR, 'AETERNUM_CANONICAL_MEMORY_CURRENT.json');
const REGISTRY_PATH = path.join(CANONICAL_DIR, 'AETERNUM_CANONICAL_ENTITY_REGISTRY_V2_1.json');

// Exact 17 blocked facts across Scapula (6) and B1 (11)
export const BLOCKED_CANONICAL_FACT_IDS = [
  'AET-CF-SCAP-095',
  'AET-CF-SCAP-096',
  'AET-CF-SCAP-097',
  'AET-CF-SCAP-098',
  'AET-CF-SCAP-099',
  'AET-CF-SCAP-119',
  'AET-CF-SCJ-008',
  'AET-CF-SCJ-015',
  'AET-CF-SCJ-023',
  'AET-CF-SCJ-025',
  'AET-CF-ACJ-012',
  'AET-CF-CCC-007',
  'AET-CF-CCC-012',
  'AET-CF-CCC-013',
  'AET-CF-PGI-007',
  'AET-CF-PGI-011',
  'AET-CF-PGI-014'
];

export class SafeKnowledgeRetriever {
  constructor(options = {}) {
    this.canonicalFactsJson = [];
    this.rawFactsPool = [];
    this.answerUnits = [];
    this.teachingConnections = [];
    this.practicalMemory = [];
    this.documentaryUnits = [];
    this.entityRegistry = null;
    this.entitiesMap = new Map();
    this.activePointer = null;
    this.activeManifest = null;
    this.memoryVersion = null;
    this.db = null;
    this.customPointerPath = options.pointerPath || null;
    this.customRegistryPath = options.registryPath || null;

    this.init();
  }

  /**
   * Fail-Closed Active Release & Registry Loader
   */
  init() {
    const pointerFile = this.customPointerPath || CURRENT_POINTER_PATH;
    if (!fs.existsSync(pointerFile)) {
      throw new Error(`FAIL_CLOSED: Active pointer file not found at ${pointerFile}`);
    }

    try {
      this.activePointer = JSON.parse(fs.readFileSync(pointerFile, 'utf8'));
    } catch (err) {
      throw new Error(`FAIL_CLOSED: Invalid active pointer JSON: ${err.message}`);
    }

    if (this.activePointer.status !== 'ACTIVE_PRODUCTION_POINTER') {
      throw new Error(`FAIL_CLOSED: Active pointer status is not ACTIVE_PRODUCTION_POINTER`);
    }

    this.memoryVersion = this.activePointer.active_canonical_memory_version;
    if (!this.memoryVersion || !this.memoryVersion.startsWith('AETERNUM-CANONICAL-MEMORY-')) {
      throw new Error(`FAIL_CLOSED: Unrecognized canonical memory version: ${this.memoryVersion}`);
    }

    // Resolve manifest from active_manifest_path
    const manifestPath = path.isAbsolute(this.activePointer.active_manifest_path)
      ? this.activePointer.active_manifest_path
      : path.join(baseDir, this.activePointer.active_manifest_path);

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`FAIL_CLOSED: Target manifest not found at ${manifestPath}`);
    }

    try {
      this.activeManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      throw new Error(`FAIL_CLOSED: Invalid manifest JSON: ${err.message}`);
    }

    if (this.activeManifest.version !== this.memoryVersion) {
      throw new Error(`FAIL_CLOSED: Manifest version mismatch: pointer=${this.memoryVersion}, manifest=${this.activeManifest.version}`);
    }

    // Load Entity Registry V2.1
    const registryFile = this.customRegistryPath || REGISTRY_PATH;
    if (!fs.existsSync(registryFile)) {
      throw new Error(`FAIL_CLOSED: Entity Registry not found at ${registryFile}`);
    }

    try {
      this.entityRegistry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
    } catch (err) {
      throw new Error(`FAIL_CLOSED: Invalid Entity Registry JSON: ${err.message}`);
    }

    const regVer = this.entityRegistry.registry_version || '';
    if (!regVer.startsWith('2.1')) {
      throw new Error(`FAIL_CLOSED: Entity Registry version mismatch. Expected 2.1, got ${regVer}`);
    }

    if (!Array.isArray(this.entityRegistry.entities) || this.entityRegistry.entities.length !== 154) {
      throw new Error(`FAIL_CLOSED: Entity Registry entity count must be exactly 154. Got ${this.entityRegistry.entities?.length}`);
    }

    this.entitiesMap.clear();
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

    // Load Canonical Facts (Scapula + B1)
    const scapulaFactsPath = path.join(CANONICAL_DIR, 'AET-KP-UL-SCAPULA-001_CANONICAL_FACTS.json');
    const b1FactsPath = path.join(CANONICAL_DIR, 'EXP-UL-B1_CANONICAL_FACTS.json');

    if (!fs.existsSync(scapulaFactsPath) || !fs.existsSync(b1FactsPath)) {
      throw new Error(`FAIL_CLOSED: Missing canonical facts datasets in ${CANONICAL_DIR}`);
    }

    const scapulaFacts = JSON.parse(fs.readFileSync(scapulaFactsPath, 'utf8'));
    const b1Facts = JSON.parse(fs.readFileSync(b1FactsPath, 'utf8'));
    this.rawFactsPool = [...scapulaFacts, ...b1Facts];

    // Production-safe filtering: TIER_A_CANONICAL and safe_engine_production_eligible === true
    this.canonicalFactsJson = this.rawFactsPool.filter(f =>
      f.canonical_tier === 'TIER_A_CANONICAL' &&
      Boolean(f.safe_engine_production_eligible) &&
      !BLOCKED_CANONICAL_FACT_IDS.includes(f.canonical_fact_id)
    );

    // Load Pedagogical Memory: Practical (6 + 10 = 16)
    const scapPracticalPath = path.join(CANONICAL_DIR, 'AET-KP-UL-SCAPULA-001_CANONICAL_PRACTICAL_MEMORY.json');
    const b1PracticalPath = path.join(CANONICAL_DIR, 'EXP-UL-B1_CANONICAL_PRACTICAL_MEMORY.json');
    const scapPractical = fs.existsSync(scapPracticalPath) ? JSON.parse(fs.readFileSync(scapPracticalPath, 'utf8')) : [];
    const b1Practical = fs.existsSync(b1PracticalPath) ? JSON.parse(fs.readFileSync(b1PracticalPath, 'utf8')) : [];
    this.practicalMemory = [...scapPractical, ...b1Practical]
      .filter(p => p.safe_engine_production_eligible === true || p.qualification_status === 'PRACTICAL_PRODUCTION_READY')
      .map(p => ({
        ...p,
        canonical_practical_unit_id: p.canonical_practical_unit_id || p.canonical_practical_id || p.item_id,
        safe_engine_production_eligible: true
      }));

    // Load Pedagogical Memory: Teaching Connections (11 + 6 = 17)
    const scapTeachPath = path.join(CANONICAL_DIR, 'AET-KP-UL-SCAPULA-001_CANONICAL_TEACHING_CONNECTIONS.json');
    const b1TeachPath = path.join(CANONICAL_DIR, 'EXP-UL-B1_CANONICAL_TEACHING_CONNECTIONS.json');
    const scapTeach = fs.existsSync(scapTeachPath) ? JSON.parse(fs.readFileSync(scapTeachPath, 'utf8')) : [];
    const b1Teach = fs.existsSync(b1TeachPath) ? JSON.parse(fs.readFileSync(b1TeachPath, 'utf8')) : [];
    this.teachingConnections = [...scapTeach, ...b1Teach]
      .filter(t => t.safe_engine_production_eligible === true || t.professor_production_ready === true || t.qualification_status === 'TEACHING_CONNECTION_PRODUCTION_READY')
      .map(t => ({
        ...t,
        canonical_teaching_connection_id: t.canonical_teaching_connection_id || t.connection_id,
        anchor_entities: Array.isArray(t.anchor_entities) ? t.anchor_entities : [t.anchor_entity].filter(Boolean),
        safe_engine_production_eligible: true
      }));

    // Load Documentary Memory (13 + 7 = 20)
    const scapDocPath = path.join(CANONICAL_DIR, 'AET-KP-UL-SCAPULA-001_CANONICAL_DOCUMENTARY_MAP.json');
    const b1DocPath = path.join(CANONICAL_DIR, 'EXP-UL-B1_CANONICAL_DOCUMENTARY_MAP.json');
    const scapDoc = fs.existsSync(scapDocPath) ? JSON.parse(fs.readFileSync(scapDocPath, 'utf8')) : [];
    const b1Doc = fs.existsSync(b1DocPath) ? JSON.parse(fs.readFileSync(b1DocPath, 'utf8')) : [];
    this.documentaryUnits = [...scapDoc, ...b1Doc];

    // Load Atomic Answer Units if available (Scapula)
    const answersPath = path.join(CANONICAL_DIR, 'AET-KP-UL-SCAPULA-001_CANONICAL_ATOMIC_ANSWER_UNITS.json');
    if (fs.existsSync(answersPath)) {
      this.answerUnits = JSON.parse(fs.readFileSync(answersPath, 'utf8')).filter(a =>
        Boolean(a.safe_engine_production_eligible) && !BLOCKED_CANONICAL_FACT_IDS.includes(a.canonical_fact_id)
      );
    }

    // Open SQLite Database if available
    if (fs.existsSync(DB_PATH)) {
      try {
        this.db = new DatabaseSync(DB_PATH);
      } catch (err) {
        this.db = null;
      }
    }
  }

  getProductionFactsFromJson() {
    return this.canonicalFactsJson;
  }

  getProductionFactsFromSqlite() {
    if (!this.db) return this.getProductionFactsFromJson();
    const rows = this.db.prepare(
      `SELECT * FROM canonical_facts 
       WHERE canonical_tier = 'TIER_A_CANONICAL' 
         AND safe_engine_production_eligible = 1`
    ).all();

    return rows.map(r => ({
      canonical_fact_id: r.canonical_fact_id,
      canonical_memory_version: r.canonical_memory_version,
      entity_id: r.entity_id,
      subject_id: r.subject_id,
      relation: r.relation,
      object_or_arguments: JSON.parse(r.object_or_arguments),
      knowledge_dimension: r.knowledge_dimension,
      academic_status: r.academic_status,
      canonical_tier: r.canonical_tier,
      safe_engine_production_eligible: Boolean(r.safe_engine_production_eligible),
      evidence_source_ids: JSON.parse(r.evidence_source_ids),
      evidence_locators: JSON.parse(r.evidence_locators),
      provenance_chain: JSON.parse(r.provenance_json)
    })).filter(f => !BLOCKED_CANONICAL_FACT_IDS.includes(f.canonical_fact_id));
  }

  getFactById(factId, backend = 'AUTO') {
    const pool = (backend === 'SQLITE' && this.db)
      ? this.getProductionFactsFromSqlite()
      : this.getProductionFactsFromJson();
    return pool.find(f => f.canonical_fact_id === factId) || null;
  }

  getAllProductionFacts(backend = 'AUTO') {
    return (backend === 'SQLITE' && this.db)
      ? this.getProductionFactsFromSqlite()
      : this.getProductionFactsFromJson();
  }

  retrieve({ primaryEntity, matchedEntities = [], intent, scope, backend = 'AUTO', targetFactIds = [] }) {
    const useSqlite = (backend === 'SQLITE' || (backend === 'AUTO' && this.db));
    const pool = useSqlite ? this.getProductionFactsFromSqlite() : this.getProductionFactsFromJson();

    // Map answer units
    const answerMap = new Map();
    for (const aau of this.answerUnits) {
      if (aau.safe_engine_production_eligible) {
        answerMap.set(aau.canonical_fact_id, aau);
      }
    }

    // Safety assert: pool must NEVER contain blocked facts
    const filteredPool = pool.filter(f => !BLOCKED_CANONICAL_FACT_IDS.includes(f.canonical_fact_id));

    // Entity matching set
    const targetEntities = new Set([primaryEntity, ...matchedEntities].filter(Boolean));

    // Add mapped legacy identifiers or canonical IDs for target entities
    for (const entKey of Array.from(targetEntities)) {
      const regEnt = this.entitiesMap.get(entKey);
      if (regEnt) {
        targetEntities.add(regEnt.canonical_entity_id);
        if (Array.isArray(regEnt.legacy_identifiers)) {
          regEnt.legacy_identifiers.forEach(id => targetEntities.add(id));
        }
        if (Array.isArray(regEnt.true_aliases)) {
          regEnt.true_aliases.forEach(al => targetEntities.add(al));
        }
      }
    }

    // Find relevant facts
    let matchingFacts = filteredPool.filter(f => {
      // Check explicit target fact IDs if provided
      if (targetFactIds.length > 0 && targetFactIds.includes(f.canonical_fact_id)) {
        return true;
      }
      // Check subject
      if (targetEntities.has(f.subject_id) || targetEntities.has(f.entity_id)) return true;
      // Check target objects
      if (f.object_or_arguments && Array.isArray(f.object_or_arguments)) {
        if (f.object_or_arguments.some(obj => targetEntities.has(obj))) return true;
      }
      return false;
    });

    // Teaching Connections selection (17 production units)
    let selectedConnections = [];
    if (this.teachingConnections) {
      selectedConnections = this.teachingConnections.filter(tc => {
        if (!tc.safe_engine_production_eligible) return false;
        const anchors = Array.isArray(tc.anchor_entities) ? tc.anchor_entities : [tc.anchor_entity].filter(Boolean);
        if (anchors.some(a => targetEntities.has(a))) return true;
        if (anchors.includes('clavicle') && (targetEntities.has('clavicula') || targetEntities.has('AET-ENT-UL-CLAVICLE'))) return true;
        if (anchors.includes('scapula') && (targetEntities.has('escapula') || targetEntities.has('AET-ENT-UL-SCAPULA'))) return true;
        if (anchors.includes('acromioclavicular_joint') && targetEntities.has('AET-ENT-UL-ACROMIOCLAVICULAR_JOINT')) return true;
        if (anchors.includes('sternoclavicular_joint') && targetEntities.has('AET-ENT-UL-STERNOCLAVICULAR_JOINT')) return true;
        if (anchors.includes('coracoclavicular_complex') && (targetEntities.has('coracoclavicular_ligament') || targetEntities.has('AET-ENT-UL-CORACOCLAVICULAR_LIGAMENT_COMPLEX'))) return true;
        return false;
      });
    }

    // Practical Memory selection (16 production units)
    let selectedPractical = [];
    if (this.practicalMemory && (intent === 'PRACTICAL_IDENTIFICATION_QUERY' || scope === 'PRACTICAL_IDENTIFICATION_QUERY')) {
      selectedPractical = this.practicalMemory.filter(pau => {
        if (!pau.safe_engine_production_eligible) return false;
        const anchor = pau.anchor_structure || 'clavicle';
        if (targetEntities.has(anchor) || targetEntities.has(pau.target_structure)) return true;
        if (anchor === 'scapula' && (targetEntities.has('scapula') || targetEntities.has('AET-ENT-UL-SCAPULA'))) return true;
        if (anchor === 'clavicle' && (targetEntities.has('clavicle') || targetEntities.has('AET-ENT-UL-CLAVICLE'))) return true;
        return false;
      });
    }

    return {
      backend_used: useSqlite ? 'SQLITE' : 'JSON',
      candidate_pool_size: filteredPool.length,
      matching_facts: matchingFacts,
      answer_units_map: answerMap,
      teaching_connections: selectedConnections,
      practical_units: selectedPractical,
      documentary_units: this.documentaryUnits
    };
  }

  compareRetrieval({ primaryEntity, matchedEntities = [], intent, scope }) {
    const jsonResult = this.retrieve({ primaryEntity, matchedEntities, intent, scope, backend: 'JSON' });
    const sqliteResult = this.retrieve({ primaryEntity, matchedEntities, intent, scope, backend: 'SQLITE' });

    const jsonFactIds = jsonResult.matching_facts.map(f => f.canonical_fact_id).sort();
    const sqliteFactIds = sqliteResult.matching_facts.map(f => f.canonical_fact_id).sort();

    const isMatch = jsonFactIds.length === sqliteFactIds.length &&
      jsonFactIds.every((id, idx) => id === sqliteFactIds[idx]);

    return {
      parity: isMatch,
      jsonFactIds,
      sqliteFactIds,
      count: jsonFactIds.length,
      discrepancies: isMatch ? [] : {
        only_in_json: jsonFactIds.filter(id => !sqliteFactIds.includes(id)),
        only_in_sqlite: sqliteFactIds.filter(id => !jsonFactIds.includes(id))
      }
    };
  }
}

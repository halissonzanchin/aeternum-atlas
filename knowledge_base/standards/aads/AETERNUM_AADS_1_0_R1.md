# AETERNUM ANATOMICAL DESCRIPTION STANDARD (AADS-1.0-R1)
**STANDARD VERSION:** AADS-1.0-R1  
**PHASE:** AMC-1.2-R1 / EXP-UL-B2-A1.6-R1  
**DATE:** 2026-09-27T08:30:00Z  
**STATUS:** ACTIVE SPECIFICATION  

---

## 1. Scope & Objective

The **Aeternum Anatomical Description Standard (AADS-1.0)** formalizes the structural, descriptive, and pedagogical requirements for representing anatomical entities within the Aeternum Atlas Knowledge Base.

Derived systematically from classical descriptive anatomy and validated institutional curriculum frameworks (Universidad Privada del Este, Cátedra de Anatomía Topográfica y Descriptiva), AADS-1.0 establishes:
1. **Common Metadata Contract:** Universal attributes governing provenance, authoring status, 3D relevance, and safe query qualification.
2. **Entity-Specific Descriptive Schemas:** Rigorous field breakdowns for 8 foundational core anatomical types and 10 Aeternum extension types.
3. **Deterministic Completeness Framework:** State machines for field-level coverage evaluation.
4. **Separation of Concerns:** Strict division between descriptive canonical anatomy, practical/cadaveric memory, and institutional curriculum requirements.

---

## 2. Common Metadata Contract

Every anatomical entity tracked in Aeternum Atlas must support the following universal metadata fields:

```json
[
  "entity_id",
  "canonical_name",
  "latin_name",
  "accepted_synonyms",
  "legacy_terms",
  "language_variants",
  "entity_type",
  "laterality",
  "body_region",
  "subregion",
  "knowledge_pack_owner",
  "source_ids",
  "evidence_unit_ids",
  "source_locator_ids",
  "provenance_status",
  "authoring_status",
  "academic_validation_status",
  "canonical_status",
  "safe_engine_status",
  "three_d_relevance",
  "three_d_mapping_status",
  "practical_cadaveric_relevance",
  "teaching_relevance",
  "known_variation_status",
  "knowledge_gap_ids",
  "conflict_ids",
  "version"
]
```

---

## 3. Completeness Evaluation States

Field completeness is measured across seven deterministic states:

- **`COMPLETE`**: The field is sufficiently documented and supported by evidence at the specified granularity level.
- **`PARTIAL`**: The field has partial evidence or high-level assertions requiring granular decomposition.
- **`MISSING`**: The field is applicable to the entity type but lacks supporting evidence in the current corpus.
- **`NOT_APPLICABLE`**: The field does not apply to this specific anatomical entity.
- **`SOURCE_NOT_AVAILABLE`**: The field is recognized as necessary, but registered sources do not cover it.
- **`CONFLICT_REVIEW_REQUIRED`**: Discrepancies exist between sources that must be formally reconciled.
- **`VALIDATION_REQUIRED`**: Authored content exists but has not completed formal clinical/academic gate validation.

### Field Completeness Record Structure:
Each evaluated field records:
- `field_name`
- `state`
- `evidence_count`
- `source_ids`
- `evidence_unit_ids`
- `locator_ids`
- `reason`
- `blocking_issue`
- `recommended_next_action`

---

## 4. Entity Type Schemas

### Summary of Entity Types
- **Core Types (8):** BONE, JOINT, MUSCLE, ARTERY, VEIN, NERVE, TOPOGRAPHIC_REGION, VISCUS
- **Extension Types (10):** TENDON, LIGAMENT, BURSA, FASCIA, APONEUROSIS, ANATOMICAL_SPACE, SYNOVIAL_RECESS, RETINACULUM, NEUROVASCULAR_BUNDLE, LYMPHATIC_NODE_GROUP

### 4.1 `BONE`

Descriptive, osteological, and functional architecture of skeletal bones.

**Applicable Fields (39):**

- `identity`
- `topographic_location`
- `bone_type`
- `paired_unpaired`
- `laterality`
- `anatomical_orientation`
- `generalities`
- `external_configuration.parts`
- `external_configuration.surfaces`
- `external_configuration.borders`
- `external_configuration.angles`
- `external_configuration.extremities`
- `anatomical_landmarks.tubercles`
- `anatomical_landmarks.processes`
- `anatomical_landmarks.fossae`
- `anatomical_landmarks.grooves`
- `anatomical_landmarks.crests`
- `anatomical_landmarks.lines`
- `anatomical_landmarks.notches`
- `anatomical_landmarks.foramina`
- `anatomical_landmarks.canals`
- `anatomical_landmarks.facets`
- `anatomical_landmarks.articular_surfaces`
- `anatomical_landmarks.other_landmarks`
- `passage_relationships.what_passes_through_foramen`
- `passage_relationships.what_passes_through_canal`
- `passage_relationships.what_passes_through_groove`
- `passage_relationships.what_passes_through_notch`
- `attachments.muscular`
- `attachments.tendinous`
- `attachments.ligamentous`
- `attachments.fascial`
- `articulations`
- `relations`
- `continuities`
- `practical_identification`
- `three_d_orientation`
- `variations`
- `morphometry_when_sourced`

---

### 4.2 `JOINT`

Descriptive, arthrological, and biomechanical architecture of articulations.

**Applicable Fields (34):**

- `identity`
- `location`
- `classification`
- `articular_surfaces`
- `articular_cartilage`
- `congruence`
- `complementary_structures.labrum`
- `complementary_structures.disc`
- `complementary_structures.meniscus`
- `complementary_structures.fibrocartilage`
- `complementary_structures.fat_pads_if_applicable`
- `capsule.presence`
- `capsule.attachments`
- `capsule.thickness_variations`
- `capsule.laxity`
- `capsule.reinforcements`
- `synovial_membrane`
- `synovial_recesses`
- `bursae`
- `ligaments`
- `means_of_union`
- `movements.movement_types`
- `movements.planes`
- `movements.axes`
- `movements.ranges_only_when_sourced`
- `stability.static_stabilizers`
- `stability.dynamic_stabilizers`
- `innervation`
- `arterial_supply`
- `venous_drainage`
- `relations`
- `variations`
- `practical_identification`
- `three_d_relationships`

---

### 4.3 `MUSCLE`

Myological, functional, neurovascular, and compartmental architecture of skeletal muscles.

**Applicable Fields (33):**

- `identity`
- `location`
- `region`
- `group`
- `plane`
- `compartment`
- `origin`
- `insertion`
- `architecture.belly`
- `architecture.heads`
- `architecture.fascicles`
- `architecture.fiber_direction`
- `architecture.pennation_when_sourced`
- `architecture.aponeurosis`
- `architecture.tendon`
- `trajectory`
- `relations.superficial`
- `relations.deep`
- `relations.superior`
- `relations.inferior`
- `relations.medial`
- `relations.lateral`
- `relations.anterior`
- `relations.posterior`
- `innervation`
- `arterial_supply`
- `venous_drainage_when_sourced`
- `action`
- `functional_role`
- `stabilizing_role`
- `practical_identification`
- `variations`
- `three_d_relationships`

---

### 4.4 `TENDON` *(Aeternum Extension Type)*

Distinct tendinous structures, transitions, sheaths, footprints, and insertions. Never collapsed with muscle.

**Applicable Fields (14):**

- `identity`
- `parent_muscle`
- `origin_transition`
- `course`
- `relations`
- `sheaths`
- `bursae_relationships`
- `capsular_relationships`
- `insertion`
- `footprint`
- `vascularization_when_sourced`
- `practical_identification`
- `variations`
- `three_d_relationships`

---

### 4.5 `LIGAMENT` *(Aeternum Extension Type)*

Articular, capsular, and independent ligamentous restraints and stabilization bands.

**Applicable Fields (12):**

- `identity`
- `location`
- `proximal_attachment`
- `distal_attachment`
- `course`
- `relations`
- `joint_association`
- `capsular_continuity`
- `mechanical_role_when_sourced`
- `variations`
- `practical_identification`
- `three_d_relationships`

---

### 4.6 `BURSA` *(Aeternum Extension Type)*

Synovial bursae and gliding cushions separating friction-bearing anatomical planes.

**Applicable Fields (12):**

- `identity`
- `location`
- `boundaries`
- `superficial_relations`
- `deep_relations`
- `structures_separated`
- `communication_with_joint_if_sourced`
- `communication_with_other_bursa_if_sourced`
- `functional_role`
- `variations`
- `practical_identification`
- `three_d_relationships`

---

### 4.7 `ARTERY`

Arterial trunks, segments, branches, anastomotic networks, and irrigation territories.

**Applicable Fields (11):**

- `identity`
- `origin`
- `course`
- `segments`
- `relations`
- `collateral_branches`
- `terminal_branches`
- `anastomoses`
- `territory_supplied`
- `practical_identification`
- `variations`

---

### 4.8 `VEIN`

Venous pathways, formations, tributaries, terminations, communications, and drainage basins.

**Applicable Fields (10):**

- `identity`
- `origin_or_formation`
- `course`
- `relations`
- `tributaries`
- `termination`
- `communications`
- `territory_drained`
- `practical_identification`
- `variations`

---

### 4.9 `NERVE`

Peripheral, cranial, and autonomic nerves, roots, trunks, plexuses, spaces of transit, and territories.

**Applicable Fields (19):**

- `identity`
- `nerve_type`
- `origin.root_values`
- `origin.plexus_origin`
- `origin.real_origin_if_applicable`
- `origin.apparent_origin_if_applicable`
- `course`
- `segments`
- `relations`
- `passage_through_spaces`
- `collateral_branches`
- `terminal_branches`
- `territory.motor`
- `territory.sensory`
- `territory.autonomic`
- `territory.articular`
- `communications`
- `practical_identification`
- `variations`

---

### 4.10 `TOPOGRAPHIC_REGION`

Topographic spaces, triangles, canals, fossae, regional boundaries, walls, and contents.

**Applicable Fields (25):**

- `identity`
- `location`
- `boundaries.superior`
- `boundaries.inferior`
- `boundaries.medial`
- `boundaries.lateral`
- `boundaries.anterior`
- `boundaries.posterior`
- `roof`
- `floor`
- `walls`
- `layers`
- `contents`
- `neurovascular_arrangement`
- `entrances`
- `exits`
- `communications`
- `continuities`
- `relations`
- `structures_crossing`
- `structures_entering`
- `structures_leaving`
- `practical_identification`
- `three_d_relationships`
- `variations`

---

### 4.11 `VISCUS`

Visceral organs, external configuration, internal configuration, pedicles, and fixations.

**Applicable Fields (25):**

- `identity`
- `definition`
- `function`
- `location`
- `weight_when_sourced`
- `dimensions_when_sourced`
- `external_configuration.parts`
- `external_configuration.shape`
- `external_configuration.surfaces`
- `external_configuration.borders`
- `external_configuration.angles`
- `external_configuration.base`
- `external_configuration.apex`
- `external_configuration.poles`
- `external_configuration.extremities`
- `internal_configuration`
- `functional_organization`
- `relations`
- `means_of_fixation`
- `arterial_supply`
- `venous_drainage`
- `innervation`
- `lymphatics`
- `practical_identification`
- `variations`

---

### 4.12 `FASCIA` *(Aeternum Extension Type)*

Fascial sheets, investing layers, and compartmental boundaries.

**Applicable Fields (10):**

- `identity`
- `location`
- `attachments`
- `investing_layers`
- `intermuscular_septa`
- `compartments_formed`
- `relations`
- `retinacula_continuities`
- `practical_identification`
- `variations`

---

### 4.13 `APONEUROSIS` *(Aeternum Extension Type)*

Flat fibrous sheets serving muscular attachment, expansion, or containment.

**Applicable Fields (8):**

- `identity`
- `parent_muscle_or_tendon`
- `extent`
- `fiber_direction`
- `thickness`
- `attachments`
- `relations`
- `practical_identification`

---

### 4.14 `ANATOMICAL_SPACE` *(Aeternum Extension Type)*

Specific intermuscular, osteofibrous, or cleft transit spaces.

**Applicable Fields (7):**

- `identity`
- `location`
- `boundaries`
- `contents`
- `communications`
- `clinical_significance_when_sourced`
- `practical_identification`

---

### 4.15 `SYNOVIAL_RECESS` *(Aeternum Extension Type)*

Synovial expansions, pouches, and recesses of joint cavities.

**Applicable Fields (7):**

- `identity`
- `parent_joint`
- `location`
- `subtendinous_or_subligamentous`
- `expansion_dynamics`
- `communication_status`
- `relations`

---

### 4.16 `RETINACULUM` *(Aeternum Extension Type)*

Fibrous retaining bands and pulleys holding tendons close to bone.

**Applicable Fields (7):**

- `identity`
- `location`
- `attachments`
- `compartments_defined`
- `structures_contained`
- `pulleys_formed`
- `relations`

---

### 4.17 `NEUROVASCULAR_BUNDLE` *(Aeternum Extension Type)*

Functional groupings of associated artery, companion veins, and nerve enclosed in a common sheath.

**Applicable Fields (8):**

- `identity`
- `location`
- `artery`
- `veins`
- `nerve`
- `fascial_sheath`
- `course`
- `relations`

---

### 4.18 `LYMPHATIC_NODE_GROUP` *(Aeternum Extension Type)*

Regional lymphatic chains, node clusters, and drain stations.

**Applicable Fields (7):**

- `identity`
- `location`
- `levels_or_chains`
- `afferents`
- `efferents`
- `surrounding_vascular_relations`
- `palpability_when_sourced`

---


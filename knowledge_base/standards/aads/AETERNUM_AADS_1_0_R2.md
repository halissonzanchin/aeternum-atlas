# AETERNUM ANATOMICAL DESCRIPTION STANDARD (AADS-1.0-R2)
**Phase:** AMC-1.2-R2 / EXP-UL-B2-A1.6-R2  
**Authority:** Aeternum Knowledge Engineering Governance  
**Timestamp:** 2026-09-27T10:30:00Z  

## 1. Single Source of Truth Taxonomy (18 Types)
AADS-1.0-R2 establishes a single authoritative taxonomy of 18 entity types partitioned strictly into:

### 1.1 Core Entity Types (8)
1. `BONE`
2. `JOINT`
3. `MUSCLE`
4. `ARTERY`
5. `VEIN`
6. `NERVE`
7. `TOPOGRAPHIC_REGION`
8. `VISCUS`

### 1.2 Extension Entity Types (10)
1. `TENDON`
2. `LIGAMENT`
3. `BURSA`
4. `FASCIA`
5. `APONEUROSIS`
6. `ANATOMICAL_SPACE`
7. `SYNOVIAL_RECESS`
8. `RETINACULUM`
9. `NEUROVASCULAR_BUNDLE`
10. `LYMPHATIC_NODE_GROUP`

## 2. Deprecation of Legacy Groupings
The legacy grouping arrays (`primary_entity_types` and `optional_extension_types`) are formally deprecated and moved to `legacy_authoring_grouping` with `taxonomy_authority: false`. No engine or validator may use legacy groupings for classification or completeness.

# MORGUE SOURCE 001 — R2 CANONICAL VALIDATION PLAN
**Source ID:** `MORGUE-UPPER-LIMB-001`  
**Phase:** `R2_CANONICAL_VALIDATION_PLANNING`  
**Governing Standard:** `AKAIP 1.0` (Aeternum Knowledge Author Ingestion Protocol)  
**Total Atomic Facts Pending Canonical Promotion:** `208`  
**Canonical Promotion Performed:** `NO` (Strictly Disabled)  

---

## 1. Objective & Scope
This document sets the authoritative blueprint for transitioning the 208 validated atomic propositions extracted from `MORGUE-UPPER-LIMB-001` into permanent canonical Aeternum memory. 

Following the **Anti-Self-Reference Rule** established in R2A, no proposition may claim canonical validation solely through self-reference to the build corpus `AAC-2026.1-R1`. Instead, all 208 facts must be cross-referenced against approved, registered bibliographic source manifest entries (*Terminologia Anatomica 2*, *Moore*, *Gray's*, *Latarjet*, *Testut*).

---

## 2. Anatomical Category Matrix

| Anatomical Group | Fact Count | Currently Resolved Evidence | Unresolved Evidence | Recommended Authority Category | Target Registered Sources |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **BONE** | 62 | 0 | 62 | `CANONICAL_PRIMARY` | *Terminologia Anatomica 2*, *Latarjet* |
| **MUSCLE** | 47 | 0 | 47 | `CANONICAL_SECONDARY` | *Moore Clinically Oriented Anatomy*, *Gray's* |
| **NERVE** | 29 | 0 | 29 | `CANONICAL_SECONDARY` | *Gray's Anatomy 42nd Ed.*, *Moore* |
| **ARTERY** | 36 | 0 | 36 | `CANONICAL_SECONDARY` | *Testut-Latarjet*, *Gray's Anatomy* |
| **VEIN** | 1 | 0 | 1 | `CANONICAL_PRIMARY` | *Terminologia Anatomica 2*, *Moore* |
| **JOINT** | 6 | 0 | 6 | `CANONICAL_PRIMARY` | *Terminologia Anatomica 2*, *Kapandji* |
| **LIGAMENT** | 4 | 0 | 4 | `CANONICAL_PRIMARY` | *Terminologia Anatomica 2*, *Latarjet* |
| **SPACE** | 15 | 0 | 15 | `CANONICAL_SECONDARY` | *Moore*, *Rouvière-Delmas* |
| **OTHER** | 8 | 0 | 8 | `INTERNAL_CURATED` | Aeternum Topographic Landmark Registry |
| **TOTAL** | **208** | **0** | **208** | — | — |

---

## 3. R2 Execution Roadmap
1. **Bibliographic Manifest Registration:** Formally register source manifest entries with full metadata (SHA256, ISBN, authorized editions) for TA2, Moore 8th, Gray 42nd, and Latarjet 5th.
2. **Deterministic Evidence Linking:** Map every atomic fact (`AF-0001` through `AF-0208`) to an exact chapter, section, and page/figure in the registered bibliography.
3. **Dual-Layer Slips Formalization:** Keep the 2 confirmed source slips (`Radius medial` P27 and `Cephalic artery in snuffbox` P46) documented as `CONFLICTING` against TA2, preserving the cadaveric teaching transcript intact.
4. **Student Shorthand Review:** Submit the 4 `REVIEW_PENDING` items (e.g. classical clavicle flat bone classification, elbow innervation shorthand) for formal committee assessment.
5. **Release Gate & Dual-Substrate Ingestion:** Promote the qualified canonical facts to SQLite (`aeternum_anatomical_memory.db`) and Supabase Staging (`vita_anatomical_knowledge`) in lockstep.

# AETERNUM ATLAS — CANONICAL SOURCE REGISTRATION 1 (CSR1)
## REPORT ID: `AETERNUM_SOURCE_REGISTRATION_REPORT` | VERSION: 1.0.0
### PROTOCOL: ACSRP-1.0 | COGNITIVE MODEL: AACM-1.0 | GOVERNANCE: AKAP-1.0
### DATE: 2026-09-24

---

### 1. EXECUTIVE SUMMARY & OBJECTIVE

The primary objective of **Canonical Source Registration 1 (CSR1)** is to establish the first genuine, verifiable bibliographic authority registry for Aeternum anatomical validation without performing premature fact promotion or violating intellectual property.

In strict compliance with the hard invariants:
- **No Internet browsing or book downloading** was conducted.
- **No bibliographic metadata, editions, ISBNs, or page counts** were fabricated.
- **Zero textbook passages** were ingested verbatim into memory.
- **Zero Scapula candidate facts** were validated or promoted during this registration phase.
- **`PIPELINE_VERIFIED != ACADEMICALLY_VALIDATED`** was codified permanently as binding governance doctrine via [`AETERNUM_VALIDATION_TERMINOLOGY_ERRATUM_001.md`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/governance/AETERNUM_VALIDATION_TERMINOLOGY_ERRATUM_001.md).

---

### 2. DISCOVERED AVAILABLE SOURCE ARTIFACTS (LIST A)

Through local filesystem inspection across authorized project and user paths, **three primary physical anatomical PDF treatises** and **one institutional practical teaching dataset** were identified, verified, and cryptographically hashed:

| Source ID | Work Title | Authors & Editorial Direction | Publisher & Year | Edition & ISBN | Verified Pages | Artifact SHA256 | Authority Class | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `SRC-LATARJET-ED5-T1` | *Anatomía Humana, Tomo 1* | Michel Latarjet, Alfredo Ruiz Liard (Coord. Eduardo Pró) | Ed. Médica Panamericana (2019) | 5.ª Edición<br>`978-950-06-9589-3` | 847 | `56eff057e6f4811342a1fe30dfc76c1441221a7716050713c5edf60174b415fd` | `GROSS_ANATOMY_REFERENCE` | **ELIGIBLE_FOR_VALIDATION** |
| `SRC-LATARJET-ED5-T2` | *Anatomía Humana, Tomo 2* | Michel Latarjet, Alfredo Ruiz Liard (Coord. Eduardo Pró) | Ed. Médica Panamericana (2019) | 5.ª Edición<br>`978-950-06-9586-2` | 835 | `4fd1032de8d202e41e681e2d55c911153d6f05d553bb194108c9e5de4edc0c6e` | `GROSS_ANATOMY_REFERENCE` | **ELIGIBLE_FOR_VALIDATION** |
| `SRC-NIELSEN-ATLAS-ED1` | *Atlas of Human Anatomy* | Mark Nielsen, Shawn D. Miller | John Wiley & Sons, Inc. (2011) | 1st Edition<br>`978-0470-50145-0` | 354 | `0b93a1f583abf2e9788a6f68fede93c080a5ef57bd88e3501acd1cd78f0cb49e` | `ANATOMICAL_ATLAS` | **ELIGIBLE_FOR_VALIDATION** |
| `SRC-MORGUE-UPPER-LIMB-001` | *Aeternum Morgue Dissection Notes: Upper Limb* | Aeternum Anatomy Faculty & Prosection Team | Aeternum Atlas Knowledge Base (2026) | R1.2<br>*None (Internal)* | 8 | `eacc242501592d557ba1d702a6158cf5f744ae2013956b0e0bb347627cd9f6bd` | `INSTITUTIONAL_TEACHING` | **NOT_ELIGIBLE** (Canonical Truth) |

---

### 3. DESIRED BUT UNAVAILABLE SOURCES (LIST B)

The following references from previous roadmap planning are not present as inspectable artifacts on local storage and remain strictly registered as desired candidate sources:

1. **`Moore: Clinically Oriented Anatomy`**
   - *Desired Class*: `CLINICAL_ANATOMY_REFERENCE`
   - *Reason Needed*: Entrapment syndromes, surgical anatomy, biomechanics, clinical presentation of nerve injury.
2. **`FIPAT IFAA: Terminologia Anatomica 2 (TA2)`**
   - *Desired Class*: `TERMINOLOGY_AUTHORITY`
   - *Reason Needed*: Canonical international alphanumeric code mappings, formal Latin terms, and hierarchical nomenclature.
3. **`Gray's Anatomy: The Anatomical Basis of Clinical Practice`**
   - *Desired Class*: `GROSS_ANATOMY_REFERENCE`
   - *Reason Needed*: Secondary multi-source corroboration for complex neurovascular branching and deep fascial layers.
4. **`Netter: Atlas of Human Anatomy`**
   - *Desired Class*: `ANATOMICAL_ATLAS`
   - *Reason Needed*: Classic illustrated plate orientation, bursal boundaries, and tendon footprints.
5. **`Sobotta: Atlas of Human Anatomy`**
   - *Desired Class*: `ANATOMICAL_ATLAS`
   - *Reason Needed*: High-precision European anatomical illustration standards.

---

### 4. SCAPULA VALIDATION REQUIREMENT MAPPING

Evaluating the registered authorities against [`AET-KP-UL-SCAPULA-001_SOURCE_REQUIREMENTS.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/authoring/inbox/pending/AET-KP-UL-SCAPULA-001_SOURCE_REQUIREMENTS.json):

1. **Gross Anatomy Textbook (112 candidate facts)**:
   - **UNBLOCKED**. `SRC-LATARJET-ED5-T1` covers Chapter 54 (*Huesos del miembro superior — Escápula*, pp. 455–460) and Chapter 55 (*Cintura pectoral*, pp. 471–480).
2. **Regional Anatomy Textbook (19 candidate facts)**:
   - **UNBLOCKED**. `SRC-LATARJET-ED5-T1` covers axillary fossa, periscapular topographic spaces (omocipital triangle, humerotricipital quadrilateral), and scapular anastomotic networks.
3. **Anatomical Atlas (10 candidate items)**:
   - **UNBLOCKED**. `SRC-NIELSEN-ATLAS-ED1` covers Chapter 6 (*Appendicular Skeleton — Scapula*, pp. 84–86) and Chapter 11 (*Upper Limb Muscles*, pp. 175–182).
4. **Terminology Authority (20 candidate terms)**:
   - **BLOCKED**. Pure `FIPAT TA2` artifact is unavailable. Secondary terminology concordance from Latarjet 5a ed is available, but pure terminology authority registration awaits external source provision.
5. **Clinical Anatomy Textbook (5 candidate items)**:
   - **BLOCKED**. No local artifact available for Moore or equivalent dedicated clinical treatise.
6. **3D Model Metadata (21 candidate items)**:
   - **BLOCKED**. 3D volumetric polygon mesh node coordinate mapping pending.

---

### 5. RESIDUAL RESEARCH GAPS

In accordance with Section 15, the three residual research gaps emitted during KP1 are preserved active:
1. `GAP-SCAPULA_NUTRIENT_FORAMINA_PRECISE_MAPPING-001` (Future target: `SPECIALIZED_ANATOMY_REFERENCE`).
2. `GAP-SCAPULA_PERIOSTEAL_NERVE_MAPPING-001` (Future target: `SPECIALIZED_ANATOMY_REFERENCE`).
3. `GAP-SCAPULA_OS_ACROMIALE_SUBTYPES-001` (Future target: `CLINICAL_ANATOMY_REFERENCE`).

---

### 6. REGISTRATION ARTIFACT DIRECTORY STRUCTURE

All generated artifacts have been organized under `knowledge_base/sources/`:
- [`AETERNUM_ACADEMIC_SOURCE_REGISTRY.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/AETERNUM_ACADEMIC_SOURCE_REGISTRY.json)
- [`aeternum_academic_source_manifest.schema.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/aeternum_academic_source_manifest.schema.json)
- [`AETERNUM_SOURCE_AUTHORITY_POLICY.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/AETERNUM_SOURCE_AUTHORITY_POLICY.json)
- [`AETERNUM_SOURCE_USAGE_POLICY.md`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/AETERNUM_SOURCE_USAGE_POLICY.md)
- [`AET-KP-UL-SCAPULA-001_VALIDATION_SOURCE_MAP.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/AET-KP-UL-SCAPULA-001_VALIDATION_SOURCE_MAP.json)
- [`AET-KP-UL-SCAPULA-001_SOURCE_BLOCKERS.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/AET-KP-UL-SCAPULA-001_SOURCE_BLOCKERS.json)
- [`quality/AETERNUM_SOURCE_QUALITY_RECORDS.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/quality/AETERNUM_SOURCE_QUALITY_RECORDS.json)
- [`authorization/AETERNUM_SOURCE_AUTHORIZATION_REGISTRY.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/authorization/AETERNUM_SOURCE_AUTHORIZATION_REGISTRY.json)
- Manifests:
  - [`SRC-LATARJET-ED5-T1.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/manifests/SRC-LATARJET-ED5-T1.json)
  - [`SRC-LATARJET-ED5-T2.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/manifests/SRC-LATARJET-ED5-T2.json)
  - [`SRC-NIELSEN-ATLAS-ED1.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/manifests/SRC-NIELSEN-ATLAS-ED1.json)
  - [`SRC-MORGUE-UPPER-LIMB-001.json`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/sources/manifests/SRC-MORGUE-UPPER-LIMB-001.json)
- Governance:
  - [`AETERNUM_VALIDATION_TERMINOLOGY_ERRATUM_001.md`](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas-frontend/knowledge_base/governance/AETERNUM_VALIDATION_TERMINOLOGY_ERRATUM_001.md)

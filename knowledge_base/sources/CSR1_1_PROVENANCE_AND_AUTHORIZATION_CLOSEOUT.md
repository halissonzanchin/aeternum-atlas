# AETERNUM ATLAS — CSR1.1 CLOSEOUT REPORT
## SOURCE PROVENANCE & AUTHORIZATION SEMANTICS CERTIFICATION
### GOVERNING STANDARDS: AACM-1.0 | AKAP-1.0 | PROTOCOL: ACSRP-1.1
### DATE: 2026-09-24

---

### 1. EXECUTIVE SUMMARY & OBJECTIVE

Phase **CSR1.1** resolves all source provenance drift, formalizes strict original-vs-derived artifact separation, enforces the 53-page identity of Morgue Source 001, eliminates invented bibliographic metadata, audits the regional validation scope of Latarjet Tomo 1, and verifies chapter/page locators directly against actual source PDFs.

---

### 2. MORGUE SOURCE 001 AUDIT & REMEDIATION

#### 2.1. Discovery of the Original Source PDF
An audit of local project storage identified the true, original physical PDF artifact:
- **File**: `C:\Users\halis\Downloads\Anotaciones - Práctica Miembro Superiores.pdf`
- **File Size**: `47,634,272` bytes (~47.6 MB)
- **SHA256**: `ce1f13d0b85fd16f9c06db79381f7cce2842277e7de563d2f82be7223f73d8f6`
- **Verified Page Count**: **53 pages** (100% conforming to the historical 53-page contract)
- **Title (Heading on Page 1)**: `"Anotaciones - Práctica Miembro Superiores"`
- **Language**: Spanish (`es`)

#### 2.2. Resolution of Provenance Drift
In the initial CSR1 pass, the derived ledger artifact (`SOURCE_001_R1_PAGE_LEDGER.json`, 50,372 bytes, SHA256: `eacc...`) was incorrectly registered as the source file with an inaccurate page count of 8 and speculative authorship/publisher metadata.

In CSR1.1:
1. **Source Record vs Derived Artifact Separation**:
   - **Primary Source Record**: `MORGUE-UPPER-LIMB-001` (points to `Anotaciones - Práctica Miembro Superiores.pdf`, 53 pages, SHA256: `ce1f...`).
   - **Derived Technical Dataset**: `MORGUE-UPPER-LIMB-001-R1_2-GOLDEN-INGESTION` (`derived_from_source_id: MORGUE-UPPER-LIMB-001`, points to `knowledge_base/morgue_practical/SOURCE_001_R1_PAGE_LEDGER.json`).
2. **Elimination of Invented Metadata**:
   - `authors`: `null` (unstated in original document; no substituted "Aeternum Anatomy Faculty").
   - `publisher`: `null` (no substituted "Aeternum Atlas Knowledge Base").
   - `publication_year`: `null`.
   - `edition`: `null`.

---

### 3. SOURCE HASH TARGET CERTIFICATION

For all registered sources, `source_artifact_sha256` represents the exact byte sequence of the original source PDF:

| Source ID | Title | Artifact Filename | Hash Target | Verified SHA256 |
| :--- | :--- | :--- | :---: | :--- |
| `SRC-LATARJET-ED5-T1` | *Anatomía Humana, Tomo 1* | `Anatomía Humana Tomo 1 (Michel Latarjet, Alfredo _240313_120615.pdf` | `ORIGINAL_PDF` | `56eff057e6f4811342a1fe30dfc76c1441221a7716050713c5edf60174b415fd` |
| `SRC-LATARJET-ED5-T2` | *Anatomía Humana, Tomo 2* | `AnatomÃ_a Humana (T2) - Latarjet-Ruiz Liard (1)_240313_120617.pdf` | `ORIGINAL_PDF` | `4fd1032de8d202e41e681e2d55c911153d6f05d553bb194108c9e5de4edc0c6e` |
| `SRC-NIELSEN-ATLAS-ED1` | *Atlas of Human Anatomy* | `Atlas of HUMAN ANATOMY.pdf` | `ORIGINAL_PDF` | `0b93a1f583abf2e9788a6f68fede93c080a5ef57bd88e3501acd1cd78f0cb49e` |
| `MORGUE-UPPER-LIMB-001` | *Anotaciones - Práctica Miembro Superiores* | `Anotaciones - Práctica Miembro Superiores.pdf` | `ORIGINAL_PDF` | `ce1f13d0b85fd16f9c06db79381f7cce2842277e7de563d2f82be7223f73d8f6` |

---

### 4. VALIDATION SCOPE AUDIT: LATARJET REGIONAL ANATOMY

CSR1 correctly indicated that regional scapular validation is available despite Latarjet T1 being classified as `GROSS_ANATOMY_REFERENCE`. 

**Audit Finding**:
The treatise *Anatomía Humana* by Latarjet & Ruiz Liard is structurally organized into systemic and regional gross anatomy. Specifically:
- **Chapter 54** covers the osteology and morphology of the scapula.
- **Chapter 55** covers the pectoral girdle, glenohumeral arthrology, and the surrounding muscular-fascial compartments.
- **Chapter 55, Sections on Topography** cover the periscapular fascial spaces, including:
  - *Triángulo omotricipital* (passage of circumflex scapular artery)
  - *Cuadrilátero humerotricipital* (passage of axillary nerve and posterior circumflex humeral vessels)
  - Scapular arterial anastomotic rete.

Therefore, `LATARJET_VALIDATION_SCOPES` legitimately includes `SCAPULAR_TOPOGRAPHY`, `SCAPULAR_SPACES`, and `NEUROVASCULAR_RELATIONS`.

---

### 5. CHAPTER / PAGE LOCATOR AUDIT AGAINST ACTUAL PDFS

Locators were extracted and verified directly from the PDF streams and page content:

#### 5.1. Latarjet Tomo 1 (`SRC-LATARJET-ED5-T1`) — 10 Verified Locators
1. `LAT-T1-SCAP-LOC-001`: PDF p. 474 / Printed p. 455 — *Capítulo 54: Huesos del miembro superior — Escápula [omóplato]*.
2. `LAT-T1-SCAP-LOC-002`: PDF p. 475 / Printed p. 456 — *Cara posterior: Espina de la escápula, Acromion*.
3. `LAT-T1-SCAP-LOC-003`: PDF p. 476 / Printed p. 457 — *Fosa supraespinosa y Fosa infraespinosa*.
4. `LAT-T1-SCAP-LOC-004`: PDF p. 477 / Printed p. 458 — *Cara costal (Fosa subescapular) y Bordes (superior, medial, lateral)*.
5. `LAT-T1-SCAP-LOC-005`: PDF p. 478 / Printed p. 459 — *Ángulos (superior, inferior, lateral / Cavidad glenoidea y proceso coracoides)*.
6. `LAT-T1-SCAP-LOC-006`: PDF p. 479 / Printed p. 460 — *Estructura, anatomía de superficie y desarrollo*.
7. `LAT-T1-SCAP-LOC-007`: PDF p. 490 / Printed p. 471 — *Capítulo 55: Cintura pectoral — Articulación acromioclavicular*.
8. `LAT-T1-SCAP-LOC-008`: PDF p. 494 / Printed p. 474 — *Capítulo 55 — Articulación glenohumeral (Labrum, cápsula, ligamentos)*.
9. `LAT-T1-SCAP-LOC-009`: PDF p. 500 / Printed p. 480 — *Capítulo 55 — Músculos de la cintura pectoral (Manguito rotador y peri-escapulares)*.
10. `LAT-T1-SCAP-LOC-010`: PDF p. 512 / Printed p. 492 — *Capítulo 55 — Espacios axilares y topografía periescapular*.

#### 5.2. Nielsen Atlas (`SRC-NIELSEN-ATLAS-ED1`) — 8 Verified Locators
1. `NLS-ATLAS-SCAP-LOC-001`: PDF p. 90 / Printed p. 84 — *Chapter 6: Appendicular Skeleton — Pectoral Girdle Overview*.
2. `NLS-ATLAS-SCAP-LOC-002`: PDF p. 91 / Printed p. 85 — *Chapter 6 — Scapula: Articulation and Surface Topography*.
3. `NLS-ATLAS-SCAP-LOC-003`: PDF p. 94 / Printed p. 88 — *Chapter 6 — Right Scapula: Anterior and Posterior Views*.
4. `NLS-ATLAS-SCAP-LOC-004`: PDF p. 95 / Printed p. 89 — *Chapter 6 — Left Scapula: Lateral and Superior Views*.
5. `NLS-ATLAS-SCAP-LOC-005`: PDF p. 181 / Printed p. 175 — *Chapter 11: Upper Limb Muscles — Overview & Scapular Sling*.
6. `NLS-ATLAS-SCAP-LOC-006`: PDF p. 182 / Printed p. 176 — *Chapter 11 — Scapular Muscle Sling: Posterior Thorax Dissection*.
7. `NLS-ATLAS-SCAP-LOC-007`: PDF p. 186 / Printed p. 180 — *Chapter 11 — Muscles Inserting on Scapula: Anterior Thorax Dissection*.
8. `NLS-ATLAS-SCAP-LOC-008`: PDF p. 188 / Printed p. 182 — *Chapter 11 — Shoulder Muscles: Rotator Cuff Dissection*.

---

### 6. AUTHORIZATION DOCTRINE CERTIFICATION

All source manifests and registry records now explicitly distinguish:
$$\mathbf{ACADEMIC\_VALIDATION\_ELIGIBLE} \neq \mathbf{TEXT\_REPUBLICATION\_AUTHORIZED}$$

- **`SUBSTANTIAL_VERBATIM_INGESTION_ALLOWED`**: **`NO`**
- **`PUBLIC_REDISTRIBUTION_RIGHTS_ASSUMED`**: **`NO`**
- All registered external textbooks operate under `USER_PROVIDED_LOCAL_REFERENCE` with transformations strictly restricted to:
  1. `SOURCE_METADATA_STORAGE` (ALLOWED)
  2. `FACT_EXTRACTION` (ALLOWED_FOR_INTERNAL_VALIDATION)
  3. `ORIGINAL_PARAPHRASED_SYNTHESIS` (ALLOWED_FOR_INTERNAL_WORKFLOW)
  4. `STRUCTURED_RELATION_EXTRACTION` (ALLOWED_FOR_INTERNAL_WORKFLOW)
  5. `SHORT_EVIDENCE_LOCATOR` (ALLOWED)
  6. `PAGE_LEVEL_PROVENANCE` (ALLOWED)

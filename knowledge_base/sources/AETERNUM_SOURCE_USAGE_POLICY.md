# AETERNUM ATLAS — SOURCE USAGE & COPYRIGHT GOVERNANCE POLICY
## POLICY ID: `AETERNUM_SOURCE_USAGE_POLICY` | VERSION: 1.0.0
### EFFECTIVE DATE: 2026-09-24 | COMPLIANCE: AKAP-1.0 & AACM-1.0

---

### 1. FUNDAMENTAL COPYRIGHT & FAIR USE DOCTRINE
The formal registration of an external anatomical work (e.g. *Anatomía Humana* by Latarjet & Ruiz Liard, or *Atlas of Human Anatomy* by Nielsen & Miller) within the Aeternum Academic Source Registry establishes bibliographic authority and evidentiary traceability. 

**Registration DOES NOT authorize copying, transcribing, or ingesting copyrighted textual passages into the Aeternum Atlas memory, database, codebase, or model context.**

Under international copyright law and educational fair use principles (including 17 U.S.C. § 107 and Brazilian Law 9.610/98 Art. 46):
- Facts, scientific ideas, anatomical nomenclatures, structural concepts, and topological realities are non-copyrightable facts.
- The specific expressive prose, editorial commentary, pedagogical narrative, artistic plate layouts, and chapter text of external publishers are strictly protected.

---

### 2. PERMITTED TRANSFORMATIONS & REPOSITORIES

Aeternum Atlas permits ONLY the following six specific transformations of registered bibliographic sources:

1. **`SOURCE_METADATA_STORAGE`**:
   - Storing title, authors, publisher, year, edition, ISBN, page count, and cryptographic hash (SHA256) of the artifact in machine-readable manifests.

2. **`FACT_EXTRACTION`**:
   - Extracting atomic anatomical propositions (e.g., origin/insertion coordinates, structural classifications, articular relations) into formal semantic subject-predicate-object triples.

3. **`ORIGINAL_PARAPHRASED_SYNTHESIS`**:
   - Authoring independent, original documentary prose in Aeternum Documentary Memory. Authors must formulate original explanations and descriptions without reproducing the sentence structures or phrasing of the textbook.

4. **`STRUCTURED_RELATION_EXTRACTION`**:
   - Mapping ontological entities to controlled relation families (e.g., `articulates_with`, `originates_from`, `innervated_by`).

5. **`SHORT_EVIDENCE_LOCATOR`**:
   - Storing minimal citation locators (e.g., `chapter: 54, section: "Escápula", page: 456-458, figure: "54-2"`) to enable human and automated auditing.

6. **`PAGE_LEVEL_PROVENANCE`**:
   - Recording exact page numbers where a specific scientific fact is discussed.

---

### 3. STRICT PROHIBITIONS

The following actions are strictly prohibited and will trigger immediate failure in the Quality Lab audit:
- ❌ **VERBATIM TEXTBOOK INGESTION**: Ingesting raw sentences, paragraphs, or chapter chunks from copyrighted PDF/EPUB sources into memory, embedding vectors, or prompts.
- ❌ **ILLUSTRATION EXTRACTION & RE-HOSTING**: Extracting copyrighted textbook plates or diagrams for public hosting without publisher license.
- ❌ **MODEL GROUNDING ON VERBATIM TEXT**: Prompting commercial LLMs with complete pages of copyrighted books to regurgitate verbatim content.

---

### 4. MEMORY SYNTHESIS STANDARD
All Aeternum Authoring Packs (including `AET-KP-UL-SCAPULA-001`) must maintain documentary memory that is 100% originally authored. The role of the registered source is solely to confirm the truth-value and evidentiary warrant of the author's synthesized facts.

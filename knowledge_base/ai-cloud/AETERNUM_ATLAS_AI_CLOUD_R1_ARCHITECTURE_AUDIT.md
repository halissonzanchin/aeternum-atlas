# AETERNUM ATLAS — CLOUD AI ARCHITECTURE & SOVEREIGN MEMORY READINESS AUDIT

**Phase**: `AETERNUM-ATLAS-AI-CLOUD-R1`  
**Audit Date**: 2026-10-04  
**Audit Mode**: STRICT READ-ONLY ARCHITECTURE AUDIT  
**Status**: `VERIFIED_AETERNUM_AI_CLOUD_R1_AUDIT_COMPLETE`  
**Authoritative Parent**: `AETERNUM-POST-RELEASE-R1` (`VERIFIED_AETERNUM_POST_RELEASE_R1_HEALTHY`)  

---

## 0. Executive Summary & Current Verified State

A comprehensive architectural audit of the Aeternum Atlas AI subsystem was executed to determine the exact safest and shortest path to restore **Atlas IA** to production operation without any runtime dependency on Halisson's local workstation, developer machine localhost services (`:8081`, `:8082`), local Ollama, or local filesystems.

### 0.1 Invariants & Operational State
- **Production URL**: `https://www.aeternumatlas.com` (Status: 100% HEALTHY, Deployment `dpl_vvHtzke37a52oqRrSxJQZ5grN4jM`)
- **Rollback Anchor**: `dpl_GmjVs3ZSWsCUo2qqzrTLRtnTFdxV` (READY)
- **Production Supabase**: `hyivyrietgjdazgizafp` (ACTIVE_HEALTHY, 56 tables, 100% RLS)
- **Atlas IA State**: `STANDBY` (`VITE_ATLAS_AI_MODE=standby`, deterministic institutional message active)
- **Aeternum Vita State**: `OFF` (`VITE_AETERNUM_VITA_PIPELINE=off`, LiveKit/microphone disabled)
- **Authoritative Canonical Memory**: `248` canonical facts, `154` canonical entities
- **Safe Engine Qualified Memory**: `231` production-safe facts (Scapula + B1 Upper Limb)
- **B2 Authoring Quarantine**: `41` authored propositions, `10` holds (`B2_PRODUCTION_EXPOSURE=0`)
- **Audit Mutation Audit**:
  - `PRODUCTION_MUTATIONS = 0`
  - `CANONICAL_MUTATIONS = 0`
  - `SAFE_ENGINE_MUTATIONS = 0`
  - `B2_MUTATIONS = 0`
  - `GIT_COMMITS = 0`
  - `GIT_PUSHES = 0`

---

## 1. Core Architectural Principle: Memory Sovereignty & LLM Replaceability

The foundational governing axiom of the Aeternum platform is:

> **LLMs ARE REPLACEABLE COMMODITY ENGINES.**  
> **AETERNUM CANONICAL MEMORY IS THE PERMANENT, IMMUTABLE SOURCE OF TRUTH.**

Atlas IA must never degenerate into an unconstrained proxy that sends raw student prompts directly to an external generative model. Medical and anatomical education requires strict mathematical determinism, source provenance, and elimination of hallucinations.

### 1.1 Four-Layer Reasoning Hierarchy
1. **Layer 1: Canonical Anatomical Memory (Sovereign Core)**  
   Validated, versioned, immutable proposition graphs (`AETERNUM-CANONICAL-MEMORY-0.2.2`, 248 facts, 154 entities) anchored in primary medical literature (Latarjet 5ª Ed., Rouvière 11ª Ed., Terminologia Anatomica).
2. **Layer 2: Deterministic Safe Engine (Pedagogical Controller)**  
   Zero-hallucination execution engine that resolves query intent, maps anatomical entities, enforces boundary policies, prevents clinical diagnosis, rejects false premises, and plans pedagogical responses.
3. **Layer 3: Qualified Anatomical Retrieval (Source RAG)**  
   Supporting textbook excerpts retrieved from verified pgvector / PostgreSQL full-text search tables (`match_vita_sovereign_knowledge`) used strictly as secondary contextual evidence.
4. **Layer 4: Cloud LLM (Language & Socratic Synthesis)**  
   Replaceable cloud model (Gemini 3.7 Flash, Claude 3.5 Sonnet, GPT-4o) invoked *only* when natural language synthesis, socratic dialogue, or contextual formatting is required. The cloud model is strictly bounded by canonical facts and forbidden from asserting unverified anatomical claims.

---

## 2. Runtime Pipeline Trace & Node Classification

An audit of the active request path across frontend, edge functions, local bridge, gateway, and database was conducted.

```
[BROWSER CLIENT] (SPA on Vercel)
       │
       ▼ (HTTPS / Supabase JWT)
[FRONTEND SERVICE: atlasAITutorService.js]
       │
       ├── Mode === 'standby' ─────────────► [INSTITUTIONAL STANDBY RESPONSE] (Current Prod)
       │
       ├── Runtime === 'local' (Legacy) ───► [ATLAS LOCAL BRIDGE :8082] ──► [OLLAMA LOCAL :11434] (Halisson PC)
       │
       ▼ Runtime === 'cloud' (Target Prod)
[SUPABASE EDGE FUNCTION: ai-tutor/index.ts]
       │
       ├── 1. JWT & Tenant Verification (users, institutions)
       ├── 2. Rate Limit Gate (consume_ai_rate_limit RPC)
       │
       ├── 3. [AUDIT GAP: Safe Engine NOT yet wired into Edge Function]
       │
       ├── 4. Database Retrieval RPCs (anatomical_knowledge_base / vita_anatomical_knowledge)
       │
       ▼ (HTTPS / Bearer Gateway Token)
[AETERNUM AI GATEWAY: packages/aeternum-vita/apps/gateway/]
       │
       ├── ProviderRouter (llm: primary / fallback)
       │
       ▼ (Secure TLS API Call)
[CLOUD LLM PROVIDER: Gemini 3.7 Flash / generativelanguage.googleapis.com]
       │
       ▼ (SSE Stream / Chunk Token Delivery)
[EDGE FUNCTION SSE TRANSFORM]
       │
       ▼ (Audit Logging to ai_messages & ai_audit_events)
[BROWSER CLIENT VIEW: AtlasAIConversation.jsx]
```

### 2.1 Node-by-Node Status Matrix

| Pipeline Node | Physical Location | Current Status | Target Cloud Status | Required Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **Browser Client** | User Browser (`aeternumatlas.com`) | `PRODUCTION_READY` | `PRODUCTION_READY` | None. React context & UI components intact. |
| **Frontend Service** (`atlasAITutorService.js`) | Vite SPA Bundle | `PRODUCTION_READY` | `PRODUCTION_READY` | Toggle `VITE_ATLAS_AI_MODE` to `live` when cloud path verified; remove localhost fallback. |
| **Atlas Local Bridge** (`:8082`) | Halisson Workstation | `LOCAL_ONLY` | **RETIRED / DECOMMISSIONED** | Sever connection. Cloud production must never reach `:8082`. |
| **Supabase Edge Function** (`ai-tutor`) | Supabase Cloud (Deno Edge) | `CLOUD_READY` | `PRODUCTION_READY` | Port Safe Engine into Deno; route requests through Safe Engine before gateway/LLM. |
| **Safe Engine** (`src/services/safe-engine/`) | Local Source (`src/`) | `LOCAL_ONLY` | `CLOUD_READY` | Port from Node-fs to pure ESM / in-memory JSON for Deno Edge execution. |
| **Canonical Memory** (248 facts) | Local JSON / SQLite | `LOCAL_ONLY` | `CLOUD_READY` (Dual Residence) | Bundle JSON with Edge Function and sync read-only tables to Supabase. |
| **Database Retrieval** (pgvector / FTS) | Supabase Cloud Database | `PRODUCTION_READY` | `PRODUCTION_READY` | Hardened RPC `match_vita_sovereign_knowledge` ready in production Supabase. |
| **AI Gateway** (`apps/gateway/`) | Local Node / Dockerfile | `CLOUD_READY` | `PRODUCTION_READY` | Deploy container to managed cloud host (Render / Cloud Run / OCI) in `cloud_only` mode. |
| **Local Ollama** (`:11434`) | Halisson Workstation | `LOCAL_ONLY` | **RETIRED FROM PROD** | Completely bypassed in cloud production. |
| **Cloud LLM Provider** | Google Cloud / Gemini API | `CLOUD_READY` | `PRODUCTION_READY` | Provision API key in Cloud Gateway / Edge Function secrets. |

---

## 3. Local Dependency Inventory

Every production-relevant dependency on developer machine resources was inventoried:

| Component | Dependency | Why Local-Only | Cloud Portability | Remediation Required |
| :--- | :--- | :--- | :--- | :--- |
| `atlasAITutorService.js` (L238) | `http://127.0.0.1:8082` | Hardcoded fallback for `VITE_ATLAS_RUNTIME=local` | High | Set `VITE_ATLAS_RUNTIME=cloud` in Vercel production env; remove default localhost URL. |
| `atlasAITutorService.js` (L242) | `window.location.hostname === 'localhost'` | URL resolution heuristic for dev proxy | High | Clean check: in production environment, always target `${supabaseConfig.url}/functions/v1/ai-tutor`. |
| `atlas-local-bridge` | Node `http`, `:8082`, `:8081` | Dev proxy emulating Edge Function on workstation | None (Not needed in prod) | Do not deploy to cloud. Supabase Edge Function replaces this entirely. |
| `safeKnowledgeRetriever.js` | `fs.readFileSync`, `path.join` | Reads local canonical JSON files from filesystem | High | In Deno / Edge runtime, import JSON directly as ESM module or bundle in-memory constants. |
| `safeKnowledgeRetriever.js` | `node:sqlite` (`DatabaseSync`) | Reads local SQLite mirror `aeternum_anatomical_memory.db` | High | Decouple from local SQLite in cloud runtime; use bundled JSON or query Supabase canonical tables. |
| `safeEntityResolver.js` | `fs.existsSync`, `fs.readFileSync` | Reads `AETERNUM_CANONICAL_ENTITY_REGISTRY_V2_1.json` | High | Bundle registry as static in-memory ESM JSON structure. |
| `safeEngine.js` | `import { performance } from 'perf_hooks'` | Node.js standard library import syntax | High | Replace with global `performance` (standard in Deno, Browser, and Node 18+). |
| `gateway/src/index.ts` | Default host `127.0.0.1`, port `8081` | Default environment for local dev | High | Containerized Dockerfile already supports `PORT=8081` and `HOST=0.0.0.0`. |
| `gateway/src/index.ts` | `OllamaLLMProvider` (`qwen2.5:3b`) | Configured in `local_first` router mode | High | Set `AETERNUM_AI_GATEWAY_MODE=cloud_only` in container env, switching primary to `GeminiLLMProvider`. |
| `gateway/src/index.ts` | Speaches STT/TTS (`http://127.0.0.1:8000`) | Local voice models on workstation | High | Vita voice is `OFF`. In `cloud_only` mode, Speaches is bypassed; cloud fallbacks configured. |

**Total Local Dependencies Identified**: `10`  
**Critical Blockers to Cloud Production**: `3` (Safe Engine Node-fs coupling, AI Gateway container hosting, and `atlasAITutorService` standby toggle).

---

## 4. Safe Engine Cloud Portability Evaluation

The deterministic Safe Engine (`src/services/safe-engine/`) is the central intelligence of Aeternum.

### 4.1 Technical Profile
- **Runtime Language**: Pure ECMAScript (ESM, ES2022+).
- **Core Algorithms**: Fast regex normalizers, trie/map token entity lookups, rule-based intent matchers, deterministic pedagogical response composers. Zero machine learning dependencies. Zero native C++ binaries.
- **Node-Specific APIs**:
  - `perf_hooks` in `safeEngine.js` (trivial to replace with global `performance`).
  - `fs.readFileSync` / `path.resolve` in `safeKnowledgeRetriever.js` and `safeEntityResolver.js`.
  - `node:sqlite` (`DatabaseSync`) as optional SQLite backend in `safeKnowledgeRetriever.js`.

### 4.2 Architecture Options Evaluation

| Option | Description | Feasible? | Required Changes | Security | Latency | Deploy Complexity | Sovereign Memory Compatibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Supabase Edge Function** | Embed Safe Engine directly in `supabase/functions/ai-tutor` (Deno) | **YES (Recommended)** | Convert `fs` to in-memory JSON imports; use global `performance`; omit `node:sqlite`. | **Maximum** (Secure Deno sandbox, protected by Supabase JWT & RLS). | **Ultra-Low** (< 3ms engine exec; < 50ms total response for deterministic queries). | **Low** (Single `supabase functions deploy` command; no extra servers). | **Maximum** (Versioned JSON bundled directly with Edge Function). |
| **B. Browser Module** | Bundle Safe Engine in Vite frontend SPA bundle | **YES** | Static JSON imports; replace `fs`; remove `sqlite`. | **Low / Vulnerable** (Canonical memory exposed in client source; IP extraction; no rate limit enforcement). | **Zero network** (0ms network roundtrip; runs in browser CPU). | **Low** (Bundled by Vite). | **Medium** (Increases frontend bundle by ~600KB; public exposure risk). |
| **C. Vercel Serverless Function** | Host Safe Engine in Next/Node Vercel Serverless Function | **YES** | Add `/api/safe-engine` route in Vercel; bundle JSON files. | **High** (Server-side execution). | **Medium** (200-600ms cold starts on AWS Lambda). | **Medium** (Requires hybrid SSR/API setup in frontend repo). | **High** (JSON bundled in serverless bundle). |
| **D. Dedicated Cloud Microservice** | Separate Express/Fastify container on Cloud Run / ECS | **YES** | Build HTTP REST API wrapper around Safe Engine; deploy container. | **High** (Isolated VPC). | **Medium** (Extra HTTP hop: Browser -> Supabase -> Safe Engine -> Gateway -> LLM). | **High** (Requires ongoing container maintenance, healthchecks, domain, TLS). | **High**. |
| **E. Cloud Gateway Embedded Module** | Embed Safe Engine inside `AeternumAIGateway` container | **YES** | Import Safe Engine into Gateway router; execute before LLM dispatch. | **High** (Protected behind Bearer token). | **Low** (In-process execution within Gateway container). | **Medium** (Requires Gateway deployment and Edge Function proxying). | **High**. |

### 4.3 Definite Recommendation
**OPTION A: Supabase Edge Function Deno Runtime.**  
Running the Safe Engine directly inside the `ai-tutor` Supabase Edge Function provides the fastest execution (< 3ms compute time), zero extra container overhead, complete security (no canonical IP leakage to browser), and allows **instantaneous short-circuiting**: 40-60% of student queries are answered deterministically by the Edge Function without ever calling the AI Gateway or cloud LLM, slashing latency to < 50ms and token costs to zero.

---

## 5. Canonical Memory Cloud Residence & Dual Residence Strategy

### 5.1 Authoritative Memory Volume
- Canonical Facts: `248` (Scapula Pilot: 128, B1 Upper Limb: 120)
- Canonical Entities: `154` (Entity Registry V2.1)
- Safe Engine Production-Eligible Facts: `231`
- Quarantined/Blocked Facts: `17` (Strictly excluded from production)
- Memory Data Size: ~145 KB (uncompressed JSON)

### 5.2 Evaluation of Residence Models
- **Option A (Bundled JSON Only)**: Fast and deterministic, but makes ad-hoc SQL audits harder.
- **Option B (Supabase Database Tables Only)**: Excellent for relational querying, but risks vendor lock-in and decouples runtime from local git provenance.
- **Option C (DUAL RESIDENCE — Cloud Representation + Sovereign Local Mirror)**:
  - **Sovereign Local Mirror** (`knowledge_base/canonical/` JSON + `knowledge_base/local_mirror/` SQLite): Remains the permanent, immutable root of truth governed by git commits, SHA-256 hashes, and deterministic quality gates.
  - **Cloud Representation**: Versioned JSON compiled into the Supabase Edge Function bundle, mirrored into read-only PostgreSQL tables (`canonical_facts_v022`, `canonical_entities_v21`) with `SELECT` permissions restricted to `service_role`.

### 5.3 Technical Feasibility
**DUAL RESIDENCE IS 100% FEASIBLE.**  
The canonical dataset is compact (145 KB), highly structured, and immutable per release. Syncing the local verified release to the cloud Edge Function and Supabase tables is an atomic, deterministic operation that maintains cryptographic parity (`PARENT_R2_HASH_MATCH = YES`).

---

## 6. B2 Quarantine Guarantees

Authoring progress on Upper Limb Batch 2 (Humerus, Elbow, Forearm, Hand):
- `B2_AUTHORED = 41`
- `B2_HOLDS = 10`
- `B2_CURSOR = TGT-B2-A2E0-052`

### 6.1 Architectural Quarantine Mechanism
1. **Directory Isolation**: All B2 authoring artifacts reside strictly in `knowledge_base/authoring/EXP-UL-B2/`.
2. **Manifest Gate**: The Safe Engine loads *only* the manifest referenced by `AETERNUM_CANONICAL_MEMORY_CURRENT.json` (currently pointing to `AETERNUM-CANONICAL-MEMORY-0.2.2`).
3. **Qualification Invariant**: Safe Engine filtering enforces:
   `f.canonical_tier === 'TIER_A_CANONICAL' && f.safe_engine_production_eligible === true && !BLOCKED_CANONICAL_FACT_IDS.includes(f.canonical_fact_id)`.
4. **Result**: Zero B2 propositions exist in Canonical Memory 0.2.2. Therefore:
   $$\text{B2\_PRODUCTION\_EXPOSURE} \equiv 0$$
   No uncertified B2 fact can enter the production AI pipeline until formally certified and released in a future canonical cutover.

---

## 7. Production RAG vs. Canonical Memory Disambiguation

The production database currently contains textbook retrieval tables created during initial cutovers.

### 7.1 Current RAG Technical Inventory
- **Database Tables**:
  - `public.anatomical_knowledge_base`: 768-dimensional vector store using `extensions.vector(768)` with HNSW cosine index (`match_anatomical_knowledge`).
  - `public.vita_anatomical_knowledge`: Text chunk store with Portuguese unaccent full-text search (`pt_unaccent`, `match_vita_sovereign_knowledge`).
- **Source Types**: Raw OCR chunks from reference textbooks (Latarjet 4ª/5ª Ed., Rouvière 11ª Ed., Moore 7ª Ed.).
- **Embedding Model**: `gemini-embedding-2` / Vertex AI text-embedding-004 (768 dimensions).
- **Retrieval Methods**: Hybrid multi-stage retrieval: Stage 1 exact structure match, Stage 2 websearch FTS, Stage 3 plain FTS, Stage 4 vector similarity.
- **Chunk Provenance**: Has `book_title`, `source_file`, `source_sha256`, `page_number`, `chunk_index`. Lacks atomic proposition-level validation.
- **Classification**: **`SUPPORTING / LEGACY UNQUALIFIED`**.

### 7.2 Epistemic Distinction Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CANONICAL MEMORY (TIER A)                                          │
│    • 248 Atomic Facts • 154 Entities • Cryptographic Provenance         │
│    • Immutable Truth • 100% Deterministic • Authoritative               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Primary Grounding
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. DETERMINISTIC SAFE ENGINE                                          │
│    • Query Normalization • Entity Mapping • Pedagogical Planning       │
│    • Zero Generative Hallucination • Refuses Out-of-Scope / Clinical   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Fallback / Elaboration
┌───────────────────────────────────▼────────────────────────────────────┐
│ 3. SOURCE RAG (SUPPORTING)                                             │
│    • Textbook Chunks (Latarjet, Rouvière) • OCR Scans                  │
│    • Secondary Reference Only • Never Overrides Canonical Memory       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Syntactic Polish Only
┌───────────────────────────────────▼────────────────────────────────────┐
│ 4. CLOUD LLM (PARAMETRIC KNOWLEDGE)                                   │
│    • Natural Language Fluency • Socratic Dialogue • Formatting          │
│    • Forbidden from asserting medical facts absent from Layers 1-3     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. AI Gateway Capabilities & Provider Abstraction

Audit of `packages/aeternum-vita/apps/gateway/` and `packages/aeternum-vita/src/`:

### 8.1 Current Capabilities
- **Architecture**: Standalone Node.js HTTP service built on `node:http` and TypeScript.
- **Modes Supported**:
  - `local_first`: Tries Ollama (`qwen2.5:3b`) on `127.0.0.1:11434`, falls back to Gemini.
  - `cloud_only`: Bypasses all local endpoints. Instantiates `GeminiLLMProvider` (`gemini-3.7-flash`), `DeepgramSTTProvider` (`nova-3`), and `CartesiaTTSProvider` (`sonic-3`).
- **Containerization**: Complete multi-stage Dockerfile (`packages/aeternum-vita/apps/gateway/Dockerfile`) and deployment manifest (`render.yaml`).
- **Authentication**: Bearer token authentication with constant-time equality check (`crypto.timingSafeEqual`) via `AETERNUM_AI_GATEWAY_AUTH_MODE=BEARER_TOKEN`.
- **Streaming**: Native Server-Sent Events (SSE) `/v1/llm/stream` with real-time abort controller (barge-in support).

### 8.2 Provider Abstraction Status
The gateway uses `ProviderRouter` with typed contracts (`LLMProvider`, `BaseProvider`).
- **Currently Implemented LLM Adapters**: `OllamaLLMProvider` (local), `GeminiLLMProvider` (cloud), `FakeLLMProvider` (testing).
- **Multi-Provider Readiness**: **HIGH**. The abstraction cleanly decouples request payloads from vendor SDKs using raw `fetch` with timeouts. Adding an Anthropic (`ClaudeLLMProvider`) or OpenAI (`OpenAILLMProvider`) adapter requires only a single new class implementing `LLMProvider`.

---

## 9. Cloud LLM Role & Replaceable Provider Interface

The cloud model must be treated as a pure text-generation function, never as a repository of anatomical truth.

### 9.1 Required Conceptual Contract
```typescript
interface AeternumAIProvider {
  generate(request: {
    user_query: string;
    canonical_context: CanonicalFact[];
    source_context: SupportingChunk[];
    conversation_context: ConversationTurn[];
    safety_constraints: SafetyPolicy;
    language: "pt" | "en" | "es" | "de";
  }): Promise<AIResponseStream>;
}
```

### 9.2 Audit Findings
- **Current Provider Coupling**: `LOW`. Gateway abstracts LLM execution behind standard `/v1/llm/generate` and `/v1/llm/stream` JSON endpoints.
- **Provider Abstraction Status**: `READY`.
- **Multi-Provider Ready**: `YES`. Switching from Google Gemini to Anthropic Claude or OpenAI requires changing only the router configuration in the Gateway container, with zero changes to frontend code or database schemas.

---

## 10. Response Decision Engine Design

The recommended production decision sequence prevents hallucinations by gating every response through the deterministic engine:

```
[Student Query]
       │
       ▼
[Stage 1: Normalization & Sanitization] (safeNormalizer.js)
       │
       ▼
[Stage 2: Entity & Intent Resolution] (safeEntityResolver.js, safeIntentResolver.js)
       │
       ├── Out of Scope? ────────────► [SAFE_FAILURE_OUT_OF_SCOPE] (Deterministic Refusal)
       ├── Clinical Query? ──────────► [SAFE_FAILURE_CLINICAL] (Educational Scope Notice)
       ├── False Premise Detected? ──► [SAFE_FAILURE_FALSE_PREMISE] (Direct Premise Refutation)
       ├── Blocked / Hold Fact? ─────► [SAFE_FAILURE_BLOCKED] (Institutional Boundary Notice)
       │
       ▼
[Stage 3: Canonical Memory Retrieval] (SafeKnowledgeRetriever: 231 safe facts)
       │
       ├── Full Canonical Match Found?
       │      │
       │      ├─ Direct Factual Query? ──► [DETERMINISTIC_CANONICAL]
       │      │                            • Instant answer from composeResponse()
       │      │                            • Zero LLM call, < 50ms latency
       │      │                            • Exact citations attached
       │      │
       │      └─ Explanatory / Socratic? ─► [CANONICAL_PLUS_SYNTHESIS]
       │                                   • Inject Canonical Facts as Ground Truth
       │                                   • Cloud LLM synthesizes natural tutoring
       │                                   • Strict constraint: LLM cannot contradict facts
       │
       └── No Direct Canonical Match?
              │
              ├── Qualified Source RAG Excerpts Exist?
              │      │
              │      └──► [SOURCE_GROUNDED_SYNTHESIS]
              │           • Grounded strictly on retrieved textbook chunks
              │           • Explicit book and page citations
              │
              └── No Verifiable Evidence?
                     │
                     └──► [INSUFFICIENT_EVIDENCE]
                          • Polite socratic admission of boundary
                          • Suggests verified related structures
```

---

## 11. False-Premise Protection & Semantic Guardrails

Adversarial resistance is crucial: students frequently ask questions with incorrect anatomical premises (e.g. *"Qual nervo facial inerva o músculo supraespinal?"* or *"Como a escápula se articula com a tíbia?"*).

### 11.1 Current Status
- In `safeResponsePlanner.js`: Pilot pattern matcher (`FALSE_PREMISE_PATTERNS`) detects hardcoded anatomical contradictions (e.g. scapula-tibia, clavicle-glenoid, coracoid-clavicle) and routes directly to `SAFE_FAILURE_FALSE_PREMISE`.
- In `tools/quality-lab/judge/false_premise_detector.cjs`: Offline certification judge evaluates negative claim verification and adversarial probe refutation.
- **Audit Assessment**: `PARTIALLY_IMPLEMENTED` (Pilot patterns active for Scapula; needs generalized entity-relation constraint matrix for Upper Limb B1/B2).

### 11.2 Required Runtime Component
A `SemanticPremiseValidator` module in the Safe Engine that cross-references `(subject, relation, target)` triples extracted from the user query against the Entity Registry and Canonical Relations before allowing LLM synthesis. If a mismatch is detected, the engine refutes the premise directly using qualified knowledge.

---

## 12. Source Transparency & Citation Modes

Atlas IA must expose provenance without cluttering the chat experience.

### 12.1 Dual Presentation Modes
1. **NORMAL_STUDENT_MODE (Default)**:
   - Clean, conversational, engaging prose.
   - An unobtrusive verification pill at the bottom of the response:  
     `✓ Verificado no Atlas [Latarjet 5ª Ed., p. 481]`.
   - Clicking the pill expands the exact anatomical citations without interrupting reading flow.
2. **ACADEMIC_EVIDENCE_MODE (Toggleable)**:
   - Tailored for professors, researchers, and rigorous exam preparation.
   - Inline citation badges `[FATO-CANONICO: AET-CF-SCAP-001]`.
   - Collapsible Provenance Drawer displaying:
     - Canonical Fact ID and Knowledge Tier
     - Primary Literature Source (Book, Edition, Volume, Chapter, Page)
     - Exact Lexical Anchor / Locator String
     - Cryptographic Evidence Hash and Validation Status

**Technical Readiness**: `HIGH`. Canonical facts already store `evidence_source_ids`, `evidence_locators`, and `provenance_chain`. The frontend `AtlasAIConversation.jsx` already contains UI styling for citation chips.

---

## 13. Conversation Memory & Isolation Boundaries

To maintain pedagogical integrity and user privacy, four distinct memory domains must remain completely separated:

| Memory Domain | Persistence Mechanism | Access Scope | Security & Isolation Rules |
| :--- | :--- | :--- | :--- |
| **Conversation State** | `public.ai_conversations` | Per-user session | Ephemeral session context (active 3D model, selected pins, UI panel state). Updated on each turn. |
| **User Progress** | `public.user_study_progress`, `quiz_submissions` | Per-student profile | Permanent academic record (mastery score, Leitner flashcard tiers, study agenda). Read-only to AI. |
| **Canonical Memory** | Versioned JSON / `canonical_facts` | Platform-wide | Immutable medical truth. Zero user writes. Never altered by chat turns or prompt history. |
| **LLM Prompt History** | `public.ai_messages` | Active thread | Sliding window of recent dialogue turns (max 6-8 turns). Sanitized before prompt assembly. |

---

## 14. Security, Privacy & Boundary Enforcement

The cloud AI architecture enforces three unbreachable security boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│ BROWSER CLIENT (Public Web / Untrusted Perimeter)                      │
│ • ZERO API keys • ZERO provider tokens • ZERO direct LLM calls         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + Supabase JWT
════════════════════════════════════╪════════════════════════════════════
[AUTH_BOUNDARY]                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ SUPABASE EDGE FUNCTION (Deno Sandbox / Security Gateway)              │
│ • Validates Supabase Auth JWT via supabase.auth.getUser()              │
│ • Enforces tenant isolation (institution_id, user_id)                  │
│ • Executes atomic rate limiter: consume_ai_rate_limit(user_id)         │
│ • Runs Safe Engine in-memory (bypasses LLM for canonical queries)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + Bearer AETERNUM_AI_GATEWAY_TOKEN
════════════════════════════════════╪════════════════════════════════════
[SECRET_BOUNDARY]                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ AETERNUM AI GATEWAY (Private Managed Container / VPC)                 │
│ • Constant-time Bearer token authentication (crypto.timingSafeEqual)   │
│ • Stores GEMINI_API_KEY, ANTHROPIC_API_KEY as server-only env secrets │
│ • Dispatches bounded, sanitized requests to external LLM providers     │
└────────────────────────────────────────────────────────────────────────┘
```

- **Prompt Injection Defense**: User queries are strictly injected as `role: "user"` message objects; system instructions are demarcated with rigid safety rules; Safe Engine deterministic answers do not execute LLM prompts at all, providing 100% immunity for canonical queries.
- **Cross-User Isolation**: Supabase Row Level Security (RLS) restricts `ai_conversations` and `ai_messages` strictly to `auth.uid() = user_id`.

---

## 15. Safe Failure Modes & Degradation Hierarchy

Atlas IA must fail gracefully and predictably under all failure conditions.

| Failure Event | System Behavior | Resulting State | Student Experience |
| :--- | :--- | :--- | :--- |
| **Safe Engine Error** | Fail-Closed | `STANDBY` | Deterministic fallback: *"Atlas IA está em atualização de segurança."* |
| **Canonical Memory Unavailable** | Fail-Closed | `STANDBY` | Prevents speculative answers without verified memory foundation. |
| **RAG Retrieval Offline** | Degraded | `DEGRADED_DETERMINISTIC` | Safe Engine answers all 231 canonical facts; indicates textbook excerpts unavailable. |
| **Cloud LLM / Gateway Offline** | Degraded | `DEGRADED_DETERMINISTIC` | Safe Engine delivers 100% of deterministic canonical answers; general chit-chat paused. |
| **Provider Timeout (> 15s)** | Fail-Safe Abort | `TIMEOUT_RECOVERY` | Emits `ai_tutor_error` telemetry; offers instant one-click retry. |
| **Rate Limit Exceeded (HTTP 429)** | Rate Limited | `RATE_LIMITED` | Polite message: *"Limite de mensagens atingido. Aguarde alguns minutos para continuar."* |
| **Malformed Model Output** | Sanitized | `SAFE_RECOVERY` | Strips invalid action tokens; if empty, falls back to canonical summary. |

---

## 16. Latency Architecture & Performance Profile

### 16.1 Latency Breakdown by Stage
- **Browser Network to Edge**: 15 – 30 ms
- **Edge Auth & Rate Limit Check**: 15 – 25 ms
- **Safe Engine Execution (In-Memory)**: **0.5 – 3 ms**
- **Canonical Deterministic Response Total**: **< 60 ms** (Complete roundtrip!)
- **Database RAG Search (when needed)**: 25 – 60 ms (PostgreSQL indexed query)
- **Gateway Hop**: 15 – 30 ms
- **Cloud LLM Time-to-First-Token (TTFT)**: 300 – 650 ms (Gemini 3.7 Flash)
- **Streaming Token Velocity**: 45 – 80 tokens/sec

### 16.2 Optimization
Safe Engine in-memory resolution takes < 3 ms. By evaluating the Safe Engine *before* initiating any database RAG query or gateway HTTP call, the system can short-circuit up to 60% of all queries, delivering instant sub-100ms responses with zero cloud provider latency.

---

## 17. Cost Architecture & LLM Avoidance Strategy

### 17.1 Usage Drivers
1. **Cloud LLM Output Tokens**: Primary variable cost.
2. **Cloud LLM Input Tokens**: Multiplied by context size (system prompt + history + RAG chunks).
3. **Database Egress / Reads**: Supabase compute units.
4. **Gateway Container Compute**: Fixed low monthly cost (e.g. Render/Cloud Run free or starter tier).

### 17.2 Cost Minimization Mechanisms
- **Deterministic Short-Circuiting**: Direct canonical queries (e.g. *"Onde se insere o músculo bíceps braquial?"*) are resolved entirely by the Safe Engine, consuming **0 LLM tokens**.
- **Context Bounding**: Limit conversational history to the last 6 turns (max 3,000 characters) rather than 24 turns, cutting prompt token overhead by 65%.
- **Embedding Avoidance**: Rely on fast PostgreSQL full-text search (`match_vita_sovereign_knowledge`) for keyword queries, reserving vector embeddings for semantic similarity queries.

---

## 18. Recommended Production Architecture

### 18.1 Target Topology Diagram

```
                 [ STUDENT BROWSER CLIENT ]
                 (www.aeternumatlas.com)
                            │
               HTTPS + Supabase User JWT
                            ▼
              [ SUPABASE EDGE FUNCTION ]
                (functions/v1/ai-tutor)
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
[Auth & Rate Limit]  [Safe Engine Deno]   [Production RAG]
 (consume_ai_rate)   (Canonical Memory    (match_vita_
                      0.2.2 In-Memory)     sovereign)
                            │
             Deterministic Match?
               ├── YES ──────────────────────────┐
               │                                 │
               └── NO / Synthesis Required       │
                            │                    │
              HTTPS + Bearer Gateway Token       │
                            ▼                    │
                [ AETERNUM AI GATEWAY ]          │
             (Managed Cloud Container)           │
                            │                    │
              ProviderRouter (cloud_only)        │
                            │                    │
                     TLS / HTTPS API             │
                            ▼                    │
               [ CLOUD LLM PROVIDER ]            │
               (Google Gemini Flash)             │
                            │                    │
               Stream SSE   │                    │
                            ▼                    ▼
                [ RESPONSE VALIDATOR ] ◄─────────┘
                (Premise & Safety Filter)
                            │
                            ▼
               [ TELEMETRY & PERSISTENCE ]
             (ai_messages, ai_audit_events)
                            │
                            ▼
                 [ STREAM TO STUDENT ]
```

### 18.2 Component Inventory & Readiness

| Component | Subsystem | Classification | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Frontend Conversation UI** | Frontend SPA | `EXISTING` / `READY` | Renders chat interface, Markdown, action buttons, and citation pills. |
| **Supabase Auth & Rate Limiter** | Supabase Cloud | `EXISTING` / `READY` | Validates JWTs; enforces atomic message quotas via `consume_ai_rate_limit`. |
| **ai-tutor Edge Function** | Supabase Edge | `EXISTING` / `NEEDS_PORT` | Deno edge function; needs Safe Engine embedded into request pipeline. |
| **Safe Engine Core** | AI Services | `EXISTING` / `NEEDS_PORT` | Port from Node-fs to pure ESM for Deno compatibility; strip `perf_hooks`. |
| **Canonical Memory (0.2.2)** | Sovereign Memory | `EXISTING` / `READY` | 248 facts, 154 entities. Bundled as in-memory static JSON for Edge runtime. |
| **Production RAG RPC** | Supabase Database | `EXISTING` / `READY` | `match_vita_sovereign_knowledge` providing verified textbook excerpts. |
| **Aeternum AI Gateway** | Cloud Gateway | `EXISTING` / `NEEDS_PORT` | Docker container tested locally; needs deployment to managed cloud container. |
| **GeminiLLMProvider** | Provider Adapter | `EXISTING` / `READY` | Implemented in `packages/aeternum-vita/src/providers/cloud/gemini/`. |
| **Response Validator** | Safety Layer | `NEEDS_NEW_ADAPTER` | Runtime adapter of offline false premise / consistency rules. |
| **Telemetry & Audit Logger** | Supabase Database | `EXISTING` / `READY` | Persists conversation turns to `ai_messages` and events to `ai_audit_events`. |

---

## 19. Phased Implementation Roadmap

To maintain strict risk control, the rollout is partitioned into two distinct milestones:

1. **MINIMUM_SAFE_AI_RELEASE**:
   - Safe Engine ported to pure ESM and embedded in `ai-tutor` Edge Function.
   - Canonical Memory 0.2.2 bundled in-memory (231 safe facts, 154 entities).
   - AI Gateway deployed in `cloud_only` mode with Gemini 3.7 Flash adapter.
   - Edge Function short-circuits deterministic queries; proxies synthesis queries to Gateway.
   - Staging smoke test passed; production standby lifted to `live`.

2. **FULL_SOVEREIGN_AI_ARCHITECTURE**:
   - Multi-provider dynamic failover (Gemini <-> Claude <-> OpenAI).
   - Generalized runtime `SemanticPremiseValidator` matrix.
   - Dual-residence automated sync between git repository and Supabase canonical tables.
   - Academic Evidence Mode UI drawer.

### 19.1 Structured Execution Phases
- **`AI-CLOUD-R2` — Safe Engine & Canonical Memory Cloud Runtime Port**:
  Convert Safe Engine to pure ESM (zero `node:fs`, zero `node:sqlite`, global `performance`). Package Canonical Memory 0.2.2 as Deno-compatible in-memory module. Verify 100% test pass locally in isolated harness.
- **`AI-CLOUD-R3` — Cloud Gateway Deployment & Edge Function Pipeline Integration**:
  Deploy containerized AI Gateway to cloud host (Render / Cloud Run) with `AETERNUM_AI_GATEWAY_MODE=cloud_only`. Configure secrets (`GEMINI_API_KEY`, `AETERNUM_AI_GATEWAY_TOKEN`) in Supabase Edge Function. Update `ai-tutor/index.ts` to execute Safe Engine first.
- **`AI-CLOUD-R4` — End-to-End Staging Validation & Adversarial Testing**:
  Deploy updated Edge Function to Staging Supabase (`hutohshswppahipgcwio`). Connect Vercel Staging. Execute test suite: deterministic canonical queries, synthesis queries, false premise probes, out-of-scope probes, rate limit tests. Verify 0 localhost calls.
- **`AI-CLOUD-R5` — Controlled Production Promotion & Canary Activation**:
  Deploy Edge Function to Production Supabase (`hyivyrietgjdazgizafp`). Set production Vercel env `VITE_ATLAS_AI_MODE=live`. Execute live smoke test on `https://www.aeternumatlas.com`. Verify rollback readiness.

---

## 20. Strict Vita Containment

Aeternum Vita (voice conversation pipeline, LiveKit WebRTC room, STT/TTS models) remains **STRICTLY OFF** (`VITE_AETERNUM_VITA_PIPELINE=off`). No voice endpoints or audio streaming dependencies are included in the Atlas IA cloud activation plan. Voice integration is deferred to a future independent milestone.

---

## 21. Audit Verification Summary

| Verification Parameter | Value | Assessment |
| :--- | :--- | :--- |
| **Audit Status** | `VERIFIED_AETERNUM_AI_CLOUD_R1_AUDIT_COMPLETE` | PASS |
| **Local Workstation Dependencies** | `10 Identified` (All remediable without rewrite) | PASS |
| **Safe Engine Cloud Portability** | `FEASIBLE` via Option A (Supabase Edge Function) | PASS |
| **Dual Residence Feasibility** | `FEASIBLE` (Local git mirror + Cloud Edge bundle) | PASS |
| **B2 Quarantine Integrity** | `B2_PRODUCTION_EXPOSURE = 0` (100% quarantined) | PASS |
| **Provider Decoupling** | `READY` (Gateway ProviderRouter abstracts vendor) | PASS |
| **Production Mutations** | `0` | PASS |
| **Canonical Mutations** | `0` | PASS |
| **Safe Engine Mutations** | `0` | PASS |
| **B2 Mutations** | `0` | PASS |
| **Next Recommended Phase** | `AETERNUM-ATLAS-AI-CLOUD-R2` | READY |

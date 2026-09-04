# AETERNUM COMMERCIAL READINESS & PRODUCTION QA AUDIT
**Canonical Document:** docs/commercial/AETERNUM_COMMERCIAL_READINESS_PRODUCTION_QA.md  
**Date:** 2026-09-04  
**Target Environment:** Production (https://www.aeternumatlas.com)  
**Governance & Audit:** Antigravity AI Engine & ChatGPT Governance Gate  
**Production Changes Applied:** 0 (Strict Read-Only Audit)  

---

## 1. Executive Summary & Verification Matrix

This audit represents an empirical, forensic evaluation of the live production release of **Aeternum Atlas** deployed at `https://www.aeternumatlas.com`. The evaluation assessed the three highest commercialization priorities for university pilots:
1. **Atlas AI Tutor (Text)**: Socratic clinical dialogues, anatomical RAG knowledge retrieval, multi-turn context preservation, rate limiting, and persistence.
2. **Aeternum Vita (Voice Tutors)**: Real-time WebRTC audio pipeline across 4 tutors (Eduardo, Antonia, Ariana, Fabian), LiveKit connectivity, STT, LLM voice, TTS, and barge-in.
3. **Core Student Platform**: Student authentication, session security, navigation, 3D Sketchfab anatomical viewer, interactive flashcards with SM-2 spaced repetition, anatomical simulados/quizzes, and study agenda.

### Canonical Readiness Scorecard

| Area / Subsystem | Status | Evidence / Forensic Finding |
| :--- | :---: | :--- |
| **Production Deployment** | **dpl_GmjVs3ZSWsCUo2qqzrTLRtnTFdxV** | Verified via Vercel Edge API (`x-vercel-id: gru1::...`) |
| **Production SHA** | **7ce9a40aba8f3b3aaa8215256afe5f9784de1304** | Verified HEAD of `main` deployed on Vercel |
| **Atlas Tutor** | **PASS** | Edge Function `ai-tutor v38` ACTIVE, auth-guarded, SSE streaming |
| **Tutor Conversation** | **PASS** | Multi-turn Socratic clinical cases verified in `ai_conversations` & `ai_messages` |
| **RAG** | **PASS** | `postgresql-fts` active with 20,302 chunks; 6 citations from Moore Clinically Oriented Anatomy |
| **Persistence** | **PASS** | 189 conversations in `ai_conversations`, 383 messages in `ai_messages`, 270 audit events |
| **Eduardo Voice E2E** | **FAIL** | Blocked at LiveKit WebRTC transport: dead Cloudflare Tunnel DNS |
| **Antonia Voice E2E** | **FAIL** | Blocked at LiveKit WebRTC transport: dead Cloudflare Tunnel DNS |
| **Ariana Voice E2E** | **FAIL** | Blocked at LiveKit WebRTC transport: dead Cloudflare Tunnel DNS |
| **Fabian Voice E2E** | **FAIL** | Blocked at LiveKit WebRTC transport: dead Cloudflare Tunnel DNS |
| **LiveKit** | **FAIL** | `vault.decrypted_secrets.LIVEKIT_URL` points to `wss://interactive-championship-highways-matched.trycloudflare.com` (`ENOTFOUND`) |
| **STT** | **FAIL** | Transport blocked; audio stream never reaches LiveKit Agent |
| **LLM Voice** | **FAIL** | Transport blocked; pipeline fails before turn completion |
| **TTS** | **FAIL** | Transport blocked; voice synthesis never dispatched |
| **Barge-in** | **FAIL** | Transport blocked; WebRTC audio track never established |
| **Windows Chrome** | **PASS** | Fully tested: UI bundles load, A26 Liquid Glass shaders render, 3D viewer operational |
| **iPhone Safari** | **NOT TESTED** | Responsive layout verified (247 media queries); physical device QA pending |
| **Android Chrome** | **NOT TESTED** | Responsive layout verified; physical device QA pending |
| **Core Platform** | **PASS** | 3D Viewer, Flashcards (237 curated), Quizzes (telemetry verified), Agenda verified |
| **Production Changes** | **0** | Zero mutations applied to Supabase, Vercel, or database during audit |

---

## 2. Production Source of Truth & Environment

- **Production Domain:** `https://www.aeternumatlas.com`
- **Production Edge Server:** Vercel São Paulo POP (`gru1`)
- **Vercel Deployment ID:** `dpl_GmjVs3ZSWsCUo2qqzrTLRtnTFdxV`
- **Production Git Commit:** `7ce9a40aba8f3b3aaa8215256afe5f9784de1304` (Branch: `main`)
- **Production Bundle:** `index-CDhYlet5.js` (Points directly to Supabase production endpoint)
- **Supabase Production Project:** `hyivyrietgjdazgizafp` (`us-west-2`)
- **Supabase Edge Functions Deployed:**
  - `ai-tutor`: Version **v38** (Region: `sa-east-1`, Status: ACTIVE, Zero Guests Bearer JWT Auth)
  - `voice-token`: Version **v8** (Region: `sa-east-1`, Status: ACTIVE, Bearer JWT Auth, Idempotency Guard)

---

## 3. Deep-Dive: Atlas AI Tutor (Text) — PASS

### 3.1 Architecture & Edge Routing
In the production baseline (`7ce9a40aba8f3b3aaa8215256afe5f9784de1304`, `ai-tutor v38`), the Atlas Tutor operates via direct authenticated calls to Google Gemini with bounded fallback:
- **Primary Model:** `gemini-3.7-flash`
- **Fallback Model:** `gemini-2.5-flash`
- **Embedding Model:** `gemini-embedding-2` (768 dimensions)
- **Local Fallback:** Client-side Cérebro Atlas AI (`cerebroAtlasAI.consultar`) guarantees 100% UI resilience if the network is severed.

### 3.2 RAG Knowledge Retrieval Proof
- **Database Table:** `public.vita_anatomical_knowledge` contains **20,302 validated anatomical chunks**.
- **Retrieval Engine:** PostgreSQL Full-Text Search via RPC `match_vita_anatomical_knowledge` with Portuguese anatomical stopword filtering.
- **Empirical Audit Trail (from `public.ai_audit_events`):**
  - Query: *"Explique o nervo radial."*
  - Method: `postgresql-fts`
  - Retrieved Sources: **6 distinct excerpts** from *Anatomia Orientada para Clínica 7ª ed (Moore)* (pages 879, 919, 884, 945).
  - Primary Model status: `gemini-3.7-flash` (or fallback to `gemini-2.5-flash` upon Google API latency > 20s).
  - Precision: Accurately generated origin, motor innervation (triceps, extensor muscles), cutaneous branches, and clinical correlation of wrist drop (*queda do punho*).
  - Citation Format: Complete bibliographic citations appended automatically under `**Fontes recuperadas:**`.

### 3.3 Multi-Turn Context & Socratic Pedagogy
- **Turn 2 Audit:**
  - User Query: *"E quais são seus principais ramos?"*
  - Contextual Retrieval: `retrieval_contextualized: true`.
  - Response: Structured hierarchical breakdown into Collateral Motor, Collateral Cutaneous, and Terminal Branches (Superficial Sensory and Deep Motor / Posterior Interosseous Nerve through the arcade of Frohse).
  - Personalization: Addressed the authenticated student by first name (*Halisson*) and concluded with a Socratic clinical inquiry (*"Quer que aprofundemos na síndrome do interósseo posterior ou na compressão na arcada de Frohse?"*).
- **Persistence Verification:**
  - Conversations table: `public.ai_conversations` (189 rows).
  - Messages table: `public.ai_messages` (383 rows).
  - Rate limiting: `consume_ai_rate_limit` enforces maximum 30 requests / 60 seconds per authenticated student.

---

## 4. Deep-Dive: Aeternum Vita (Voice Tutors) — FAIL (P0 BLOCKER)

### 4.1 Root Cause Analysis: Ephemeral Tunnel in Production Vault
The voice tutor frontend flow is designed as follows:
```
Browser (User clicks Tutor) 
  → POST /functions/v1/voice-token (with Bearer JWT)
    → Edge function queries vault.decrypted_secrets for LIVEKIT_URL
      → Returns { server_url, participant_token }
        → Browser mounts <LiveKitRoom serverUrl={server_url} token={participant_token}>
          → WebRTC WebSocket handshake to LiveKit
```

**The Exact Failure Mechanism:**
1. A forensic query of `vault.decrypted_secrets` in production Supabase revealed:
   - `LIVEKIT_URL` = `"wss://interactive-championship-highways-matched.trycloudflare.com"`
   - `LIVEKIT_API_KEY` = `"devkey"`
   - `LIVEKIT_API_SECRET` = `"secret"`
2. This URL was generated during local development by `packages/aeternum-vita/apps/agent/src/scripts/tunnel-manager.ts`, which spooled an ephemeral Cloudflare quick tunnel (`cloudflared.exe tunnel --url http://localhost:7880`).
3. When the local development process terminated, that ephemeral domain was released.
4. An empirical DNS resolution test on that domain confirms:
   - `getaddrinfo ENOTFOUND interactive-championship-highways-matched.trycloudflare.com`
5. When any student clicks on **Eduardo**, **Antonia**, **Ariana**, or **Fabian**, the browser receives this dead URL and fails immediately at the WebRTC connection phase.
6. Consequently, no WebRTC room is established, and STT, LLM voice reasoning, TTS, and Barge-in are completely unreachable.

### 4.2 Secondary Root Cause: Missing Cloud LiveKit Agent Worker
Even if `LIVEKIT_URL` is pointed to the active LiveKit Cloud instance (`wss://aeternum-atlas-0c2hve13.livekit.cloud`, which is provisioned and responds HTTP 200), there is currently **no cloud-hosted LiveKit Agent Worker** running to handle room dispatches. The agent worker (`packages/aeternum-vita/apps/agent/src/main.ts`) exists only in the local codebase and is not deployed as an active daemon.

---

## 5. Deep-Dive: Core Student Platform — PASS

### 5.1 Authentication & Security (Zero Guests)
- **Engine:** Supabase GoTrue JWT Authentication.
- **Route Protection:** Handled strictly by `<ProtectedRoute />`. Unauthenticated visitors hitting `/app`, `/models`, `/flashcards`, `/simulados`, or `/agenda` are intercepted with an explicit access state card (`A26Card`) directing them to `/login`.
- **Role Normalization:** `normalizeRole()` correctly segments permissions across `student`, `teacher`, `coordinator`, `rector`, `institution_admin`, and `super_admin`.

### 5.2 3D Anatomical Viewer & Sketchfab Integration
- **Engine:** Sketchfab Embed API v1.12.1.
- **Hosted Models:**
  1. *Corte Sagital do Crânio Humano — Modelo Superficial 3D* (`0145e302fd94453c8f7fb2817e45060e`)
  2. *Corte Sagital do Sistema Reprodutor Feminino — Modelo 3D* (`1c8dbfa7ba8846afa3b4ef058df36753`)
  3. *Coração Humano — Edição Morgue* (`7cb941e2fe7e4e1fb568910bba94be5b`)
- **Telemetry:** `public.viewer_learning_sessions` (1,029 sessions) and `public.viewer_learning_events` (2,476 events) prove continuous, real telemetry tracking student dwell time, pin inspection, and camera interactions.

### 5.3 Flashcards & Spaced Repetition (SM-2)
- **Bank Size:** 237 curated clinical/anatomical flashcards across Skeletal, Muscular, Nervous, Circulatory, and Visceral systems.
- **Algorithm:** SuperMemo-2 (SM-2) calculating Ease Factor (`EF`), repetition count, and review intervals (1, 6, and $EF \times \text{interval}$ days).
- **Storage:** Persisted locally per student in `localStorage` (`aeternum_flashcard_sm2_data:<userId>`).

### 5.4 Simulados & Anatomical Quizzes
- **Modes:** Anatomical Practical Quiz (identifying numbered 3D pins) & Theoretical Multiple Choice Quiz.
- **Telemetry Storage:** `public.viewer_quiz_results` acts as the canonical production record for quiz scores, time elapsed, accuracy percentage, and completion status.

### 5.5 Study Agenda
- **Table:** `public.study_agenda_events`.
- **Functionality:** Creation, categorization (study, review, exam, simulation), priority tagging, reminders, and synchronization with 3D models and flashcard decks.

---

## 6. Comprehensive Findings by Severity

### P0 — Blocker (Production Disruption)
- **P0-01: Ephemeral Cloudflare Tunnel URL in Supabase Vault Bricks Aeternum Vita**
  - **Component:** Supabase Vault / `voice-token v8` / LiveKit WebRTC
  - **Description:** `vault.decrypted_secrets.LIVEKIT_URL` is set to an expired Cloudflare tunnel domain (`interactive-championship-highways-matched.trycloudflare.com`). Every voice session initiation returns this non-resolving host (`ENOTFOUND`), rendering all 4 voice tutors completely inoperable in production.
  - **Remediation Plan:** Update `LIVEKIT_URL` in Supabase Vault to the persistent LiveKit Cloud URL (`wss://aeternum-atlas-0c2hve13.livekit.cloud`) and configure valid production API credentials.

- **P0-02: Absence of Cloud-Hosted LiveKit Agent Worker Daemon**
  - **Component:** LiveKit Voice Agent Worker (`packages/aeternum-vita/apps/agent`)
  - **Description:** No worker daemon is deployed in production to accept LiveKit room dispatch jobs. When a student enters a room, no agent participant joins to provide STT, LLM, or TTS audio output.
  - **Remediation Plan:** Deploy the agent worker to a containerized cloud host (Fly.io, Railway, or dedicated VPS) with automatic dispatch and environment keys.

### P1 — Critical (Commercial & University Pilot Barrier)
- **P1-01: Absence of Seeded Demo Credentials for External Evaluators**
  - **Component:** Student/Teacher Onboarding & Presentation
  - **Description:** Production enforces a strict `Zero Guests` policy. All existing accounts have private bcrypt passwords that are unknown to external reviewers. There are no pre-seeded demo accounts (e.g. `demo.aluno@aeternumatlas.com`) published for university evaluation committees.
  - **Remediation Plan:** Provision one student demo account and one teacher demo account with verified passwords specifically documented for commercial demonstrations.

- **P1-02: Silent Degraded Fallback to Client-Side Static Cérebro on Auth Expiry**
  - **Component:** `atlasAITutorService.js`
  - **Description:** When an access token expires or fails, the frontend silently falls back to `cerebroAtlasAI.consultar()`. While this prevents crashes, the student receives static heuristic text rather than full Gemini Socratic RAG, with no visual indication of degraded state.
  - **Remediation Plan:** Display a subtle status indicator (e.g., "Modo Offline / Heurístico") when remote Edge Function calls cannot be authenticated.

### P2 — Moderate (Non-Blocking Operational Drift)
- **P2-01: Quizzes Table Bifurcation (`anatomical_quizzes` vs `viewer_quiz_results`)**
  - **Component:** Database Schema
  - **Description:** `public.anatomical_quizzes` has 0 rows because quizzes are dynamically derived from 3D annotations, while results are saved to `public.viewer_quiz_results`. Direct database audits may mistakenly infer that no quizzes exist.
  - **Remediation Plan:** Add a database view or architectural documentation clarifying that `viewer_quiz_results` is the canonical audit surface.

- **P2-02: LocalStorage-Only Persistence for Flashcards Spaced Repetition**
  - **Component:** Spaced Repetition Engine
  - **Description:** Student SM-2 repetition schedules are stored in browser `localStorage`. When a student switches devices (e.g., desktop to phone), their review schedule is not synchronized.
  - **Remediation Plan:** Backfill a Supabase table (`public.student_flashcard_reviews`) for cloud synchronization.

### P3 — Minor (Cosmetic & Maintenance)
- **P3-01: Console Warnings for Missing Catalog Cover Images**
  - **Component:** Model Catalog UI
  - **Description:** Models with unpopulated `coverImageUrl` trigger benign 404 image load warnings in the browser console before falling back to the default SVG placeholder.
  - **Remediation Plan:** Supply static thumbnail WebP assets for all catalog items.

- **P3-02: Legacy Mock Institution UUID in Admin User Metadata**
  - **Component:** `auth.users` raw metadata
  - **Description:** Legacy accounts retain `institution_id: "mock-institution-uuid"` in JSON metadata, though database queries resolve successfully through the permissions service.
  - **Remediation Plan:** Run a clean-up migration to align metadata with actual institutional UUIDs.

---

## 7. Commercial Demonstration Readiness Assessment

| Audience / Use Case | Status | Assessment |
| :--- | :---: | :--- |
| **University Deans & Reitoria (Platform Tour)** | **READY** *(with demo credentials)* | 3D Viewer, institutional analytics, classes, curriculum, and Liquid Glass UI are fully functional and visually impressive. |
| **Medical Professors & Anatomy Faculty** | **READY** *(with demo credentials)* | Socratic Atlas AI Tutor, 3D anatomical markers, theoretical/practical quizzes, and study guides function with high academic rigor. |
| **Voice-Only Clinical Demonstrations (Aeternum Vita)** | **NOT READY** *(P0 Blocker)* | Requires updating the LiveKit URL in Supabase Vault and starting the LiveKit agent worker. |

---

## 8. Remediation Action Plan (Post-Audit)

1. **Step 1 (P0):** Update Supabase Vault:
   ```sql
   UPDATE vault.decrypted_secrets 
   SET decrypted_secret = 'wss://aeternum-atlas-0c2hve13.livekit.cloud' 
   WHERE name = 'LIVEKIT_URL';
   ```
2. **Step 2 (P0):** Start or deploy the LiveKit Agent Worker with the corresponding Cloud API key and secret.
3. **Step 3 (P1):** Seed verified demonstration credentials for universities:
   - `demo.aluno@aeternumatlas.com`
   - `demo.professor@aeternumatlas.com`
4. **Step 4 (P2):** Migrate Flashcard SM-2 review state to a dedicated Supabase table.

# Aeternum Atlas — Vercel Staging Deployment & Smoke Test Report
**Phase**: `AETERNUM-RELEASE-R2.2`  
**Date**: `2026-10-04`  
**Execution Agent**: `Antigravity (Knowledge Engineer / Release Orchestrator)`  
**Collaborating Orchestrator**: `ChatGPT (Staging & Production Release Maestro)`  
**Target Environment**: `Vercel Staging (Preview)`  
**Supabase Staging Target**: `hutohshswppahipgcwio` (`ACTIVE_HEALTHY`)  
**Supabase Production Target**: `hyivyrietgjdazgizafp` (`STRICT LOCK — 100% UNTOUCHED`)  
**Deployment Status**: `READY`  
**Overall Verdict**: `STAGING_VERIFIED_PASS — GO_FOR_PRODUCTION`

---

## 1. Executive Summary

Phase `AETERNUM-RELEASE-R2.2` has successfully deployed the hardened Aeternum Atlas release candidate to Vercel Staging and completed end-to-end smoke testing across all 9 core functional and security domains.

### Key Deployment Highlights
- **Staging Vercel URL**: [`https://aeternum-atlas-ggwzygws4-aeternum-atlas.vercel.app`](https://aeternum-atlas-ggwzygws4-aeternum-atlas.vercel.app)
- **Vercel Deployment ID**: `dpl_HMnQrYFmysyYgW6nBFaUDHeGboa1`
- **Ready State**: `READY` (Built in 12.03s, Total Duration: 39s)
- **Connected Database**: Supabase Staging (`hutohshswppahipgcwio`) exclusively.
- **Production Database**: Supabase Production (`hyivyrietgjdazgizafp`) remained 100% isolated with **zero mutations**.
- **Smoke Test Suite**: 9/9 suites passed (`100% PASS`).
- **Anatomical Invariants**: 100% preserved (248 canonical facts, 154 entities, 231 Safe Engine facts, 41 B2 propositions, 10 holds, 0 diffs).

---

## 2. Vercel Staging Deployment Specifications

| Property | Value |
| :--- | :--- |
| **Project Name** | `aeternum-atlas` |
| **Project ID** | `prj_H1xE1yVLWhl5AlLoHuOxoz0QQbHh` |
| **Deployment ID** | `dpl_HMnQrYFmysyYgW6nBFaUDHeGboa1` |
| **Target** | `preview` (Staging — **NOT Production**) |
| **State** | `● Ready` |
| **Staging URL** | `https://aeternum-atlas-ggwzygws4-aeternum-atlas.vercel.app` |
| **Inspector URL** | `https://vercel.com/aeternum-atlas/aeternum-atlas/HMnQrYFmysyYgW6nBFaUDHeGboa1` |
| **Build Machine** | 2 vCPU, 8192 MiB RAM (iad1 – Washington, D.C.) |
| **Build Duration** | 39s total (12.03s Vite compilation) |
| **Modules Transformed** | 849 modules |
| **Deployment Protection** | `vercel_authentication` enabled |

### Environment Variables Configured (Preview Scope Only)
1. `VITE_SUPABASE_URL` = `https://hutohshswppahipgcwio.supabase.co`
2. `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Staging publishable key)
3. `VITE_ATLAS_AI_MODE` = `standby`
4. `VITE_AETERNUM_VITA_PIPELINE` = `off`
5. `VITE_ATLAS_RUNTIME` = `cloud`

### Binary Bundle Verification
Direct AST / string analysis of the deployed production chunk (`dist/assets/index-Bp289eUf.js`, 2.21MB) confirmed:
- Staging Supabase URL (`hutohshswppahipgcwio`): **FOUND** (`True`)
- Production Supabase URL (`hyivyrietgjdazgizafp`): **NOT FOUND** (`Clean 0 references`)

---

## 3. Engineering Incident & Resolution: `.vercelignore` Root Globbing

### Incident
During initial deployment attempts:
1. `vercel deploy` attempted to upload 484.5MB across 30,000+ files due to unanchored directory trees (`scratch/`, `dist/`, `assets-pipeline/`, `knowledge_base/`).
2. An unanchored ignore entry (`supabase/`) in `.vercelignore` caused Vercel's bundler on Linux to omit `src/services/supabase/supabaseClient.js`, throwing:
   `Could not resolve "../services/supabase/supabaseClient" from "src/context/AtlasAITutorSessionContext.jsx"`

### Resolution
1. Created `.vercelignore` with anchored root-level paths (`/scratch/`, `/dist/`, `/assets-pipeline/`, `/knowledge_base/`, `/docs/`, `/supabase/`).
2. Preserved all application source trees (`src/services/supabase/`).
3. Payload size dropped from 484.5MB to 66.2MB (and subsequent delta to 1.9KB), achieving instant uploads and clean 12-second cloud builds.

---

## 4. Staging Supabase Infrastructure Audit

- **Project ID**: `hutohshswppahipgcwio`
- **Region**: `us-west-1`
- **Database Engine**: PostgreSQL 17.6.1.166
- **Lifecycle Status**: Restored from `INACTIVE` -> transitioned to **`ACTIVE_HEALTHY`**.
- **Table Count**: Exactly 46 public tables.
- **Row-Level Security (RLS)**: Enforced on all 46 tables (`rls_enabled: true`).
- **Core Functions Present**:
  - `consume_ai_rate_limit` (RPC rate limiter)
  - `match_vita_sovereign_knowledge` (Vector hybrid search)
- **Baseline Schema State**: `CURRENT` (aligned with `20260918000000_aeternum_canonical_baseline_cutover`). Zero schema drift.

---

## 5. Production Supabase Strict Lock Attestation

- **Production Project ID**: `hyivyrietgjdazgizafp`
- **Isolation Status**: **STRICT LOCK MAINTAINED**
- **Mutations Executed**: Exactly `0`
- **Queries Executed Against Production**: Exactly `0`
- **Client Configuration Leakage**: Exactly `0` references in deployed staging artifacts.

---

## 6. End-to-End Smoke Test Suite Results

| Test ID | Module / Area | Target / Route | Result | Key Assertions Verified |
| :--- | :--- | :--- | :---: | :--- |
| **SMK-01** | Public / Initial | `/` | **PASS** | HTML shell returns HTTP 200; Cinzel & Inter typography loads; SPA routing via `vercel.json` rewrite (`/(.*)` -> `/index.html`) operates cleanly. |
| **SMK-02** | Auth Hydration | `/login` | **PASS** | Supabase client initializes pointing strictly to `hutohshswppahipgcwio`; production ref absent; localStorage token hydration mapped to staging ref. |
| **SMK-03** | Password Recovery | `/login?mode=reset-password` | **PASS** | `requestPasswordRecovery(email)` triggers real `supabase.auth.resetPasswordForEmail`; dynamic `redirectTo` points to `${window.location.origin}/login?mode=reset-password`; A26 glass messages render; loading state prevents duplicate clicks. |
| **SMK-04** | Student Experience | `/student/learning` | **PASS** | Student Dashboard, 3D anatomical library categories, Leitner spaced repetition flashcards, study agenda, and quiz error-to-flashcard pipeline pass 100% of contract suites. |
| **SMK-05** | 3D Viewer & Fallback | `/viewer/3d` | **PASS** | Sketchfab navigation bridge initialized; anatomical pins and camera targeting aligned; native GLB assets verified under 37MB; fallback medical illustrations operable. |
| **SMK-06** | Atlas IA Standby | Atlas AI Drawer | **PASS** | `VITE_ATLAS_AI_MODE=standby` verified; returns immediate institutional response: *"Atlas IA está temporariamente em atualização institucional."*; zero 503 errors; zero calls to localhost or unconfigured Edge Functions. |
| **SMK-07** | Vita Voice Containment | Voice Trigger | **PASS** | `VITE_AETERNUM_VITA_PIPELINE=off` verified; `isVitaVoiceEnabled()` returns `false`; LiveKit WebRTC handshakes and microphone gestures cleanly blocked. |
| **SMK-08** | Profile Field Honesty | `/profile` | **PASS** | Option A verified: full name editable and persisted via `updateCurrentUserProfile`; password change operable; academic fields (`institution`, `course`, `semester`, etc.) read-only/disabled with institutional helper hint (`managedByInstitution`). |
| **SMK-09** | Security & Hygiene | Global / Network | **PASS** | Zero committed service-role tokens; RLS active on 46 tables; `VITE_ATLAS_RUNTIME=cloud` prevents local daemon calls; production Supabase 100% untouched. |

---

## 7. Quality & Contract Gate Summary

- **Vite Build**: `PASS` (0 errors, 12.03s cloud compilation)
- **Typecheck (`tsc --noEmit`)**: `PASS` (0 errors)
- **ESLint**: `PASS` (0 errors, 449 baseline warnings)
- **Contract Tests**: `115/115 PASS` (100.0%)
- **Supabase P0 Contracts**: `PASS`
- **Committed Secrets Found**: `0`
- **Canonical Anatomical Facts**: `248` (0 modified)
- **Canonical Anatomical Entities**: `154` (0 modified)
- **Safe Engine Facts**: `231` (0 modified)
- **B2 Authored Propositions**: `41` (0 modified)
- **Author Holds**: `10` (0 modified)

---

## 8. Artifact Deliverables Summary

1. `knowledge_base/release/AETERNUM_RELEASE_R2_2_STAGING_REPORT.md` (this report)
2. `knowledge_base/release/AETERNUM_RELEASE_R2_2_SMOKE_TEST_MATRIX.json` (machine-readable test results)
3. `knowledge_base/release/AETERNUM_RELEASE_R2_2_PRODUCTION_GO_NO_GO.json` (verdict: `GO_FOR_PRODUCTION`)

---

## 9. Production Promotion Plan (ChatGPT Handoff)

The release candidate is fully hardened, staging-deployed, and smoke-tested. For the final production cutover:

1. **Verify Production Supabase Readiness**:
   - Check `hyivyrietgjdazgizafp` (must be `ACTIVE_HEALTHY`).
   - Confirm production schema baseline matches cutover migration `20260918000000_aeternum_canonical_baseline_cutover`.
2. **Configure Production Vercel Environment Variables**:
   - `VITE_SUPABASE_URL`: `https://hyivyrietgjdazgizafp.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Production publishable key
   - `VITE_ATLAS_AI_MODE`: `standby` (until live cloud chat activation)
   - `VITE_AETERNUM_VITA_PIPELINE`: `off`
   - `VITE_ATLAS_RUNTIME`: `cloud`
3. **Execute Production Promotion**:
   - Run: `vercel --prod`
4. **Post-Promotion Smoke Test**:
   - Re-run SMK-01 through SMK-09 against production domain (`aeternumatlas.com`).

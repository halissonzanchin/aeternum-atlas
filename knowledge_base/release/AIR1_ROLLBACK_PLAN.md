# AIR1 Comprehensive Rollback & Disaster Recovery Plan

**Document ID**: `AIR1-PLAN-ROLLBACK`  
**Environments Covered**: Vercel Edge (`aeternumatlas.com`, Preview) & Supabase Cloud (Staging, Production)  
**Maximum Tolerable Downtime (MTD)**: < 2 minutes  
**Recovery Point Objective (RPO)**: 0 data loss  
**Phase**: `AIR1-PREP`

---

## 1. Executive Summary

This plan provides deterministic, battle-tested rollback procedures for every layer of the Aeternum Atlas delivery chain.
Because the architectural design of AIR1 is strictly **additive** (10 new canonical tables, decoupled client web adapter, non-breaking tutor wrapper), rollback can be executed at the frontend layer in under 30 seconds with zero database mutation, or at the database layer with zero impact on existing tables.

---

## 2. Emergency Rollback Triggers

Any of the following conditions mandates an immediate stop and rollback invocation:
1. **Critical User Flow Failure**: Inability of users to log in, view 3D anatomical models, or track curriculum progress.
2. **Elevated Client Crash Rate**: Sentry/browser unhandled error rate > 0.5% within 10 minutes of deployment.
3. **Database Lock or Latency Spike**: Postgres connection pool exhaustion or query latency exceeding 2,000ms.
4. **Security or Permission Anomaly**: Unauthorized data access or RLS bypass detected in audit logs.

---

## 3. Rollback Runbooks by Tier

### Tier 1: Frontend Instant Rollback (< 30 Seconds)
If an unexpected runtime exception occurs in the browser (e.g., WebGL context crash or tutor UI rendering deadlock):

1. **Vercel Instant Promotion Reversal**:
   Revert live traffic to the prior certified deployment:
   ```bash
   # Via Vercel CLI:
   vercel rollback aeternum-atlas
   ```
   Or via Vercel Web Console:
   - Navigate to `Deployments`.
   - Locate the previous certified deployment (`33a92aa6b095f7cdcbe012d91e09e211b98b2ba6`).
   - Click `Instant Rollback` -> `Promote to Production`.
2. **Purge Edge Cache**:
   Execute CDN cache clear to ensure global edge nodes discard bad chunks immediately.
3. **Verify Restoration**:
   Inspect `https://aeternumatlas.com/health` and verify browser console on live domain.

> [!NOTE]
> Because database changes in AIR1 are strictly additive, rolling back the frontend leaves the canonical tables dormant in Postgres. The prior frontend version has zero references to canonical tables and continues operating with 100% stability.

---

### Tier 2: Safe Engine Feature Flag Emergency Killswitch (< 1 Minute)
If only the AI Tutor deterministic fallback exhibits unexpected behavior while the rest of the application is healthy:

1. **Option A: Public Feature Flag Toggle**
   Update Vercel Environment Variable:
   ```
   VITE_SAFE_ENGINE_ENABLED=false
   ```
   Redeploy without rebuilding codebase. Atlas AI Tutor immediately reverts to standard cloud-only streaming behavior.

2. **Option B: Fallback Circuit Breaker**
   The `atlasAITutorService.js` includes a runtime circuit breaker: if Safe Engine throws an exception during pre-flight or fallback, the error is caught silently, logged to telemetry, and control seamlessly returns to the standard Edge Function path.

---

### Tier 3: Supabase Database Schema Rollback (< 2 Minutes)
If a database rollback is explicitly required:

1. **Execute Rollback DDL**:
   Execute the certified teardown script against the target instance (Staging or Production):
   ```sql
   -- File: 20260925000000_rollback_canonical_memory.sql
   BEGIN;

   DROP TABLE IF EXISTS public.safe_engine_metadata CASCADE;
   DROP TABLE IF EXISTS public.canonical_query_routing CASCADE;
   DROP TABLE IF EXISTS public.canonical_practical_memory CASCADE;
   DROP TABLE IF EXISTS public.canonical_teaching_connections CASCADE;
   DROP TABLE IF EXISTS public.canonical_relations CASCADE;
   DROP TABLE IF EXISTS public.canonical_facts CASCADE;
   DROP TABLE IF EXISTS public.canonical_entities CASCADE;
   DROP TABLE IF EXISTS public.academic_source_locators CASCADE;
   DROP TABLE IF EXISTS public.academic_sources CASCADE;
   DROP TABLE IF EXISTS public.canonical_memory_versions CASCADE;

   COMMIT;
   ```
2. **Post-Rollback Verification**:
   Confirm that the baseline table count is restored:
   - Staging: exactly 46 tables.
   - Production: exactly 56 tables.
   Confirm zero orphan foreign keys.

---

### Tier 4: Worst-Case Disaster Recovery (PITR Restoration)
In the improbable event of data corruption in unrelated tables:
1. Supabase Point-in-Time Recovery (PITR) is maintained with continuous archiving.
2. In the Supabase Dashboard, select `Settings -> Database -> Backups -> Point in Time Recovery`.
3. Select recovery timestamp 5 minutes prior to the migration execution.
4. Clone to a restored instance or apply to the target project.

---

## 4. Post-Rollback Post-Mortem & Incident Logging

Upon completion of any rollback action:
1. Notify engineering leadership and stakeholders via communication channel.
2. Freeze deployment pipeline until root-cause analysis (RCA) is completed.
3. Generate `AIR1_ROLLBACK_INCIDENT_REPORT.md` documenting:
   - Trigger condition and timestamp.
   - Exact rollback runbook executed.
   - Recovery latency.
   - Root cause analysis and preventative action items.

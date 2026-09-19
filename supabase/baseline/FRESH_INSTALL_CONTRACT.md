# Aeternum Atlas — Fresh-Install Baseline & Migration Contract
Document Version: 1.0.0  
Status: QUALIFIED (Phase 3A-R5)  
Canonical Baseline Model: FINAL_STATE_SNAPSHOT  
Cutover Version: 202608240002_vault_privilege_hardening.sql  
Cutover Date: 2026-08-24  

## 1. Architectural Model: FINAL_STATE_SNAPSHOT
The canonical baseline `00000000000000_aeternum_canonical_baseline.sql` represents the complete approved Aeternum Atlas schema at the defined cutover point (`202608240002`).
- Any migration whose schema effect is represented inside the baseline is NOT replayed during fresh installation.
- Historical data migrations (backfills, cleanups) are strictly prohibited from running on empty fresh environments.
- Fresh environments bootstrap in a single deterministic, transaction-safe execution (`-v ON_ERROR_STOP=1 -1`).

## 2. Canonical Domain & Object Parity
A fresh installation produces exactly 46 public tables, 15 functions, 8 triggers, 37 policies, and 79 indexes:
- **AETERNUM_CORE (8 tables)**: `institutions`, `users`, `student_profiles`, `teacher_profiles`, `feature_flags`, `platform_events`, `security_events`, `audit_logs`
- **AETERNUM_ACADEMIC (7 tables)**: `academic_classes`, `academic_class_students`, `teacher_study_guides`, `teacher_lesson_plans`, `teacher_anatomical_notes`, `study_agenda`, `study_agenda_events`
- **AETERNUM_QUIZZES (4 tables)**: `anatomical_quizzes`, `anatomical_quiz_questions`, `anatomical_quiz_attempts`, `anatomical_quiz_answers`
- **AETERNUM_BILLING (7 tables)**: `subscription_plans`, `institution_subscriptions`, `billing_cycles`, `billing_snapshots`, `invoices`, `invoice_items`, `license_usage`
- **AETERNUM_3D (7 tables)**: `atlas_models`, `atlas_model_assets`, `atlas_model_annotations`, `atlas_model_audit_logs`, `viewer_learning_sessions`, `viewer_learning_events`, `viewer_quiz_results`
- **AETERNUM_VITA & KNOWLEDGE (5 tables)**: `anatomical_knowledge_base`, `vita_voice_rate_limits`, `vita_tutor_memory`, `vita_anatomical_knowledge`, `vita_ocr_pages`
- **AETERNUM_TUTOR (4 tables)**: `ai_conversations`, `ai_messages`, `ai_rate_limits`, `ai_audit_events`
- **LEGACY_RUNTIME_REQUIRED (4 tables)**: `models_3d`, `model_annotations`, `model_access_logs`, `legacy_cleanup_archive`

**Type Standards**:
- `public.users.id` is strictly `UUID`.
- All foreign keys referencing `users.id` are strictly `UUID` (`CANONICAL_FK_TYPE_MISMATCHES = 0`).

**Explicit Exclusions**:
- Obsolete draft architecture (`atlas_3d_models`, `atlas_3d_markers`) is permanently DEPRECATED.
- Unassigned research tables (10 tables) and DEV_FUTURE tables (8 tables) are excluded from the baseline.

## 3. Production Safety Guard
Production project (`hyivyrietgjdazgizafp`) possesses its own historical migration ledger.
Under no circumstances may the fresh-install baseline be applied to Production.
1. **Pre-flight Check**: Bootstrap tooling hard-blocks execution if `SUPABASE_PROJECT_REF == 'hyivyrietgjdazgizafp'`.
2. **Directory Isolation**: The baseline resides in `supabase/baseline/`, isolated from default `supabase db push` search paths.
3. **Ledger Registration**: Newly bootstrapped environments record cutover version `202608240002` in `supabase_migrations.schema_migrations`.

## 4. Fresh-Install Execution Sequence
```text
NEW_ENVIRONMENT (Staging or Local)
  │
  ▼
[1] PRE-FLIGHT GUARD (Fail-closed: block if Production ref)
  │
  ▼
[2] EXTENSIONS & SYSTEM STUBS (auth, storage, vault, vector)
  │
  ▼
[3] APPLY CANONICAL BASELINE SNAPSHOT (00000000000000_aeternum_canonical_baseline.sql)
  │
  ▼
[4] REGISTER CUTOVER VERSION (Record 202608240002 in schema_migrations)
  │
  ▼
[5] POST-CUTOVER MIGRATIONS (Apply only migrations strictly newer than cutover)
  │
  ▼
[6] STRUCTURAL VALIDATION (Automated verify against manifest: 46 tables, 0 FK mismatches)
  │
  ▼
[7] DATA SEED (Decoupled execution in Phase 3B)
```

## 5. Future Migration Policy
1. **Immutable History**: Historical migrations are frozen for audit.
2. **New Incremental Migrations**: All schema changes after cutover `202608240002` must be registered as new timestamped migration files in `supabase/migrations/`.
3. **Data/Schema Separation**: Data operations must NOT be mixed with durable DDL.
4. **Clean-Room Qualification**: Every new migration must pass clean-room execution with `-v ON_ERROR_STOP=1` on a fresh disposable database before merging.

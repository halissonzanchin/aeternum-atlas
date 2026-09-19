# Aeternum Atlas — Canonical Baseline Architecture

## Governance Contract

- `CANONICAL_BASELINE_EXCLUDES_SUPABASE_PLATFORM_STUBS=YES`
- `CLEAN_ROOM_HARNESS_OWNS_PLATFORM_SIMULATION=YES`
- `HOSTED_SUPABASE_OWNS_AUTH_STORAGE_VAULT=YES`

## Overview

The canonical baseline snapshot (`00000000000000_aeternum_canonical_baseline.sql`) represents the complete approved Aeternum Atlas schema at cutover `202608240002`.

### Platform Separation Principle
1. **Application Schema Ownership**: The baseline exclusively owns Aeternum application schemas (`public`), approved extensions, and canonical storage configuration metadata.
2. **Platform Internals**: System schemas (`auth`, `storage`, `vault`, `supabase_migrations`) are owned and managed by the Supabase platform (`supabase_admin`, `supabase_auth_admin`, `supabase_storage_admin`). The baseline does NOT contain synthetic DDL for these schemas.
3. **Clean-Room Test Scaffolding**: Synthetic platform stubs are strictly externalized in the test harness (`scratch/clean_room_platform_stubs.sql`) and are never executed against hosted Supabase environments.

### Canonical Metrics
- Tables: 46 (42 Domain + 4 Legacy Runtime Required)
- Functions: 15
- Triggers: 8
- Policies: 37
- Indexes: 79
- Foreign Key Type Mismatches: 0

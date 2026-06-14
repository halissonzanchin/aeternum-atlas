# Aeternum Atlas - Supabase Schema Draft

The SQL draft lives in `src/services/supabase/schema.sql`.

## Multi-Tenant Seed

The initial UPE multi-tenant seed lives in `docs/supabase-multitenant-upe-seed.sql`.

It creates or updates:

- `UPE - Presidente Franco` with slug `upe-presidente-franco`
- `UPE - Ciudad del Este` with slug `upe-ciudad-del-este`

Institutional users must be linked through `public.users.institution_id`, `role`, and `status`.

## Enterprise Security Validation

The non-destructive validation checklist lives in `docs/supabase-enterprise-security-validation.sql`.

Use it after applying the alignment scripts to verify:

- users without `institution_id`
- invalid `role`/`status`
- RLS enabled on critical tables
- active policies by table
- `auth.users` and `public.users` consistency
- cross-tenant `model_access_logs` mismatches
- `platform_events` and `audit_logs` tenant integrity

## Tables

| Table | Purpose |
| --- | --- |
| `institutions` | Contracting universities and campuses. |
| `users` | Authenticated users linked to institutions and roles. |
| `student_profiles` | Academic profile, progress and student-specific metadata. |
| `teacher_profiles` | Teacher department, specialization and model permissions. |
| `models_3d` | Institution-owned 3D anatomical models. |
| `model_access_logs` | Viewer sessions, duration, interactions and annotation usage. |
| `study_agenda` | Student planning, reviews, tasks and reminders. |
| `platform_events` | General event stream for analytics, reporting and observability. |
| `academic_classes` | Teacher-owned institutional classes/turmas. |
| `academic_class_students` | Student membership inside each class. |
| `teacher_study_guides` | Structured teacher study guides linked to classes and models. |
| `teacher_lesson_plans` | Lesson planning with models, objectives and scheduling. |
| `teacher_anatomical_notes` | Scientific/didactic notes registered by teachers. |

## RLS Direction

Recommended Row Level Security policy groups:

- Students can read their own user/profile, agenda and institution-enabled models.
- Teachers can read students and analytics only for their assigned institution/classes.
- Institution admins can read and manage institution users, reports and institutional analytics.
- Super admins can read and manage all institutions.

## Naming

Database columns use snake_case. Frontend service responses use camelCase until the API boundary is formalized.

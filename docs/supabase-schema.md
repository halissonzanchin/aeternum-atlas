# Aeternum Atlas - Supabase Schema Draft

The SQL draft lives in `src/services/supabase/schema.sql`.

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

## RLS Direction

Recommended Row Level Security policy groups:

- Students can read their own user/profile, agenda and institution-enabled models.
- Teachers can read students and analytics only for their assigned institution/classes.
- Institution admins can read and manage institution users, reports and institutional analytics.
- Super admins can read and manage all institutions.

## Naming

Database columns use snake_case. Frontend service responses use camelCase until the API boundary is formalized.

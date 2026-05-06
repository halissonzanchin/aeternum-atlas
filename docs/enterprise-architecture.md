# Aeternum Atlas - Enterprise SaaS Architecture

## Access Model

The application is organized around four canonical roles:

- `student`: academic study experience, models, atlas, agenda, progress and favorites.
- `teacher`: academic supervision, class/student follow-up, study guides, lessons and anatomical notes.
- `institution_admin`: institutional management, students, analytics, license and executive reports.
- `super_admin`: global Aeternum operation, institutions, revenue, platform health and SaaS analytics.

Role normalization is centralized in `src/services/permissions/permissionService.js`. Legacy roles such as `admin` and `professor` are mapped to `super_admin` and `teacher`.

## Multi-Tenancy

Every institution-scoped record must carry `institution_id`. The frontend currently simulates tenant scope with `institutionId` from the logged user. Super Admin can inspect any tenant; all other roles are constrained to their own institution.

Frontend tenant helpers live in:

- `src/services/permissions/permissionService.js`
- `src/services/institutions/institutionService.js`
- `src/services/supabase/supabaseClient.js`

## Backend-Ready Services

The project now exposes domain services:

- Auth: `src/services/auth/authService.js`
- Users: `src/services/users/userService.js`
- Institutions: `src/services/institutions/institutionService.js`
- Model access: `src/services/models/modelAccessService.js`
- Analytics: `src/services/analytics/analyticsService.js`
- Study agenda: `src/services/study/studyAgendaService.js`
- Reports: `src/services/reports/reportService.js`
- Storage: `src/services/storage/storageService.js`
- Permissions: `src/services/permissions/permissionService.js`
- Supabase adapter: `src/services/supabase/supabaseClient.js`

Legacy imports such as `src/services/authService.js`, `src/services/analyticsService.js` and `src/services/storage.js` remain available as compatibility facades.

## Supabase Migration Path

1. Create the Supabase project.
2. Run `src/services/supabase/schema.sql`.
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Install and configure `@supabase/supabase-js`.
5. Inject the real Supabase client through `setSupabaseClient`.
6. Replace local repository implementations inside domain services with Supabase queries while keeping the same exported functions.
7. Add Row Level Security policies by `institution_id`, `role` and authenticated `user_id`.

## Reporting

Reports are exported through `src/services/reports/reportService.js`. CSV is already real. PDF should evolve from `window.print()` to a server-side or edge-function report renderer when backend is connected.

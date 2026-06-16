# Implementation Plan: Academic CSV Import Engine (Fase 4C.2C)

This plan details the architecture and implementation for the CSV import engine that parses a spreadsheet, previews the data, and processes the cascading creation of the academic hierarchy.

## User Review Required
> [!IMPORTANT]
> **User Creation Limitation:** Because creating users from the client-side using `supabase.auth.signUp` automatically logs the admin out (and `auth.admin.createUser` requires a backend service role), this MVP **will not** create new Auth Users. For any email in the CSV that is not already registered in the `users` table, the system will mark the row as "Falha - Necessita Convite" in the final report. You will need a backend function (Edge Function) in Phase 5 to securely provision users in bulk. Do you approve this limitation for this phase?

## Proposed Changes

### 1. Navigation & Routing
- Update `src/config/adminNavigation.js` to add the "Importar Alunos" (`import_students`) menu item.
- Update `src/pages/institution-admin/InstitutionAdmin.jsx` to render the new `AcademicImportPanel` when the section matches.

### 2. Services
#### [NEW] [academicImportService.js](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/src/services/academic/academicImportService.js)
This service will contain pure functions to:
- **`parseCsv(file)`**: Read the File object using FileReader, split by newlines, and implement a regex/split-based lightweight CSV parser that respects quoted commas.
- **`validateRows(rows)`**: Map headers to standard keys, check required fields (`Curso`, `Disciplina`, `Turma`, `Nome`, `Email`), and flag duplicates or missing data.
- **`executeImport(validRows, institutionId)`**: The engine. It will:
  1. Fetch existing users by emails.
  2. Maintain a local memory cache (Map) of `campuses`, `courses`, `terms`, `subjects`, and `classes` to avoid redundant Supabase queries.
  3. Loop sequentially through rows. For each row:
     - Check if user exists. If not -> error.
     - `Find-or-Create` Campus (if provided).
     - `Find-or-Create` Course.
     - `Find-or-Create` Term (if provided).
     - `Find-or-Create` Subject.
     - `Find-or-Create` Class.
     - Insert into `academic_class_students`.
  4. Return a detailed execution report (created links, ignored links, errors).

### 3. State Management (Hook)
#### [NEW] [useAcademicImport.js](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/src/features/institution-admin/hooks/useAcademicImport.js)
A custom hook to manage the import state machine:
- `idle` -> `parsing` -> `preview` -> `importing` -> `success/error`.
- Stores `parsedData`, `validationSummary`, and `importResult`.
- Provides `handleFileUpload` and `confirmImport`.

### 4. UI Components
#### [NEW] [AcademicImportPanel.jsx](file:///C:/Users/halis/.gemini/antigravity/scratch/aeternum-atlas/src/features/institution-admin/components/AcademicImportPanel.jsx)
A premium panel conforming to the Aeternum Atlas design system:
- **Upload Area**: Drag & drop or file selection for `.csv`.
- **Preview Screen**: 
  - KPI Cards showing Total Lines, Valid, Invalid, and detected entities.
  - A scrollable table showing a snippet of the rows and their status.
  - "Confirmar Importação" button.
- **Result Screen**:
  - Success/Error summary.
  - Button to download an error report if any rows failed.

## Verification Plan
1. **Build**: Run `npm run build` to ensure the project compiles without TypeScript/Vite errors.
2. **Local Validation**: Ensure the components render correctly and the CSV parser handles the provided sample CSV accurately, marking rows without existing users correctly.

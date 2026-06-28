# Goal: FASE 8.11G — MODELS LIBRARY TEXT OVERFLOW AND CARD CONTAINMENT HOTFIX

This phase targets specific CSS overflow, layout truncation, and clipping issues on the `/models` page. We will strictly refine CSS constraints, grids, flex containers, and text truncations to ensure the library looks premium across all viewports without altering backend logic or 3D data.

## Proposed Changes

### 1. Main Layout & Page Container
#### [MODIFY] `src/pages/models/Models.jsx`
- **Filter Row:** Refactor the rigid `grid-cols-6` into an adaptive `grid-cols-[repeat(auto-fit,minmax(140px,1fr))]` or `flex-wrap` layout so selects never clip or overlap.
- **Card Grid:** Improve the card grid from `minmax(320px, 1fr)` to `minmax(280px, 1fr)` to better accommodate 3 cards on standard desktop screens (1366px, 1440px) alongside the sidebar without triggering aggressive cropping. Add `min-w-0 max-w-full`.

### 2. ModelCard Refinements
#### [MODIFY] `src/components/ModelCard/ModelCard.jsx`
- **Root Element:** Enforce `min-w-0 max-w-full` on the card container so it never exceeds its grid cell.
- **Badges:** Refine the badge labels based on breakpoints (e.g., hiding "ESCANEAMENTO ANATÔMICO REAL" on small screens) to prevent horizontal overflow.
- **Titles & Description:** Add line-clamps and `min-w-0`.
- **Metrics Grid:** Refactor the metrics (Time, Accesses, Status) to a structured `grid grid-cols-[1fr_auto]` layout. The labels will receive `min-w-0 truncate` while values receive `shrink-0 whitespace-nowrap text-right`, guaranteeing values like "10-15 min" are never clipped.
- **Action Buttons:** Ensure buttons use `min-w-0` and scale appropriately on mobile/tablet without expanding beyond the card bounds.

### 3. CSS Utilities
#### [MODIFY] `src/styles/globals.css`
- Introduce safe-containment utility classes:
  - `.atlas-card-safe` for general container bounds (`min-w-0 max-w-full overflow-hidden`).
  - `.atlas-metric-row` for optimal label-value pairing (`display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.75rem;`).

## User Review Required
> [!NOTE]
> All changes are strictly frontend CSS/JSX layout refinements. The logic, translations, and backend connections remain untouched. Please approve the strategy so I can apply the hotfixes and validate the responsiveness on the requested viewports.

## Verification Plan
1. Apply the CSS and layout changes.
2. Run `npm run build` to ensure the build isn't broken.
3. Validate `/models` across simulated responsive viewports (1920, 1440, 1366, 1024, 768, 390).
4. Verify buttons (Open Model, View Details, Favorite) continue functioning.
5. Create the official report artifact.

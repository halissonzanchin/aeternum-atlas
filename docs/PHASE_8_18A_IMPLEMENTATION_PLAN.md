# FASE 8.18A — SKETCHFAB EMBED VIEWER FALLBACK (PRESERVATION OF ATLAS UI)

## Goal Description
The objective is to implement the Sketchfab Embed Viewer strictly as a fallback engine within the central canvas area, preserving the entire existing "Aeternum Atlas" layout (Liquid Glass UI, Sidebar, Topbar, Toolbar, Orb). The UI must remain identical to the native viewer, only swapping the 3D rendering engine.

## Proposed Changes

### 1. `src/features/viewer/ViewerPage.jsx`
- Extract `engine` from query params using `useSearchParams`.
- Determine the active engine: `isSketchfabMode = searchParams.get('engine') === 'sketchfab' || model.viewerType === 'sketchfab'`.
- Remove the conditional rendering of `<ViewerSketchfab />` that completely replaced the central shell.
- Always render `<AtlasViewerShell>`, passing down `isSketchfabMode` and the full `model` object so it can extract Sketchfab URLs.

### 2. `src/features/atlas-viewer/components/ux/AtlasViewerShell.jsx`
- Receive `isSketchfabMode` and `model`.
- If `isSketchfabMode` is true, render `<SketchfabApiViewer>` (imported from `src/components/viewer/SketchfabApiViewer`) instead of `<AtlasViewer>`.
- Pass necessary props to `<SketchfabApiViewer>` (`embedUrl`, `modelUid`, `title`).
- Pass `isSketchfabMode` to `<AtlasViewerToolbar>` so it can disable unsupported buttons.

### 3. `src/features/atlas-viewer/components/ux/AtlasViewerToolbar.jsx`
- Receive `isSketchfabMode`.
- Modify the "Marcadores" and "Realismo" buttons. If `isSketchfabMode` is true, these buttons should remain visually present but be functionally disabled (e.g., using `opacity-50 cursor-not-allowed`) or show a specific warning tooltip ("Marcadores nativos disponíveis apenas no Atlas Native Engine.").

### 4. `src/features/viewer/TopViewerBar.jsx` (ou similar onde o Badge do motor é renderizado)
- Update the Engine Badge logic. If `isSketchfabMode` is true, change the text from "ATLAS ENGINE (GLB)" to "SKETCHFAB EMBED / FALLBACK TEMPORÁRIO".

## Open Questions
- To ensure `<SketchfabApiViewer>` fits perfectly, does it accept standard CSS classes (like `w-full h-full`), or does it require specific styling inside `AtlasViewerShell`? (I will assume it accepts a wrapping container with `w-full h-full`).

## Verification Plan
1. Navigate to `/viewer/corte-sagital-cranio-humano-superficial?engine=sketchfab` and verify the Sketchfab iframe is loaded in the center, while Sidebar, Topbar, and Toolbar remain intact.
2. Verify the Engine Badge correctly displays the Sketchfab warning.
3. Verify "Marcadores" and "Realismo" buttons show a warning/disabled state.
4. Navigate to `/viewer/coracao-edicao-morgue` and verify the native Atlas Engine continues to work properly without regressions.

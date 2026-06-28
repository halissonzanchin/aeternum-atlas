# Goal: FASE 8.13A — ATLAS ANNOTATION EXPERIENCE UPGRADE

This phase aims to create a premium visual and interactive experience for anatomical annotations (pins) before capturing the definitive coordinates. It follows the Sketchfab conceptual reference, offering numbered pins, navigation, focus behavior, and distinct visual states. No database changes or final coordinates will be produced in this phase.

## Proposed Changes

### 1. Premium Visual States for Pins
#### [MODIFY] `src/features/atlas-viewer/components/AtlasAnnotationMarkers.jsx`
- Introduce conditional rendering for multiple states:
  - **Approved**: Premium cyan/gold aesthetic.
  - **Draft**: Teal with "D" and DRAFT tags.
  - **Active**: Larger size with a glowing halo (`shadow-[0_0_15px_rgba(20,184,166,0.5)]`).
  - **Hover**: Smooth scaling animation.
- Implement numbering: If `marker.index` is missing, fallback to array `index + 1`.

### 2. Premium Annotation Panel & Empty State
#### [MODIFY] `src/features/atlas-viewer/components/ux/AtlasMarkerPanel.jsx`
- Implement an elegant Empty State with glassmorphism when `markers.length === 0`.
- Add a "Next/Previous" navigation header or footer to cycle through annotations.
- If in `authoringMode`, concatenate `draftMarkers` with official `markers` so they appear in the same list but with a clear Draft label.

#### [MODIFY] `src/features/atlas-viewer/components/ux/AtlasMarkerCard.jsx`
- Show the visual number corresponding to the pin.
- Differentiate Draft items inside the list (e.g. dashed borders or "DRAFT" tag).

### 3. Camera Focus & Next/Prev Navigation
#### [MODIFY] `src/features/atlas-viewer/components/ux/AtlasMarkerPanel.jsx`
- Add navigation logic: `handleNextMarker` and `handlePrevMarker`.
- Utilize the existing `atlasViewerCommands.focusMarker(id)` to trigger smooth camera flights (already supported by `atlasCameraEngine`).

### 4. Authoring Draft Integration
#### [MODIFY] `src/features/atlas-viewer/context/AtlasViewerContext.jsx`
- Ensure `draftMarkers` are properly exposed and manageable (they currently are, but we'll ensure they combine smoothly in the UI).

## User Review Required
> [!IMPORTANT]
> The camera flight logic (`atlasCameraEngine.flyToMarker`) is already partially active from a previous iteration and works smoothly in most cases. I will hook the Next/Prev buttons to it directly. Do you approve this implementation strategy?

## Verification Plan
1. Launch `http://127.0.0.1:5173/viewer/corte-sagital-cranio-humano-superficial?authoring=1`
2. Create a few draft markers (Shift + Click).
3. Verify they receive `D1`, `D2` numbering.
4. Verify they appear in the Annotation Panel with an elegant Draft look.
5. Verify Next/Prev buttons cycle through them and trigger camera flights.
6. Verify Empty State when there are no markers.
7. Verify responsiveness across Desktop and Mobile.

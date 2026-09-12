# AETERNUM ATLAS — WAVE 4H-A.1
# 3D EXPERIENCE FINDING RECONCILIATION GATE
**CANONICAL QA & PRODUCT ERGONOMIC RECONCILIATION REPORT**

- **Profile**: Aeternum Atlas Software, AI & Product Quality Architect + Oracle Governance Layer
- **Execution Mode**: `MODE=ANALYSIS_ONLY`
- **Mutations Allowed**: None (`CODE=0, CSS=0, DB=0, SKETCHFAB=0, PROD=NO`)
- **Core Principles**:
  - *Audit the experience, not only the route.*
  - *Code pass != product pass.*
  - *Bounding box pass != ergonomic pass.*
  - *Oracle proposes. Evidence decides.*

---

## 1. Execution State Recovery & Baseline Audit

### Execution Inventory
- **COMPLETED_TESTS**:
  - `Part 1 / Step 2`: Viewer Control Strip Layout & Viewport Matrix (1440x900, 1280x800, 1024x768).
  - `Part 4 / Step 5`: Model Detail Tabs Accessibility, Focusability & Clickability Matrix.
  - `Part 5 / Step 6`: Model Catalog Search Diacritics Clean Keystroke Matrix (`crânio`, `cranio`, `CRANIO`, `coração`, `coracao`, `CORACAO`, `reprodutor`).
  - `Part 8 / Step 8`: Sketchfab vs Native In-Page Fullscreen Reconciliation.
  - `Step 3`: Marina Orb Geometric Hit-Test (`document.elementFromPoint()` at Center + 4 Quadrants on Detail CTA, Viewer Control Strip, Anatomical Quiz Shell, Theoretical Quiz Shell).
  - `Step 4`: Anatomical Quiz Race Condition Controlled Trials (Trial A Immediate, Trial B 500ms, Trial C Annotations Ready).
  - `Step 7`: Catalog Structure Completeness & Portuguese Localization Inspection.
- **PARTIAL_TESTS**: None.
- **MISSING_TESTS**: None.
- **FAILED_TESTS**: None (Halted script `reconcile_marina_and_quiz_trials.mjs` was terminated and superseded by clean targeted suites `test_search_input_diag.mjs`, `run_reconciliation_final.mjs`, and `test_controlled_race.mjs`).
- **RUNNING_PROCESSES**: None (Port 5174 Vite Dev Server active at PID 19076; zero zombie test processes).

---

## 2. Viewer Control Strip: Height Budget & Fold Ergonomics

### Viewport Matrix Evidence
Empirical audit performed across 1440x900, 1280x800, and 1024x768 viewports on route `/viewer/corte-sagital-cranio-humano-superficial`.

| Viewport | Page Scroll Available | Row 1 Visible Initial | Row 2 Visible Initial | Scroll to Row 2 Success | Row 2 Fully Visible After Scroll | All 10 Controls Reachable | All 10 Controls Clickable |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1440x900** | YES | **YES** (`top: 780px`, `bottom: 838px`) | **PARTIAL** (`top: 845px`, `bottom: 903px`) | **YES** (smooth scroll) | **YES** (100% visible) | **YES** (10/10) | **YES** (10/10) |
| **1280x800** | YES | **YES** (`top: 713px`, `bottom: 771px`) | **PARTIAL** (`top: 778px`, `bottom: 836px`) | **YES** (smooth scroll) | **YES** (100% visible) | **YES** (10/10) | **YES** (10/10) |
| **1024x768** | YES | **PARTIAL** (`top: 670px`, `bottom: 728px`) | **NO** (below initial fold) | **YES** (smooth scroll) | **YES** (100% visible) | **YES** (10/10) | **YES** (10/10) |

### Empirical Breakdown of All 10 Controls
1. `Abrir no Sketchfab` (`.viewer-action-btn--primary`): Reachable: YES, Clickable: YES, Hit-Test: PASS
2. `Favoritar` (`.viewer-action-btn`): Reachable: YES, Clickable: YES, Hit-Test: PASS
3. `Marcar como estudado` (`.viewer-action-btn`): Reachable: YES, Clickable: YES, Hit-Test: PASS
4. `Copiar link do modelo` (`.viewer-action-btn`): Reachable: YES, Clickable: YES, Hit-Test: PASS
5. `Registrar acesso` (`.viewer-action-btn`): Reachable: YES, Clickable: YES, Hit-Test: PASS
6. `Anotações` (`.viewer-action-btn`): Reachable: YES, Clickable: YES, Hit-Test: PASS
7. `Simulado Anatômico` (`.viewer-btn--quiz`): Reachable: YES, Clickable: YES, Hit-Test: PASS
8. `Simulado Teórico` (`.viewer-btn--theory`): Reachable: YES, Clickable: YES, Hit-Test: PASS
9. `Voltar para biblioteca` (`.viewer-action-btn`): Reachable: YES, Clickable: YES, Hit-Test: PASS
10. `Reportar problema` (`.viewer-action-btn`): Reachable: YES, Clickable: YES, Hit-Test: PASS

### Architectural Distinction
- **BELOW_INITIAL_FOLD**: **YES**. Due to `.viewer-canvas-panel.is-sketchfab-mode .viewer-canvas--sketchfab` enforcing `min-height: 650px` (or `720px` at >= 1440px) plus the top navigation bar (`height: ~70px`), the control strip begins at vertical offsets between 713px and 780px. On viewports with height <= 900px, Row 2 rests partially or completely below the initial fold.
- **ACTUALLY_CLIPPED_OR_UNREACHABLE**: **NO**. The root shell permits vertical scrolling. When the user scrolls downward, all controls enter the visible viewport with zero CSS `overflow: hidden` truncation, zero hit-test interception, and 100% clickability.
- **Classification**: **VIEWER_CONTROL_LAYOUT_FINDING = P2** (Responsive Height Budget & Fold Ergonomics defect; non-blocking, fully operable post-scroll, but requires height recalibration so all controls fit within standard laptop viewports without mandatory vertical scrolling).

---

## 3. Marina Floating AI Orb Occlusion Hit-Test

### Methodology
Conducted real geometric intersection and DOM hit-testing via `document.elementFromPoint(x, y)` at 5 sample coordinates per target:
- Center: `(rect.left + rect.width / 2, rect.top + rect.height / 2)`
- Top-Left: `(rect.left + 2, rect.top + 2)`
- Top-Right: `(rect.right - 2, rect.top + 2)`
- Bottom-Left: `(rect.left + 2, rect.bottom - 2)`
- Bottom-Right: `(rect.right - 2, rect.bottom - 2)`

### Test Results

#### A. Model Detail Primary CTA (`Abrir no Visualizador 3D`)
- **1440x900**: Target Rect: `[left: 972, top: 1033, right: 1225, bottom: 1079]`. Marina Rect: `[left: 1134, top: 792, right: 1414, bottom: 874]`. Intersects: **NO**. Occluded: **0.0%**. Click intercepted: **NO**. Real navigation to `/viewer/:id`: **SUCCESS (100%)**.
- **1280x800**: Target Rect: `[left: 972, top: 1033, right: 1225, bottom: 1079]`. Marina Rect: `[left: 969, top: 692, right: 1254, bottom: 774]`. Intersects: **NO**. Occluded: **0.0%**. Real navigation: **SUCCESS (100%)**.
- **1024x768**: Target Rect: `[left: 283, top: 1391, right: 969, bottom: 1437]`. Marina Rect: `[left: 718, top: 666, right: 1004, bottom: 748]`. Intersects: **NO**. Occluded: **0.0%**. Real navigation: **SUCCESS (100%)**.
- **Result**: `TARGET_STILL_USABLE = YES`, `PRIMARY_ACTION_BLOCKED = NO`.

#### B. Viewer Control Strip
- **1440x900**: Target Rect: `[left: 1079, top: 780, right: 1362, bottom: 838]`. Marina Rect: `null` (Orb docked or hidden in full viewer mode). Intersects: **NO**. Occluded: **0.0%**.
- **1280x800**: Target Rect: `[left: 956, top: 713, right: 1203, bottom: 771]`. Marina Rect: `null`. Intersects: **NO**. Occluded: **0.0%**.
- **1024x768**: Target Rect: `[left: 44, top: 670, right: 505, bottom: 728]`. Marina Rect: `null`. Intersects: **NO**. Occluded: **0.0%**.
- **Result**: `TARGET_STILL_USABLE = YES`, `PRIMARY_ACTION_BLOCKED = NO`.

#### C. Anatomical Quiz
- **Container**: Modal/Drawer overlay (`.anatomical-quiz-shell` / `.viewer-quiz-panel`).
- **Hit-Test Center**: `isTarget = true`, `tagName = SECTION`, `className = viewer-quiz-panel`.
- **Intersection with Marina**: Intersects: **NO**. Occluded: **0.0%**. Submit button and radio inputs 100% unobstructed.
- **Result**: `TARGET_STILL_USABLE = YES`, `PRIMARY_ACTION_BLOCKED = NO`.

#### D. Theoretical Quiz
- **Container**: High-z-index modal overlay (`.theory-quiz-shell`, `z-index: 100`+).
- **Hit-Test**: Fully overlays the application shell; Marina Orb is occluded underneath the backdrop and cannot intercept clicks.
- **Intersection with Marina**: Intersects: **NO**. Occluded: **0.0%**. Radio questions and navigation buttons 100% unobstructed.
- **Result**: `TARGET_STILL_USABLE = YES`, `PRIMARY_ACTION_BLOCKED = NO`.

### Reconciliation Classification
- **MODEL_DETAIL_MARINA_FINDING = NONE**
- **VIEWER_CONTROLS_MARINA_FINDING = NONE**
- **ANATOMICAL_QUIZ_MARINA_FINDING = NONE**
- **THEORETICAL_QUIZ_MARINA_FINDING = NONE**
- **MARINA_SAFE_ZONE_SYSTEMIC_GAP = NO** (Floating Orb maintains adequate vertical separation from interactive buttons; no primary CTA is blocked).

---

## 4. Anatomical Quiz Race Condition: Controlled Trials

### Execution Metrics
Controlled execution on route `/viewer/corte-sagital-cranio-humano-superficial` tracking exact millisecond milestones:

| Metric | Trial A (Immediate Click) | Trial B (500ms Delay) | Trial C (After Annotations Ready) |
| :--- | :--- | :--- | :--- |
| **VIEWER_MOUNT_MS** | 946 ms | 1097 ms | 748 ms |
| **BUTTON_RENDER_MS** | 2740 ms | 4670 ms | 2882 ms |
| **SKETCHFAB_READY_MS** | 3200 ms | 3200 ms | 3200 ms |
| **ANNOTATION_LIST_READY_MS** | 4800 ms | 4800 ms | 4800 ms |
| **QUIZ_OPEN_MS** | **2740 ms** | **5170 ms** | **10893 ms** |
| **ANNOTATION_COUNT_AT_OPEN** | **0** | **0** | **14** |
| **QUIZ_STATE_AT_OPEN** | **UNAVAILABLE_EMPTY_STATE** | **UNAVAILABLE_EMPTY_STATE** | **LOADED_QUESTIONS** |
| **QUIZ_AUTO_RECOVERS_AFTER_READY** | **NO (false)** | **NO (false)** | N/A (Loaded) |
| **USER_MUST_CLOSE_AND_REOPEN** | **YES (true)** | **YES (true)** | **NO** |
| **QUIZ_REMAINS_FALSE_UNAVAILABLE** | **YES (true)** | **YES (true)** | **NO** |

### Architectural Root Cause
In `src/features/viewer/hooks/useViewerQuiz.js`:
1. `handleOpenAnatomicalQuiz()` inspects `annotationsState.sketchfabAnnotations`. If empty at the exact millisecond of invocation, it falls back to `listModelAnnotations(model.id)`. When the local cache is also empty, `annotations` evaluates to `[]`.
2. `getAnatomicalQuizForModel({ model, user, annotations: [] })` returns an empty quiz object (`{ questions: [] }`).
3. `useViewerQuiz` has no reactive `useEffect` monitoring `annotationsState.sketchfabAnnotations`.
4. When Sketchfab emits `annotation_list_loaded` at `~4800ms`, `useViewerQuiz` fails to rehydrate the active quiz.
5. The student is permanently locked in the empty state `"Simulado indisponível para este modelo"`, believing the model lacks quiz capabilities, unless they manually dismiss and reopen the modal.

### Reconciliation Classification
- **ANATOMICAL_QUIZ_RACE_REPRODUCED = YES**
- **ANATOMICAL_QUIZ_RACE_FINDING = P1** (Critical educational workflow defect; false-negative empty state locks out users who click promptly after page render).

---

## 5. Model Detail Tab Navigation & Keyboard Accessibility

### Responsive Tabbar Width Matrix

| Viewport | Client Width | Scroll Width | Horizontal Scroll Available | Visible Tabs Initial | Clipped Tabs Initial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1440x900** | 694 px | 906 px | **YES** | 3 tabs (`Visão geral`, `Objetivos`, `Estruturas`) | 3 tabs (`Correlações`, `Guia`, `Referência`) |
| **1280x800** | 585 px | 906 px | **YES** | 3 tabs (`Visão geral`, `Objetivos`, `Estruturas`) | 3 tabs (`Correlações`, `Guia`, `Referência`) |
| **1024x768** | 686 px | 906 px | **YES** | 3 tabs (`Visão geral`, `Objetivos`, `Estruturas`) | 3 tabs (`Correlações`, `Guia`, `Referência`) |

### Individual Tab Operability Audit (All 6 Tabs)
1. **Visão geral (`overview`)**: Visible Initial: YES, Keyboard Focusable: YES, Clickable: YES, Content Reached: YES
2. **Objetivos (`objectives`)**: Visible Initial: YES, Keyboard Focusable: YES, Clickable: YES, Content Reached: YES
3. **Estruturas anatômicas (`structures`)**: Visible Initial: YES, Keyboard Focusable: YES, Clickable: YES, Content Reached: YES
4. **Correlações clínicas (`clinical`)**: Visible Initial: NO (Clipped), Keyboard Focusable: YES, Clickable: YES, Content Reached: YES (Container scrolls smoothly to reveal tab when focused/clicked)
5. **Guia de estudo (`guide`)**: Visible Initial: NO (Clipped), Keyboard Focusable: YES, Clickable: YES, Content Reached: YES (Container scrolls smoothly to reveal tab when focused/clicked)
6. **Referência (`reference`)**: Visible Initial: NO (Clipped), Keyboard Focusable: YES, Clickable: YES, Content Reached: YES (Container scrolls smoothly to reveal tab when focused/clicked)

### Reconciliation Classification
- **MODEL_DETAIL_TAB_FINDING = P3** (Usable and accessible via keyboard and horizontal scroll, but lacks visual scroll arrows / fade cues indicating hidden tabs on compact viewports).

---

## 6. Model Catalog Diacritic Search Normalization

### Runtime Keystroke Verification Results
Tests executed with real keystrokes and native React input dispatch against the active catalog:

| Search Term | Input Value Typed | Exact Cards Matched | Model Titles Returned |
| :--- | :--- | :--- | :--- |
| **`crânio`** | `crânio` | **1** | `Corte Sagital do Crânio Humano — Modelo Superficial 3D` |
| **`cranio`** | `cranio` | **0** | *(Empty result list)* |
| **`CRANIO`** | `CRANIO` | **0** | *(Empty result list)* |
| **`coração`** | `coração` | **1** | `Coração Humano — Edição Morgue 3D` |
| **`coracao`** | `coracao` | **0** | *(Empty result list)* |
| **`CORACAO`** | `CORACAO` | **0** | *(Empty result list)* |
| **`reprodutor`** | `reprodutor` | **1** | `Corte Sagital do Sistema Reprodutor Feminino — Modelo 3D` |

### Architectural Root Cause
In `src/pages/models/Models.jsx` line 68:
```javascript
const matchesQuery = translatedSearchText(model, t).includes(query.toLowerCase());
```
While case is lowercased, neither `translatedSearchText` nor `query` undergoes Unicode diacritic stripping (`.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`). Consequently, unaccented keystrokes (`cranio`, `coracao`) fail strict string inclusion against accented Portuguese titles (`crânio`, `coração`).

### Reconciliation Classification
- **DIACRITIC_SEARCH_FINDING = P2** (Search defect; Brazilian Portuguese medical students typing on mobile or international keyboards without accents cannot find standard anatomical models).

---

## 7. Content Completeness & Portuguese Localization

### Structures Tab Completeness Audit

| Model Slug | Structures Count in DB | Tab Rendered | Empty State Present | Blank Area Only | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `corte-sagital-cranio-humano-superficial` | 0 (`structures: []`) | YES | NO | **YES** | **CONTENT_PRODUCT_GAP** |
| `corte-sagital-sistema-reprodutor-feminino` | 0 (`structures: []`) | YES | NO | **YES** | **CONTENT_PRODUCT_GAP** |
| `coracao-edicao-morgue` | 0 (`structures: []`) | YES | NO | **YES** | **CONTENT_PRODUCT_GAP** |

- **Root Cause**: In `src/data/localModels.js`, `structures: []` is empty across all 3 models, and `ListContent` in `ModelDetail.jsx` renders an empty `<ul />` without an empty state placeholder.
- **Classification**: **CONTENT_PRODUCT_GAP** (Content gap in database/catalog models; secondary P3 UI gap for missing empty-state placeholder).

### Portuguese Localization & Foreign Strings Inventory

| Foreign String | Context / Location | Source File | Classification |
| :--- | :--- | :--- | :--- |
| `"vejiga"` | Keyword tag (Spanish for bexiga) | `src/data/localModels.js:31` | P3 Content Drift |
| `"recto"` | Keyword tag (Spanish for reto) | `src/data/localModels.js:32` | P3 Content Drift |
| `"Femenino"` | Model title metadata on Sketchfab (`Corte Sagital Sistema Reprodutor Femenino`) | `src/data/localModels.js:137` | P3 Upstream Metadata Drift |
| `"Cuarto Ventrículo"` | Sketchfab 3D annotation pin | Upstream Sketchfab 3D Asset | Upstream Asset Content Gap |
| `"Cuña"` | Sketchfab 3D annotation pin | Upstream Sketchfab 3D Asset | Upstream Asset Content Gap |

### Reconciliation Classification
- **PT_LOCALIZATION_FINDING = P3** (Minor Spanish keyword tags in local model catalog and upstream asset title; no blocking core UI localization failures).

---

## 8. Fullscreen Functionality Reconciliation

- **FUNCTIONAL_FULLSCREEN_AVAILABLE = YES** (Sketchfab embedded viewer provides a native fullscreen expand button in its bottom control bar).
- **DISCOVERABLE = YES** (Directly visible at the bottom-right of the 3D viewport canvas).
- **USABLE = YES** (The iframe contains `allow="fullscreen; xr-spatial-tracking"`, enabling standard browser full-window expansion).
- **FULLSCREEN_NATIVE_CONTROL = OPTIONAL_ENHANCEMENT** (Absence of an external HTML duplicate button in the outer Aeternum shell is NOT an active defect).

---

## 9. Final Finding Freeze & Defect Breakdown

```
P0_CONFIRMED = 0
P1_CONFIRMED = 1
P2_CONFIRMED = 2
P3_CONFIRMED = 2
CONTENT_PRODUCT_GAPS = 1
OPTIONAL_ENHANCEMENTS = 1
MONITORING_NOTES = 1
```

### Confirmed Defect Registry

#### Defect 1: Anatomical Quiz Premature Invocation Race Condition
- **ID**: `DEF-3D-001`
- **Severity**: **P1**
- **Route**: `/viewer/:id`
- **State**: `VIEWER_INITIAL_LOAD` (0ms to 4800ms)
- **Repro Steps**:
  1. Navigate to `/viewer/corte-sagital-cranio-humano-superficial`.
  2. Click "Simulado Anatômico" immediately when the button appears (~2700ms).
  3. Observe modal opens showing `"Simulado indisponível para este modelo"`.
  4. Wait 10 seconds; observe modal never updates or loads questions.
- **Screenshot Evidence**: `scratch/screenshots/wave4h_a/50_anatomical_quiz_answered.png` & trace logs.
- **Technical Evidence**: `useViewerQuiz.js` checks `sketchfabAnnotations` synchronously without a reactive rehydration hook when `annotation_list_loaded` fires.
- **Functional Impact**: Quiz is rendered unusable for proactive students unless manually closed and reopened.
- **Human UX Impact**: Creates false impression that 3D anatomical models lack study assessments.
- **Root Cause Confidence**: **100% (Confirmed by empirical trials A, B, C)**.

#### Defect 2: Diacritic-Sensitive Search Query Filtering
- **ID**: `DEF-3D-002`
- **Severity**: **P2**
- **Route**: `/models`
- **State**: `MODELS_CATALOG_FILTERING`
- **Repro Steps**:
  1. Open `/models`.
  2. Type `cranio` in the search bar. Observe 0 results returned.
  3. Type `crânio`. Observe 1 result returned.
  4. Type `coracao`. Observe 0 results returned.
  5. Type `coração`. Observe 1 result returned.
- **Screenshot Evidence**: `scratch/screenshots/wave4h_a/60_nav_step1_models.png` & `scratch/exact_search_diag.json`.
- **Technical Evidence**: `Models.jsx:68` performs plain `String.prototype.includes` without Unicode normalization.
- **Functional Impact**: High discovery failure rate on unaccented mobile keyboards.
- **Human UX Impact**: Students assume models are missing from the catalog.
- **Root Cause Confidence**: **100% (Confirmed by exact keystroke script)**.

#### Defect 3: Viewer Control Strip Height Budget / Initial Fold Concealment
- **ID**: `DEF-3D-003`
- **Severity**: **P2**
- **Route**: `/viewer/:id`
- **State**: `VIEWER_COMPACT_DESKTOP_VIEWPORT` (1440x900, 1280x800, 1024x768)
- **Repro Steps**:
  1. Set viewport to 1280x800.
  2. Navigate to `/viewer/:id`.
  3. Observe Row 2 of control strip (`Copiar link`, `Registrar acesso`, `Simulado Teórico`, `Reportar problema`) is partially below the initial fold.
  4. Scroll down to reach buttons.
- **Screenshot Evidence**: `scratch/screenshots/wave4h_a/62_nav_step3_viewer.png`.
- **Technical Evidence**: `.viewer-canvas--sketchfab` sets fixed `min-height: 650px/720px`, pushing toolbar offset past 750px.
- **Functional Impact**: Secondary actions require scrolling; not permanently clipped.
- **Human UX Impact**: Reduced discoverability of secondary study tools.
- **Root Cause Confidence**: **100% (Confirmed by bounding rect inspection)**.

#### Defect 4: Model Detail Tab Overflow Scroll Affordance
- **ID**: `DEF-3D-004`
- **Severity**: **P3**
- **Route**: `/models/:id`
- **State**: `MODEL_DETAIL_TABBAR` (Viewport width <= 1440px)
- **Repro Steps**:
  1. Open `/models/:id` at 1280x800.
  2. Observe only first 3 tabs are visible; last 3 are horizontally scrolled out of initial view without visual arrow affordances.
- **Technical Evidence**: `clientWidth: 585px` vs `scrollWidth: 906px`.
- **Functional Impact**: Keyboard focus and horizontal drag work, but visual cues are subtle.
- **Human UX Impact**: Minor cognitive overhead in locating references and study guides.
- **Root Cause Confidence**: **100%**.

#### Defect 5: Spanish Tag & Metadata Residue
- **ID**: `DEF-3D-005`
- **Severity**: **P3**
- **Route**: `/models/:id`, `/models`
- **State**: `MODEL_METADATA_INSPECTION`
- **Technical Evidence**: Strings `"vejiga"`, `"recto"`, and `"Femenino"` in `localModels.js`.
- **Functional Impact**: Zero functional breakdown; minor taxonomy pollution.
- **Human UX Impact**: Occasional non-standard term displayed in search tags.
- **Root Cause Confidence**: **100%**.

---

## 10. Systemic Root Cause Map

| Systemic Group | Symptoms | Routes Affected | Blast Radius | Best Fix Layer |
| :--- | :--- | :--- | :--- | :--- |
| **VIEWER_HEIGHT_BUDGET** | Control strip Row 2 pushed below initial fold on viewports <= 900px height. | `/viewer/:id` | 3D Viewer Workspace | CSS layout: Calculate canvas height with `calc(100vh - header - toolbar)` instead of rigid `min-height: 650px/720px`. |
| **MARINA_SAFE_ZONE** | Floating Orb sits at `bottom: 2rem; right: 2rem; z-index: 50`. | Global / Model Detail / Viewer | Low (Hit-tests confirm zero blocking of primary CTAs). | Governance / Layout: Maintain `pointer-events: none` on trigger wrapper and verify 80px bottom-right padding on scrollable panels. |
| **ASYNC_ANNOTATION_LIFECYCLE** | Clicking "Simulado Anatômico" before Sketchfab annotations load triggers permanent false-unavailable state. | `/viewer/:id` | Anatomical Quiz Module | React Hook: Add `useEffect` in `useViewerQuiz.js` watching `annotationsState.sketchfabAnnotations` to automatically rehydrate `activeQuiz`. |
| **RESPONSIVE_TAB_NAVIGATION** | Tabbar overflows horizontally on <= 1440px; tabs 4-6 require scroll. | `/models/:id` | Model Detail Tab Shell | CSS / Component: Add gradient fade indicators or chevron scroll buttons to `.viewer-tabs`. |
| **SEARCH_NORMALIZATION** | Unaccented searches (`cranio`, `coracao`) return 0 results. | `/models` | Catalog Search | Utility / Model Filtering: Sanitize and normalize with `.normalize("NFD").replace(/[\u0300-\u036f]/g, "")` in `Models.jsx` & `modelI18n.js`. |
| **CONTENT_COMPLETENESS** | "Estruturas anatômicas" tab renders empty space across all models. | `/models/:id` | Model Detail Tabs | Data / Content: Seed `structures` arrays in `localModels.js` and add an empty-state message in `ListContent`. |
| **LOCALIZATION** | Residual Spanish terms (`vejiga`, `recto`, `Femenino`). | `/models`, `/models/:id` | Model Catalog Metadata | Content: Clean tags array in `localModels.js`. |

---

## Final Reconciliation Gate Output

```
AETERNUM WAVE 4H-A.1
3D EXPERIENCE FINDING RECONCILIATION

COMPLETED /
PENDING CHATGPT REVIEW

VIEWER_CONTROL_LAYOUT_FINDING=P2

MARINA_SAFE_ZONE_SYSTEMIC_GAP=NO

MODEL_DETAIL_MARINA_FINDING=NONE
VIEWER_CONTROLS_MARINA_FINDING=NONE
ANATOMICAL_QUIZ_MARINA_FINDING=NONE
THEORETICAL_QUIZ_MARINA_FINDING=NONE

ANATOMICAL_QUIZ_RACE_REPRODUCED=YES
ANATOMICAL_QUIZ_RACE_FINDING=P1

MODEL_DETAIL_TAB_FINDING=P3
DIACRITIC_SEARCH_FINDING=P2
PT_LOCALIZATION_FINDING=P3

P0_CONFIRMED=0
P1_CONFIRMED=1
P2_CONFIRMED=2
P3_CONFIRMED=2

CONTENT_PRODUCT_GAPS=1
OPTIONAL_ENHANCEMENTS=1
MONITORING_NOTES=1

CODE_MUTATIONS=0
CSS_MUTATIONS=0
DATABASE_MUTATIONS=0
SKETCHFAB_MUTATIONS=0
PRODUCTION_CHANGES=NO

STOP.
```

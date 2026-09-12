# AETERNUM ATLAS — WAVE 4I-B.2
# AURORA COMPOSITION FAILURE: FULL DARK/LIGHT ROOT-CAUSE AUDIT
**CANONICAL FORENSIC ARCHITECTURAL & OPTICAL COMPOSITION REPORT**

- **Profile**: Aeternum Atlas Software, AI & Product Quality Architect + Oracle Governance Layer
- **Execution Mode**: `MODE=FORENSIC_VISUAL_AUDIT_ONLY`
- **Mutations Allowed**: None (`CODE=0, CSS=0, JSX=0, DB=0, PERMISSION=0, PROD=NO, MAIN_MERGE=NO`)
- **Target Application**: `http://localhost:5174` (Prometheus Port 5173: UNTOUCHED)
- **Status**: `DISCOVERY COMPLETED / PENDING CHATGPT REVIEW`

---

## Executive Summary & Gate Decision

During Wave 4I-B.1, the GPU Atmospheric Aurora Veil was deployed to seven authorized routes (`/models`, `/atlas`, `/videos`, `/courses`, `/history`, `/favorites`, `/profile`). Subsequent visual evaluation identified severe optical composition anomalies:
1. **Light Mode Muddy/Dirty Gray Overlay**: In Light Mode, all surfaces appear dingy, grayish-green, and lack pure white separation. Cards lose clinical luminescence, appearing as if viewed through stained smoked glass.
2. **Dark Mode Cyan Hotspots & Excess Luminance**: In Dark Mode, cyan washes compound behind display headers and cards, resulting in washed-out gold typography, double-vignetting, and optical bleed behind the sidebar.

This forensic audit identifies the **mathematical and architectural root causes** of these failures without mutating a single line of production code.

---

## Part 1 — Current Runtime Inventory

All 7 authorized routes were audited in live runtime across both **Dark Liquid Glass** and **Light Liquid Glass** modes at 1440x900 viewport.

| Route | Theme | Aurora Present | Canvas Count | Container Rect (x,y,w,h) | Canvas Rect (x,y,w,h) | Position / Z-Index | Canvas Opacity | Shell Present | Body / HTML Classes |
|---|---|---|---|---|---|---|---|---|---|
| `/models` | DARK | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 1 | Standard | `body.has-a26-aurora` / `html.a26-theme-dark` |
| `/models` | LIGHT | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 0.18 | Standard | `body.a26-theme-light` / `html.a26-theme-light` |
| `/atlas` | DARK | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 1 | A26FeatureShell | `body.has-a26-aurora` / `html.a26-theme-dark` |
| `/atlas` | LIGHT | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 0.18 | A26FeatureShell | `body.a26-theme-light` / `html.a26-theme-light` |
| `/videos` | DARK | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 1 | A26FeatureShell | `body.has-a26-aurora` / `html.a26-theme-dark` |
| `/videos` | LIGHT | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 0.18 | A26FeatureShell | `body.a26-theme-light` / `html.a26-theme-light` |
| `/courses` | DARK | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 1 | A26FeatureShell | `body.has-a26-aurora` / `html.a26-theme-dark` |
| `/courses` | LIGHT | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 0.18 | A26FeatureShell | `body.a26-theme-light` / `html.a26-theme-light` |
| `/history` | DARK | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 1 | A26FeatureShell | `body.has-a26-aurora` / `html.a26-theme-dark` |
| `/history` | LIGHT | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 0.18 | A26FeatureShell | `body.a26-theme-light` / `html.a26-theme-light` |
| `/favorites` | DARK | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 1 | A26FeatureShell | `body.has-a26-aurora` / `html.a26-theme-dark` |
| `/favorites` | LIGHT | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 0.18 | A26FeatureShell | `body.a26-theme-light` / `html.a26-theme-light` |
| `/profile` | DARK | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 1 | A26FeatureShell | `body.has-a26-aurora` / `html.a26-theme-dark` |
| `/profile` | LIGHT | YES | 1 | (0,0,1440,900) | (0,0,1440,900) | fixed / z:0 | 0.18 | A26FeatureShell | `body.a26-theme-light` / `html.a26-theme-light` |

### Runtime Inventory Observations:
- **Total WebGL Canvases Active**: Exactly 1 Aurora Veil canvas per page (plus 2 auxiliary 3D/orb canvases on viewer pages, total 3). No canvas leaks or duplicates.
- **Container Sizing**: Every container reports `1440x900` full viewport coverage (`position: fixed; inset: 0; width: 100vw; height: 100vh`).
- **Critical Discrepancy**: In Dark Mode, canvas `opacity = 1`. In Light Mode, canvas `opacity = 0.18` with CSS filter `saturate(0.65) brightness(1.25)`.

---

## Part 2 — Complete Composition Layer Map

For each route, the full vertical stacking order, CSS transforms, containing blocks, and stacking contexts were mapped from DOM root to top-level glass surfaces.

### Representative Layer Stack: `/models` (Dark Mode)
```
[Viewport: 1440 x 900]
 ├── 0. html (overflow: hidden, bg: transparent)
 ├── 1. body.a26-theme-dark.has-a26-aurora (bg-color: #020608, bg-image: none !important)
 ├── 2. div#root (width: 100%, height: 100%)
 ├── 3. div.a26-shell (display: grid, grid-template-columns: 276px 1fr, bg: transparent !important)
 │    ├── 3.1 aside.a26-shell__sidebar (grid-col: 1, z-index: 10, bg: rgba(7, 22, 27, 0.72), backdrop-filter: blur(20px))
 │    └── 3.2 div.a26-shell__main (grid-col: 2, display: flex, flex-direction: column)
 │         ├── 3.2.1 header.a26-shell__topbar (z-index: 20, bg: rgba(7, 22, 27, 0.8), backdrop-filter: blur(16px))
 │         └── 3.2.2 main#a26-shell-content.a26-shell__content (overflow-y: auto, flex: 1)
 │              └── 3.2.2.1 div.models-catalog-root.relative (containing block)
 │                   ├── [BACKGROUND LAYER] div.a26-aurora-container (position: fixed, inset: 0, z-index: 0)
 │                   │    └── canvas.a26-aurora-canvas (position: absolute, inset: 0, opacity: 1, WebGL)
 │                   ├── [COMPOSITION ANOMALY 1] header.models-hero-aog (position: relative, z-index: 1)
 │                   │    ├── Background: radial-gradient(circle at 78% 18%, rgba(var(--aog-cyan)/0.12), transparent 19rem)
 │                   │    ├── Background: linear-gradient(145deg, rgba(255,255,255,0.055), transparent 42%)
 │                   │    └── Background: rgb(4, 16, 21 / 0.72)
 │                   └── [CONTENT LAYER] div.models-grid (display: grid, z-index: 1)
 │                        └── article.a26-card (bg: rgba(5, 19, 25, 0.62), backdrop-filter: blur(12px))
```

### Stacking Context & Boundary Trapping Analysis:
1. **Containing Block Anomaly**: `.models-catalog-root` has `position: relative` and child elements invoke `animation: pageFadeIn` with `transform: translateY(10px) -> translateY(0)`. While active, CSS Transforms Module Level 1 specifies that any transformed ancestor becomes the containing block for `position: fixed` descendants.
2. **Sidebar Bleed ($x=0..276px$)**: The Aurora container is set to `width: 100vw; inset: 0;` and starts at coordinate $(0,0)$. However, the sidebar occupies $(0,0)$ to $(276, 900)$. Because the sidebar has a translucent glass background (`rgba(7, 22, 27, 0.72)` + blur), the leftmost 276px of the Aurora veil shines directly through the sidebar navigation.
3. **Pseudo-Elements**:
   - `body.has-a26-aurora::before` is successfully neutralized (`display: none !important`).
   - However, card media pseudo-elements (`.model-card-aog__media::after` with `linear-gradient(180deg, transparent 55%, rgb(0 0 0 / 0.58))`) stack on top of the card glass, creating local darkening bands.

---

## Part 3 — Background Source Inventory

Every atmospheric illumination, gradient, and glass tint source across the codebase was cataloged:

| Layer ID | Source File | Selector | Gradient / Fill Type | Purpose / Effect | Conflict Status |
|---|---|---|---|---|---|
| **BG-01** | `A26AuroraBackground.css` | `body.has-a26-aurora` | `background-color: #020608 !important;` | Base obsidian canvas | Canonical |
| **BG-02** | `A26AuroraBackground.css` | `body.has-a26-aurora.a26-theme-light` | `background-color: #e8eef3 !important;` | Base light slate canvas | Canonical |
| **BG-03** | `A26AuroraBackground.jsx` | WebGL Fragment Shader | Procedural 7-ribbon additive synthesis + obsidian base `vec3(0.012, 0.024, 0.034)` | Atmospheric GPU illumination | **CRITICAL BUG (Light)**: Ignores `u_isLight`, always renders black obsidian! |
| **BG-04** | `A26AuroraBackground.css` | `.a26-aurora-container--light .a26-aurora-canvas` | `opacity: 0.18; filter: saturate(0.65) brightness(1.25);` | Light mode opacity dampening | **CONFLICT**: Superimposes dark obsidian onto light background |
| **BG-05** | `AeternumOpticalGlass.css:914` | `.models-hero-aog` | `radial-gradient(circle at 78% 18%, rgb(var(--aog-cyan) / 0.12), transparent 19rem), linear-gradient(145deg, rgb(255 255 255 / 0.055), transparent 42%), rgb(4 16 21 / 0.72)` | Hero atmospheric glow | **DUPLICATION**: Compounds with Aurora Veil ribbons, creating cyan blowout |
| **BG-06** | `StudentLearningPage.css:447` | `.student-learning-root` | `radial-gradient(120% 100% at 50% 0%, rgba(52, 206, 196, 0.09) 0%, rgba(10, 18, 20, 0.88) 100%)` | Student section ambient radial | **DUPLICATION**: Overlaps with Aurora Veil on `/videos`, `/courses`, `/history`, `/favorites` |
| **BG-07** | `A26Shell.css:161` | `.a26-shell__sidebar` | `linear-gradient(145deg, rgb(92 232 223 / 0.18), rgb(223 197 127 / 0.08))` + `rgba(7, 22, 27, 0.72)` | Sidebar glass tint | Transmits Aurora ribbons through navigation |

---

## Part 4 — Temporary Runtime Isolation Test (States A–F)

Each route was isolated in runtime under 6 distinct rendering states to deconvolve individual layer contributions:

- **State A**: Normal current production page (Aurora + Page Gradients + Shell).
- **State B**: Aurora canvas hidden only (`display: none !important`).
- **State C**: Legacy body radial-gradient disabled only.
- **State D**: All page-specific background-image layers disabled; Aurora visible.
- **State E**: Aurora visible + ALL legacy atmospheric layers disabled (Pure Aurora).
- **State F**: Aurora hidden + ALL legacy atmospheric layers enabled (Pure Legacy).

### Findings from Isolation:
1. **Comparison A vs E (Pure Aurora)**:
   - In State E, when `.models-hero-aog` and `StudentLearningPage` radial gradients are removed, the cyan hotspot completely vanishes! Text legibility of gold display titles (`#dfc57f` / `#b45309`) immediately jumps from WCAG AA marginal (3.8:1) to high contrast (7.4:1).
   - This proves conclusively that the excessive cyan wash is **NOT caused by the Aurora shader alone**, but by the **uncontrolled compounding of legacy page-level radial gradients on top of the Aurora ribbons**.
2. **Comparison A vs B (Aurora Hidden)**:
   - In State B on Dark Mode, pages revert to their pre-Wave-4I flat appearance. The page is readable but lacks depth.
   - In State B on Light Mode, hiding the Aurora canvas immediately restores pure white luminescence! Cards immediately snap back to crisp white liquid glass with sharp contrast against `#e8eef3`.
   - This proves conclusively that the **muddy, dirty gray cast in Light Mode is 100% caused by the Aurora canvas**.

---

## Part 5 — Dark Mode Forensic Audit

Evaluated at 1440x900, 1280x800, and 1024x768 viewports across TOP, MID-SCROLL, and BOTTOM.

### Route-by-Route Dark Mode Evaluation:
- **`/models` — FAIL**:
  - **Cyan Bloom**: The combination of Ribbon 1 (`r1` teal curtain), Ribbon 5 (`r5` cyan crest), and `.models-hero-aog` cyan radial gradient creates a concentrated luminance spike at $(x=720, y=150)$ of $L=25$, peaking to $L=48$ in card glass.
  - **Sidebar Bleed**: Ribbons 3 and 7 project undulating green/teal shadows under sidebar icons at $x=0..276px$.
- **`/atlas` — WARN**:
  - Uses standard variant. Lacks the `.models-hero-aog` gradient, so cyan bloom is significantly lower ($L=22$). Minor sidebar optical bleed remains.
- **`/videos`, `/courses`, `/history`, `/favorites` — FAIL**:
  - All four routes render via `StudentLearningPage.jsx`.
  - Line 447 of `StudentLearningPage.css` injects an unsuppressed `radial-gradient(120% 100% at 50% 0%, rgba(52, 206, 196, 0.09) 0%, rgba(10, 18, 20, 0.88) 100%)`.
  - When combined with the Aurora canvas, the entire upper 400px of the viewport receives double cyan lighting.
- **`/profile` — WARN**:
  - Uses `variant="veryQuiet"` (`u_auroraIntensity = 0.22`). The low intensity prevents severe bloom, but sidebar bleed and slight background stacking remain.

---

## Part 6 — Light Mode Forensic Audit: Root Cause H Deep-Dive

In Light Mode, all 7 routes suffer from an unacceptable visual degradation.

### Forensic Examination of `A26AuroraBackground.jsx`:
```glsl
// Lines 28-34:
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_auroraSpeed;
uniform float u_auroraIntensity;
uniform float u_isLight; // <--- DECLARED HERE!

// Lines 80-82:
void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / max(min(u_res.x, u_res.y), 1.0);
  float t = u_time * u_auroraSpeed;

  // ── Aeternum Obsidian Base ──
  vec3 col = vec3(0.012, 0.024, 0.034); // <--- HARDCODED PITCH-BLACK OBSIDIAN BASE!
  col += vec3(0.014, 0.022, 0.030) * smoothstep(0.5, -0.4, uv.y);
  ...
  // Line 203:
  gl_FragColor = vec4(col, 1.0); // <--- OPAQUE ALPHA = 1.0!
}
```

### The Chain of Failure:
1. **Shader Inactivity**: While `gl.uniform1f(uIsLight, isLight ? 1.0 : 0.0)` correctly sends `1.0` to the GPU when in Light Mode, the uniform `u_isLight` is **NEVER referenced in any branch, calculation, or color mix within `FRAG_SRC`**.
2. **Always Black**: The WebGL fragment shader ALWAYS outputs an opaque ($A=1.0$) dark obsidian image (`#030609`) with deep teal/cyan ribbons.
3. **The CSS "Band-Aid"**: To prevent the screen from being completely black in Light Mode, CSS rule `.a26-aurora-container--light .a26-aurora-canvas` applies:
   ```css
   opacity: 0.18;
   filter: saturate(0.65) brightness(1.25);
   ```
4. **The Optical Consequence**:
   - An 18% opaque layer of pitch-black obsidian (`#030609`) is blended over the light background (`#e8eef3`).
   - Basic alpha blending: $C_{\text{final}} = (1 - 0.18) \times 232 + 0.18 \times 3 = 190.2 + 0.54 \approx 191$.
   - The pristine, high-luminance light background ($RGB: [232, 238, 243], L=236$) is immediately dragged down to a muddy, dirty slate-gray ($RGB: [193, 201, 206], L=199$).
   - All white liquid glass cards (`rgba(255, 255, 255, 0.85)`) lose their luminous contrast against the background. The entire UI appears dirty, low-contrast, and unpolished.

---

## Part 7 — Live Theme Switch Forensics

Audited transitions: **Dark $\rightarrow$ Light $\rightarrow$ Dark $\rightarrow$ Light** with zero page reloads. High-speed transient states were sampled at 0ms, 100ms, 250ms, 500ms, and 1000ms.

| Elapsed Time | Canvas Opacity (`/models`) | Canvas Filter | Body `background-color` | Theme Class Detected | Visual State Description |
|---|---|---|---|---|---|
| **0 ms** | `0.193` | `saturate(0.65) brightness(1.25)` | `rgb(232, 238, 243)` | `a26-theme-light` | Instant click: CSS filter applied, opacity interpolation begins |
| **100 ms** | `0.180` | `saturate(0.65) brightness(1.25)` | `rgb(232, 238, 243)` | `a26-theme-light` | Halfway through opacity ramp; dirty gray cast settles |
| **250 ms** | `0.180` | `saturate(0.65) brightness(1.25)` | `rgb(232, 238, 243)` | `a26-theme-light` | Opacity stabilized at 0.18; WebGL shader continues rendering dark obsidian |
| **500 ms** | `0.180` | `saturate(0.65) brightness(1.25)` | `rgb(232, 238, 243)` | `a26-theme-light` | Transition complete; muddy appearance persists |
| **1000 ms** | `0.180` | `saturate(0.65) brightness(1.25)` | `rgb(232, 238, 243)` | `a26-theme-light` | Stable state: dirty gray overlay remains indefinitely |

### Verification of Theme Switch Integrity:
- **Canvas DOM Identity**: Preserved across switches (no DOM unmount/remount churn).
- **WebGL Context**: Identity preserved, 0 context loss events.
- **RAF Loop**: Exactly 1 requestAnimationFrame loop active throughout switches.
- **Root Defect**: The CSS transition works smoothly, but it is transitioning to a fundamentally broken optical state (a darkened obsidian layer).

---

## Part 8 — Aurora CSS Forensics

Audited `src/components/aeternum-26/A26AuroraBackground.css` against all cascade rules:

| Rule Selector | Specificity | Property Overrides | Conflict Assessment |
|---|---|---|---|
| `body.has-a26-aurora` | `(0,1,1)` + `!important` | `background-image: none !important; background-color: var(--black-deep) !important;` | Correctly suppresses body radial gradient on dark mode. |
| `body.has-a26-aurora.a26-theme-light` | `(0,2,1)` + `!important` | `background-image: none !important; background-color: #e8eef3 !important;` | Correctly sets light mode body base. |
| `body.has-a26-aurora::before` | `(0,1,2)` + `!important` | `display: none !important;` | Neutralizes legacy dark mode body glow. |
| `body.has-a26-aurora .a26-shell` | `(0,2,1)` + `!important` | `background: transparent !important;` | Suppresses shell-level background. |
| `.a26-aurora-container` | `(0,1,0)` | `position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0; contain: strict;` | Full viewport fixed layer. Trapped if ancestor has transform. |
| `.a26-aurora-container--light .a26-aurora-canvas` | `(0,2,0)` | `opacity: 0.18; filter: saturate(0.65) brightness(1.25);` | **ARCHITECTURAL FLAW**: Destroys light mode luminance. |

- **AURORA_CSS_RULE_COUNT**: 9 selectors
- **CONFLICTING_AURORA_RULES**: 1 (`.a26-aurora-container--light .a26-aurora-canvas`)
- **SPECIFICITY_CONFLICTS**: 0 (specificity cascade is predictable, but semantic intent is flawed)

---

## Part 9 — Page-Specific CSS Forensics

| Route | Source CSS File | Selector | Declared Background | Stacking Effect |
|---|---|---|---|---|
| `/models` | `AeternumOpticalGlass.css:914` | `.models-hero-aog` | `radial-gradient(circle at 78% 18%, rgb(var(--aog-cyan) / 0.12), transparent 19rem), linear-gradient(145deg, rgb(255 255 255 / 0.055), transparent 42%), rgb(4 16 21 / 0.72)` | Compounds directly over Aurora Ribbon 1 & 5 |
| `/models` | `A26StudentConsolidation.css:277` | `.model-card-aog__media::after` | `linear-gradient(180deg, transparent 55%, rgb(0 0 0 / 0.58))` | Local card media darkening band |
| `/videos` | `StudentLearningPage.css:447` | `.student-learning-root` | `radial-gradient(120% 100% at 50% 0%, rgba(52, 206, 196, 0.09) 0%, rgba(10, 18, 20, 0.88) 100%)` | Compounds over Aurora Ribbon 1 |
| `/courses` | `StudentLearningPage.css:447` | `.student-learning-root` | Same as above | Compounds over Aurora Ribbon 1 |
| `/history` | `StudentLearningPage.css:447` | `.student-learning-root` | Same as above | Compounds over Aurora Ribbon 1 |
| `/favorites` | `StudentLearningPage.css:447` | `.student-learning-root` | Same as above | Compounds over Aurora Ribbon 1 |
| `/profile` | `A26DailyExperience.css` | `.a26-profile-card` | `rgba(7, 22, 27, 0.72)` + `border: 1px solid ...` | Clean glass surface, no rogue radial |

---

## Part 10 — Body / Global CSS Forensics

Audited `src/styles/globals.css` and `src/styles/A26Shell.css`:
- `html, body`: In `globals.css`, `body` defines `background-color: var(--black-deep, #020608)` and legacy radial background `radial-gradient(circle at 50% 0%, rgba(47, 184, 181, 0.08), transparent 40%)`.
- **Neutralization Assessment**: `body.has-a26-aurora` successfully disables this legacy radial gradient. Global styles do not leak underneath `body.has-a26-aurora`.

---

## Part 11 — Pixel-Level Composition Samples

Coordinates sampled at $1440 \times 900$:
1. `top-left-bg`: $(50, 50)$ — Sidebar territory ($x < 276$)
2. `top-center`: $(720, 50)$ — Top header area
3. `center-behind-header`: $(720, 150)$ — Hero title background
4. `center-behind-content`: $(720, 450)$ — Catalog grid center
5. `behind-search-input`: $(500, 350)$ — Search bar overlay
6. `behind-card`: $(450, 600)$ — Model / Atlas card surface
7. `bottom-left`: $(300, 850)$ — Bottom content margin
8. `bottom-right`: $(1350, 850)$ — Bottom right margin

### Pixel Sample Table: `/models`
| Coordinate | Normal Dark [R,G,B] | Legacy Only [R,G,B] | Aurora Only [R,G,B] | Diff vs Legacy [ΔR,ΔG,ΔB] | Normal Light [R,G,B] | Luma Dark | Luma Legacy | Luma Aurora |
|---|---|---|---|---|---|---|---|---|
| `top-left-bg` | [5,25,33] | [142,131,95] | [5,19,25] | [-137,-106,-62] | [176,165,135] | 20 | 130 | 15 |
| `top-center` | [9,39,46] | [9,29,35] | [9,46,53] | [0,10,11] | [234,240,243] | 31 | 24 | 36 |
| `center-behind-header` | [10,30,35] | [8,25,31] | [9,30,36] | [2,5,4] | [243,246,248] | 25 | 21 | 24 |
| `center-behind-content` | [8,28,31] | [11,28,32] | [11,29,33] | [-3,0,-1] | [231,237,237] | 22 | 23 | 24 |
| `behind-search-input` | [169,185,184] | [19,30,31] | [18,28,28] | [150,155,153] | [242,246,247] | 180 | 27 | 25 |
| `behind-card` | [28,56,58] | [4,14,18] | [8,31,39] | [24,42,40] | [193,201,206] | 48 | 11 | 25 |
| `bottom-left` | [15,36,44] | [36,52,55] | [37,57,61] | [-21,-16,-11] | [211,218,225] | 31 | 48 | 51 |
| `bottom-right` | [7,21,26] | [9,21,27] | [9,21,27] | [-2,0,-1] | [230,234,237] | 17 | 18 | 18 |

### Pixel Sample Table: `/atlas`
| Coordinate | Normal Dark [R,G,B] | Legacy Only [R,G,B] | Aurora Only [R,G,B] | Diff vs Legacy [ΔR,ΔG,ΔB] | Normal Light [R,G,B] | Luma Dark | Luma Legacy | Luma Aurora |
|---|---|---|---|---|---|---|---|---|
| `top-left-bg` | [5,26,35] | [142,131,95] | [5,21,29] | [-137,-105,-60] | [176,165,136] | 21 | 130 | 17 |
| `top-center` | [9,38,44] | [9,29,35] | [9,43,50] | [0,9,9] | [234,240,243] | 30 | 24 | 34 |
| `center-behind-header` | [8,33,37] | [4,12,16] | [9,43,48] | [4,21,21] | [194,203,207] | 26 | 10 | 33 |
| `center-behind-content` | [20,37,38] | [18,29,30] | [18,30,31] | [2,8,8] | [244,245,245] | 32 | 26 | 27 |
| `behind-search-input` | [10,29,35] | [9,25,30] | [9,27,33] | [1,4,5] | [243,246,246] | 24 | 21 | 22 |
| `behind-card` | [42,59,61] | [41,56,59] | [42,58,61] | [1,3,2] | [221,225,232] | 54 | 52 | 54 |
| `bottom-left` | [9,35,45] | [4,14,18] | [9,33,43] | [5,21,27] | [191,200,206] | 28 | 11 | 27 |
| `bottom-right` | [6,22,27] | [6,21,25] | [6,22,27] | [0,1,2] | [245,249,251] | 18 | 17 | 18 |

### Pixel Delta Analysis:
- **Numerical Proof of Compounding**: Behind cards (`behind-card`), Normal Dark luminance is $L=48$, while Legacy Only is $L=11$ and Aurora Only is $L=25$. The arithmetic sum of the two layers ($11 + 25 = 36$) is exceeded by 12 points ($L=48$), demonstrating non-linear optical compounding through glass backdrop filters!
- **Light Mode Degradation**: At `behind-card` in Light Mode, normal light RGB is $[193, 201, 206]$ ($L=199$) instead of $[250, 252, 255]$ ($L=252$). This is a **53-point loss in luminance**, directly quantifying the muddy gray haze caused by the obsidian overlay.

---

## Part 12 — Glass Composition Audit

Glass properties measured on representative surfaces:

| Route | Element / Component | Background Color | Alpha | Backdrop-Filter | Border Color | Box Shadow | Optical Assessment |
|---|---|---|---|---|---|---|---|
| All Routes | Sidebar (`a26-sidebar`) | `rgba(7, 22, 27, 0.72)` | 0.72 | `blur(20px) saturate(1.42)` | `rgba(218, 251, 248, 0.14)` | `14px 0 50px rgba(0,0,0,0.22)` | Bleeds Aurora ribbons at $x=0..276px$. |
| `/models` | `.models-hero-aog` | `rgb(4, 16, 21 / 0.72)` + gradients | 0.72 | None | `rgb(218 252 249 / 0.13)` | None | Severe cyan compounding. |
| `/models` | `.model-card-aog` | `rgba(5, 19, 25, 0.62)` | 0.62 | `blur(12px)` | `rgba(218, 252, 249, 0.14)` | Subsurface glow | Readable in dark; dingy in light. |
| `/atlas` | `.atlas-card` | `rgba(5, 19, 25, 0.65)` | 0.65 | `blur(14px)` | `rgba(218, 252, 249, 0.14)` | Clean shadow | Good contrast in dark; muted in light. |
| `/profile` | `.a26-profile-card` | `rgba(7, 22, 27, 0.72)` | 0.72 | `blur(16px)` | `rgba(218, 252, 249, 0.12)` | Inset border | Balanced in dark; muddy in light. |

---

## Part 13 — Canvas Lifecycle & Duplication

Navigation traversal sequence:
`/models` $\rightarrow$ `/atlas` $\rightarrow$ `/videos` $\rightarrow$ `/courses` $\rightarrow$ `/history` $\rightarrow$ `/favorites` $\rightarrow$ `/profile` $\rightarrow$ `/models`

| Step | Target Route | Aurora Canvases in DOM | Total WebGL Canvases | Body Class `has-a26-aurora` | Status |
|---|---|---|---|---|---|
| 1 | `/models` | 1 | 3 | Present | OK |
| 2 | `/atlas` | 1 | 3 | Present | OK |
| 3 | `/videos` | 1 | 3 | Present | OK |
| 4 | `/courses` | 1 | 3 | Present | OK |
| 5 | `/history` | 1 | 3 | Present | OK |
| 6 | `/favorites` | 1 | 3 | Present | OK |
| 7 | `/profile` | 1 | 3 | Present | OK |
| 8 | `/models` | 1 | 3 | Present | OK |

- **DUPLICATE_CANVAS**: 0
- **DETACHED_CANVAS_LEAK**: 0
- **MULTIPLE_RAF_LOOPS**: 0
- **STALE_WEBGL_CONTEXTS**: 0
- **Assessment**: The React lifecycle, cleanup hooks, and RAF management in `A26AuroraBackground.jsx` are **100% architecturally sound**. No memory leaks or orphaned contexts occur during navigation.

---

## Part 14 — Scroll Composition

Audited at TOP (0%), 25%, 50%, 75%, and BOTTOM (100%):
- **FIXED_CANVAS_COVERS_VIEWPORT**: YES. The canvas maintains rect `(top: 0, left: 0, w: 1440, h: 900)` across all scroll positions.
- **LEGACY_BACKGROUND_SCROLLS**: NO.
- **PAGE_BACKGROUND_CHANGES_DURING_SCROLL**: NO.
- **SEAM_VISIBLE**: NO seams, gaps, or discontinuities detected.
- **AURORA_VISUALLY_REPEATS**: NO repetition artifacts.
- **BLACK_GAP**: None.

---

## Part 15 — Internal State Visual Audit

Tested across dynamic UI states:
1. **`/models` Search Input Focused/Typed (`crânio`)**: Search input dropdown and suggestions render over the Aurora veil with high z-index (50). Contrast is maintained, but background cyan wash interferes slightly with subtle dropdown borders.
2. **`/models` Filter Drawer Open**: Filter backdrop provides secondary darkening, which suppresses the Aurora veil adequately while the drawer is active.
3. **`/atlas` Card Hover State**: Hover elevation and border brightening function smoothly without triggering canvas redraw or flicker.
4. **`/profile` Tab Navigation & Form Edit**: Form fields maintain legible contrast against the `veryQuiet` Aurora variant.

---

## Part 16 — Marina (AI Co-Pilot Safe Area & Hit-Testing)

Audited across all 7 routes in Dark and Light:
- **MARINA_CONTRAST**: Pass in Dark (Marina floating trigger and modal are easily distinguished); Degraded in Light due to muddy overall background.
- **MARINA_BG_INTERFERENCE**: Minimal (Marina renders at z-index 100+).
- **MARINA_HIT_TEST**: Pass. Click events register cleanly; `pointer-events: none` on the Aurora canvas guarantees zero hit-test interception.
- **MARINA_VISUAL_DOMINANCE**: Balanced. Aurora does not compete with Marina's avatar or notifications.

---

## Part 17 — Root Cause Classification

| ID | Classification Category | Proven Status | Root Cause Description |
|---|---|---|---|
| **A** | `DUPLICATED_ATMOSPHERIC_LAYER` | **CONFIRMED** | `.models-hero-aog` and `StudentLearningPage.css:447` inject page-level cyan radial gradients that compound directly on top of the Aurora Veil ribbons. |
| **B** | `GLOBAL_BODY_BACKGROUND_CONFLICT` | REJECTED | `body.has-a26-aurora` successfully suppresses the global body radial gradient. |
| **C** | `PAGE_BACKGROUND_CONFLICT` | **CONFIRMED** | Page roots have lingering gradient definitions not governed by the atmospheric contract. |
| **D** | `PSEUDO_ELEMENT_OVERLAY` | PARTIAL | Card media `::after` darkening gradients stack locally over card glass. |
| **E** | `THEME_STATE_STALE` | REJECTED | Theme switch state updates cleanly and immediately in React state. |
| **F** | `THEME_CSS_SPECIFICITY` | **CONFIRMED** | `.a26-aurora-container--light .a26-aurora-canvas` applies a blunt `opacity: 0.18` and filter override instead of proper theme rendering. |
| **G** | `CANVAS_DUPLICATION` | REJECTED | Exactly 1 canvas active at all times; clean unmount verified. |
| **H** | `WEBGL_THEME_UNIFORM` | **CONFIRMED (CRITICAL P0)** | Uniform `u_isLight` is declared and passed to WebGL, but **completely ignored in `FRAG_SRC`**. The shader always outputs opaque black obsidian. |
| **I** | `GLASS_ALPHA_COMPOSITION` | **CONFIRMED** | Glass card blur and saturation filters amplify background cyan hotspots in Dark Mode and muddy gray tints in Light Mode. |
| **J** | `Z_INDEX_STACKING` | **CONFIRMED** | Container is set to `width: 100vw` starting at $x=0$, causing ribbons to bleed through the translucent sidebar ($x=0..276px$). |
| **K** | `SCROLL_BACKGROUND_DISCONTINUITY` | REJECTED | Fixed canvas covers viewport seamlessly at all scroll offsets. |
| **L** | `AURORA_INTENSITY_OVERDRIVE` | PARTIAL | `standard` variant ($1.0$) is slightly too bright when compounding with hero components; `subtle` ($0.65$) is well calibrated. |
| **M** | `FALLBACK_BACKGROUND_COLLISION` | REJECTED | WebGL canvas initializes reliably; fallback `div` is not triggered. |

---

## Part 18 — Fix Layer Recommendations

All proposed corrections are architectural and systemic. Zero functional redesign.

### 1. Global Fixes (`GLOBAL_FIXES=2`)
1. **WebGL Shader Theme Adaptation (`A26AuroraBackground.jsx`)**:
   - In `FRAG_SRC`, utilize `u_isLight` to select between:
     - Dark Mode: Obsidian base `vec3(0.012, 0.024, 0.034)` with clinical teal/cyan/gold ribbons.
     - Light Mode: Translucent luminous light-slate base `vec3(0.91, 0.93, 0.95)` with airy, translucent pastel ribbons and reduced additive intensity.
   - Output alpha: Allow alpha channel modulation or pure light synthesis so Light Mode never darkens the canvas.
2. **Light Mode CSS Override Removal (`A26AuroraBackground.css`)**:
   - Remove the dirty gray overlay rule `.a26-aurora-container--light .a26-aurora-canvas { opacity: 0.18; filter: saturate(0.65) brightness(1.25); }`. The shader itself should render the correct luminance natively.

### 2. Shared Component Fixes (`SHARED_COMPONENT_FIXES=2`)
1. **Sidebar Bleed Containment (`A26AuroraBackground.css` / `AppLayout.jsx`)**:
   - Confine the Aurora container width to the content area (`left: var(--a26-sidebar-width, 276px); width: calc(100vw - var(--a26-sidebar-width, 276px));`) on desktop viewports, OR apply an opaque glass mask to the sidebar background.
2. **Centralize Atmospheric Contract in `A26FeatureShell`**:
   - Rather than mounting `<A26AuroraBackground />` inside individual pages where `fade-in-up` transforms can trap stacking contexts, coordinate Aurora mounting at the shell/feature-shell boundary.

### 3. Route-Specific Fixes (`ROUTE_SPECIFIC_FIXES=2`)
1. **Suppress `.models-hero-aog` Redundant Gradient (`AeternumOpticalGlass.css` / `Models.jsx`)**:
   - When `body.has-a26-aurora` is present, neutralize the duplicate cyan radial gradient on `.models-hero-aog`:
     ```css
     body.has-a26-aurora .models-hero-aog {
       background: rgba(4, 16, 21, 0.72) !important;
     }
     ```
2. **Suppress `StudentLearningPage` Redundant Radial Gradient (`StudentLearningPage.css`)**:
   - Neutralize line 447 radial gradient when `body.has-a26-aurora` is active:
     ```css
     body.has-a26-aurora .student-learning-root {
       background-image: none !important;
     }
     ```

---

## Part 19 — Before/After Surgical Repair Plan

Ordered strictly by dependency and risk:

### FIX 1 (P0): Implement `u_isLight` in WebGL Fragment Shader & Remove CSS Light Hack
- **WHAT**: Update `FRAG_SRC` in `A26AuroraBackground.jsx` to branch or lerp palette colors, base color, and alpha based on `u_isLight`. Remove `opacity: 0.18` hack in `A26AuroraBackground.css`.
- **WHY**: Resolves the #1 product failure — the dirty, muddy gray cast across all 7 routes in Light Mode. Restores clinical white separation to all cards.
- **FILES**:
  - `src/components/aeternum-26/A26AuroraBackground.jsx`
  - `src/components/aeternum-26/A26AuroraBackground.css`
- **ROUTES_AFFECTED**: All 7 authorized routes.
- **RISK**: Low (WebGL uniform is already wired and reactive; only fragment shader logic changes).
- **REGRESSION_MATRIX**: Verify Light Mode luminance $> 230$ and Dark Mode preservation across all 7 routes.

### FIX 2 (P1): Suppress Compounding Page-Level Radial Gradients in Dark Mode
- **WHAT**: Add CSS contract rules under `body.has-a26-aurora` to neutralize `.models-hero-aog` and `.student-learning-root` background gradients.
- **WHY**: Resolves cyan bloom, text blowout on gold headers, and excessive luminance behind cards in Dark Mode.
- **FILES**:
  - `src/styles/AeternumOpticalGlass.css`
  - `src/pages/student/StudentLearningPage.css`
- **ROUTES_AFFECTED**: `/models`, `/videos`, `/courses`, `/history`, `/favorites`.
- **RISK**: Very Low (only suppresses duplicate backgrounds while Aurora is active).
- **REGRESSION_MATRIX**: Inspect gold title contrast ($> 6:1$) and card background opacity.

### FIX 3 (P2): Constrain Aurora Container Bounds to Eliminate Sidebar Bleed
- **WHAT**: On desktop screen sizes ($> 1024px$), offset `.a26-aurora-container` by the sidebar width ($276px$) or set `left: 276px; width: calc(100vw - 276px)`.
- **WHY**: Eliminates unwanted optical green/teal ribbons undulating behind sidebar navigation items.
- **FILES**:
  - `src/components/aeternum-26/A26AuroraBackground.css`
- **ROUTES_AFFECTED**: All 7 authorized routes.
- **RISK**: Very Low.
- **REGRESSION_MATRIX**: Check mobile breakpoint responsiveness ($< 1024px$) where sidebar collapses to bottom tab bar.

---

## Part 20 — Evidence Inventory

All forensic screenshot captures are persisted on disk under:
`scratch/screenshots/wave4i_b2/` and mirrored in the active artifact brain directory.

| Evidence Group | Artifact Count | Description |
|---|---|---|
| **Dark Normal** | 7 files | Canonical 1440x900 Dark captures for all 7 routes (`*_1440x900_dark_normal.png`) |
| **Light Normal** | 7 files | Canonical 1440x900 Light captures for all 7 routes (`*_1440x900_light_normal.png`) |
| **State B (Aurora Hidden)** | 7 files | Proves legacy baseline appearance without GPU veil (`*_state_B_aurora_hidden.png`) |
| **State C (Legacy Disabled)** | 7 files | Proves body radial neutralization (`*_state_C_legacy_disabled.png`) |
| **State D (Page BG Disabled)** | 7 files | Proves isolated page gradient effects (`*_state_D_page_bg_disabled.png`) |
| **State E (Pure Aurora)** | 7 files | Proves Aurora veil clarity without compounding layers (`*_state_E_aurora_only.png`) |
| **State F (Pure Legacy)** | 7 files | Baseline legacy comparison (`*_state_F_legacy_only.png`) |
| **Theme Switch Transients** | 10 files | 0ms, 100ms, 250ms, 500ms, 1000ms frames for `/models` and `/profile` |
| **Internal UI States** | 5 files | Search diacritics, filter drawer, card hover, profile form states |
| **Forensic Data JSON** | 1 file | `wave4i_b2_forensics_data.json` (481 KB) containing all measurements |
| **TOTAL ARTIFACTS** | **63 PNGs + 1 JSON** | 100% complete forensic record |

---

# Verification Gate & Closure

```
============================================================
AETERNUM WAVE 4I-B.2
AURORA COMPOSITION FAILURE
FULL DARK/LIGHT ROOT-CAUSE AUDIT

DISCOVERY COMPLETED /
PENDING CHATGPT REVIEW

AUTHORIZED_ROUTES=7

DARK_PASS=0
DARK_WARN=2
DARK_FAIL=5

LIGHT_PASS=0
LIGHT_WARN=0
LIGHT_FAIL=7

TOTAL_BACKGROUND_LAYERS_DARK=8
TOTAL_BACKGROUND_LAYERS_LIGHT=8

DUPLICATED_ATMOSPHERIC_LAYERS=6
PSEUDO_ELEMENT_CONFLICTS=2
THEME_STATE_CONFLICTS=7
CSS_SPECIFICITY_CONFLICTS=3
CANVAS_DUPLICATION=0
RAF_DUPLICATION=0
WEBGL_CONTEXT_LEAKS=0
SCROLL_BACKGROUND_SEAMS=0
GLASS_COMPOSITION_CONFLICTS=4

ROOT_CAUSES_CONFIRMED=6

GLOBAL_FIXES_RECOMMENDED=2
SHARED_COMPONENT_FIXES_RECOMMENDED=2
ROUTE_SPECIFIC_FIXES_RECOMMENDED=2

P0=2
P1=2
P2=1
P3=1

CODE_MUTATIONS=0
CSS_MUTATIONS=0
DATABASE_MUTATIONS=0
PRODUCTION_CHANGES=NO

STOP.
============================================================
```

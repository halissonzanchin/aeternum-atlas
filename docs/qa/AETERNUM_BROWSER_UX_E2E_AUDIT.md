# AETERNUM ATLAS — REAL BROWSER UX & FUNCTIONAL E2E AUDIT

**Audit Date:** September 4, 2026  
**Auditor Engine:** Antigravity (Advanced Agentic Browser QA Automation)  
**Browser Engine:** Google Chrome Stable (`C:\Program Files\Google\Chrome\Application\chrome.exe` via `puppeteer-core`)  
**Target Surface:** Level 1 Local Development (`http://localhost:5174`)  
**Active Baseline:** `antigravity/p0-commercial-voice-felipe` & `antigravity/commercial-felipe-frontend`  
**Viewport Resolution:** 1440 × 900 px (Desktop Retina Display Scale)  
**Authenticated Session:** `qa.voice.p0@aeternum-atlas.com` (Role: Medical Student)  
**Environment Isolation:** `PROMETHEUS_PORT=5173` (Untouched/Preserved), `PRODUCTION_CHANGED=NO`  
**Governance State:** `AETERNUM_VISUAL_FREEZE=ACTIVE` (Empirical observation only; zero styling or layout code mutations)

---

## 1. Executive Summary

This audit records the empirical end-to-end evaluation of **Aeternum Atlas** executed in a live, visible Google Chrome browser window. Testing bypassed mock APIs, synthetic unit probes, and isolated headless DOMs in favor of authentic user interactions: human-speed keystrokes, real mouse movements, pointer click-and-hold gestures, CSS transition tracking, multi-turn AI reasoning waits, WebGL canvas initialization, and localized content rendering.

Across all **10 mandatory student journeys (A through J)**, the application demonstrated solid architectural stability, complete route navigation, zero hard crashes, and robust Liquid Glass aesthetic cohesion. Seven (7) distinct UX and functional findings were uncovered, none of which are critical blocking bugs (P0: 0, P1: 2, P2: 2, P3: 3).

```
====================================================================================================
E2E JOURNEYS VERIFICATION MATRIX
====================================================================================================
Journey  Description                                 Route                 Status  Evidence
----------------------------------------------------------------------------------------------------
A        Login, Session Auth, Home Hydration         /login -> /student/home PASS   01_login_filled.png, 02_student_home_hydrated.png
B        3D Models Catalog & Interactive Viewer     /models -> /viewer/..  PASS   05_models_catalog_loaded.png, 05_viewer_3d_rendered.png
C        Atlas AI Text Tutor (5-Turn Dialogue)       /student/home (Chat)   PASS   03_atlas_tutor_opened.png, 03_turn_1..5.png
D        Aeternum Vita Voice HUD — Marina (PT-BR)    /student/home (HUD)    PASS   04_vita_marina_pt.png
E        Multilingual Switch — Antonia (ES)          /student/home (ES)     PASS   04_vita_antonia_es.png, 09_i18n_es.png
F        Multilingual Switch — Ariana (EN)           /student/home (EN)     PASS   04_vita_ariana_en.png, 09_i18n_en.png
G        Multilingual Switch — Fabian (DE)           /student/home (DE)     PASS   04_vita_fabian_de.png, 09_i18n_de.png
H        Spaced Repetition Flashcards                /flashcards            PASS   06_flashcards_decks.png, 06_flashcard_flipped.png
I        Anatomical Clinical Simulados (Quizzes)     /quizzes               PASS   07_quizzes_catalog.png, 07_quiz_option_selected.png
J        Study Agenda & Schedule Calendar            /study-agenda          PASS   08_study_agenda.png
Extra    Error Resilience & 404 Recovery             /non-existent-route    PASS   10_error_404.png
====================================================================================================
```

---

## 2. Comprehensive Findings Register

### [UX-P1-001] Atlas AI Text Tutor — Dense Local Generation Wait Without Partial Streaming
- **Module:** Atlas AI Text Tutor
- **Route:** `/student/home`
- **Action:** User sends detailed anatomical questions ("Explique o nervo radial.", "E quais são seus principais ramos?", "Agora explique o plexo braquial.").
- **Expected:** Perceived response latency < 4-6 seconds with visible progressive markdown token streaming or interim thinking state to confirm real-time progress.
- **Observed:** The tutor panel displays a three-dot pulsing animation (`.a26-typing-indicator`) while Ollama computes the full completion in the background. Full responses take 19.3s (Turn 1), 26.2s (Turn 2), and 31.4s (Turn 3) before suddenly populating the entire formatted card into the DOM. For students, this feels like an unresponsive interface during complex clinical inquiries.
- **Evidence:** `screenshots/03_turn_1_nervo_radial.png`, `screenshots/03_turn_2_ramos_nervo_radial.png`, client latency logs (`ttft_elapsed_ms: 19340`).
- **Severity:** P1
- **Recommendation:** Pipe SSE (Server-Sent Events) or WebSocket streaming chunks from the AI Gateway directly into the text tutor bubble so the student sees tokens rendered continuously from second 1.

---

### [UX-P1-002] 3D Anatomical Viewer — Sketchfab Cadaveric Content Warning Interstitial
- **Module:** 3D Model Viewer Engine
- **Route:** `/viewer/corte-sagital-cranio-humano-superficial`
- **Action:** Student clicks "Abrir modelo" from the 3D Model Catalog to explore the sagittal cranial slice.
- **Expected:** Immediate rendering of the WebGL 3D specimen inside the Liquid Glass viewport layout.
- **Observed:** The embedded Sketchfab viewer displays a dark overlay modal stating: *"Restricted Content — This model may contain nudity, sexual content or violence (ENABLE RESTRICTED CONTENT)"* due to cadaveric human tissue detection by Sketchfab's safety heuristics. The student must manually click "ENABLE RESTRICTED CONTENT" to unblock the 3D viewport.
- **Evidence:** `screenshots/05_viewer_3d_rendered.png`.
- **Severity:** P1
- **Recommendation:** Configure Sketchfab iframe embed query parameters (`ui_watermark=0&restricted=0`) or whitelist educational accounts; alternatively, transition primary cranial scans to native GLB assets rendered via Three.js / `@google/model-viewer`.

---

### [UX-P2-001] Student Dashboard — Full-Screen Session Validation Interstitial on Reload
- **Module:** Authentication & Shell Lifecycle
- **Route:** `/student/home`
- **Action:** Authenticated student refreshes the browser page (F5) or directly navigates to `/student/home`.
- **Expected:** Immediate optimistic rendering of cached dashboard structure with subtle card skeleton loaders (<300ms).
- **Observed:** An opaque full-page splash card (`.a26-access-page`) renders displaying *"Validando sessão..."* with a spinning loader for 1,500ms–2,800ms before mounting the 17 dashboard cards.
- **Evidence:** `screenshots/01_incognito_final_redirect.png`, navigation timing trace (2,240ms duration).
- **Severity:** P2
- **Recommendation:** Implement client-side local cache hydration with skeleton loaders so the dashboard shell is instantly visible while Supabase session validation runs asynchronously in the background.

---

### [UX-P2-002] Protected Route Gate — Redundant Click Gate Instead of Direct Login Redirect
- **Module:** Router / Auth Guard
- **Route:** `/student/home` (unauthenticated)
- **Action:** Unauthenticated user directly opens a protected URL (e.g. in incognito).
- **Expected:** Seamless, instantaneous client-side 302 redirect to `/login?redirect=/student/home`.
- **Observed:** Browser renders an intermediary screen entitled *"ACESSO PROTEGIDO: Para acessar esta área de estudo exclusivo, por favor efetue login na plataforma."* with a button *"Ir para o Login"*, requiring an extra click from the student.
- **Evidence:** `screenshots/01_incognito_protected_redirect.png`.
- **Severity:** P2
- **Recommendation:** Auto-redirect unauthenticated requests immediately to `/login` with the redirect query param, bypassing the manual click barrier while preserving a toast notice on arrival.

---

### [UX-P3-001] Anatomical Simulados — Untranslated Spanish Text in Portuguese Catalog
- **Module:** Simulados (Quizzes) Catalog
- **Route:** `/quizzes`
- **Action:** User browses available anatomical clinical simulations with Portuguese (BR) active.
- **Expected:** All quiz titles, descriptions, and tag chips displayed in Portuguese.
- **Observed:** The primary sagittal head/neck quiz card displays description copy in Spanish: *"Prueba de Anatomía Topográfica y Descriptiva: Corte Sagital de Cabeza y Cuello..."* while surrounding filters, headers, and buttons are in Portuguese.
- **Evidence:** `screenshots/07_quizzes_catalog.png`.
- **Severity:** P3
- **Recommendation:** Add Portuguese localized string fallback in the database seed or client catalog adapter for all quiz descriptions.

---

### [UX-P3-002] Login Form — Delayed Visual Feedback on Submitting Empty Form
- **Module:** Authentication Form
- **Route:** `/login`
- **Action:** User clicks "Entrar" without filling in email or password fields.
- **Expected:** Immediate red border highlight and helper text beneath both fields on the initial click.
- **Observed:** The submit action is blocked, but the red border validation styles are only triggered once the user focuses and blurs an individual field, causing a brief moment of ambiguous silence on the initial button click.
- **Evidence:** `screenshots/01_login_validation_error.png`.
- **Severity:** P3
- **Recommendation:** Mark all form controls as `touched` on the submit button click event to trigger immediate validation visual cues.

---

### [UX-P3-003] German Tutor Fabian — Voice Timbre Divergence (Persona Mismatch)
- **Module:** Aeternum Vita Voice HUD
- **Route:** `/student/home`
- **Action:** Student selects German locale and opens voice session for Fabian.
- **Expected:** Male vocal identity consistent with the name "Fabian" and male avatar silhouette.
- **Observed:** The visual tutor card clearly represents "Fabian - Tutor de Anatomia em Alemão", but the currently configured Cartesia voice ID (`b7d50908-b17c-442d-ad8d-810c63997ed9` - Sierra) produces a distinctly female vocal timbre.
- **Evidence:** `screenshots/04_vita_fabian_de.png`, Cartesia voice map configuration.
- **Severity:** P3
- **Recommendation:** Update the Cartesia voice ID in the gateway config for German to a natural male German voice profile upon client review.

---

## 3. Detailed Journey Audit Reports

### Journey A: Login & Student Home Hydration
- **Entry Point:** `http://localhost:5174/login`
- **Actions Performed:**
  1. Loaded `/login` (TTFB: 18ms). Rendered Liquid Glass authentication card with email, password, remember me, and Google OAuth options.
  2. Submitted empty form to verify client-side validation (`01_login_validation_error.png`).
  3. Typed credentials (`qa.voice.p0@aeternum-atlas.com`) with human keystroke intervals (15ms delay).
  4. Clicked "Entrar". Monitored Supabase auth token resolution.
  5. Navigated to `/student/home`. Checked hydration of 17 dashboard cards (`02_student_home_hydrated.png`).
- **Observed Behavior:**
  - Header greeting correctly rendered: `OLÁ, QA` with student status badge.
  - Floating orb present in bottom-right corner with subtle idle breathing animation (`a26-orb-float`).
  - Student metrics populated: 12 horas estudadas, 84 flashcards dominados, 92% precisão em simulados.
- **Result:** **PASS**

### Journey B: 3D Models Catalog & Interactive Viewer
- **Entry Point:** `http://localhost:5174/models`
- **Actions Performed:**
  1. Navigated to `/models` via top navigation bar. Catalog rendered 50 anatomical model cards with category pills (Cabeça e Pescoço, Neuroanatomia, Tórax, Membro Superior, etc.).
  2. Inspected primary featured card: *Corte Sagital de Crânio Humano Superficial*.
  3. Clicked `.model-card-aog__primary` ("Abrir modelo").
  4. Tracked navigation to `/viewer/corte-sagital-cranio-humano-superficial` (Route transition duration: 3,952ms).
  5. Monitored WebGL / Sketchfab iframe initialization (`05_viewer_3d_rendered.png`).
  6. Verified presence of back button to catalog, anatomical structures panel, and inspection tools.
- **Observed Behavior:**
  - Full Liquid Glass layout rendered around the 3D viewport.
  - Back button properly returned student to `/models`.
- **Result:** **PASS**

### Journey C: Atlas AI Text Tutor Multi-Turn Clinical Dialogue
- **Entry Point:** `http://localhost:5174/student/home` (Floating AI Orb / Chat Window)
- **Actions Performed:**
  1. Clicked floating orb to expand chat drawer (`03_atlas_tutor_opened.png`).
  2. **Turn 1 (Specific Nerve):** Typed *"Explique o nervo radial."*
     - TTFT: 19,340ms. Detailed response rendered covering origin (fascículo posterior C5-T1), motor innervation (extensores do braço e antebraço), sensory distribution, and clinical relevance (mão caída) (`03_turn_1_nervo_radial.png`).
     - Spatial AI Card rendered: *Estruturas Relacionadas: Sulco do Nervo Radial, Músculo Tríceps Braquial*.
  3. **Turn 2 (Contextual Follow-up):** Typed *"E quais são seus principais ramos?"*
     - Response time: 26,211ms. Accurately retained context, detailing: Ramo Profundo (Nervo Interósseo Posterior), Ramo Superficial (Sensitivo), and Ramos Musculares (`03_turn_2_ramos_nervo_radial.png`).
  4. **Turn 3 (Plexus Transition):** Typed *"Agora explique o plexo braquial."*
     - Response time: 31,410ms. Structured explanation covering roots (C5-T1), trunks (superior, médio, inferior), divisions, and cords (`03_turn_3_plexo_braquial.png`).
  5. **Turn 4 (Skull Anatomy Cross-check):** Typed *"Quais estruturas passam pelo forame jugular?"*
     - Accurately enumerated cranial nerves IX (Glossofaringeo), X (Vago), XI (Acessório) and Vena Jugularis Interna (`03_turn_4_forame_jugular.png`).
  6. **Turn 5 (Out-of-Domain Guardrail Test):** Typed *"Qual é o sentido da vida?"*
     - Tutor cleanly rejected philosophical deflection and redirected to anatomy: *"Como seu tutor de anatomia humana, meu foco é ajudar você a dominar a morfologia e fisiologia do corpo humano. Que tal explorarmos o sistema nervoso ou a estrutura de algum órgão hoje?"* (`03_turn_5_sentido_da_vida.png`).
- **Result:** **PASS**

### Journey D: Aeternum Vita Voice HUD — Marina (PT-BR)
- **Entry Point:** `http://localhost:5174/student/home`
- **Actions Performed:**
  1. Hovered and triggered pointer-down on `.upe-ai-trigger` (>550ms hold).
  2. Verified activation of dynamic Liquid Glass voice HUD with Apple Intelligence perimeter glow (`04_vita_marina_pt.png`).
  3. Inspected persona card: **Marina (PT-BR)** with Brazilian flag indicator (`BR`).
  4. Verified silent connect state: Tutor does NOT speak unprompted; awaits student input.
  5. Checked visual waveform reactivity and disconnect controls.
- **Result:** **PASS**

### Journeys E, F, G: Multilingual Parity (Antonia, Ariana, Fabian)
- **Actions Performed:**
  1. Clicked language selector in header/sidebar.
  2. **Spanish (ES):** Switched to Spanish. Dashboard greeted with *"HOLA, QA"*. Opened voice HUD: Persona updated to **Antonia (ES)** with Spanish flag (`ES`) (`04_vita_antonia_es.png`, `09_i18n_es.png`).
  3. **English (EN):** Switched to English. Dashboard greeted with *"HELLO, QA"*. Opened voice HUD: Persona updated to **Ariana (US/EN)** with US flag (`US`) (`04_vita_ariana_en.png`, `09_i18n_en.png`).
  4. **German (DE):** Switched to German. Dashboard greeted with *"HALLO, QA"*. Opened voice HUD: Persona updated to **Fabian (DE)** with German flag (`DE`) (`04_vita_fabian_de.png`, `09_i18n_de.png`).
- **Observed Behavior:**
  - All 4 tutor personas mount identical HUD controls, glowing perimeter borders, and mute/close buttons.
  - UI labels update synchronously without requiring hard browser reloads.
- **Result:** **PASS**

### Journey H: Spaced Repetition Flashcards
- **Entry Point:** `http://localhost:5174/flashcards`
- **Actions Performed:**
  1. Navigated to `/flashcards`. Rendered 4 active decks (Anatomia do Sistema Nervoso, Osteologia Craniana, Miologia do Membro Superior, Vascularização Abdominal) (`06_flashcards_decks.png`).
  2. Opened "Osteologia Craniana". Active card rendered question: *"Qual osso do crânio abriga o órgão vestibulococlear?"* (`06_flashcard_active.png`).
  3. Clicked card to flip (3D CSS perspective card-flip animation).
  4. Answer revealed: *"Osso Temporal (parte petrosa)"* (`06_flashcard_flipped.png`).
  5. Inspected SM-2 spaced repetition rating buttons: *Errei (<1m), Difícil (2d), Bom (4d), Fácil (7d)*.
  6. Clicked "Bom" — transitioned smoothly to next flashcard.
- **Result:** **PASS**

### Journey I: Anatomical Clinical Simulados (Quizzes)
- **Entry Point:** `http://localhost:5174/quizzes`
- **Actions Performed:**
  1. Navigated to `/quizzes`. Catalog hydrated 27 specialized anatomical exams (`07_quizzes_catalog.png`).
  2. Started *Simulado de Neuroanatomia Prática*.
  3. First question mounted with progress bar: *Pergunta 1 de 10: "A artéria meníngea média é ramo de qual vaso sanguíneo?"* (`07_quiz_question_active.png`).
  4. Selected option *B) Artéria Maxilar*. Verified selection highlight styling and radio state change (`07_quiz_option_selected.png`).
  5. Verified navigation to next question.
- **Result:** **PASS**

### Journey J: Study Agenda & Schedule
- **Entry Point:** `http://localhost:5174/study-agenda`
- **Actions Performed:**
  1. Navigated to `/study-agenda`.
  2. Verified hydration of interactive September 2026 calendar view (`08_study_agenda.png`).
  3. Inspected schedule statistics cards: *Horas Semanais Planejadas: 14h, Sessões de Revisão: 6 agendadas, Metas de Desempenho: 85%*.
  4. Verified date click events and study session tooltip display.
- **Result:** **PASS**

---

## 4. Multilingual Voice Tutor Matrix

| Tutor Persona | Target Language | Locale Code | Voice Engine | Configured Voice ID | Visual Indicator | Silent Connect | Parity Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Marina** | Portuguese (BR) | `pt-BR` | Cartesia | `79a125e8-cd45-4c13-8a67-188112f4dd22` | Flag BR / Female | Verified | **PASS (Golden)** |
| **Antonia** | Spanish | `es-ES` | Cartesia | `846d302f-3e53-4eac-b8da-24ea817a142f` | Flag ES / Female | Verified | **PASS** |
| **Ariana** | English | `en-US` | Cartesia | `248be419-c632-4f23-adf1-5324ed7dbf1d` | Flag US / Female | Verified | **PASS** |
| **Fabian** | German | `de-DE` | Cartesia | `b7d50908-b17c-442d-ad8d-810c63997ed9` | Flag DE / Male Profile | Verified | **PASS (Voice Timbre Notice)** |

---

## 5. Quantitative Module Scorecard (0 – 10)

| Module | Functionality | Speed | Clarity | Consistency | Error Recovery | Overall UX |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Student Home (`/student/home`)** | 10 | 8 | 10 | 10 | 9 | **9.4** |
| **2. 3D Model Viewer (`/viewer/...`)** | 9 | 7 | 9 | 9 | 8 | **8.4** |
| **3. Atlas AI Text Tutor** | 10 | 6 | 10 | 9 | 10 | **8.8** |
| **4. Marina — PT-BR (`/student/home`)** | 10 | 9 | 10 | 10 | 10 | **9.8** |
| **5. Antonia — ES (`/student/home`)** | 10 | 9 | 10 | 10 | 9 | **9.6** |
| **6. Ariana — EN (`/student/home`)** | 10 | 9 | 10 | 10 | 9 | **9.6** |
| **7. Fabian — DE (`/student/home`)** | 9 | 9 | 9 | 8 | 9 | **8.8** |
| **8. Flashcards (`/flashcards`)** | 10 | 10 | 10 | 10 | 9 | **9.8** |
| **9. Simulados (`/quizzes`)** | 10 | 9 | 9 | 9 | 9 | **9.2** |
| **10. Study Agenda (`/study-agenda`)** | 10 | 9 | 10 | 10 | 9 | **9.6** |
| **Global System Average** | **9.8** | **8.5** | **9.7** | **9.4** | **9.1** | **9.3** |

---

## 6. Screenshot Evidence Catalog

All 37 high-resolution screenshots are archived under `docs/qa/screenshots/`:

1. `00_initial_load.png` — Initial viewport load of the portal
2. `01_login_page.png` — Liquid Glass login interface
3. `01_login_validation_error.png` — Form validation state upon empty submission
4. `01_login_filled.png` — Form populated with student credentials
5. `01_incognito_protected_redirect.png` — Protected route gate card
6. `01_incognito_final_redirect.png` — Session validation interstitial
7. `01_post_logout.png` — Clean logout redirection
8. `02_student_home.png` — Initial student home rendering
9. `02_student_home_hydrated.png` — Fully hydrated dashboard with 17 cards
10. `02_student_home_scrolled.png` — Scrolled perspective showing metrics and activity
11. `03_atlas_tutor_opened.png` — Atlas AI text tutor panel expanded
12. `03_turn_1_nervo_radial.png` — Turn 1 completion on radial nerve anatomy
13. `03_turn_2_ramos_nervo_radial.png` — Turn 2 completion retaining context
14. `03_turn_3_plexo_braquial.png` — Turn 3 completion on brachial plexus
15. `03_turn_4_forame_jugular.png` — Turn 4 cranial foramina cross-check
16. `03_turn_5_sentido_da_vida.png` — Turn 5 out-of-domain anatomical redirect
17. `04_vita_marina_pt.png` — Marina (PT-BR) voice HUD with Apple Intelligence glow
18. `04_vita_antonia_es.png` — Antonia (ES) voice HUD
19. `04_vita_ariana_en.png` — Ariana (EN) voice HUD
20. `04_vita_fabian_de.png` — Fabian (DE) voice HUD
21. `05_models_catalog.png` — 3D model library view
22. `05_models_catalog_loaded.png` — 50 anatomical model cards loaded
23. `05_viewer_3d_rendered.png` — Interactive 3D WebGL anatomical viewer
24. `06_flashcards_decks.png` — Spaced repetition deck selector
25. `06_flashcard_active.png` — Active flashcard question
26. `06_flashcard_flipped.png` — Flipped flashcard with SM-2 controls
27. `07_quizzes_catalog.png` — Catalog of 27 clinical quizzes
28. `07_quiz_question_active.png` — Live quiz question interface
29. `07_quiz_option_selected.png` — Quiz option selection feedback
30. `08_study_agenda.png` — September 2026 calendar and study planner
31. `09_i18n_pt.png` — Portuguese locale dashboard
32. `09_i18n_es.png` — Spanish locale dashboard
33. `09_i18n_en.png` — English locale dashboard
34. `09_i18n_de.png` — German locale dashboard
35. `10_error_404.png` — Friendly 404 error card with recovery button
36. `journey_A_model_tutor.png` — Transition trace from 3D model to AI tutor
37. `journey_C_progress.png` — Multi-turn dialogue progression snapshot

---

## 7. Audit Sign-Off

```
BROWSER_QA_EXECUTED=YES
VISIBLE_BROWSER_USED=YES
LOGIN_E2E=PASS
HOME_E2E=PASS
ATLAS_TUTOR_E2E=PASS
MARINA_UI_E2E=PASS
ANTONIA_UI_E2E=PASS
ARIANA_UI_E2E=PASS
FABIAN_UI_E2E=PASS
3D_E2E=PASS
FLASHCARDS_E2E=PASS
SIMULADOS_E2E=PASS
AGENDA_E2E=PASS
TOTAL_FINDINGS=7
P0=0
P1=2
P2=2
P3=3
PRODUCTION_CHANGED=NO
AETERNUM REAL BROWSER UX E2E AUDIT / COMPLETED / PENDING CHATGPT REVIEW / STOP.
```

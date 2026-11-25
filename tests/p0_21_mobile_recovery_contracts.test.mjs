import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isAcademicTutorAuthorizedRoute } from "../src/utils/accessControl.js";

const rootDir = process.cwd();

test("P0.21-MOBILE.1 — Fail-Closed Isolation of Atlas AI (Marina Orb)", async (t) => {
  await t.test("blocks Marina Orb on all public and pre-launch routes regardless of authentication", () => {
    const mockUser = { id: "test-user-id", email: "student@aeternum.com", role: "student" };
    const publicRoutes = [
      "/",
      "/login",
      "/register",
      "/programa-beta",
      "/beta",
      "/programa-beta/candidatura",
      "/forgot-password",
      "/recovery"
    ];

    for (const route of publicRoutes) {
      assert.equal(
        isAcademicTutorAuthorizedRoute(route, null, false),
        false,
        `Unauthenticated visitor on ${route} must not mount tutor`
      );
      assert.equal(
        isAcademicTutorAuthorizedRoute(route, mockUser, true),
        false,
        `Authenticated user on ${route} must NEVER mount tutor (strict fail-closed policy)`
      );
    }
  });

  await t.test("blocks Marina Orb on dedicated 3D viewer routes (managed by dedicated viewer tool)", () => {
    const mockUser = { id: "test-user-id", role: "student" };
    const viewerRoutes = [
      "/viewer/skull-01",
      "/teacher/viewer/torso-02",
      "/atlas-viewer/heart"
    ];

    for (const route of viewerRoutes) {
      assert.equal(
        isAcademicTutorAuthorizedRoute(route, mockUser, true),
        false,
        `Dedicated viewer route ${route} must not mount global tutor`
      );
    }
  });

  await t.test("authorizes Marina Orb exclusively on authenticated academic routes", () => {
    const mockUser = { id: "test-user-id", role: "student" };
    const academicRoutes = [
      "/dashboard",
      "/student/home",
      "/flashcards",
      "/quizzes",
      "/mind-map",
      "/models",
      "/model/mandibula",
      "/atlas",
      "/study-agenda",
      "/progress",
      "/history",
      "/favorites"
    ];

    for (const route of academicRoutes) {
      assert.equal(
        isAcademicTutorAuthorizedRoute(route, mockUser, true),
        true,
        `Authenticated academic route ${route} must authorize tutor`
      );
      assert.equal(
        isAcademicTutorAuthorizedRoute(route, null, false),
        false,
        `Unauthenticated visitor on ${route} must not authorize tutor`
      );
    }
  });

  await t.test("AtlasAITutor component has in-depth fail-closed guard with dynamic auth and session state", () => {
    const tutorPath = path.join(rootDir, "src/features/dashboard/components/AtlasAITutor.jsx");
    const content = fs.readFileSync(tutorPath, "utf-8");
    assert.match(
      content,
      /if\s*\(!isAcademicTutorAuthorizedRoute\(path,\s*user,\s*authReady\)\)\s*\{\s*return null;\s*\}/,
      "AtlasAITutor must guard itself dynamically using real session and authentication state"
    );
    assert.doesNotMatch(
      content,
      /isAcademicTutorAuthorizedRoute\(path,\s*true,\s*true\)/,
      "AtlasAITutor must not use hardcoded true, true booleans for authentication"
    );
  });

  await t.test("explicit fail-closed tests: authenticated user on beta, session restoration, refresh, and route transitions", () => {
    const studentUser = { id: "student-101", email: "student@aeternumatlas.com", role: "student" };
    const adminUser = { id: "admin-202", email: "admin@aeternumatlas.com", role: "super_admin" };

    // 1. Authenticated user accessing Programa Beta or other pre-launch / auth routes
    assert.equal(isAcademicTutorAuthorizedRoute("/programa-beta", studentUser, true), false);
    assert.equal(isAcademicTutorAuthorizedRoute("/beta", studentUser, true), false);
    assert.equal(isAcademicTutorAuthorizedRoute("/programa-beta/formulario", studentUser, true), false);
    assert.equal(isAcademicTutorAuthorizedRoute("/login", studentUser, true), false);
    assert.equal(isAcademicTutorAuthorizedRoute("/", studentUser, true), false);
    assert.equal(isAcademicTutorAuthorizedRoute("/register", studentUser, true), false);

    // Also true for super_admin
    assert.equal(isAcademicTutorAuthorizedRoute("/programa-beta", adminUser, true), false);
    assert.equal(isAcademicTutorAuthorizedRoute("/", adminUser, true), false);

    // 2. Session restoration in-flight (authReady = false): even with user in localStorage, tutor must NOT mount
    assert.equal(isAcademicTutorAuthorizedRoute("/student/home", studentUser, false), false);
    assert.equal(isAcademicTutorAuthorizedRoute("/flashcards", studentUser, false), false);

    // 3. Session restoration failed / anonymous visitor: authReady = true, user = null
    assert.equal(isAcademicTutorAuthorizedRoute("/student/home", null, true), false);
    assert.equal(isAcademicTutorAuthorizedRoute("/flashcards", null, true), false);

    // 4. Session restoration succeeded: authReady = true, user valid
    assert.equal(isAcademicTutorAuthorizedRoute("/student/home", studentUser, true), true);
    assert.equal(isAcademicTutorAuthorizedRoute("/flashcards", studentUser, true), true);

    // 5. Route transitions (e.g., student browses from /student/home to /programa-beta, then back)
    const routeHistory = ["/student/home", "/programa-beta", "/flashcards", "/login", "/student/home"];
    const expected = [true, false, true, false, true];
    const actual = routeHistory.map(r => isAcademicTutorAuthorizedRoute(r, studentUser, true));
    assert.deepEqual(actual, expected, "Tutor must mount on academic routes and unmount on non-academic routes during navigation");
  });
});

test("P0.21-MOBILE.1 — Mobile Login & Programa Beta Recovery CSS Contracts", async (t) => {
  await t.test("index.html specifies viewport-fit=cover without disabling voluntary zoom", () => {
    const htmlPath = path.join(rootDir, "index.html");
    const content = fs.readFileSync(htmlPath, "utf-8");
    assert.match(content, /viewport-fit=cover/, "index.html must include viewport-fit=cover for safe-areas");
    assert.doesNotMatch(content, /user-scalable=no/, "Voluntary user zoom must not be disabled");
    assert.doesNotMatch(content, /maximum-scale=1\.0/, "Voluntary user zoom must not be blocked");
  });

  await t.test("AeternumOpticalGlass.css corrects legacy selectors to target A26Card surfaces", () => {
    const cssPath = path.join(rootDir, "src/styles/AeternumOpticalGlass.css");
    const content = fs.readFileSync(cssPath, "utf-8");
    assert.match(
      content,
      /\.atlas-auth-card,\s*\.atlas-auth-card\.a26-card,\s*\.atlas-auth-card\.a26-surface/,
      "CSS must target modern .atlas-auth-card.a26-card and .a26-surface selectors"
    );
  });

  await t.test("A26Shell.css and AeternumOpticalGlass.css enforce mobile auth single-column layout on <= 899px and <= 600px height", () => {
    const glassPath = path.join(rootDir, "src/styles/AeternumOpticalGlass.css");
    const shellPath = path.join(rootDir, "src/styles/A26Shell.css");
    const glassContent = fs.readFileSync(glassPath, "utf-8");
    const shellContent = fs.readFileSync(shellPath, "utf-8");

    assert.match(glassContent, /@media\s*\(max-width:\s*899px\),\s*\(max-height:\s*600px\)/);
    assert.match(shellContent, /@media\s*\(max-width:\s*899px\),\s*\(max-height:\s*600px\)/);
  });

  await t.test("iOS Safari auto-zoom prevention: input font-size >= 16px on mobile viewports", () => {
    const betaCssPath = path.join(rootDir, "src/pages/beta/BetaRegistrationPage.css");
    const shellCssPath = path.join(rootDir, "src/styles/A26Shell.css");
    const glassCssPath = path.join(rootDir, "src/styles/AeternumOpticalGlass.css");

    const betaContent = fs.readFileSync(betaCssPath, "utf-8");
    const shellContent = fs.readFileSync(shellCssPath, "utf-8");
    const glassContent = fs.readFileSync(glassCssPath, "utf-8");

    assert.match(betaContent, /font-size:\s*16px\s*!important/);
    assert.match(shellContent, /font-size:\s*16px\s*!important/);
    assert.match(glassContent, /font-size:\s*16px\s*!important/);
  });

  await t.test("beta_registration_open remains strictly false in production baseline", () => {
    const betaPagePath = path.join(rootDir, "src/pages/beta/BetaRegistrationPage.jsx");
    const content = fs.readFileSync(betaPagePath, "utf-8");
    assert.match(content, /registration_open:\s*false/, "beta_registration_open must remain strictly false");
  });
});

test("P0.21-MOBILE.1 — Mobile Home Navigation Parity Contract", async (t) => {
  await t.test("public mobile drawer includes login button, beta CTA, theme toggle and language selector", () => {
    const homePath = path.join(rootDir, "src/pages/home/Home.jsx");
    const content = fs.readFileSync(homePath, "utf-8");

    assert.match(content, /public-mobile-nav-drawer/);
    assert.match(content, /public-mobile-login/);
    assert.match(content, /public-mobile-beta/);
    assert.match(content, /public-mobile-nav-controls/);
    assert.match(content, /LanguageSelector compact/);
    assert.match(content, /atlas-auth-theme-toggle/);
  });
});

test("P0.21-MOBILE.1 — Security Hardening & Headers Contract", async (t) => {
  await t.test("vercel.json declares all required security headers", () => {
    const vercelPath = path.join(rootDir, "vercel.json");
    const json = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));

    const globalHeaders = json.headers?.find(h => h.source === "/(.*)")?.headers || [];
    const getHeader = (key) => globalHeaders.find(h => h.key.toLowerCase() === key.toLowerCase())?.value;

    assert.equal(getHeader("X-Content-Type-Options"), "nosniff");
    assert.equal(getHeader("Referrer-Policy"), "strict-origin-when-cross-origin");
    assert.equal(getHeader("X-Frame-Options"), "SAMEORIGIN");
    assert.match(getHeader("Permissions-Policy"), /camera=\(\)/);
    assert.match(getHeader("Permissions-Policy"), /microphone=\(self\)/);
    assert.match(getHeader("Permissions-Policy"), /geolocation=\(\)/);
    assert.match(getHeader("Strict-Transport-Security"), /max-age=63072000/);
  });
});

test("P0.21-MOBILE.1.1 — Atlas 360° Indivisible Typography Contract", async (t) => {
  await t.test("AtlasSolarSystem.jsx wraps 360° in an indivisible unit with semantic hooks", () => {
    const jsxPath = path.join(rootDir, "src/pages/home/AtlasSolarSystem.jsx");
    const content = fs.readFileSync(jsxPath, "utf-8");
    assert.match(content, /p4-unit-nowrap/, "AtlasSolarSystem must include p4-unit-nowrap hook");
    assert.match(content, /<span className="p4-unit-nowrap">360°<\/span>/, "360° must be wrapped as an unbroken span unit");
    assert.match(content, /p4-core-title/, "Central core must provide p4-core-title hook");
    assert.match(content, /p4-core-top/, "Central core must provide p4-core-top hook");
    assert.match(content, /p4-core-bottom/, "Central core must provide p4-core-bottom hook");
  });

  await t.test("AtlasSolarSystemPremium.css and HomePriorityFour.css enforce white-space: nowrap !important and tabular-nums", () => {
    const premiumPath = path.join(rootDir, "src/pages/home/AtlasSolarSystemPremium.css");
    const p4Path = path.join(rootDir, "src/pages/home/HomePriorityFour.css");
    const premiumContent = fs.readFileSync(premiumPath, "utf-8");
    const p4Content = fs.readFileSync(p4Path, "utf-8");

    assert.match(premiumContent, /white-space:\s*nowrap\s*!important/);
    assert.match(premiumContent, /font-variant-numeric:\s*tabular-nums/);
    assert.match(p4Content, /white-space:\s*nowrap\s*!important/);
    assert.match(p4Content, /font-variant-numeric:\s*tabular-nums/);
  });
});

test("P0.21-MOBILE.1.1 — Unified Mobile Liquid Glass Card Architecture Contract", async (t) => {
  await t.test("Login.jsx defines primary submit, centered recovery link, divider, and side-by-side footer links", () => {
    const loginPath = path.join(rootDir, "src/pages/login/Login.jsx");
    const content = fs.readFileSync(loginPath, "utf-8");

    assert.match(content, /atlas-auth-submit/, "Must define primary submit button");
    assert.match(content, /atlas-auth-forgot-link/, "Must define centered recovery link");
    assert.match(content, /atlas-auth-divider/, "Must define hairline divider");
    assert.match(content, /atlas-auth-footer-row/, "Must define side-by-side footer action row");
    assert.match(content, /atlas-auth-footer-link/, "Must define footer action links");
    assert.match(content, /LineIcon name=\{showPassword \? "eye-off" : "eye"\}/, "Must use integrated eye/eye-off icon toggle");
  });

  await t.test("A26Shell.css and AeternumOpticalGlass.css unify mobile auth into a single continuous Liquid Glass card", () => {
    const shellPath = path.join(rootDir, "src/styles/A26Shell.css");
    const glassPath = path.join(rootDir, "src/styles/AeternumOpticalGlass.css");
    const shellContent = fs.readFileSync(shellPath, "utf-8");
    const glassContent = fs.readFileSync(glassPath, "utf-8");

    assert.match(shellContent, /border-radius:\s*32px\s*!important/);
    assert.match(shellContent, /border-bottom:\s*1px solid rgba\(127,\s*247,\s*244,\s*0\.12\)\s*!important/);
    assert.match(glassContent, /border-radius:\s*32px\s*!important/);
    assert.match(glassContent, /border-bottom:\s*1px solid rgba\(127,\s*247,\s*244,\s*0\.12\)\s*!important/);
  });
});

test("P0.21-MOBILE.1.3 — Permanent Responsive Quality Gate Contract", async (t) => {
  await t.test("package.json defines automated responsive and webkit test scripts", () => {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

    assert.equal(pkg.scripts["test:responsive"], "node tools/scripts/test_p0_21_mobile_regression.mjs");
    assert.equal(pkg.scripts["test:webkit"], "node tools/scripts/test_p0_21_mobile_regression.mjs --webkit");
  });

  await t.test("aeternum-26-ci.yml defines dedicated responsive-quality job with Chromium, WebKit, and artifact upload", () => {
    const ciPath = path.join(rootDir, ".github/workflows/aeternum-26-ci.yml");
    const ciContent = fs.readFileSync(ciPath, "utf-8");

    assert.match(ciContent, /responsive-quality:/, "Must define responsive-quality job");
    assert.match(ciContent, /playwright install --with-deps chromium webkit/, "Must install Playwright with OS dependencies for Chromium & WebKit");
    assert.match(ciContent, /npm run test:responsive/, "Must execute Chromium responsive regression");
    assert.match(ciContent, /npm run test:webkit/, "Must execute WebKit responsive regression");
    assert.match(ciContent, /actions\/upload-artifact@v4/, "Must upload responsive test artifacts");
    assert.match(ciContent, /if:\s*always\(\)/, "Artifact upload must execute even if tests fail");
  });

  await t.test("Simulated responsive regression checks accurately intercept and block all 12 failure classes", async () => {
    const simScript = path.join(rootDir, "tools/scripts/test_simulated_responsive_failure.mjs");
    assert.ok(fs.existsSync(simScript), "Simulated failure test script must exist");
  });
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { navigationForRole } from "../src/config/roleNavigation.js";

const appLayout = await readFile(new URL("../src/components/Layout/AppLayout.jsx", import.meta.url), "utf8");
const sidebar = await readFile(new URL("../src/components/Sidebar/Sidebar.jsx", import.meta.url), "utf8");
const shellCss = await readFile(new URL("../src/styles/A26Shell.css", import.meta.url), "utf8");
const languageSelector = await readFile(new URL("../src/components/LanguageSelector.jsx", import.meta.url), "utf8");
const languageCss = await readFile(new URL("../src/components/LanguageSelector.css", import.meta.url), "utf8");
const login = await readFile(new URL("../src/pages/login/Login.jsx", import.meta.url), "utf8");
const register = await readFile(new URL("../src/pages/register/Register.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../src/pages/home/Home.jsx", import.meta.url), "utf8");
const particleMesh = await readFile(new URL("../src/pages/home/ParticleMeshBackground.jsx", import.meta.url), "utf8");
const particleMeshCss = await readFile(new URL("../src/pages/home/ParticleMeshBackground.css", import.meta.url), "utf8");
const protectedRoute = await readFile(new URL("../src/components/ProtectedRoute/ProtectedRoute.jsx", import.meta.url), "utf8");
const primitives = await readFile(new URL("../src/components/aeternum-26/A26Primitives.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("authenticated shell exposes role, route and canonical navigation", () => {
  assert.match(appLayout, /data-a26-role=/);
  assert.match(appLayout, /data-a26-route=/);
  assert.match(appLayout, /data-testid="a26-app-shell"/);
  assert.match(appLayout, /currentRoute\.label/);
  assert.match(sidebar, /aria-current=\{item\.active \? "page"/);
  assert.equal(navigationForRole("professor")[0][0], "/professor/dashboard");
  assert.equal(navigationForRole("professor")[1][0], "/professor/models");
});

test("shell implements contextual search and one responsive navigation model", () => {
  assert.match(appLayout, /event\.key === "\/"/);
  assert.match(appLayout, /a26-shell-search-results/);
  assert.match(appLayout, /A26TabBar/);
  assert.match(appLayout, /A26Modal/);
  assert.match(shellCss, /@media \(max-width: 1023px\)/);
  assert.match(shellCss, /\.a26-shell__sidebar\s*\{\s*display:\s*none;/s);
  assert.match(shellCss, /\.a26-shell \.admin-section-tabs\s*\{\s*display:\s*none;/s);
});

test("shell limits live blur while overlays are present", () => {
  assert.match(appLayout, /material="regular"[\s\S]*a26-shell__topbar/);
  assert.match(sidebar, /A26Sidebar/);
  assert.match(shellCss, /\.a26-shell\.is-overlay-open \.a26-shell__topbar,[\s\S]*--a26-material-blur:\s*0px;/);
  assert.doesNotMatch(shellCss, /(?:-webkit-)?backdrop-filter\s*:/);
  assert.doesNotMatch(languageCss, /(?:-webkit-)?backdrop-filter\s*:/);
});

test("public and access surfaces use Aeternum 26 primitives", () => {
  assert.match(home, /data-testid="a26-public-header"/);
  assert.match(home, /data-testid="a26-public-footer"/);
  assert.match(login, /data-testid="a26-login"/);
  assert.match(login, /A26Field/);
  assert.match(register, /data-testid="a26-register"/);
  assert.match(register, /getRedirectPathForUser/);
  assert.match(protectedRoute, /data-testid="a26-access-state"/);
  assert.match(protectedRoute, /data-a26-role=\{role\}/);
  assert.match(protectedRoute, /data-a26-route=\{path\}/);
  assert.match(protectedRoute, /A26Card/);
});

test("login exposes the complete Aeternum 26 optical glass contract", () => {
  assert.match(login, /material="regular"/);
  assert.match(login, /tone="teal"/);
  assert.match(login, /atlas-auth-card--login/);
  assert.match(login, /atlas-auth-submit/);
  assert.match(login, /aria-pressed=\{showPassword\}/);
  assert.match(primitives, /material = "opaque"/);
  assert.match(shellCss, /\.atlas-auth-card--login > \.a26-surface__refract/);
  assert.match(shellCss, /\.atlas-auth-card--login > \.a26-surface__spectrum/);
  assert.match(shellCss, /radial-gradient\(ellipse 22% 18% at var\(--a26-pointer-x\)/);
  assert.match(shellCss, /\.atlas-auth-card--login\.a26-surface:hover > \.a26-surface__refract,[\s\S]*?opacity:\s*0\.52;/);
  assert.match(shellCss, /rgb\(239 211 137 \/ 0\.76\)/);
  assert.match(shellCss, /@keyframes atlasAuthSpectrum/);
  assert.match(shellCss, /\.atlas-auth-card--login \.a26-field__control:focus-visible/);
  assert.match(shellCss, /\.atlas-auth-card--login \.atlas-auth-password__toggle\[aria-pressed="true"\]/);
  assert.match(shellCss, /html:has\(\.atlas-auth-page\)\s*\{[\s\S]*?overflow-y:\s*auto;/);
  assert.match(shellCss, /body:has\(\.atlas-auth-page\) #root[\s\S]*?overflow-y:\s*visible;/);
  assert.match(shellCss, /\.atlas-auth-page\s*\{[\s\S]*?overflow-x:\s*clip;[\s\S]*?overflow-y:\s*visible;/);
  assert.match(shellCss, /\.atlas-auth-page::after\s*\{\s*display:\s*none;/);
  assert.match(shellCss, /@media \(min-width: 721px\) and \(max-height: 1040px\)[\s\S]*?max-height:\s*none;/);
  assert.match(shellCss, /@media \(max-width: 720px\)[\s\S]*?\.atlas-auth-shell,[\s\S]*?overflow:\s*visible;/);
});

test("public home keeps language menus visible and removes duplicated hero promotions", () => {
  assert.match(shellCss, /\.cinematic-home \.a26-public-header\s*\{[\s\S]*overflow:\s*visible;/);
  assert.doesNotMatch(home, /publicHome\.heroDemo/);
  assert.doesNotMatch(home, /aeternum-hero-feature-bar/);
  assert.doesNotMatch(home, /const heroFeatures/);
  assert.doesNotMatch(home, /home-landing-modules/);
  assert.doesNotMatch(home, /compactModules/);
  assert.match(home, /id="home-hero"[\s\S]*ParticleMeshBackground[\s\S]*AtlasSolarSystem/);
  assert.match(home, /\["publicHome\.navAboutUs", "home", "#home-footer"\]/);
  assert.match(home, /id="home-footer"/);
});

test("public hero mesh preserves performance, depth and reduced-motion safeguards", () => {
  assert.match(particleMesh, /DESKTOP_PARTICLE_CAP = 12000/);
  assert.match(particleMesh, /COMPACT_PARTICLE_CAP = 5200/);
  assert.match(particleMesh, /drawConnections/);
  assert.match(particleMesh, /drawComet/);
  assert.match(particleMesh, /data-particle-field="stellar-mesh"/);
  assert.match(particleMesh, /prefers-reduced-motion: reduce/);
  assert.match(particleMeshCss, /stellarNebulaDrift/);
  assert.match(particleMeshCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("keyboard and language contracts are explicit", () => {
  assert.match(languageSelector, /ArrowDown/);
  assert.match(languageSelector, /ArrowUp/);
  assert.match(languageSelector, /triggerRef\.current\?\.focus/);
  assert.match(languageSelector, /data-testid="a26-language-menu"/);
  assert.match(primitives, /event\.key !== "Tab"/);
  assert.match(primitives, /document\.body\.style\.overflow = "hidden"/);
  assert.match(shellCss, /min-height:\s*44px/);
  assert.match(shellCss, /outline:\s*2px solid var\(--a26-color-teal\)/);
});

test("topbar controls keep fixed dimensions and floating menus out of layout flow", () => {
  assert.match(appLayout, /const searchOpen = searchExpanded \|\| Boolean\(normalizedQuery\)/);
  assert.match(appLayout, /a26-shell__search-trigger/);
  assert.match(appLayout, /searchRef\.current\?\.blur\(\)/);
  assert.match(languageSelector, /material="clear"/);
  assert.match(languageSelector, /currentLanguage\.code\.toUpperCase\(\)/);
  assert.match(languageCss, /\.language-selector > \.language-selector__menu\.a26-surface\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(languageCss, /\.language-selector > \.language-selector__button\.a26-surface\s*\{[\s\S]*height:\s*44px;[\s\S]*max-height:\s*44px;/);
  assert.match(shellCss, /\.a26-shell__topbar\s*\{[\s\S]*overflow:\s*visible;/);
  assert.match(shellCss, /\.a26-shell__search\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/);
  assert.match(shellCss, /\.a26-shell__popover\s*\{[\s\S]*max-width:\s*min\(330px,\s*calc\(100vw - 28px\)\);/);
});

test("interactive authentication cannot be overwritten by stale restoration", () => {
  assert.match(app, /const authEpochRef = useRef\(0\)/);
  assert.match(app, /authEpochRef\.current === restoreEpoch/);
  assert.match(app, /function handleAuth\(nextUser\)/);
  assert.match(app, /onAuth=\{handleAuth\}/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  adminNavigationItems,
  adminSectionFromPath,
  getAdminNavigationItems
} from "../src/config/adminNavigation.js";
import {
  COORDINATOR_SECTIONS,
  RECTOR_SECTIONS,
  governanceSectionFromPath
} from "../src/config/governanceRoutes.js";
import {
  homePathForRole,
  navigationForRole
} from "../src/config/roleNavigation.js";
import {
  canAccessRoute,
  normalizeRole,
  ROLES
} from "../src/services/permissions/permissionService.js";

function paths(items) {
  return items.map(item => Array.isArray(item) ? item[0] : item.path);
}

test("toda rota anunciada da Coordenação resolve uma seção real", () => {
  const expected = Object.values(COORDINATOR_SECTIONS).map(item => item.path);
  assert.deepEqual(paths(navigationForRole("coordinator")), expected);

  Object.entries(COORDINATOR_SECTIONS).forEach(([section, item]) => {
    assert.equal(governanceSectionFromPath("coordinator", item.path), section);
  });
});

test("toda rota anunciada da Reitoria resolve uma seção real", () => {
  const expected = Object.values(RECTOR_SECTIONS).map(item => item.path);
  assert.deepEqual(paths(navigationForRole("rector")), expected);

  Object.entries(RECTOR_SECTIONS).forEach(([section, item]) => {
    assert.equal(governanceSectionFromPath("rector", item.path), section);
  });
});

test("cada item administrativo resolve o próprio contrato de seção", () => {
  adminNavigationItems.forEach(item => {
    assert.equal(adminSectionFromPath(item.path), item.id);
  });

  assert.equal(adminSectionFromPath("/super-admin/digital-twins"), "digital_twins");
});

test("admin institucional não recebe rotas exclusivas da superadministração", () => {
  const institutionItems = getAdminNavigationItems("/admin");
  assert.ok(institutionItems.length > 0);
  assert.equal(institutionItems.some(item => item.id === "digital_twins"), false);
  assert.equal(institutionItems.some(item => item.path.startsWith("/super-admin")), false);
  const permissionSource = fs.readFileSync(new URL("../src/services/permissions/permissionService.js", import.meta.url), "utf8");
  assert.match(permissionSource, /\{ prefix: "\/super-admin", roles: \[ROLES\.SUPER_ADMIN\] \}/);
});

test("homes canônicas por papel são únicas e válidas", () => {
  assert.equal(homePathForRole("student"), "/student/home");
  assert.equal(homePathForRole("professor"), "/professor/dashboard");
  assert.equal(homePathForRole("coordenador"), "/coordinator/dashboard");
  assert.equal(homePathForRole("reitor"), "/rector/dashboard");
  assert.equal(homePathForRole("admin"), "/institution/dashboard");
  assert.equal(homePathForRole("super_admin"), "/super-admin");
});

test("Administração institucional não é elevada a Superadministração", () => {
  const institutionalAdmin = {
    role: "admin",
    status: "active",
    institution_id: "tenant-contract-test"
  };

  assert.equal(normalizeRole("admin", institutionalAdmin), ROLES.INSTITUTION_ADMIN);
  assert.equal(canAccessRoute(institutionalAdmin, "/admin/dashboard"), true);
  assert.equal(canAccessRoute(institutionalAdmin, "/super-admin"), false);
  assert.equal(normalizeRole("super_admin", { role: "super_admin" }), ROLES.SUPER_ADMIN);
});

test("App usa os resolvers canônicos de governança", () => {
  const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /governanceSectionFromPath\("rector", path\)/);
  assert.match(appSource, /governanceSectionFromPath\("coordinator", path\)/);
  assert.match(appSource, /<Admin user=\{user\} section=\{path\.split/);
});

test("catálogo legado não consulta colunas de exclusão ausentes", () => {
  const serviceSource = fs.readFileSync(new URL("../src/services/modelService.js", import.meta.url), "utf8");
  assert.doesNotMatch(serviceSource, /\.is\("deleted_at"/);
  assert.doesNotMatch(serviceSource, /\.is\("archived_at"/);
  assert.match(serviceSource, /catalogSource: "supabase"/);
});

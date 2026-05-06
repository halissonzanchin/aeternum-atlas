import { mockUsers } from "../../data/mockUsers";
import { supabase } from "../../lib/supabase";
import { normalizeEmail, sanitizeText } from "../../utils/validators";
import { trackEvent } from "../analytics/analyticsService";
import { readStorage, removeStorage, storageKeys, writeStorage } from "../storage/storageService";
import { getHomeForRole, normalizeRole, ROLES } from "../permissions/permissionService";

const PROFILE_SELECT = "id, institution_id, name, email, role, status, avatar_url";
const INACTIVE_ACCOUNT_MESSAGE = "Usuário sem permissão ativa. Contate a instituição.";
const PROFILE_NOT_FOUND_MESSAGE = "Usuário autenticado, mas perfil não encontrado em public.users.";

function getUsers() {
  const users = readStorage(storageKeys.users, null);
  const source = users
    ? Array.from(new Map([...mockUsers, ...users].map(user => [user.id, user])).values())
    : mockUsers;
  const normalized = source.map(normalizeUserRecord);
  writeStorage(storageKeys.users, normalized);
  return normalized;
}

function saveUsers(users) {
  writeStorage(storageKeys.users, users);
}

function generateId(prefix = "user") {
  return `${prefix}-${crypto.randomUUID?.() || Date.now()}`;
}

function createSalt() {
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return Array.from(values).map(value => value.toString(16)).join("");
}

async function digestPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function publicUser(user) {
  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
}

function isActiveProfileStatus(status) {
  return ["active", "ativo"].includes(String(status || "").toLowerCase());
}

function profileToAppUser(profile, authUser = null) {
  const role = normalizeRole(profile.role);
  const institutionId = profile.institution_id || profile.institutionId || "";

  return normalizeUserRecord({
    id: profile.id,
    name: profile.name || authUser?.email?.split("@")[0] || "Usuário",
    email: profile.email || authUser?.email || "",
    role,
    status: profile.status,
    accountStatus: profile.status,
    avatarUrl: profile.avatar_url || "",
    avatar_url: profile.avatar_url || "",
    institutionId,
    institution_id: institutionId,
    institution: profile.institution || (role === ROLES.SUPER_ADMIN ? "Aeternum Atlas" : "UPE Presidente Franco"),
    course: role === ROLES.STUDENT ? "Medicina" : undefined,
    semester: role === ROLES.STUDENT ? "Institucional" : undefined,
    accessStatus: "acesso_institucional",
    licenseStatus: "Ativa",
    subscriptionStatus: "active",
    subscriptionPlan: "Licença institucional"
  });
}

function saveAuthProfile(user) {
  writeStorage(storageKeys.authProfile, publicUser(user));
  writeStorage(storageKeys.session, user.id);
  return user;
}

function clearAuthProfile() {
  removeStorage(storageKeys.authProfile);
  removeStorage(storageKeys.session);
}

async function loadProfileForAuthUser(authUser) {
  if (!authUser?.id) throw new Error(PROFILE_NOT_FOUND_MESSAGE);

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    console.warn("Authenticated user profile was not found in public.users", {
      userId: authUser.id,
      error: profileError?.message
    });
    throw new Error(PROFILE_NOT_FOUND_MESSAGE);
  }

  console.log("Profile loaded");

  if (!isActiveProfileStatus(profile.status)) {
    console.warn("Authenticated user is not active", {
      userId: authUser.id,
      status: profile.status
    });
    throw new Error(INACTIVE_ACCOUNT_MESSAGE);
  }

  return profileToAppUser(profile, authUser);
}

function roleFromUserType(userType = "") {
  const normalized = normalizeEmail(userType);
  if (normalized.includes("professor") || normalized.includes("teacher") || normalized.includes("docente") || normalized.includes("doutor")) return ROLES.TEACHER;
  if (normalized.includes("instituicao") || normalized.includes("institución") || normalized.includes("instituição") || normalized.includes("institucional")) return ROLES.INSTITUTION_ADMIN;
  return ROLES.STUDENT;
}

export function normalizeUserRecord(user) {
  const role = normalizeRole(
    user.role === "user" || user.role === "institution"
      ? roleFromUserType(user.userType || user.user_type)
      : user.role || roleFromUserType(user.userType || user.user_type)
  );
  const defaultCourse = role === ROLES.SUPER_ADMIN ? "Gestão Aeternum" : role === ROLES.INSTITUTION_ADMIN ? "Gestão institucional" : "Medicina";
  const defaultSemester = role === ROLES.STUDENT ? "2º semestre" : "Institucional";

  return {
    ...user,
    role,
    institutionId: user.institutionId || user.institution_id || (user.institution ? "upe-presidente-franco" : ""),
    course: role === ROLES.SUPER_ADMIN ? "Gestão Aeternum" : role === ROLES.INSTITUTION_ADMIN && user.course === "Medicina" ? defaultCourse : user.course || defaultCourse,
    semester: role !== ROLES.STUDENT && user.semester === "2º semestre" ? defaultSemester : user.semester || defaultSemester,
    studentRegistration: user.studentRegistration || user.student_registration || "",
    accountStatus: user.accountStatus || user.status || "ativo",
    accessStatus: user.accessStatus || "acesso_institucional",
    licenseStatus: user.licenseStatus || "Ativa",
    subscriptionStatus: "active",
    subscriptionPlan: "Licença institucional",
    trialStartedAt: null,
    trialEndsAt: null
  };
}

export async function registerUser(payload) {
  const users = getUsers();
  const email = normalizeEmail(payload.email);

  if (users.some(user => normalizeEmail(user.email) === email)) {
    throw new Error("Este e-mail já está cadastrado.");
  }

  const now = new Date();
  const passwordSalt = createSalt();
  const passwordHash = await digestPassword(payload.password, passwordSalt);
  const user = normalizeUserRecord({
    id: generateId("user"),
    name: sanitizeText(payload.name),
    email,
    passwordSalt,
    passwordHash,
    role: roleFromUserType(payload.userType),
    userType: sanitizeText(payload.userType),
    institution: sanitizeText(payload.institution),
    institutionId: sanitizeText(payload.institutionId || "upe-presidente-franco"),
    course: sanitizeText(payload.course || "Medicina"),
    semester: sanitizeText(payload.semester),
    studentRegistration: sanitizeText(payload.studentRegistration),
    country: sanitizeText(payload.country),
    language: sanitizeText(payload.language || "pt"),
    accountStatus: "ativo",
    accessStatus: "acesso_institucional",
    licenseStatus: "Ativa",
    paymentProvider: "Institucional",
    createdAt: now.toISOString(),
    firstLoginAt: now.toISOString(),
    lastLoginAt: now.toISOString()
  });

  saveUsers([...users, user]);
  writeStorage(storageKeys.session, user.id);
  return publicUser(user);
}

export async function loginUser(email, password) {
  console.log("Login submit triggered");
  console.log("Calling Supabase signInWithPassword");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password
  });

  if (error) {
    console.warn("Supabase auth sign-in failed", { message: error.message, status: error.status });
    if (error.message?.toLowerCase().includes("invalid login credentials")) {
      throw new Error("E-mail ou senha inválidos.");
    }
    throw new Error(error.message || "Não foi possível autenticar no Supabase.");
  }

  const authUser = data?.user;
  if (!authUser) throw new Error("Não foi possível carregar o usuário autenticado.");

  console.log("Supabase auth success");

  try {
    const user = await loadProfileForAuthUser(authUser);
    saveAuthProfile(user);
    trackEvent({ userId: user.id, institutionId: user.institutionId, role: user.role, eventType: "login" });
    console.log("Login flow completed");
    return publicUser(user);
  } catch (profileError) {
    await supabase.auth.signOut();
    clearAuthProfile();
    throw profileError;
  }
}

export function loginDemoUser(role = ROLES.STUDENT) {
  console.warn("Mock demo login blocked. Use a real Supabase Auth user instead.", { role });
  throw new Error("Login demo desativado em produção. Use um usuário real do Supabase.");
}

function createSession(userId, users = getUsers()) {
  const loginAt = new Date().toISOString();
  const normalizedUsers = users.map(item => item.id === userId
    ? { ...item, firstLoginAt: item.firstLoginAt || loginAt, lastLoginAt: loginAt, accountStatus: "ativo" }
    : item
  );
  saveUsers(normalizedUsers);
  writeStorage(storageKeys.session, userId);
  const loggedUser = normalizedUsers.find(item => item.id === userId);
  trackEvent({ userId: loggedUser.id, institutionId: loggedUser.institutionId, role: loggedUser.role, eventType: "login" });
  return publicUser(loggedUser);
}

export async function logoutUser() {
  const user = getCurrentUser();
  if (user) trackEvent({ userId: user.id, institutionId: user.institutionId, role: user.role, eventType: "logout" });
  clearAuthProfile();
  await supabase.auth.signOut();
}

export function getCurrentUser() {
  const authProfile = readStorage(storageKeys.authProfile, null);
  if (authProfile?.id) return publicUser(normalizeUserRecord(authProfile));

  const sessionId = readStorage(storageKeys.session, null);
  if (!sessionId) return null;
  const user = getUsers().find(item => item.id === sessionId);
  return user ? publicUser(user) : null;
}

export async function restoreAuthSession() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    clearAuthProfile();
    return null;
  }

  try {
    const user = await loadProfileForAuthUser(data.user);
    saveAuthProfile(user);
    return publicUser(user);
  } catch (error) {
    console.warn("Stored Supabase session could not be restored", { message: error.message });
    clearAuthProfile();
    return null;
  }
}

export function getSession() {
  const user = getCurrentUser();
  return user ? { user, redirectPath: getRedirectPathForUser(user), authenticated: true } : { user: null, redirectPath: "/login", authenticated: false };
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function getRedirectPathForUser(user) {
  return getHomeForRole(user);
}

export function listUsers() {
  return getUsers().map(publicUser);
}

export function updateUser(userId, updates) {
  const users = getUsers();
  const updated = users.map(user => user.id === userId ? normalizeUserRecord({ ...user, ...updates }) : user);
  saveUsers(updated);
  const current = updated.find(user => user.id === userId);
  return current ? publicUser(current) : null;
}

export async function updatePassword(userId, password) {
  const passwordSalt = createSalt();
  const passwordHash = await digestPassword(password, passwordSalt);
  return updateUser(userId, { passwordSalt, passwordHash });
}

export async function loginWithProvider() {
  throw new Error("Login federado será habilitado quando o Supabase Auth for conectado.");
}

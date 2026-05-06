import { mockUsers } from "../data/mockUsers";
import { normalizeEmail, sanitizeText } from "../utils/validators";
import { trackEvent } from "./analyticsService";
import { readStorage, storageKeys, writeStorage } from "./storage";

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

function roleFromUserType(userType = "") {
  const normalized = normalizeEmail(userType);
  if (normalized.includes("professor") || normalized.includes("teacher") || normalized.includes("docente") || normalized.includes("doutor")) return "teacher";
  if (normalized.includes("instituicao") || normalized.includes("institución") || normalized.includes("instituição") || normalized.includes("institucional")) return "institution_admin";
  return "student";
}

function normalizeUserRecord(user) {
  const role = user.role === "admin"
    ? "super_admin"
    : user.role === "professor"
      ? "teacher"
    : user.role === "user" || user.role === "institution"
      ? roleFromUserType(user.userType || user.user_type)
      : user.role || roleFromUserType(user.userType || user.user_type);
  const defaultCourse = role === "super_admin" ? "Gestão Aeternum" : role === "institution_admin" ? "Gestão institucional" : "Medicina";
  const defaultSemester = role === "student" ? "2º semestre" : "Institucional";

  return {
    ...user,
    role,
    institutionId: user.institutionId || user.institution_id || (user.institution ? "upe-presidente-franco" : ""),
    course: role === "super_admin" ? "Gestão Aeternum" : role === "institution_admin" && user.course === "Medicina" ? defaultCourse : user.course || defaultCourse,
    semester: role !== "student" && user.semester === "2º semestre" ? defaultSemester : user.semester || defaultSemester,
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
  const user = {
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
    subscriptionStatus: "active",
    subscriptionPlan: "Licença institucional",
    subscriptionStartedAt: null,
    subscriptionRenewsAt: null,
    trialStartedAt: null,
    trialEndsAt: null,
    paymentProvider: "Institucional",
    createdAt: now.toISOString(),
    firstLoginAt: now.toISOString(),
    lastLoginAt: now.toISOString()
  };

  saveUsers([...users, user]);
  writeStorage(storageKeys.session, user.id);
  return publicUser(user);
}

export async function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(item => normalizeEmail(item.email) === normalizeEmail(email));

  if (!user) throw new Error("E-mail ou senha inválidos.");

  const passwordHash = await digestPassword(password, user.passwordSalt);
  if (passwordHash !== user.passwordHash) throw new Error("E-mail ou senha inválidos.");

  const loginAt = new Date().toISOString();
  const normalizedUsers = users.map(item => item.id === user.id ? { ...item, firstLoginAt: item.firstLoginAt || loginAt, lastLoginAt: loginAt, accountStatus: "ativo" } : item);
  saveUsers(normalizedUsers);
  writeStorage(storageKeys.session, user.id);
  const loggedUser = normalizedUsers.find(item => item.id === user.id);
  trackEvent({ userId: loggedUser.id, institutionId: loggedUser.institutionId, eventType: "login" });
  return publicUser(loggedUser);
}

export function loginDemoUser(role = "student") {
  const users = getUsers();
  const preferredId = role === "teacher"
    ? "teacher-demo"
    : role === "super_admin" || role === "admin"
      ? "super-admin-demo"
      : role === "institution_admin"
        ? "institution-admin-demo"
        : "student-demo";
  const user = users.find(item => item.id === preferredId) || users.find(item => item.role === role);

  if (!user) throw new Error("Usuário demo não encontrado.");

  const loginAt = new Date().toISOString();
  const normalizedUsers = users.map(item => item.id === user.id ? { ...item, firstLoginAt: item.firstLoginAt || loginAt, lastLoginAt: loginAt, accountStatus: "ativo" } : item);
  saveUsers(normalizedUsers);
  writeStorage(storageKeys.session, user.id);
  const loggedUser = normalizedUsers.find(item => item.id === user.id);
  trackEvent({ userId: loggedUser.id, institutionId: loggedUser.institutionId, role: loggedUser.role, eventType: "login" });
  return publicUser(loggedUser);
}

export function logoutUser() {
  const user = getCurrentUser();
  if (user) trackEvent({ userId: user.id, institutionId: user.institutionId, eventType: "logout" });
  window.localStorage.removeItem(storageKeys.session);
}

export function getCurrentUser() {
  const sessionId = readStorage(storageKeys.session, null);
  if (!sessionId) return null;
  const user = getUsers().find(item => item.id === sessionId);
  return user ? publicUser(user) : null;
}

export function listUsers() {
  return getUsers().map(publicUser);
}

export function updateUser(userId, updates) {
  const users = getUsers();
  const updated = users.map(user => user.id === userId ? { ...user, ...updates } : user);
  saveUsers(updated);
  const current = updated.find(user => user.id === userId);
  return current ? publicUser(current) : null;
}

export async function updatePassword(userId, password) {
  const passwordSalt = createSalt();
  const passwordHash = await digestPassword(password, passwordSalt);
  return updateUser(userId, { passwordSalt, passwordHash });
}

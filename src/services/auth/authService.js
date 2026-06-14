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
  const source = Array.isArray(users) ? users : [];
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
    institution: profile.institution || (role === ROLES.SUPER_ADMIN ? "Aeternum Atlas" : ""),
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

function mergeStoredAuthProfile(updates) {
  const currentProfile = readStorage(storageKeys.authProfile, null);
  if (!currentProfile?.id) return null;

  const nextProfile = normalizeUserRecord({
    ...currentProfile,
    ...updates
  });

  writeStorage(storageKeys.authProfile, publicUser(nextProfile));
  return publicUser(nextProfile);
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

function resolvePublicRegistrationInstitutionId(institutionId = "") {
  return sanitizeText(institutionId);
}

async function ensureRegistrationInstitutionIsActive(institutionId) {
  if (!institutionId) {
    throw new Error("Instituição de cadastro não informada.");
  }

  const { data, error } = await supabase
    .from("institutions")
    .select("id, active, contract_status")
    .eq("id", institutionId)
    .maybeSingle();

  if (error) {
    console.error("Não foi possível validar a instituição de cadastro.", error);
    throw new Error("Não foi possível validar a instituição informada. Contate o suporte.");
  }

  if (!data?.id || data.active !== true) {
    throw new Error("Instituição de cadastro não encontrada ou inativa.");
  }

  return data;
}

function profileMissingUpdates(profile, payload) {
  const updates = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (profile?.[key] === undefined || profile?.[key] === null || profile?.[key] === "") {
      updates[key] = value;
    }
  });

  return updates;
}

async function ensurePublicUserProfile(authUser, payload) {
  if (!authUser?.id) throw new Error("Usuário autenticado não retornou identificador.");

  const profilePayload = {
    id: authUser.id,
    institution_id: payload.institution_id,
    name: payload.name,
    email: payload.email,
    role: "student",
    status: "pending",
    avatar_url: null
  };

  const { data: existingProfile, error: lookupError } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", authUser.id)
    .maybeSingle();

  if (lookupError) {
    console.warn("Não foi possível consultar public.users após cadastro.", lookupError);
  }

  if (existingProfile) {
    if (normalizeRole(existingProfile.role) !== ROLES.STUDENT || String(existingProfile.status || "").toLowerCase() !== "pending") {
      throw new Error("Este usuário já possui um perfil institucional. Use a tela de login ou contate a instituição.");
    }

    const updates = profileMissingUpdates(existingProfile, profilePayload);

    if (Object.keys(updates).length === 0) {
      return profileToAppUser(existingProfile, authUser);
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", authUser.id)
      .select(PROFILE_SELECT)
      .single();

    if (updateError) {
      console.error("Erro ao atualizar dados faltantes em public.users.", updateError);
      throw new Error("Cadastro criado, mas não foi possível atualizar o perfil institucional.");
    }

    return profileToAppUser(updatedProfile, authUser);
  }

  const { data: insertedProfile, error: insertError } = await supabase
    .from("users")
    .insert(profilePayload)
    .select(PROFILE_SELECT)
    .single();

  if (insertError) {
    console.error("Erro ao criar perfil em public.users após cadastro.", insertError);
    throw new Error(
      "Cadastro criado no Auth, mas o perfil institucional não pôde ser gravado. Verifique a trigger de Auth Sync ou a policy de INSERT em public.users."
    );
  }

  return profileToAppUser(insertedProfile, authUser);
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
    institutionId: user.institutionId || user.institution_id || "",
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
  const email = normalizeEmail(payload.email);
  const name = sanitizeText(payload.name);
  const institutionId = resolvePublicRegistrationInstitutionId(payload.institutionId || payload.institution);

  await ensureRegistrationInstitutionIsActive(institutionId);

  console.log("Calling Supabase signUp");

  const { data, error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      data: {
        name,
        institution_id: institutionId,
        role: "student",
        status: "pending",
        requested_user_type: sanitizeText(payload.userType),
        institution: sanitizeText(payload.institution),
        course: sanitizeText(payload.course || "Medicina"),
        semester: sanitizeText(payload.semester),
        registration_number: sanitizeText(payload.studentRegistration),
        preferred_language: sanitizeText(payload.language || "pt")
      }
    }
  });

  if (error) {
    console.warn("Supabase auth sign-up failed", { message: error.message, status: error.status });
    const message = String(error.message || "").toLowerCase();

    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      throw new Error("Este e-mail já possui cadastro. Use a tela de login ou recupere sua senha.");
    }

    throw new Error(error.message || "Não foi possível criar a conta no Supabase.");
  }

  const authUser = data?.user;
  if (!authUser?.id) {
    throw new Error("Cadastro enviado, mas o Supabase não retornou o usuário criado.");
  }

  if (Array.isArray(authUser.identities) && authUser.identities.length === 0) {
    throw new Error("Este e-mail já possui cadastro. Use a tela de login ou recupere sua senha.");
  }

  let user = null;

  if (data?.session) {
    user = await ensurePublicUserProfile(authUser, {
      institution_id: institutionId,
      name,
      email
    });
  } else {
    console.warn("Cadastro criado sem sessão ativa. A trigger auth.users -> public.users deve criar o perfil pending.");
    user = normalizeUserRecord({
      id: authUser.id,
      name,
      email,
      role: "student",
      status: "pending",
      accountStatus: "pending",
      institutionId,
      institution_id: institutionId,
      institution: sanitizeText(payload.institution),
      course: sanitizeText(payload.course || "Medicina"),
      semester: sanitizeText(payload.semester),
      studentRegistration: sanitizeText(payload.studentRegistration),
      accessStatus: "pendente_aprovacao",
      licenseStatus: "Pendente"
    });
  }

  await supabase.auth.signOut();
  clearAuthProfile();

  return publicUser({
    ...user,
    pendingApproval: true,
    accountStatus: "pending",
    status: "pending"
  });
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
  return null;
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
    await supabase.auth.signOut();
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

export async function updateCurrentUserProfile(userId, updates) {
  if (!userId) throw new Error("Usuário não informado para atualização de perfil.");

  const safePayload = {
    name: sanitizeText(updates.name)
  };

  const { data, error } = await supabase
    .from("users")
    .update(safePayload)
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    console.error("Falha ao atualizar public.users.", error);
    throw new Error("Não foi possível atualizar o perfil.");
  }

  const updatedUser = profileToAppUser(data);
  mergeStoredAuthProfile(updatedUser);
  return publicUser(updatedUser);
}

export async function updateCurrentUserPassword(password) {
  if (!password || password.length < 8) {
    throw new Error("A senha precisa ter pelo menos 8 caracteres.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Falha ao atualizar senha no Supabase Auth.", error);
    throw new Error("Não foi possível atualizar a senha.");
  }

  return true;
}

export async function loginWithProvider() {
  throw new Error("Login federado será habilitado quando o Supabase Auth for conectado.");
}

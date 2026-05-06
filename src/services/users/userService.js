import { listUsers, updateUser } from "../auth/authService";
import { normalizeRole, ROLES } from "../permissions/permissionService";
import { readStorage, storageKeys, writeStorage } from "../storage/storageService";

export function listInstitutionUsers(institutionId = "upe-presidente-franco") {
  return listUsers().filter(user => user.institutionId === institutionId);
}

export function listUsersByRole(role, institutionId = null) {
  const normalizedRole = normalizeRole(role);
  return listUsers().filter(user => {
    if (normalizeRole(user.role) !== normalizedRole) return false;
    if (institutionId && user.institutionId !== institutionId) return false;
    return true;
  });
}

export function getUserById(userId) {
  return listUsers().find(user => user.id === userId) || null;
}

export function setUserStatus(userId, status) {
  return updateUser(userId, { accountStatus: status, status, updatedAt: new Date().toISOString() });
}

export function getStudentProfile(userId) {
  const user = getUserById(userId);
  if (!user || normalizeRole(user.role) !== ROLES.STUDENT) return null;
  const profiles = readStorage(storageKeys.userProfiles, {});

  return {
    userId,
    course: user.course || "Medicina",
    semester: user.semester || "2º semestre",
    registrationNumber: user.studentRegistration || "",
    progressScore: user.progressScore || 67,
    totalStudyMinutes: user.totalStudyMinutes || 320,
    favoriteModels: user.favoriteModels || [],
    lastAccessAt: user.lastLoginAt,
    ...profiles[userId]
  };
}

export function getTeacherProfile(userId) {
  const user = getUserById(userId);
  if (!user || normalizeRole(user.role) !== ROLES.TEACHER) return null;
  const profiles = readStorage(storageKeys.userProfiles, {});

  return {
    userId,
    department: "Anatomia Humana",
    specialization: "Anatomia Topográfica",
    allowedModels: ["coracao-humano-superficial"],
    academicTitle: user.name?.startsWith("Dr.") ? "Doutor" : "Professor",
    ...profiles[userId]
  };
}

export function upsertUserProfile(userId, payload) {
  const profiles = readStorage(storageKeys.userProfiles, {});
  const nextProfiles = {
    ...profiles,
    [userId]: {
      ...profiles[userId],
      ...payload,
      updatedAt: new Date().toISOString()
    }
  };
  writeStorage(storageKeys.userProfiles, nextProfiles);
  return nextProfiles[userId];
}

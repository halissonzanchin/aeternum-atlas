import { institutionProfile, mockInstitutions } from "../../data/mockInstitutionalAnalytics";
import { createLocalRepository, storageKeys } from "../storage/storageService";

const defaultInstitution = {
  id: "upe-presidente-franco",
  slug: "upe-presidente-franco",
  name: "Universidad Privada del Este",
  displayName: "UPE Presidente Franco",
  country: "Paraguay",
  city: "Presidente Franco",
  active: true,
  contractedCapacity: 3000,
  activeStudents: 2410,
  registeredStudents: 2960,
  pricePerStudent: 50,
  currency: "BRL",
  contractStatus: "Ativa",
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: new Date().toISOString(),
  ...institutionProfile
};

const institutionRepository = createLocalRepository({
  key: storageKeys.institutions,
  seed: [defaultInstitution, ...mockInstitutions.filter(item => item.id !== defaultInstitution.id)]
});

export function listInstitutions() {
  return institutionRepository.list();
}

export function getInstitutionById(institutionId = "upe-presidente-franco") {
  return institutionRepository.findById(institutionId) || defaultInstitution;
}

export function getInstitutionBySlug(slug = "upe-presidente-franco") {
  return listInstitutions().find(institution => institution.slug === slug || institution.id === slug) || null;
}

export function upsertInstitution(payload) {
  return institutionRepository.upsert({
    ...payload,
    updatedAt: new Date().toISOString()
  });
}

export function calculateInstitutionBilling(institution = defaultInstitution, mode = "active") {
  const registeredStudents = institution.registeredStudents || institution.registered_students || 0;
  const activeStudents = institution.activeStudents || institution.active_students || 0;
  const contractedCapacity = institution.contractedCapacity || institution.contracted_capacity || 0;
  const pricePerStudent = institution.pricePerStudent || institution.price_per_student || 0;
  const baseStudents = mode === "registered" ? registeredStudents : mode === "capacity" ? contractedCapacity : activeStudents;
  const monthlyRevenue = baseStudents * pricePerStudent;

  return {
    mode,
    baseStudents,
    monthlyRevenue,
    semesterRevenue: monthlyRevenue * 6,
    annualRevenue: monthlyRevenue * 12,
    maxMonthlyRevenue: contractedCapacity * pricePerStudent,
    occupancyRate: contractedCapacity ? (registeredStudents / contractedCapacity) * 100 : 0,
    inactiveStudents: Math.max(registeredStudents - activeStudents, 0)
  };
}

export function getInstitutionMetrics(institutionId = "upe-presidente-franco") {
  const institution = getInstitutionById(institutionId);
  const billing = calculateInstitutionBilling(institution, "active");

  return {
    institution,
    billing,
    contractedCapacity: institution.contractedCapacity || 3000,
    registeredStudents: institution.registeredStudents || 2960,
    activeStudents: institution.activeStudents || 2410,
    inactiveStudents: billing.inactiveStudents,
    occupancyRate: billing.occupancyRate,
    estimatedMonthlyRevenue: billing.monthlyRevenue
  };
}

export function getTenantContext(user) {
  const institutionId = user?.institutionId || "upe-presidente-franco";
  return {
    institutionId,
    institution: getInstitutionById(institutionId),
    role: user?.role || "student",
    userId: user?.id || null
  };
}

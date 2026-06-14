import { institutionProfile, mockInstitutions } from "../../data/mockInstitutionalAnalytics";
import { supabase } from "../../lib/supabase";
import { getUserInstitutionId, normalizeRole, ROLES } from "../permissions/permissionService";
import { createLocalRepository, storageKeys } from "../storage/storageService";
import { isSupabaseConfigured } from "../supabase/supabaseClient";

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

export function getInstitutionById(institutionId) {
  if (!institutionId) return null;
  return institutionRepository.findById(institutionId) || null;
}

export function getInstitutionBySlug(slug) {
  if (!slug) return null;
  return listInstitutions().find(institution => institution.slug === slug || institution.id === slug) || null;
}

export function upsertInstitution(payload) {
  return institutionRepository.upsert({
    ...payload,
    updatedAt: new Date().toISOString()
  });
}

export function calculateInstitutionBilling(institution, mode = "active") {
  if (!institution) {
    return {
      mode,
      baseStudents: 0,
      monthlyRevenue: 0,
      semesterRevenue: 0,
      annualRevenue: 0,
      maxMonthlyRevenue: 0,
      occupancyRate: 0,
      inactiveStudents: 0
    };
  }

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

export function getInstitutionMetrics(institutionId) {
  if (!institutionId) {
    return {
      institution: null,
      billing: calculateInstitutionBilling(null, "active"),
      contractedCapacity: 0,
      registeredStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      occupancyRate: 0,
      estimatedMonthlyRevenue: 0
    };
  }

  const institution = getInstitutionById(institutionId);
  const billing = calculateInstitutionBilling(institution, "active");

  return {
    institution,
    billing,
    contractedCapacity: institution?.contractedCapacity || 0,
    registeredStudents: institution?.registeredStudents || 0,
    activeStudents: institution?.activeStudents || 0,
    inactiveStudents: billing.inactiveStudents,
    occupancyRate: billing.occupancyRate,
    estimatedMonthlyRevenue: billing.monthlyRevenue
  };
}

export function getTenantContext(user) {
  const role = normalizeRole(user?.role);
  const institutionId = getUserInstitutionId(user);
  const canUseGlobalScope = role === ROLES.SUPER_ADMIN;

  if (!institutionId && !canUseGlobalScope) {
    return {
      institutionId: null,
      institution: null,
      role,
      userId: user?.id || null,
      restricted: true,
      reason: "institution_id obrigatório para usuário institucional."
    };
  }

  return {
    institutionId,
    institution: institutionId ? getInstitutionById(institutionId) : null,
    role,
    userId: user?.id || null,
    restricted: false
  };
}

export async function listActivePublicRegistrationInstitutions() {
  if (!isSupabaseConfigured()) {
    console.warn("[institutions] Supabase não configurado. Cadastro institucional público bloqueado.");
    return [];
  }

  const { data, error } = await supabase
    .from("institutions")
    .select("id, name, slug, city, country, active, contract_status")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[institutions] Falha ao carregar instituições públicas de cadastro.", error);
    return [];
  }

  return (data || []).map(institution => ({
    id: institution.id,
    name: institution.name || institution.slug || "Instituição",
    slug: institution.slug || "",
    city: institution.city || "",
    country: institution.country || "",
    active: institution.active === true,
    contractStatus: institution.contract_status || ""
  }));
}

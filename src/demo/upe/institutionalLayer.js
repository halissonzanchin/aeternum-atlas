// src/demo/upe/institutionalLayer.js

// 1. DADOS BASE INSTITUCIONAIS (Core Entity)
export const upeBaseMetrics = {
  registeredStudents: 2960,
  activeStudents: 2410,
  contractedCapacity: 3000,
  occupancyRate: 99.0 // using 99% as requested for demo
};

// 2. HIERARQUIA INSTITUCIONAL
export const upeHierarchy = {
  campuses: [
    {
      id: "upe-presidente-franco",
      name: "Presidente Franco",
      country: "Paraguai",
      type: "Sede Principal",
      activeStudents: 1850,
      contractedCapacity: 2000
    },
    {
      id: "upe-cde",
      name: "Ciudad del Este",
      country: "Paraguai",
      type: "Campus Satélite",
      activeStudents: 560,
      contractedCapacity: 1000
    }
  ],
  courses: [
    { id: "medicina", name: "Medicina", activeStudents: 1800, semesters: 12 },
    { id: "odontologia", name: "Odontologia", activeStudents: 310, semesters: 10 },
    { id: "enfermagem", name: "Enfermagem", activeStudents: 300, semesters: 8 }
  ],
  roles: {
    superAdmin: 1,
    rector: 1,
    coordinators: 3,
    professors: 45
  }
};

export const upeInstitutionProfile = {
  id: "upe-presidente-franco",
  name: "UPE Presidente Franco",
  abbreviation: "UPE PF",
  campus: "Presidente Franco",
  country: "Paraguai",
  city: "Presidente Franco",
  type: "Universidade Privada",
  course: "Medicina",
  contractedCapacity: upeBaseMetrics.contractedCapacity,
  registeredStudents: upeBaseMetrics.registeredStudents,
  activeStudents: upeBaseMetrics.activeStudents,
  inactiveStudents: upeBaseMetrics.registeredStudents - upeBaseMetrics.activeStudents,
  pendingStudents: 1,
  blockedStudents: 0,
  noAccessLast30Days: 42,
  pricePerStudent: 50,
  licenseStatus: "ativa",
  billingModel: "Aluno ativo mensal",
  licenseStart: "2026-01-12T12:00:00.000Z",
  nextRenewal: "2027-01-12T12:00:00.000Z",
  institutionalResponsible: "Dr. Roberto",
  administrativeEmail: "admin@upe.edu.py",
  contractNotes: "Licença premium com simulados e analytics completo."
};

// Função agregadora da camada institucional
export function getInstitutionalLayer() {
  return {
    metrics: upeBaseMetrics,
    hierarchy: upeHierarchy,
    profile: upeInstitutionProfile
  };
}

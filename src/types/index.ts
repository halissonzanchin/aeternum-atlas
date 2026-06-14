export type AccessStatus = "acesso_institucional" | "active" | "inactive";
export type CanonicalUserRole = "student" | "teacher" | "institution_admin" | "super_admin";
export type LegacyUserRole = "professor" | "admin";
export type UserRole = CanonicalUserRole | LegacyUserRole;
export type ViewerType = "sketchfab" | "threejs";
export type ContractStatus = "active" | "inactive" | "implementation" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userType: string;
  institutionId?: string;
  institution?: string;
  course?: string;
  semester?: string;
  studentRegistration?: string;
  country?: string;
  language?: "pt" | "es" | "en" | "de";
  accountStatus?: "ativo" | "inativo" | "pendente" | "bloqueado" | "egresso";
  accessStatus?: AccessStatus;
  licenseStatus?: string;
  firstLoginAt?: string;
  lastLoginAt?: string;
}

export interface AnatomyModel {
  id: string;
  title: string;
  description: string;
  category: string;
  region: string;
  system: string;
  level: string;
  type: string;
  viewerType: ViewerType;
  sketchfabUrl?: string;
  embedUrl?: string;
  externalUrl?: string;
  estimatedStudyTime?: string;
  coverImageUrl?: string;
  access: "institutional" | "module_restricted";
  isActive: boolean;
}

export interface AnatomicalStructure {
  id: string;
  modelId: string;
  name: string;
  latinName: string;
  system: string;
  region: string;
  description: string;
  location: string;
  type: string;
  clinicalNotes: string;
}

export interface Institution {
  id: string;
  name: string;
  slug?: string;
  country: string;
  city?: string;
  active?: boolean;
  contractedCapacity?: number;
  activeStudents?: number;
  registeredStudents?: number;
  pricePerStudent?: number;
  contractStatus?: ContractStatus;
  contractType: string;
  billingModel: "aluno_cadastrado" | "aluno_ativo_mensal" | "faixa_de_alunos" | "valor_fixo" | "hibrido";
  pricePerRegisteredStudent?: number;
  pricePerActiveStudent: number;
  licenseStatus: "ativa" | "inativa" | "em_implantacao";
  licenseStart?: string;
  licenseEnd?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherProfile {
  userId: string;
  department: string;
  specialization: string;
  allowedModels: string[];
  academicTitle: string;
}

export interface StudentProfile {
  userId: string;
  course: string;
  semester: string;
  registrationNumber: string;
  progressScore: number;
  totalStudyMinutes: number;
  favoriteModels: string[];
  lastAccessAt?: string;
}

export interface ModelAccessLog {
  id: string;
  userId: string;
  institutionId: string;
  modelId: string;
  action: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  createdAt: string;
}

export interface InstitutionMonthlyBilling {
  id: string;
  institutionId: string;
  month: number;
  year: number;
  registeredStudents: number;
  activeStudents: number;
  billableStudents: number;
  pricePerStudent: number;
  estimatedTotal: number;
  generatedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  institutionId: string;
  modelId: string;
  createdAt: string;
}

export interface StudyProgress {
  id: string;
  userId: string;
  institutionId: string;
  modelId: string;
  completed: boolean;
  progressPercent: number;
  completedAt?: string;
  updatedAt: string;
}

export interface AcademicClass {
  id: string;
  institutionId: string;
  teacherId: string;
  name: string;
  course?: string;
  semester?: string;
  status: "active" | "inactive" | "archived";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherStudyGuide {
  id: string;
  institutionId: string;
  teacherId: string;
  classId?: string;
  title: string;
  description?: string;
  objectives: string[];
  modelIds: string[];
  dueDate?: string;
  status: "draft" | "active" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface TeacherLessonPlan {
  id: string;
  institutionId: string;
  teacherId: string;
  classId?: string;
  title: string;
  scheduledFor?: string;
  modelIds: string[];
  keyStructures: string[];
  objectives: string[];
  notes?: string;
  status: "planned" | "delivered" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface TeacherAnatomicalNote {
  id: string;
  institutionId: string;
  teacherId: string;
  modelId?: string;
  structure?: string;
  noteType: "correction" | "didactic" | "clinical" | "legend" | "annotation";
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_review" | "resolved" | "archived";
  visibility: "private" | "institution" | "admin";
  createdAt: string;
  updatedAt: string;
}

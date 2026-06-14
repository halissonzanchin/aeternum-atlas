export function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

export function normalizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function validateRegister(values) {
  const errors = {};

  if (!sanitizeText(values.name)) errors.name = "Nome obrigatório.";
  if (!isValidEmail(values.email)) errors.email = "Informe um e-mail válido.";
  if (!values.password || values.password.length < 8) errors.password = "A senha precisa ter no mínimo 8 caracteres.";
  if (values.confirmPassword !== values.password) errors.confirmPassword = "As senhas não conferem.";
  if (!sanitizeText(values.userType)) errors.userType = "Tipo de usuário obrigatório.";
  if (!sanitizeText(values.institutionId || values.institution)) errors.institution = "Instituição obrigatória.";
  if (!sanitizeText(values.course)) errors.course = "Curso obrigatório.";
  if (!sanitizeText(values.semester)) errors.semester = "Ano ou semestre obrigatório.";
  if (!sanitizeText(values.studentRegistration) && values.userType === "Estudante") errors.studentRegistration = "Matrícula ou R.A. obrigatório.";
  if (!values.acceptTerms) errors.acceptTerms = "Aceite os termos acadêmicos para continuar.";

  return errors;
}

export function validateLogin(values) {
  const errors = {};
  if (!isValidEmail(values.email)) errors.email = "Informe um e-mail válido.";
  if (!values.password) errors.password = "Informe sua senha.";
  return errors;
}

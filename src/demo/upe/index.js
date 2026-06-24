export function isUpeDemoMode(user) {
  if (import.meta.env.VITE_DEMO_MODE === 'upe') return true;
  if (user && user.email && isDemoPresentationAccount(user.email)) return true;
  return false;
}

const DEMO_ACCOUNTS = [
  "admin@aeternumatlas.com",
  "reitor@upe.edu.py",
  "coordenador@upe.edu.py",
  "professor@upe.edu.py",
  "demo@upe.edu.py"
];

export function isDemoPresentationAccount(email) {
  if (!email) return false;
  return DEMO_ACCOUNTS.includes(email.toLowerCase());
}

export * from './students';
export * from './professors';
export * from './classes';
export * from './courses';
export * from './engagement';
export * from './heatmaps';
export * from './quizzes';
export * from './roi';
export * from './alerts';
export * from './studentMock';
export * from './aiMock';
export * from './dataset';
export * from './institutionalLayer';
export * from './academicLayer';
export * from './financialLayer';
export * from './executiveLayer';

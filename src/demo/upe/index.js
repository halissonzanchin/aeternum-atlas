export function isUpeDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === 'upe';
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
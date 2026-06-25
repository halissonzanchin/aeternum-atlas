/**
 * atlasAIStudyPaths.js
 * Módulo seguro para gerenciar sequências guiadas de estudo (Trilhas de Estudo) no Aeternum AI Tutor.
 */

export const STUDY_PATH_TYPES = {
  GENERAL_OVERVIEW: 'GENERAL_OVERVIEW',
  NEURO_MEDIAN: 'NEURO_MEDIAN',
  PRACTICAL_REVIEW: 'PRACTICAL_REVIEW'
};

/**
 * Cria trilhas dinâmicas filtrando pelos marcadores que realmente existem no modelo atual.
 * @param {Array} markers Marcadores disponíveis no viewer
 * @returns {Array} Array de trilhas disponíveis
 */
export function generateStudyPaths(markers) {
  if (!markers || !markers.length) return [];

  const availablePaths = [];

  // Trilha 1 - Visão Geral
  const generalTargets = ["Cerebelo", "Corpo Caloso", "Quarto Ventrículo", "Hipófise", "Cunha"];
  const generalSteps = generalTargets
    .map(target => markers.find(m => (m.title || m.name || '').toLowerCase().includes(target.toLowerCase())))
    .filter(Boolean); // Only keep markers that exist in this model
  
  if (generalSteps.length > 0) {
    availablePaths.push({
      id: STUDY_PATH_TYPES.GENERAL_OVERVIEW,
      title: "Visão Geral do Modelo",
      description: "Uma rota rápida pelas principais estruturas anatômicas.",
      steps: generalSteps
    });
  }

  // Trilha 2 - Neuroanatomia mediana
  const neuroTargets = ["Corpo Caloso", "Quarto Ventrículo", "Cerebelo", "Tronco", "Hipófise"];
  const neuroSteps = neuroTargets
    .map(target => markers.find(m => (m.title || m.name || '').toLowerCase().includes(target.toLowerCase())))
    .filter(Boolean);
  
  if (neuroSteps.length > 0) {
    availablePaths.push({
      id: STUDY_PATH_TYPES.NEURO_MEDIAN,
      title: "Neuroanatomia Mediana",
      description: "Foco nas estruturas do eixo sagital mediano.",
      steps: neuroSteps
    });
  }

  return availablePaths;
}

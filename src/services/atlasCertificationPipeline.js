export const CertificationStage = {
  NOT_STARTED: 'NOT_STARTED',
  INVENTORY_READY: 'INVENTORY_READY',
  ASSET_READY: 'ASSET_READY',
  MARKERS_READY: 'MARKERS_READY',
  EDUCATION_READY: 'EDUCATION_READY',
  QUIZ_AI_READY: 'QUIZ_AI_READY',
  ANALYTICS_READY: 'ANALYTICS_READY',
  ATLAS_CERTIFIED: 'ATLAS_CERTIFIED'
};

export const createCertificationPipeline = (modelId) => {
  console.log(`[Atlas Certification] Gerando base estrutural de pipeline para o modelo: ${modelId}`);
  
  return {
    modelId,
    status: CertificationStage.NOT_STARTED,
    score: 0,
    checklists: {
      asset: false,
      structures: false,
      markers: false,
      cameras: false,
      education: false,
      quiz: false,
      aiTutor: false,
      analytics: false
    },
    startedAt: null,
    certifiedAt: null
  };
};

export const duplicatePipelineFromReference = (sourceModelId, targetModelId) => {
  console.log(`[Atlas Certification] Duplicando base pipeline de ${sourceModelId} para ${targetModelId}...`);
  return {
    ...createCertificationPipeline(targetModelId),
    status: CertificationStage.NOT_STARTED,
    notes: `Duplicado usando o gabarito estrutural de ${sourceModelId}. Requer calibração de coordenadas anatômicas independentes.`
  };
};

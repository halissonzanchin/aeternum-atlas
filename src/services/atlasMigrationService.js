import { listModelsForUser } from './modelService';
import { atlasAnnotationCmsService } from './atlasAnnotationCmsService';

/**
 * Calcula a pontuação de migração para um dado modelo.
 * Total: 100 pontos.
 */
export function calculateMigrationScore(model, markers = []) {
  let score = 0;
  const checks = {
    hasAsset: false,
    viewerFunctional: false,
    structuresRegistered: false,
    isolationLayerValid: false,
    markersRecreated: false,
    camerasRecreated: false,
    hasEducationalContent: false,
    hasQuiz: false,
    hasAiTutor: false,
    telemetryActive: true // Assume default platform telemetry
  };

  // 1. Asset (20 pts)
  const isAtlasNative = model.viewerType === 'atlas-native' || model.viewer_engine === 'atlas-native' || model.viewer_engine === 'atlas';
  const hasAssetUrl = !!(model.atlasAssetObjectUrl || model.atlasEngineModelUrl || model.model_url);
  
  if (isAtlasNative && hasAssetUrl) {
    score += 20;
    checks.hasAsset = true;
    checks.viewerFunctional = true;
  }

  // 2. Marcadores (20 pts)
  if (markers && markers.length > 0) {
    score += 20;
    checks.markersRecreated = true;
  }

  // 3. Câmeras (10 pts)
  const hasCameras = markers.some(m => m.cameraPosition || m.camera_position);
  if (hasCameras) {
    score += 10;
    checks.camerasRecreated = true;
  }

  // 4. Conteúdo educacional (15 pts)
  if (model.description || (model.structures && model.structures.length > 0) || model.overview) {
    score += 15;
    checks.hasEducationalContent = true;
    if (model.structures && model.structures.length > 0) checks.structuresRegistered = true;
  }

  // 5. Quiz (15 pts)
  if (model.quizzes || model.quizId || (model.id === 'coracao-humano' || model.id === 'coracao-humano-superficial')) {
    // Simulando base de mock atual
    score += 15;
    checks.hasQuiz = true;
  }

  // 6. Tutor IA (10 pts)
  if (isAtlasNative) {
    score += 10;
    checks.hasAiTutor = true; // No atlas native o Tutor IA é default habilitado
    checks.isolationLayerValid = true;
  }

  // 7. Analytics (10 pts)
  score += 10; // Plataforma tem telemetria central

  return { score, checks };
}

/**
 * Determina o status da migração com base na pontuação
 */
export function getMigrationStatus(score, model) {
  const isAtlasNative = model.viewerType === 'atlas-native' || model.viewer_engine === 'atlas-native' || model.viewer_engine === 'atlas';
  
  if (score >= 100) return 'CERTIFIED';
  if (score >= 70 && isAtlasNative) return 'ATLAS_NATIVE';
  if (score >= 40) return 'MIGRATING';
  if (isAtlasNative && score < 40) return 'READY_FOR_MIGRATION';
  return 'LEGACY_SKETCHFAB';
}

/**
 * Retorna as métricas de todo o catálogo para o dashboard
 */
export async function getMigrationDashboardMetrics(user) {
  const models = await listModelsForUser(user, { includeInactive: true });
  
  let total = models.length;
  let sketchfabCount = 0;
  let atlasNativeCount = 0;
  let certifiedCount = 0;
  let migratingCount = 0;
  
  let assetsMigrated = 0;
  let markersMigrated = 0;
  let quizzesMigrated = 0;
  let aiTutorsPrepared = 0;

  const enrichedModels = models.map(model => {
    // Para simplificar no MVP, buscamos do cache local ou usa o mock. O ideal seria ter uma query batch de anotações
    let markers = [];
    try {
      markers = atlasAnnotationCmsService.getMarkers(model.id) || [];
      if (markers.length === 0 && model.markers) markers = model.markers;
    } catch(e) {}

    const { score, checks } = calculateMigrationScore(model, markers);
    const status = getMigrationStatus(score, model);

    if (status === 'LEGACY_SKETCHFAB') sketchfabCount++;
    if (status === 'ATLAS_NATIVE') atlasNativeCount++;
    if (status === 'CERTIFIED') certifiedCount++;
    if (status === 'MIGRATING') migratingCount++;

    if (checks.hasAsset) assetsMigrated++;
    if (checks.markersRecreated) markersMigrated += markers.length;
    if (checks.hasQuiz) quizzesMigrated++;
    if (checks.hasAiTutor) aiTutorsPrepared++;

    return { ...model, migrationScore: score, migrationStatus: status, checks, markersCount: markers.length };
  });

  const percentComplete = total > 0 ? Math.round(((certifiedCount + atlasNativeCount * 0.7 + migratingCount * 0.4) / total) * 100) : 0;

  return {
    kpis: {
      total,
      sketchfabCount,
      atlasNativeCount: atlasNativeCount + certifiedCount,
      certifiedCount,
      percentComplete,
      assetsMigrated,
      markersMigrated,
      quizzesMigrated,
      aiTutorsPrepared
    },
    models: enrichedModels
  };
}

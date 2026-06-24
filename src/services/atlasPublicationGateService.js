export function validateAssetPublicationGate(model, user, isSuperAdmin) {
  const result = {
    allowed: false,
    level: 'blocked',
    reason: '',
    errors: [],
    warnings: [],
    requiresSuperAdminOverride: false
  };

  const isSketchfab = (model.viewerType || model.viewer_engine) === 'sketchfab';
  
  if (isSketchfab) {
    // Modelos do tipo sketchfab não entram no pipeline estrito do Atlas Native (WebGL pesado)
    result.allowed = true;
    result.level = 'approved';
    result.reason = 'Modelo tipo Sketchfab isento do QA Pipeline.';
    return result;
  }

  const hasAsset = model.atlasAssetStatus === 'ready' && !!model.atlasAssetObjectUrl;
  if (!hasAsset) {
    result.errors.push("Arquivo principal 3D (.glb/.obj) não encontrado ou não anexado.");
    result.reason = "O modelo não possui arquivo 3D atrelado no Storage.";
    result.level = 'blocked';
    // Nem o SuperAdmin pode publicar sem um asset
    return result;
  }

  const qaReport = model.qaReport;
  if (!qaReport || qaReport.status === 'not_checked') {
    result.errors.push("O diagnóstico de QA ainda não foi executado para este asset.");
    result.reason = "É obrigatório executar o QA Pipeline antes da publicação.";
    result.level = 'blocked';
    return result;
  }

  const status = qaReport.status;
  const score = qaReport.score;
  const format = (qaReport.fileFormat || '').toLowerCase();
  const size = qaReport.fileSizeMb || 0;

  // Analisa critérios de bloqueio absoluto/super admin
  if (status === 'rejected') {
    result.errors.push("O arquivo foi classificado como rejeitado no laudo QA.");
  }
  if (status === 'needs_optimization') {
    result.errors.push("O arquivo exige otimização estrutural (needs_optimization).");
  }
  if (score < 60) {
    result.errors.push(`Score muito baixo (${score} < 60).`);
  }
  if (format === 'obj') {
    result.errors.push("Arquivo bruto (.obj) não deve ser publicado diretamente. Converta para .glb.");
  }
  if (size > 500) {
    result.errors.push("Tamanho superior a 500MB é extremamente arriscado para WebGL.");
  }

  if (result.errors.length > 0) {
    result.requiresSuperAdminOverride = true;
    result.reason = "O ativo falhou nos critérios de qualidade anatômica estrita.";
    
    if (isSuperAdmin) {
      result.level = 'override_required';
      result.reason += " Somente via Super Admin Override.";
    } else {
      result.level = 'blocked';
      result.reason += " Bloqueio efetivo para Admin Global.";
    }
  } else {
    // Passou limpo
    result.allowed = true;
    if (status === 'pending_review' || size > 50) {
      result.level = 'warning';
      result.warnings.push("O modelo foi aprovado, mas possui alertas visuais no laudo QA.");
    } else {
      result.level = 'approved';
    }
    result.reason = "Asset certificado para publicação educacional.";
  }

  if (process.env.NODE_ENV === 'development') {
    console.log("[Atlas Publication Gate]", {
      modelId: model.id,
      modelTitle: model.title,
      qaStatus: status,
      qaScore: score,
      fileType: format,
      fileSizeMb: size,
      publicationStatus: model.status,
      userEmail: user?.email,
      isSuperAdmin,
      allowed: result.allowed,
      requiresOverride: result.requiresSuperAdminOverride,
      errors: result.errors,
      warnings: result.warnings
    });
  }

  return result;
}

/**
 * Viewer Engine Service
 * Responsável por orquestrar a lógica de exibição, validação e configuração do motor 3D
 * do Aeternum Atlas (Atlas Native, Sketchfab Embed, Hybrid).
 */

export function normalizeViewerEngineConfig(model) {
  if (!model) return null;

  return {
    viewerEngine: model.viewerEngine || model.viewer_engine || model.viewerType || "atlas-native",
    defaultViewerEngine: model.defaultViewerEngine || "atlas-native",
    embedProvider: model.embedProvider || null,
    embedUrl: model.embedUrl || null,
    nativeEngineAvailable: typeof model.nativeEngineAvailable === "boolean" ? model.nativeEngineAvailable : true,
    nativeFallbackAvailable: typeof model.nativeFallbackAvailable === "boolean" ? model.nativeFallbackAvailable : true,
    modelLodManifest: model.modelLodManifest || null,
    engineStatus: model.engineStatus || "active",
    engineNotice: model.engineNotice || ""
  };
}

export function getDefaultViewerEngine(model) {
  const config = normalizeViewerEngineConfig(model);
  if (!config) return "atlas-native";
  return config.defaultViewerEngine || "atlas-native";
}

export function validateSketchfabEmbedUrl(url) {
  if (!url || typeof url !== "string") return false;
  // Bloqueio de injeções maliciosas
  if (url.trim().toLowerCase().startsWith("javascript:")) return false;
  if (url.trim().toLowerCase().startsWith("data:")) return false;
  if (url.trim().toLowerCase().startsWith("blob:")) return false;
  
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "sketchfab.com" && parsed.hostname !== "www.sketchfab.com") {
      return false;
    }
    if (!parsed.pathname.endsWith("/embed")) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function buildSketchfabEmbedUrl(url, options = {}) {
  if (!validateSketchfabEmbedUrl(url)) return null;
  
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("autostart", "1");
    parsed.searchParams.set("ui_theme", "dark");
    parsed.searchParams.set("dnt", "1");
    
    // TAREFA 2 - Parâmetros Educacionais Aeternum
    parsed.searchParams.set("ui_infos", "0");
    parsed.searchParams.set("ui_controls", "0");
    parsed.searchParams.set("ui_hint", "0");
    parsed.searchParams.set("ui_help", "0");
    parsed.searchParams.set("ui_fullscreen", "0");
    parsed.searchParams.set("ui_settings", "0");
    parsed.searchParams.set("ui_vr", "0");
    parsed.searchParams.set("ui_inspector", "0");
    parsed.searchParams.set("ui_watermark", "0");
    parsed.searchParams.set("ui_annotations", "1"); // FUNDAMENTAL PARA O GUIA E SIMULADOS

    // Preserve any incoming options if needed
    for (const [key, value] of Object.entries(options)) {
      parsed.searchParams.set(key, value);
    }
    return parsed.toString();
  } catch (e) {
    return null;
  }
}

export function shouldUseSketchfabEngine(model, requestedEngine = null, user = null) {
  const config = normalizeViewerEngineConfig(model);
  if (!config) return false;

  const hasValidEmbed = config.embedProvider === "sketchfab" && validateSketchfabEmbedUrl(config.embedUrl);
  
  // REGRA: Governance Reset (Phase 8.18B.2R)
  // Super Admin can use native engine if explicitly requested
  const isSuperAdmin = user?.role === 'super_admin';
  
  if (!isSuperAdmin) {
    // Non-Super Admins ALWAYS get Sketchfab if it has a valid embed, ignoring requestedEngine
    if (hasValidEmbed) return true;
  } else {
    // Super Admin respects requestedEngine
    if (requestedEngine === "native") return false;
    if (requestedEngine === "sketchfab") return hasValidEmbed;
  }

  // Sem query ou query inválida, usa configuração do modelo
  if (config.defaultViewerEngine === "sketchfab" || config.viewerEngine === "sketchfab" || config.viewerEngine === "hybrid") {
    return hasValidEmbed;
  }

  // Fallback seguro: se não tiver embed válido, tenta native
  return false;
}

export function shouldUseNativeEngine(model, requestedEngine = null, user = null) {
  const isSketchfab = shouldUseSketchfabEngine(model, requestedEngine, user);
  return !isSketchfab;
}

export function getEngineLabel(model, requestedEngine = null) {
  if (shouldUseSketchfabEngine(model, requestedEngine)) {
    return "Sketchfab Embed";
  }
  return "Atlas Native Engine";
}

export function getEngineModeSummary(model) {
  const config = normalizeViewerEngineConfig(model);
  if (!config) return "Desconhecido";

  if (config.viewerEngine === "hybrid") return "Híbrido (Native + Sketchfab)";
  if (config.viewerEngine === "sketchfab") return "Apenas Sketchfab Embed";
  return "Exclusivo Atlas Native";
}

export function getNativeEngineUrl(model) {
  if (!model) return null;
  return model.atlasAssetObjectUrl || model.atlasEngineModelUrl || model.model_url || model.modelUrl || null;
}

/**
 * Contrato único do visualizador Aeternum Atlas.
 *
 * O runtime público aceita somente embeds HTTPS do Sketchfab. Não existe
 * fallback silencioso para outro motor: um modelo sem UID/embed válido deve
 * aparecer como indisponível até que o CMS seja corrigido.
 */

const SKETCHFAB_HOSTS = new Set(["sketchfab.com", "www.sketchfab.com"]);
const SKETCHFAB_EMBED_PATH = /^\/models\/[a-zA-Z0-9]{20,40}\/embed\/?$/;

export function validateSketchfabEmbedUrl(url) {
  if (!url || typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      && !parsed.username
      && !parsed.password
      && (!parsed.port || parsed.port === "443")
      && SKETCHFAB_HOSTS.has(parsed.hostname)
      && SKETCHFAB_EMBED_PATH.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function sketchfabUidFromModel(model) {
  const explicitUid = model?.sketchfabUid || model?.sketchfab_uid;
  if (explicitUid) return String(explicitUid);

  const candidates = [
    model?.embedUrl,
    model?.sketchfabEmbedUrl,
    model?.embed_url,
    model?.sketchfabUrl,
    model?.sketchfab_url
  ];

  for (const candidate of candidates) {
    const match = String(candidate || "").match(/(?:models|3d-models\/[^/]+)-?\/?([a-zA-Z0-9]{32})(?:\/embed)?/);
    if (match?.[1]) return match[1];
    const directMatch = String(candidate || "").match(/\/models\/([a-zA-Z0-9]{32})/);
    if (directMatch?.[1]) return directMatch[1];
    const suffixMatch = String(candidate || "").match(/-([a-zA-Z0-9]{32})(?:[/?#]|$)/);
    if (suffixMatch?.[1]) return suffixMatch[1];
  }

  return "";
}

export function canonicalSketchfabEmbedUrl(model) {
  const candidates = [model?.embedUrl, model?.sketchfabEmbedUrl, model?.embed_url];
  const validCandidate = candidates.find(validateSketchfabEmbedUrl);
  if (validCandidate) return validCandidate;

  const uid = sketchfabUidFromModel(model);
  return uid ? `https://sketchfab.com/models/${uid}/embed` : null;
}

export function buildSketchfabEmbedUrl(modelOrUrl, options = {}) {
  const baseUrl = typeof modelOrUrl === "string"
    ? (validateSketchfabEmbedUrl(modelOrUrl) ? modelOrUrl : canonicalSketchfabEmbedUrl({ sketchfabUrl: modelOrUrl }))
    : canonicalSketchfabEmbedUrl(modelOrUrl);

  if (!baseUrl) return null;

  const parsed = new URL(baseUrl);
  const defaults = {
    autostart: "1",
    ui_theme: "dark",
    dnt: "1",
    ui_infos: "0",
    ui_controls: "0",
    ui_hint: "0",
    ui_help: "0",
    ui_fullscreen: "0",
    ui_settings: "0",
    ui_vr: "0",
    ui_inspector: "0",
    ui_watermark: "0",
    ui_annotations: "1"
  };

  Object.entries({ ...defaults, ...options }).forEach(([key, value]) => {
    parsed.searchParams.set(key, String(value));
  });

  return parsed.toString();
}

export function shouldUseSketchfabEngine(model) {
  return Boolean(canonicalSketchfabEmbedUrl(model));
}

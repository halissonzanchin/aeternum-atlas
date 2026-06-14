import { supabase } from "../lib/supabase";
import { getUserInstitutionId, normalizeRole, ROLES } from "./permissions/permissionService";
import { isSupabaseConfigured } from "./supabase/supabaseClient";
import { sanitizeText } from "../utils/validators";
import { findLocalModel, mergeCatalogWithLocalModels } from "../data/localModels";

const MODEL_SELECT = [
  "id",
  "institution_id",
  "title",
  "slug",
  "anatomical_system",
  "anatomical_region",
  "sketchfab_url",
  "embed_url",
  "difficulty_level",
  "tags",
  "status",
  "thumbnail_url",
  "created_at"
].join(", ");

function activeModelStatus(status) {
  return ["active", "ativo", "available", "disponivel", "disponível"].includes(String(status || "").toLowerCase());
}

function mapDifficultyLevel(level = "") {
  const normalized = String(level || "").toLowerCase();
  if (normalized === "advanced" || normalized === "avancado" || normalized === "avançado") return "Avançado";
  if (normalized === "intermediate" || normalized === "intermediario" || normalized === "intermediário") return "Intermediário";
  if (normalized === "basic" || normalized === "basico" || normalized === "básico") return "Básico";
  return sanitizeText(level) || "Institucional";
}

function normalizeTagArray(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === "string") return tags.split(",").map(item => item.trim()).filter(Boolean);
  return [];
}

export function normalizeSupabaseModel(record = {}) {
  const tags = normalizeTagArray(record.tags);
  const embedUrl = sanitizeText(record.embed_url || record.sketchfab_url);
  const sketchfabUrl = sanitizeText(record.sketchfab_url || record.embed_url);

  return {
    id: record.id || record.slug || "",
    slug: record.slug || record.id || "",
    institutionId: record.institution_id || "",
    institution_id: record.institution_id || "",
    title: sanitizeText(record.title || "Modelo 3D"),
    shortTitle: sanitizeText(record.title || "Modelo 3D"),
    description: sanitizeText(tags[0] || ""),
    category: sanitizeText(record.anatomical_region || "Institucional"),
    region: sanitizeText(record.anatomical_region || "Institucional"),
    system: sanitizeText(record.anatomical_system || "Sistema anatômico"),
    level: mapDifficultyLevel(record.difficulty_level),
    type: "Sketchfab / Escaneamento anatômico",
    viewerType: "sketchfab",
    coverImageUrl: sanitizeText(record.thumbnail_url),
    thumbnailUrl: sanitizeText(record.thumbnail_url),
    sketchfabUrl,
    sketchfabEmbedUrl: embedUrl,
    embedUrl,
    externalUrl: sketchfabUrl,
    estimatedStudyTime: "",
    author: "",
    provider: "Sketchfab",
    status: activeModelStatus(record.status) ? "active" : sanitizeText(record.status || "inactive"),
    isActive: activeModelStatus(record.status),
    accessCount: 0,
    progressPercent: 0,
    overview: sanitizeText(tags[1] || tags[0] || ""),
    reference: "",
    objectives: [],
    structures: [],
    clinicalCorrelations: [],
    studyGuide: [],
    relatedStructures: [],
    references: [],
    createdAt: record.created_at || ""
  };
}

async function loadModelsQuery(user, { includeInactive = false } = {}) {
  if (!isSupabaseConfigured()) {
    console.warn("[models] Supabase não configurado. Catálogo bloqueado por segurança.");
    return [];
  }

  const role = normalizeRole(user?.role);
  const institutionId = getUserInstitutionId(user);

  if (role !== ROLES.SUPER_ADMIN && !institutionId) {
    console.warn("[models] Consulta bloqueada: institution_id ausente para usuário institucional.");
    return [];
  }

  let query = supabase.from("models_3d").select(MODEL_SELECT);

  if (role !== ROLES.SUPER_ADMIN) {
    query = query.eq("institution_id", institutionId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[models] Falha ao carregar models_3d.", error);
    return [];
  }

  return (data || [])
    .map(normalizeSupabaseModel)
    .filter(model => includeInactive || model.isActive);
}

export async function listModelsForUser(user, options = {}) {
  const models = await loadModelsQuery(user, options);
  return mergeCatalogWithLocalModels(models, options);
}

export async function getModelByIdForUser(id, user, options = {}) {
  const normalizedId = id === "coracao-humano" ? "coracao-humano-superficial" : id;
  const models = await listModelsForUser(user, options);
  return models.find(model => model.id === normalizedId || model.slug === normalizedId) || findLocalModel(normalizedId);
}

export function getModelFilterOptions(models = []) {
  return {
    categories: Array.from(new Set(models.map(model => model.category).filter(Boolean))),
    systems: Array.from(new Set(models.map(model => model.system).filter(Boolean))),
    regions: Array.from(new Set(models.map(model => model.region).filter(Boolean))),
    levels: Array.from(new Set(models.map(model => model.level).filter(Boolean))),
    types: Array.from(new Set(models.map(model => model.type).filter(Boolean)))
  };
}

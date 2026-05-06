import { anatomyCategories } from "../data/mockCategories";
import { mockModels } from "../data/mockModels";
import { slugify } from "../utils/formatters";
import { sanitizeText } from "../utils/validators";
import { readStorage, storageKeys, writeStorage } from "./storage";

export function getCategories() {
  const categories = readStorage(storageKeys.categories, null);
  if (categories) return categories;
  writeStorage(storageKeys.categories, anatomyCategories);
  return anatomyCategories;
}

export function saveCategory(category) {
  const clean = sanitizeText(category);
  if (!clean) return getCategories();
  const categories = getCategories();
  if (categories.some(item => item.toLowerCase() === clean.toLowerCase())) return categories;
  const updated = [...categories, clean];
  writeStorage(storageKeys.categories, updated);
  return updated;
}

export function getModels() {
  const models = readStorage(storageKeys.models, null);
  if (models) {
    const storedModels = models.filter(model => model.id !== "coracao-humano");
    const merged = [
      ...storedModels.map(model => {
        const seedModel = mockModels.find(item => item.id === model.id);
        return normalizeModel(seedModel ? { ...seedModel, ...model } : model);
      }),
      ...mockModels.filter(model => !storedModels.some(stored => stored.id === model.id)).map(model => normalizeModel(model))
    ];
    writeStorage(storageKeys.models, merged);
    return merged;
  }
  writeStorage(storageKeys.models, mockModels);
  return mockModels;
}

export function getModelById(id) {
  const normalizedId = id === "coracao-humano" ? "coracao-humano-superficial" : id;
  return getModels().find(model => model.id === normalizedId);
}

export function saveModel(model) {
  const models = getModels();
  const id = model.id || slugify(model.title);
  const normalized = normalizeModel({
    ...model,
    id,
    accessCount: Number(model.accessCount || 0)
  });

  const exists = models.some(item => item.id === id);
  const updated = exists ? models.map(item => item.id === id ? normalized : item) : [...models, normalized];
  writeStorage(storageKeys.models, updated);
  return normalized;
}

function normalizeModel(model) {
  return {
    ...model,
    title: sanitizeText(model.title),
    description: sanitizeText(model.description),
    category: sanitizeText(model.category),
    region: sanitizeText(model.region || "Geral"),
    system: sanitizeText(model.system || "Sistema esquelético"),
    level: sanitizeText(model.level),
    type: sanitizeText(model.type || "Modelo didático"),
    viewerType: sanitizeText(model.viewerType || "sketchfab"),
    coverImageUrl: sanitizeText(model.coverImageUrl),
    sketchfabUrl: sanitizeText(model.sketchfabUrl),
    sketchfabEmbedUrl: sanitizeText(model.sketchfabEmbedUrl),
    sketchfabModelUrl: sanitizeText(model.sketchfabModelUrl),
    embedUrl: sanitizeText(model.embedUrl || model.sketchfabEmbedUrl),
    externalUrl: sanitizeText(model.externalUrl || model.shortUrl || model.sketchfabModelUrl),
    shortUrl: sanitizeText(model.shortUrl),
    shortTitle: sanitizeText(model.shortTitle),
    access: "institutional",
    status: sanitizeText(model.status || (model.isActive === false ? "inactive" : "active")),
    estimatedStudyTime: sanitizeText(model.estimatedStudyTime),
    author: sanitizeText(model.author),
    provider: sanitizeText(model.provider),
    isPremium: false,
    isActive: model.isActive !== false,
    accessCount: Number(model.accessCount || 0),
    progressPercent: Number(model.progressPercent || 0),
    overview: sanitizeText(model.overview || model.description),
    reference: sanitizeText(model.reference),
    objectives: Array.isArray(model.objectives) ? model.objectives : [],
    structures: Array.isArray(model.structures) ? model.structures : [],
    clinicalCorrelations: Array.isArray(model.clinicalCorrelations) ? model.clinicalCorrelations : [],
    studyGuide: Array.isArray(model.studyGuide) ? model.studyGuide : [],
    learningObjectives: Array.isArray(model.learningObjectives) ? model.learningObjectives : [],
    relatedStructures: Array.isArray(model.relatedStructures) ? model.relatedStructures : [],
    references: Array.isArray(model.references) ? model.references : []
  };
}

export function deleteModel(id) {
  const updated = getModels().filter(model => model.id !== id);
  writeStorage(storageKeys.models, updated);
  return updated;
}

export function toggleModelStatus(id) {
  const updated = getModels().map(model => model.id === id ? { ...model, isActive: !model.isActive } : model);
  writeStorage(storageKeys.models, updated);
  return updated.find(model => model.id === id);
}

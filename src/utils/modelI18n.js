const TAXONOMY_KEYS = {
  levels: {
    "Básico": "basic",
    "Intermediário": "intermediate",
    "Avançado": "advanced"
  },
  types: {
    "Sketchfab / Escaneamento anatômico": "sketchfabScan",
    "Escaneamento cadavérico": "cadavericScan",
    "Modelo didático": "didacticModel",
    "Radiologia": "radiology",
    "Vídeo": "video",
    "Video": "video",
    "Curso": "course",
    "Sketchfab": "sketchfab"
  },
  systems: {
    "Sistema esquelético": "skeletal",
    "Tecido conjuntivo": "connectiveTissue",
    "Sistema muscular": "muscular",
    "Sistema arterial": "arterial",
    "Sistema venoso": "venous",
    "Sistema linfático": "lymphatic",
    "Sistema nervioso": "nervous",
    "Sistema nervoso": "nervous",
    "Sistema respiratório": "respiratory",
    "Sistema digestivo": "digestive",
    "Sistema endócrino": "endocrine",
    "Sistema urogenital": "urogenital",
    "Sistema tegumentário": "integumentary",
    "Cardiovascular": "cardiovascular",
    "Sistema cardiovascular": "cardiovascular",
    "Sistema respiratório/Cardiovascular": "respiratoryCardiovascular"
  },
  regions: {
    "Cabeça e pescoço": "headAndNeck",
    "Cabeça": "head",
    "Viscerocrânio": "viscerocranium",
    "Tórax": "thorax",
    "Abdome": "abdomen",
    "Sistema cardiovascular": "cardiovascular"
  },
  categories: {
    "Cabeça e pescoço": "headAndNeck",
    "Tórax": "thorax",
    "Abdome": "abdomen",
    "Sistema cardiovascular": "cardiovascular"
  },
  structures: {
    "Mandíbula": "mandible",
    "Maxila": "maxilla",
    "Osso temporal": "temporalBone",
    "Suturas cranianas": "cranialSutures",
    "Processo condilar": "condylarProcess",
    "Processo coronóide": "coronoidProcess",
    "Forame mentual": "mentalForamen",
    "Corpo da mandíbula": "mandibularBody",
    "Ápice cardíaco": "cardiacApex",
    "Base do coração": "heartBase",
    "Face esternocostal": "sternocostalSurface",
    "Face diafragmática": "diaphragmaticSurface",
    "Aurículas": "auricles",
    "Vasos da base": "greatVessels",
    "Artérias coronárias": "coronaryArteries",
    "Veias cardíacas": "cardiacVeins",
    "Costelas": "ribs",
    "Esterno": "sternum",
    "Pleura": "pleura",
    "Pulmões": "lungs",
    "Mediastino": "mediastinum",
    "Estômago": "stomach",
    "Fígado": "liver",
    "Intestino delgado": "smallIntestine",
    "Mesentério": "mesentery"
  },
  atlasSubcategories: {
    "Braço": "arm",
    "Antebraço": "forearm",
    "Mão": "hand",
    "Cintura Pélvica": "pelvicGirdle",
    "Coxa": "thigh",
    "Perna": "leg",
    "Pé": "foot"
  }
};

function translatedOrFallback(t, key, fallback) {
  const value = t(key);
  return value === key ? fallback : value;
}

export function taxonomyKey(group, value) {
  return TAXONOMY_KEYS[group]?.[value] || null;
}

export function translateTaxonomy(value, t, group) {
  if (!value) return "";
  const key = taxonomyKey(group, value);
  return key ? translatedOrFallback(t, `taxonomy.${group}.${key}`, value) : value;
}

export function translateModelField(model, field, t) {
  if (!model?.id) return model?.[field] || "";
  return translatedOrFallback(t, `modelData.${model.id}.${field}`, model[field] || "");
}

export function translateModelArray(model, field, t) {
  if (!model?.id) return [];
  const translated = t(`modelData.${model.id}.${field}`);

  if (Array.isArray(translated)) return translated;
  if (translated && translated !== `modelData.${model.id}.${field}` && typeof translated !== "string") return translated;

  return Array.isArray(model[field]) ? model[field] : [];
}

export function translateModelSummary(model, t) {
  if (!model) return model;

  return {
    ...model,
    title: translateModelField(model, "title", t),
    shortTitle: translateModelField(model, "shortTitle", t) || translateModelField(model, "title", t),
    description: translateModelField(model, "description", t),
    overview: translateModelField(model, "overview", t) || translateModelField(model, "description", t),
    clinicalNotes: translateModelField(model, "clinicalNotes", t),
    reference: translateModelField(model, "reference", t),
    level: translateTaxonomy(model.level, t, "levels"),
    type: translateTaxonomy(model.type, t, "types"),
    system: translateTaxonomy(model.system, t, "systems"),
    region: translateTaxonomy(model.region, t, "regions"),
    category: translateTaxonomy(model.category, t, "categories"),
    relatedStructures: translateModelArray(model, "relatedStructures", t),
    references: translateModelArray(model, "references", t),
    learningObjectives: translateModelArray(model, "learningObjectives", t),
    objectives: translateModelArray(model, "objectives", t),
    structures: translateModelArray(model, "structures", t),
    clinicalCorrelations: translateModelArray(model, "clinicalCorrelations", t),
    studyGuide: translateModelArray(model, "studyGuide", t)
  };
}

export function translatedSearchText(model, t) {
  const translatedModel = translateModelSummary(model, t);
  return [
    model.title,
    model.description,
    model.system,
    model.region,
    translatedModel.title,
    translatedModel.description,
    translatedModel.system,
    translatedModel.region,
    translatedModel.type,
    translatedModel.level
  ].filter(Boolean).join(" ").toLowerCase();
}

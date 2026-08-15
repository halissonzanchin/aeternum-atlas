import { LOCAL_MODELS } from "../data/localModels";
import { anatomicalStructureRegistry } from "../data/anatomicalStructureRegistry";
import { latarjetQuestionBank, MASTER_MACROCATEGORIES } from "../data/latarjetQuestionBank";

function normalizeString(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchGlobalContent(rawQuery = "", navItems = []) {
  const query = normalizeString(rawQuery);
  if (!query) return { models: [], structures: [], questionTopics: [], navigation: [] };

  // 1. Search 3D Models
  const matchedModels = LOCAL_MODELS.filter(model => {
    const titleMatch = normalizeString(model.title).includes(query);
    const shortTitleMatch = normalizeString(model.shortTitle).includes(query);
    const subtitleMatch = normalizeString(model.subtitle).includes(query);
    const systemMatch = normalizeString(model.system).includes(query);
    const keywordsMatch = Array.isArray(model.keywords) && model.keywords.some(k => normalizeString(k).includes(query));
    const structuresMatch = Array.isArray(model.structures) && model.structures.some(s => normalizeString(s.name || s.title || s).includes(query));

    return titleMatch || shortTitleMatch || subtitleMatch || systemMatch || keywordsMatch || structuresMatch;
  }).map(model => ({
    type: "model",
    id: model.id,
    title: model.shortTitle || model.title,
    subtitle: model.subtitle || `Sistema ${model.system}`,
    href: `/student/learning?model=${model.id}`,
    icon: "layers"
  }));

  // 2. Search Anatomical Regions / Structures
  const matchedStructures = [];
  Object.values(anatomicalStructureRegistry).forEach(region => {
    const regionMatch = normalizeString(region.regionName).includes(query);
    const systemMatch = normalizeString(region.anatomicalSystem).includes(query);
    const structMatch = Array.isArray(region.relatedStructures) && region.relatedStructures.filter(s => normalizeString(s).includes(query));

    if (regionMatch || systemMatch || (structMatch && structMatch.length > 0)) {
      matchedStructures.push({
        type: "structure",
        id: region.regionId,
        title: region.regionName,
        subtitle: `Sistema: ${region.anatomicalSystem} · ${region.relatedStructures.slice(0, 3).join(", ")}`,
        href: `/student/atlas`,
        icon: "activity"
      });
    }
  });

  // 3. Search Latarjet Question Bank & Taxonomia Mestre
  const matchedTopicsMap = new Map();

  MASTER_MACROCATEGORIES.forEach(cat => {
    if (normalizeString(cat.name).includes(query)) {
      matchedTopicsMap.set(cat.id, {
        type: "questionTopic",
        id: cat.id,
        title: cat.name,
        subtitle: `${cat.tome} · Taxonomia Mestre Latarjet`,
        href: `/student/flashcards`,
        icon: "book"
      });
    }
  });

  latarjetQuestionBank.forEach(q => {
    const structMatch = normalizeString(q.subcategoriaEstrutura).includes(query);
    const catMatch = normalizeString(q.categoria).includes(query);
    const questionMatch = normalizeString(q.pergunta).includes(query);

    if ((structMatch || catMatch || questionMatch) && !matchedTopicsMap.has(q.id)) {
      matchedTopicsMap.set(q.id, {
        type: "questionTopic",
        id: q.id,
        title: q.subcategoriaEstrutura || q.categoria,
        subtitle: `${q.macroCategoria || q.secao} (${q.nivel})`,
        href: `/student/flashcards`,
        icon: "book"
      });
    }
  });

  const matchedQuestionTopics = Array.from(matchedTopicsMap.values()).slice(0, 4);

  // 4. Search Navigation & Tools
  const matchedNavigation = navItems.filter(item => {
    return normalizeString(item.label).includes(query);
  }).map(item => ({
    type: "navigation",
    id: item.href,
    title: item.label,
    subtitle: "Página da plataforma",
    href: item.href,
    icon: item.icon || "compass"
  }));

  return {
    models: matchedModels.slice(0, 3),
    structures: matchedStructures.slice(0, 3),
    questionTopics: matchedQuestionTopics,
    navigation: matchedNavigation.slice(0, 4)
  };
}

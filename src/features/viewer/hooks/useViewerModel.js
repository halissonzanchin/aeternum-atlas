import { useState, useEffect, useMemo } from 'react';
import { getModelByIdForUser, listModelsForUser } from '../../../services/modelService';
import { translateModelSummary } from '../../../utils/modelI18n';
import { getStructureForModel } from '../../../data/mockStructures';
import { useLanguage } from '../../../context/LanguageContext';

export function buildStructure(model, t) {
  if (!model) return null;
  const structure = getStructureForModel(model.slug || model.id) || {};
  
  const structuresSafe = Array.isArray(model.structures) ? model.structures : [];
  const relatedSafe = Array.isArray(model.relatedStructures) ? model.relatedStructures : [];
  const studyGuideSafe = Array.isArray(model.studyGuide) ? model.studyGuide : [];
  const structurePartsSafe = Array.isArray(structure.parts) ? structure.parts : [];

  return {
    id: structure.id || model.id || "fallback-structure",
    name: model.title || structure.name || "Modelo 3D",
    system: model.system || structure.system || "Sistema",
    region: model.region || model.category || structure.region || "Região",
    location: model.region || structure.location || t("viewer.fallbackStructure.location"),
    type: model.level || structure.type || t("viewer.fallbackStructure.type"),
    description: model.overview || model.description || structure.description || t("viewer.fallbackStructure.description"),
    keyFeatures: relatedSafe.length ? relatedSafe : (Array.isArray(structure.keyFeatures) ? structure.keyFeatures : [
      t("viewer.fallbackStructure.feature1"),
      t("viewer.fallbackStructure.feature2"),
      t("viewer.fallbackStructure.feature3")
    ]),
    function: model.function || structure.function || t("viewer.fallbackStructure.function"),
    clinicalNotes: model.clinicalNotes || structure.clinicalNotes || t("viewer.fallbackStructure.clinicalNotes"),
    breadcrumb: [model.system || structure.system || "Sistema", model.region || model.category || structure.region || "Região", model.shortTitle || model.title || structure.name || "Modelo 3D"].filter(Boolean),
    parts: structurePartsSafe.length > 0 
      ? structurePartsSafe.map((part, index) => ({
          ...part,
          name: structuresSafe[index] || relatedSafe[index] || part.name || `Parte ${index + 1}`,
          description: studyGuideSafe[index] || part.description || ""
        }))
      : [
          { id: `${model.id || "model"}-part-1`, name: t("viewer.fallbackStructure.mainStructure"), latinName: "Pars principalis", description: t("viewer.fallbackStructure.mainStructureDescription") },
          { id: `${model.id || "model"}-part-2`, name: t("viewer.fallbackStructure.anatomicalLandmark"), latinName: "Punctum anatomicum", description: t("viewer.fallbackStructure.anatomicalLandmarkDescription") }
        ],
    surfaces: structuresSafe.length ? structuresSafe.slice(0, 5) : (Array.isArray(structure.surfaces) ? structure.surfaces : [t("viewer.surfacesList.anterior"), t("viewer.surfacesList.posterior"), t("viewer.surfacesList.superiorMargin"), t("viewer.surfacesList.inferiorMargin")]),
    markers: relatedSafe.length ? relatedSafe.slice(0, 5) : (Array.isArray(structure.markers) ? structure.markers : [t("viewer.markersList.topographicReference"), t("viewer.markersList.clinicalCorrelation"), t("viewer.markersList.guidedStudy")]),
    sections: Array.isArray(structure.sections) ? structure.sections : [t("viewer.planes.axial"), t("viewer.planes.coronal"), t("viewer.planes.sagittal")]
  };
}

export function useViewerModel(id, user) {
  const { t } = useLanguage();
  const [rawModel, setRawModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const model = useMemo(() => translateModelSummary(rawModel, t), [rawModel, t]);
  const initialStructure = useMemo(() => model ? buildStructure(model, t) : null, [model, t]);

  const [activeStructure, setActiveStructure] = useState(null);
  const [activePart, setActivePart] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    if (id === 'preview') {
      try {
        const previewModelRaw = localStorage.getItem('atlas_preview_model');
        if (previewModelRaw) {
          const previewModel = JSON.parse(previewModelRaw);
          setRawModel(previewModel);
          setAvailableModels([previewModel]);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to load preview model from local storage", e);
      }
    }

    Promise.all([
      getModelByIdForUser(id, user),
      listModelsForUser(user)
    ])
      .then(([modelRecord, models]) => {
        if (!mounted) return;
        setRawModel(modelRecord);
        setAvailableModels(models);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, user]);

  useEffect(() => {
    setActiveStructure(initialStructure);
    setActivePart(null);
  }, [initialStructure]);

  const structures = useMemo(() => {
    if (!activeStructure) return [];
    const parts = (activeStructure.parts || []).map(part => ({
      ...activeStructure,
      id: part.id,
      name: part.name,
      latinName: part.latinName,
      description: part.description,
      breadcrumb: [...(activeStructure.breadcrumb || []), part.name]
    }));
    return [activeStructure, ...parts];
  }, [activeStructure]);

  return {
    rawModel,
    model,
    availableModels,
    loading,
    initialStructure,
    activeStructure,
    setActiveStructure,
    activePart,
    setActivePart,
    structures
  };
}

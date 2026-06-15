import { useState, useEffect, useMemo } from 'react';
import { listModelAnnotations } from '../../../services/modelAnnotationService';

export function useViewerAnnotations(model) {
  const [sketchfabAnnotations, setSketchfabAnnotations] = useState([]);
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState(null);
  const [annotationNavigationRequest, setAnnotationNavigationRequest] = useState(null);

  const isSketchfabModel = Boolean(model?.sketchfabEmbedUrl || model?.sketchfabUrl || model?.sketchfab_url);

  useEffect(() => {
    if (!model?.id) return;
    setSketchfabAnnotations([]);
    setActiveAnnotationIndex(null);
    setAnnotationNavigationRequest(null);
  }, [model?.id]);

  useEffect(() => {
    if (!model?.id || !isSketchfabModel) return undefined;
    let mounted = true;

    listModelAnnotations(model.id).then(annotations => {
      if (!mounted || !annotations.length) return;
      setSketchfabAnnotations(annotations);
      setActiveAnnotationIndex(current => Number.isInteger(current) ? current : 0);
    });

    return () => {
      mounted = false;
    };
  }, [isSketchfabModel, model?.id]);

  const anatomicalStructures = useMemo(
    () => sketchfabAnnotations.map(annotation => annotation.name).filter(Boolean),
    [sketchfabAnnotations]
  );

  function handleAnnotationsLoad(annotations = []) {
    setSketchfabAnnotations(annotations);
    setActiveAnnotationIndex(current => Number.isInteger(current) ? current : (annotations.length ? 0 : null));
  }

  function handleSelectAnatomicalStructure(item, index) {
    const annotation = sketchfabAnnotations[index];
    if (!annotation || !Number.isInteger(index)) return;

    setActiveAnnotationIndex(index);
    setAnnotationNavigationRequest({
      index,
      requestId: `${model?.id || "model"}-${index}-${Date.now()}`
    });
  }

  function handleSketchfabAnnotationSelect(index) {
    if (!Number.isInteger(index) || index < 0) return;
    setActiveAnnotationIndex(index);
  }

  return {
    sketchfabAnnotations,
    activeAnnotationIndex,
    setActiveAnnotationIndex,
    annotationNavigationRequest,
    setAnnotationNavigationRequest,
    isSketchfabModel,
    anatomicalStructures,
    handleAnnotationsLoad,
    handleSelectAnatomicalStructure,
    handleSketchfabAnnotationSelect,
    setSketchfabAnnotations
  };
}

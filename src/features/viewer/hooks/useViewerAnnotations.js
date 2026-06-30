import { useState, useEffect, useMemo } from 'react';
import { listModelAnnotations } from '../../../services/modelAnnotationService';
import { sketchfabBridge } from '../../../services/sketchfabAnnotationBridge';
import { getEnrichedMarker } from '../../../data/anatomicalMarkerLabels';

export function useViewerAnnotations(model) {
  const [sketchfabAnnotations, setSketchfabAnnotations] = useState([]);
  const [sketchfabReady, setSketchfabReady] = useState(false);
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

    const rawAnnotations = sketchfabBridge.getSketchfabAnnotations();
    setSketchfabAnnotations(rawAnnotations.map(ann => getEnrichedMarker(model, ann)));
    setSketchfabReady(sketchfabBridge.isSketchfabReady());

    const unsubReady = sketchfabBridge.subscribeToSketchfabReady(() => setSketchfabReady(true));

    const unsubAnnotations = sketchfabBridge.subscribe((annotations) => {
      setSketchfabAnnotations(annotations.map(ann => getEnrichedMarker(model, ann)));
    });

    const unsubSelect = sketchfabBridge.subscribeToAnnotationSelect((idx) => {
      setActiveAnnotationIndex(idx);
    });

    return () => {
      unsubReady();
      unsubAnnotations();
      unsubSelect();
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
    sketchfabBridge.goToSketchfabAnnotation(index);
  }

  return {
    sketchfabReady,
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

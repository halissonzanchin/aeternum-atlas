import { useViewer } from './ViewerContext';
import ModelViewer from '../../components/ModelViewer/ModelViewer';
import { trackEvent } from '../../services/analytics/analyticsService';
import { recordLearningEvent } from '../../services/learningTelemetryService';

export default function ViewerSketchfab() {
  const {
    model,
    activeStructure,
    structures,
    activePart,
    user,
    navigate,
    progress: { favorite, studied, accessRegistered },
    annotations: {
      handleAnnotationsLoad,
      handleSketchfabAnnotationSelect,
      annotationNavigationRequest
    },
    quiz: { quizOpen, quizResult },
    handleViewerAction,
    handleSelectStructure
  } = useViewer();

  function handleSketchfabEvent(event) {
    if (!model?.id) return;
    const eventType = event.eventType || event.type;
    const eventData = {
      ...(event.metadata || {}),
      modelUid: event.modelUid,
      annotationIndex: event.annotationIndex,
      annotationCount: event.annotationCount,
      source: "sketchfab_viewer_api"
    };
    trackEvent({
      ...event,
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role || "student",
      modelId: model.id,
      eventType,
      metadata: eventData
    });
    recordLearningEvent({
      user,
      modelId: model.id,
      eventType,
      eventData
    });
  }

  return (
    <div className="viewer-main">
      <div className="viewer-scroll-content">
        <ModelViewer
          model={model}
          structure={activeStructure}
          structures={structures}
          activePart={activePart}
          accessLocked={false}
          onSelectStructure={handleSelectStructure}
          onViewerAction={handleViewerAction}
          onViewerEvent={handleSketchfabEvent}
          onAnnotationsLoad={handleAnnotationsLoad}
          onAnnotationSelect={handleSketchfabAnnotationSelect}
          annotationNavigationRequest={annotationNavigationRequest}
          annotationTooltipsHidden={quizOpen && !quizResult}
          isFavorite={favorite}
          isStudied={studied}
          isAccessRegistered={accessRegistered}
          onRequestAccess={() => navigate("/license")}
          currentUser={user}
        />
      </div>
    </div>
  );
}

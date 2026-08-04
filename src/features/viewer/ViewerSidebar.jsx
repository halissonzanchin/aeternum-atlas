import { useViewer } from './ViewerContext';
import EducationalPanel from './components/EducationalPanel';

export default function ViewerSidebar() {
  const viewer = useViewer();
  const {
    leftOpen,
    setLeftOpen,
    activeStructure,
    model,
    handleViewerAction,
    annotations: {
      isSketchfabModel
    }
  } = viewer;

  return (
    <EducationalPanel
      open={leftOpen}
      structure={activeStructure}
      model={model}
      onAction={handleViewerAction}
      onClose={() => setLeftOpen(false)}
      isSketchfabMode={isSketchfabModel}
      annotationsState={viewer.annotations}
    />
  );
}

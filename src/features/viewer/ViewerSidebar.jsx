import { useViewer } from './ViewerContext';
import EducationalPanel from './components/EducationalPanel';

export default function ViewerSidebar() {
  const {
    leftOpen,
    setLeftOpen,
    activeStructure,
    model,
    handleViewerAction,
    annotations: {
      isSketchfabModel
    }
  } = useViewer();

  return (
    <EducationalPanel
      open={leftOpen}
      structure={activeStructure}
      model={model}
      onAction={handleViewerAction}
      onClose={() => setLeftOpen(false)}
      isSketchfabMode={isSketchfabModel}
    />
  );
}

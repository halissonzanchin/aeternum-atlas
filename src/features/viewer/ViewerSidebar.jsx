import { useViewer } from './ViewerContext';
import LeftInfoPanel from '../../components/LeftInfoPanel/LeftInfoPanel';

export default function ViewerSidebar() {
  const {
    leftOpen,
    setLeftOpen,
    activeStructure,
    model,
    activePart,
    handleViewerAction,
    handleSelectPart,
    annotations: {
      anatomicalStructures,
      activeAnnotationIndex,
      handleSelectAnatomicalStructure,
      isSketchfabModel
    }
  } = useViewer();

  return (
    <LeftInfoPanel
      open={leftOpen}
      structure={activeStructure}
      model={model}
      actions={[]}
      activePart={activePart}
      onAction={handleViewerAction}
      onSelectPart={handleSelectPart}
      anatomicalStructures={anatomicalStructures}
      activeAnatomicalIndex={activeAnnotationIndex}
      onSelectAnatomicalStructure={handleSelectAnatomicalStructure}
      onClose={() => setLeftOpen(false)}
      academicMode={isSketchfabModel}
    />
  );
}

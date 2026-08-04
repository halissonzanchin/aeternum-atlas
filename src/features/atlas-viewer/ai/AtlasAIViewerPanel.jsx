import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LineIcon from '../../../components/icons/LineIcon';
import AeternumGlassSurface from '../../../components/system/AeternumGlassSurface';
import { useAtlasAITutorSession } from '../../../context/AtlasAITutorSessionContext';
import { useViewer } from '../../viewer/ViewerContext';
import AtlasAIConversation from './AtlasAIConversation';
import AtlasAIOrb from './AtlasAIOrb';
import { actionDictionary, executeTutorAction } from './atlasAITutorActions';
import useDraggableTutorOrb, {
  getTutorPanelMorphStyle,
  getTutorPanelStyle
} from './useDraggableTutorOrb';
import '../../dashboard/components/AtlasAITutor.css';
import './AtlasAIViewerPanel.css';

const VIEWER_TUTOR_ORB_SIZE = 64;
const VIEWER_TOOLBAR_INSET = 24;
const VIEWER_BOTTOM_CONTROLS_INSET = 104;

export default function AtlasAIViewerPanel({ isSketchfabMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const triggerRef = useRef(null);
  
  // Study path state
  const [activeStudyPath, setActiveStudyPath] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const viewerContext = useViewer();
  const currentStructure = viewerContext.activeStructure?.name
    || viewerContext.model?.title
    || 'Modelo anatômico 3D';
  const {
    user,
    messages,
    draft,
    setDraft,
    isThinking,
    sendMessage,
    appendMessage
  } = useAtlasAITutorSession();
  const {
    position,
    viewport,
    isDragging,
    consumeDragClick,
    dragHandlers
  } = useDraggableTutorOrb({
    storageKey: 'aeternum_atlas_viewer_tutor_orb_position_v3',
    orbSize: VIEWER_TUTOR_ORB_SIZE,
    rightInset: VIEWER_TOOLBAR_INSET,
    bottomInset: VIEWER_BOTTOM_CONTROLS_INSET
  });

  const handleSendMessage = async (textOverride = null) => {
    const response = await sendMessage({
      text: textOverride ?? draft,
      context: viewerContext,
      contextLabel: currentStructure,
      role: user?.role || 'student'
    });

    if (response?.action) {
      const actionConfig = actionDictionary[response.action];
      if (actionConfig?.autoExecute) {
        executeTutorAction(response.action, response.payload, viewerContext);
      }
    }
  };

  const handleActionClick = async (actionId, payload) => {
    // Intercept Study Path Logic
    if (actionId === 'START_STUDY_PATH' || actionId === 'SHOW_STUDY_PATH') {
      const { generateStudyPaths } = await import('./atlasAIStudyPaths');
      const paths = generateStudyPaths(viewerContext.markers);
      
      if (!paths.length) {
         appendMessage({
           sender: 'ai',
           text: "Não há trilhas configuradas ou marcadores suficientes neste modelo.",
           contextLabel: currentStructure
         });
         return;
      }
      
      if (actionId === 'SHOW_STUDY_PATH') {
         // User requested to see paths
         const pathText = paths.map((p, i) => `**${i+1}. ${p.title}**\n${p.description}`).join('\n\n');
         appendMessage({
           sender: 'ai', 
           text: `Encontrei as seguintes trilhas:\n\n${pathText}`,
           action: 'START_STUDY_PATH',
           payload: paths[0].id,
           contextLabel: currentStructure
         });
         return;
      }

      // START_STUDY_PATH
      const chosenPath = paths.find(p => p.id === payload) || paths[0];
      setActiveStudyPath(chosenPath);
      setCurrentStepIndex(0);
      
      const firstStep = chosenPath.steps[0];
      
      appendMessage({
        sender: 'ai', 
        text: `Iniciando a trilha **${chosenPath.title}**.\n\nPasso 1: **${firstStep.title || firstStep.name}**\n${firstStep.description || ''}`,
        action: 'NEXT_STUDY_STEP',
        contextLabel: currentStructure
      });
      
      // Auto-focus on first step if possible
      executeTutorAction('FOCUS_MARKER', firstStep.id || `marker-${firstStep.title}`, viewerContext);
      return;
    }

    if (actionId === 'NEXT_STUDY_STEP') {
       if (!activeStudyPath) return;
       
       const nextIndex = currentStepIndex + 1;
       if (nextIndex >= activeStudyPath.steps.length) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          
          appendMessage({
            sender: 'ai', 
            text: `Parabéns! Você completou a trilha **${activeStudyPath.title}**.`,
            action: 'START_PRACTICAL_QUIZ',
            contextLabel: currentStructure
          });
          setActiveStudyPath(null);
          setCurrentStepIndex(0);
          return;
       }
       
       setCurrentStepIndex(nextIndex);
       const step = activeStudyPath.steps[nextIndex];
       
       appendMessage({
         sender: 'ai', 
         text: `Passo ${nextIndex + 1}: **${step.title || step.name}**\n${step.description || ''}`,
         action: 'NEXT_STUDY_STEP',
         contextLabel: currentStructure
       });
       
       executeTutorAction('FOCUS_MARKER', step.id || `marker-${step.title}`, viewerContext);
       return;
    }

    const success = executeTutorAction(actionId, payload, viewerContext);
    
    if (!success) {
      const errorMsg = { 
        sender: 'ai', 
        text: "Essa ação ainda não está disponível neste visualizador.",
        contextLabel: currentStructure
      };
      appendMessage(errorMsg);
    }
  };

  const quickQuestions = [
    "Explique este modelo",
    "Como devo estudar?",
    "Como usar o viewer?"
  ];

  // Determine Orb State
  let orbState = 'idle';
  if (isOpen) orbState = 'listening';
  if (isThinking) orbState = 'thinking';

  const handleOrbClick = () => {
    if (consumeDragClick()) return;
    setIsOpen((open) => !open);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen]);

  if (typeof document === 'undefined') return null;

  const panelStyle = getTutorPanelStyle(position, viewport, {
    orbSize: VIEWER_TUTOR_ORB_SIZE,
    width: 460,
    maxHeight: 760
  });
  const panelMorphStyle = getTutorPanelMorphStyle(panelStyle, position, {
    orbSize: VIEWER_TUTOR_ORB_SIZE
  });

  return createPortal(
    <>
      {showConfetti && (
        <div className="celebration-container">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className={`aeternum-confetti ${Math.random() > 0.5 ? 'gold' : ''} ${Math.random() > 0.7 ? 'blue' : ''} ${Math.random() > 0.5 ? 'circle' : ''}`}
              style={{
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `scale(${Math.random() * 0.5 + 0.5})`
              }}
            />
          ))}
        </div>
      )}

      {isOpen ? <div className="aog-focus-dimmer aog-focus-dimmer--viewer" aria-hidden="true" /> : null}

      {isOpen && (
        <AeternumGlassSurface
          as="section"
          id="atlas-viewer-ai-panel"
          className="upe-ai-panel upe-ai-panel--positioned atlas-viewer-ai-panel aog-morph-panel"
          variant="regular"
          depth="substantial"
          role="dialog"
          aria-modal="false"
          aria-labelledby="atlas-viewer-ai-title"
          style={panelMorphStyle}
        >
          <header className="upe-ai-panel__header">
            <AtlasAIOrb state={orbState} size="sm" />
            <div>
              <span className="upe-ai-panel__eyebrow">Assistência contextual</span>
              <h2 id="atlas-viewer-ai-title">Atlas AI Tutor</h2>
              <p>{isThinking ? "Analisando sua pergunta…" : "Conversa sincronizada em toda a plataforma"}</p>
            </div>
            <button
              type="button"
              className="upe-ai-panel__close"
              aria-label="Fechar Atlas AI Tutor"
              onClick={handleClose}
            >
              <LineIcon name="close" />
            </button>
          </header>

          <AtlasAIConversation
            contextLabel="Modelo em estudo"
            contextTitle={currentStructure}
            contextPrompt={isSketchfabMode
              ? "Explore, pergunte ou solicite uma sequência de revisão."
              : "Explore o modelo nativo, seus marcadores e relações anatômicas."}
            messages={messages}
            isThinking={isThinking}
            draft={draft}
            setDraft={setDraft}
            onSend={handleSendMessage}
            quickQuestions={quickQuestions}
            onAction={handleActionClick}
            resolveActionLabel={(actionId) => {
              const action = actionDictionary[actionId];
              return action && !action.autoExecute ? action.label : null;
            }}
            placeholder="Pergunte sobre este modelo anatômico…"
          />
        </AeternumGlassSurface>
      )}

      {isDragging ? (
        <div
          className="upe-ai-orb-drag-surface atlas-viewer-ai-orb-drag-surface"
          aria-hidden="true"
        />
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        className={`atlas-viewer-ai-orb-control aog-morph-source${isOpen ? " is-open" : ""}${isDragging ? " is-dragging" : ""}`}
        style={{
          top: position.y,
          left: position.x
        }}
        aria-label="Atlas AI Tutor. Clique para abrir ou arraste para reposicionar."
        aria-expanded={isOpen}
        aria-controls="atlas-viewer-ai-panel"
        title="Atlas AI Tutor"
        onClick={handleOrbClick}
        {...dragHandlers}
      >
        <AtlasAIOrb
          state={orbState}
          size="md"
        />
      </button>
    </>,
    document.body
  );
}

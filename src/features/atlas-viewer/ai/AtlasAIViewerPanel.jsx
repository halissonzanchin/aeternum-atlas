import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LineIcon from '../../../components/icons/LineIcon';
import { A26IconButton, A26Surface } from '../../../components/aeternum-26';
import { useLanguage } from '../../../context/LanguageContext';
import { useAtlasAITutorSession } from '../../../context/AtlasAITutorSessionContext';
import { useViewer } from '../../viewer/ViewerContext';
import AtlasAIConversation from './AtlasAIConversation';
import AtlasAIOrb from './AtlasAIOrb';
import NotebookLMToolModal from './NotebookLMToolModal';
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
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [panelMode, setPanelMode] = useState("compact");
  const [toolModalType, setToolModalType] = useState(null);
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
    appendMessage,
    tutorRequest,
    consumeTutorRequest
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

  useEffect(() => {
    const handleOpenTutorEvent = (e) => {
      setIsOpen(true);
      setPanelMode("expanded");
      if (e.detail?.prompt) {
        sendMessage({
          text: e.detail.prompt,
          context: {
            source: "viewer-3d",
            ...(e.detail.context || {})
          },
          contextLabel: e.detail.contextLabel || currentStructure
        });
      }
    };
    window.addEventListener("aeternum:open-tutor", handleOpenTutorEvent);
    return () => window.removeEventListener("aeternum:open-tutor", handleOpenTutorEvent);
  }, [currentStructure, sendMessage]);

  useEffect(() => {
    if (!tutorRequest) return;
    setIsOpen(true);
    setPanelMode("expanded");
    if (tutorRequest.prompt) {
      void sendMessage({
        text: tutorRequest.prompt,
        context: {
          source: "viewer-3d",
          ...(tutorRequest.context || {})
        },
        contextLabel: tutorRequest.contextLabel
      });
    }
    consumeTutorRequest(tutorRequest.id);
  }, [consumeTutorRequest, sendMessage, tutorRequest]);

  const handleSendMessage = async (textOverride = null) => {
    // Auto expand for long responses or tools
    if (panelMode === "compact" && (textOverride || draft).length > 20) {
      setPanelMode("expanded");
    }

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
    // Intercept NotebookLM Tool Modals
    if (actionId === 'GENERATE_STUDY_REPORT') {
      setToolModalType('report');
      return;
    }
    if (actionId === 'GENERATE_CUSTOM_QUIZ') {
      setToolModalType('quiz');
      return;
    }
    if (actionId === 'GENERATE_MIND_MAP') {
      setToolModalType('mindmap');
      return;
    }

    // Intercept Study Path Logic
    if (actionId === 'START_STUDY_PATH' || actionId === 'SHOW_STUDY_PATH') {
      setPanelMode("expanded");
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

  const handleOrbClick = (e) => {
    e?.stopPropagation?.();
    if (consumeDragClick()) return;
    setIsOpen((open) => !open);
  };

  const handleClose = useCallback((triggerSource = "pointer") => {
    setIsOpen(false);
    if (triggerSource === "keyboard") {
      window.requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
    } else {
      triggerRef.current?.blur?.();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      handleClose("keyboard");
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen]);

  if (typeof document === 'undefined') return null;

  const panelStyle = getTutorPanelStyle(position, viewport, {
    orbSize: VIEWER_TUTOR_ORB_SIZE,
    width: 460,
    maxHeight: 760,
    panelMode
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

      {isOpen ? <div className="aog-focus-dimmer aog-focus-dimmer--viewer" aria-hidden="true" onClick={handleClose} /> : null}

      {isOpen && (
        <A26Surface
          as="section"
          id="atlas-viewer-ai-panel"
          className={`upe-ai-panel upe-ai-panel--positioned atlas-viewer-ai-panel aog-morph-panel ${panelMode === "expanded" ? "is-expanded" : ""}`}
          material="substantial"
          tone="teal"
          role="dialog"
          aria-modal="false"
          aria-labelledby="atlas-viewer-ai-title"
          style={panelMorphStyle}
        >
          <header className="upe-ai-panel__header">
            <AtlasAIOrb state={orbState} size="sm" />
            <div>
              <span className="upe-ai-panel__eyebrow">{t("tutor.contextualAssistance", { defaultValue: "Assistência contextual" })}</span>
              <h2 id="atlas-viewer-ai-title">{t("tutor.title", { defaultValue: "Atlas AI Tutor" })}</h2>
              <p>{isThinking ? t("tutor.analyzingQuestion", { defaultValue: "Analisando sua pergunta…" }) : t("tutor.synchronizedConversation", { defaultValue: "Conversa sincronizada em toda a plataforma" })}</p>
            </div>
            <div className="flex items-center gap-1">
              <A26IconButton
                className="upe-ai-panel__close text-textMuted hover:text-amber-300 transition-colors"
                label={panelMode === "expanded" ? t("tutor.compactMode", { defaultValue: "Modo compacto" }) : t("tutor.expandedMode", { defaultValue: "Modo expandido" })}
                icon={panelMode === "expanded" ? "minimize" : "maximize"}
                onClick={() => setPanelMode((prev) => (prev === "expanded" ? "compact" : "expanded"))}
              />
              <A26IconButton
                className="upe-ai-panel__close"
                label={t("tutor.close", { defaultValue: "Fechar Atlas AI Tutor" })}
                icon="close"
                onClick={handleClose}
              />
            </div>
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
        </A26Surface>
      )}

      {toolModalType && (
        <NotebookLMToolModal
          toolType={toolModalType}
          currentStructure={currentStructure}
          onClose={() => setToolModalType(null)}
          onGenerate={(prompt) => {
            setToolModalType(null);
            setPanelMode("expanded");
            handleSendMessage(prompt);
          }}
        />
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

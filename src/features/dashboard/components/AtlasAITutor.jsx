import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { A26IconButton, A26Surface } from "../../../components/aeternum-26";
import { useLanguage } from "../../../context/LanguageContext";
import { useAtlasAITutorSession } from "../../../context/AtlasAITutorSessionContext";
import AtlasAIConversation from "../../atlas-viewer/ai/AtlasAIConversation";
import AtlasAIOrb from "../../atlas-viewer/ai/AtlasAIOrb";
import NotebookLMToolModal from "../../atlas-viewer/ai/NotebookLMToolModal";
import useDraggableTutorOrb, {
  getTutorPanelMorphStyle,
  getTutorPanelStyle
} from "../../atlas-viewer/ai/useDraggableTutorOrb";
import { getAtlasTutorContext } from "./atlasAITutorContext";
import "./AtlasAITutor.css";

export default function AtlasAITutor({
  path = "/student/home",
  sphereOnly = false,
  draggable = false
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [panelMode, setPanelMode] = useState("compact");
  const [toolModalType, setToolModalType] = useState(null);
  const triggerRef = useRef(null);
  const context = useMemo(() => getAtlasTutorContext(path), [path]);
  const {
    messages,
    draft,
    setDraft,
    isThinking,
    sendMessage,
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
    enabled: draggable,
    storageKey: "aeternum_atlas_native_tutor_orb_position",
    bottomInset: draggable && typeof window !== "undefined" && window.innerWidth <= 1023 ? 92 : 0
  });

  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  useEffect(() => {
    const handleOpenTutorEvent = (e) => {
      setIsOpen(true);
      setPanelMode("expanded");
      if (e.detail?.prompt) {
        sendMessage({
          text: e.detail.prompt,
          context: {
            source: "flashcards",
            route: path,
            ...(e.detail.context || {})
          },
          contextLabel: e.detail.contextLabel || "Flashcards anatômicos"
        });
      }
    };
    window.addEventListener("aeternum:open-tutor", handleOpenTutorEvent);
    return () => window.removeEventListener("aeternum:open-tutor", handleOpenTutorEvent);
  }, [path, sendMessage]);

  useEffect(() => {
    if (!tutorRequest) return;
    setIsOpen(true);
    setPanelMode("expanded");
    if (tutorRequest.prompt) {
      void sendMessage({
        text: tutorRequest.prompt,
        context: {
          source: "platform",
          route: path,
          ...(tutorRequest.context || {})
        },
        contextLabel: tutorRequest.contextLabel
      });
    }
    consumeTutorRequest(tutorRequest.id);
  }, [consumeTutorRequest, path, sendMessage, tutorRequest]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  const triggerStyle = draggable ? {
    top: position.y,
    left: position.x,
    right: "auto",
    bottom: "auto"
  } : undefined;
  const panelBaseStyle = draggable
    ? getTutorPanelStyle(position, viewport, { panelMode })
    : {
        "--aog-morph-x": "168px",
        "--aog-morph-y": "280px"
      };
  const panelStyle = draggable
    ? getTutorPanelMorphStyle(panelBaseStyle, position)
    : panelBaseStyle;
  const orbState = isThinking ? "thinking" : isOpen ? "listening" : "idle";

  const handleTriggerClick = () => {
    if (consumeDragClick()) return;
    setIsOpen((open) => !open);
  };

  const handleClose = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  };

  const handleSendMessage = (text) => {
    if (panelMode === "compact" && text.length > 20) {
      setPanelMode("expanded");
    }
    return sendMessage({
      text,
      context: {
        source: "platform",
        route: path,
        routeContext: context
      },
      contextLabel: context.structure
    });
  };

  const handleActionClick = (actionId) => {
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
  };

  return createPortal(
    <>
      {isOpen ? <div className="aog-focus-dimmer" aria-hidden="true" /> : null}

      {isOpen && (
        <A26Surface
          as="section"
          id="upe-ai-panel"
          className={`upe-ai-panel aog-morph-panel${draggable ? " upe-ai-panel--positioned" : ""} ${panelMode === "expanded" ? "is-expanded" : ""}`}
          material="substantial"
          tone="teal"
          role="dialog"
          aria-modal="false"
          aria-labelledby="upe-ai-title"
          style={panelStyle}
        >
          <header className="upe-ai-panel__header">
            <AtlasAIOrb state={orbState} size="sm" />
            <div>
              <span className="upe-ai-panel__eyebrow">{t("tutor.contextualAssistance", { defaultValue: "Assistência contextual" })}</span>
              <h2 id="upe-ai-title">{t("tutor.title", { defaultValue: "Atlas AI Tutor" })}</h2>
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
            contextLabel={t("tutor.currentContext", { defaultValue: "Contexto atual" })}
            contextTitle={context.structure}
            contextPrompt={context.question}
            messages={messages}
            isThinking={isThinking}
            draft={draft}
            setDraft={setDraft}
            onSend={handleSendMessage}
            quickQuestions={context.quickActions}
            onAction={handleActionClick}
          />
        </A26Surface>
      )}

      {toolModalType && (
        <NotebookLMToolModal
          toolType={toolModalType}
          currentStructure={context.structure || "Plataforma Aeternum Atlas"}
          onClose={() => setToolModalType(null)}
          onGenerate={(prompt) => {
            setToolModalType(null);
            setPanelMode("expanded");
            handleSendMessage(prompt);
          }}
        />
      )}

      {isDragging ? <div className="upe-ai-orb-drag-surface" aria-hidden="true" /> : null}

      <A26Surface
        ref={triggerRef}
        as="button"
        type="button"
        material={sphereOnly ? "clear" : "regular"}
        tone="teal"
        interactive
        className={[
          "upe-ai-trigger",
          isOpen ? "is-open" : "",
          "aog-morph-source",
          sphereOnly ? "is-orb-only" : "",
          draggable ? "is-draggable" : "",
          isDragging ? "is-dragging" : ""
        ].filter(Boolean).join(" ")}
        aria-label={sphereOnly ? `${t("tutor.title", { defaultValue: "Atlas AI Tutor" })}. ${t("tutor.tagline", { defaultValue: "Tutor anatômico" })}` : undefined}
        aria-expanded={isOpen}
        aria-controls="upe-ai-panel"
        style={triggerStyle}
        onClick={handleTriggerClick}
        {...dragHandlers}
      >
        <AtlasAIOrb state={orbState} size={sphereOnly ? "lg" : "md"} />
        {!sphereOnly && (
          <span>
            <strong>Atlas AI</strong>
            <small>{isThinking ? t("tutor.stateAnalyzing", { defaultValue: "Analisando" }) : isOpen ? t("tutor.stateListening", { defaultValue: "Ouvindo" }) : t("tutor.stateAnatomicalTutor", { defaultValue: "Tutor anatômico" })}</small>
          </span>
        )}
      </A26Surface>
    </>,
    document.body
  );
}

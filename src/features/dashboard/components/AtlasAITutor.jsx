import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LineIcon from "../../../components/icons/LineIcon";
import AeternumGlassSurface from "../../../components/system/AeternumGlassSurface";
import { useAtlasAITutorSession } from "../../../context/AtlasAITutorSessionContext";
import AtlasAIConversation from "../../atlas-viewer/ai/AtlasAIConversation";
import AtlasAIOrb from "../../atlas-viewer/ai/AtlasAIOrb";
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
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const context = useMemo(() => getAtlasTutorContext(path), [path]);
  const {
    messages,
    draft,
    setDraft,
    isThinking,
    sendMessage
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
    // A posição inicial respeita a tab bar compacta. Depois do primeiro gesto,
    // o hook continua permitindo toda a viewport, como definido pelo usuário.
    bottomInset: draggable && typeof window !== "undefined" && window.innerWidth <= 1023 ? 92 : 0
  });

  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
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
    ? getTutorPanelStyle(position, viewport)
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
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleSendMessage = (text) => sendMessage({
    text,
    context: {
      source: "platform",
      route: path,
      routeContext: context
    },
    contextLabel: context.structure
  });

  return createPortal(
    <>
      {isOpen ? <div className="aog-focus-dimmer" aria-hidden="true" /> : null}

      {isOpen && (
        <AeternumGlassSurface
          as="section"
          id="upe-ai-panel"
          className={`upe-ai-panel aog-morph-panel${draggable ? " upe-ai-panel--positioned" : ""}`}
          variant="regular"
          depth="substantial"
          role="dialog"
          aria-modal="false"
          aria-labelledby="upe-ai-title"
          style={panelStyle}
        >
          <header className="upe-ai-panel__header">
            <AtlasAIOrb state={orbState} size="sm" />
            <div>
              <span className="upe-ai-panel__eyebrow">Assistência contextual</span>
              <h2 id="upe-ai-title">Atlas AI Tutor</h2>
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
            contextLabel="Contexto atual"
            contextTitle={context.structure}
            contextPrompt={context.question}
            messages={messages}
            isThinking={isThinking}
            draft={draft}
            setDraft={setDraft}
            onSend={handleSendMessage}
            quickQuestions={context.quickActions}
          />
        </AeternumGlassSurface>
      )}

      {isDragging ? <div className="upe-ai-orb-drag-surface" aria-hidden="true" /> : null}

      <AeternumGlassSurface
        ref={triggerRef}
        as="button"
        type="button"
        variant={sphereOnly ? "clear" : "regular"}
        depth="standard"
        interactive
        className={[
          "upe-ai-trigger",
          isOpen ? "is-open" : "",
          "aog-morph-source",
          sphereOnly ? "is-orb-only" : "",
          draggable ? "is-draggable" : "",
          isDragging ? "is-dragging" : ""
        ].filter(Boolean).join(" ")}
        aria-label={sphereOnly ? "Abrir Atlas AI Tutor. Arraste para reposicionar." : undefined}
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
            <small>{isThinking ? "Analisando" : isOpen ? "Ouvindo" : "Tutor anatômico"}</small>
          </span>
        )}
      </AeternumGlassSurface>
    </>,
    document.body
  );
}

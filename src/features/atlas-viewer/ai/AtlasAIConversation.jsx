import React, { useEffect, useRef, useState } from "react";
import LineIcon from "../../../components/icons/LineIcon";
import "./AtlasAIViewerPanel.css";
import "./AtlasAIConversation.css";

function MessageText({ text }) {
  const lines = String(text || "").split("\n");

  return lines.map((line, lineIndex) => {
    const fragments = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={`${lineIndex}-${line}`}>
        {fragments.map((fragment, fragmentIndex) => (
          fragment.startsWith("**") && fragment.endsWith("**")
            ? <strong key={`${fragmentIndex}-${fragment}`}>{fragment.slice(2, -2)}</strong>
            : <React.Fragment key={`${fragmentIndex}-${fragment}`}>{fragment}</React.Fragment>
        ))}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
}

export default function AtlasAIConversation({
  contextLabel = "Contexto atual",
  contextTitle,
  contextPrompt,
  messages,
  isThinking,
  draft,
  setDraft,
  onSend,
  quickQuestions = [],
  onAction,
  resolveActionLabel,
  placeholder = "Pergunte sobre anatomia, revisão ou desempenho…"
}) {
  const [inputError, setInputError] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isThinking, messages]);

  const handleSend = (textOverride) => {
    const text = String(textOverride ?? draft).trim();
    if (!text) {
      setInputError(true);
      window.setTimeout(() => setInputError(false), 400);
      return;
    }
    onSend(text);
  };

  return (
    <>
      <div className="upe-ai-panel__body atlas-ai-conversation__body">
        <div className="upe-ai-context atlas-viewer-ai-context">
          <span>{contextLabel}</span>
          <strong>{contextTitle}</strong>
          <p>{contextPrompt}</p>
        </div>

        <div className="atlas-viewer-ai-messages" aria-live="polite">
          {messages.map((message) => {
            if (!message.text && message.isStreaming) return null;
            const actionLabel = message.action && resolveActionLabel
              ? resolveActionLabel(message.action)
              : null;

            return (
              <div
                key={message.id}
                className={`atlas-viewer-ai-message-row is-${message.sender}`}
              >
                {message.contextLabel ? (
                  <span className="atlas-ai-message-context">{message.contextLabel}</span>
                ) : null}
                <div className={`atlas-viewer-ai-message is-${message.sender}`}>
                  <MessageText text={message.text} />
                </div>

                {actionLabel && onAction ? (
                  <button
                    type="button"
                    onClick={() => onAction(message.action, message.payload)}
                    className="atlas-viewer-ai-action invitation-to-act"
                  >
                    <LineIcon name="play" />
                    {actionLabel}
                  </button>
                ) : null}
              </div>
            );
          })}

          {isThinking && (
            <div className="atlas-viewer-ai-message-row is-ai">
              <div className="atlas-viewer-ai-thinking" aria-label="Atlas AI está analisando">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="upe-ai-panel__footer">
        {!isThinking && quickQuestions.length ? (
          <div className="upe-ai-quick-actions" aria-label="Sugestões do Atlas AI">
            {quickQuestions.map((question) => (
              <button
                type="button"
                key={question}
                onClick={() => handleSend(question)}
              >
                {question}
              </button>
            ))}
          </div>
        ) : null}

        <label className={`upe-ai-composer${inputError ? " has-error" : ""}`}>
          <span className="sr-only">Pergunte ao Atlas AI Tutor</span>
          <textarea
            rows={1}
            placeholder={placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!draft.trim() || isThinking}
            aria-label="Enviar pergunta"
          >
            <LineIcon name="send" />
          </button>
        </label>
      </footer>
    </>
  );
}

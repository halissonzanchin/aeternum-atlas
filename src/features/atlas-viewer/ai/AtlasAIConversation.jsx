import React, { useEffect, useRef, useState } from "react";
import LineIcon from "../../../components/icons/LineIcon";
import { RichContentParser } from "./NotebookLMRenderers";
import "./AtlasAIViewerPanel.css";
import "./AtlasAIConversation.css";

function MessageText({ text }) {
  const richRender = RichContentParser({ text });
  if (richRender) return richRender;

  const lines = String(text || "").split("\n");

  return lines.map((line, lineIndex) => {
    const fragments = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return (
      <React.Fragment key={`${lineIndex}-${line}`}>
        {fragments.map((fragment, fragmentIndex) => {
          const key = `${fragmentIndex}-${fragment}`;
          if (fragment.startsWith("**") && fragment.endsWith("**")) {
            return <strong key={key}>{fragment.slice(2, -2)}</strong>;
          }
          if (fragment.startsWith("*") && fragment.endsWith("*")) {
            return <em key={key}>{fragment.slice(1, -1)}</em>;
          }
          return <React.Fragment key={key}>{fragment}</React.Fragment>;
        })}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
}

export default function AtlasAIConversation({
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

  const latestAIMessageId = [...messages]
    .reverse()
    .find((message) => message.sender === "ai" && message.text)
    ?.id;
  const interactionState = isThinking
    ? "is-thinking"
    : draft.trim()
      ? "has-draft"
      : "is-listening";

  return (
    <>
      <div className="upe-ai-panel__body atlas-ai-conversation__body">
        <div className="atlas-viewer-ai-messages" aria-live="polite">
          {messages.map((message) => {
            if (!message.text && message.isStreaming) return null;
            const actionLabel = message.action && resolveActionLabel
              ? resolveActionLabel(message.action)
              : null;

            return (
              <div
                key={message.id}
                className={[
                  "atlas-viewer-ai-message-row",
                  `is-${message.sender}`,
                  message.id === latestAIMessageId ? "is-featured-ai" : "",
                  message.sender === "ai" && message.id !== latestAIMessageId ? "is-history" : ""
                ].filter(Boolean).join(" ")}
              >
                {message.contextLabel ? (
                  <span className="atlas-ai-message-context">{message.contextLabel}</span>
                ) : null}
                <div
                  className={[
                    "atlas-viewer-ai-message",
                    `is-${message.sender}`,
                    message.id === latestAIMessageId ? "is-featured" : ""
                  ].filter(Boolean).join(" ")}
                >
                  {message.id === latestAIMessageId ? (
                    <div className="atlas-ai-featured-response__meta">
                      <span>
                        <i aria-hidden="true" />
                        Resposta do Atlas
                      </span>
                      <small>Contexto sincronizado</small>
                    </div>
                  ) : null}
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

      <footer className={`upe-ai-panel__footer atlas-ai-live-dock ${interactionState}`}>
        <div className="atlas-ai-live-dock__glass" aria-hidden="true">
          <span className="atlas-ai-live-dock__caustic" />
          <span className="atlas-ai-live-dock__filament filament-a" />
          <span className="atlas-ai-live-dock__filament filament-b" />
          <span className="atlas-ai-live-dock__filament filament-c" />
          <span className="atlas-ai-live-dock__filament filament-d" />
          <span className="atlas-ai-live-dock__intersection" />
        </div>

        <div className="atlas-ai-live-dock__content">
          {!isThinking ? (
            <div className="upe-ai-quick-actions flex-wrap gap-1" aria-label="Ferramentas NotebookLM & Sugestões">
              <button type="button" onClick={() => onAction ? onAction('GENERATE_MIND_MAP') : handleSend("Gere um mapa mental hierárquico sobre este modelo anatômico")}>
                🌳 Mapa mental
              </button>
              <button type="button" onClick={() => onAction ? onAction('GENERATE_STUDY_REPORT') : handleSend("Crie um relatório de resumo e guia de estudos sobre este modelo")}>
                📝 Relatório
              </button>
              <button type="button" onClick={() => onAction ? onAction('GENERATE_CUSTOM_QUIZ') : handleSend("Crie um teste personalizado de 5 perguntas com gabarito sobre este modelo")}>
                🧪 Teste
              </button>
              <button type="button" onClick={() => onAction ? onAction('GENERATE_FLASHCARDS') : handleSend("Gere 3 cartões didáticos (flashcards) com Frente e Verso para estudo ativo")}>
                🎴 Flashcards
              </button>
              <button type="button" onClick={() => handleSend("Construa uma tabela anatômica detalhada de Origem, Inserção, Inervação e Ação sobre este modelo")}>
                📊 Tabela
              </button>
              <button type="button" onClick={() => handleSend("Gere um roteiro curto de resumo em áudio e narração didática sobre este modelo")}>
                🎙️ Áudio
              </button>
            </div>
          ) : isThinking ? (
            <div className="atlas-ai-live-dock__status" aria-live="polite">
              <span aria-hidden="true" />
              O Atlas está processando sua solicitação…
            </div>
          ) : null}

          <label className={`upe-ai-composer${inputError ? " has-error" : ""}`}>
            <span className="sr-only">Pergunte ao Atlas AI Tutor</span>
            <span className="atlas-ai-composer__signal" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
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
        </div>
      </footer>
    </>
  );
}

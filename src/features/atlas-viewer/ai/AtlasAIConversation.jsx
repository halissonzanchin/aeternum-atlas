import React, { useEffect, useRef, useState } from "react";
import LineIcon from "../../../components/icons/LineIcon";
import { RichContentParser } from "./NotebookLMRenderers";
import "./AtlasAIViewerPanel.css";
import "./AtlasAIConversation.css";

function formatInlineText(line) {
  const fragments = String(line || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return fragments.map((fragment, fragmentIndex) => {
    const key = `${fragmentIndex}-${fragment}`;
    if (fragment.startsWith("**") && fragment.endsWith("**")) {
      return <strong key={key} className="text-amber-300 font-semibold">{fragment.slice(2, -2)}</strong>;
    }
    if (fragment.startsWith("*") && fragment.endsWith("*")) {
      return <em key={key} className="text-amber-200/90 italic">{fragment.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{fragment}</React.Fragment>;
  });
}

function normalizeTextSpacing(rawText) {
  let str = String(rawText || "");
  
  // 1. Remove apenas preenchimentos conversacionais; fatos e citações nunca são
  // substituídos no cliente, pois pertencem à resposta auditável do servidor.
  str = str.replace(/^(Excelente!|Compreendo|Certo|Okay|Com certeza!|Entendo perfeitamente[^.!]*[.!]?)[^.!]*[.!]?\s*/gi, "");

  // 2. Clean raw code markdown artifacts (---, ###, ####, **\n1.\n, dangling asterisks)
  str = str.replace(/---/g, "\n\n");
  str = str.replace(/#{2,4}\s*/g, "");
  str = str.replace(/\*\*\s*\n?([0-9]+\.)\s*\n?/g, "$1 ");
  str = str.replace(/\*/g, ""); // Remove stray developer code asterisks

  // 3. Insert double newlines before standalone section labels (a. b. c. d. - REQUIRES SPACE BEFORE, NEVER INSIDE WORDS!)
  str = str.replace(/(^|\n|\s)([a-d]\.\s+)/g, "$1\n\n$2");

  // 4. Insert double newlines before section headers and questions
  str = str.replace(
    /([^\n])\s*(\bResumo Direto:|\bLocalização:|\bConexões:|\bFunções Principais:|\bFunções:|\bDestaque:|\bDestaque Clínico:|\bDetalhe Clínico:|\bCuriosidade:|\bExtremidades:|\bCorpo:|\bSíntese Funcional:|\bSuporte:|\bTransmissão de Forças:|\bProteção:)/gi,
    "$1\n\n$2"
  );

  // 5. Insert newline before numbered list items (1. 2. 3.)
  str = str.replace(/([^\n])\s*([1-9]\.\s+)/g, "$1\n$2");

  return str.trim();
}

function MessageText({ text }) {
  const richRender = RichContentParser({ text });
  if (richRender) return richRender;

  const normalized = normalizeTextSpacing(text);
  const rawLines = normalized.split("\n");
  const blocks = [];
  let currentClinicalBlock = null;

  rawLines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentClinicalBlock) {
        blocks.push(currentClinicalBlock);
        currentClinicalBlock = null;
      }
      return;
    }

    if (/^Destaque Clínico:|^Detalhe Clínico:|^\*\*Destaque Clínico|^\*\*Detalhe Clínico/i.test(trimmed) || /^🩺/i.test(trimmed)) {
      if (currentClinicalBlock) blocks.push(currentClinicalBlock);
      currentClinicalBlock = {
        type: "clinical",
        content: [trimmed]
      };
      return;
    }

    if (currentClinicalBlock) {
      currentClinicalBlock.content.push(trimmed);
      return;
    }

    if (trimmed.endsWith("?") || /^[a-d]\.\s+/.test(trimmed)) {
      blocks.push({
        type: "subHeader",
        text: trimmed
      });
      return;
    }

    if (trimmed.startsWith("###") || trimmed.startsWith("####") || trimmed.startsWith("##")) {
      const level = trimmed.startsWith("####") ? 4 : trimmed.startsWith("###") ? 3 : 2;
      const cleanHeading = trimmed.replace(/^#{2,4}\s*/, "").replace(/---/g, "").trim();
      blocks.push({
        type: "heading",
        level,
        text: cleanHeading
      });
      return;
    }

    if (trimmed === "---" || trimmed === "___" || trimmed === "***") {
      blocks.push({ type: "divider" });
      return;
    }

    const isNumbered = /^[0-9A-Za-z]+\.\s+/.test(trimmed) || /^[A-Z]\)\s+/.test(trimmed);
    const isBullet = /^[•\-*]\s+/.test(trimmed);

    if (isNumbered || isBullet) {
      const match = trimmed.match(/^([0-9A-Za-z]+\.|[A-Z]\)|[•\-*])\s+(.*)/);
      blocks.push({
        type: "listItem",
        badge: match ? match[1] : "•",
        text: match ? match[2] : trimmed
      });
      return;
    }

    blocks.push({ type: "paragraph", text: trimmed });
  });

  if (currentClinicalBlock) {
    blocks.push(currentClinicalBlock);
  }

  return (
    <div className="atlas-ai-formatted-response flex flex-col gap-2 text-xs leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === "subHeader") {
          return (
            <h4 key={idx} className="atlas-ai-abnt-subheader font-bold text-amber-300 text-xs mt-2.5 mb-1 block tracking-wide">
              {formatInlineText(block.text)}
            </h4>
          );
        }

        if (block.type === "heading") {
          return (
            <h3 key={idx} className="atlas-ai-response-h3 text-agedGold font-bold text-sm mt-3 mb-1 border-b border-glassBorder/30 pb-1 flex items-center gap-1.5">
              <span>📌</span>
              <span>{formatInlineText(block.text)}</span>
            </h3>
          );
        }

        if (block.type === "divider") {
          return <hr key={idx} className="atlas-ai-response-divider my-2 border-t border-glassBorder/40" />;
        }

        if (block.type === "clinical") {
          return (
            <div key={idx} className="atlas-ai-clinical-card my-2 p-3 bg-amber-500/10 border border-amber-400/40 rounded-xl text-amber-100 shadow-lg">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                <span>🩺</span>
                <span>Destaque Clínico</span>
              </div>
              <div className="text-xs text-amber-100/90 leading-normal">
                {block.content.map((cLine, cIdx) => (
                  <p key={cIdx} className="mb-1 last:mb-0">
                    {formatInlineText(cLine.replace(/^Destaque Clínico:\s*/i, "").replace(/^🩺\s*/i, ""))}
                  </p>
                ))}
              </div>
            </div>
          );
        }

        if (block.type === "listItem") {
          return (
            <div key={idx} className="atlas-ai-list-item flex items-start gap-2 pl-1 py-0.5">
              <span className="atlas-ai-badge px-1.5 py-0.5 rounded bg-surfaceDark border border-glassBorder/50 text-amber-300 font-mono font-semibold text-[10px] shrink-0 mt-0.5">
                {block.badge}
              </span>
              <div className="text-clinicalWhite/90">
                {formatInlineText(block.text)}
              </div>
            </div>
          );
        }

        if (block.type === "paragraph" && /^📚?\s*Fonte\s*(Acadêmica)?:/i.test(block.text)) {
          return (
            <div key={idx} className="atlas-ai-source-card my-2 p-2.5 bg-teal-950/40 border border-teal-500/40 rounded-xl backdrop-blur-md text-teal-200 text-[11px] flex items-center gap-2 shadow-md">
              <span className="text-base shrink-0">📚</span>
              <div>
                <strong className="text-teal-300 font-bold block mb-0.5">Fonte Acadêmica de Referência:</strong>
                <span>{formatInlineText(block.text.replace(/^📚?\s*Fonte\s*(Acadêmica)?:\s*/i, ""))}</span>
              </div>
            </div>
          );
        }

        return (
          <p key={idx} className="atlas-ai-paragraph text-clinicalWhite/90 my-0.5">
            {formatInlineText(block.text)}
          </p>
        );
      })}
    </div>
  );
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
                      <small>Resposta contextual</small>
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
          {isThinking ? (
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

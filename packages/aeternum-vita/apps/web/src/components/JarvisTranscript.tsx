import React, { useEffect, useRef } from "react";

type ChatMessage = {
  id: string;
  speaker: "user" | "agent";
  text: string;
  timestamp: string | number | Date;
};

interface JarvisTranscriptProps {
  messages: ChatMessage[];
  tutorName: string;
  isStreaming?: boolean;
}

export const JarvisTranscript: React.FC<JarvisTranscriptProps> = ({
  messages,
  tutorName,
  isStreaming = false,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="jarvis-transcript-feed">
      {messages.length === 0 ? (
        <div
          style={{
            color: "var(--jarvis-text-muted)",
            fontSize: "0.85rem",
            textAlign: "center",
            padding: "2rem 1rem",
          }}
        >
          &gt; NENHUM DADO DE ÁUDIO CAPTURADO AINDA.
          <br />
          &gt; INICIE A CONVERSA PARA REGISTRAR A TRANSCRIÇÃO TÁTICA EM TEMPO
          REAL.
        </div>
      ) : (
        messages.map((msg) => {
          const isUser = msg.speaker === "user";
          return (
            <div
              key={msg.id}
              className={`jarvis-bubble ${isUser ? "jarvis-bubble-user" : "jarvis-bubble-agent"}`}
            >
              <div className="jarvis-bubble-speaker">
                <span>
                  {isUser
                    ? "HALISSON // OPERADOR"
                    : `J.A.R.V.I.S. // ${tutorName.toUpperCase()}`}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--jarvis-text-muted)",
                    marginLeft: "auto",
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
              <div>{msg.text}</div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};

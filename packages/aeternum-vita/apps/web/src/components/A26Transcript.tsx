import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../transcript.ts';
import { useStableTranscript } from '../useStableTranscript.ts';
import './A26Transcript.css';

export type { TranscriptEntry } from '../transcript.ts';

type A26TranscriptProps = {
  entries: TranscriptEntry[];
};

export const A26Transcript = ({ entries }: A26TranscriptProps) => {
  const scrollReference = useRef<HTMLDivElement>(null);
  const displayedEntries = useStableTranscript(entries);

  useEffect(() => {
    const transcriptScroll = scrollReference.current;
    if (transcriptScroll) {
      transcriptScroll.scrollTop = transcriptScroll.scrollHeight;
    }
  }, [displayedEntries]);

  return (
    <section className="a26-surface a26-transcript-panel" aria-label="Transcrição da conversa">
      <div className="a26-transcript-header">
        <div>
          <span className="a26-eyebrow">Ao Vivo · Streaming</span>
          <h2>Transcrição em Tempo Real</h2>
        </div>
        {displayedEntries.length > 0 && (
          <span className="a26-message-badge">{displayedEntries.length}</span>
        )}
      </div>

      <div
        ref={scrollReference}
        className="a26-transcript-scroll"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {displayedEntries.length === 0 ? (
          <div className="a26-transcript-empty">
            <span className="empty-icon-lens">Aa</span>
            <p>As falas em tempo real do usuário e do assistente Aeternum aparecerão aqui.</p>
          </div>
        ) : (
          displayedEntries.map((entry) => (
            <article
              className={`a26-bubble-message message-${entry.speaker}`}
              key={entry.id}
            >
              <span className="bubble-speaker-label">
                {entry.speaker === 'user' ? 'Você' : 'Assistente Aeternum'}
              </span>
              <p>{entry.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

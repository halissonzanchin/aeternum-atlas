import { type AgentState, type UseAgentReturn } from '@livekit/components-react';
import type { ButtonHTMLAttributes } from 'react';
import { A26VoiceOrb } from './A26VoiceOrb.tsx';
import { ActiveActions, StartAction } from './A26VoiceControls.tsx';
import './A26VoiceConsole.css';

type A26VoiceConsoleProps = {
  agentState: AgentState;
  microphoneTrack: UseAgentReturn['microphoneTrack'];
  statusLabel: string;
  errorMessage: string | null;
  isActive: boolean;
  isStarting: boolean;
  isEnding: boolean;
  microphoneEnabled: boolean;
  microphoneButtonProps: ButtonHTMLAttributes<HTMLButtonElement>;
  onStart: () => void;
  onEnd: () => void;
};

export const A26VoiceConsole = ({
  agentState,
  microphoneTrack,
  statusLabel,
  errorMessage,
  isActive,
  isStarting,
  isEnding,
  microphoneEnabled,
  microphoneButtonProps,
  onStart,
  onEnd,
}: A26VoiceConsoleProps) => {
  return (
    <section className="a26-surface a26-voice-console" aria-labelledby="voice-console-title">
      <div className="console-header">
        <span className="a26-eyebrow">Aeternum Vita · Realtime AI</span>
        <h1 id="voice-console-title">Agente de Voz em Tempo Real</h1>
        <p>
          Converse com inteligência médica e educacional em português do Brasil com latência ultra-baixa via WebRTC.
        </p>
      </div>

      <A26VoiceOrb agentState={agentState} microphoneTrack={microphoneTrack} />

      <div className="console-status-badge" aria-live="polite" aria-atomic="true">
        <span className={`status-dot state-${agentState}`} />
        <span>{statusLabel}</span>
      </div>

      {errorMessage && (
        <div className="a26-error-card" role="alert">
          <strong>Aviso do Sistema</strong>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="console-controls">
        {isActive ? (
          <ActiveActions
            microphoneEnabled={microphoneEnabled}
            microphoneButtonProps={microphoneButtonProps}
            isEnding={isEnding}
            onEnd={onEnd}
          />
        ) : (
          <StartAction disabled={isStarting} isStarting={isStarting} onStart={onStart} />
        )}
        <span className="privacy-badge">
          🛡️ Transmissão de áudio segura e criptografada ponto a ponto via WebRTC.
        </span>
      </div>
    </section>
  );
};

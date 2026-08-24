import {
  RoomAudioRenderer,
  useAgent,
  useRoomContext,
  useSessionContext,
  useSessionMessages,
  useTrackToggle,
} from '@livekit/components-react';
import { MoonIcon, SparkleIcon, SunIcon } from '@phosphor-icons/react';
import { Track } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { A26HowItWorks } from './components/A26HowItWorks.tsx';
import { A26Transcript } from './components/A26Transcript.tsx';
import { A26TutorSelector, type TutorId, TUTOR_LIST } from './components/A26TutorSelector.tsx';
import { A26VoiceConsole } from './components/A26VoiceConsole.tsx';
import { AudioPlaybackError, getAgentStatusLabel, getSessionErrorMessage } from './status.ts';
import type { TranscriptEntry } from './transcript.ts';

const SESSION_START_TIMEOUT_MILLISECONDS = 25_000;
const WORKER_UNAVAILABLE_MESSAGE =
  'O assistente Aeternum Vita não conseguiu entrar ou permanecer na sala. Confirme se o worker está ativo.';

interface VoiceConsoleProps {
  selectedTutor: TutorId;
  onSelectTutor: (id: TutorId) => void;
}

export const VoiceConsole = ({ selectedTutor, onSelectTutor }: VoiceConsoleProps) => {
  const session = useSessionContext();
  const room = useRoomContext();
  const agent = useAgent();
  const { messages } = useSessionMessages(session);
  const microphone = useTrackToggle({ source: Track.Source.Microphone });
  const [hasStarted, setHasStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);
  const startAbortControllerReference = useRef<AbortController | null>(null);
  const startAbortReasonReference = useRef<'agent-failed' | 'timeout' | null>(null);

  const currentTutor = useMemo(
    () => TUTOR_LIST.find((t) => t.id === selectedTutor) || TUTOR_LIST[0],
    [selectedTutor],
  );

  const statusLabel = getAgentStatusLabel(agent.state, hasStarted);
  const isActive = hasStarted && !agent.isFinished;
  const failureMessage = agent.state === 'failed' ? WORKER_UNAVAILABLE_MESSAGE : null;
  const displayedError = localError ?? failureMessage;
  const localIdentity = room.localParticipant.identity;

  const transcriptEntries = useMemo<TranscriptEntry[]>(
    () =>
      messages.map((message) => ({
        id: message.id,
        speaker: message.from?.identity === localIdentity ? 'user' : 'agent',
        text: message.message,
      })),
    [localIdentity, messages],
  );

  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    document.documentElement.classList.toggle('a26-theme-light', nextMode);
    document.documentElement.classList.toggle('a26-theme-dark', !nextMode);
  };

  useEffect(() => {
    if (agent.state !== 'failed' || !startAbortControllerReference.current) {
      return;
    }

    startAbortReasonReference.current = 'agent-failed';
    startAbortControllerReference.current.abort();
  }, [agent.state]);

  useEffect(
    () => () => {
      startAbortControllerReference.current?.abort();
    },
    [],
  );

  const startConversation = async () => {
    setLocalError(null);
    setIsStarting(true);
    const controller = new AbortController();
    startAbortControllerReference.current = controller;
    startAbortReasonReference.current = null;
    const timeoutId = window.setTimeout(() => {
      startAbortReasonReference.current = 'timeout';
      controller.abort();
    }, SESSION_START_TIMEOUT_MILLISECONDS);

    try {
      if (session.connectionState !== 'disconnected') {
        await session.end();
      }

      try {
        await room.startAudio();
      } catch (error) {
        throw new AudioPlaybackError(error);
      }

      await session.start({ signal: controller.signal });
      setHasStarted(true);
    } catch (error) {
      await session.end().catch(() => undefined);
      setHasStarted(false);
      setLocalError(
        startAbortReasonReference.current
          ? WORKER_UNAVAILABLE_MESSAGE
          : getSessionErrorMessage(error),
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (startAbortControllerReference.current === controller) {
        startAbortControllerReference.current = null;
      }
      startAbortReasonReference.current = null;
      setIsStarting(false);
    }
  };

  const endConversation = async () => {
    setIsEnding(true);

    try {
      await session.end();
      setHasStarted(false);
      setLocalError(null);
    } catch (error) {
      setLocalError(getSessionErrorMessage(error));
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <main className="app-shell" data-lk-theme="default">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Aeternum Vita — Início">
          <span className="brand-mark">
            <SparkleIcon aria-hidden="true" weight="fill" />
          </span>
          <span>Aeternum Vita</span>
          <span className="brand-badge">Voice AI</span>
        </a>

        <div className="nav-actions">
          <a className="nav-link" href="#como-funciona">
            Como Funciona
          </a>
          <button
            className="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={isLightMode ? 'Ativar Modo Dark Liquid Glass' : 'Ativar Modo Light Liquid Glass (iOS 27)'}
            title={isLightMode ? 'Ativar Dark Liquid Glass' : 'Ativar Light Liquid Glass'}
          >
            {isLightMode ? <MoonIcon size={20} weight="fill" /> : <SunIcon size={20} weight="fill" />}
          </button>
        </div>
      </header>

      {!isActive && (
        <A26TutorSelector
          selectedTutor={selectedTutor}
          onSelectTutor={onSelectTutor}
          disabled={isStarting}
        />
      )}

      <div className="workspace">
        <A26VoiceConsole
          agentState={agent.state}
          microphoneTrack={agent.microphoneTrack}
          statusLabel={
            isActive
              ? `${statusLabel} • ${currentTutor.flag} ${currentTutor.name}`
              : statusLabel
          }
          errorMessage={displayedError}
          isActive={isActive}
          isStarting={isStarting}
          isEnding={isEnding}
          microphoneEnabled={microphone.enabled}
          microphoneButtonProps={microphone.buttonProps}
          onStart={() => void startConversation()}
          onEnd={() => void endConversation()}
        />

        <A26Transcript entries={transcriptEntries} />
      </div>

      <A26HowItWorks />
      <RoomAudioRenderer />
    </main>
  );
};

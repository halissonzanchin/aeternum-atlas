import React, { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTranscriptions,
  useVoiceAssistant
} from "@livekit/components-react";
import {
  createVitaSessionKey,
  requestVitaConnection
} from "../../services/voice/aeternumLiveKitService.js";
import { isVitaVoiceEnabled } from "../../services/voice/aeternumVitaConfig.js";

const STATUS_MAP = Object.freeze({
  disconnected: "connecting",
  connecting: "connecting",
  initializing: "connecting",
  idle: "listening",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking"
});

function VitaRoomObserver({ onStatusChange, onUserTranscript, onTutorTranscript }) {
  const { state, agentTranscriptions } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const transcriptions = useTranscriptions();
  const lastUserText = [...transcriptions]
    .reverse()
    .find((item) => item.participantInfo.identity === localParticipant.identity)?.text || "";
  const lastTutorText = agentTranscriptions.at(-1)?.text || "";

  useEffect(() => {
    onStatusChange(STATUS_MAP[state] || "connecting");
  }, [onStatusChange, state]);

  useEffect(() => {
    if (lastUserText) onUserTranscript(lastUserText);
  }, [lastUserText, onUserTranscript]);

  useEffect(() => {
    if (lastTutorText) onTutorTranscript(lastTutorText);
  }, [lastTutorText, onTutorTranscript]);

  return <RoomAudioRenderer />;
}

export default function AeternumVitaLiveSession({
  active,
  tutorId,
  onStatusChange,
  onUserTranscript,
  onTutorTranscript,
  onError
}) {
  const [connection, setConnection] = useState(null);
  const handlersRef = useRef({ onStatusChange, onUserTranscript, onTutorTranscript, onError });

  useEffect(() => {
    handlersRef.current = { onStatusChange, onUserTranscript, onTutorTranscript, onError };
  }, [onError, onStatusChange, onTutorTranscript, onUserTranscript]);

  useEffect(() => {
    if (!active) {
      setConnection(null);
      return undefined;
    }

    if (!isVitaVoiceEnabled()) {
      handlersRef.current.onError(new Error("A voz da Aeternum Vita está desativada por configuração."));
      return undefined;
    }

    const controller = new AbortController();
    handlersRef.current.onStatusChange("connecting");

    requestVitaConnection({
      tutorId,
      idempotencyKey: createVitaSessionKey(),
      signal: controller.signal
    })
      .then((credentials) => {
        if (!controller.signal.aborted) setConnection(credentials);
      })
      .catch((error) => {
        if (!controller.signal.aborted) handlersRef.current.onError(error);
      });

    return () => {
      controller.abort();
      setConnection(null);
    };
  }, [active, tutorId]);

  if (!active || !connection) return null;

  return (
    <LiveKitRoom
      className="a26-vita-livekit-room"
      serverUrl={connection.serverUrl}
      token={connection.token}
      connect
      audio={{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }}
      video={false}
      onConnected={() => handlersRef.current.onStatusChange("listening")}
      onError={(error) => handlersRef.current.onError(error)}
      onMediaDeviceFailure={() => handlersRef.current.onError(new Error("Não foi possível acessar o microfone."))}
    >
      <VitaRoomObserver
        onStatusChange={(status) => handlersRef.current.onStatusChange(status)}
        onUserTranscript={(text) => handlersRef.current.onUserTranscript(text)}
        onTutorTranscript={(text) => handlersRef.current.onTutorTranscript(text)}
      />
    </LiveKitRoom>
  );
}

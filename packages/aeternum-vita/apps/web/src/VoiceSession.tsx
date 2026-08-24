import { SessionProvider, useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { useMemo, useState } from 'react';
import { VoiceConsole } from './VoiceConsole.tsx';
import type { TutorId } from './components/A26TutorSelector.tsx';

type VoiceSessionProps = {
  agentName: string;
};

interface VoiceSessionInnerProps {
  agentName: string;
  selectedTutor: TutorId;
  onSelectTutor: (id: TutorId) => void;
}

const VoiceSessionInner = ({
  agentName,
  selectedTutor,
  onSelectTutor,
}: VoiceSessionInnerProps) => {
  const tokenSource = useMemo(
    () => TokenSource.endpoint(`/api/token?tutor=${selectedTutor}`),
    [selectedTutor],
  );

  const session = useSession(tokenSource, { agentName });

  return (
    <SessionProvider session={session}>
      <VoiceConsole selectedTutor={selectedTutor} onSelectTutor={onSelectTutor} />
    </SessionProvider>
  );
};

export const VoiceSession = ({ agentName }: VoiceSessionProps) => {
  const [selectedTutor, setSelectedTutor] = useState<TutorId>('eduardo');

  return (
    <VoiceSessionInner
      key={selectedTutor}
      agentName={agentName}
      selectedTutor={selectedTutor}
      onSelectTutor={setSelectedTutor}
    />
  );
};

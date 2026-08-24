import { BarVisualizer, type AgentState, type UseAgentReturn } from '@livekit/components-react';
import { SparkleIcon } from '@phosphor-icons/react';
import './A26VoiceOrb.css';

type A26VoiceOrbProps = {
  agentState: AgentState;
  microphoneTrack: UseAgentReturn['microphoneTrack'];
};

export const A26VoiceOrb = ({ agentState, microphoneTrack }: A26VoiceOrbProps) => {
  return (
    <div className={`a26-spectral-orb state-${agentState}`} aria-hidden="true">
      {/* Camada 4: Cáusticas & Halo de Dispersão Espectral */}
      <div className="a26-orb-caustics" />

      {/* Camada 3: Lente Volumétrica Física 3D */}
      <div className="a26-orb-lens-body">
        {/* Bisel Polarizado Especular Superior */}
        <div className="a26-specular-ring" />

        {/* Núcleo Acústico / Visualizador de Frequências */}
        <div className="a26-orb-core">
          {microphoneTrack ? (
            <BarVisualizer barCount={7} state={agentState} track={microphoneTrack} />
          ) : (
            <SparkleIcon className="a26-orb-sparkle" aria-hidden="true" weight="fill" />
          )}
        </div>
      </div>
    </div>
  );
};

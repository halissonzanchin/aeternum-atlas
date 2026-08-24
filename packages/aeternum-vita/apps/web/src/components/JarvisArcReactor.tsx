import React, { useMemo } from 'react';

export type JarvisVoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'connecting';

interface JarvisArcReactorProps {
  state: JarvisVoiceState;
  tutorName: string;
  volumeLevel?: number; // 0 to 1
}

export const JarvisArcReactor: React.FC<JarvisArcReactorProps> = ({
  state,
  tutorName,
  volumeLevel = 0,
}) => {
  // 12 Inductor nodes spaced evenly around the 360 deg arc reactor ring
  const inductors = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = i * 30;
      return {
        id: i,
        transform: `rotate(${angle}deg) translate(140px)`,
      };
    });
  }, []);

  const stateClass = `state-${state}`;

  const getStatusLabel = () => {
    switch (state) {
      case 'connecting':
        return 'ESTABELECENDO UPLINK QUÂNTICO...';
      case 'listening':
        return 'RECEPTOR DE ÁUDIO ATIVO // OUVINDO VOCÊ';
      case 'thinking':
        return 'PROCESSAMENTO NEURAL // SÍNTESE';
      case 'speaking':
        return `TRANSMITINDO RESPOSTA // ${tutorName.toUpperCase()}`;
      default:
        return 'NÚCLEO ARC EM STANDBY // PRONTO';
    }
  };

  const dynamicScale = 1 + Math.min(volumeLevel * 0.4, 0.4);

  return (
    <div className={`jarvis-reactor-stage ${stateClass}`}>
      <div className="jarvis-reactor-wrapper" style={{ transform: `scale(${dynamicScale})` }}>
        {/* Outer dashed reticle ring */}
        <div className="jarvis-reactor-outer-ring" />

        {/* Middle segmented induction ring */}
        <div className="jarvis-reactor-mid-ring">
          <div className="jarvis-reactor-inductors">
            {inductors.map((item) => (
              <div
                key={item.id}
                className="jarvis-inductor-node"
                style={{ transform: item.transform }}
              />
            ))}
          </div>
        </div>

        {/* Inner Holographic Triangle Core */}
        <div className="jarvis-reactor-triangle-container">
          <div className="jarvis-reactor-triangle">
            <div className="jarvis-reactor-triangle-inner">
              <div className="jarvis-reactor-core-orb">
                <span
                  style={{
                    color: '#0077fe',
                    fontFamily: 'Orbitron',
                    fontSize: '11px',
                    fontWeight: 900,
                  }}
                >
                  ARC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="jarvis-status-banner">
        <div className="jarvis-status-pill">{getStatusLabel()}</div>
        <div className="jarvis-status-desc">
          REATOR ARC MK-VII • TELEMETRIA DE FREQUÊNCIA VOCAL ATIVA
        </div>
      </div>
    </div>
  );
};

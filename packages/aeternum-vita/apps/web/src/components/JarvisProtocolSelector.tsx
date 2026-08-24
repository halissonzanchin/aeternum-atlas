import React from 'react';

export interface ProtocolOption {
  id: string;
  name: string;
  code: string;
  language: string;
  flag: string;
  gender: string;
  description: string;
}

export const JARVIS_PROTOCOLS: ProtocolOption[] = [
  {
    id: 'eduardo',
    name: 'Eduardo',
    code: 'ALPHA-01',
    language: 'Português (Brasil)',
    flag: '🇧🇷',
    gender: 'Voz Barítono Central',
    description: 'Mentor sênior acolhedor com dicção nativa do Brasil.',
  },
  {
    id: 'antonia',
    name: 'Antonia',
    code: 'LATAM-02',
    language: 'Español (Latam)',
    flag: '🇪🇸',
    gender: 'Voz Feminina Límpida',
    description: 'Mentora hispanohablante empática com áudio Deepgram Aura.',
  },
  {
    id: 'ariana',
    name: 'Ariana',
    code: 'GLOBAL-03',
    language: 'English (United States)',
    flag: '🇺🇸',
    gender: 'Voz Feminina Dinâmica',
    description: 'Executive coach ágil e motivadora em inglês nativo.',
  },
  {
    id: 'fabian',
    name: 'Fabian',
    code: 'CENTRAL-04',
    language: 'Deutsch (Deutschland)',
    flag: '🇩🇪',
    gender: 'Voz Masculina Precisa',
    description: 'Mentor acadêmico estruturado em alemão clássico.',
  },
];

interface JarvisProtocolSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export const JarvisProtocolSelector: React.FC<JarvisProtocolSelectorProps> = ({
  selectedId,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="jarvis-protocol-list" role="radiogroup" aria-label="Seleção de Protocolo J.A.R.V.I.S.">
      {JARVIS_PROTOCOLS.map((protocol) => {
        const isSelected = selectedId === protocol.id;
        return (
          <div
            key={protocol.id}
            role="radio"
            aria-checked={isSelected}
            tabIndex={disabled ? -1 : 0}
            className={`jarvis-protocol-card ${isSelected ? 'active' : ''}`}
            onClick={() => !disabled && onSelect(protocol.id)}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelect(protocol.id);
              }
            }}
          >
            <div className="jarvis-protocol-left">
              <span className="jarvis-protocol-flag">{protocol.flag}</span>
              <div className="jarvis-protocol-info">
                <div className="jarvis-protocol-name">
                  {protocol.code} // {protocol.name.toUpperCase()}
                </div>
                <div className="jarvis-protocol-lang">{protocol.language}</div>
                <div className="jarvis-protocol-meta">{protocol.gender}</div>
              </div>
            </div>

            <span className="jarvis-protocol-badge">
              {isSelected ? 'ENGAGED' : 'READY'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

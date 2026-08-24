import { CheckCircleIcon, SparkleIcon } from '@phosphor-icons/react';
import type { FC } from 'react';

export type TutorId = 'eduardo' | 'antonia' | 'ariana' | 'fabian';

export interface TutorInfo {
  id: TutorId;
  name: string;
  language: string;
  flag: string;
  gender: string;
  role: string;
  description: string;
  accent: string;
  color: string;
  gradient: string;
}

export const TUTOR_LIST: TutorInfo[] = [
  {
    id: 'eduardo',
    name: 'Eduardo',
    language: 'Português',
    flag: '🇧🇷',
    gender: 'Voz Masculina',
    role: 'Mentor Sênior',
    description: 'Voz barítona madura, calorosa e reflexiva com dicção 100% nativa do Brasil.',
    accent: 'Português do Brasil Nativo',
    color: '#10b981',
    gradient: 'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.15) 70%, transparent)',
  },
  {
    id: 'antonia',
    name: 'Antonia',
    language: 'Español',
    flag: '🇪🇸',
    gender: 'Voz Femenina',
    role: 'Mentora Hispánica',
    description: 'Voz femenina límpida, cálida y empática con fonética 100% nativa en español.',
    accent: 'Español Nativo (Argentina/Latam)',
    color: '#f59e0b',
    gradient: 'radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.15) 70%, transparent)',
  },
  {
    id: 'ariana',
    name: 'Ariana',
    language: 'English',
    flag: '🇺🇸',
    gender: 'Female Voice',
    role: 'American Mentor',
    description: 'Dynamic, clear and engaging American English voice with friendly and natural cadence.',
    accent: 'Native American English (US)',
    color: '#3b82f6',
    gradient: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.15) 70%, transparent)',
  },
  {
    id: 'fabian',
    name: 'Fabian',
    language: 'Deutsch',
    flag: '🇩🇪',
    gender: 'Männliche Stimme',
    role: 'Deutscher Mentor',
    description: 'Kompetente, angenehme und souveräne deutsche Männerstimme mit präzisem Hochdeutsch.',
    accent: 'Muttersprache Deutsch (DE)',
    color: '#8b5cf6',
    gradient: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.4), rgba(124, 58, 237, 0.15) 70%, transparent)',
  },
];

interface A26TutorSelectorProps {
  selectedTutor: TutorId;
  onSelectTutor: (id: TutorId) => void;
  disabled?: boolean;
}

export const A26TutorSelector: FC<A26TutorSelectorProps> = ({
  selectedTutor,
  onSelectTutor,
  disabled = false,
}) => {
  return (
    <section className="a26-tutor-selector-section" aria-label="Seleção de Tutores Especialistas">
      <div className="a26-selector-header">
        <div className="a26-selector-title-wrap">
          <span className="a26-selector-pill">
            <SparkleIcon size={14} weight="fill" />
            <span>Multi-Tutor Especialista</span>
          </span>
          <h2>Escolha o seu Tutor Especialista Nativo</h2>
          <p>
            Cada tutor fala exclusivamente em sua língua mãe com pronúncia nativa e zero sotaque cruzado.
          </p>
        </div>
      </div>

      <div className="a26-tutor-grid" role="radiogroup" aria-label="Lista de Tutores Disponíveis">
        {TUTOR_LIST.map((tutor) => {
          const isSelected = tutor.id === selectedTutor;

          return (
            <button
              key={tutor.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              className={`a26-tutor-card ${isSelected ? 'a26-tutor-card-active' : ''}`}
              onClick={() => onSelectTutor(tutor.id)}
              style={{
                borderColor: isSelected ? tutor.color : undefined,
                boxShadow: isSelected ? `0 0 24px ${tutor.color}33` : undefined,
              }}
            >
              <div className="a26-tutor-card-glow" style={{ background: tutor.gradient }} />

              <div className="a26-tutor-card-header">
                <div className="a26-tutor-flag-badge">
                  <span className="a26-flag-icon">{tutor.flag}</span>
                  <span className="a26-language-name">{tutor.language}</span>
                </div>
                {isSelected && (
                  <span className="a26-selected-check" style={{ color: tutor.color }}>
                    <CheckCircleIcon size={20} weight="fill" />
                  </span>
                )}
              </div>

              <div className="a26-tutor-avatar-wrap">
                <div
                  className="a26-tutor-orb-mini"
                  style={{
                    borderColor: `${tutor.color}88`,
                    boxShadow: `0 0 16px ${tutor.color}44`,
                  }}
                >
                  <span className="a26-tutor-initial">{tutor.name[0]}</span>
                </div>
                <div className="a26-tutor-name-info">
                  <h3 className="a26-tutor-name">{tutor.name}</h3>
                  <span className="a26-tutor-role">{tutor.role}</span>
                </div>
              </div>

              <p className="a26-tutor-description">{tutor.description}</p>

              <div className="a26-tutor-card-footer">
                <span className="a26-gender-badge">{tutor.gender}</span>
                <span className="a26-accent-badge" style={{ color: tutor.color }}>
                  {tutor.accent}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

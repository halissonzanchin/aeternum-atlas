import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneDisconnectIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import type { ButtonHTMLAttributes } from 'react';

type StartActionProps = {
  disabled: boolean;
  isStarting: boolean;
  onStart: () => void;
};

export const StartAction = ({ disabled, isStarting, onStart }: StartActionProps) => {
  return (
    <button
      className="a26-pill-button a26-pill-button-primary"
      type="button"
      disabled={disabled}
      onClick={onStart}
    >
      <SparkleIcon aria-hidden="true" weight="fill" />
      <span>{isStarting ? 'Iniciando Sessão…' : 'Iniciar Conversa por Voz'}</span>
    </button>
  );
};

type ActiveActionsProps = {
  microphoneEnabled: boolean;
  microphoneButtonProps: ButtonHTMLAttributes<HTMLButtonElement>;
  isEnding: boolean;
  onEnd: () => void;
};

export const ActiveActions = ({
  microphoneEnabled,
  microphoneButtonProps,
  isEnding,
  onEnd,
}: ActiveActionsProps) => {
  const MicrophoneStateIcon = microphoneEnabled ? MicrophoneIcon : MicrophoneSlashIcon;
  const { className: liveKitClassName, ...microphoneControlProps } = microphoneButtonProps;
  const microphoneClassName = ['a26-pill-button', liveKitClassName].filter(Boolean).join(' ');

  return (
    <div className="active-actions-wrapper">
      <button {...microphoneControlProps} className={microphoneClassName} type="button">
        <MicrophoneStateIcon aria-hidden="true" weight="bold" />
        <span>{microphoneEnabled ? 'Silenciar Microfone' : 'Ativar Microfone'}</span>
      </button>

      <button
        className="a26-pill-button a26-pill-button-danger"
        type="button"
        disabled={isEnding}
        onClick={onEnd}
      >
        <PhoneDisconnectIcon aria-hidden="true" weight="bold" />
        <span>{isEnding ? 'Encerrando…' : 'Encerrar Chamada'}</span>
      </button>
    </div>
  );
};

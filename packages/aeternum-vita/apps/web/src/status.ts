import type { AgentState } from '@livekit/components-react';

const statusLabels: Record<AgentState, string> = {
  connecting: 'Conectando à sala Aeternum…',
  'pre-connect-buffering': 'Preparando canais de áudio…',
  initializing: 'Iniciando assistente de voz…',
  idle: 'Assistente Aeternum conectado',
  listening: 'Ouvindo você',
  thinking: 'Processando pensamento…',
  speaking: 'Respondendo com voz',
  disconnected: 'Sessão encerrada',
  failed: 'Falha ao manter conexão de voz',
};

export class AudioPlaybackError extends Error {
  constructor(cause: unknown) {
    super('O navegador bloqueou a reprodução do áudio.', { cause });
    this.name = 'AudioPlaybackError';
  }
}

export const getAgentStatusLabel = (status: AgentState, hasStarted: boolean): string => {
  if (!hasStarted && status === 'disconnected') {
    return 'Pronto para iniciar';
  }

  return statusLabels[status] ?? 'Em espera';
};

export const getSessionErrorMessage = (error: unknown): string => {
  if (error instanceof AudioPlaybackError) {
    return 'O navegador bloqueou a reprodução do áudio. Clique para iniciar a conversa novamente.';
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Permita o acesso ao microfone no navegador para conversar com o Aeternum Vita.';
    }

    if (error.name === 'NotFoundError') {
      return 'Nenhum microfone foi detectado neste dispositivo.';
    }

    if (error.name === 'NotReadableError') {
      return 'O microfone está em uso por outro aplicativo.';
    }
  }

  return 'Não foi possível estabelecer a sessão de voz. Verifique o LiveKit e tente novamente.';
};

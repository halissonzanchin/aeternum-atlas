import { describe, expect, it } from 'vitest';
import { AudioPlaybackError, getAgentStatusLabel, getSessionErrorMessage } from './status.ts';

describe('status mapping & error handlers', () => {
  it('retorna rótulo de prontidão antes do início', () => {
    expect(getAgentStatusLabel('disconnected', false)).toBe('Pronto para iniciar');
    expect(getAgentStatusLabel('disconnected', true)).toBe('Sessão encerrada');
  });

  it('mapeia estados ativos do agente', () => {
    expect(getAgentStatusLabel('listening', true)).toBe('Ouvindo você');
    expect(getAgentStatusLabel('thinking', true)).toBe('Processando pensamento…');
    expect(getAgentStatusLabel('speaking', true)).toBe('Respondendo com voz');
  });

  it('fornece mensagens de erro amigáveis para bloqueios comuns de mídia', () => {
    const micBlocked = new DOMException('Permissão negada', 'NotAllowedError');
    expect(getSessionErrorMessage(micBlocked)).toContain('Permita o acesso ao microfone');

    const playbackBlocked = new AudioPlaybackError(new Error('Autoplay blocked'));
    expect(getSessionErrorMessage(playbackBlocked)).toContain('bloqueou a reprodução do áudio');
  });
});

import { describe, expect, it } from 'vitest';
import {
  combineUserSegments,
  createTranscriptSnapshot,
  type TranscriptEntry,
  type TranscriptSnapshot,
} from './transcript.ts';

const snapshotWith = (entries: TranscriptEntry[]): TranscriptSnapshot => ({
  sourceEntries: entries,
  stableEntries: entries,
});

describe('createTranscriptSnapshot', () => {
  it('preserva o snapshot quando o conteúdo não mudou', () => {
    const previous = snapshotWith([{ id: '1', speaker: 'user', text: 'Olá.' }]);

    expect(createTranscriptSnapshot(previous, [{ id: '1', speaker: 'user', text: 'Olá.' }])).toBe(
      previous,
    );
  });

  it('aceita a expansão de uma transcrição parcial', () => {
    const previous = snapshotWith([{ id: '1', speaker: 'user', text: 'Quero aprender' }]);

    expect(
      createTranscriptSnapshot(previous, [
        { id: '1', speaker: 'user', text: 'Quero aprender LiveKit' },
      ]).stableEntries,
    ).toEqual([{ id: '1', speaker: 'user', text: 'Quero aprender LiveKit' }]);
  });

  it('não reduz uma transcrição estável quando chega uma revisão mais curta', () => {
    const previous = snapshotWith([{ id: '1', speaker: 'user', text: 'Quero aprender LiveKit' }]);

    expect(
      createTranscriptSnapshot(previous, [{ id: '1', speaker: 'user', text: 'Quero aprender' }])
        .stableEntries,
    ).toEqual([{ id: '1', speaker: 'user', text: 'Quero aprender LiveKit' }]);
  });

  it('aceita uma correção que substitui o texto anterior', () => {
    const previous = snapshotWith([{ id: '1', speaker: 'user', text: 'Agente de vós' }]);

    expect(
      createTranscriptSnapshot(previous, [{ id: '1', speaker: 'user', text: 'Agente de voz' }])
        .stableEntries,
    ).toEqual([{ id: '1', speaker: 'user', text: 'Agente de voz' }]);
  });

  it('mantém a chave estável quando o provedor troca o identificador da revisão', () => {
    const previous = snapshotWith([{ id: 'temporaria', speaker: 'user', text: 'Olá' }]);

    expect(
      createTranscriptSnapshot(previous, [{ id: 'final', speaker: 'user', text: 'Olá, tudo bem?' }])
        .stableEntries,
    ).toEqual([{ id: 'temporaria', speaker: 'user', text: 'Olá, tudo bem?' }]);
  });

  it('mantém mensagens do agente sem reconciliação de texto', () => {
    const previous = snapshotWith([{ id: '1', speaker: 'agent', text: 'Primeira resposta.' }]);

    expect(
      createTranscriptSnapshot(previous, [
        { id: '1', speaker: 'agent', text: 'Resposta corrigida.' },
      ]).stableEntries,
    ).toEqual([{ id: '1', speaker: 'agent', text: 'Resposta corrigida.' }]);
  });

  it('limpa o snapshot quando a sessão é reiniciada', () => {
    const previous = snapshotWith([{ id: '1', speaker: 'user', text: 'Olá.' }]);

    expect(createTranscriptSnapshot(previous, [])).toEqual({
      sourceEntries: [],
      stableEntries: [],
    });
  });
});

describe('combineUserSegments', () => {
  it('remove uma sobreposição com diferenças de caixa e pontuação', () => {
    expect(
      combineUserSegments([
        { id: '1', speaker: 'user', text: 'Olá, MUNDO de' },
        { id: '2', speaker: 'user', text: 'mundo de novo' },
      ]),
    ).toEqual([{ id: '1', speaker: 'user', text: 'Olá, MUNDO de novo' }]);
  });

  it('concatena segmentos consecutivos e distintos do usuário', () => {
    expect(
      combineUserSegments([
        { id: '1', speaker: 'user', text: 'Primeira frase.' },
        { id: '2', speaker: 'user', text: 'Segunda frase.' },
      ]),
    ).toEqual([{ id: '1', speaker: 'user', text: 'Primeira frase. Segunda frase.' }]);
  });

  it('não combina mensagens consecutivas do agente', () => {
    const entries: TranscriptEntry[] = [
      { id: '1', speaker: 'agent', text: 'Primeira resposta.' },
      { id: '2', speaker: 'agent', text: 'Segunda resposta.' },
    ];

    expect(combineUserSegments(entries)).toEqual(entries);
  });
});

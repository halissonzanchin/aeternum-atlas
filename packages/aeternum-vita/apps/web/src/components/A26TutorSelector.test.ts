import { describe, expect, it } from 'vitest';
import { TUTOR_LIST } from './A26TutorSelector.tsx';

describe('A26TutorSelector Component Models', () => {
  it('contém exatamente os 4 tutores nativos com os dados corretos (Eduardo, Antonia, Ariana e Fabian)', () => {
    expect(TUTOR_LIST).toHaveLength(4);

    const eduardo = TUTOR_LIST.find((t) => t.id === 'eduardo');
    expect(eduardo).toBeDefined();
    expect(eduardo?.name).toBe('Eduardo');
    expect(eduardo?.flag).toBe('🇧🇷');
    expect(eduardo?.language).toBe('Português');
    expect(eduardo?.gender).toBe('Voz Masculina');

    const antonia = TUTOR_LIST.find((t) => t.id === 'antonia');
    expect(antonia).toBeDefined();
    expect(antonia?.name).toBe('Antonia');
    expect(antonia?.flag).toBe('🇪🇸');
    expect(antonia?.language).toBe('Español');
    expect(antonia?.gender).toBe('Voz Femenina');

    const ariana = TUTOR_LIST.find((t) => t.id === 'ariana');
    expect(ariana).toBeDefined();
    expect(ariana?.name).toBe('Ariana');
    expect(ariana?.flag).toBe('🇺🇸');
    expect(ariana?.language).toBe('English');
    expect(ariana?.gender).toBe('Female Voice');

    const fabian = TUTOR_LIST.find((t) => t.id === 'fabian');
    expect(fabian).toBeDefined();
    expect(fabian?.name).toBe('Fabian');
    expect(fabian?.flag).toBe('🇩🇪');
    expect(fabian?.language).toBe('Deutsch');
    expect(fabian?.gender).toBe('Männliche Stimme');
  });
});

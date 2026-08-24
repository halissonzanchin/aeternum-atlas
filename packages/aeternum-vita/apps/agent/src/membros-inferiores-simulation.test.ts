import { describe, expect, it } from 'vitest';
import { TUTOR_CONFIGS } from './agent.ts';
import { loadVoiceRuntimeConfig } from './runtime-config.ts';
import { formatKnowledgeContext, queryVitaKnowledge } from './vita-rag.ts';

describe('Simulação de Diálogo de Estudante — Membros Inferiores (Ossos e Músculos)', () => {
  const runtime = loadVoiceRuntimeConfig({});

  it('Diálogo 1 [Fêmur & Quadril]: O estudante pergunta sobre a osteologia do fêmur e acidentes', async () => {
    const query = 'Eduardo, vamos falar sobre os acidentes ósseos do fêmur e a linha áspera?';
    const knowledge = await queryVitaKnowledge(query, 'eduardo', 'pt', runtime);

    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('cabeça femoral');
    expect(knowledge?.context).toContain('trocânter');
    expect(knowledge?.context).toContain('linha áspera');
    expect(knowledge?.context).toContain('côndilos');

    const formatted = formatKnowledgeContext(knowledge!);
    expect(formatted).toContain('Moore');
    expect(formatted).toContain('página 512');
  });

  it('Diálogo 2 [Tíbia, Fíbula & Tornozelo]: O estudante pergunta sobre os ossos da perna e pinça maleolar', async () => {
    const query = 'Quais os acidentes da tíbia e fíbula que formam a articulação do tornozelo?';
    const knowledge = await queryVitaKnowledge(query, 'eduardo', 'pt', runtime);

    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('platô tibial');
    expect(knowledge?.context).toContain('maléolo medial');
    expect(knowledge?.context).toContain('maléolo lateral');
    expect(knowledge?.context).toContain('síndrome compartimental');

    const formatted = formatKnowledgeContext(knowledge!);
    expect(formatted).toContain('Moore');
    expect(formatted).toContain('Netter');
  });

  it('Diálogo 3 [Quadríceps & Isquiotibiais]: O estudante pergunta sobre os músculos da coxa', async () => {
    const query = 'Eduardo, quais músculos compõem o quadríceps e os isquiotibiais?';
    const knowledge = await queryVitaKnowledge(query, 'eduardo', 'pt', runtime);

    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Quadríceps Femoral');
    expect(knowledge?.context).toContain('Reto Femoral');
    expect(knowledge?.context).toContain('Vasto Lateral');
    expect(knowledge?.context).toContain('Bíceps Femoral');
    expect(knowledge?.context).toContain('Semitendíneo');
    expect(knowledge?.context).toContain('Semimembranoso');
    expect(knowledge?.context).toContain('nervo femoral');
  });

  it('Diálogo 4 [Tríceps Sural & Tarso]: O estudante pergunta sobre a panturrilha e tendão de Aquiles', async () => {
    const query = 'Fale sobre o tríceps sural, o tendão de Aquiles e os 7 ossos do tarso';
    const knowledge = await queryVitaKnowledge(query, 'eduardo', 'pt', runtime);

    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Tríceps Sural');
    expect(knowledge?.context).toContain('Gastrocnêmio');
    expect(knowledge?.context).toContain('Sóleo');
    expect(knowledge?.context).toContain('Tendão de Aquiles');
    expect(knowledge?.context).toContain('Tálus e Calcâneo');
    expect(knowledge?.context).toContain('Teste de Thompson');
  });

  it('Diálogo 5 [Joelho & Ligamentos]: O estudante pergunta sobre o LCA e meniscos', async () => {
    const query = 'Como é a biomecânica do ligamento cruzado anterior e dos meniscos no joelho?';
    const knowledge = await queryVitaKnowledge(query, 'eduardo', 'pt', runtime);

    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Ligamento Cruzado Anterior');
    expect(knowledge?.context).toContain('translação anterior');
    expect(knowledge?.context).toContain('meniscos');
    expect(knowledge?.context).toContain('Tríade Terrível');
  });
});

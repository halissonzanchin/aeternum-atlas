import { describe, expect, it } from 'vitest';
import { TUTOR_CONFIGS, getTutorConfig } from './agent.ts';
import { loadVoiceRuntimeConfig } from './runtime-config.ts';
import { formatKnowledgeContext, queryVitaKnowledge } from './vita-rag.ts';

describe('Simulação Conversacional Enciclopédica dos Tutores Aeternum Vita', () => {
  const runtime = loadVoiceRuntimeConfig({});

  it('Turno 1 [Eduardo - Escápula]: Roteiro de 5 pontos e fontes de Moore/Netter', async () => {
    const knowledge = await queryVitaKnowledge('vamos falar sobre a escápula', 'eduardo', 'pt', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('espinha da escápula');
    expect(knowledge?.context).toContain('acrômio');
    expect(knowledge?.context).toContain('processo coracoide');
    expect(knowledge?.context).toContain('manguito rotador');

    const formatted = formatKnowledgeContext(knowledge!);
    expect(formatted).toContain('Moore');
    expect(formatted).toContain('Netter');

    const instructions = TUTOR_CONFIGS.eduardo.instructions;
    expect(instructions).toContain('Roteiro Anatômico de 5 Pontos');
    expect(instructions).toContain('MODO SIMULADO / QUIZ ORAL');
    expect(instructions).toContain('MODO REVISÃO RÁPIDA');
  });

  it('Turno 2 [Eduardo - Túnel do Carpo]: Detalha as 10 estruturas e compressão do nervo mediano', async () => {
    const knowledge = await queryVitaKnowledge('quais estruturas passam pelo túnel do carpo?', 'eduardo', 'pt', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Nervo Mediano');
    expect(knowledge?.context).toContain('9 tendões flexores');
    expect(knowledge?.context).toContain('retináculo dos flexores');
    expect(knowledge?.context).toContain('eminência tenar');
  });

  it('Turno 3 [Eduardo - Pares Cranianos]: Detalha os 12 pares e suas funções', async () => {
    const knowledge = await queryVitaKnowledge('quais são os 12 pares de nervos cranianos?', 'eduardo', 'pt', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Olfatório');
    expect(knowledge?.context).toContain('Óptico');
    expect(knowledge?.context).toContain('Trigêmeo');
    expect(knowledge?.context).toContain('Vago');
    expect(knowledge?.context).toContain('Facial');
  });

  it('Turno 4 [Eduardo - Forames do Crânio]: Detalha a base do crânio e forame jugular', async () => {
    const knowledge = await queryVitaKnowledge('quais os forames da base do crânio e o que passa no forame jugular?', 'eduardo', 'pt', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Forame jugular');
    expect(knowledge?.context).toContain('veia jugular interna');
    expect(knowledge?.context).toContain('Lâmina cribriforme');
  });

  it('Turno 5 [Eduardo - Coluna Vertebral]: Detalha Atlas, Áxis e hérnias discais', async () => {
    const knowledge = await queryVitaKnowledge('como se estruturam o atlas, áxis e os discos intervertebrais?', 'eduardo', 'pt', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Atlas (C1)');
    expect(knowledge?.context).toContain('Áxis (C2)');
    expect(knowledge?.context).toContain('processo odontoide');
    expect(knowledge?.context).toContain('núcleo pulposo');
  });

  it('Turno 6 [Eduardo - Fígado e Couinaud]: Detalha a segmentação funcional e sistema porta', async () => {
    const knowledge = await queryVitaKnowledge('explique a segmentação de Couinaud no fígado', 'eduardo', 'pt', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('8 segmentos independentes');
    expect(knowledge?.context).toContain('tríade portal');
    expect(knowledge?.context).toContain('Veia Porta');
  });

  it('Turno 7 [Eduardo - Joelho e LCA]: Detalha os ligamentos cruzados e tríade de O\x27Donoghue', async () => {
    const knowledge = await queryVitaKnowledge('quais os ligamentos do joelho e o que é a lesão de LCA?', 'eduardo', 'pt', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Ligamento Cruzado Anterior');
    expect(knowledge?.context).toContain('translação anterior');
    expect(knowledge?.context).toContain('meniscos');
  });

  it('Turno 8 [Antonia - ES]: Responde em espanhol com terminologia nativa', async () => {
    const knowledge = await queryVitaKnowledge('explícame los pares craneales y el nervio vago', 'antonia', 'es', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('12 pares craneales');
    expect(knowledge?.context).toContain('Vago');
    expect(getTutorConfig('antonia').languageCode).toBe('es');
  });

  it('Turno 9 [Ariana - EN]: Responde em inglês sobre o Circle of Willis e Lungs', async () => {
    const knowledge = await queryVitaKnowledge('explain the anatomy of lungs and mediastinum', 'ariana', 'en', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('right lung has 3 lobes');
    expect(knowledge?.context).toContain('pleural cavities');
    expect(getTutorConfig('ariana').languageCode).toBe('en');
  });

  it('Turno 10 [Fabian - DE]: Responde em alemão sobre o plexo braquial e rins', async () => {
    const knowledge = await queryVitaKnowledge('erkläre mir die Anatomie der Nieren und das Nephron', 'fabian', 'de', runtime);
    expect(knowledge).not.toBeNull();
    expect(knowledge?.context).toContain('Nieren');
    expect(knowledge?.context).toContain('Cortex renalis');
    expect(getTutorConfig('fabian').languageCode).toBe('de');
  });
});

/**
 * AETERNUM ATLAS — SAFE ENGINE (DENO CLOUD RUNTIME)
 * Module: safePremiseValidator.ts
 * Version: AETERNUM-SAFE-ENGINE-0.2.1-DENO-CLOUD
 *
 * Deterministic False-Premise detection adapter.
 * Identifies questions with contradictory anatomical premises before planning.
 */

export interface FalsePremiseResult {
  is_false_premise: boolean;
  reason?: string;
  refuted_concept?: string;
}

const FALSE_PREMISE_RULES = [
  { match: /escapula.*articula.*tibia/i, reason: 'Escápula não se articula com a tíbia (osso do membro inferior)' },
  { match: /escapula.*articula.*femur/i, reason: 'Escápula não se articula com o fêmur' },
  { match: /escapula.*articula.*fibula/i, reason: 'Escápula não se articula com a fíbula' },
  { match: /escapula.*articula.*radio/i, reason: 'Escápula não se articula diretamente com o rádio' },
  { match: /escapula.*articula.*ulna/i, reason: 'Escápula não se articula diretamente com a ulna' },
  { match: /clavicula.*cavidade\s+glenoidal/i, reason: 'Clavícula não possui cavidade glenoidal (pertence à escápula)' },
  { match: /processo\s+coracoide.*(pertence|e\s+da).*clavicula/i, reason: 'Processo coracoide pertence à escápula, não à clavícula' },
  { match: /ligamento\s+conoide.*fixa.*esterno/i, reason: 'Ligamento conoide fixa-se na clavícula e no processo coracoide, não no esterno' },
  { match: /escapula.*osso\s+longo/i, reason: 'Escápula é morfologicamente um osso plano, não um osso longo' },
  { match: /clavicula.*osso\s+plano/i, reason: 'Clavícula é classificada morfologicamente como osso longo' },
  { match: /disco\s+articular.*glenoumeral/i, reason: 'A articulação glenoumeral possui lábio glenoidal (labrum), não disco articular' },
  { match: /incisura\s+espinoglenoidal.*passa.*arteria\s+femoral/i, reason: 'Artéria femoral não passa na incisura espinoglenoidal (passam a artéria e nervo supraescapulares)' },
  // Cross-domain innervation traps
  { match: /nervo\s+facial.*inerva.*supraesp/i, reason: 'Músculo supraespinal é inervado pelo nervo supraescapular, não pelo nervo facial' },
  { match: /nervo\s+facial.*inerva.*infraesp/i, reason: 'Músculo infraespinal é inervado pelo nervo supraescapular, não pelo nervo facial' },
  { match: /nervo\s+radial.*inerva.*subescapular/i, reason: 'Músculo subescapular é inervado pelos nervos subescapulares superior e inferior, não pelo nervo radial' },
  { match: /nervo\s+femoral.*inerva.*trapezio/i, reason: 'Músculo trapézio é inervado pelo nervo acessório (NC XI), não pelo nervo femoral' },
  { match: /nervo\s+ciatico.*membro\s+superior/i, reason: 'Nervo isquiático (ciático) pertence ao plexo lombossacral (membro inferior)' }
];

export function validateFalsePremise(normalizedQuery: string): FalsePremiseResult {
  if (!normalizedQuery) {
    return { is_false_premise: false };
  }

  for (const rule of FALSE_PREMISE_RULES) {
    if (rule.match.test(normalizedQuery)) {
      return {
        is_false_premise: true,
        reason: rule.reason
      };
    }
  }

  return { is_false_premise: false };
}

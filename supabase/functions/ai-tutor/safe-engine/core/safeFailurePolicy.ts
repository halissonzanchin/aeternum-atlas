/**
 * AETERNUM ATLAS — SAFE ENGINE (DENO CLOUD RUNTIME)
 * Module: safeFailurePolicy.ts
 * Version: AETERNUM-SAFE-ENGINE-0.2.1-DENO-CLOUD
 *
 * Deterministic safe failure policies providing academically natural,
 * humanized fallbacks without technical jargon or raw error codes.
 */

export interface SafeFailureResult {
  status: string;
  reason: string;
  text: string;
  citation: string;
}

export function composeSafeFailure(plan: any): SafeFailureResult {
  const strategy = plan.response_strategy;
  let text = '';
  let reason = '';

  if (strategy === 'SAFE_FAILURE_OUT_OF_SCOPE') {
    const entityName = plan.resolved_entity || 'a estrutura consultada';
    text = `A estrutura anatômica informada (${entityName}) está fora do escopo canônico atualmente homologado no Aeternum Atlas, que nesta fase compreende o cíngulo peitoral (escápula, clavícula e suas articulações). Para assegurar rigor acadêmico absoluto e prevenir alucinações generativas, o motor não emite hipóteses fora do repertório canônico auditado.`;
    reason = 'OUT_OF_SCOPE_ENTITY';
  } else if (strategy === 'SAFE_FAILURE_CLINICAL') {
    text = `A base canônica do Aeternum Atlas foca na anatomia descritiva, topográfica e funcional estritamente fundamentada em fontes de referência primárias (Latarjet & Liard, Nielsen & Miller). Afirmações de correlação clínica diagnóstica, prescrição terapêutica, confirmação de lesão patológica ou conduta cirúrgica estão bloqueadas nesta versão, pendentes da homologação formal do protocolo de autoridade clínica (ACSRP-1.1).`;
    reason = 'CLINICAL_VALIDATION_BLOCKED';
  } else if (strategy === 'SAFE_FAILURE_FALSE_PREMISE') {
    const fpReason = plan.false_premise_reason || 'A proposição questionada contém premissas anatômicas não fundamentadas na literatura canônica.';
    text = `A consulta apresentada baseia-se em uma premissa anatômica incompatível com o registro canônico: ${fpReason}. O Aeternum Atlas recusa deterministamente relações fictícias ou não homologadas.`;
    reason = 'FALSE_PREMISE_REJECTED';
  } else if (strategy === 'SAFE_FAILURE_BLOCKED') {
    text = `As relações conceituais ou proporções questionadas constam no repositório canônico sob revisão ontológica ou estágio de quarentena, estando temporariamente inelegíveis para resposta determinística em produção nesta versão (AETERNUM-CANONICAL-MEMORY-0.2.2).`;
    reason = 'CANONICAL_EVIDENCE_AVAILABLE_BUT_RUNTIME_BLOCKED';
  } else if (strategy === 'REFERENCE_ONLY_NO_EVIDENCE') {
    text = `A estrutura anatômica informada é reconhecida como entidade de referência anatômica (REFERENCE_ONLY), porém o seu pacote canônico descritivo completo ainda não foi homologado nesta versão do Aeternum Atlas.`;
    reason = 'REFERENCE_ONLY_NO_CANONICAL_PACK';
  } else if (strategy === 'ENTITY_NOT_RESOLVED') {
    text = `Não foi possível identificar uma estrutura anatômica reconhecida na consulta. Por favor, especifique o nome da estrutura ou acidente anatômico usando a Terminologia Anatomica.`;
    reason = 'ENTITY_NOT_RESOLVED';
  } else if (strategy === 'AMBIGUOUS_ENTITY') {
    text = `O termo anatômico informado é polissêmico ou ambíguo no contexto da cintura escapular. Por favor, forneça mais contexto ou o nome completo da estrutura para que o motor identifique com precisão o acidente anatômico desejado.`;
    reason = 'AMBIGUOUS_ENTITY';
  } else {
    text = `A memória canônica local do Aeternum Atlas ainda não possui evidência validada com rastreabilidade primária suficiente para responder a esta consulta com segurança determinística total. Novos blocos documentários estão em processo de validação acadêmica.`;
    reason = 'INSUFFICIENT_CANONICAL_EVIDENCE';
  }

  return {
    status: plan.evidence_state || 'INSUFFICIENT_CANONICAL_EVIDENCE',
    reason: reason,
    text: text,
    citation: 'Aeternum Atlas — Protocolo de Integridade Anatômica (AACM-1.0)'
  };
}

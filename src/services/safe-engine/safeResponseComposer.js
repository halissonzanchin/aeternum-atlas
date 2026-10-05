/**
 * AETERNUM ATLAS — SAFE ENGINE
 * Module: safeResponseComposer.js
 * Version: AETERNUM-SAFE-ENGINE-0.2.0-UPPER-LIMB-B1
 *
 * Deterministic humanized Portuguese composer.
 * Renders structured anatomical facts into natural, fluent academic text.
 * Strictly prevents database identifier leakage, JSON syntax leakage, and raw relation tokens.
 */

import { composeSafeFailure } from './safeFailurePolicy.js';

// Comprehensive Portuguese natural naming dictionary for canonical memory keys
const PORTUGUESE_LABELS = {
  // Scapula
  'scapula': 'a escápula',
  'AET-ENT-UL-SCAPULA': 'a escápula',
  'pectoral_girdle': 'o cíngulo peitoral (cintura escapular)',
  'AET-ENT-UL-PECTORAL_GIRDLE': 'o cíngulo peitoral (cintura escapular)',
  'flat_bone': 'osso plano',
  'paired_bone': 'osso par e assimétrico',
  'triangular': 'triangular',
  'scapular_spine': 'a espinha da escápula',
  'AET-ENT-UL-SCAPULAR_SPINE': 'a espinha da escápula',
  'AET-ENT-UL-SCAPULAR_SPINE_SUPERIOR_LIP': 'o lábio superior da espinha da escápula',
  'AET-ENT-UL-SCAPULAR_SPINE_INFERIOR_LIP': 'o lábio inferior da espinha da escápula',
  'acromion': 'o acrômio',
  'AET-ENT-UL-SCAPULAR_ACROMION': 'o acrômio',
  'AET-ENT-UL-SCAPULAR_ACROMION_APEX': 'o ápice do acrômio',
  'AET-ENT-UL-SCAPULAR_ACROMION_ARTICULAR_FACET': 'a face articular do acrômio',
  'coracoid_process': 'o processo coracoide',
  'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS': 'o processo coracoide',
  'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS_APEX': 'o ápice do processo coracoide',
  'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS_BASE': 'a base do processo coracoide',
  'glenoid_cavity': 'a cavidade glenoidal',
  'AET-ENT-UL-SCAPULAR_GLENOID_CAVITY': 'a cavidade glenoidal',
  'glenoid_labrum': 'o lábio glenoidal (labrum)',
  'AET-ENT-UL-SCAPULAR_GLENOID_LABRUM': 'o lábio glenoidal (labrum)',
  'collum_scapulae': 'o colo da escápula',
  'AET-ENT-UL-SCAPULAR_COLLUM': 'o colo da escápula',
  'suprascapular_notch': 'a incisura da escápula',
  'AET-ENT-UL-SCAPULAR_SUPRASCAPULAR_NOTCH': 'a incisura da escápula',
  'spinoglenoid_notch': 'a incisura espinoglenoidal',
  'AET-ENT-UL-SCAPULAR_SPINOGLENOID_NOTCH': 'a incisura espinoglenoidal',
  'suprascapular_foramen': 'o forame supraescapular',
  'AET-ENT-UL-SCAPULAR_SUPRASCAPULAR_FORAMEN': 'o forame supraescapular',
  'supraglenoid_tubercle': 'o tubérculo supraglenoidal',
  'AET-ENT-UL-SCAPULAR_SUPRAGLENOID_TUBERCLE': 'o tubérculo supraglenoidal',
  'infraglenoid_tubercle': 'o tubérculo infraglenoidal',
  'AET-ENT-UL-SCAPULAR_INFRAGLENOID_TUBERCLE': 'o tubérculo infraglenoidal',
  'supraspinous_fossa': 'a fossa supraespinosa',
  'AET-ENT-UL-SCAPULAR_SUPRASPINOUS_FOSSA': 'a fossa supraespinosa',
  'infraspinous_fossa': 'a fossa infraespinosa',
  'AET-ENT-UL-SCAPULAR_INFRASPINOUS_FOSSA': 'a fossa infraespinosa',
  'subscapular_fossa': 'a fossa subescapular',
  'AET-ENT-UL-SCAPULAR_SUBSCAPULAR_FOSSA': 'a fossa subescapular',
  'costal_surface': 'a face costal (anterior)',
  'AET-ENT-UL-SCAPULAR_COSTAL_SURFACE': 'a face costal (anterior)',
  'posterior_surface': 'a face posterior (dorsal)',
  'AET-ENT-UL-SCAPULAR_POSTERIOR_SURFACE': 'a face posterior (dorsal)',
  'medial_border': 'a margem medial (vertebral)',
  'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER': 'a margem medial (vertebral)',
  'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER_INFERIOR_TO_SPINE': 'a margem medial inferior à espinha da escápula',
  'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER_AT_SPINE_LEVEL': 'a margem medial ao nível da espinha da escápula',
  'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER_SUPERIOR_TO_SPINE': 'a margem medial superior à espinha da escápula',
  'lateral_border': 'a margem lateral (axilar)',
  'AET-ENT-UL-SCAPULAR_LATERAL_BORDER': 'a margem lateral (axilar)',
  'superior_border': 'a margem superior',
  'AET-ENT-UL-SCAPULAR_SUPERIOR_BORDER': 'a margem superior',
  'inferior_angle': 'o ângulo inferior',
  'AET-ENT-UL-SCAPULAR_INFERIOR_ANGLE': 'o ângulo inferior',
  'superior_angle': 'o ângulo superior',
  'AET-ENT-UL-SCAPULAR_SUPERIOR_ANGLE': 'o ângulo superior',
  'lateral_angle': 'o ângulo lateral',
  'AET-ENT-UL-SCAPULAR_LATERAL_ANGLE': 'o ângulo lateral',

  // Clavicle
  'clavicle': 'a clavícula',
  'AET-ENT-UL-CLAVICLE': 'a clavícula',
  'long_bone': 'osso longo',
  'clavicular_shaft': 'o corpo (diáfise) da clavícula',
  'AET-ENT-UL-CLAVICULAR_SHAFT': 'o corpo (diáfise) da clavícula',
  'clavicular_sternal_end': 'a extremidade esternal da clavícula',
  'AET-ENT-UL-CLAVICULAR_STERNAL_END': 'a extremidade esternal da clavícula',
  'AET-ENT-UL-CLAVICULAR_STERNAL_END_EPIPHYSIS': 'a epífise da extremidade esternal da clavícula',
  'clavicular_acromial_end': 'a extremidade acromial da clavícula',
  'AET-ENT-UL-CLAVICULAR_ACROMIAL_END': 'a extremidade acromial da clavícula',
  'clavicular_superior_surface': 'a face superior da clavícula',
  'AET-ENT-UL-CLAVICULAR_SUPERIOR_SURFACE': 'a face superior da clavícula',
  'clavicular_inferior_surface': 'a face inferior da clavícula',
  'AET-ENT-UL-CLAVICULAR_INFERIOR_SURFACE': 'a face inferior da clavícula',
  'clavicular_anterior_border': 'a margem anterior da clavícula',
  'AET-ENT-UL-CLAVICULAR_ANTERIOR_BORDER': 'a margem anterior da clavícula',
  'AET-ENT-UL-CLAVICULAR_ANTERIOR_BORDER_LATERAL_THIRD': 'a margem anterior do terço lateral da clavícula',
  'AET-ENT-UL-CLAVICULAR_ANTERIOR_BORDER_MEDIAL_TWO_THIRDS': 'a margem anterior dos dois terços mediais da clavícula',
  'clavicular_posterior_border': 'a margem posterior da clavícula',
  'AET-ENT-UL-CLAVICULAR_POSTERIOR_BORDER': 'a margem posterior da clavícula',
  'conoid_tubercle': 'o tubérculo conoide',
  'AET-ENT-UL-CLAVICULAR_CONOID_TUBERCLE': 'o tubérculo conoide',
  'trapezoid_line': 'a linha trapezoide',
  'AET-ENT-UL-CLAVICULAR_TRAPEZOID_LINE': 'a linha trapezoide',
  'subclavian_groove': 'o sulco do músculo subclávio',
  'AET-ENT-UL-CLAVICULAR_SUBCLAVIAN_GROOVE': 'o sulco do músculo subclávio',
  'impression_for_costoclavicular_ligament': 'a impressão do ligamento costoclavicular',
  'AET-ENT-UL-CLAVICULAR_COSTOCLAVICULAR_IMPRESSION': 'a impressão do ligamento costoclavicular',

  // Joints & Ligaments
  'sternoclavicular_joint': 'a articulação esternoclavicular',
  'AET-ENT-UL-STERNOCLAVICULAR_JOINT': 'a articulação esternoclavicular',
  'sternoclavicular_articular_disc': 'o disco articular esternoclavicular',
  'AET-ENT-UL-STERNOCLAVICULAR_DISC': 'o disco articular esternoclavicular',
  'anterior_sternoclavicular_ligament': 'o ligamento esternoclavicular anterior',
  'AET-ENT-UL-ANTERIOR_STERNOCLAVICULAR_LIGAMENT': 'o ligamento esternoclavicular anterior',
  'posterior_sternoclavicular_ligament': 'o ligamento esternoclavicular posterior',
  'AET-ENT-UL-POSTERIOR_STERNOCLAVICULAR_LIGAMENT': 'o ligamento esternoclavicular posterior',
  'interclavicular_ligament': 'o ligamento interclavicular',
  'AET-ENT-UL-INTERCLAVICULAR_LIGAMENT': 'o ligamento interclavicular',
  'costoclavicular_ligament': 'o ligamento costoclavicular',
  'AET-ENT-UL-COSTOCLAVICULAR_LIGAMENT': 'o ligamento costoclavicular',

  'acromioclavicular_joint': 'a articulação acromioclavicular',
  'AET-ENT-UL-ACROMIOCLAVICULAR_JOINT': 'a articulação acromioclavicular',
  'superior_acromioclavicular_ligament': 'o ligamento acromioclavicular superior',
  'AET-ENT-UL-SUPERIOR_ACROMIOCLAVICULAR_LIGAMENT': 'o ligamento acromioclavicular superior',
  'inferior_acromioclavicular_ligament': 'o ligamento acromioclavicular inferior',
  'AET-ENT-UL-INFERIOR_ACROMIOCLAVICULAR_LIGAMENT': 'o ligamento acromioclavicular inferior',
  'acromioclavicular_articular_disc': 'o disco articular acromioclavicular',
  'AET-ENT-UL-ACROMIOCLAVICULAR_DISC': 'o disco articular acromioclavicular',

  'coracoclavicular_ligament_complex': 'o complexo ligamentar coracoclavicular',
  'AET-ENT-UL-CORACOCLAVICULAR_LIGAMENT_COMPLEX': 'o complexo ligamentar coracoclavicular',
  'coracoclavicular_ligament': 'o ligamento coracoclavicular',
  'conoid_ligament': 'o ligamento conoide',
  'AET-ENT-UL-CONOID_LIGAMENT': 'o ligamento conoide',
  'trapezoid_ligament': 'o ligamento trapezoide',
  'AET-ENT-UL-TRAPEZOID_LIGAMENT': 'o ligamento trapezoide',
  'coracoacromial_ligament': 'o ligamento coracoacromial',
  'AET-ENT-UL-CORACOACROMIAL_LIGAMENT': 'o ligamento coracoacromial',
  'superior_transverse_scapular_ligament': 'o ligamento transverso superior da escápula',

  // Topography
  'deltopectoral_groove': 'o sulco deltopeitoral',
  'AET-ENT-UL-DELTOPECTORAL_GROOVE': 'o sulco deltopeitoral',
  'cervicoaxillary_canal': 'o canal cervicoaxilar',
  'AET-ENT-UL-CERVICOAXILLARY_CANAL': 'o canal cervicoaxilar',
  'clavipectoral_fascia': 'a fáscia clavipeitoral',
  'AET-ENT-UL-CLAVIPECTORAL_FASCIA': 'a fáscia clavipeitoral',

  // Supported
  'scapulothoracic_interface': 'a interface escapulotorácica (sinsarcose)',
  'AET-ENT-SUPP-SCAPULOTHORACIC_INTERFACE': 'a interface escapulotorácica (sinsarcose)',
  'retroclavicular_space': 'o espaço retroclavicular',
  'AET-ENT-SUPP-RETROCLAVICULAR_SPACE': 'o espaço retroclavicular',

  // Reference structures
  'manubrium_sterni': 'o manúbrio do esterno',
  'AET-ENT-REF-MANUBRIUM_STERNI': 'o manúbrio do esterno',
  'first_costal_cartilage': 'a primeira cartilagem costal',
  'AET-ENT-REF-FIRST_COSTAL_CARTILAGE': 'a primeira cartilagem costal',
  'first_rib': 'a primeira costela',
  'AET-ENT-REF-FIRST_RIB': 'a primeira costela',
  'humerus': 'o úmero',
  'humeral_head': 'a cabeça do úmero',
  'deltoid': 'o músculo deltoide',
  'pectoralis_major': 'o músculo peitoral maior',
  'pectoralis_minor': 'o músculo peitoral menor',
  'subclavius': 'o músculo subclávio',
  'subscapularis': 'o músculo subescapular',
  'supraspinatus': 'o músculo supraespinoso',
  'infraspinatus': 'o músculo infraespinoso',
  'trapezius': 'o músculo trapézio',
  'sternocleidomastoid': 'o músculo esternocleidomastoideo',
  'serratus_anterior': 'o músculo serrátil anterior',
  'cephalic_vein': 'a veia cefálica',
  'axillary_artery': 'a artéria axilar',
  'axillary_vein': 'a veia axilar',
  'subclavian_artery': 'a artéria subclávia',
  'subclavian_vein': 'a veia subclávia',
  'brachial_plexus': 'o plexo braquial'
};

function ptName(key) {
  if (!key) return '';
  return PORTUGUESE_LABELS[key] || key.replace(/^AET-ENT-[A-Z]+-/, '').replace(/_/g, ' ');
}

// Convert a single canonical fact to a humanized Portuguese statement
function factToPortuguese(fact, answerUnit) {
  if (answerUnit && answerUnit.humanized_blocks && answerUnit.humanized_blocks.practical_block) {
    let blk = answerUnit.humanized_blocks.practical_block.trim();
    if (!blk.endsWith('.')) blk += '.';
    return blk;
  }

  if (fact.provenance_chain &&
    fact.provenance_chain.morgue_assertion &&
    fact.provenance_chain.morgue_assertion.original_teaching_statement) {
    let stmt = fact.provenance_chain.morgue_assertion.original_teaching_statement.trim();
    if (!stmt.endsWith('.')) stmt += '.';
    return stmt;
  }

  const sub = ptName(fact.subject_id);
  const targets = (fact.object_or_arguments && Array.isArray(fact.object_or_arguments))
    ? fact.object_or_arguments.map(ptName)
    : [];
  const target = targets.length > 0 ? targets.join(' e ') : '';
  const rel = (fact.relation || '').toLowerCase();

  let stmt = '';
  switch (rel) {
    case 'part_of':
      stmt = `${sub} integra ${target}.`;
      break;
    case 'type_of':
      stmt = `${sub} é classificado morfologicamente como ${target}.`;
      break;
    case 'originates_from':
      stmt = `${sub} origina-se em ${target}.`;
      break;
    case 'inserts_into':
    case 'inserts_on':
      stmt = `${sub} insere-se em ${target}.`;
      break;
    case 'articulates_with':
      stmt = `${sub} articula-se com ${target}.`;
      break;
    case 'has_surface':
      stmt = `${sub} apresenta ${target}.`;
      break;
    case 'has_fossa':
      stmt = `${sub} apresenta ${target}.`;
      break;
    case 'has_border':
      stmt = `${sub} é delimitado por ${target}.`;
      break;
    case 'has_angle':
      stmt = `${sub} possui ${target}.`;
      break;
    case 'has_landmark':
    case 'has_process':
    case 'has_structure':
      stmt = `${sub} apresenta como acidente anatômico ${target}.`;
      break;
    case 'attaches_ligament':
      stmt = `${sub} fixa ${target}.`;
      break;
    case 'bridges':
      stmt = `${sub} estabelece ponte com ${target}.`;
      break;
    case 'extends_between':
      stmt = `${sub} estende-se entre ${target}.`;
      break;
    case 'passes_through':
      stmt = `${sub} transita através de ${target}.`;
      break;
    case 'contains':
      stmt = `${sub} contém ${target}.`;
      break;
    case 'has_boundary':
      stmt = `${sub} tem como limite ${target}.`;
      break;
    case 'separates':
      stmt = `${sub} separa ${target}.`;
      break;
    case 'continues_as':
      stmt = `${sub} continua-se como ${target}.`;
      break;
    default:
      stmt = `${sub}: relação anatômica com ${target}.`;
  }

  // Capitalize first character
  return stmt.charAt(0).toUpperCase() + stmt.slice(1);
}

export function composeResponse({ plan, retrievalResult }) {
  // 1. Safe Failure strategies
  if (
    plan.response_strategy.startsWith('SAFE_FAILURE') ||
    plan.response_strategy === 'REFERENCE_ONLY_NO_EVIDENCE'
  ) {
    const failureRes = composeSafeFailure(plan);
    return {
      status: failureRes.status,
      response_depth: plan.response_depth,
      text: failureRes.text,
      citations: [failureRes.citation]
    };
  }

  // 2. Viewer Context strategy
  if (plan.response_strategy === 'VIEWER_CONTEXT_UNMAPPED') {
    const factPool = retrievalResult.matching_facts;
    const factMap = new Map(factPool.map(f => [f.canonical_fact_id, f]));
    const anchorStmts = plan.anchor_fact_ids.map(id => {
      const f = factMap.get(id);
      return f ? factToPortuguese(f, retrievalResult.answer_units_map?.get(id)) : '';
    }).filter(Boolean);

    const text = `${anchorStmts.join(' ')} No ambiente 3D do Aeternum Atlas, a estrutura encontra-se atualmente em status NOT_MAPPED (sem IDs de malha ou anotações tridimensionais vinculadas nesta versão).`;
    return {
      status: plan.evidence_state,
      response_depth: plan.response_depth,
      text: text,
      citations: ['Aeternum Atlas — Protocolo de Integridade Anatômica (AACM-1.0)']
    };
  }

  // Build fact map
  const factPool = retrievalResult.matching_facts;
  const factMap = new Map(factPool.map(f => [f.canonical_fact_id, f]));

  // Compose Anchor Statements
  const anchorStmts = plan.anchor_fact_ids.map(id => {
    const f = factMap.get(id);
    return f ? factToPortuguese(f, retrievalResult.answer_units_map?.get(id)) : '';
  }).filter(Boolean);

  // Compose Context Statements
  const contextStmts = plan.context_fact_ids.map(id => {
    const f = factMap.get(id);
    return f ? factToPortuguese(f, retrievalResult.answer_units_map?.get(id)) : '';
  }).filter(Boolean);

  let responseBlocks = [];

  // Anchor block
  if (anchorStmts.length > 0) {
    responseBlocks.push(anchorStmts.join(' '));
  }

  // Context block
  if (contextStmts.length > 0) {
    responseBlocks.push(contextStmts.join(' '));
  }

  // Practical memory block if applicable
  if (plan.practical_unit_ids.length > 0 && retrievalResult.practical_units) {
    const practicalMap = new Map(retrievalResult.practical_units.map(p => [p.canonical_practical_unit_id, p]));
    const pUnit = practicalMap.get(plan.practical_unit_ids[0]);
    if (pUnit && (pUnit.practical_orientation_statement || pUnit.institutional_statement)) {
      const stmt = pUnit.practical_orientation_statement || pUnit.institutional_statement;
      responseBlocks.push(`Orientação Prática: ${stmt}`);
    }
  }

  // Teaching Connection block if PROFESSOR depth
  if (plan.response_depth === 'PROFESSOR' && plan.teaching_connection_ids.length > 0 && retrievalResult.teaching_connections) {
    const tcMap = new Map(retrievalResult.teaching_connections.map(tc => [tc.canonical_teaching_connection_id, tc]));
    const tc = tcMap.get(plan.teaching_connection_ids[0]);
    if (tc) {
      if (tc.professor_response_template) {
        responseBlocks.push(`Comentário do Professor: ${tc.professor_response_template}`);
      } else if (tc.clinical_concept) {
        responseBlocks.push(`Conexão Funcional: ${tc.clinical_concept}.`);
      }
    }
  }

  // Supported entity note
  if (plan.response_strategy === 'SUPPORTED_ENTITY_NON_CANONICAL') {
    responseBlocks.push(`Nota: Esta estrutura é classificada como interface/espaço anatômico suportado (SUPPORTED), descrita funcionalmente em conjunto com o cíngulo peitoral.`);
  }

  const finalText = responseBlocks.join('\n\n');

  // Humanization sanity filter: assert no internal ID leaks
  const leakedIds = (finalText.match(/AET-CF-[A-Z0-9-]+/g) || []);
  if (leakedIds.length > 0) {
    throw new Error(`CRITICAL: Leaked internal canonical fact IDs in response: ${leakedIds.join(', ')}`);
  }

  return {
    status: plan.evidence_state,
    response_depth: plan.response_depth,
    text: finalText,
    citations: ['Latarjet & Liard — Anatomia Humana (5ª Edição)', 'Nielsen & Miller — Atlas de Anatomia Humana (2ª Edição)']
  };
}

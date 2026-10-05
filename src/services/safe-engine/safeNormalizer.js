/**
 * AETERNUM ATLAS — SAFE ENGINE
 * Module: safeNormalizer.js
 * Version: AETERNUM-SAFE-ENGINE-0.2.0-UPPER-LIMB-B1
 *
 * Deterministic text normalizer and alias resolver for Portuguese anatomical queries.
 * Maps user phrasing directly to canonical entity identifiers in Registry V2.1.
 */

export function normalizeQuery(queryText) {
  if (!queryText || typeof queryText !== 'string') {
    return '';
  }

  // 1. Convert to lower case
  let text = queryText.toLowerCase();

  // 2. Remove Portuguese diacritics / accents
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 3. Remove punctuation while keeping alphanumeric and whitespace
  text = text.replace(/[^\w\s-]/g, ' ');

  // 4. Normalize multiple whitespaces
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// Canonical alias dictionary for anatomical structures matching Registry V2.1 exactly
export const ANATOMICAL_ALIASES = {
  // === SCAPULA BASE & SUBENTITIES ===
  'escapula': 'AET-ENT-UL-SCAPULA',
  'omoplata': 'AET-ENT-UL-SCAPULA',
  'omoplato': 'AET-ENT-UL-SCAPULA',
  'cintura escapular': 'AET-ENT-UL-PECTORAL_GIRDLE',
  'cingulo peitoral': 'AET-ENT-UL-PECTORAL_GIRDLE',

  // Spine & Acromion & Subentities
  'espinha da escapula': 'AET-ENT-UL-SCAPULAR_SPINE',
  'espinha escapular': 'AET-ENT-UL-SCAPULAR_SPINE',
  'espinha': 'AET-ENT-UL-SCAPULAR_SPINE',
  'labio superior da espinha da escapula': 'AET-ENT-UL-SCAPULAR_SPINE_SUPERIOR_LIP',
  'labio superior da espinha': 'AET-ENT-UL-SCAPULAR_SPINE_SUPERIOR_LIP',
  'borda superior da espinha': 'AET-ENT-UL-SCAPULAR_SPINE_SUPERIOR_LIP',
  'labio inferior da espinha da escapula': 'AET-ENT-UL-SCAPULAR_SPINE_INFERIOR_LIP',
  'labio inferior da espinha': 'AET-ENT-UL-SCAPULAR_SPINE_INFERIOR_LIP',
  'acromio': 'AET-ENT-UL-SCAPULAR_ACROMION',
  'acromion': 'AET-ENT-UL-SCAPULAR_ACROMION',
  'apice do acromio': 'AET-ENT-UL-SCAPULAR_ACROMION',
  'face articular do acromio': 'AET-ENT-UL-SCAPULAR_ACROMION',
  'margem medial do acromio': 'AET-ENT-UL-SCAPULAR_ACROMION',
  'margem lateral do acromio': 'AET-ENT-UL-SCAPULAR_ACROMION',
  'face superior do acromio': 'AET-ENT-UL-SCAPULAR_ACROMION',

  // Coracoid Process & Subentities
  'processo coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS',
  'apofise coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS',
  'coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS',
  'apice do processo coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS_APEX',
  'apice do coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS_APEX',
  'ponta do processo coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS_APEX',
  'ponta do coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS_APEX',
  'base do processo coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS',
  'base do coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS',
  'porcao horizontal do processo coracoide': 'AET-ENT-UL-SCAPULAR_CORACOID_PROCESS',

  // Glenoid Cavity & Tubercles
  'cavidade glenoidal': 'AET-ENT-UL-SCAPULAR_GLENOID_CAVITY',
  'cavidade glenoide': 'AET-ENT-UL-SCAPULAR_GLENOID_CAVITY',
  'glenoide': 'AET-ENT-UL-SCAPULAR_GLENOID_CAVITY',
  'labio glenoidal': 'AET-ENT-UL-SCAPULAR_GLENOID_LABRUM',
  'labrum glenoidal': 'AET-ENT-UL-SCAPULAR_GLENOID_LABRUM',
  'labrum': 'AET-ENT-UL-SCAPULAR_GLENOID_LABRUM',
  'colo da escapula': 'AET-ENT-UL-SCAPULA',
  'colo': 'AET-ENT-UL-SCAPULA',
  'tuberculo supraglenoidal': 'AET-ENT-UL-SCAPULAR_SUPRAGLENOID_TUBERCLE',
  'tuberculos supraglenoidal': 'AET-ENT-UL-SCAPULAR_SUPRAGLENOID_TUBERCLE',
  'supraglenoidal': 'AET-ENT-UL-SCAPULAR_SUPRAGLENOID_TUBERCLE',
  'tuberculo infraglenoidal': 'AET-ENT-UL-SCAPULAR_INFRAGLENOID_TUBERCLE',
  'tuberculos infraglenoidal': 'AET-ENT-UL-SCAPULAR_INFRAGLENOID_TUBERCLE',
  'infraglenoidal': 'AET-ENT-UL-SCAPULAR_INFRAGLENOID_TUBERCLE',

  // Notches
  'incisura da escapula': 'AET-ENT-UL-SCAPULAR_SUPRASCAPULAR_NOTCH',
  'incisura escapular': 'AET-ENT-UL-SCAPULAR_SUPRASCAPULAR_NOTCH',
  'incisura': 'AET-ENT-UL-SCAPULAR_SUPRASCAPULAR_NOTCH',
  'incisura espinoglenoidal': 'AET-ENT-UL-SCAPULAR_SPINOGLENOID_NOTCH',
  'forame supraescapular': 'AET-ENT-UL-SCAPULAR_SUPRASCAPULAR_FORAMEN',

  // Fossae
  'fossa supraespinosa': 'AET-ENT-UL-SCAPULAR_SUPRASPINOUS_FOSSA',
  'fossa supraespinhosa': 'AET-ENT-UL-SCAPULAR_SUPRASPINOUS_FOSSA',
  'fossa supraespinhal': 'AET-ENT-UL-SCAPULAR_SUPRASPINOUS_FOSSA',
  'supraespinosa': 'AET-ENT-UL-SCAPULAR_SUPRASPINOUS_FOSSA',
  'fossa infraespinosa': 'AET-ENT-UL-SCAPULAR_INFRASPINOUS_FOSSA',
  'fossa infraespinhosa': 'AET-ENT-UL-SCAPULAR_INFRASPINOUS_FOSSA',
  'fossa infraespinhal': 'AET-ENT-UL-SCAPULAR_INFRASPINOUS_FOSSA',
  'infraespinosa': 'AET-ENT-UL-SCAPULAR_INFRASPINOUS_FOSSA',
  'fossa subescapular': 'AET-ENT-UL-SCAPULAR_SUBSCAPULAR_FOSSA',
  'subescapular': 'AET-ENT-UL-SCAPULAR_SUBSCAPULAR_FOSSA',

  // Surfaces & Borders & Angles & Subregions
  'face costal': 'AET-ENT-UL-SCAPULAR_COSTAL_SURFACE',
  'face anterior da escapula': 'AET-ENT-UL-SCAPULAR_COSTAL_SURFACE',
  'face posterior da escapula': 'AET-ENT-UL-SCAPULAR_POSTERIOR_SURFACE',
  'face dorsal da escapula': 'AET-ENT-UL-SCAPULAR_POSTERIOR_SURFACE',
  'margem medial da escapula': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER',
  'margem medial': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER',
  'borda medial da escapula': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER',
  'borda medial': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER',
  'borda vertebral': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER',
  'margem medial inferior a espinha': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER_INFERIOR_TO_SPINE',
  'margem medial abaixo da espinha': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER_INFERIOR_TO_SPINE',
  'borda medial inferior a espinha': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER_INFERIOR_TO_SPINE',
  'margem medial ao nivel da espinha': 'AET-ENT-UL-SCAPULAR_MEDIAL_BORDER_AT_SPINE_LEVEL',
  'margem lateral da escapula': 'AET-ENT-UL-SCAPULAR_LATERAL_BORDER',
  'margem lateral': 'AET-ENT-UL-SCAPULAR_LATERAL_BORDER',
  'borda lateral da escapula': 'AET-ENT-UL-SCAPULAR_LATERAL_BORDER',
  'borda lateral': 'AET-ENT-UL-SCAPULAR_LATERAL_BORDER',
  'borda axilar': 'AET-ENT-UL-SCAPULAR_LATERAL_BORDER',
  'margem superior da escapula': 'AET-ENT-UL-SCAPULAR_SUPERIOR_BORDER',
  'margem superior': 'AET-ENT-UL-SCAPULAR_SUPERIOR_BORDER',
  'borda superior': 'AET-ENT-UL-SCAPULAR_SUPERIOR_BORDER',
  'angulo inferior da escapula': 'AET-ENT-UL-SCAPULAR_INFERIOR_ANGLE',
  'angulo inferior': 'AET-ENT-UL-SCAPULAR_INFERIOR_ANGLE',
  'angulo superior da escapula': 'AET-ENT-UL-SCAPULAR_SUPERIOR_ANGLE',
  'angulo superior': 'AET-ENT-UL-SCAPULAR_SUPERIOR_ANGLE',
  'angulo lateral da escapula': 'AET-ENT-UL-SCAPULAR_LATERAL_ANGLE',
  'angulo lateral': 'AET-ENT-UL-SCAPULAR_LATERAL_ANGLE',

  // === CLAVICLE BASE & SUBENTITIES ===
  'clavicula': 'AET-ENT-UL-CLAVICLE',
  'corpo da clavicula': 'AET-ENT-UL-CLAVICULAR_SHAFT',
  'diafise da clavicula': 'AET-ENT-UL-CLAVICULAR_SHAFT',
  'diafise clavicular': 'AET-ENT-UL-CLAVICULAR_SHAFT',
  'extremidades esternais das duas claviculas': 'AET-ENT-UL-CLAVICULAR_STERNAL_END',
  'extremidades esternais da clavicula': 'AET-ENT-UL-CLAVICULAR_STERNAL_END',
  'extremidades esternais': 'AET-ENT-UL-CLAVICULAR_STERNAL_END',
  'extremidade esternal da clavicula': 'AET-ENT-UL-CLAVICULAR_STERNAL_END',
  'extremidade esternal': 'AET-ENT-UL-CLAVICULAR_STERNAL_END',
  'extremo esternal': 'AET-ENT-UL-CLAVICULAR_STERNAL_END',
  'ponta esternal': 'AET-ENT-UL-CLAVICULAR_STERNAL_END',
  'extremidade acromial da clavicula': 'AET-ENT-UL-CLAVICULAR_ACROMIAL_END',
  'extremidade acromial': 'AET-ENT-UL-CLAVICULAR_ACROMIAL_END',
  'extremo acromial': 'AET-ENT-UL-CLAVICULAR_ACROMIAL_END',
  'ponta acromial': 'AET-ENT-UL-CLAVICULAR_ACROMIAL_END',
  'face superior da clavicula': 'AET-ENT-UL-CLAVICULAR_SUPERIOR_SURFACE',
  'face inferior da clavicula': 'AET-ENT-UL-CLAVICULAR_INFERIOR_SURFACE',
  'margem anterior da clavicula': 'AET-ENT-UL-CLAVICULAR_SHAFT',
  'borda anterior da clavicula': 'AET-ENT-UL-CLAVICULAR_SHAFT',
  'margem posterior da clavicula': 'AET-ENT-UL-CLAVICULAR_SHAFT',
  'borda posterior da clavicula': 'AET-ENT-UL-CLAVICULAR_SHAFT',
  'tuberculo conoide': 'AET-ENT-UL-CONOID_TUBERCLE',
  'tuberculo conoideo': 'AET-ENT-UL-CONOID_TUBERCLE',
  'linha trapezoide': 'AET-ENT-UL-TRAPEZOID_LINE',
  'linha trapezoida': 'AET-ENT-UL-TRAPEZOID_LINE',
  'sulco do musculo subclavio': 'AET-ENT-UL-SUBCLAVIAN_GROOVE',
  'sulco subclavio': 'AET-ENT-UL-SUBCLAVIAN_GROOVE',
  'impressao do ligamento costoclavicular': 'AET-ENT-UL-COSTOCLAVICULAR_LIGAMENT_IMPRESSION',
  'tuberosidade costal da clavicula': 'AET-ENT-UL-COSTOCLAVICULAR_LIGAMENT_IMPRESSION',

  // Clavicle Subentities
  'borda anterior do terco lateral da clavicula': 'AET-ENT-UL-CLAVICULAR_ANTERIOR_BORDER_LATERAL_THIRD',
  'margem anterior do terco lateral da clavicula': 'AET-ENT-UL-CLAVICULAR_ANTERIOR_BORDER_LATERAL_THIRD',
  'margem anterior no terco lateral': 'AET-ENT-UL-CLAVICULAR_ANTERIOR_BORDER_LATERAL_THIRD',
  'borda anterior do terco medial da clavicula': 'AET-ENT-UL-CLAVICULAR_ANTERIOR_BORDER_MEDIAL_TWO_THIRDS',
  'borda anterior nos dois tercos mediais': 'AET-ENT-UL-CLAVICULAR_ANTERIOR_BORDER_MEDIAL_TWO_THIRDS',
  'margem posterior do terco lateral da clavicula': 'AET-ENT-UL-CLAVICULAR_POSTERIOR_BORDER_LATERAL_THIRD',
  'face superior no terco lateral da clavicula': 'AET-ENT-UL-CLAVICULAR_SUPERIOR_SURFACE_LATERAL_ANTERIOR',
  'face superior nos dois tercos mediais': 'AET-ENT-UL-CLAVICULAR_SUPERIOR_SURFACE_MEDIAL_ANTERIOR',
  'epifise da extremidade esternal da clavicula': 'AET-ENT-UL-CLAVICULAR_STERNAL_END_EPIPHYSIS',
  'epifise esternal da clavicula': 'AET-ENT-UL-CLAVICULAR_STERNAL_END_EPIPHYSIS',
  'face articular esternal da clavicula': 'AET-ENT-UL-CLAVICULAR_STERNAL_ARTICULAR_SURFACE',
  'face articular acromial da clavicula': 'AET-ENT-UL-CLAVICULAR_ACROMIAL_ARTICULAR_SURFACE',

  // === STERNOCLAVICULAR JOINT ===
  'articulacao esternoclavicular': 'AET-ENT-UL-STERNOCLAVICULAR_JOINT',
  'juntura esternoclavicular': 'AET-ENT-UL-STERNOCLAVICULAR_JOINT',
  'disco articular esternoclavicular': 'AET-ENT-UL-STERNOCLAVICULAR_ARTICULAR_DISC',
  'disco da articulacao esternoclavicular': 'AET-ENT-UL-STERNOCLAVICULAR_ARTICULAR_DISC',
  'menisco esternoclavicular': 'AET-ENT-UL-STERNOCLAVICULAR_ARTICULAR_DISC',
  'ligamento esternoclavicular anterior': 'AET-ENT-UL-ANTERIOR_STERNOCLAVICULAR_LIGAMENT',
  'ligamento esternoclavicular posterior': 'AET-ENT-UL-POSTERIOR_STERNOCLAVICULAR_LIGAMENT',
  'ligamento interclavicular': 'AET-ENT-UL-INTERCLAVICULAR_LIGAMENT',
  'interclavicular': 'AET-ENT-UL-INTERCLAVICULAR_LIGAMENT',
  'ligamento costoclavicular': 'AET-ENT-UL-COSTOCLAVICULAR_LIGAMENT',

  // === ACROMIOCLAVICULAR JOINT ===
  'articulacao acromioclavicular': 'AET-ENT-UL-ACROMIOCLAVICULAR_JOINT',
  'juntura acromioclavicular': 'AET-ENT-UL-ACROMIOCLAVICULAR_JOINT',
  'ligamento acromioclavicular superior': 'AET-ENT-UL-ACROMIOCLAVICULAR_LIGAMENT',
  'ligamento acromioclavicular': 'AET-ENT-UL-ACROMIOCLAVICULAR_LIGAMENT',
  'disco articular acromioclavicular': 'AET-ENT-UL-ACROMIOCLAVICULAR_ARTICULAR_DISC',

  // === CORACOCLAVICULAR COMPLEX ===
  'complexo ligamentar coracoclavicular': 'AET-ENT-UL-CORACOCLAVICULAR_LIGAMENT_COMPLEX',
  'complexo coracoclavicular': 'AET-ENT-UL-CORACOCLAVICULAR_LIGAMENT_COMPLEX',
  'ligamento coracoclavicular': 'AET-ENT-UL-CORACOCLAVICULAR_LIGAMENT_COMPLEX',
  'ligamento conoide': 'AET-ENT-UL-CONOID_LIGAMENT',
  'ligamento conoideo': 'AET-ENT-UL-CONOID_LIGAMENT',
  'ligamento trapezoide': 'AET-ENT-UL-TRAPEZOID_LIGAMENT',
  'ligamento trapezoideo': 'AET-ENT-UL-TRAPEZOID_LIGAMENT',

  // === TOPOGRAPHIC REGIONS & FASCIA ===
  'sulco deltopeitoral': 'AET-ENT-UL-DELTOPECTORAL_GROOVE',
  'trigono deltopeitoral': 'AET-ENT-UL-DELTOPECTORAL_GROOVE',
  'canal cervicoaxilar': 'AET-ENT-UL-CERVICOAXILLARY_CANAL',
  'fascia clavipeitoral': 'AET-ENT-REF-CLAVIPECTORAL_FASCIA',

  // === SUPPORTED ENTITIES ===
  'interface escapulotoracica': 'AET-ENT-SUPP-SCAPULOTHORACIC_INTERFACE',
  'articulacao escapulotoracica': 'AET-ENT-SUPP-SCAPULOTHORACIC_INTERFACE',
  'sinsarcose escapulotoracica': 'AET-ENT-SUPP-SCAPULOTHORACIC_INTERFACE',
  'espaco retroclavicular': 'AET-ENT-SUPP-RETROCLAVICULAR_SPACE',

  // === ADJACENT / REFERENCE ENTITIES ===
  'manubrio do esterno': 'AET-ENT-REF-MANUBRIUM_STERNI',
  'manubrio': 'AET-ENT-REF-MANUBRIUM_STERNI',
  'primeira costela': 'AET-ENT-REF-FIRST_RIB',
  '1a costela': 'AET-ENT-REF-FIRST_RIB',
  'primeira cartilagem costal': 'AET-ENT-REF-FIRST_COSTAL_CARTILAGE',
  '1a cartilagem costal': 'AET-ENT-REF-FIRST_COSTAL_CARTILAGE',
  'umero': 'AET-ENT-REF-HUMERUS',
  'musculo subescapular': 'AET-ENT-REF-SUBSCAPULARIS',
  'supraespinoso': 'AET-ENT-REF-SUPRASPINATUS',
  'supraespinhoso': 'AET-ENT-REF-SUPRASPINATUS',
  'musculo supraespinoso': 'AET-ENT-REF-SUPRASPINATUS',
  'infraespinoso': 'AET-ENT-REF-INFRASPINATUS',
  'infraespinhoso': 'AET-ENT-REF-INFRASPINATUS',
  'musculo infraespinoso': 'AET-ENT-REF-INFRASPINATUS',
  'serratil anterior': 'AET-ENT-REF-SERRATUS_ANTERIOR',
  'musculo serratil anterior': 'AET-ENT-REF-SERRATUS_ANTERIOR',
  'trapezio': 'AET-ENT-REF-TRAPEZIUS',
  'musculo trapezio': 'AET-ENT-REF-TRAPEZIUS',
  'deltoide': 'AET-ENT-REF-DELTOID',
  'musculo deltoide': 'AET-ENT-REF-DELTOID',
  'peitoral maior': 'AET-ENT-REF-PECTORALIS_MAJOR',
  'musculo peitoral maior': 'AET-ENT-REF-PECTORALIS_MAJOR',
  'peitoral menor': 'AET-ENT-REF-PECTORALIS_MINOR',
  'musculo peitoral menor': 'AET-ENT-REF-PECTORALIS_MINOR',
  'subclavio': 'AET-ENT-REF-SUBCLAVIUS',
  'musculo subclavio': 'AET-ENT-REF-SUBCLAVIUS',
  'esternocleidomastoideo': 'AET-ENT-REF-STERNOCLEIDOMASTOID',
  'esternocleido': 'AET-ENT-REF-STERNOCLEIDOMASTOID',
  'coracobraquial': 'AET-ENT-REF-CORACOBRACHIALIS',
  'musculo coracobraquial': 'AET-ENT-REF-CORACOBRACHIALIS',
  'cabeca curta do biceps': 'AET-ENT-REF-BICEPS_BRACHII_SHORT_HEAD',
  'cabeca longa do biceps': 'AET-ENT-REF-BICEPS_BRACHII_LONG_HEAD',
  'cabeca longa do triceps': 'AET-ENT-REF-TRICEPS_BRACHII_LONG_HEAD',
  'levantador da escapula': 'AET-ENT-REF-LEVATOR_SCAPULAE',
  'romboides maior': 'AET-ENT-REF-RHOMBOID_MAJOR',
  'romboide maior': 'AET-ENT-REF-RHOMBOID_MAJOR',
  'romboides menor': 'AET-ENT-REF-RHOMBOID_MINOR',
  'romboide menor': 'AET-ENT-REF-RHOMBOID_MINOR',
  'redondo maior': 'AET-ENT-REF-TERES_MAJOR',
  'redondo menor': 'AET-ENT-REF-TERES_MINOR',
  'veia cefalica': 'AET-ENT-REF-CEPHALIC_VEIN',
  'articulacao glenoumeral': 'AET-ENT-REF-GLENOHUMERAL_JOINT',
  'ligamento coracoacromial': 'AET-ENT-UL-CORACOACROMIAL_LIGAMENT',
  'ligamento transverso superior da escapula': 'AET-ENT-UL-SUPERIOR_TRANSVERSE_SCAPULAR_LIGAMENT'
};

// Known out-of-scope entities to trigger safe failure cleanly
export const OUT_OF_SCOPE_ENTITIES = [
  'femur', 'tibia', 'fibula', 'patela', 'radio', 'ulna', 'pelve', 'coxal',
  'cranio', 'mandibula', 'maxila', 'rim', 'figado', 'coracao', 'pulmao',
  'encefalo', 'cerebro', 'estomago', 'pancreas', 'baco', 'nervo facial',
  'nervo ciatico', 'nervo trigemeo', 'nervo femoral', 'carpo', 'metacarpo',
  'falanges', 'astragalo', 'calcaneo'
];
